"use strict";
(() => {
  const button = document.createElement('button'); button.className = 'command-button'; button.textContent = '去除底色';
  document.querySelector('.toolbar-left').append(button);
  const dialog = document.createElement('dialog'); dialog.className = 'studio-dialog';
  dialog.innerHTML = `<h2>纯色背景转透明</h2><p>默认只去除与画布边缘连通的底色，保护角色内部同色像素。绿色、紫色、黑白底均可自选。</p><label>背景颜色 <input id="keyColor" type="color" value="#00ff00"></label><label>颜色容差（0–255） <input id="keyTolerance" type="number" min="0" max="255" value="0"></label><label><input id="keyAll" type="checkbox"> 去除整张图中所有匹配颜色（含内部区域）</label><div class="studio-actions"><button id="keyCorner">读取左上角颜色</button><button id="keyApply">应用去底色</button><button id="keyRestore">恢复原图</button><button id="keyClose">关闭</button></div><p>应用后请重新识别选区。工程保存原图备份；源图片文件不会被修改。</p>`;
  document.body.append(dialog);
  button.onclick = () => { if (!state.sourceData) return toast('请先导入贴图。'); dialog.showModal(); };
  dialog.querySelector('#keyClose').onclick = () => dialog.close();
  dialog.querySelector('#keyCorner').onclick = () => { const p = sourceContext.getImageData(0,0,1,1).data; dialog.querySelector('#keyColor').value = '#' + [...p].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join(''); };
  function changed() { state.sourceData = sourceCanvas.toDataURL(); state.frames=[]; state.regions=[]; state.selectedRegion=-1; state.selectedFrame=-1; state.regionHistory=[]; state.regionFuture=[]; markDirty(); refreshUI(); }
  dialog.querySelector('#keyApply').onclick = () => {
    const backup = state.sourceOriginal || state.sourceData;
    const image = sourceContext.getImageData(0,0,sourceCanvas.width,sourceCanvas.height);
    const hex = dialog.querySelector('#keyColor').value;
    const rgb = [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
    const tolerance = Math.max(0,Math.min(255,Number(dialog.querySelector('#keyTolerance').value)||0));
    const {data,width:w,height:h}=image; const count=w*h;
    const matches = i => data[i*4+3]===0 || rgb.every((v,c)=>Math.abs(data[i*4+c]-v)<=tolerance);
    if (dialog.querySelector('#keyAll').checked) { for(let i=0;i<count;i++) if(matches(i)) data[i*4+3]=0; }
    else {
      const seen=new Uint8Array(count), queue=new Int32Array(count); let head=0,tail=0;
      const add=i=>{if(!seen[i]&&matches(i)){seen[i]=1;queue[tail++]=i;}};
      for(let x=0;x<w;x++){add(x);add((h-1)*w+x);} for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
      while(head<tail){const i=queue[head++];data[i*4+3]=0;if(i%w)add(i-1);if(i%w<w-1)add(i+1);if(i>=w)add(i-w);if(i<count-w)add(i+w);}
    }
    state.sourceOriginal=backup; sourceContext.putImageData(image,0,0); changed(); toast('底色已转透明，可以重新识别并拆分。'); dialog.close();
  };
  dialog.querySelector('#keyRestore').onclick = () => { if(!state.sourceOriginal)return toast('当前没有原图备份。'); const image=new Image();image.onload=()=>{sourceCanvas.width=image.width;sourceCanvas.height=image.height;sourceContext.drawImage(image,0,0);changed();dialog.close();};image.src=state.sourceOriginal; };
  const originalProjectData=projectData; projectData=()=>({...originalProjectData(),sourceOriginal:state.sourceOriginal||null,animationScene:state.animationScene||null});
  const originalApply=applyProjectData; applyProjectData=(project,...args)=>{state.sourceOriginal=project.sourceOriginal||null;state.animationScene=project.animationScene||null;return originalApply(project,...args);};
  const originalSet=setSourceImage; setSourceImage=(...args)=>{state.sourceOriginal=null;return originalSet(...args);};
  const originalBlank=initializeBlankSource; initializeBlankSource=(...args)=>{state.sourceOriginal=null;state.animationScene=null;return originalBlank(...args);};
})();
