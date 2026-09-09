const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false});
 try{
  await w.loadFile(path.resolve('dist/win-unpacked/resources/app.asar/www/gif.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const pause=()=>new Promise(r=>setTimeout(r,100));
   const asset=(name,color)=>{const c=document.createElement('canvas');c.width=4;c.height=4;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,4,4);return {name,data:c.toDataURL(),width:4,height:4};};
   state.availableFrames=[asset('body','#ff0000'),asset('head','#0000ff')];
   document.querySelector('#openAnimationStudio').click();
   const q=id=>document.querySelector('#'+id),change=(id,v)=>{q(id).value=v;q(id).dispatchEvent(new Event('change'));};
   q('aSource').click();await pause();change('ay',140);
   change('aSources',1);q('aSource').click();await pause();q('aKey').click();
   change('at',1);change('ax',180);q('aBake').click();await new Promise(r=>setTimeout(r,600));
   const pixel=async(f,x,y)=>{const im=new Image();im.src=f.data;await im.decode();const c=document.createElement('canvas');c.width=f.width;c.height=f.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return [...ctx.getImageData(x,y,1,1).data];};
   const first=state.frames[0],last=state.frames.at(-1);
   return {count:state.frames.length,bodyStart:await pixel(first,120,140),bodyEnd:await pixel(last,120,140),headStart:await pixel(first,120,120),headEnd:await pixel(last,174,120),headOldPosition:await pixel(last,120,120),transparent:await pixel(first,0,0),bodyKeys:state.project.animationScene.layers[0].keys.length,headKeys:state.project.animationScene.layers[1].keys.length};
  })()`);
  const equals=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(result.count!==10||result.bodyKeys!==0||result.headKeys!==2||!equals(result.bodyStart,[255,0,0,255])||!equals(result.bodyEnd,result.bodyStart)||!equals(result.headStart,[0,0,255,255])||!equals(result.headEnd,result.headStart)||result.headOldPosition[3]!==0||result.transparent[3]!==0)throw Error(JSON.stringify(result));
  fs.writeFileSync('artifacts/composite-verification.json',JSON.stringify({ok:true,...result},null,2));app.exit(0);
 }catch(e){fs.writeFileSync('artifacts/composite-verification.json',JSON.stringify({ok:false,error:e.stack}));app.exit(1);}
});
