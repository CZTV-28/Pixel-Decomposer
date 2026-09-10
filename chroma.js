"use strict";
(() => {
  const t=s=>window.PixelI18n?.t(s)||s;
  const button=document.createElement('button');button.id='openChroma';button.className='command-button';button.textContent='去除底色';document.querySelector('.toolbar-left').append(button);
  const dialog=document.createElement('dialog');dialog.className='studio-dialog chroma-dialog';
  dialog.innerHTML=`<h2>多色背景转透明</h2><p>点击预览中的底色取色，可连续添加多种颜色。默认清除边缘和取色位置连通的区域，保留其他封闭区域。</p>
  <div class="studio-actions"><label>背景颜色 <input id="keyColor" type="color" value="#00ff00"></label><button id="keyAdd">添加颜色</button><button id="keyCorner">读取左上角颜色</button><label>颜色容差（0–255） <input id="keyTolerance" type="number" min="0" max="255" value="0"></label></div>
  <div id="keyColors" class="studio-actions"></div><p>点击颜色标签可移除。取错位置时，移除该颜色后重新取色。</p>
  <label><input id="keyAll" type="checkbox"> 去除整张图中所有匹配颜色（含内部区域）</label>
  <div class="studio-actions"><button id="keyZoomOut">缩小</button><label>预览倍率 <input id="keyZoom" type="number" min="25" max="1600" value="100">%</label><button id="keyZoomIn">放大</button><label><input id="keyCompare" type="checkbox"> 查看原图</label><span id="keyStatus" role="status"></span></div>
  <div class="chroma-preview"><canvas id="keyPreview" aria-label="点击底色取色"></canvas></div>
  <footer class="studio-actions chroma-footer"><button id="keyApply">应用去底色</button><button id="keyRestore">恢复原图</button><button id="keyClose">关闭</button></footer><p>应用会清空当前拆分结果与选区。工程保留原图备份；关闭预览不会修改贴图。</p>`;
  document.body.append(dialog);const q=id=>dialog.querySelector('#'+id),preview=q('keyPreview');
  let colors=[],seeds=[],zoom=1,previewFrame=0;
  const hex=p=>'#'+[...p].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
  function renderColors(){q('keyColors').replaceChildren();colors.forEach(color=>{const b=document.createElement('button');b.textContent=color.toUpperCase()+' ×';b.style.borderLeft='12px solid '+color;b.onclick=()=>{colors=colors.filter(c=>c!==color);seeds=seeds.filter(s=>s.color!==color);renderColors();schedule();};q('keyColors').append(b);});}
  function add(color,seed){if(!colors.includes(color)){if(colors.length>=24)return;colors.push(color);}if(seed&&!seeds.some(s=>s.x===seed.x&&s.y===seed.y))seeds.push({...seed,color});q('keyColor').value=color;renderColors();schedule();}
  function process(){
    const image=sourceContext.getImageData(0,0,sourceCanvas.width,sourceCanvas.height),{data,width:w,height:h}=image,count=w*h;
    const selected=colors.length?colors:[q('keyColor').value],rgb=selected.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
    const tolerance=Math.max(0,Math.min(255,Number(q('keyTolerance').value)||0));
    const matches=i=>data[i*4+3]===0||rgb.some(color=>color.every((v,c)=>Math.abs(data[i*4+c]-v)<=tolerance));
    if(q('keyAll').checked){for(let i=0;i<count;i++)if(matches(i))data[i*4+3]=0;}
    else{const seen=new Uint8Array(count),queue=new Int32Array(count);let head=0,tail=0;
      const add=i=>{if(i>=0&&i<count&&!seen[i]&&matches(i)){seen[i]=1;queue[tail++]=i;}};
      for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}for(const s of seeds)if(s.x<w&&s.y<h)add(s.y*w+s.x);
      while(head<tail){const i=queue[head++];data[i*4+3]=0;if(i%w)add(i-1);if(i%w<w-1)add(i+1);if(i>=w)add(i-w);if(i<count-w)add(i+w);}
    }return image;
  }
  function render(){previewFrame=0;if(!dialog.open)return;preview.width=sourceCanvas.width;preview.height=sourceCanvas.height;const ctx=preview.getContext('2d');if(q('keyCompare').checked)ctx.drawImage(sourceCanvas,0,0);else ctx.putImageData(process(),0,0);preview.style.width=preview.width*zoom+'px';preview.style.height=preview.height*zoom+'px';q('keyZoom').value=Math.round(zoom*100);}
  function schedule(){if(!previewFrame)previewFrame=requestAnimationFrame(render);}
  function reset(){colors=[];seeds=[];renderColors();}
  button.onclick=()=>{if(!state.sourceData)return toast('请先导入贴图。');dialog.showModal();zoom=Math.min(1,Math.max(.25,(dialog.clientWidth-48)/sourceCanvas.width));render();};
  q('keyClose').onclick=()=>dialog.close();q('keyAdd').onclick=()=>add(q('keyColor').value);
  q('keyCorner').onclick=()=>{const p=sourceContext.getImageData(0,0,1,1).data;if(p[3])add(hex(p),{x:0,y:0});};
  preview.onclick=e=>{const b=preview.getBoundingClientRect(),x=Math.floor((e.clientX-b.left)*preview.width/b.width),y=Math.floor((e.clientY-b.top)*preview.height/b.height);if(x<0||y<0||x>=preview.width||y>=preview.height)return;const p=sourceContext.getImageData(x,y,1,1).data;if(!p[3]){q('keyStatus').textContent=t('此处已经透明，请选择有颜色的位置。');return;}add(hex(p),{x,y});q('keyStatus').textContent=hex(p).toUpperCase()+` · X ${x} / Y ${y}`;};
  for(const id of ['keyColor','keyTolerance','keyAll','keyCompare'])q(id).addEventListener('input',schedule);
  function setZoom(v){zoom=Math.max(.25,Math.min(16,v||1));schedule();}
  q('keyZoom').onchange=()=>setZoom(Number(q('keyZoom').value)/100);q('keyZoomIn').onclick=()=>setZoom(zoom*1.25);q('keyZoomOut').onclick=()=>setZoom(zoom/1.25);
  function changed(){state.sourceData=sourceCanvas.toDataURL();state.frames=[];state.regions=[];state.selectedRegion=-1;state.selectedFrame=-1;state.regionHistory=[];state.regionFuture=[];markDirty();refreshUI();}
  q('keyApply').onclick=()=>{if(!state.sourceData)return;const backup=state.sourceOriginal||state.sourceData;const image=process();state.sourceOriginal=backup;sourceContext.putImageData(image,0,0);changed();reset();dialog.close();toast('底色已转透明，可以重新识别并拆分。');};
  q('keyRestore').onclick=()=>{if(!state.sourceOriginal)return toast('当前没有原图备份。');const im=new Image();im.onload=()=>{sourceCanvas.width=im.width;sourceCanvas.height=im.height;sourceContext.drawImage(im,0,0);changed();reset();dialog.close();};im.src=state.sourceOriginal;};
  const originalProjectData=projectData;projectData=()=>({...originalProjectData(),sourceOriginal:state.sourceOriginal||null,animationScene:state.animationScene||null});
  const originalApply=applyProjectData;applyProjectData=(project,...args)=>{reset();state.sourceOriginal=project.sourceOriginal||null;state.animationScene=project.animationScene||null;return originalApply(project,...args);};
  const originalSet=setSourceImage;setSourceImage=(...args)=>{reset();state.sourceOriginal=null;return originalSet(...args);};
  const originalBlank=initializeBlankSource;initializeBlankSource=(...args)=>{reset();state.sourceOriginal=null;state.animationScene=null;return originalBlank(...args);};
})();
