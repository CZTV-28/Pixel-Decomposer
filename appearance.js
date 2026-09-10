"use strict";
(() => {
 const key='pixel-decomposer-appearance-v1',media=matchMedia('(prefers-color-scheme: dark)');
 let options={theme:'system',font:'auto',glass:true};
 try{options={...options,...JSON.parse(localStorage.getItem(key)||'{}')};}catch{}
 function apply(){
  const mode=options.theme,hour=new Date().getHours();
  document.documentElement.dataset.theme=mode==='system'?(media.matches?'dark':'light'):mode==='schedule'?(hour>=7&&hour<19?'light':'dark'):mode==='light'?'light':'dark';
  document.documentElement.dataset.glass=String(options.glass!==false);
  const scale=options.font==='auto'?(innerWidth<600?1.08:1):Math.max(1,Math.min(1.5,Number(options.font)/100||1));
  document.documentElement.style.setProperty('--ui-scale',scale);
 }
 window.PixelAppearance={get:()=>({...options}),set:next=>{options={...options,...next};try{localStorage.setItem(key,JSON.stringify(options));}catch{}apply();}};
 media.addEventListener('change',apply);window.addEventListener('resize',apply);setInterval(apply,60000);apply();
 document.addEventListener('DOMContentLoaded',()=>{
  // Symbol plus label: controls stay readable without relying on hover.
  const icons={'去除底色':'pipette','绘画工具':'brush','直线':'minus','矩形':'square','椭圆':'circle','选区 / 移动':'scan','导入图片':'images','选择拆分帧':'list-plus','画布 / 部件动画':'layers','添加颜色':'plus','应用去底色':'check','恢复原图':'rotate-ccw','关闭':'x','编辑起点':'flag','编辑终点':'flag-triangle-right'};
  function decorate(root){root.querySelectorAll('button').forEach(b=>{if(b.querySelector('svg,i')||!icons[b.textContent.trim()])return;const i=document.createElement('i');i.dataset.lucide=icons[b.textContent.trim()];i.setAttribute('aria-hidden','true');b.prepend(i);});window.lucide?.createIcons();}
  decorate(document);document.addEventListener('click',()=>queueMicrotask(()=>decorate(document)));
  for(const p of document.querySelectorAll('.gif-guide')){
   const flow=document.createElement('div');flow.className='visual-workflow';flow.setAttribute('aria-hidden','true');
   for(const [i,name] of ['images','list-ordered','play','download'].entries()){const node=document.createElement('span');node.innerHTML=`<i data-lucide="${name}"></i><b>${i+1}</b>`;flow.append(node);if(i<3)flow.append(document.createTextNode('→'));}p.before(flow);
  }window.lucide?.createIcons();
 });
})();
