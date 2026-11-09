const directions={hero:[.48,1,.23],rear:[0,1,.02],front:[0,-1,.02],side:[1,0,.05],top:[0,.02,1]};
const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function cameraFit(bounds,width,height,view='hero',fov=32){
 if(!(width>1&&height>1)||!Number.isFinite(width+height))return null;
 if(!bounds||!bounds.min?.every(Number.isFinite)||!bounds.max?.every(Number.isFinite))return null;
 const size=bounds.max.map((v,i)=>v-bounds.min[i]);if(size.some(v=>v<0)||Math.max(...size)<=0)return null;
 const center=bounds.min.map((v,i)=>(v+bounds.max[i])/2),dir=norm(directions[view]||directions.hero),right=norm(cross([0,0,1],dir)),up=cross(dir,right),tan=Math.tan(fov*Math.PI/360),aspect=width/height;
 let distance=.1;
 for(const x of [-size[0]/2,size[0]/2])for(const y of [-size[1]/2,size[1]/2])for(const z of [-size[2]/2,size[2]/2]){const p=[x,y,z];distance=Math.max(distance,dot(p,dir)+1.14*Math.max(Math.abs(dot(p,right))/(tan*aspect),Math.abs(dot(p,up))/tan));}
 const extent=Math.max(...size);return {center,position:center.map((x,i)=>x+dir[i]*distance),distance,extent,aspect,near:Math.max(.0001,extent/1000),far:Math.max(10,distance+extent*5)};
}
export function verifyGLB(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<20)throw Error('模型文件不完整');const d=new DataView(bytes);
 if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==bytes.byteLength)throw Error('模型文件格式或长度不正确');return bytes;
}
export async function downloadModel(url,{onProgress=()=>{},timeoutMs=25000,fetchFn=fetch}={}){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeoutMs);
 try{const res=await fetchFn(url,{signal:abort.signal,cache:'no-cache'});if(!res.ok)throw Error('模型下载失败（HTTP '+res.status+'）');const total=Number(res.headers.get('content-length'))||0;
  if(!res.body?.getReader){const b=await res.arrayBuffer();onProgress(b.byteLength,total);return verifyGLB(b);}
  const reader=res.body.getReader(),chunks=[];let received=0;for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.byteLength;onProgress(received,total);}
  const result=new Uint8Array(received);let at=0;for(const c of chunks){result.set(c,at);at+=c.byteLength;}return verifyGLB(result.buffer);
 }catch(e){if(abort.signal.aborted)throw Error('模型下载超时');throw e;}finally{clearTimeout(timer);}
}
