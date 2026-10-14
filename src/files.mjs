import {parseProject,validateTheme} from './model.mjs';
export const PROJECT_KEY='stick-something.project.v1',PREFS_KEY='stick-something.preferences.v1';
export function safeName(name){return String(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/[. ]+$/,'').slice(0,80)||'stick-something';}
export function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function downloadProjectFile(project){download(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),safeName(project.name)+'.something.json');}
export function nativeSaveAvailable(){return globalThis.isSecureContext&&typeof globalThis.showSaveFilePicker==='function'&&typeof globalThis.showDirectoryPicker==='function';}
export function projectFilename(name){return safeName(name)+'.something.json';}
export function normalizeProjectName(value){const name=String(value).trim().replace(/\.something(?:\.json)?$/i,'');if(!name||name.length>80||/[<>:"/\\|?*\u0000-\u001f]/.test(name)||/[. ]$/.test(name)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name.split('.')[0]))throw new Error('Invalid project name');return name;}
const DIRECTORY_DB='stick-something.file-handles.v1';
async function directoryRecord(mode,record,key='project-directory'){if(!globalThis.indexedDB)throw new Error('Storage unavailable');return new Promise((resolve,reject)=>{const request=indexedDB.open(DIRECTORY_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('settings');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;let result=null;try{const tx=db.transaction('settings',mode),store=tx.objectStore('settings');const operation=mode==='readonly'?store.get(key):store.put(record,key);operation.onsuccess=()=>result=operation.result;tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};}catch(error){db.close();reject(error);}};});}
export async function restoreSaveDirectory(){try{const record=await directoryRecord('readonly');return record?.handle?.kind==='directory'?record:null;}catch{return null;}}
export async function chooseSaveDirectory(){
 // Call the browser picker immediately while the button's user activation is live.
 const parent=await globalThis.showDirectoryPicker({id:'stick-something-default-folder',startIn:'documents',mode:'readwrite'});
 const appFolder=await parent.getDirectoryHandle('STICK SOMETHING',{create:true});
 const handle=await appFolder.getDirectoryHandle('Projects',{create:true});
 const record={handle,label:parent.name+' / STICK SOMETHING / Projects'};
 try{await directoryRecord('readwrite',record);record.remembered=true;}catch{record.remembered=false;}
 return record;
}
export async function saveProjectFile(project,directory){
 const handle=await globalThis.showSaveFilePicker({id:'stick-something-save-project',startIn:directory?.handle||'documents',suggestedName:projectFilename(project.name),excludeAcceptAllOption:true,types:[{description:'STICK SOMETHING project',accept:{'application/json':['.json']}}]});
 await writeProjectHandle(project,handle);
 return {handle,filename:handle.name};
}
export async function writeProjectHandle(project,handle){
 if(handle.queryPermission&&await handle.queryPermission({mode:'readwrite'})!=='granted'&&await handle.requestPermission({mode:'readwrite'})!=='granted')throw new DOMException('Write permission denied','NotAllowedError');
 const stream=await handle.createWritable();
 try{await stream.write(JSON.stringify(project,null,2));await stream.close();}catch(error){try{await stream.abort();}catch{}throw error;}
}
export async function openProjectHandle(){const [handle]=await globalThis.showOpenFilePicker({id:'stick-something-open-project',multiple:false,types:[{description:'STICK SOMETHING project',accept:{'application/json':['.json']}}]});return {handle,project:await readProjectFile(await handle.getFile())};}
export async function rememberProjectFile(record){try{await directoryRecord('readwrite',record,'active-project');return true;}catch{return false;}}
export async function restoreProjectFile(){try{return await directoryRecord('readonly',null,'active-project');}catch{return null;}}
export async function readProjectFile(file){if(!file||file.size>20_000_000)throw new Error('Project too large');return parseProject(await file.text());}
export async function readThemeFile(file){if(!file||file.size>20_000)throw new Error('Theme too large');return validateTheme(JSON.parse(await file.text()));}
export function writeLocal(project,preferences){try{localStorage.setItem(PROJECT_KEY,JSON.stringify(project));localStorage.setItem(PREFS_KEY,JSON.stringify(preferences));return true;}catch{return false;}}
export function readLocal(){let project=null,preferences={};try{const raw=localStorage.getItem(PROJECT_KEY);if(raw)project=parseProject(raw);}catch{}try{preferences=JSON.parse(localStorage.getItem(PREFS_KEY)||'{}');if(!preferences||typeof preferences!=='object')preferences={};if(preferences.custom)preferences.custom=validateTheme({version:1,colors:preferences.custom});}catch{preferences={};}return {project,preferences};}
