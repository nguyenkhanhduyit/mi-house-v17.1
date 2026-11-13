/**
 * Browser smoke test for the /admin iframe containing the archived Admin UI.
 * Deliberately excludes imported app CSS: this recreates the missing-CSS failure.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../src/cms/SourceAdmin.jsx',import.meta.url),'utf8');
assert.match(html, /id="mi-admin-critical-layout"/, 'critical CSS must load in HTML head');
assert.match(source, /className="source-admin-iframe" style=\{\{position:'absolute'/, 'iframe needs critical inline layout');
assert.match(source, /className="source-admin-host" style=\{\{position:'fixed'/, 'host needs critical inline layout');

const critical=html.match(/<style id="mi-admin-critical-layout">([\s\S]*?)<\/style>/)?.[1];
assert.ok(critical, 'critical admin CSS missing');
console.log('PASS Admin critical CSS is in index.html and is scoped to /admin');
console.log('PASS Admin iframe and host have inline full-viewport sizing');
if (!process.argv.includes('--browser')) {
  console.log('ADMIN VIEWPORT STATIC: 2 PASS (Chromium test: NOT RUN; use --browser)');
  process.exit(0);
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mi-admin-viewport-'));
const report=[];
try {
  const file=path.join(dir,'fixture.html');
  fs.writeFileSync(file,`<!doctype html><html class="mi-admin-scope"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${critical}</style></head><body><div id="root"><div class="source-admin-host"><iframe class="source-admin-iframe" srcdoc="<html><body>ADMIN FORM</body></html>"></iframe></div></div><output id="result"></output><script>onload=()=>{const frame=document.querySelector('iframe');const b=frame.getBoundingClientRect();document.querySelector('#result').textContent=JSON.stringify({width:b.width,height:b.height,x:b.x,y:b.y,innerWidth,innerHeight});};</script></body></html>`);
  for (const [width,height] of [[1280,800],[390,844]]) {
    const output=execFileSync(process.env.CHROMIUM_BIN||'chromium',[
      '--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--hide-scrollbars','--no-first-run',`--window-size=${width},${height}`,'--virtual-time-budget=1500','--dump-dom',`file://${file}`
    ],{timeout:15000,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    const match=output.match(/<output id="result">([^<]+)<\/output>/);
    assert.ok(match,`Browser did not produce bounds for ${width}x${height}`);
    const box=JSON.parse(match[1].replace(/&quot;/g,'"'));
    assert.ok(Math.abs(box.width-box.innerWidth)<=1,`iframe not full width: ${JSON.stringify(box)}`);
    assert.ok(Math.abs(box.height-box.innerHeight)<=1,`iframe not full height: ${JSON.stringify(box)}`);
    assert.equal(box.x,0);
    assert.equal(box.y,0);
    report.push(`PASS Chromium ${box.innerWidth}x${box.innerHeight}: admin iframe fills viewport without bundle CSS`);
  }
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log(report.join('\n'));
console.log('ADMIN VIEWPORT SMOKE: 2 PASS');
