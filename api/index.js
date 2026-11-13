import {handleRequest} from '../server/index.mjs';

// Vercel routes every /api/* path here. Preserve the original path and query.
export default async function api(req,res){
 const u=new URL(req.url,'http://localhost');
 const routed=u.searchParams.get('__cms_path');
 if(routed!==null){
  u.searchParams.delete('__cms_path');
  if(routed.includes('..')||routed.startsWith('/')){
   res.statusCode=400;res.end('Bad route');return;
  }
  req.url='/api/'+routed+(u.searchParams.size?'?'+u.searchParams.toString():'');
 }
 return handleRequest(req,res);
}
