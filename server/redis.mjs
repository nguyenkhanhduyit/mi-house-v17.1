// Upstash REST transport. Credentials exist only on the server.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class StorageConflict extends Error {
  constructor(){super('Dữ liệu thay đổi từ phiên khác. Vui lòng tải lại trước khi lưu.');this.status=409;}
}
export class StorageUnavailable extends Error {
  constructor(message){super(message);this.status=503;}
}

// Resolve Vercel Marketplace and Upstash Console variable pairs safely.
// A stale placeholder must not override a valid KV_REST_API_* integration.
const readEnv = value => {
 const text = typeof value === 'string' ? value.trim() : '';
 return ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")))
  ? text.slice(1, -1).trim() : text;
};
const isPlaceholder = value => /YOUR[_-]?DATABASE|REPLACE[_-]?WITH|PASTE[_-]?HERE|YOUR[_-]?TOKEN|<[^>]+>|\.\.\./i.test(value);
function normalizeRedisUrl(value){
 if (!value || isPlaceholder(value)) return '';
 try {
  const parsed = new URL(value);
  // REST is HTTPS, not the rediss:// TCP endpoint; disallow embedded credentials.
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') return '';
  return parsed.origin;
 } catch { return ''; }
}
export function resolveRedisEnvironment(env = process.env){
 const pairs = [
  {label:'UPSTASH_REDIS_REST_*', url:readEnv(env.UPSTASH_REDIS_REST_URL), token:readEnv(env.UPSTASH_REDIS_REST_TOKEN)},
  {label:'KV_REST_API_*', url:readEnv(env.KV_REST_API_URL), token:readEnv(env.KV_REST_API_TOKEN)}
 ];
 const ready = pairs.map(p => ({...p,url:normalizeRedisUrl(p.url),validToken:Boolean(p.token && !isPlaceholder(p.token))})).filter(p=>p.url && p.validToken);
 if(ready.length === 2 && ready[0].url !== ready[1].url){
  return {url:'',token:'',source:'',error:'UPSTASH_REDIS_REST_* và KV_REST_API_* đang trỏ tới hai Redis khác nhau. Xóa cặp cũ trên Vercel để tránh ghi nhầm dữ liệu.'};
 }
 if(ready.length){
  return {url:ready[0].url,token:ready[0].token,source:ready[0].label,error:null,
   fallback:pairs[0].url && ready[0].label === 'KV_REST_API_*'};
 }
 const present=pairs.some(p=>p.url||p.token);
 return {url:'',token:'',source:'',error:present
  ? 'URL/token Upstash REST chưa hợp lệ. Không dùng URL mẫu, rediss://, token read-only hoặc giá trị thiếu; kiểm tra Environment Variables trên Vercel.'
  : 'Chưa cấu hình Redis REST trên Vercel. Cần một cặp UPSTASH_REDIS_REST_URL/TOKEN hoặc KV_REST_API_URL/TOKEN.'};
}
function networkErrorCode(error){
 const queue=[error,error?.cause];
 if(error?.cause?.errors && Array.isArray(error.cause.errors))queue.push(...error.cause.errors);
 for(const item of queue){
  const code=String(item?.code||'');
  if(/^[A-Z_]{3,32}$/.test(code))return code;
 }
 if(error?.name==='TimeoutError'||error?.name==='AbortError')return 'TIMEOUT';
 return 'NETWORK';
}
export function createPersistence({dbPath,statsPath,seed}){
 const selected=resolveRedisEnvironment();
 const {url,token}=selected;
 const remote=Boolean(url&&token);
 // Never silently downgrade to local filesystem in a deployment.
 const configError=(!remote && (process.env.VERCEL || process.env.CMS_REQUIRE_REDIS==='true' || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)) ? selected.error : null;
 if(selected.fallback)console.warn('[cms redis] Bỏ qua cặp UPSTASH_REDIS_REST_* chưa hợp lệ; dùng KV_REST_API_* đã cấu hình.');
 // Even with the same Upstash database, production and preview never share state.
 const prefix=(process.env.CMS_REDIS_PREFIX||'mi-house')+':'+(process.env.VERCEL_ENV||'local');
 if(!/^[\w:.-]{1,90}$/.test(prefix))throw new Error('CMS_REDIS_PREFIX không hợp lệ');
 const stateKey=prefix+':cms',versionKey=prefix+':cms-version';
 const statsLocal={days:{}};
 try{Object.assign(statsLocal,JSON.parse(fs.readFileSync(statsPath,'utf8')))}catch{}
 const localSessions=new Map();const localFails=new Map();const localViews=new Map();
 let localVersion=0;
 async function command(...parts){
  if(!remote)throw new StorageUnavailable('Redis chưa được cấu hình');
  const r=await fetch(url ,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(parts),signal:AbortSignal.timeout(12000)}).catch(e=>{
   throw new StorageUnavailable(`Không kết nối được Redis REST (${networkErrorCode(e)}, ${selected.source}). Kiểm tra endpoint HTTPS, DNS, region và kết nối Upstash trên Vercel.`);
  });
  const obj=await r.json().catch(()=>null);
  if(!r.ok||!obj||obj.error)throw new StorageUnavailable('Redis trả lỗi: '+(obj?.error||r.status));
  return obj.result;
 }
 async function evalLua(script,keys,args){return command('EVAL',script,keys.length,...keys,...args)}
 const initializeScript=`if redis.call('EXISTS', KEYS[1]) == 0 then redis.call('SET', KEYS[1], ARGV[1]); redis.call('SET', KEYS[2], 0); return 1 end return 0`;
 const readScript=`return {redis.call('GET',KEYS[1]),redis.call('GET',KEYS[2]) or '0'}`;
 const casScript=`if tostring(redis.call('GET',KEYS[2]) or '0') ~= tostring(ARGV[1]) then return 0 end redis.call('SET',KEYS[1],ARGV[2]);redis.call('INCR',KEYS[2]);return 1`;
 async function load(){
  if(configError)throw new StorageUnavailable(configError);
  if(remote){
   await evalLua(initializeScript,[stateKey,versionKey],[JSON.stringify(seed)]);
   const result=await evalLua(readScript,[stateKey,versionKey],[]);
   if(!Array.isArray(result)||!result[0])throw new StorageUnavailable('Không đọc được CMS từ Redis');
   return {data:JSON.parse(result[0]),version:Number(result[1]||0)};
  }
  let data;try{data=JSON.parse(fs.readFileSync(dbPath,'utf8'))}catch{data=structuredClone(seed)}
  return {data,version:localVersion};
 }
 async function save(data,version){
  if(remote){
   const ok=await evalLua(casScript,[stateKey,versionKey],[String(version),JSON.stringify(data)]);
   if(ok!==1)throw new StorageConflict();
   return version+1;
  }
  // In local development, the single Node API process owns this file.
  if(version!==localVersion)throw new StorageConflict();
  fs.mkdirSync(path.dirname(dbPath),{recursive:true});
  const tmp=dbPath+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,dbPath);
  return ++localVersion;
 }
 const hash=v=>crypto.createHash('sha256').update(String(v)).digest('hex');
 async function createSession(tokenValue,seconds=8*3600){
  if(remote)return command('SET',prefix+':session:'+hash(tokenValue),'1','EX',seconds);
  localSessions.set(hash(tokenValue),Date.now()+seconds*1000);
 }
 async function hasSession(tokenValue){
  if(!tokenValue)return false;
  const key=hash(tokenValue);
  if(remote)return (await command('GET',prefix+':session:'+key))==='1';
  const exp=localSessions.get(key);if(!exp||exp<Date.now()){localSessions.delete(key);return false}return true;
 }
 async function deleteSession(tokenValue){
  if(!tokenValue)return;
  if(remote)return command('DEL',prefix+':session:'+hash(tokenValue));
  localSessions.delete(hash(tokenValue));
 }
 async function getFailure(ip){
  const key=hash(ip);
  if(remote)return Number(await command('GET',prefix+':login-fail:'+key)||0);
  const rec=localFails.get(key);return rec&&rec.exp>Date.now()?rec.n:0;
 }
 async function addFailure(ip){
  const key=hash(ip);
  if(remote){ // 15-minute fixed window, with TTL enforced atomically.
   return Number(await evalLua("local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],900) end;return n",[prefix+':login-fail:'+key],[]));
  }
  const prev=localFails.get(key);localFails.set(key,{n:(prev?.exp>Date.now()?prev.n:0)+1,exp:Date.now()+900000});
 }
 async function clearFailure(ip){const key=hash(ip);if(remote)return command('DEL',prefix+':login-fail:'+key);localFails.delete(key)}
 const cleanLabel=v=>String(v||'Unknown').slice(0,100);
 async function recordView({ip,ua,route,day,browser,device}){
  const hashKey=hash(ip+'|'+ua+'|'+route),todayKey=prefix+':visits:'+day;
  if(remote){
   const fresh=await command('SET',prefix+':view-window:'+hashKey,'1','NX','EX',30);
   if(fresh!=='OK')return false;
   await evalLua(`redis.call('HINCRBY',KEYS[1],'total',1);redis.call('HINCRBY',KEYS[1],ARGV[1],1);redis.call('HINCRBY',KEYS[1],ARGV[2],1);redis.call('HINCRBY',KEYS[1],ARGV[3],1);redis.call('EXPIRE',KEYS[1],34560000);return 1`,[todayKey],['ip:'+hash(ip),'browser:'+cleanLabel(browser),'device:'+cleanLabel(device)]);
   return true;
  }
  if(Date.now()-(localViews.get(hashKey)||0)<30000)return false;
  localViews.set(hashKey,Date.now());
  const item=statsLocal.days[day]||{total:0,ips:{},browsers:{},devices:{}};
  item.total++;item.ips[ip]=(item.ips[ip]||0)+1;item.browsers[browser]=(item.browsers[browser]||0)+1;item.devices[device]=(item.devices[device]||0)+1;
  statsLocal.days[day]=item;
  fs.mkdirSync(path.dirname(statsPath),{recursive:true});const tmp=statsPath+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,JSON.stringify(statsLocal));fs.renameSync(tmp,statsPath);
  return true;
 }
 async function monthSummary(month,year){
  const iso=`${year}-${String(month).padStart(2,'0')}`;
  const days=Array.from({length:new Date(year,month,0).getDate()},(_,i)=>({day:i+1,count:0}));
  const ips={},browsers={},devices={};let total=0;
  for(let i=0;i<days.length;i++){
   const day=iso+'-'+String(i+1).padStart(2,'0');
   let rec;
   if(remote){
    const raw=await command('HGETALL',prefix+':visits:'+day);
    rec={total:0,ips:{},browsers:{},devices:{}};
    const entries=Array.isArray(raw)?Array.from({length:Math.floor(raw.length/2)},(_,idx)=>[raw[idx*2],raw[idx*2+1]]):Object.entries(raw||{});
    for(const [k,v] of entries){const n=Number(v||0);if(k==='total')rec.total=n;else if(k.startsWith('ip:'))rec.ips[k.slice(3)]=n;else if(k.startsWith('browser:'))rec.browsers[k.slice(8)]=n;else if(k.startsWith('device:'))rec.devices[k.slice(7)]=n;}
   }else rec=statsLocal.days[day]||{total:0,ips:{},browsers:{},devices:{}};
   days[i].count=Number(rec.total||0);total+=days[i].count;
   for(const [k,d] of [['ips',ips],['browsers',browsers],['devices',devices]])for(const [label,count] of Object.entries(rec[k]||{}))d[label]=(d[label]||0)+Number(count);
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([label,count])=>({label,count,percent:total?Math.round(count*10000/total)/100:0}));
  return {month,year,total,days,ips:top(ips).slice(0,10),browsers:top(browsers),devices:top(devices),updatedAt:new Date().toISOString(),source:remote?'upstash-cms':'first-party-cms',retentionDays:400};
 }
 return {remote,load,save,command,createSession,hasSession,deleteSession,getFailure,addFailure,clearFailure,recordView,monthSummary};
}
