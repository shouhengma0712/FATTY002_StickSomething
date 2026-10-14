import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXE?{executablePath:process.env.BROWSER_EXE}:{})});
await mkdir('test-results',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.stack));
 // The picker itself is substituted; reads/writes, handles, permissions and IndexedDB
 // use the browser's real file-system implementation in isolated origin storage.
 await page.addInitScript(()=>{
  const fixture=window.fileFixture={directories:0,saves:0,opens:0,nextName:'first.something.json',cancel:false,activations:[],available:typeof window.showSaveFilePicker==='function'};
  const ready=navigator.storage.getDirectory().then(root=>root.getDirectoryHandle('Chosen Parent',{create:true}));
  window.showDirectoryPicker=async options=>{fixture.directories++;fixture.activations.push(navigator.userActivation.isActive);fixture.directoryOptions=options;return await ready;};
  window.showSaveFilePicker=async options=>{fixture.saves++;fixture.activations.push(navigator.userActivation.isActive);fixture.suggestedName=options.suggestedName;fixture.startName=options.startIn.name;if(fixture.cancel){fixture.cancel=false;throw new DOMException('Cancelled','AbortError');}const parent=await ready,app=await parent.getDirectoryHandle('STICK SOMETHING'),projects=await app.getDirectoryHandle('Projects');return await projects.getFileHandle(fixture.nextName,{create:true});};
  window.showOpenFilePicker=async()=>{fixture.opens++;const parent=await ready,app=await parent.getDirectoryHandle('STICK SOMETHING'),projects=await app.getDirectoryHandle('Projects');return [await projects.getFileHandle(fixture.nextName)];};
  window.fixtureRead=async filename=>{const parent=await ready,app=await parent.getDirectoryHandle('STICK SOMETHING'),projects=await app.getDirectoryHandle('Projects');return JSON.parse(await (await projects.getFileHandle(filename)).getFile().then(file=>file.text()));};
 });
 const c=name=>page.locator(`[data-control="${name}"]`),a=name=>page.locator(`[data-action="${name}"]`).filter({visible:true});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('stick-something.project.v1')));
 const status=text=>page.waitForFunction(value=>document.querySelector('.ss-feedback').textContent===value,text);
 const disk=name=>page.evaluate(name=>window.fixtureRead(name),name);
 const data=()=>page.evaluate(()=>({...window.fileFixture}));
 const response=await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');assert.equal(response.status(),200);await page.waitForSelector('.ss-cell');await page.evaluate(()=>document.fonts.ready);
 assert.equal((await data()).available,true);assert.equal(await a('undo').isDisabled(),true);
 // Focus, selection and no-motion divider clicks must not add history.
 await page.locator('button[data-tool="text"]').click();await c('text').focus();await page.locator('button[data-tool="select"]').click();await page.locator('.ss-handle.horizontal').first().click();assert.equal(await a('undo').isDisabled(),true);
 await page.locator('.ss-cell[data-cell="title"]').click();await page.locator('button[data-tool="text"]').click();await c('text').fill('temporary');await c('text').fill('专业发呆');assert.equal(await a('undo').isDisabled(),true);
 await c('text').fill('one actual change');await a('undo').click();assert.equal(await a('undo').isDisabled(),true);assert.equal((await saved()).root.children[0].text,'专业发呆');
 for(let i=0;i<10;i++)await page.keyboard.press('Control+z');await a('redo').click();assert.equal((await saved()).root.children[0].text,'one actual change');assert.equal(await a('redo').isDisabled(),true);await a('undo').click();
 // Cancelled renaming is inert; confirmed renaming is undoable.
 await page.locator('[data-display="document"]').dblclick();await c('rename').fill('ignored');await a('cancel-rename').click();assert.equal((await saved()).name,'专业发呆');assert.equal(await a('undo').isDisabled(),true);
 await page.locator('[data-display="document"]').dblclick();await c('rename').fill('CON');await page.locator('[data-form="rename"] button[type="submit"]').click();assert.equal(await page.locator('[data-display="rename-error"]').isVisible(),true);await c('rename').fill('路边灵感');await c('rename').press('Enter');assert.equal((await saved()).name,'路边灵感');await a('undo').click();assert.equal((await saved()).name,'专业发呆');await a('redo').click();
 // Expanded fonts change the rendered font, not merely the menu label.
 await page.locator('button[data-tool="text"]').click();assert.equal(await c('font').locator('option').count(),21);await c('font').selectOption('Consolas');await c('text').fill('ABC 0123');await c('fit').selectOption('manual');await c('fontSize').fill('44');await c('weight').selectOption('700');assert.equal((await saved()).root.children[0].weight,700);assert.equal(await page.locator('.ss-artwork [data-region="title"] text').getAttribute('font-family'),'"Consolas", "Microsoft YaHei", monospace');await c('font').selectOption('FangSong');assert.equal((await saved()).root.children[0].font,'FangSong');
 await a('save').click();assert.equal(await a('save-to-file').isDisabled(),true);await a('choose-folder').click();await status('默认保存文件夹已设置');assert.equal((await data()).directories,1);assert.equal(await page.locator('[data-display="save-folder"]').textContent(),'Chosen Parent / STICK SOMETHING / Projects');
 await page.screenshot({path:'test-results/save-dialog.png'});await a('save-to-file').click();await status('项目已保存到所选文件');assert.equal((await data()).saves,1);assert.equal((await data()).startName,'Projects');assert.equal((await disk('first.something.json')).name,'路边灵感');
 await c('text').fill('overwritten in place');await page.keyboard.press('Control+s');await status('已更新原项目文件');assert.equal((await data()).saves,1);assert.equal((await disk('first.something.json')).root.children[0].text,'overwritten in place');
 // Undo after saving keeps the active file binding and correctly marks the disk dirty.
 await a('undo').click();assert.equal(await page.locator('[data-display="file-state"]').textContent(),'未保存更改');await page.keyboard.press('Control+s');await status('已更新原项目文件');assert.equal((await data()).saves,1);assert.notEqual((await disk('first.something.json')).root.children[0].text,'overwritten in place');
 // Save As cancellation preserves the old binding; successful Save As switches it.
 await page.evaluate(()=>window.fileFixture.cancel=true);await page.keyboard.press('Control+Shift+s');await a('save-to-file').click();await status('已取消保存');await a('cancel-save').click();await page.keyboard.press('Control+s');await status('已更新原项目文件');assert.equal((await data()).saves,2);
 const firstBefore=await disk('first.something.json');await page.evaluate(()=>window.fileFixture.nextName='second.something.json');await page.keyboard.press('Control+Shift+s');await a('save-to-file').click();await status('项目已保存到所选文件');await c('text').fill('second only');await a('save').click();await status('已更新原项目文件');assert.deepEqual(await disk('first.something.json'),firstBefore);assert.equal((await disk('second.something.json')).root.children[0].text,'second only');
 // Remember handles across reload; Save must not open another picker.
 await page.waitForTimeout(150);await page.reload();await page.waitForFunction(()=>document.querySelector('[data-display="file-state"]').textContent==='已保存');await page.locator('button[data-tool="text"]').click();await c('text').fill('after reload');await a('save').click();await status('已更新原项目文件');assert.equal((await data()).saves,0);assert.equal((await disk('second.something.json')).root.children[0].text,'after reload');
 await a('save-menu').click();await a('save-as').click();assert.equal(await page.locator('[data-display="save-folder"]').textContent(),'Chosen Parent / STICK SOMETHING / Projects');await a('cancel-save').click();
 // Opening a native handle then saving updates that opened file.
 await page.evaluate(()=>window.fileFixture.nextName='first.something.json');await a('open').click();await status('已打开项目');assert.equal(await a('undo').isDisabled(),true);await page.locator('button[data-tool="text"]').click();await c('text').fill('opened file updated');await a('save').click();await status('已更新原项目文件');assert.equal((await data()).opens,1);assert.equal((await data()).saves,0);assert.equal((await disk('first.something.json')).root.children[0].text,'opened file updated');
 await a('save').click({button:'right'});assert.equal(await page.locator('[data-panel="save-menu"]').isVisible(),true);await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/editor-v02.png'});assert.ok((await data()).activations.every(Boolean));assert.deepEqual(errors,[]);
 await a('new').click();await c('start').selectOption('bands');await a('create').click();assert.equal(await a('undo').isDisabled(),true);assert.equal(await a('redo').isDisabled(),true);await a('save').click();assert.equal(await page.locator('[data-panel="save"]').isVisible(),true);await a('cancel-save').click();assert.equal(await page.locator('.ss-cell').count(),5);
 console.log('File-editor checks passed: native capability, default directory creation and persistence, same-file Save, Save As/cancel, open-file binding, reload, rename, 20 fonts, weight, no-op history and redo. Native picker UI is substituted; actual browser file handles and IndexedDB are used.');
}finally{await browser.close();}
