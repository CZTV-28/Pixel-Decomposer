"use strict";
window.PixelLayers=(()=>{
 const images=new Map();
 const make=(data,name='Layer 1')=>({id:crypto.randomUUID(),name,data,visible:true,locked:false,opacity:1});
 function ensure(frame){if(!Array.isArray(frame.layers)||!frame.layers.length)frame.layers=[make(frame.data)];frame.activeLayer=Math.max(0,Math.min(frame.layers.length-1,frame.activeLayer||0));return frame.layers;}
 function active(frame){return ensure(frame)[frame.activeLayer];}
 function image(data){if(!images.has(data)){const p=new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Layer image could not be loaded'));i.src=data;});images.set(data,p);if(images.size>96)images.delete(images.keys().next().value);}return images.get(data);}
 function snapshot(frame){return {id:frame.id,name:frame.name,data:frame.data,width:frame.width,height:frame.height,layers:structuredClone(ensure(frame)),activeLayer:frame.activeLayer,duration:frame.duration||.12};}
 return {make,ensure,active,image,snapshot};
})();
