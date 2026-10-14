export const COLOR = /^#[\da-f]{6}$/i;
export const STYLE_DEFAULTS = Object.freeze({font:'sans',fit:'stretch',direction:'horizontal',fontSize:64,weight:900,letterSpacing:0,lineHeight:1.15,padding:8,align:'center'});
export function makeLeaf(id,name,text='',bg='#f5edce',fg='#252525') {return {id,name,text,bg,fg,...STYLE_DEFAULTS};}
export function createPreset(type='sample') {
  const headline=makeLeaf('title','标题','专业发呆','#e7291a','#fff5de');
  const number=makeLeaf('number','号码','000 0000 0000','#f4d73a','#d62518');
  const bottom={id:'bottom',name:'底栏',axis:'x',weights:[.53,.47],children:[makeLeaf('left','底栏左','随叫随停','#e7291a','#fff5de'),makeLeaf('right','底栏右','不急 不赶\n慢慢来','#e7291a','#f8de45')]};
  if(type==='blank')return makeLeaf('root','画布');
  if(type==='black'){headline.bg='#222222';headline.fg='#f4d73a';headline.text='情绪搬运';number.bg='#222222';number.fg='#fff5de';bottom.children.forEach(n=>{n.bg='#ce3225';n.fg='#f8de45';});}
  if(type==='blue'){headline.bg='#087da6';headline.fg='#fff5de';headline.text='记忆回收';number.bg='#fff5de';number.fg='#087da6';bottom.children.forEach(n=>{n.bg='#fff5de';n.fg='#087da6';});bottom.children[0].text='旧事整理\n慢慢来';}
  if(type==='bands')return {id:'root',name:'画布',axis:'y',weights:[.24,.19,.19,.18,.2],children:[makeLeaf('title','标题','认真走神','#702d2c','#f8de45'),makeLeaf('band-2','分区 2','今日休息','#242a3c','#fff5de'),makeLeaf('band-3','分区 3','白日做梦','#427bab','#fff5de'),makeLeaf('band-4','分区 4','记忆漫游','#46784e','#fff5de'),makeLeaf('number','号码','000 0000 0000','#702d2c','#f8de45')]};
  return {id:'root',name:'画布',axis:'y',weights:[.42,.26,.32],children:[headline,number,bottom]};
}
export function findNode(tree,id,path=[]) {const next=[...path,tree];if(tree.id===id)return {node:tree,path:next};for(const child of tree.children||[]){const found=findNode(child,id,next);if(found)return found;}return null;}
export function getRects(tree,rect={x:0,y:0,w:1,h:1},output=new Map()) {output.set(tree.id,rect);let offset=0;(tree.children||[]).forEach((child,i)=>{const fraction=tree.weights[i];getRects(child,tree.axis==='x'?{x:rect.x+offset*rect.w,y:rect.y,w:rect.w*fraction,h:rect.h}:{x:rect.x,y:rect.y+offset*rect.h,w:rect.w,h:rect.h*fraction},output);offset+=fraction;});return output;}
export function leafCount(node){return node.children?node.children.reduce((sum,child)=>sum+leafCount(child),0):1;}
export function firstLeaf(node){return node.children?firstLeaf(node.children[0]):node;}
export function deleteNode(tree,id){const found=findNode(tree,id);if(!found||found.path.length===1)return null;const parent=found.path.at(-2),index=parent.children.indexOf(found.node),deleted={name:found.node.name,count:leafCount(found.node)};parent.children.splice(index,1);parent.weights.splice(index,1);let selected;if(parent.children.length===1){const survivor=parent.children[0],grand=found.path.at(-3);if(grand)grand.children[grand.children.indexOf(parent)]=survivor;else{tree=survivor;tree.id='root';tree.name='画布';}selected=firstLeaf(survivor).id;}else{const sum=parent.weights.reduce((a,b)=>a+b,0);parent.weights=parent.weights.map(w=>w/sum);selected=firstLeaf(parent.children[Math.min(index,parent.children.length-1)]).id;}return {tree,selected,deleted};}
function bounded(value,fallback,min,max){const n=value===undefined?fallback:Number(value);if(!Number.isFinite(n)||n<min||n>max)throw new Error('Invalid numeric value');return n;}
export function validateProject(input){
  if(!input||input.format!=='stick-something'||input.version!==1)throw new Error('Unsupported project format');
  const canvas=input.canvas||{},width=bounded(canvas.width,840,32,4096),height=bounded(canvas.height,592,32,4096);
  if(!Number.isInteger(width)||!Number.isInteger(height)||!['rectangle','ellipse'].includes(canvas.shape))throw new Error('Invalid canvas');
  const ids=new Set();let count=0;
  function visit(n,depth=0){
    if(!n||typeof n!=='object'||depth>24||++count>1024||typeof n.id!=='string'||!/^[-\w]{1,80}$/.test(n.id)||ids.has(n.id))throw new Error('Invalid region structure');ids.add(n.id);
    const base={id:n.id,name:typeof n.name==='string'?n.name.slice(0,100):n.id};
    if(n.children!==undefined){if(!Array.isArray(n.children)||n.children.length<2||n.children.length>64||!['x','y'].includes(n.axis)||!Array.isArray(n.weights)||n.weights.length!==n.children.length||n.weights.some(w=>typeof w!=='number'||!Number.isFinite(w)||w<=0))throw new Error('Invalid partition');const sum=n.weights.reduce((a,b)=>a+b,0);if(!Number.isFinite(sum))throw new Error('Invalid weights');return {...base,axis:n.axis,weights:n.weights.map(w=>w/sum),children:n.children.map(c=>visit(c,depth+1))};}
    if(typeof n.text!=='string'||n.text.length>10000||!COLOR.test(n.bg)||!COLOR.test(n.fg)||typeof n.font!=='string'||n.font.length>200||!['stretch','auto','manual'].includes(n.fit)||!['horizontal','vertical'].includes(n.direction))throw new Error('Invalid text region');
    return {...base,text:n.text,bg:n.bg.toLowerCase(),fg:n.fg.toLowerCase(),font:n.font,fit:n.fit,direction:n.direction,fontSize:bounded(n.fontSize,64,4,1024),weight:bounded(n.weight,900,100,900),letterSpacing:bounded(n.letterSpacing,0,-10,50),lineHeight:bounded(n.lineHeight,1.15,.7,3),padding:bounded(n.padding,8,0,256),align:['left','center','right'].includes(n.align)?n.align:'center'};
  }
  const root=visit(input.root);if(root.id!=='root')throw new Error('Missing canvas root');
  return {format:'stick-something',version:1,name:typeof input.name==='string'?input.name.slice(0,100):'未命名',canvas:{width,height,shape:canvas.shape},root};
}
export function parseProject(text){if(text.length>20_000_000)throw new Error('Project too large');return validateProject(JSON.parse(text));}
export function serialFor(tree){return Math.max(10,...Array.from(getRects(tree).keys()).map(id=>Number(id.match(/^part-(\d+)$/)?.[1])||0));}
export function validateTheme(data){const keys=['background','panel','workspace','text','muted','border','field','accent','onAccent'];if(data?.version!==1||!data.colors||!keys.every(k=>COLOR.test(data.colors[k])))throw new Error('Invalid theme');return Object.fromEntries(keys.map(k=>[k,data.colors[k].toLowerCase()]));}
