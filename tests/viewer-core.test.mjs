import test from 'node:test';import assert from 'node:assert/strict';import {readFile}from 'node:fs/promises';
import {cameraFit,verifyGLB,downloadModel}from '../site/exterior/viewer-core.mjs';
const bound={min:[-.2,-.12,.2],max:[.2,.16,.92]};
test('hidden iframe and malformed bounds never generate an invalid camera',()=>{for(const [w,h]of [[0,0],[0,500],[1200,0],[Infinity,500]])assert.equal(cameraFit(bound,w,h),null);assert.equal(cameraFit({min:[0,0,NaN],max:[1,1,1]},900,500),null);assert.equal(cameraFit({min:[1,0,0],max:[0,1,1]},900,500),null);});
test('all object corners fit inside every view at narrow and very wide screen sizes',()=>{
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const d=Math.hypot(...a);return a.map(x=>x/d);},dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),tan=Math.tan(16*Math.PI/180);
 for(const [w,h]of [[390,640],[1920,700],[2400,360],[320,900]])for(const view of ['hero','front','rear','side','top']){
  const p=cameraFit(bound,w,h,view);assert.ok(p.position.every(Number.isFinite));const outward=norm(p.position.map((v,i)=>v-p.center[i])),right=norm(cross([0,0,1],outward)),up=cross(outward,right);
  for(const x of [bound.min[0],bound.max[0]])for(const y of [bound.min[1],bound.max[1]])for(const z of [bound.min[2],bound.max[2]]){const q=[x,y,z].map((v,i)=>v-p.position[i]),depth=-dot(q,outward);assert.ok(depth>p.near&&depth<p.far);assert.ok(Math.abs(dot(q,right))/(depth*tan*p.aspect)<1);assert.ok(Math.abs(dot(q,up))/(depth*tan)<1);}
 }
});
let bytes;
test('actual published exterior model has a complete GLB payload',async()=>{const b=await readFile(new URL('../site/exterior/models/SpineLink_P10_Exterior.glb',import.meta.url));bytes=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);assert.equal(verifyGLB(bytes),bytes);assert.throws(()=>verifyGLB(bytes.slice(0,100)),/长度/);assert.throws(()=>verifyGLB(new ArrayBuffer(4)),/不完整/);});
test('download reports progress and checks actual payload before parsing',async()=>{const parts=[new Uint8Array(bytes.slice(0,1000)),new Uint8Array(bytes.slice(1000))],progress=[];let i=0;const out=await downloadModel('demo.glb',{fetchFn:async()=>({ok:true,headers:new Headers({'content-length':String(bytes.byteLength)}),body:{getReader:()=>({read:async()=>i<parts.length?{done:false,value:parts[i++]}:{done:true}})}}),onProgress:(n,total)=>progress.push([n,total])});assert.equal(out.byteLength,bytes.byteLength);assert.equal(progress.length,2);assert.deepEqual(progress.at(-1),[bytes.byteLength,bytes.byteLength]);});
test('HTTP failures and stalled requests return actionable errors',async()=>{await assert.rejects(downloadModel('404.glb',{fetchFn:async()=>({ok:false,status:404})}),/HTTP 404/);await assert.rejects(downloadModel('stalled.glb',{timeoutMs:10,fetchFn:(_u,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))))}),/下载超时/);});
