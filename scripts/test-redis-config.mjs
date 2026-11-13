import assert from 'node:assert/strict';
import {resolveRedisEnvironment,createPersistence,StorageUnavailable} from '../server/redis.mjs';
let count = 0;
const check = (cond,msg)=>{assert.ok(cond,msg);count++;};
const kv = {KV_REST_API_URL:'https://correct.upstash.io',KV_REST_API_TOKEN:'valid-rest-token'};
{
 const c=resolveRedisEnvironment({...kv,UPSTASH_REDIS_REST_URL:'https://YOUR-DATABASE.upstash.io',UPSTASH_REDIS_REST_TOKEN:'REPLACE_WITH_REDIS_REST_TOKEN'});
 check(c.source==='KV_REST_API_*' && c.url===kv.KV_REST_API_URL,'prefer usable KV over placeholder UPSTASH');
 check(c.fallback===true,'warn on old placeholder');
}
{
 const c=resolveRedisEnvironment({...kv,UPSTASH_REDIS_REST_URL:'https://other.upstash.io',UPSTASH_REDIS_REST_TOKEN:'another-valid-token'});
 check(!c.url && /hai Redis khác nhau/.test(c.error),'conflicting databases fail closed');
}
{
 const c=resolveRedisEnvironment({UPSTASH_REDIS_REST_URL:'"https://valid.upstash.io/"',UPSTASH_REDIS_REST_TOKEN:'"valid-token"'});
 check(c.url==='https://valid.upstash.io' && c.token==='valid-token','strip quotes from environment');
}
{
 const c=resolveRedisEnvironment({KV_REST_API_URL:'rediss://wrong:6379',KV_REST_API_TOKEN:'token'});
 check(!c.url && /chưa hợp lệ/.test(c.error),'refuse rediss:// TCP URL as REST endpoint');
}
{
 const c=resolveRedisEnvironment({UPSTASH_REDIS_REST_URL:'https://mydb.upstash.io',UPSTASH_REDIS_REST_TOKEN:'token',KV_REST_API_URL:'https://mydb.upstash.io',KV_REST_API_TOKEN:'token'});
 check(c.source==='UPSTASH_REDIS_REST_*','valid same endpoint works');
}
{
 const c=resolveRedisEnvironment({});
 check(!c.url && /Chưa cấu hình/.test(c.error),'missing env detected');
}
{
 const c=resolveRedisEnvironment({KV_REST_API_URL:'https://url.upstash.io/path?query=secret',KV_REST_API_TOKEN:'token'});
 check(!c.url,'reject query/REST path to prevent accidental exposure');
}
{
 const snapshot={...process.env};
 try{
  for(const k of ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN','CMS_REQUIRE_REDIS','VERCEL'])delete process.env[k];
  const storage=createPersistence({dbPath:'/no/such/local.json',statsPath:'/no/such/stats.json',seed:{value:'ok'}});
  const data=await storage.load();check(data.data.value==='ok','local fallback still available');
  process.env.VERCEL='1';
  const v=createPersistence({dbPath:'/no/such/local.json',statsPath:'/no/such/stats.json',seed:{}});
  await assert.rejects(()=>v.load(),e=>e instanceof StorageUnavailable && /Chưa cấu hình/.test(e.message));
  count++;
 }finally{
  for(const k of ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN','CMS_REQUIRE_REDIS','VERCEL']){
   if(snapshot[k]===undefined)delete process.env[k]; else process.env[k]=snapshot[k];
  }
 }
}
{
 const original=globalThis.fetch;
 const env={UPSTASH_REDIS_REST_URL:process.env.UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN:process.env.UPSTASH_REDIS_REST_TOKEN,KV_REST_API_URL:process.env.KV_REST_API_URL,KV_REST_API_TOKEN:process.env.KV_REST_API_TOKEN};
 try{
  delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL=kv.KV_REST_API_URL;process.env.KV_REST_API_TOKEN=kv.KV_REST_API_TOKEN;
  globalThis.fetch=async()=>{const e=new TypeError('fetch failed');e.cause=Object.assign(new Error('Failed'),{code:'ENOTFOUND'});throw e};
  const storage=createPersistence({dbPath:'/no/such/local.json',statsPath:'/no/such/stats.json',seed:{}});
  await assert.rejects(()=>storage.load(),e=>e instanceof StorageUnavailable && /ENOTFOUND/.test(e.message) && !e.message.includes(kv.KV_REST_API_TOKEN));count++;
 }finally{globalThis.fetch=original;for(const [k,v] of Object.entries(env)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
}
console.log(`REDIS CONFIG TEST: ${count}/${count} PASS`);
