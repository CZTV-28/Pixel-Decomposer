const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:920,webPreferences:{offscreen:true,backgroundThrottling:false}});const errors=[];
 w.webContents.on('console-message',(_e,level,msg)=>{if(level===3)errors.push(msg);});
 try{
 await w.loadFile(path.resolve(process.env.PIXEL_VERIFY_WEB_ROOT||'www','editor.html'));
 await new Promise(r=>setTimeout(r,600));
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const wait=()=>new Promise(r=>setTimeout(r,160));const assert=(ok,label)=>{if(!ok)throw Error(label);};
 assert(document.querySelector('.paint-editor>.feature-bar'),'toolbar has reserved space');
 state.color='#ff0000';paintPoint(3,3);commitCanvas();document.querySelector('#layerAdd').click();await wait();
 assert(currentFrame().layers.length===2,'add layer');state.color='#0000ff';paintPoint(6,6);commitCanvas();
 const pixel=(x,y)=>Array.from(compositeCanvas.getContext('2d').getImageData(x,y,1,1).data);
 assert(pixel(3,3)[0]===255&&pixel(6,6)[2]===255,'composite both layers');
 document.querySelector('#layerOpacity').value=50;document.querySelector('#layerOpacity').dispatchEvent(new Event('change'));await wait();assert(pixel(6,6)[3]===128,'opacity');
 undo();await wait();assert(pixel(6,6)[3]===255,'undo layer opacity');
 duplicateFrame();await wait();assert(state.frames.length===2&&currentFrame().layers.length===2,'duplicate frame layers');
 const saved=projectData();applyProject(JSON.parse(JSON.stringify(saved)));await renderCurrentFrame();assert(currentFrame().layers.length===2&&pixel(6,6)[2]===255,'project layers roundtrip');
 state.sourceEditFrameId=state.frames[0].id;state.source={name:'drawing.png',data:state.frames[0].data};const source=materializeSourceProject(projectData());assert(source.sourceDrawing.layers.length===2,'source layers save');applyProject(source);await renderCurrentFrame();assert(state.frames.length===2&&currentFrame().layers.length===2,'source frames restore');
 PixelAppearance.set({theme:'light',font:'130'});assert(document.documentElement.dataset.theme==='light','theme');assert(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim()==='1.3','font scale');PixelAppearance.set({theme:'dark',font:'auto'});
 document.querySelector('[data-studio-tool="smooth"]').click();document.querySelector('#studioBrush').value=5;const stage=document.querySelector('#paintStage');stage.setPointerCapture=()=>{};const rect=paintCanvas.getBoundingClientRect();const event=(type,x,y)=>stage.dispatchEvent(new PointerEvent(type,{bubbles:true,button:0,pointerId:44,clientX:rect.left+x*rect.width/paintCanvas.width,clientY:rect.top+y*rect.height/paintCanvas.height}));event('pointerdown',20,20);event('pointermove',30,20);event('pointerup',30,20);assert(paintContext.getImageData(25,20,1,1).data[3]>0,'round brush stroke');
 const layouts=[];return {layers:currentFrame().layers.length,frames:state.frames.length,roundBrush:true,layouts};
 })()`);
 for(const [width,height] of [[1440,920],[390,844],[844,390]]){
 w.setContentSize(width,height);await new Promise(r=>setTimeout(r,700));
 result.layouts.push(await w.webContents.executeJavaScript(`(()=>{const box=document.querySelector('.workspace').getBoundingClientRect(),bar=document.querySelector('.paint-editor>.feature-bar').getBoundingClientRect();return {width:innerWidth,height:innerHeight,canvasHeight:box.height,toolbarBottom:bar.bottom,canvasTop:box.top,overflow:document.documentElement.scrollWidth>innerWidth};})()`));
 }
 if(result.layouts.some(x=>x.canvasHeight<60||x.toolbarBottom>x.canvasTop+1||x.overflow))throw Error(JSON.stringify(result.layouts));
 if(errors.length)throw Error(errors.join('\n'));
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/drawing-layers-verification.json',JSON.stringify({ok:true,...result},null,2));app.exit(0);
 }catch(e){fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/drawing-layers-verification.json',JSON.stringify({ok:false,error:e.stack,errors},null,2));app.exit(1);}
});
