const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true,backgroundThrottling:false}});try{
const results=[];
for(const [page,width,height] of [['index.html',1440,920],['editor.html',390,844],['editor.html',844,390],['settings.html',390,844],['gif.html',1440,920]]){
w.setContentSize(width,height);await w.loadFile(path.resolve('www',page));await new Promise(r=>setTimeout(r,500));
const data=await w.webContents.executeJavaScript(`(async()=>{const wait=()=>new Promise(r=>setTimeout(r,200));
if(location.pathname.endsWith('index.html')){dismissProjectStartDialogs();sourceCanvas.width=9;sourceCanvas.height=7;sourceContext.clearRect(0,0,9,7);sourceContext.fillStyle='#ff0000';sourceContext.fillRect(2,2,1,1);state.sourceData=sourceCanvas.toDataURL();state.sourceName='cleaned.png';state.frames=[];let got;downloadBlob=async blob=>{got=blob;return 'browser';};await exportSelectedPng();if(!got||got.type!=='image/png'||state.frames.length)throw Error('PNG without frames failed');const bmp=await createImageBitmap(got);if(bmp.width!==9||bmp.height!==7)throw Error('PNG dimensions');refreshUI();document.querySelector('#openChroma').click();document.querySelector('#keyClose').click();}
if(location.pathname.endsWith('editor.html')){document.querySelector('#drawingLayers').open=true;await wait();}
if(location.pathname.endsWith('settings.html')){PixelI18n.setLanguage('ja');PixelAppearance.set({theme:'light'});}
return {page:location.pathname,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};})()`);results.push(data);
await new Promise(r=>setTimeout(r,250));fs.writeFileSync('artifacts/appearance-'+page+'-'+width+'.png',(await w.webContents.capturePage()).toPNG());
}
fs.writeFileSync('artifacts/appearance-export-verification.json',JSON.stringify({ok:!results.some(r=>r.overflow),results},null,2));app.exit(results.some(r=>r.overflow)?1:0);
}catch(e){fs.writeFileSync('artifacts/appearance-export-verification.json',JSON.stringify({ok:false,error:e.stack}));app.exit(1);}});
