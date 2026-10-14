import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const root=resolve('.'),pkg=JSON.parse(await readFile('package.json','utf8'));
if(!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(pkg.version))throw new Error('Invalid release version');
const version='v'+pkg.version,output=resolve('releases',version);
await mkdir(output,{recursive:true});
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zip(entries){let offset=0;const blocks=[],central=[];for(const entry of entries){if(!entry.name||entry.name.startsWith('/')||entry.name.split('/').some(s=>s==='..'))throw new Error('Unsafe archive path');const name=Buffer.from(entry.name),data=entry.data,compressed=deflateRawSync(data,{level:9}),crc=crc32(data),local=Buffer.alloc(30),header=Buffer.alloc(46);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(33,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(20,4);header.writeUInt16LE(20,6);header.writeUInt16LE(0x800,8);header.writeUInt16LE(8,10);header.writeUInt16LE(33,14);header.writeUInt32LE(crc,16);header.writeUInt32LE(compressed.length,20);header.writeUInt32LE(data.length,24);header.writeUInt16LE(name.length,28);header.writeUInt32LE(offset,42);blocks.push(local,name,compressed);central.push(header,name);offset+=local.length+name.length+compressed.length;}const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...blocks,directory,end]);}
async function entry(path,name=path){const absolute=resolve(root,path);if(relative(root,absolute).startsWith('..'))throw new Error('Source outside project');return {name:name.replaceAll('\\','/'),data:await readFile(absolute)};}
async function walk(directory){const files=[];for(const item of await readdir(directory,{withFileTypes:true})){const path=join(directory,item.name);if(item.isDirectory())files.push(...await walk(path));else if(item.isFile())files.push(path);}return files.sort();}
const licenses=['assets/fonts/OFL-Inter.txt','assets/fonts/OFL-SourceHanSans.txt','assets/vendor/LICENSE-lucide'];
const prefix=`stick-something-${version}/`;
const offline=[await entry('dist/STICK-SOMETHING.html',prefix+'STICK-SOMETHING.html'),await entry('TEST_GUIDE.md',prefix+'先读我-内测说明.md'),await entry('CHANGELOG.md',prefix+'CHANGELOG.md'),await entry('assets/branding/README.md',prefix+'branding/README.md'),await entry('design/themes/paper.json',prefix+'themes/paper.json'),...await Promise.all(licenses.map(path=>entry(path,prefix+'licenses/'+path.split('/').at(-1))))];
const roots=['index.html','package.json','.gitignore','start-local.cmd','README.md','RESEARCH.md','PROJECT_PLAN.md','UI_DESIGN.md','IMPLEMENTATION.md','CHANGELOG.md','TEST_GUIDE.md','RELEASE_GUIDE.md'];
for(const directory of ['src','scripts','tests','assets','.github','design/themes'])roots.push(...await walk(directory));
const source=await Promise.all(roots.map(path=>entry(path,prefix+path)));
const files=[];for(const [kind,entries] of [['offline-beta',offline],['github-source',source]]){const filename=`stick-something-${version}-${kind}.zip`,data=zip(entries);await writeFile(join(output,filename),data);files.push({filename,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),entries:entries.length});}
const checksums=files.map(file=>`${file.sha256}  ${file.filename}`).join('\n')+'\n';await writeFile(join(output,'SHA256SUMS.txt'),checksums);
await writeFile(join(output,'release-manifest.json'),JSON.stringify({name:pkg.name,version:pkg.version,channel:'beta',builtAt:new Date().toISOString(),files},null,2)+'\n');
console.log(JSON.stringify({output,files:files.map(({filename,bytes,entries})=>({filename,bytes,entries}))},null,2));
