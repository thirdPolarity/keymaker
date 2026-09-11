import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context=await browser.newContext({viewport:{width:900,height:900}}),page=await context.newPage();
await page.goto('http://127.0.0.1:4349/dream');await page.waitForLoadState('networkidle');
const results=[];
for(const dark of [false,true]) {
 if(Boolean(await page.locator('.is-dark').count())!==dark) await page.locator('.mode-button').click();
 for(const name of ['Classic DMG','Amber terminal','Cyan matrix','Purple haze','Orange sunset','SNES','Red alert','Blue steel','Monochrome']) {
  await page.getByRole('button',{name,exact:true}).click();
  const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  results.push({name,dark,violations:r.violations,incomplete:r.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});
 }
}
fs.mkdirSync(new URL('../artifacts/dream-refinement/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../artifacts/dream-refinement/axe.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({name:r.name,dark:r.dark,violations:r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),incomplete:r.incomplete.length}))));
await browser.close();
