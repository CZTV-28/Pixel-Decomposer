const {app,BrowserWindow}=require('electron');
const fs=require('fs'),path=require('path');
const root=path.resolve(process.env.PIXEL_VERIFY_WEB_ROOT||'dist/win-unpacked/resources/app.asar/www');
app.whenReady().then(async()=>{
  const w=new BrowserWindow({show:false,width:1440,height:920,webPreferences:{offscreen:true,backgroundThrottling:false}});const report=[],errors=[];
  w.webContents.on('console-message',(_,level,message)=>{if(level===3)errors.push(message);});
  try{
    for(const size of [[1440,920],[390,844],[844,390]])for(const page of ['editor','gif']){
      w.setContentSize(...size);await w.loadFile(path.join(root,page+'.html'));
      await new Promise(r=>setTimeout(r,500));
      for(const locale of ['zh-CN','en','ja']){
        const result=await w.webContents.executeJavaScript(`(()=>{
          PixelI18n.setLanguage('${locale}');
          const b=document.querySelector('${page==='editor'?'.paint-more':'#openAnimationStudio'}');
          if(!b)throw Error('Missing feature entry');
          const r=b.getBoundingClientRect();
          if(r.width<40||r.height<30||r.top<0||r.bottom>innerHeight||r.right>innerWidth)throw Error('Feature entry clipped');
          if(!b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)))throw Error('Feature entry obscured');
          b.click();const d=document.querySelector('dialog[open]');
          if(!d)throw Error('Feature dialog did not open');
          if('${page}'==='gif'){
            const f=d.querySelector('.animation-footer').getBoundingClientRect();
            if(f.bottom>innerHeight||f.top<0)throw Error('Animation footer clipped');
            if(d.querySelector('details').open)throw Error('Advanced controls should start collapsed');
          }
          const count=d.querySelectorAll('button').length;
          if('${locale}'==='en'&&/[\u4e00-\u9fff]/.test(d.textContent))throw Error('Untranslated English feature panel');
          const title=d.querySelector('h2').textContent;
          return {buttons:count,title,width:innerWidth,height:innerHeight};
        })()`);
        await new Promise(r=>setTimeout(r,150));
        if(locale==='zh-CN')fs.writeFileSync(`artifacts/release-panel-${page}-${size[0]}.png`,(await w.webContents.capturePage()).toPNG());
        await w.webContents.executeJavaScript(`document.querySelector('dialog[open]').close();`);
        report.push({page,locale,...result});
      }
      await w.webContents.executeJavaScript(`(()=>{
        PixelI18n.setLanguage('zh-CN');const t=document.querySelector('[data-tip]');
        t.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
        const tip=document.querySelector('#global-tooltip'),r=tip.getBoundingClientRect();
        if(tip.hidden||r.top<0||r.bottom>innerHeight||r.right>innerWidth)throw Error('Tooltip clipped');
        if(!document.querySelector('.appbar svg'))throw Error('Missing toolbar icons');
      })()`);
      await new Promise(r=>setTimeout(r,150));
      fs.writeFileSync(`artifacts/release-ui-${page}-${size[0]}.png`,(await w.webContents.capturePage()).toPNG());
    }
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync('artifacts/release-ui-verification.json',JSON.stringify({ok:true,report,errors},null,2));app.exit(0);
  }catch(e){fs.writeFileSync('artifacts/release-ui-verification.json',JSON.stringify({ok:false,error:e.stack,report,errors},null,2));app.exit(1);}
});
