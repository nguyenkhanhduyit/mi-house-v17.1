// Mock Upstash transport only. Exercises the real Vercel entrypoint and the
// same API logic as local development without touching an external account.
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
process.env.CMS_REQUIRE_REDIS='true';
process.env.UPSTASH_REDIS_REST_URL='https://mock.upstash.local';
process.env.UPSTASH_REDIS_REST_TOKEN='mock-rest-token';
process.env.CMS_REDIS_PREFIX='mi-house:test-serverless';
process.env.ADMIN_USERNAME='admin';
process.env.ADMIN_PASSWORD='test-only-secure-secret';
process.env.CLOUDINARY_CLOUD_NAME='mock';process.env.CLOUDINARY_API_KEY='key';process.env.CLOUDINARY_API_SECRET='secret';
const data=new Map();const expire=new Map();const now=()=>Date.now();
function get(key){if(expire.has(key)&&expire.get(key)<now()){data.delete(key);expire.delete(key)}return data.get(key)??null}
function put(key,v,ex=0){data.set(key,v);if(ex)expire.set(key,now()+ex*1000)}
let uploadVerified=0,requests=0;
const origFetch=globalThis.fetch;
globalThis.fetch=async (input,init={})=>{
 const url=String(input);
 if(url.startsWith('https://mock.upstash.local')){
  assert.equal(init.headers.Authorization,'Bearer mock-rest-token');
  requests++;
  const [cmd,...args]=JSON.parse(init.body);
  let result;
  if(cmd==='EVAL'){
   const [script,nkeys,...all]=args,keys=all.slice(0,nkeys),params=all.slice(nkeys);
   if(script.startsWith("if redis.call('EXISTS'")){
    result=get(keys[0])===null?1:0;
    if(result){put(keys[0],params[0]);put(keys[1],'0')}
   }else if(script.startsWith("return {redis.call('GET'"))result=[get(keys[0]),get(keys[1])];
   else if(script.startsWith("if tostring(redis.call('GET'")){
    if(String(get(keys[1]))!==String(params[0]))result=0;
    else {put(keys[0],params[1]);put(keys[1],String(Number(get(keys[1]))+1));result=1}
   }else if(script.startsWith("local n=redis.call('INCR'")){
    result=Number(get(keys[0])||0)+1;put(keys[0],String(result),900);
   }else if(script.startsWith("redis.call('HINCRBY'"))result=1;
   else throw Error('Unexpected EVAL '+script.slice(0,45));
  }else if(cmd==='SET'){
   const [k,v,...options]=args;
   if(options.includes('NX')&&get(k)!==null)result=null;
   else {let ex=0;const idx=options.findIndex(v=>v==='EX');if(idx>=0)ex=Number(options[idx+1]);put(k,v,ex);result='OK'}
  }else if(cmd==='GET')result=get(args[0]);
  else if(cmd==='DEL'){result=Number(get(args[0])!==null);data.delete(args[0]);}
  else if(cmd==='HGETALL')result=[];
  else throw Error('Unexpected redis command '+cmd);
  return new Response(JSON.stringify({result}),{status:200,headers:{'content-type':'application/json'}});
 }
 if(url.startsWith('https://api.cloudinary.com')){
  if(/\/resources\/(image|video)\/upload\/mi-house\//.test(url)){
   uploadVerified++;
   const isVideo=url.includes('/video/');const id=url.split('/resources/')[1].split('/upload/')[1];
   return new Response(JSON.stringify({public_id:decodeURIComponent(id),resource_type:isVideo?'video':'image',type:'upload',secure_url:`https://res.cloudinary.com/mock/${isVideo?'video':'image'}/upload/${id}`,width:1920,height:1080}),{status:200});
  }
  if(url.includes('/resources/'))return new Response(JSON.stringify({resources:[],next_cursor:null}),{status:200});
  if(url.endsWith('/destroy'))return new Response(JSON.stringify({result:'ok'}),{status:200});
  throw Error('Unexpected cloudinary endpoint '+url);
 }
 return origFetch(input,init);
};
const {default:vercel}=await import('../api/index.js');
const server=http.createServer((req,res)=>void vercel(req,res));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let cookie='',passes=0;
async function call(path,method='GET',payload){
 let original=path.replace(/^\/api\//,'');const [route,qs='']=original.split('?');
 const params=new URLSearchParams(qs);params.set('__cms_path',route);
 const hdr={'X-CMS-Request':'1'};if(cookie)hdr.cookie=cookie;
 if(payload!==undefined)hdr['Content-Type']='application/json';
 const r=await origFetch(base+'/api/index?'+params.toString(),{method,headers:hdr,body:payload!==undefined?JSON.stringify(payload):undefined});
 const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];
 let body=await r.json();return {status:r.status,body};
}
function pass(ok,text){assert.ok(ok,text);passes++;}
try{
 let r=await call('/api/health');pass(r.status===200,'health via rewritten Vercel handler');
 r=await call('/api/public');pass(r.status===200&&r.body.collections.nail.length===9,'seeding original CMS atomically into Redis');
 pass([...data.keys()].some(k=>k.endsWith(':cms')),'CMS persisted to Redis');
 r=await call('/api/admin/state');pass(r.status===401,'unauthenticated state denied');
 r=await call('/api/admin/login','POST',{username:'admin',password:'bad'});pass(r.status===401,'incorrect login');
 r=await call('/api/admin/login','POST',{username:'admin',password:'test-only-secure-secret'});pass(r.status===200&&cookie.startsWith('mh_admin='),'session cookie');
 pass([...data.keys()].some(k=>k.includes(':session:')),'session stored in Redis');
 r=await call('/api/admin/state');pass(r.status===200,'state GET authenticated');
 const revision0=r.body.revision;const initial=r.body;
 let a=structuredClone(initial),b=structuredClone(initial);a.settings.brand='Upstash CMS update';b.settings.brand='Overwritten by other editor';
 r=await call('/api/admin/state','PUT',a);pass(r.status===200&&r.body.revision===revision0+1,'state saved with CAS');
 r=await call('/api/admin/state','PUT',b);pass(r.status===409,'stale save returns conflict');
 r=await call('/api/public');pass(r.body.settings.brand==='Upstash CMS update','public reads persisted Redis state');
 const testName='direct.mp4';
 r=await call('/api/admin/media-sign','POST',{filename:testName,size:12500000});pass(r.status===200&&r.body.publicId.startsWith('mi-house/')&&r.body.signature.length===40,'authenticated direct video upload signature');
 const signed=r.body;
 r=await call('/api/admin/media-register','POST',{publicId:signed.publicId,resourceType:'video',filename:testName});pass(r.status===200&&r.body.resourceType==='video'&&uploadVerified===1,'Cloudinary verified before registration');
 const media=r.body;
 r=await call('/api/admin/media-register','POST',{publicId:signed.publicId,resourceType:'video',filename:testName});pass(r.status===200&&r.body.id===media.id,'duplicate registration idempotent');
 r=await call('/api/admin/media-sign','POST',{filename:'malware.exe',size:100});pass(r.status===415,'invalid file rejected');
 r=await call('/api/admin/media-sign','POST',{filename:'photo.png',size:200000000});pass(r.status===413,'oversize file rejected');
 r=await call('/api/admin/logout','POST');pass(r.status===200,'logout');
 r=await call('/api/admin/state');pass(r.status===401,'logout invalidates shared session');
 r=await call('/api/public');pass(r.status===200&&r.body.settings.brand==='Upstash CMS update','persisted after session logout');
 pass(requests>20,'Upstash REST calls used for CMS and session');
 console.log(`VERCEL+REDIS CONTRACT TEST: ${passes}/${passes} PASS (${requests} REST calls, ${uploadVerified} Cloudinary verification)`);
}catch(e){console.error('VERCEL+REDIS CONTRACT TEST FAILED:',e);process.exitCode=1}
finally{server.close();globalThis.fetch=origFetch}
