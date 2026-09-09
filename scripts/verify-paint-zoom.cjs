const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true,backgroundThrottling:false}});const results=[];
try{for(const size of [[1440,920],[390,844],[844,390]]){
 w.setContentSize(...size);await w.loadFile(path.resolve(process.env.PIXEL_VERIFY_WEB_ROOT||'dist/win-unpacked/resources/app.asar/www','editor.html'));await new Promise(r=>setTimeout(r,400));
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const wait=()=>new Promise(r=>setTimeout(r,700)), stage=document.querySelector('#paintStage');
 const pixel=(x,y)=>{const b=paintCanvas.getBoundingClientRect();return [(x-b.left)/state.zoom,(y-b.top)/state.zoom];};
 const area=stage.closest('.workspace').getBoundingClientRect(),x=area.left+area.width*.6,y=area.top+area.height*.55;
 const before=pixel(x,y),original=paintCanvas.toDataURL();
 for(let i=0;i<5;i++)zoomPaintWithWheel({clientX:x,clientY:y,deltaY:-120,deltaMode:0,target:paintCanvas,preventDefault(){}});
 await wait();const after=pixel(x,y),b=paintCanvas.getBoundingClientRect();
 const checker=parseFloat(getComputedStyle(stage).backgroundSize),grid=parseFloat(stage.style.getPropertyValue('--pixel-x'));
 const location=canvasPoint({clientX:b.left+10.5*state.zoom,clientY:b.top+12.5*state.zoom});
 paintContext.clearRect(0,0,paintCanvas.width,paintCanvas.height);state.brush=1;state.tool='pencil';paintPoint(location.x,location.y);
 const ink=paintContext.getImageData(0,0,paintCanvas.width,paintCanvas.height).data;let painted=0;for(let i=3;i<ink.length;i+=4)if(ink[i])painted++;
 state.touchPoints=new Map([[1,{x:x-40,y}],[2,{x:x+40,y}]]);beginPaintGesture();const start=pixel(x,y);
 state.touchPoints=new Map([[1,{x:x-60+15,y:y+10}],[2,{x:x+60+15,y:y+10}]]);updatePaintGesture();await wait();const end=pixel(x+15,y+10);
 state.touchPoints.clear();state.gesture=null;
 const drift=Math.max(...before.map((v,i)=>Math.abs(v-after[i]))),touchDrift=Math.max(...start.map((v,i)=>Math.abs(v-end[i])));
 setZoom(1);const oneToOne=paintCanvas.getBoundingClientRect().width===paintCanvas.width;
 return {drift,touchDrift,checker,grid,scale:b.width/paintCanvas.width,location,painted,oneToOne,width:innerWidth,height:innerHeight};
 })()`);
 if(result.drift>.05||result.touchDrift>.05||Math.abs(result.checker/2-result.scale)>.01||Math.abs(result.grid-result.scale)>.01||result.location.x!==10||result.location.y!==12||result.painted!==1||!result.oneToOne)throw Error(JSON.stringify(result));results.push(result);
}fs.writeFileSync('artifacts/paint-zoom-verification.json',JSON.stringify({ok:true,results},null,2));app.exit(0);
}catch(e){fs.writeFileSync('artifacts/paint-zoom-verification.json',JSON.stringify({ok:false,error:e.stack,results},null,2));app.exit(1);}});
