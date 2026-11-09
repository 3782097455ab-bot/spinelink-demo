const base=new URL('./',import.meta.url),$=s=>document.querySelector(s);
const urls={desktop:new URL('index.html',base),mobile:new URL('mobile/index.html',base),exterior:new URL('exterior/index.html',base),anatomy:new URL('anatomy/index.html',base),credits:new URL('anatomy/来源与模型说明.html',base)};
document.querySelectorAll('[data-link]').forEach(a=>a.href=urls[a.dataset.link]);
document.querySelectorAll('[data-image]').forEach(a=>a.src=new URL('images/'+a.dataset.image,base));
const panels=['exterior','anatomy','activity','about'];
function show(name){if(!panels.includes(name))name='exterior';for(const id of panels){$('#panel-'+id).hidden=id!==name;$('#tab-'+id).setAttribute('aria-selected',String(id===name));}const frame=$('#panel-'+name+' iframe');if(frame&&!frame.src)frame.src=urls[name];document.title='SpineLink · '+{exterior:'装置外观',anatomy:'解剖图谱',activity:'活动演示',about:'项目介绍'}[name];}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.tab;show(b.dataset.tab);});
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
show(location.hash.slice(1)||(document.body.classList.contains('mobile')?'activity':'exterior'));
const key='spinelink-public-demo-20261109';let records=[];
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))records=saved.filter(r=>r.source==='SIMULATED'&&Number.isFinite(r.duration)&&Number.isFinite(r.cycles)).slice(0,60);}catch{}
let run=null,samples=[];const canvas=$('#chart'),ctx=canvas.getContext('2d');
function persist(){try{localStorage.setItem(key,JSON.stringify(records));return true;}catch{$('#activity-status').textContent='浏览器未能保存，请导出当前演示记录。';return false;}}
function rows(){const list=$('#records');list.replaceChildren();if(!records.length){const p=document.createElement('li');p.className='empty';p.textContent='开始一段演示，结束后会出现在这里。';list.append(p);return;}for(const row of records.slice(0,8)){const li=document.createElement('li'),a=document.createElement('span'),b=document.createElement('span');a.textContent=new Date(row.at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});b.textContent=Math.floor(row.duration)+' 秒 · '+row.cycles+' 次模拟往返';li.append(a,b);list.append(li);}}
function chart(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,rect.width*dpr);canvas.height=rect.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#dde6da';ctx.lineWidth=1;for(let i=1;i<4;i++){const y=h*i/4;ctx.beginPath();ctx.moveTo(12,y);ctx.lineTo(w-12,y);ctx.stroke();}ctx.strokeStyle='#4b8471';ctx.lineWidth=2.2;ctx.beginPath();samples.forEach((p,i)=>{const x=12+i/119*(w-24),y=h-18-p*(h-36);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
$('#start').onclick=()=>{if(run)return;run={start:performance.now(),at:Date.now()};samples=[];$('#start').disabled=true;$('#stop').disabled=false;$('#activity-status').textContent='正在播放模拟动作；可以随时结束并保存。';};
function stop(reason='本次演示已保存。'){if(!run)return;const duration=(performance.now()-run.start)/1000;records.unshift({source:'SIMULATED',at:run.at,duration:Math.round(duration*10)/10,cycles:Math.floor(duration/4)});records=records.slice(0,60);run=null;const ok=persist();rows();$('#start').disabled=false;$('#stop').disabled=true;if(ok)$('#activity-status').textContent=reason;}
$('#stop').onclick=()=>stop();
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({schema:'spinelink-public-demo/1',source:'SIMULATED',exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='SpineLink_模拟活动记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);$('#activity-status').textContent='演示记录已导出。';};
function tick(){if(!run)return;const t=(performance.now()-run.start)/1000,phase=(1-Math.cos(t*Math.PI/2))/2;$('#duration').textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');$('#cycles').textContent=Math.floor(t/4);$('#phase').textContent=Math.round(phase*100)+'%';samples.push(phase);if(samples.length>120)samples.shift();chart();}
setInterval(tick,100);new ResizeObserver(chart).observe(canvas);rows();chart();
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('页面进入后台，本段演示已自动保存。');});window.addEventListener('pagehide',()=>stop());
const answers=[
 [/这是什么|介绍|项目|功能|原理/,'SpineLink 是围绕肩带前伸与回收动作开展的肩颈康复辅助系统项目。公开站展示装置外观、骨骼与肌肉筋膜的空间关系，以及活动记录的使用方式。项目由田阳、周建宇共同提出并推进。'],
 [/筋膜|肌肉|骨骼|解剖|肩胛|局部/,'打开上方“解剖图谱”，可在全身、肩颈、颈椎、肩关节、肩胛周围和筋膜之间切换。右侧可显示或隐藏组织层，拖动模型旋转、滚轮缩放。图谱使用有许可的 Z-Anatomy / BodyParts3D 参考解剖数据。'],
 [/手机|移动|电脑|链接|分享/,'本网站可以通过链接在别人的电脑或手机浏览器中打开。右上方“手机入口”采用竖屏布局。三维图谱首次载入的数据较多，请等待载入提示结束。'],
 [/记录|数据|保存|导出|隐私/,'活动演示的数据由浏览器生成，标记为 SIMULATED。结束一段演示后，记录保存在当前浏览器；“导出记录”可下载JSON备份。公开演示没有账号或云端同步，也不会把记录上传到本项目服务器。'],
 [/蓝牙|连接|真实|设备|测量/,'当前公开网页展示模拟活动。设备通信与完整本地平台保留在项目的私有工程中；公开演示不会把模拟数据标记为真实设备测量。'],
 [/模型|ai|大模型|问答|图片|api/,'这里是根据公开项目介绍回答问题的本地问答。完整平台的外部模型与多模态接口由私有工程维护；公开站不收集API密钥。'],
 [/专利|源码|图纸|内部|下载|工程/,'公开演示提供外观和解剖展示。完整工程图、内部机构、计算与知识产权准备材料保存在项目私有仓库。'],
 [/痛|不适|治疗|诊断/,'公开页面演示产品界面和动作关系。若在实际活动中感到不适，请先停止动作，并向专业人员说明情况。']
];
function message(text,user=false){const box=$('#chat'),p=document.createElement('div');p.className='message'+(user?' user':'');const small=document.createElement('small');small.textContent=user?'你':'康复洋阳 · 项目问答';const span=document.createElement('span');span.textContent=text;p.append(small,span);box.append(p);box.scrollTop=box.scrollHeight;}
function ask(q){q=q.trim().slice(0,300);if(!q)return;message(q,true);const match=answers.find(([re])=>re.test(q));message(match?match[1]:'我可以介绍SpineLink项目、三维外观、解剖图谱、手机查看和模拟记录。选择上方问题，或告诉我你想看哪一部分。');$('#question').value='';}
$('#ask-form').onsubmit=e=>{e.preventDefault();ask($('#question').value);};document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>ask(b.dataset.question));
message('你好，我是康复洋阳。可以陪你了解装置外观、图谱和活动演示。这里使用公开项目条目回答问题。');
window.publicDemo={getState:()=>({running:!!run,records:[...records],source:'SIMULATED'}),show};
