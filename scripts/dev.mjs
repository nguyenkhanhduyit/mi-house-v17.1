import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const children=[];
const start=(name,args)=>{const p=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});children.push(p);p.on('exit',code=>{if(!shuttingDown&&code!==0){console.error('Process exited:',name,code);process.exitCode=code;shutdown()}});return p};
let shuttingDown=false;
function shutdown(){if(shuttingDown)return;shuttingDown=true;for(const child of children)child.kill('SIGTERM')}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
start('cms',['server/index.mjs']);
const viteCli=path.join(root,'node_modules/vite/bin/vite.js');
start('vite',[viteCli,'--host','0.0.0.0','--port','555','--strictPort',...process.argv.slice(2)]);
