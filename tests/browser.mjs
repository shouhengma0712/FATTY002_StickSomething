import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{})});
await mkdir('test-results',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 // Exercise the explicit download fallback; native file bindings have a separate suite.
 await page.addInitScript(()=>{window.showDirectoryPicker=undefined;});
 const errors=[];page.on('pageerror',e=>errors.push(e.stack));
 const c=n=>page.locator(`[data-control="${n}"]`),a=n=>page.locator(`[data-action="${n}"]`).filter({visible:true});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('stick-something.project.v1')));
 const bg=()=>page.locator('.ss-artwork [data-region="title"] rect').getAttribute('fill');
 const clickBoard=async(x,y)=>{const r=await page.locator('.ss-artboard').boundingBox();await page.mouse.click(r.x+x*r.width,r.y+y*r.height);};
 const download=async(action,path)=>{const promise=page.waitForEvent('download');await action();const file=await promise;await file.saveAs(path);return file;};
 const response=await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');assert.equal(response.status(),200);
 await page.waitForSelector('.ss-artwork svg');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.ss-cell').count(),4);assert.equal(await c('theme').inputValue(),'dark');
 assert.ok(await page.evaluate(()=>document.fonts.check('650 18px "Inter Brand"')));assert.ok(await page.evaluate(()=>document.fonts.check('700 14px "Source Han Brand"','「贴点什么」')));
 await page.screenshot({path:'test-results/editor-dark.png'});
 await page.locator('button[data-tool="fill"]').click();await c('bg').click();await c('hex').fill('#123456');
 assert.equal(await bg(),'#123456');assert.equal((await saved()).root.children[0].bg,'#e7291a');
 await page.keyboard.press('Escape');assert.equal(await bg(),'#e7291a');
 await c('bg').click();await c('hex').fill('#123456');await c('confirm-color').click();assert.equal((await saved()).root.children[0].bg,'#123456');
 await a('undo').click();assert.equal(await bg(),'#e7291a');
 // Save while a draft is active: the draft must never enter the project file.
 await c('bg').click();await c('hex').fill('#abcdef');await download(async()=>{await page.keyboard.press('Control+s');await a('download-copy').click();},'test-results/without-draft.something.json');assert.equal(JSON.parse(await readFile('test-results/without-draft.something.json','utf8')).root.children[0].bg,'#e7291a');assert.equal(await bg(),'#e7291a');
 // Actual rendered artwork is sampled without committing until the circle is clicked.
 await c('bg').click();await c('eyedropper').click();await page.waitForSelector('.ss-artboard[data-sampling="true"]');await clickBoard(.005,.44);
 assert.equal(await c('hex').inputValue(),'#F4D73A');assert.equal(await bg(),'#f4d73a');assert.equal((await saved()).root.children[0].bg,'#e7291a');
 await c('cancel-color').click();assert.equal(await bg(),'#e7291a');
 await c('bg').click();await c('eyedropper').click();await page.waitForSelector('.ss-artboard[data-sampling="true"]');await clickBoard(.005,.44);await c('confirm-color').click();assert.equal(await bg(),'#f4d73a');await a('undo').click();
 // Locate a solid cream text pixel in the rendered SVG and sample it on the board.
 const textPoint=await page.evaluate(async()=>{const svg=document.querySelector('.ss-artwork svg').outerHTML;const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=840;canvas.height=592;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,840,240).data;const cream=(x,y)=>{const i=(y*840+x)*4;return pixels[i]===255&&pixels[i+1]===245&&pixels[i+2]===222;};for(let y=5;y<235;y++)for(let x=5;x<835;x++){let interior=true;for(let dy=-4;dy<=4&&interior;dy++)for(let dx=-4;dx<=4;dx++)if(!cream(x+dx,y+dy)){interior=false;break;}if(interior)return {x:(x+.5)/840,y:(y+.5)/592};}throw Error('Text pixel not found');}finally{URL.revokeObjectURL(url);}});
 await c('bg').click();await c('eyedropper').click();await page.waitForSelector('.ss-artboard[data-sampling="true"]');await clickBoard(textPoint.x,textPoint.y);assert.equal(await c('hex').inputValue(),'#FFF5DE');assert.equal((await saved()).root.children[0].bg,'#e7291a');await c('cancel-color').click();
 await c('bg').click();await c('hex').fill('#abcdef');await c('eyedropper').click();await page.waitForSelector('.ss-artboard[data-sampling="true"]');await page.keyboard.press('Escape');assert.equal(await bg(),'#e7291a');
 // Right-clicking under the fill tool must not apply paint.
 await page.locator('.ss-cell[data-cell="number"]').click({button:'right'});assert.equal((await saved()).root.children[1].bg,'#f4d73a');await page.keyboard.press('Escape');
 await page.locator('button[data-tool="split"]').click();await c('count').fill('3');await a('split-x').click();assert.equal(await page.locator('.ss-cell').count(),6);
 await a('delete-region').click();assert.equal(await page.locator('.ss-cell').count(),5);await a('undo').click();assert.equal(await page.locator('.ss-cell').count(),6);await a('undo').click();assert.equal(await page.locator('.ss-cell').count(),4);
 const oldWeights=(await saved()).root.weights;const handle=page.locator('.ss-handle.horizontal').first();const hr=await handle.boundingBox();await page.mouse.move(hr.x+hr.width/2,hr.y+hr.height/2);await page.mouse.down();await page.mouse.move(hr.x+hr.width/2,hr.y+hr.height/2+25);await page.mouse.up();assert.notDeepEqual((await saved()).root.weights,oldWeights);await a('undo').click();assert.deepEqual((await saved()).root.weights,oldWeights);
 await a('canvas-settings').click();await c('canvas-width').fill('1200');await c('canvas-height').fill('600');await a('resize-canvas').click();assert.deepEqual((await saved()).canvas,{width:1200,height:600,shape:'rectangle'});assert.deepEqual((await saved()).root.weights,oldWeights);
 await c('theme').selectOption('light');await page.screenshot({path:'test-results/editor-light.png'});assert.equal((await saved()).root.children[0].bg,'#e7291a');
 for(const lang of ['en','zh-TW','de','fr','zh-CN']){await c('language').selectOption(lang);assert.equal(await page.locator('#stick-something-design').getAttribute('lang'),lang);assert.equal((await saved()).root.children[0].text,'专业发呆');}
 await c('language').selectOption('en');await page.reload();await page.waitForSelector('.ss-cell');assert.equal(await c('language').inputValue(),'en');assert.equal(await c('theme').inputValue(),'light');
 const themeBefore=(await saved()).root;await c('themefile').setInputFiles('design/themes/paper.json');await page.waitForFunction(()=>document.querySelector('[data-control="theme"]').value==='custom');assert.deepEqual((await saved()).root,themeBefore);
 await c('themefile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});assert.equal(await c('theme').inputValue(),'custom');
 await page.locator('button[data-tool="select"]').click();await page.locator('.ss-cell[data-cell="title"]').click();await page.locator('button[data-tool="text"]').click();await c('text').fill('Hello\n贴点什么');await c('fit').selectOption('manual');await c('fontSize').fill('90');await c('direction').selectOption('vertical');assert.equal((await saved()).root.children[0].fontSize,90);
 await c('text').focus();await page.keyboard.press('Delete');assert.equal(await page.locator('.ss-cell').count(),4);await c('direction').selectOption('horizontal');
 await download(async()=>{await a('save').click();await a('download-copy').click();},'test-results/roundtrip.something.json');const fileProject=JSON.parse(await readFile('test-results/roundtrip.something.json','utf8'));assert.equal(fileProject.root.children[0].text,'Hello\n贴点什么');
 await a('new').click();await c('start').selectOption('blank');await c('project-name').fill('空白测试');await a('create').click();assert.equal(await page.locator('.ss-cell').count(),1);await c('projectfile').setInputFiles('test-results/roundtrip.something.json');await page.waitForFunction(()=>document.querySelectorAll('.ss-cell').length===4);assert.equal((await saved()).name,fileProject.name);
 const current=await saved();await c('projectfile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"invalid"}')});assert.deepEqual(await saved(),current);
 await a('export').click();await download(()=>a('export-svg').click(),'test-results/sticker.svg');const svg=await readFile('test-results/sticker.svg','utf8');assert.ok(svg.includes('width="1200"'));assert.ok(svg.includes('Hello'));
 await a('export').click();await page.keyboard.press('Delete');assert.equal(await page.locator('.ss-cell').count(),4);await page.keyboard.press('Escape');
 await a('export').click();await download(()=>a('export-png').click(),'test-results/sticker.png');const png=await readFile('test-results/sticker.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),600);
 await a('canvas-settings').click();await c('canvas-shape').selectOption('ellipse');await a('resize-canvas').click();assert.equal((await saved()).canvas.shape,'ellipse');await a('export').click();await download(()=>a('export-svg').click(),'test-results/ellipse.svg');assert.ok((await readFile('test-results/ellipse.svg','utf8')).includes('<ellipse'));
 // Keyboard deletion removes a leaf and can be undone; root deletion stays disabled.
 await page.locator('.ss-cell[data-cell="number"]').click();await page.keyboard.press('Delete');assert.equal(await page.locator('.ss-cell').count(),3);await a('undo').click();assert.equal(await page.locator('.ss-cell').count(),4);
 await a('canvas-settings').click();assert.equal(await a('delete-region').isDisabled(),true);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/editor-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 assert.deepEqual(errors,[]);console.log('Browser checks passed: tools, color transactions, artwork sampling, delete/undo, resize, fonts, five languages, themes, project round-trip, PNG/SVG and mobile layout.');
}finally{await browser.close();}
