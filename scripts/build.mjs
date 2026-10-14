import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
for(const folder of ['src','assets'])await cp(folder,`dist/${folder}`,{recursive:true});
// The standalone edition embeds modules and fonts for direct local use.
const model=(await readFile('src/model.mjs','utf8')).replaceAll('export ','');
const fonts=(await readFile('src/fonts.mjs','utf8')).replaceAll('export ','');
const renderer=(await readFile('src/renderer.mjs','utf8')).replace(/^import .*;\r?\n/,'const {getRects,findNode,STYLE_DEFAULTS}=Model;\n').replace("import {FONT_FAMILIES} from './fonts.mjs';",'const {FONT_FAMILIES}=Fonts;').replaceAll('export ','');
const files=(await readFile('src/files.mjs','utf8')).replace(/^import .*;\r?\n/,'const {parseProject,validateTheme}=Model;\n').replaceAll('export ','');
const i18n=(await readFile('src/i18n.mjs','utf8')).replaceAll('export ','');
const wrapped=(name,source,names)=>`const ${name}=(()=>{${source}\nreturn {${names}};})();\n`;
const modules=wrapped('Fonts',fonts,'FONT_OPTIONS,FONT_FAMILIES')+wrapped('Model',model,'createPreset,serialFor,deleteNode,STYLE_DEFAULTS,getRects,findNode,parseProject,validateTheme')+wrapped('Renderer',renderer,'renderSvg,rasterize')+wrapped('Files',files,'saveProjectFile,writeProjectHandle,openProjectHandle,rememberProjectFile,restoreProjectFile,downloadProjectFile,nativeSaveAvailable,restoreSaveDirectory,chooseSaveDirectory,normalizeProjectName,projectFilename,readProjectFile,download,writeLocal,readLocal,safeName')+wrapped('I18n',i18n,'languages,dictionary');
let app=await readFile('src/app.mjs','utf8');
app=app.replace(/import \{([^}]+)\} from '\.\/([^']+)';/g,(_,names,path)=>`const {${names}}=${({'model.mjs':'Model','renderer.mjs':'Renderer','files.mjs':'Files','i18n.mjs':'I18n','fonts.mjs':'Fonts'})[path]};`);
let css=await readFile('src/styles.css','utf8');
for(const [filename,mime] of [['InterVariable.woff2','font/woff2'],['SourceHanSansCN-Bold.otf','font/otf']])css=css.replace(`../assets/fonts/${filename}`,`data:${mime};base64,${(await readFile('assets/fonts/'+filename)).toString('base64')}`);
let html=await readFile('index.html','utf8');
const studioMask=await readFile('assets/branding/fatty-games-mask.svg');
css=css.replaceAll('../assets/branding/fatty-games-mask.svg',`data:image/svg+xml;base64,${studioMask.toString('base64')}`);
const vendor=await readFile('assets/vendor/lucide.min.js','utf8');
const licenses={Inter:await readFile('assets/fonts/OFL-Inter.txt','utf8'),SourceHanSans:await readFile('assets/fonts/OFL-SourceHanSans.txt','utf8'),Lucide:await readFile('assets/vendor/LICENSE-lucide','utf8')};
// Callback replacements preserve literal dollar signs in script source.
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',()=>`<style>${css}</style>`).replace('<script defer src="./assets/vendor/lucide.min.js"></script>',()=>`<script>${vendor}</script>`).replace('<script type="module" src="./src/app.mjs"></script>',()=>`<script type="module">${modules+app}</script>`).replace('./assets/icon.svg',`data:image/svg+xml;base64,${(await readFile('assets/icon.svg')).toString('base64')}`);
html=html.replace('</head>',()=>`<script type="application/json" id="third-party-licenses">${JSON.stringify(licenses).replaceAll('<','\\u003c')}</script></head>`);
await writeFile('dist/STICK-SOMETHING.html',html);
await copyFile('README.md','dist/README.md');
await cp('design/themes','dist/themes',{recursive:true});
console.log('Built dist/index.html for HTTP hosting and dist/STICK-SOMETHING.html for offline double-click use.');
