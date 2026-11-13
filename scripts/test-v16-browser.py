"""Isolated Chromium DOM smoke tests for V16 CMS editor and robot controls.
Requires python playwright + Chromium; it does NOT test the complete Vite React app.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
src = (root/'src/cms/SourceAdmin.jsx').read_text(encoding='utf-8')
# These are the *actual* production helper implementations, extracted without
# copying a simplified test-only reimplementation.
editor = src[src.index('function sanitizeEditorHtml('):src.index('function ensurePhotoDimension(')]
robot = src[src.index('function syncRobots('):src.index('function ensureSchemaCard(')]

cases = []
def verify(name, value):
    cases.append((name, bool(value)))
    print(('PASS' if value else 'FAIL') + ' ' + name)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    page.set_content('<form id="edit"><textarea data-cms-key="body"><h2>Xin chào</h2><p>Nội dung <strong>đậm</strong></p></textarea></form>')
    page.add_script_tag(content=editor + '\n' + robot)
    page.add_style_tag(path=str(root/'public/cms-controls-v16.css'))
    page.evaluate('''document.addEventListener('click',e=>{const button=e.target.closest('[data-cms-rich]');if(button){e.preventDefault();richEditorAction(document,button.dataset.cmsRich,button)}})''')
    page.evaluate('mountRichEditor(document,document.querySelector("textarea"))')
    verify('Visual editor mounts',page.locator('[data-cms-rich-editable]').count()==1)
    verify('Visual editor retains HTML',page.locator('[data-cms-rich-editable] strong').inner_text()=='đậm')
    verify('HTML textarea stays in form',page.locator('form textarea[data-cms-key="body"]').count()==1)
    page.locator('[data-cms-rich="toggle-source"]').click()
    verify('Source mode is enabled',page.locator('.cms-rich-host').evaluate('(n)=>n.classList.contains("cms-html-mode")'))
    verify('Visual to source retains title', '<h2>Xin chào</h2>' in page.locator('textarea[data-cms-key="body"]').input_value())
    page.locator('textarea[data-cms-key="body"]').fill('<h1>Đã cập nhật</h1><p style="color:#aa3311">Chữ màu</p><img src="javascript:alert(1)" onerror="alert(1)"><script>alert(1)</script>')
    page.locator('[data-cms-rich="toggle-source"]').click()
    html=page.locator('textarea[data-cms-key="body"]').input_value()
    verify('Source to visual keeps edited heading', '<h1>Đã cập nhật</h1>' in html)
    verify('Safe inline text color retained', 'color:#aa3311' in html or 'color: #aa3311' in html)
    verify('Unsafe JS and inline event are removed', all(bad not in html for bad in ['<script','onerror','javascript:']))
    verify('Visual HTML actually updated',page.locator('[data-cms-rich-editable] h1').inner_text()=='Đã cập nhật')
    page.evaluate('''() => {
      let form=document.querySelector('form');
      for (const [key,element,value] of [
        ['index','select','noindex'],['follow','select','nofollow'],
        ['noarchive','input',true],['noimageindex','input',false],['nosnippet','input',true]]) {
        const n=document.createElement(element);
        n.dataset.cmsRobot=key;
        if(element==='select') {n.innerHTML=`<option value="${value}">${value}</option>`; n.value=value;}
        else {n.type='checkbox';n.checked=value;}
        form.appendChild(n);
      }
      const out=document.createElement('input');out.dataset.cmsKey='robots';out.type='hidden';form.appendChild(out);
      syncRobots(document);
    }''')
    verify('Robots Meta stores mutually exclusive directives',page.locator('[data-cms-key="robots"]').input_value()=='noindex,nofollow,noarchive,nosnippet')
    verify('No implicit save action attached to form',page.locator('form[data-cms-act="save-form"]').count()==0)
    browser.close()
print(f'V16 ISOLATED BROWSER SMOKE: {sum(result for _,result in cases)}/{len(cases)} PASS')
raise SystemExit(0 if all(result for _,result in cases) else 1)
