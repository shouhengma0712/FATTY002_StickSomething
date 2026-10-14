import {getRects,findNode,STYLE_DEFAULTS} from './model.mjs';
import {FONT_FAMILIES} from './fonts.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const number=value=>Number(value.toFixed(4));
export function safeRegion(rect,width,height,shape,padding=0){
  let best={x:rect.x*width,y:rect.y*height,w:rect.w*width,h:rect.h*height};
  if(shape==='ellipse'){
    best={x:best.x,y:best.y,w:0,h:0};let area=0;
    for(let start=0;start<12;start++)for(let end=start+1;end<=12;end++){
      const top=rect.y+rect.h*start/12,bottom=rect.y+rect.h*end/12;
      const dy=Math.max(Math.abs(top-.5),Math.abs(bottom-.5));
      const half=.5*Math.sqrt(Math.max(0,1-4*dy*dy));
      const left=Math.max(rect.x,.5-half),right=Math.min(rect.x+rect.w,.5+half);
      const w=Math.max(0,(right-left)*width),h=(bottom-top)*height,candidate=Math.max(0,w-2*padding)*Math.max(0,h-2*padding);
      if(candidate>area){area=candidate;best={x:left*width,y:top*height,w,h};}
    }
  }
  return {x:best.x+padding,y:best.y+padding,w:Math.max(0,best.w-2*padding),h:Math.max(0,best.h-2*padding)};
}
function measured(ctx,text,size,node){ctx.font=`${node.weight} ${size}px ${FONT_FAMILIES[node.font]||node.font}`;if('letterSpacing' in ctx)ctx.letterSpacing=`${node.letterSpacing}px`;const result=ctx.measureText(text);const extra='letterSpacing' in ctx?0:Math.max(0,Array.from(text).length-1)*node.letterSpacing;return {...result,width:result.width+extra,ascent:result.actualBoundingBoxAscent||size*.8,descent:result.actualBoundingBoxDescent||size*.2};}
export function textLayout(raw,safe,ctx){
  const n={...STYLE_DEFAULTS,...raw},lines=n.text.split('\n'),vertical=n.direction==='vertical';
  if(!safe.w||!safe.h)return {items:[],overflow:Boolean(n.text),fontSize:0};
  const columns=lines.map(line=>Array.from(line)),rows=Math.max(1,...columns.map(c=>c.length));
  const fits=size=>vertical?{w:size*lines.length*n.lineHeight,h:rows*size+Math.max(0,rows-1)*n.letterSpacing}:{w:Math.max(0,...lines.map(line=>measured(ctx,line,size,n).width)),h:size+(lines.length-1)*size*n.lineHeight};
  let size=n.fontSize;
  if(n.fit!=='manual'){
    size=vertical?Math.min(safe.w/(lines.length*n.lineHeight),(safe.h-Math.max(0,rows-1)*n.letterSpacing)/rows):safe.h/(1+(lines.length-1)*n.lineHeight);
    if(n.fit==='auto'||vertical){let lo=0,hi=Math.max(0,size);for(let i=0;i<20;i++){const mid=(lo+hi)/2,b=fits(mid);if(b.w<=safe.w&&b.h<=safe.h)lo=mid;else hi=mid;}size=lo;}
  }
  size=Math.max(0,size);const block=fits(size),overflow=block.h>safe.h+.1||(n.fit!=='stretch'&&block.w>safe.w+.1);
  const items=[];
  if(vertical){const columnWidth=size*n.lineHeight,start=safe.x+(safe.w-columnWidth*lines.length)/2;columns.forEach((chars,i)=>{const colHeight=chars.length*size+Math.max(0,chars.length-1)*n.letterSpacing;const top=safe.y+(safe.h-colHeight)/2;chars.forEach((char,j)=>items.push({text:char,x:start+(lines.length-i-.5)*columnWidth,y:top+j*(size+n.letterSpacing)+size*.5,anchor:'middle',central:true}));});}
  else {const top=safe.y+(safe.h-block.h)/2;lines.forEach((line,i)=>{if(!line)return;const metrics=measured(ctx,line,size,n),displayWidth=n.fit==='stretch'?safe.w:metrics.width;const x=n.align==='left'?safe.x:n.align==='right'?safe.x+safe.w-displayWidth:safe.x+(safe.w-displayWidth)/2;items.push({text:line,x,y:top+i*size*n.lineHeight+(size-metrics.ascent-metrics.descent)/2+metrics.ascent,length:n.fit==='stretch'?safe.w:null,anchor:'start'});});}
  return {items,overflow,fontSize:size,node:n};
}
export function renderSvg(project,ctx,preview=null){
  const {width,height,shape}=project.canvas,rects=getRects(project.root),layouts=new Map(),parts=[],defs=[];
  defs.push(shape==='ellipse'?`<clipPath id="paper"><ellipse cx="${width/2}" cy="${height/2}" rx="${width/2}" ry="${height/2}"/></clipPath>`:`<clipPath id="paper"><rect width="${width}" height="${height}"/></clipPath>`);
  let index=0;
  for(const [id,r] of rects){const raw=findNode(project.root,id).node;if(raw.children)continue;const n={...STYLE_DEFAULTS,...raw};if(preview?.nodeId===id)n[preview.target]=preview.draft;
    const x=r.x*width,y=r.y*height,w=r.w*width,h=r.h*height,clip=`region-${index++}`;defs.push(`<clipPath id="${clip}"><rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}"/></clipPath>`);
    const safe=safeRegion(r,width,height,shape,n.padding),layout=textLayout(n,safe,ctx);layouts.set(id,layout);
    const family=escape(FONT_FAMILIES[n.font]||n.font);
    const texts=layout.items.map(t=>`<text x="${number(t.x)}" y="${number(t.y)}" font-family="${family}" font-size="${number(layout.fontSize)}" font-weight="${n.weight}" letter-spacing="${n.direction==='vertical'?0:n.letterSpacing}" fill="${n.fg}" text-anchor="${t.anchor}"${t.central?' dominant-baseline="central"':''}${t.length!==null&&t.length!==undefined?` textLength="${number(t.length)}" lengthAdjust="spacingAndGlyphs"`:''} xml:space="preserve">${escape(t.text)}</text>`).join('');
    parts.push(`<g data-region="${escape(id)}" clip-path="url(#${clip})"><rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" fill="${n.bg}"/>${texts}</g>`);
  }
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(project.name)}"><title>${escape(project.name)}</title><defs>${defs.join('')}</defs><g clip-path="url(#paper)">${parts.join('')}</g></svg>`,layouts};
}
export async function rasterize(svg,width,height){const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));}finally{URL.revokeObjectURL(url);}}
