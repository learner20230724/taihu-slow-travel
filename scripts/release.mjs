import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=fileURLToPath(new URL('../',import.meta.url));
const run=(command,args,env={})=>execFileSync(command,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});
run('npm',['run','test']);run('npm',['run','build']);
const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4239','--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let previewFailure='';preview.stderr.on('data',data=>{previewFailure+=data.toString();});
try{
  let ready=false;
  for(let attempt=0;attempt<30;attempt++){
    if(preview.exitCode!==null)throw new Error(`Release preview failed: ${previewFailure}`);
    try{const res=await fetch('http://127.0.0.1:4239/taihu/');if(res.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready)throw new Error('Release preview did not become ready.');
  run('npm',['run','test:browser'],{TAIHU_URL:'http://127.0.0.1:4239/taihu/'});
}finally{preview.kill('SIGTERM');}
run(process.execPath,['scripts/deploy.mjs']);
const url='https://guihualab.cn/taihu/';
const response=await fetch(url,{cache:'no-store'});const html=await response.text();
if(!response.ok||!html.includes('太湖慢游'))throw new Error('Public project URL is not serving this app.');
const assets=[...html.matchAll(/(?:src|href)="(\/taihu\/assets\/[^\"]+)"/g)].map(m=>m[1]);
if(assets.length<2)throw new Error('Public asset references missing.');
for(const asset of assets){const res=await fetch(new URL(asset,url));if(!res.ok)throw new Error(`Public asset unavailable: ${asset}`);}
run(process.execPath,['scripts/sync-lab.mjs']);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://guihualab.cn/',{waitUntil:'networkidle'});
  const card=page.locator('.project-card.taihu-slow-travel');await card.waitFor();
  if(await card.count()!==1)throw new Error('Navigation card duplicated.');
  if(!await card.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0))throw new Error('Navigation screenshot unavailable.');
  const popupPromise=page.waitForEvent('popup');await card.locator('a.launch').click();const project=await popupPromise;project.on('pageerror',e=>errors.push(e.message));await project.waitForLoadState('networkidle');
  if(project.url()!==url||!(await project.locator('h1').innerText()).includes('太湖'))throw new Error('Public navigation link failed.');
  await project.locator('.plan-nav').click();await project.getByRole('dialog').waitFor();await project.getByRole('button',{name:'关闭面板',exact:true}).click();
  await project.screenshot({path:fileURLToPath(new URL('../test-results/public-desktop.png',import.meta.url))});
  await page.screenshot({path:fileURLToPath(new URL('../test-results/public-lab.png',import.meta.url)),fullPage:true});
  await project.setViewportSize({width:393,height:852});await project.reload({waitUntil:'networkidle'});await project.locator('.mobile-nav').getByRole('button',{name:'主题路线'}).click();
  if(await project.locator('.route-card').count()!==8)throw new Error('Public mobile routes did not render.');
  if(errors.length)throw new Error(errors.join('; '));
  await writeFile(new URL('../test-results/release-report.json',import.meta.url),JSON.stringify({passed:true,url,navigation:'https://guihualab.cn/',assets,navigationClick:true,mobileRoutes:true,errors,publishedAt:new Date().toISOString()},null,2));
  console.log('Verified: public HTTPS, assets, Lab card, screenshot, click-through, route drawer and mobile routes.');
}finally{await browser.close();}
