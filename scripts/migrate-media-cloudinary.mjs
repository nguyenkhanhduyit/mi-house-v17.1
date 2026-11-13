/** One-time, resumable migration of local website images/videos to Cloudinary.
 * Run with the Node server STOPPED to avoid overwriting concurrent CMS writes.
 * Uses only CLOUDINARY_* credentials from environment/.env. No secret in code.
 * Usage: node scripts/migrate-media-cloudinary.mjs --dry-run
 *        node scripts/migrate-media-cloudinary.mjs --execute
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const line of (fs.existsSync(path.join(root,'.env'))?fs.readFileSync(path.join(root,'.env'),'utf8'):'').split(/\r?\n/)){
 const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
}
if(process.env.CLOUDINARY_URL){try{const u=new URL(process.env.CLOUDINARY_URL);process.env.CLOUDINARY_CLOUD_NAME ||= u.hostname;process.env.CLOUDINARY_API_KEY ||= decodeURIComponent(u.username);process.env.CLOUDINARY_API_SECRET ||= decodeURIComponent(u.password)}catch{}}
const cloud=process.env.CLOUDINARY_CLOUD_NAME,key=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;
const dbPath=path.resolve(process.env.CMS_DB_PATH||path.join(root,'server/data/content.json'));
const doUpload=process.argv.includes('--execute');
const extTypes={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime'};
const files=[];function walk(dir){for(const name of fs.readdirSync(dir)){const full=path.join(dir,name),stat=fs.statSync(full);if(stat.isDirectory()){// admin-source holds the source HTML, not published media.
if(name==='admin-source'||name==='uploads')continue;walk(full)}else if(extTypes[path.extname(name).toLowerCase()]&&stat.size>0)files.push({path:full,size:stat.size})}}
walk(path.join(root,'public'));
const database=JSON.parse(fs.readFileSync(dbPath,'utf8'));database.media ||= [];database.mediaMap ||= {};
const toUrl=file=>'/'+path.relative(path.join(root,'public'),file).replaceAll(path.sep,'/');
/** A file counts as mapped when any of its URL spellings is already in mediaMap. */
const isMapped=rel=>Boolean(database.mediaMap[rel]||database.mediaMap[`https://mihousespa.com${rel}`]||database.mediaMap[`http://mihousespa.com${rel}`]);
const unmapped=files.filter(x=>!isMapped(toUrl(x.path)));
const bytes=files.reduce((n,f)=>n+f.size,0);
console.log(`Local content media: ${files.length} files, ${(bytes/1048576).toFixed(2)} MiB. Not yet mapped: ${unmapped.length}.`);
if(!doUpload){console.log('Dry run only. Upload after setting CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET and passing --execute.');process.exit(0)}
if(!cloud||!key||!secret||secret==='PASTE_SECRET_HERE'){console.error('Cloudinary credentials missing. Nothing uploaded or modified.');process.exit(2)}
function persist(){database.revision=(Number(database.revision)||0)+1;const tmp=dbPath+'.media-migrate.tmp';fs.writeFileSync(tmp,JSON.stringify(database,null,2));fs.renameSync(tmp,dbPath)}
let uploaded=0,failed=0;
for(const file of unmapped){
 const rel=toUrl(file.path),buffer=fs.readFileSync(file.path);
 const pid='mi-house/website/'+crypto.createHash('sha256').update(buffer).digest('hex').slice(0,28);
 const timestamp=Math.floor(Date.now()/1000),signature=crypto.createHash('sha1').update(`public_id=${pid}&timestamp=${timestamp}${secret}`).digest('hex');
 const form=new FormData();form.append('file',new Blob([buffer],{type:extTypes[path.extname(file.path).toLowerCase()]}),path.basename(file.path));form.append('public_id',pid);form.append('timestamp',String(timestamp));form.append('api_key',key);form.append('signature',signature);
 try{
  const resp=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/auto/upload`,{method:'POST',body:form,signal:AbortSignal.timeout(120000)});
  const json=await resp.json();if(!resp.ok||!json.secure_url)throw Error(json.error?.message||'Cloudinary upload failed ('+resp.status+')');
  database.mediaMap[rel]=json.secure_url;
  database.mediaMap[`https://mihousespa.com${rel}`]=json.secure_url;
  database.mediaMap[`http://mihousespa.com${rel}`]=json.secure_url;
  if(!database.media.some(x=>x.publicId===json.public_id))database.media.push({id:crypto.randomUUID(),name:path.basename(file.path),url:json.secure_url,publicId:json.public_id,resourceType:json.resource_type,sourceUrl:rel,width:json.width,height:json.height,createdAt:new Date().toISOString()});
  persist();uploaded++;if(uploaded%10===0)console.log(`Migrated ${uploaded}/${unmapped.length}; last: ${rel}`);
 }catch(error){failed++;console.error(`Failed ${rel}: ${error.message}`)}
}
console.log(`Completed: ${uploaded} uploaded, ${failed} failed, ${files.length-unmapped.length} already mapped. Local copies are intentionally retained until frontend validation.`);
process.exitCode=failed?1:0;
