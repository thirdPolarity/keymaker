/* global document */
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const browser = await chromium.launch({headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
const context = await browser.newContext();
const page = await context.newPage();
const reports = [], copy = [];
for (const width of [1200, 375]) {
 await page.setViewportSize({width, height: 1000});
 await page.goto('http://127.0.0.1:4349/phosphor');
 await page.waitForLoadState('networkidle');
 if (process.env.FLAT_CONTRAST) await page.addStyleTag({content: '.phosphor-shell{background:#0c0d10!important}.phosphor-card{background:#14151a!important}.well{background:#020306!important}.copy-button{background:#1b1b21!important}.phosphor-shell:before,.phosphor-card:before,.phosphor-card:after,.edge-light{display:none!important}'});
 for (const state of ['page', 'help', 'manual']) {
  if (state === 'help') await page.getByRole('button', {name: 'Help'}).click();
  if (state === 'manual') {
   await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true, value:async()=>{throw new Error('test clipboard denial');}}));
   await page.getByRole('button', {name:'Copy Random password'}).click();
  }
  const result = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  const summarize = rules => rules.map(rule => ({id:rule.id, nodes:rule.nodes.map(node => ({target:node.target, summary:node.failureSummary}))}));
  reports.push({width, state, violations:summarize(result.violations), incomplete:summarize(result.incomplete)});
  // Omit transient generated values from copy-review artifacts.
  copy.push(await page.evaluate(() => {
   const clone = document.body.cloneNode(true);
   clone.querySelectorAll('.value-text,textarea,[role=status]').forEach(el => el.textContent = '');
   clone.querySelectorAll('dialog:not([open]),script,style').forEach(el => el.remove());
   return clone.textContent + '\n' + [...clone.querySelectorAll('[aria-label],[title]')].map(el => el.getAttribute('aria-label') || el.title).join('\n');
  }));
  if (state !== 'page') await page.keyboard.press('Escape');
 }
}
fs.mkdirSync(new URL('../artifacts/phosphor/', import.meta.url), {recursive:true});
fs.writeFileSync(new URL(`../artifacts/phosphor/axe${process.env.FLAT_CONTRAST ? '-flat' : ''}.json`, import.meta.url), JSON.stringify(reports,null,2));
fs.writeFileSync(new URL('../artifacts/phosphor/rendered-copy.txt', import.meta.url), copy.join('\n\n'));
console.log(JSON.stringify(reports.map(r=>({...r, incomplete:r.incomplete.length})),null,2));
await browser.close();
if (reports.some(r=>r.violations.length)) process.exitCode=1;
