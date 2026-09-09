const fs=require('fs'),crypto=require('crypto'),JSZip=require('jszip'),asar=require('@electron/asar');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const apk='release/Pixel DecomposerV0.1.4.apk',exe='dist/Pixel Decomposer Setup 0.1.4.exe';
 const zip=await JSZip.loadAsync(fs.readFileSync(apk));const files=[];
 for(const name of ['index.html','editor.html','gif.html','settings.html','app.js','editor.js','gif.js','paint-tools.js','animation-studio.js','chroma.js','i18n.js','styles.css']){
  const web=hash(fs.readFileSync('www/'+name));
  const win=hash(asar.extractFile('dist/win-unpacked/resources/app.asar','www/'+name));
  const android=hash(await zip.file('assets/public/'+name).async('nodebuffer'));
  if(web!==win||web!==android)throw Error('Bundle mismatch: '+name);
  files.push({name,sha256:web});
 }
 const artifacts=[apk,exe].map(file=>({file,bytes:fs.statSync(file).size,sha256:hash(fs.readFileSync(file))}));
 fs.writeFileSync('artifacts/bundle-verification.json',JSON.stringify({ok:true,files,artifacts},null,2));
 console.log(JSON.stringify({ok:true,matchedFiles:files.length,artifacts},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
