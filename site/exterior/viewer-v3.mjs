import * as T from 'three';
import {OrbitControls} from '../vendor/controls/OrbitControls.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {cameraFit,downloadModel} from './viewer-core.mjs?v=20261109.3';
const $=id=>document.getElementById(id),ui=window.__exteriorUI,host=$('stage');
let renderer,root,controls,camera,scene,view='hero',active=true,loaded=false,contextLost=false,hasPose=false;const meshes=[];
function fit(){
 if(!root||!renderer)return false;const r=host.getBoundingClientRect(),w=Math.floor(r.width),h=Math.floor(r.height);if(!(w>1&&h>1))return false;
 root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root),pose=cameraFit({min:b.min.toArray(),max:b.max.toArray()},w,h,view);if(!pose)return false;
 renderer.setSize(w,h,false);camera.aspect=pose.aspect;camera.near=pose.near;camera.far=pose.far;camera.updateProjectionMatrix();controls.target.fromArray(pose.center);camera.position.fromArray(pose.position);camera.lookAt(controls.target);controls.minDistance=pose.extent*.35;controls.maxDistance=Math.max(4,pose.distance*5);controls.update();hasPose=true;return true;
}
function draw(){if(!active||!loaded||!hasPose||contextLost||!renderer)return;try{controls.update();renderer.render(scene,camera);if(!ui.isReady&&renderer.info.render.calls>0&&!renderer.getContext().isContextLost())ui.ready(meshes.length);}catch(e){loaded=false;ui.fail('三维绘制未完成：'+e.message);}}
async function start(){
 ui.progress('正在初始化三维图形…');
 try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'default',preserveDrawingBuffer:false});}catch{ui.fail('当前浏览器未能启动WebGL2三维图形。');return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.domElement.setAttribute('aria-label','SpineLink装置三维图形');host.append(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;ui.fail('三维图形会话中断。');});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;if(fit())draw();});
 scene=new T.Scene();scene.background=new T.Color('#f7f7f4');camera=new T.PerspectiveCamera(32,1,.001,10);camera.up.set(0,0,1);camera.position.set(1,1,1);scene.add(new T.HemisphereLight(0xffffff,0x999999,2.4));
 for(const [x,y,z,intensity]of [[-.6,.8,1.4,3],[.8,-.5,1.1,1.5]]){const l=new T.DirectionalLight(0xffffff,intensity);l.position.set(x,y,z);scene.add(l);}
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;new ResizeObserver(()=>{if(fit())draw();}).observe(host);
 const metaAbort=new AbortController(),metaTimer=setTimeout(()=>metaAbort.abort(),5000);
 const metadata=fetch(new URL('models/manifest.json',import.meta.url),{cache:'no-cache',signal:metaAbort.signal}).then(r=>r.ok?r.json():{parts:{}}).catch(()=>({parts:{}})).finally(()=>clearTimeout(metaTimer));
 try{
  const bytes=await downloadModel(new URL('models/SpineLink_P10_Exterior.glb',import.meta.url),{onProgress:(done,total)=>ui.progress('正在下载三维模型 · '+(total>0?Math.min(100,Math.round(done/total*100))+'% · ':'')+(done/1024**2).toFixed(1)+' MB')});
  ui.progress('模型已下载，正在准备三维画面…');const gltf=await new GLTFLoader().parseAsync(bytes,new URL('models/',import.meta.url).href),manifest=await metadata,keys=Object.keys(manifest.parts||{});root=gltf.scene;scene.add(root);
  root.traverse(m=>{if(!m.isMesh)return;let n=m,key;while(n){key=keys.find(k=>T.PropertyBinding.sanitizeNodeName(k)===n.name||k===n.name);if(key)break;n=n.parent;}const info=manifest.parts?.[key]||{label:'装置外观',group:'exterior'};m.userData={key:key||m.name,...info};
   const edit=material=>{const c=material.clone();c.side=T.DoubleSide;if(info.group!=='textile'){c.roughness=.65;c.metalness=.06;}return c;};m.material=Array.isArray(m.material)?m.material.map(edit):edit(m.material);meshes.push(m);
  });
  if(!meshes.length)throw Error('模型中未找到可显示的曲面');loaded=true;fit();
  // Keep the poster until an actual model frame is submitted, including after context restoration.
  draw();renderer.setAnimationLoop(draw);window.exteriorReady={revision:'public-reliable-3',count:meshes.length,exteriorOnly:true};
 }catch(e){ui.fail(e.message||'三维模型未能载入');}
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;ui.posterView(view);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));if(loaded){controls.autoRotate=false;$('rotate').textContent='自动旋转';if(fit())draw();}}));
$('reset').addEventListener('click',()=>{view='hero';ui.posterView(view);if(loaded&&fit())draw();});
$('rotate').onclick=()=>{if(!loaded||contextLost)return;controls.autoRotate=!controls.autoRotate;controls.autoRotateSpeed=.65;$('rotate').textContent=controls.autoRotate?'停止旋转':'自动旋转';};
function color(dark){if(!loaded)return;for(const m of meshes)if(m.userData.key.startsWith('spine_skin'))for(const mat of [m.material].flat()){mat.color.set(dark?'#676767':'#c9c9c5');mat.needsUpdate=true;}$('graphite').classList.toggle('on',dark);$('sage').classList.toggle('on',!dark);draw();}
$('sage').onclick=()=>color(false);$('graphite').onclick=()=>color(true);
$('save').onclick=()=>{const a=document.createElement('a');a.download='SpineLink_外观.png';if(ui.isReady){draw();a.href=renderer.domElement.toDataURL('image/png');}else a.href=$('poster').src;a.click();};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='spinelink-view-visibility')return;active=e.data.visible===true;if(active&&fit())draw();});
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active&&fit())draw();});window.addEventListener('resize',()=>{if(fit())draw();});
void start();
