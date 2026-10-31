import { test, expect } from "../playwright-fixture";

// A real click into a CSS-transformed iframe must land on the element drawn under the pointer, and a rect measured inside
// the frame, multiplied by the scale, must line up with where it is drawn (selection outlines use the same mapping).
const DOC = `<body style="margin:0"><div style="height:300px"></div><button id="t" style="position:absolute;left:600px;top:400px;width:200px;height:60px">Target</button>
<script>document.getElementById('t').onclick=e=>{parent.postMessage({hit:true,x:e.clientX,y:e.clientY},'*')}</script></body>`;

for (const scale of [0.35, 0.55, 1]) {
  test(`click lines up at ${Math.round(scale * 100)}%`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.setContent(`<div style="width:${1280 * scale}px;height:${800 * scale}px;overflow:hidden;position:relative">
      <div style="width:1280px;height:800px;transform:scale(${scale});transform-origin:top left"><iframe id="f" style="width:100%;height:100%;border:0"></iframe></div></div>
      <script>window.hits=[];addEventListener('message',e=>hits.push(e.data))</script>`);
    await page.evaluate((doc) => { (document.getElementById("f") as HTMLIFrameElement).srcdoc = doc; }, DOC);
    const frame = page.frameLocator("#f");
    await expect(frame.locator("#t")).toBeVisible();
    // Screen point = frame point × scale.
    await page.mouse.click((600 + 100) * scale, (400 + 30) * scale);
    await expect.poll(() => page.evaluate(() => (window as any).hits.length)).toBe(1);
    const box = await frame.locator("#t").boundingBox();
    expect(box!.x).toBeCloseTo(600 * scale, 0);
    expect(box!.width).toBeCloseTo(200 * scale, 0);
  });
}
