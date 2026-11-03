import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 Path('/tmp/browser/text-style').mkdir(parents=True, exist_ok=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  page=await browser.new_page(viewport={"width":1280,"height":1800})
  page.on('pageerror', lambda error: print('Browser error:',str(error)))
  await page.goto('http://localhost:8080',wait_until='domcontentloaded')
  await page.evaluate('''async () => {
   const panelSource=await (await fetch('/src/pages/admin/InlineStylePanel.tsx')).text();
   const mainSource=await (await fetch('/src/main.tsx')).text();
   const reactPath=panelSource.match(/from \"([^\"]*react\.js[^\"]*)\"/)[1];
   const domPath=mainSource.match(/from \"([^\"]*react-dom_client\.js[^\"]*)\"/)[1];
   const ReactModule = await import(reactPath);
   const React=ReactModule.default || ReactModule;
   const DOM = await import(domPath);
   const {default:Panel}=await import('/src/pages/admin/InlineStylePanel.tsx');
   const {remoteSelection}=await import('/src/pages/admin/remoteSelection.ts');
   document.body.innerHTML='<div id="check" class="bg-background text-foreground p-3"></div>';
   const mount=document.getElementById('check'); mount.style.width='308px';
   const sel=remoteSelection({key:'0',scope:'page',kind:'text',tag:'h2',text:'Nova Lighting',style:{fontSize:'32px',fontFamily:'Cormorant Garamond',fontWeight:'400',color:'#212121',textDecorationLine:'none',textAlign:'left'}});
   function Fixture(){const [edits,set]=React.useState({});window.checkEdits=edits;return React.createElement(Panel,{sel,edits,onChange:set,onReplaceImage:()=>{}})}
   (DOM.createRoot || DOM.default.createRoot)(mount).render(React.createElement(Fixture));
  }''')
  for width,height in [(1280,1800),(768,1024),(390,844),(360,740)]:
   await page.set_viewport_size({"width":width,"height":height})
   for theme in ['light','dark']:
    await page.evaluate('(theme)=>document.documentElement.classList.toggle("dark",theme==="dark")',theme)
    await page.get_by_role('button',name='Text Color',exact=True).wait_for()
    bounds=await page.evaluate('''()=>{const label=[...document.querySelectorAll('span')].find(x=>x.textContent==='Alignment');const buttons=document.querySelector('[aria-label="Align Left"]');const row=document.querySelector('[data-text-toolbar]');return {labelBottom:label.getBoundingClientRect().bottom,buttonTop:buttons.getBoundingClientRect().top,rowWidth:row.clientWidth,rowScroll:row.scrollWidth,bodyWidth:document.body.clientWidth,bodyScroll:document.body.scrollWidth}}''')
    assert bounds['labelBottom']<=bounds['buttonTop'],bounds
    assert bounds['rowScroll']<=bounds['rowWidth'],bounds
    assert bounds['bodyScroll']<=bounds['bodyWidth'],bounds
    assert await page.locator('[data-text-toolbar]').evaluate('(row)=>Math.abs(row.getBoundingClientRect().right-row.lastElementChild.getBoundingClientRect().right)<2')
    await page.locator('#check').screenshot(path=f'/tmp/browser/text-style/{width}-{theme}.png')
    print(width,theme,json.dumps(bounds))
  await page.get_by_role('button',name='Text Color',exact=True).click()
  await page.get_by_label('Custom Colour (Hex)').fill('#853732')
  await page.get_by_label('Custom Colour (Hex)').press('Enter')
  assert await page.evaluate('JSON.parse(window.checkEdits["style:0"]).color')=='#853732'
  await page.get_by_role('button',name='Icon & Link None',exact=True).click()
  await page.get_by_label('Find an Icon').fill('mail')
  await page.get_by_role('button',name='Mail',exact=True).click()
  await page.get_by_role('button',name='Before Text',exact=True).click()
  await page.get_by_role('textbox',name='Link Address',exact=True).fill('javascript:bad()')
  await page.get_by_role('textbox',name='Link Address',exact=True).press('Enter')
  await page.get_by_role('alert').wait_for()
  await page.get_by_role('textbox',name='Link Address',exact=True).fill('/about')
  await page.get_by_role('textbox',name='Link Address',exact=True).press('Enter')
  await page.get_by_role('switch',name='Open in New Tab',exact=True).click()
  assert await page.evaluate('window.checkEdits["icon-position:0"]')=='before'
  assert await page.evaluate('JSON.parse(window.checkEdits["link:0"]).target')=='_blank'
  print('Saved control state:',await page.evaluate('JSON.stringify(window.checkEdits)'))
  await page.locator('#check').screenshot(path='/tmp/browser/text-style/icon-link.png')
  await browser.close()
asyncio.run(main())
