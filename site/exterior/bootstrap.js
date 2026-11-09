(()=>{
 const status=document.getElementById('load-status'),poster=document.getElementById('poster'),retry=document.getElementById('retry');let ready=false;
 const posters={hero:'hero',rear:'rear',front:'front',side:'side',top:'hero'};
 function posterView(view){poster.src='../images/'+(posters[view]||'hero')+'.png';}
 function fail(reason){ready=false;document.body.dataset.mode='poster';status.textContent=reason+' 当前显示外观图片，可切换前后视图或重新加载。';retry.hidden=false;for(const id of ['rotate','sage','graphite'])document.getElementById(id).disabled=true;}
 window.__exteriorUI={get isReady(){return ready;},posterView,fail,progress(text){if(!ready)status.textContent=text;},ready(count){ready=true;document.body.dataset.mode='3d';status.textContent='三维已显示 · '+count+'个外观曲面';retry.hidden=true;document.getElementById('detail').textContent='拖动旋转 · 滚轮缩放 · 切换视角';for(const id of ['rotate','sage','graphite'])document.getElementById(id).disabled=false;}};
 retry.onclick=()=>location.reload();
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{posterView(b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));}));
 document.getElementById('reset').addEventListener('click',()=>posterView('hero'));
 document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.download='SpineLink_外观.png';a.href=poster.src;a.click();};
 const watchdog=setTimeout(()=>{if(!ready)fail('三维尚未启动，可能仍在下载或浏览器图形未就绪。');},35000);
 import('./viewer-v3.mjs?v=20261109.3').catch(()=>{clearTimeout(watchdog);fail('三维程序未能启动，请检查网络或浏览器图形支持。');});
 window.addEventListener('error',e=>{if(!ready&&/viewer|WebGL|three/i.test(e.message||''))fail('三维程序出现错误。');});
})();
