
// Navigation
function showSc(id){document.querySelectorAll('.sc').forEach(s=>s.classList.remove('active','visible'));const s=document.getElementById(id);s.classList.add('active');requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add('visible')));}
function goHome(){showSc('sl');}
function showStats(){showSc('ss');if(!loaded)loadStats();}
function showLinEmpty(){showSc('slin');document.getElementById('lnm').textContent='Select an artist';document.getElementById('lsub').textContent='Go to Statistics → tap any artist';document.getElementById('lload').style.display='none';document.getElementById('lsvg').style.display='none';}
function goBack(){showSc('ss');}

function goToStats(){showSc('ss');if(!loaded)loadStats();}

let lbLoaded=false,allBridges=[];
async function loadLivingBridges(){
  const grid=document.getElementById('lb-grid');
  if(!grid)return;
  grid.innerHTML='<div class="lsc"><div class="lsp">✦</div><div class="ltx">Loading…</div></div>';
  try{
    const{data:bdg}=await db.from('badges').select('id').eq('code','living_bridge').single();
    if(!bdg){grid.innerHTML='<div class="lb-empty">Badge not configured.</div>';return;}
    const{data:pbs}=await db.from('profile_badges').select('profile_id').eq('badge_id',bdg.id);
    if(!pbs||!pbs.length){grid.innerHTML='<div class="lb-empty">No Living Bridge artists assigned.</div>';return;}
    const ids=pbs.map(b=>b.profile_id).filter(Boolean);
    const{data:profiles,error:pe}=await db.from('profiles').select('id,full_name,primary_role,current_country,instrument_aliases,is_deceased').in('id',ids).order('full_name');
    if(pe||!profiles||!profiles.length){grid.innerHTML='<div class="lb-empty">Could not load profiles: '+(pe?pe.message:'empty')+'</div>';return;}
    const{data:links}=await db.from('guru_shishya_lineage').select('shishya_id,guru_id,discipline').in('shishya_id',ids).neq('discipline','Heritage');
    const guruIds=[...new Set((links||[]).map(l=>l.guru_id).filter(Boolean))];
    let gm={};
    if(guruIds.length){const{data:gps}=await db.from('profiles').select('id,full_name,is_deceased').in('id',guruIds);(gps||[]).forEach(g=>{if(g)gm[g.id]=g;});}
    allBridges=profiles.map(p=>{
      const gl=(links||[]).filter(l=>l.shishya_id===p.id).map(l=>({...(gm[l.guru_id]||{}),discipline:l.discipline})).filter(g=>g&&g.full_name);
      return{...p,myGurus:gl,historicalGurus:gl.filter(g=>g.is_deceased),livingGurus:gl.filter(g=>!g.is_deceased)};
    }).sort((a,b)=>b.historicalGurus.length-a.historicalGurus.length||(a.full_name||'').localeCompare(b.full_name||''));
    lbLoaded=true;renderBridges(allBridges);
  }catch(e){console.error('LB:',e);const g=document.getElementById('lb-grid');if(g)g.innerHTML='<div class="lb-empty">Error: '+(e.message||e)+'</div>';}
}
function filterBridges(type,btn){
  document.querySelectorAll('.lb-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  let f=allBridges;
  if(type==='vocal')f=f.filter(p=>(p.primary_role||'').toLowerCase().includes('vocal'));
  else if(type==='violin')f=f.filter(p=>(p.instrument_aliases||[]).some(i=>(i||'').toLowerCase().includes('violin')));
  else if(type==='mridangam')f=f.filter(p=>(p.instrument_aliases||[]).some(i=>(i||'').toLowerCase().includes('mridangam')));
  else if(type==='india')f=f.filter(p=>p.current_country==='India');
  else if(type==='singapore')f=f.filter(p=>p.current_country==='Singapore');
  renderBridges(f);
}
function renderBridges(bridges){
  const grid=document.getElementById('lb-grid');if(!grid)return;
  if(!bridges.length){grid.innerHTML='<div class="lb-empty">No artists match.</div>';return;}
  let out='';
  for(let i=0;i<bridges.length;i++){
    const p=bridges[i];
    const sn=(p.full_name||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const sr=(p.primary_role||'').replace(/'/g,"\\'");
    let ins='';if(p.instrument_aliases){let a=p.instrument_aliases;if(typeof a==='string'){try{a=JSON.parse(a);}catch{}}if(Array.isArray(a))ins=a.filter(x=>x&&x!=='Vocal').slice(0,2).join(', ');}
    let ht='';(p.historicalGurus||[]).forEach(g=>{ht+='<span class="lb-guru-tag historical">✦ '+g.full_name+'</span>';});
    let lt='';(p.livingGurus||[]).forEach(g=>{lt+='<span class="lb-guru-tag">'+g.full_name+'</span>';});
    out+='<div class="lb-card" onclick="openLin(\''+sn+'\',\''+sr+'\',\'\')">'+
      '<div class="lb-badge">✦ LIVING BRIDGE</div>'+
      '<div class="lb-name">'+(p.full_name||'')+'</div>'+
      '<div class="lb-role">'+(p.primary_role||'')+(ins?' · '+ins:'')+(p.current_country?' · '+p.current_country:'')+'</div>'+
      '<div class="lb-gurus-title" style="margin:8px 0 3px;">HISTORICAL MASTERS</div><div>'+ht+'</div>'+
      (lt?'<div class="lb-gurus-title" style="margin:8px 0 3px;">LIVING GURUS</div><div>'+lt+'</div>':'')+
      '<div class="lb-stat-row">'+
        '<div class="lb-stat"><div class="lb-stat-num">'+((p.historicalGurus||[]).length)+'</div><div class="lb-stat-lbl">HISTORICAL</div></div>'+
        '<div class="lb-stat"><div class="lb-stat-num">'+((p.livingGurus||[]).length)+'</div><div class="lb-stat-lbl">LIVING</div></div>'+
        '<div class="lb-stat"><div class="lb-stat-num">'+((p.myGurus||[]).length)+'</div><div class="lb-stat-lbl">TOTAL</div></div>'+
      '</div><div class="lb-arrow">›</div></div>';
  }
  grid.innerHTML=out;
}

window.addEventListener('load',()=>showSc('sl'));

// View tab switching
function switchView(name, btn){
  document.querySelectorAll('.vtab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('view-'+name).classList.add('active');
  if(name==='lineages' && allBaniGurus.length===0) loadBaniGurus();
  if(name==='bridges'&&!lbLoaded)loadLivingBridges();
  if(name==='kshetra') setTimeout(()=>kmInit(), 250);
}

// Animate number
function animN(el,t,delay){
  setTimeout(()=>{
    const s=performance.now(),d=1000;
    function tk(now){const p=Math.min((now-s)/d,1),e2=1-Math.pow(1-p,3);el.textContent=Math.round(e2*t).toLocaleString();if(p<1)requestAnimationFrame(tk);}
    requestAnimationFrame(tk);
  },delay);
}

// Load all stats
async function loadStats(){
  try{
    // Load profiles
    const{data:p}=await db.from('profiles').select('id,full_name,primary_role,current_country,instrument_aliases,is_deceased').eq('is_deceased',false).not('current_country','is',null).order('full_name');
    profs=p||[];
    profs.forEach(x=>{const c=x.current_country;if(!cg[c])cg[c]=[];cg[c].push(x);});

    // Summary counts
    const r1=await db.from('profiles').select('*',{count:'exact',head:true});
    const r2=await db.from('guru_shishya_lineage').select('*',{count:'exact',head:true});
    const r3=await db.from('guru_shishya_lineage').select('*',{count:'exact',head:true}).eq('handshake_status','accepted');
    const total=r1.count||0,links=r2.count||0,accepted=r3.count||0;

    // Hero pills
    const pills=[
      {n:total,l:'Profiles'},{n:links,l:'Lineage Links'},
      {n:accepted,l:'Verified'},{n:Object.keys(cg).length,l:'Countries'}
    ];
    document.getElementById('hero-pills').innerHTML=pills.map(p=>`
      <div class="hpill">
        <div class="hpill-num" data-t="${p.n}">—</div>
        <div class="hpill-lbl">${p.l}</div>
      </div>`).join('');
    document.querySelectorAll('.hpill-num').forEach((el,i)=>animN(el,parseInt(el.dataset.t)||0,i*100));

    // Category counts
    const sr=await Promise.all(SAD.map(c=>c.q()));
    const pr=await Promise.all(PRA.map(c=>c.q()));

    // Build sadhaka grid — FIX 2: grey inactive tiles
    document.getElementById('sadhaka-grid').innerHTML=SAD.map((c,i)=>{
      const n=sr[i]||0, inactive=n<MIN_ACTIVE;
      const cls=inactive?'cat-card inactive':'cat-card';
      const badge=inactive?`<div class="inactive-badge">Coming soon</div>`:`<div class="cat-card-arrow">Explore →</div>`;
      return`<div class="${cls}" data-pk="s" data-ck="${c.k}" data-l="${c.l}" data-e="${c.e}" ${inactive?'':'style="cursor:pointer;"'} onclick="handleCatClick(this)">
        <div class="cat-card-icon">${c.ic}</div>
        <div class="cat-card-num" data-t="${n}">—</div>
        <div class="cat-card-name">${c.l}</div>
        <div class="cat-card-sub">${c.e}</div>
        ${badge}
      </div>`;
    }).join('');

    // Build pratisthana grid — FIX 2: grey inactive tiles
    document.getElementById('pratisthana-grid').innerHTML=PRA.map((c,i)=>{
      const n=pr[i]||0, inactive=n<MIN_ACTIVE;
      const cls=inactive?'cat-card inactive':'cat-card';
      const badge=inactive?`<div class="inactive-badge">Coming soon</div>`:`<div class="cat-card-arrow">Explore →</div>`;
      return`<div class="${cls}" data-pk="p" data-ck="${c.k}" data-l="${c.l}" data-e="${c.e}" ${inactive?'':'style="cursor:pointer;"'} onclick="handleCatClick(this)">
        <div class="cat-card-icon">${c.ic}</div>
        <div class="cat-card-num" data-t="${n}">—</div>
        <div class="cat-card-name">${c.l}</div>
        <div class="cat-card-sub">${c.e}</div>
        ${badge}
      </div>`;
    }).join('');

    // Animate category numbers
    document.querySelectorAll('.cat-card-num').forEach((el,i)=>animN(el,parseInt(el.dataset.t)||0,i*60));

    // Build instrument grid
    buildInstrGrid();

    // Build geography grid
    buildGeoGrid();

    loaded=true;
    document.getElementById('ldscr').style.display='none';
    document.getElementById('stats-loaded').style.display='flex';

  }catch(err){
    console.error(err);
    document.getElementById('ldscr').innerHTML='<div class="ltx" style="color:#8B2020;">Could not load data.</div>';
  }
}

function buildInstrGrid(){const ic={};profs.forEach(p=>{let arr=p.instrument_aliases;if(typeof arr==='string'){try{arr=JSON.parse(arr);}catch{arr=[arr];}}if(Array.isArray(arr))arr.forEach(inst=>{if(inst)ic[inst]=(ic[inst]||0)+1;});if(p.primary_role==='Vocalist')ic['Vocal']=(ic['Vocal']||0)+1;});const max=Math.max(...Object.values(ic),1);document.getElementById('instr-grid').innerHTML=Object.entries(ic).sort((a,b)=>b[1]-a[1]).filter(([,c])=>c>0).map(([name,count])=>{const nm=name.replace(/'/g,"\\'");return'<div class="instr-card" onclick="openInstrDrill(\''+nm+'\')">'+'<div class="instr-info"><div class="instr-name">'+name+'</div><div class="instr-counts"><div class="instr-stat"><div class="instr-stat-num">'+count+'</div><div class="instr-stat-lbl">ARTISTS</div></div></div><div class="instr-bar"><div class="instr-bar-fill" style="width:'+Math.round(count/max*100)+'%"></div></div></div><div class="instr-arrow">›</div></div>';}).join('');}

function buildGeoGrid(){
  const sorted=Object.entries(cg).sort((a,b)=>b[1].length-a[1].length);
  const max=sorted[0]?.[1].length||1;
  document.getElementById('geo-grid').innerHTML=sorted.map(([country,artists],i)=>`
    <div class="geo-card" onclick="openGeoDrill('${country}')">
      <div class="geo-flag">${FL[country]||'🌐'}</div>
      <div class="geo-info">
        <div class="geo-country">${country}</div>
        <div class="geo-num">${artists.length}</div>
        <div class="geo-bar"><div class="geo-bar-fill" style="width:${Math.round(artists.length/max*100)}%"></div></div>
      </div>
      <div class="geo-arrow">›</div>
    </div>`).join('');
}

// Load Bani / Root Gurus
const BANI_DEFS=[{name:'Ariyakudi Bani',guru:'Ariyakkudi Ramanuja Iyengar',discipline:'Vocal',desc:'The foundational modern concert format.'},{name:'Semmangudi Bani',guru:'Semmangudi Srinivasa Iyer',discipline:'Vocal',desc:'Deeply devotional, rich in gamaka.'},{name:'GNB Bani',guru:'G N Balasubramaniam',discipline:'Vocal',desc:'Brilliant, vigorous style.'},{name:'Musiri Bani',guru:'Musiri Subramanya Iyer',discipline:'Vocal',desc:'Gentle, contemplative approach.'},{name:'Maharajapuram Bani',guru:'Maharajapuram Vishwanatha Iyer',discipline:'Vocal',desc:'Grand, emotionally resonant style.'},{name:'Brinda-Muktha Bani',guru:'T. Brinda',discipline:'Vocal',desc:'Ancient Isai Vellalar tradition.'},{name:'Chembai Bani',guru:'Chembai Vaidyanatha Bhagavathar',discipline:'Vocal',desc:'Powerful bhakti-oriented style.'},{name:'Madurai Mani Bani',guru:'Madurai Mani Iyer',discipline:'Vocal',desc:'Lyrical, melodic style.'},{name:'Alathur Bani',guru:'Alathur Brothers',discipline:'Vocal',desc:'Precise, grammar-focused style.'},{name:'Lalgudi Bani',guru:'Lalgudi G. Jayaraman',discipline:'Violin',desc:'Lyrical violin style with intricate bowing.'},{name:'Mysore Chowdaiah Bani',guru:'T. Chowdaiah',discipline:'Violin',desc:'Seven-string violin technique.'},{name:'T.N. Krishnan Bani',guru:'T.N. Krishnan',discipline:'Violin',desc:'Vocally-inspired violin style.'},{name:'M.S. Gopalakrishnan Bani',guru:'M.S. Gopalakrishnan',discipline:'Violin',desc:'Brilliant, technically dazzling style.'},{name:'Karaikudi Bani',guru:'Karaikudi Sambasiva Iyer',discipline:'Saraswati Veena',desc:'Traditional veena school.'},{name:'Veena Seshanna Bani',guru:'Veena Seshanna',discipline:'Saraswati Veena',desc:'Mysore court tradition.'},{name:'S. Balachander Bani',guru:'S. Balachander',discipline:'Saraswati Veena',desc:'Revolutionary modern approach.'},{name:'Gottuvadyam Parampara',guru:'Sakha Rama Rao',discipline:'Gottuvadyam',desc:'Ancient fretless vina tradition.'},{name:'Palakkad Mani Bani',guru:'Palakkad Mani Iyer',discipline:'Mridangam',desc:'Mathematical precision.'},{name:'Palghat Raghu Bani',guru:'Palghat R. Raghu',discipline:'Mridangam',desc:'Structured style.'},{name:'Umayalpuram Bani',guru:'Umayalpuram K. Sivaraman',discipline:'Mridangam',desc:'Elegant versatile style.'},{name:'Palladam Bani',guru:'Palladam Sanjeeva Rao',discipline:'Flute',desc:'Classical flute tradition.'},{name:'T.R. Mahalingam Bani',guru:'T.R. Mahalingam',discipline:'Flute',desc:'Free-spirited flute style.'}];
async function loadBaniGurus(){document.getElementById('guru-grid').innerHTML='<div class="lsc"><div class="lsp">✦</div><div class="ltx">Loading…</div></div>';try{const{data:lks}=await db.from('guru_shishya_lineage').select('guru_id,shishya_id');const gm={};(lks||[]).forEach(l=>{gm[l.guru_id]=(gm[l.guru_id]||0)+1;});const{data:gps}=await db.from('profiles').select('id,full_name,primary_role,is_deceased').in('full_name',BANI_DEFS.map(b=>b.guru));const pm={};(gps||[]).forEach(p=>pm[p.full_name]=p);allBaniGurus=BANI_DEFS.map(b=>{const p=pm[b.guru]||{full_name:b.guru,primary_role:b.discipline,is_deceased:true};return{...p,baniName:b.name,baniDesc:b.desc,discipline:b.discipline,shishyaCount:p.id?gm[p.id]||0:0};});filterBani('all',document.querySelector('.bani-filter'));}catch(e){console.error(e);}}

function filterBani(type,btn){document.querySelectorAll('.bani-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filtered=type==='all'?allBaniGurus:allBaniGurus.filter(g=>(g.discipline||'').toLowerCase().includes(type));if(!filtered.length){document.getElementById('guru-grid').innerHTML='<div style="padding:24px;font-style:italic;color:var(--txl);">No lineages found.</div>';return;}document.getElementById('guru-grid').innerHTML=filtered.map(g=>{const sn=(g.full_name||'').replace(/'/g,"\\'"),sr=(g.discipline||'').replace(/'/g,"\\'");return'<div class="guru-card" onclick="openLin(\''+sn+'\',\''+sr+'\',\'\')">'+'<div class="guru-card-era">'+g.discipline+'</div>'+'<div class="guru-card-name">'+(g.baniName||g.full_name)+'</div>'+'<div class="guru-card-role">'+g.full_name+(g.is_deceased?' · Historical':'')+'</div>'+'<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--txl);font-style:italic;margin:6px 0 10px;">'+g.baniDesc+'</div>'+'<div class="guru-card-stats"><div class="guru-stat"><div class="guru-stat-num">'+g.shishyaCount+'</div><div class="guru-stat-lbl">SHISHYAS</div></div></div></div>';}).join('');}

// Drill-down (opens overlay)
// filtByCatAsync — counts MUST match tile numbers
async function filtByCatAsync(pk,ck){if(pk!=='s')return[];const sel='id,full_name,primary_role,current_country,instrument_aliases,is_deceased';if(ck==='guru'){const{data:lks}=await db.from('guru_shishya_lineage').select('guru_id');const ids=new Set((lks||[]).map(r=>r.guru_id));const{data}=await db.from('profiles').select(sel).in('id',[...ids]).order('full_name');return data||[];}if(ck==='shishya'){const{data:lks}=await db.from('guru_shishya_lineage').select('shishya_id');const ids=new Set((lks||[]).map(r=>r.shishya_id));const{data}=await db.from('profiles').select(sel).in('id',[...ids]).order('full_name');return data||[];}if(ck==='kala'){const{data}=await db.from('profiles').select(sel).in('primary_role',['Vocalist','Instrumentalist']).eq('is_deceased',false).order('full_name');return data||[];}if(ck==='rasika'){const{data}=await db.from('profiles').select(sel).eq('primary_role','Rasika').order('full_name');return data||[];}if(ck==='pra'){const{data}=await db.from('profiles').select(sel).eq('primary_role','Organiser').order('full_name');return data||[];}if(ck==='vadya'){const{data}=await db.from('profiles').select(sel).not('instrument_maker','is',null).order('full_name');return data||[];}if(ck==='gran'){const{data}=await db.from('profiles').select(sel).in('primary_role',['Scholar','Musicologist']).order('full_name');return data||[];}if(ck==='vagg'){const{data}=await db.from('profiles').select(sel).eq('is_deceased',true).order('full_name');return data||[];}return profs;}
// Sync wrapper for backward compat — returns profs for non-async paths
function filtByCat(pk,ck){
  if(pk==='s'){
    if(ck==='kala') return profs.filter(p=>['Vocalist','Instrumentalist'].includes(p.primary_role));
    if(ck==='rasika') return profs.filter(p=>p.primary_role==='Rasika');
    if(ck==='pra') return profs.filter(p=>p.primary_role==='Organiser');
    if(ck==='vadya') return profs.filter(p=>p.instrument_maker);
    if(ck==='gran') return profs.filter(p=>['Scholar','Musicologist'].includes(p.primary_role));
    return profs;
  }
  return[];
}

function handleCatClick(el){
  if(el.classList.contains('inactive')) return;
  const pk=el.dataset.pk, ck=el.dataset.ck, l=el.dataset.l, e=el.dataset.e;
  openDrill(pk,ck,l,e);
}

async function openDrill(pk,ck,label,en){try{const filtered=await filtByCatAsync(pk,ck);if(!filtered||!filtered.length){showDrillOverlay(label,en+' — no data yet',[],false,false);return;}const isComposer=ck==='vagg';showDrillOverlay(label,en+' · '+filtered.length+' '+(isComposer?'composers':'artists'),filtered,'s',isComposer);}catch(e){console.error('openDrill:',e);alert('Error: '+(e.message||e));}}

function openGeoDrill(country){
  const artists=cg[country]||[];
  showDrillOverlay((FL[country]||'🌐')+' '+country,artists.length+' artists',artists,'geo',false);
}

function openInstrDrill(instrName){const nm=instrName.toLowerCase();const filtered=profs.filter(p=>{let arr=p.instrument_aliases;if(typeof arr==='string'){try{arr=JSON.parse(arr);}catch{arr=[arr];}}const ins=(Array.isArray(arr)?arr:[]).map(x=>(x||'').toLowerCase());return ins.some(i=>i.includes(nm))||(p.primary_role||'').toLowerCase().includes(nm);});showDrillOverlay(instrName,filtered.length+' artists',filtered,'instr',false);}

function showDrillOverlay(title,sub,artists,mode,isComposer=false){
  dCal=[...artists].sort((a,b)=>a.full_name.localeCompare(b.full_name));
  document.getElementById('dov-title').textContent=title;
  document.getElementById('dov-sub').textContent=sub;

  // Left panel: countries
  const cgs={};
  artists.forEach(p=>{const c=p.current_country||'Unknown';if(!cgs[c])cgs[c]=[];cgs[c].push(p);});
  const sorted=Object.entries(cgs).sort((a,b)=>b[1].length-a[1].length);
  const max=sorted[0]?.[1].length||1;
  document.getElementById('dov-list-hdr').textContent='BY COUNTRY';
  document.getElementById('dov-list').innerHTML=sorted.map(([country,arr],i)=>`
    <div class="dl-item" onclick="dFilterCountry('${country}',this)">
      <div class="dl-rank">${i+1}</div>
      <div class="dl-flag">${FL[country]||'🌐'}</div>
      <div class="dl-name">${country}</div>
      <div class="dl-bar-wrap"><div class="dl-bar" style="width:${Math.round(arr.length/max*100)}%"></div></div>
      <div class="dl-count">${arr.length}</div>
    </div>`).join('');

  renderDrillArt(dCal,'All Artists · '+dCal.length,isComposer);

  const ov=document.getElementById('doverlay');
  ov.classList.add('open');
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('visible')));
  document.body.style.overflow='hidden';
}

function closeDrill(){
  const ov=document.getElementById('doverlay');
  if(!ov)return;
  ov.classList.remove('visible');
  setTimeout(()=>{ov.classList.remove('open');document.body.style.overflow='';},300);
}

function dFilterCountry(country,el){
  document.querySelectorAll('#dov-list .dl-item').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel');
  const filtered=dCal.filter(p=>p.current_country===country);
  renderDrillArt(filtered,(FL[country]||'')+' '+country+' · '+filtered.length,false);
}

let dFiltered=[];
function renderDrillArt(artists,hdr,isComp){dFiltered=[...artists].filter(a=>a&&a.full_name);document.getElementById('dov-art-hdr').textContent=(hdr||'').toUpperCase();const col=isComp?'Composer / Saint':'Artist';document.getElementById('dov-art').innerHTML='<table class="art-tbl"><thead><tr><th>#</th><th>'+col+'</th><th>Role</th><th>Instruments</th><th></th></tr></thead><tbody id="dov-tbody">'+mkArtRows(dFiltered,isComp||false)+'</tbody></table>';}

function mkArtRows(artists, isComposer=false){
  return artists.map((a,i)=>{
    let ins='';
    if(a.instrument_aliases){let arr=a.instrument_aliases;if(typeof arr==='string'){try{arr=JSON.parse(arr);}catch{}}if(Array.isArray(arr))ins=arr.filter(x=>x&&x!=='Vocal').slice(0,2).join(', ');}
    const sn=(a.full_name||'').replace(/'/g,"\\'"),sr=(a.primary_role||'').replace(/'/g,"\\'"),sc=(a.current_country||'').replace(/'/g,"\\'");
    return`<tr onclick="openLin('${sn}','${sr}','${sc}')">
      <td style="font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--gl);width:28px;">${i+1}</td>
      <td class="td-name">${a.full_name}</td>
      <td class="td-role">${a.primary_role||''}</td>
      <td style="font-size:12px;color:var(--txl);font-style:italic;">${ins}</td>
      <td class="td-arr">›</td>
    </tr>`;
  }).join('');
}

function dSearch(q){
  const f=q?dFiltered.filter(a=>a.full_name.toLowerCase().includes(q.toLowerCase())):dFiltered;
  const tb=document.getElementById('dov-tbody');
  if(tb)tb.innerHTML=mkArtRows(f);
}

// ── MASTER LINEAGE — Left-to-right expandable tree ──
let masterLoaded=false, masterZoomBeh=null, currentMasterGuru='';
let allRootGurus=[], allLinks=[], allProfMap={};

async function loadMasterLineage(){
  if(masterLoaded) return;
  try{
    const{data:lks}=await db.from('guru_shishya_lineage').select('guru_id,shishya_id,discipline,handshake_status').limit(600);
    allLinks=lks||[];
    const allIds=new Set();
    allLinks.forEach(l=>{allIds.add(l.guru_id);allIds.add(l.shishya_id);});
    const{data:profs2}=await db.from('profiles').select('id,full_name,primary_role,is_deceased').in('id',[...allIds]);
    (profs2||[]).forEach(p=>allProfMap[p.id]=p);

    // Root gurus = those who appear as guru but NOT as shishya (true root)
    // OR appear as guru with many shishyas
    const guruIds=new Set(allLinks.map(l=>l.guru_id));
    const shishyaIds=new Set(allLinks.map(l=>l.shishya_id));
    const guruCounts={};
    allLinks.forEach(l=>{guruCounts[l.guru_id]=(guruCounts[l.guru_id]||0)+1;});

    const roots=[...guruIds]
      .filter(id=>!shishyaIds.has(id)||(guruCounts[id]||0)>=3) // pure roots or major gurus
      .map(id=>({...allProfMap[id],shishyaCount:guruCounts[id]||0}))
      .filter(g=>g.full_name)
      .sort((a,b)=>b.shishyaCount-a.shishyaCount);
    allRootGurus=roots;

    renderRootGuruList(roots);
    masterLoaded=true;
    document.getElementById('master-loading').style.display='none';
  }catch(e){
    console.error(e);
    document.getElementById('master-loading').innerHTML='<div class="ltx" style="color:#8B2020;">Could not load.</div>';
  }
}

function renderRootGuruList(gurus){
  const scroll=document.getElementById('master-guru-scroll');
  if(!gurus.length){
    scroll.innerHTML='<div style="padding:16px;font-style:italic;color:var(--txl);font-family:&quot;EB Garamond&quot;,serif;font-size:14px;">No root gurus found.</div>';
    return;
  }
  scroll.innerHTML=gurus.map((g,i)=>{
    const sn=(g.full_name||'').replace(/'/g,"\'");
    return`<div class="rg-item" onclick="selectRootGuru('${sn}',this)" style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--bo);cursor:pointer;transition:background 0.12s;">
      <div style="flex:1;min-width:0;">
        <div style="font-family:'EB Garamond',serif;font-size:15px;color:var(--br);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.full_name}</div>
        <div style="font-family:'EB Garamond',serif;font-style:italic;font-size:12px;color:var(--txl);">${g.primary_role||''}${g.is_deceased?' · Historical':''}</div>
      </div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--gl);flex-shrink:0;">${g.shishyaCount}</div>
    </div>`;
  }).join('');

  // Hover styles
  scroll.querySelectorAll('.rg-item').forEach(el=>{
    el.addEventListener('mouseenter',()=>{if(!el.classList.contains('sel'))el.style.background='rgba(196,160,68,0.07)';});
    el.addEventListener('mouseleave',()=>{if(!el.classList.contains('sel'))el.style.background='';});
  });
}

function filterRootGurus(q){
  const filtered=q?allRootGurus.filter(g=>g.full_name.toLowerCase().includes(q.toLowerCase())):allRootGurus;
  renderRootGuruList(filtered);
}

async function selectRootGuru(name, el){
  currentMasterGuru=name;
  // Highlight selection
  document.querySelectorAll('.rg-item').forEach(e=>{
    e.classList.remove('sel');
    e.style.background='';
  });
  el.classList.add('sel');
  el.style.background='rgba(196,160,68,0.13)';

  document.getElementById('master-tree-empty').style.display='none';
  const svg=d3.select('#master-svg');
  svg.style('display','block');
  svg.selectAll('*').remove();
  svg.append('text').attr('x','50%').attr('y','50%').attr('text-anchor','middle')
    .attr('font-family',"'EB Garamond',serif").attr('font-style','italic')
    .attr('font-size','15px').attr('fill','var(--txl)').text('Building lineage tree…');

  // Build tree data from allLinks
  const profMap=allProfMap;
  const childMap={};
  allLinks.forEach(l=>{
    if(!childMap[l.guru_id])childMap[l.guru_id]=[];
    childMap[l.guru_id].push({id:l.shishya_id,discipline:l.discipline,status:l.handshake_status});
  });

  // Find root node
  const rootProf=Object.values(profMap).find(p=>p.full_name===name);
  if(!rootProf){svg.selectAll('*').remove();return;}

  // Build tree recursively (max depth 6)
  function buildTree(id,depth){
    if(depth>6)return null;
    const p=profMap[id];
    if(!p)return null;
    const children=(childMap[id]||[]).map(c=>{
      const child=buildTree(c.id,depth+1);
      return child?{...child,discipline:c.discipline,status:c.status}:null;
    }).filter(Boolean);
    return{id,name:p.full_name,role:p.primary_role,deceased:p.is_deceased,children};
  }

  const treeData=buildTree(rootProf.id,0);
  if(!treeData){svg.selectAll('*').remove();return;}

  drawMasterTree(treeData);
  document.getElementById('master-tree-controls').style.display='flex';
}

function drawMasterTree(data){
  const wrap=document.querySelector('#view-master > div:last-child');
  const W=wrap.clientWidth||900, H=wrap.clientHeight||600;
  const svg=d3.select('#master-svg').attr('width',W).attr('height',H);
  svg.selectAll('*').remove();

  const g=svg.append('g');
  const zoom=d3.zoom().scaleExtent([0.1,3]).on('zoom',e=>g.attr('transform',e.transform));
  svg.call(zoom);
  masterZoomBeh=zoom;

  // D3 tree layout — left to right
  const treeLayout=d3.tree().nodeSize([36,220]);
  const root=d3.hierarchy(data);
  treeLayout(root);

  // Draw links
  const linkG=g.append('g');
  root.links().forEach(link=>{
    const acc=link.target.data.status==='accepted';
    linkG.append('path')
      .attr('fill','none')
      .attr('stroke',acc?'var(--gl)':'var(--bom)')
      .attr('stroke-width',acc?1.4:0.9)
      .attr('stroke-dasharray',acc?'none':'4 3')
      .attr('stroke-opacity',acc?0.6:0.35)
      .attr('d',d3.linkHorizontal()
        .x(d=>d.y).y(d=>d.x)(link));

    // Discipline label
    if(link.target.data.discipline&&link.target.data.discipline!=='Heritage'){
      const mx=(link.source.y+link.target.y)/2;
      const my=(link.source.x+link.target.x)/2;
      linkG.append('text')
        .attr('x',mx).attr('y',my-4)
        .attr('text-anchor','middle')
        .attr('font-family',"'Cinzel',serif")
        .attr('font-size','7px')
        .attr('fill','var(--txl)')
        .attr('letter-spacing','0.08em')
        .text(link.target.data.discipline.toUpperCase());
    }
  });

  // Draw nodes
  const tt=document.getElementById('tt');
  root.descendants().forEach(node=>{
    const isRoot=node.depth===0;
    const r=isRoot?16:10;
    const ng=g.append('g')
      .attr('transform',`translate(${node.y},${node.x})`)
      .style('cursor','pointer');

    // Halo for root
    if(isRoot) ng.append('circle').attr('r',28).attr('fill','var(--g)').attr('opacity',0.06);

    ng.append('circle')
      .attr('r',r)
      .attr('fill',isRoot?'var(--g)':(node.data.deceased?'rgba(154,116,32,0.12)':'rgba(255,252,245,0.95)'))
      .attr('stroke',isRoot?'var(--gb)':(node.data.deceased?'var(--gl)':'var(--gm)'))
      .attr('stroke-width',isRoot?2.5:1.4)
      .attr('stroke-dasharray',node.data.deceased&&!isRoot?'3 2':'none');

    if(node.data.deceased&&!isRoot){
      ng.append('text').attr('text-anchor','middle').attr('dy','0.35em')
        .attr('font-size','8px').attr('fill','var(--gl)').text('✦');
    }

    // Name label
    const short=node.data.name.length>22?node.data.name.slice(0,20)+'…':node.data.name;
    const labelX=isRoot?0:r+6;
    const anchor=isRoot?'middle':'start';
    const labelY=isRoot?r+14:0;

    ng.append('text')
      .attr('x',labelX).attr('y',labelY)
      .attr('text-anchor',anchor)
      .attr('dy',isRoot?'0em':'0.35em')
      .attr('font-family',"'EB Garamond',serif")
      .attr('font-size',isRoot?'13px':'11px')
      .attr('font-weight',isRoot?'600':'400')
      .attr('fill',isRoot?'var(--iv)':'var(--br)')
      .text(isRoot?short:short);

    // Role
    if(!isRoot&&node.data.role){
      ng.append('text')
        .attr('x',r+6).attr('y',12)
        .attr('font-family',"'EB Garamond',serif")
        .attr('font-size','9px').attr('font-style','italic')
        .attr('fill','var(--txl)').text(node.data.role);
    }

    // Child count badge
    if(node.children&&node.children.length>0){
      ng.append('circle').attr('cx',isRoot?r:r-2).attr('cy',isRoot?-r:-r+2).attr('r',7)
        .attr('fill','var(--g)').attr('opacity',0.85);
      ng.append('text').attr('x',isRoot?r:-2).attr('y',isRoot?-r+1:-r+3)
        .attr('text-anchor','middle').attr('font-family',"'Cinzel',serif")
        .attr('font-size','7px').attr('fill','var(--iv)')
        .text(node.children.length);
    }

    ng.on('mouseenter',ev=>{
      document.getElementById('ttnm').textContent=node.data.name;
      document.getElementById('ttmt').textContent=[
        node.data.role,
        node.data.deceased?'Historical figure':null,
        node.children?`${node.children.length} shishya${node.children.length!==1?'s':''}`:null,
      ].filter(Boolean).join(' · ');
      tt.classList.add('show');
    }).on('mousemove',ev=>{
      tt.style.left=(ev.clientX+14)+'px';
      tt.style.top=(ev.clientY-8)+'px';
    }).on('mouseleave',()=>tt.classList.remove('show'))
    .on('click',()=>{
      tt.classList.remove('show');
      if(!isRoot) openLin(node.data.name,node.data.role||'','');
    });
  });

  // Auto-fit
  setTimeout(()=>{
    try{
      const bounds=g.node().getBBox();
      if(bounds.width===0) return;
      const pad=40;
      const scale=Math.min(0.9,Math.min((W-pad*2)/bounds.width,(H-pad*2)/bounds.height));
      const tx=pad-bounds.x*scale;
      const ty=H/2-scale*(bounds.y+bounds.height/2);
      svg.call(zoom.transform,d3.zoomIdentity.translate(tx,ty).scale(scale));
    }catch(e){}
  },50);
}

function masterZoomIn(){d3.select('#master-svg').transition().duration(250).call(masterZoomBeh.scaleBy,1.35);}
function masterZoomOut(){d3.select('#master-svg').transition().duration(250).call(masterZoomBeh.scaleBy,0.74);}
function masterFit(){
  try{
    const wrap=document.querySelector('#view-master > div:last-child');
    const W=wrap.clientWidth,H=wrap.clientHeight;
    const g=d3.select('#master-svg g');
    const bounds=g.node().getBBox();
    if(bounds.width===0) return;
    const pad=40;
    const scale=Math.min(0.9,Math.min((W-pad*2)/bounds.width,(H-pad*2)/bounds.height));
    const tx=pad-bounds.x*scale;
    const ty=H/2-scale*(bounds.y+bounds.height/2);
    d3.select('#master-svg').transition().duration(400).call(masterZoomBeh.transform,d3.zoomIdentity.translate(tx,ty).scale(scale));
  }catch(e){}
}


// Lineage
function openLin(name,role,country){
  prev='stats';
  const _ov=document.getElementById('doverlay');
  if(_ov&&_ov.classList.contains('open'))closeDrill();
  setTimeout(()=>{
    showSc('slin');
    document.getElementById('lnm').textContent=name;
    document.getElementById('lsub').textContent=role+(country?' · '+country:'')+' · Guru-Shishya Parampara';
    document.getElementById('lload').style.display='flex';
    document.getElementById('lsvg').style.display='none';
    buildLin(name);
  },320);
}

async function buildLin(name){
  try{
    const{data:root}=await db.from('profiles').select('id,full_name,primary_role,current_country,is_deceased').eq('full_name',name).single();
    if(!root)throw new Error('nf');
    const vis=new Set();
    async function anc(id,dep){
      if(dep>7||vis.has(id))return null;vis.add(id);
      const{data:p}=await db.from('profiles').select('id,full_name,primary_role,current_country,is_deceased').eq('id',id).single();
      if(!p)return null;
      const{data:lks}=await db.from('guru_shishya_lineage').select('guru_id,discipline,handshake_status').eq('shishya_id',id).limit(5);
      const gurus=[];
      for(const lk of(lks||[])){if(!vis.has(lk.guru_id)){const g=await anc(lk.guru_id,dep+1);if(g)gurus.push({...g,discipline:lk.discipline,status:lk.handshake_status});}}
      return{...p,gurus,depth:dep};
    }
    const{data:dlks}=await db.from('guru_shishya_lineage').select('shishya_id,discipline,handshake_status').eq('guru_id',root.id).limit(10);
    const disc=[];
    for(const lk of(dlks||[])){const{data:p2}=await db.from('profiles').select('id,full_name,primary_role,current_country,is_deceased').eq('id',lk.shishya_id).single();if(p2)disc.push({...p2,discipline:lk.discipline,status:lk.handshake_status});}
    const aTree=await anc(root.id,0);
    drawLin({root,aTree,disc},name);
  }catch(e){console.error(e);document.getElementById('lload').innerHTML='<div class="ltx" style="color:#8B2020;">Could not load lineage.</div>';}
}

function drawLin(data,name){
  const wrap=document.querySelector('.lin-sw'),W=wrap.clientWidth,H=wrap.clientHeight;
  const svg=d3.select('#lsvg').attr('width',W).attr('height',H);svg.selectAll('*').remove();
  const g=svg.append('g');svg.call(d3.zoom().scaleExtent([0.2,3]).on('zoom',e=>g.attr('transform',e.transform)));
  const nodes=[],links=[],rx=W/2,ry=H*0.62,VT=150;
  nodes.push({id:data.root.id,name:data.root.full_name,role:data.root.primary_role,x:rx,y:ry,type:'root',dec:false});
  function plA(node,px,py,sp,lv){
    if(!node?.gurus?.length)return;
    node.gurus.forEach((gu,i)=>{
      const n=node.gurus.length,off=n===1?0:(i-(n-1)/2)*sp;
      const x=px+off,y=py-VT;
      nodes.push({id:gu.id,name:gu.full_name,role:gu.primary_role,x,y,type:'anc',depth:lv+1,dec:gu.is_deceased});
      links.push({x1:px,y1:py,x2:x,y2:y,st:gu.status,dis:gu.discipline,dir:'u'});
      plA(gu,x,y,sp*0.72,lv+1);
    });
  }
  plA(data.aTree,rx,ry,260,0);
  (data.disc||[]).forEach((d,i)=>{
    const n=data.disc.length,off=n===1?0:(i-(n-1)/2)*170;
    const x=rx+off,y=ry+VT;
    nodes.push({id:d.id,name:d.full_name,role:d.primary_role,x,y,type:'disc',dec:d.is_deceased});
    links.push({x1:rx,y1:ry,x2:x,y2:y,st:d.status,dis:d.discipline,dir:'d'});
  });
  const GL=['Direct Guru','2nd Generation','3rd Generation','4th Generation','5th Generation'];
  [...new Set(nodes.filter(n=>n.type==='anc').map(n=>n.depth))].forEach(d=>{
    const dn=nodes.filter(n=>n.depth===d&&n.type==='anc');if(!dn.length)return;
    const my=Math.min(...dn.map(n=>n.y));
    g.append('text').attr('x',52).attr('y',my+4).attr('font-family',"'Cinzel',serif").attr('font-size','8px').attr('fill','var(--txl)').attr('letter-spacing','0.14em').attr('opacity',0).text((GL[d-1]||`Gen ${d}`).toUpperCase()).transition().delay(d*170).duration(500).attr('opacity',0.65);
  });
  links.forEach((lk,i)=>{
    const acc=lk.st==='accepted',up=lk.dir==='u';
    g.append('path').attr('fill','none').attr('stroke',up?'var(--gl)':'var(--tll)').attr('stroke-width',1.5).attr('stroke-opacity',0).attr('stroke-dasharray',acc?'none':'5 4').attr('d',`M${lk.x1},${lk.y1} C${lk.x1},${(lk.y1+lk.y2)/2} ${lk.x2},${(lk.y1+lk.y2)/2} ${lk.x2},${lk.y2}`).transition().delay(i*65).duration(440).attr('stroke-opacity',acc?0.6:0.38);
    if(lk.dis&&lk.dis!=='Heritage'){const mx=(lk.x1+lk.x2)/2,my=(lk.y1+lk.y2)/2;g.append('text').attr('x',mx+6).attr('y',my).attr('font-family',"'Cinzel',serif").attr('font-size','7px').attr('fill',up?'var(--gl)':'var(--tll)').attr('letter-spacing','0.1em').attr('opacity',0).text(lk.dis.toUpperCase()).transition().delay(i*65+360).duration(300).attr('opacity',0.7);}
  });
  const tt=document.getElementById('tt');
  nodes.forEach((n,i)=>{
    const isR=n.type==='root',isA=n.type==='anc',r=isR?22:14;
    const ng=g.append('g').attr('transform',`translate(${n.x},${n.y})`).style('opacity',0).style('cursor','pointer');
    if(isR)ng.append('circle').attr('r',38).attr('fill','var(--g)').attr('opacity',0.06);
    ng.append('circle').attr('r',0).attr('fill',isR?'var(--g)':(isA?'var(--ivm)':'rgba(42,96,96,0.07)')).attr('stroke',isR?'var(--gb)':(isA?'var(--gm)':'var(--tl)')).attr('stroke-width',isR?2.5:1.5).attr('stroke-dasharray',n.dec&&!isR?'3 2':'none').transition().delay(i*65).duration(370).attr('r',r);
    if(n.dec&&!isR)ng.append('text').attr('y',-r-5).attr('text-anchor','middle').attr('font-size','9px').attr('fill','var(--txl)').text('✦');
    const sh=n.name.length>22?n.name.slice(0,20)+'…':n.name;
    ng.append('text').attr('y',r+15).attr('text-anchor','middle').attr('font-family',"'EB Garamond',serif").attr('font-size',isR?'13px':'11px').attr('font-weight',isR?'600':'400').attr('fill',isR?'var(--br)':'var(--txm)').text(sh);
    if(n.role&&!isR)ng.append('text').attr('y',r+27).attr('text-anchor','middle').attr('font-family',"'EB Garamond',serif").attr('font-size','9px').attr('font-style','italic').attr('fill','var(--txl)').text(n.role);
    ng.transition().delay(i*65).duration(440).style('opacity',1);
    ng.on('mouseenter',ev=>{document.getElementById('ttnm').textContent=n.name;document.getElementById('ttmt').textContent=[n.role,n.dec?'Historical figure':null].filter(Boolean).join(' · ');tt.classList.add('show');}).on('mousemove',ev=>{tt.style.left=(ev.clientX+14)+'px';tt.style.top=(ev.clientY-8)+'px';}).on('mouseleave',()=>tt.classList.remove('show')).on('click',()=>{if(!isR){tt.classList.remove('show');openLin(n.name,n.role||'',n.country||'');}});
  });
  document.getElementById('lload').style.display='none';
  document.getElementById('lsvg').style.display='block';
}

/* Custom Dropdown */
let kmOpenDD = null;

function kmToggleDD(id) {
  const dd = document.getElementById(id);
  const list = dd.querySelector('.km-dropdown-list');
  const btn  = dd.querySelector('.km-dropdown-btn');
  const isOpen = list.classList.contains('open');

  // Close any open dropdown
  if (kmOpenDD && kmOpenDD !== id) {
    const prev = document.getElementById(kmOpenDD);
    if (prev) {
      prev.querySelector('.km-dropdown-list').classList.remove('open');
      prev.querySelector('.km-dropdown-btn').classList.remove('open');
    }
  }

  if (isOpen) {
    list.classList.remove('open');
    btn.classList.remove('open');
    kmOpenDD = null;
  } else {
    // Position the list under the button
    const rect = btn.getBoundingClientRect();
    list.style.left = rect.left + 'px';
    list.style.top  = (rect.bottom + 2) + 'px';
    list.style.width = rect.width + 'px';
    list.classList.add('open');
    btn.classList.add('open');
    kmOpenDD = id;
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (kmOpenDD && !e.target.closest('.km-dropdown')) {
    const dd = document.getElementById(kmOpenDD);
    if (dd) {
      dd.querySelector('.km-dropdown-list').classList.remove('open');
      dd.querySelector('.km-dropdown-btn').classList.remove('open');
    }
    kmOpenDD = null;
  }
});

function kmPickComposer(val, label) {
  const btn = document.getElementById('km-composer-btn');
  btn.textContent = label;
  btn.dataset.val = val;
  document.querySelectorAll('#km-composer-list .km-dropdown-item').forEach(el => {
    el.classList.toggle('selected', el.textContent.trim() === label);
  });
  const list = document.getElementById('km-composer-list');
  list.classList.remove('open');
  btn.classList.remove('open');
  kmOpenDD = null;
  kmFilterComposer(val);
}

function kmPickRoute(val, label) {
  document.getElementById('km-route-btn').textContent = label || '— Select a route —';
  document.querySelectorAll('#km-route-list .km-dropdown-item').forEach(el => {
    el.classList.toggle('selected', val && el.dataset.val === val);
  });
  const list = document.getElementById('km-route-list');
  list.classList.remove('open');
  document.getElementById('km-route-btn').classList.remove('open');
  kmOpenDD = null;
  if (val) kmSelectRoute(val);
}



let kmRouteData = [];          // all route stops from Supabase
let kmRouteLines = [];         // Leaflet polylines on map
let kmRouteMarkers = [];       // numbered stop markers
let kmCurrentRoute = null;     // active route object
let kmPlayInterval = null;     // animation timer
let kmPlayStep = 0;            // current animation step

const KM_ROUTE_COLORS = {
  'Navagraha Kshetra Yatra':  { line:'#E8A020', pin:'#E8A020', bg:'rgba(232,160,32,0.15)'  }, // Amber gold
  'Pancha Bhuta Stala Yatra': { line:'#C0392B', pin:'#C0392B', bg:'rgba(192,57,43,0.15)'   }, // Deep red
  'Arupadai Veedu Yatra':     { line:'#8E44AD', pin:'#8E44AD', bg:'rgba(142,68,173,0.15)'  }, // Purple
  'Pancharatna Circuit':      { line:'#2471A3', pin:'#2471A3', bg:'rgba(36,113,163,0.15)'  }, // Blue
  'Wari Pilgrimage Route':    { line:'#1E8449', pin:'#1E8449', bg:'rgba(30,132,73,0.15)'   }  // Green
};

async function kmLoadRoutes() {
  if (kmRouteData.length > 0) return;
  try {
    // Load routes separately then join manually (avoids FK embed issues)
    const { data: routes, error: re } = await db
      .from('pilgrimage_routes')
      .select('id, route_name, description, circa, sequence_number, travel_note, composer_id, kshetra_id, composition_id')
      .order('route_name').order('sequence_number');
    if (re) throw re;

    // Fetch all needed kshetras and compositions in bulk
    const kshetraIds = [...new Set((routes||[]).map(r=>r.kshetra_id).filter(Boolean))];
    const compositionIds = [...new Set((routes||[]).map(r=>r.composition_id).filter(Boolean))];

    const [{ data: kshetras }, { data: comps }] = await Promise.all([
      kshetraIds.length ? db.from('kshetras').select('id,temple_name,latitude,longitude,location_city,location_state').in('id', kshetraIds) : { data: [] },
      compositionIds.length ? db.from('compositions').select('id,title,raga').in('id', compositionIds) : { data: [] }
    ]);

    const kshetraMap = Object.fromEntries((kshetras||[]).map(k=>[k.id,k]));
    const compMap    = Object.fromEntries((comps||[]).map(c=>[c.id,c]));

    // Attach kshetra and composition to each stop
    kmRouteData = (routes||[]).map(r => ({
      ...r,
      kshetra:     kshetraMap[r.kshetra_id]     || null,
      composition: compMap[r.composition_id]    || null
    }));

    // Group by route_name
    const routeMap = {};
    kmRouteData.forEach(stop => {
      if (!routeMap[stop.route_name]) {
        routeMap[stop.route_name] = {
          name: stop.route_name,
          composer_id: stop.composer_id,
          circa: stop.circa,
          description: stop.description,
          stops: []
        };
      }
      routeMap[stop.route_name].stops.push(stop);
    });

    kmRouteData._grouped = Object.values(routeMap);

  } catch(e) {
    console.error('Route load error:', e);
  }
}

function kmShowRouteSelector(composerId) {
  const list    = document.getElementById('km-route-list');
  const section = document.getElementById('km-route-section');

  if (!kmRouteData._grouped) { section.style.display = 'none'; return; }

  const routes = composerId === 'all'
    ? kmRouteData._grouped
    : kmRouteData._grouped.filter(r => r.composer_id === composerId);

  if (routes.length === 0) { section.style.display = 'none'; return; }

  // Build list items
  list.innerHTML = `<div class="km-dropdown-item" style="color:var(--txl);" onclick="kmPickRoute('')">— Select a route —</div>`;
  routes.forEach(r => {
    const p = KM_ROUTE_COLORS[r.name] || { pin:'#7A5C10' };
    const item = document.createElement('div');
    item.className = 'km-dropdown-item';
    item.dataset.val = r.name;
    item.innerHTML = `<span class="km-dropdown-swatch" style="background:${p.pin}"></span>${r.name}`;
    item.onclick = () => kmPickRoute(r.name, r.name);
    list.appendChild(item);
  });

  // Show colour legend
  let legend = document.getElementById('km-route-legend');
  if (!legend) {
    legend = document.createElement('div');
    legend.id = 'km-route-legend';
    legend.style.cssText = 'padding:6px 18px 10px;border-bottom:1px solid var(--bo);';
    section.after(legend);
  }
  legend.innerHTML = routes.map(r => {
    const p = KM_ROUTE_COLORS[r.name] || { pin:'#7A5C10' };
    return `<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;cursor:pointer;" onclick="document.getElementById('km-route-btn').textContent='${r.name}';kmSelectRoute('${r.name}')">
      <span style="width:20px;height:3px;border-radius:2px;background:${p.pin};flex-shrink:0;"></span>
      <span style="font-family:'EB Garamond',serif;font-size:12px;color:var(--txm);">${r.name}</span>
    </div>`;
  }).join('');

  // Reset route button label
  document.getElementById('km-route-btn').textContent = '— Select a route —';
  section.style.display = 'block';
}

function kmSelectRoute(routeName) {
  kmClearRoute();
  if (!routeName) return;

  const composerId = document.getElementById('km-composer-btn').dataset.val || 'all';
  const route = kmRouteData._grouped.find(r =>
    r.name === routeName && (composerId === 'all' || r.composer_id === composerId)
  ) || kmRouteData._grouped.find(r => r.name === routeName);

  if (!route) return;
  kmCurrentRoute = route;
  kmPlayStep = 0;

  // Show route info panel in sidebar
  const panel = document.getElementById('km-route-panel');
  const info  = document.getElementById('km-route-info');
  info.textContent = (route.description || '') + (route.circa ? ` (${route.circa})` : '');
  panel.style.display = 'flex';

  // Build stop list
  kmRenderStopList(route.stops, -1);

  // Draw route on map
  kmDrawRoute(route);

  // Show floating playback bar
  kmShowPlaybar(route);

  // Auto-focus first stop
  setTimeout(() => {
    kmPlayStep = 0;
    kmFocusStop(0, 'right');
    kmUpdatePlaybar();
  }, 800);
}

function kmRenderStopList(stops, activeIdx) {
  const el = document.getElementById('km-route-stops');
  const palette = kmCurrentRoute ? (KM_ROUTE_COLORS[kmCurrentRoute.name] || { pin:'#7A5C10' }) : { pin:'#7A5C10' };
  el.innerHTML = stops.map((s, i) => `
    <div class="km-stop-item ${i===activeIdx?'active':''}" onclick="kmStepToStop(${i})">
      <div class="km-stop-num" style="background:${i===activeIdx?'var(--tl)':palette.pin}">${s.sequence_number}</div>
      <div class="km-stop-body">
        <div class="km-stop-name">${kmCleanName(s.kshetra?.temple_name||'—')}</div>
        ${s.composition?.title ? `<div class="km-stop-kriti" style="color:${palette.pin}">✦ ${s.composition.title}${s.composition.raga ? ' · '+s.composition.raga : ''}</div>` : ''}
      </div>
    </div>`).join('');

  // Scroll active stop into view
  if (activeIdx >= 0) {
    setTimeout(() => {
      const active = el.querySelector('.active');
      if (active) active.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 100);
  }
}

function kmStepToStop(idx) {
  const dir = idx > kmPlayStep ? 'right' : idx < kmPlayStep ? 'left' : 'right';
  kmPlayStep = idx;
  kmFocusStop(idx, dir);
  kmUpdatePlaybar();
}

function kmDrawRoute(route) {
  if (!kmMap) return;
  const palette = KM_ROUTE_COLORS[route.name] || { line:'#E8A020', pin:'#E8A020', bg:'rgba(232,160,32,0.15)' };
  const stops = route.stops.filter(s => s.kshetra?.latitude && s.kshetra?.longitude);
  if (!stops.length) return;

  const latlngs = stops.map(s => [parseFloat(s.kshetra.latitude), parseFloat(s.kshetra.longitude)]);

  // White shadow line for contrast
  kmRouteLines.push(L.polyline(latlngs, {
    color: 'white', weight: 6, opacity: 0.7
  }).addTo(kmMap));

  // Main vivid dashed route line
  kmRouteLines.push(L.polyline(latlngs, {
    color: palette.line, weight: 3.5, opacity: 1,
    dashArray: '10 6', dashOffset: '0'
  }).addTo(kmMap));

  // Numbered stop markers — large, vivid, Parampara-styled
  stops.forEach((stop, i) => {
    const lat = parseFloat(stop.kshetra.latitude);
    const lng = parseFloat(stop.kshetra.longitude);

    const icon = L.divIcon({
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:${palette.pin};
        border:3px solid white;
        color:white;
        font-family:'Cinzel',serif;font-size:10px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.4),0 0 0 2px ${palette.pin}44;
        letter-spacing:0;
      ">${stop.sequence_number}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const m = L.marker([lat, lng], { icon, zIndexOffset: 1000 });
    m.bindTooltip(
      `<strong style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.1em;">${stop.sequence_number}. ${kmCleanName(stop.kshetra.temple_name)}</strong>${stop.composition?.title ? '<br><em style="color:'+palette.pin+'">✦ '+stop.composition.title+(stop.composition.raga?' · '+stop.composition.raga:'')+'</em>' : ''}`,
      { direction: 'top', className: 'km-tooltip', offset: [0, -16] }
    );
    m.on('click', e => { L.DomEvent.stopPropagation(e); kmFocusStop(i); });
    m.addTo(kmMap);
    kmRouteMarkers.push(m);
  });

  // Animate: reveal stops one by one with a brief delay
  kmRouteMarkers.forEach((m, i) => {
    const el = m.getElement?.();
    if (el) { el.style.opacity = '0'; el.style.transform = 'scale(0.3)'; el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'; }
    setTimeout(() => {
      const el2 = m.getElement?.();
      if (el2) { el2.style.opacity = '1'; el2.style.transform = 'scale(1)'; }
    }, 200 + i * 150);
  });

  // Fit map
  kmMap.fitBounds(L.latLngBounds(latlngs), { padding: [70, 70], maxZoom: 9, animate: true });
}

function kmShowPlaybar(route) {
  const bar = document.getElementById('km-playbar');
  const routeEl = document.getElementById('km-playbar-route');
  bar.style.display = 'flex';
  routeEl.textContent = route.name.toUpperCase();
  const palette = KM_ROUTE_COLORS[route.name] || { pin:'#7A5C10' };
  document.querySelector('.km-playbar-play').style.background = palette.pin;
  document.querySelector('.km-playbar-play').style.borderColor = palette.pin;
  document.getElementById('km-pb-fill').style.background = `linear-gradient(90deg, ${palette.pin}, ${palette.pin}aa)`;
  kmUpdatePlaybar();
}

function kmUpdatePlaybar() {
  if (!kmCurrentRoute) return;
  const stops = kmCurrentRoute.stops.filter(s => s.kshetra?.latitude);
  const total = stops.length;
  const cur = kmPlayStep;
  const pct = total > 1 ? (cur / (total - 1)) * 100 : 0;

  document.getElementById('km-pb-fill').style.width = pct + '%';
  document.getElementById('km-pb-step').textContent = `Stop ${cur + 1} of ${total}`;
  document.getElementById('km-pb-prev').disabled = cur <= 0;
  document.getElementById('km-pb-next').disabled = cur >= total - 1;
}

function kmStepRoute(dir) {
  if (!kmCurrentRoute) return;
  const stops = kmCurrentRoute.stops.filter(s => s.kshetra?.latitude);
  const newStep = kmPlayStep + dir;
  if (newStep < 0 || newStep >= stops.length) return;
  const prevStep = kmPlayStep;
  kmPlayStep = newStep;
  kmFocusStop(kmPlayStep, dir > 0 ? 'right' : 'left');
  kmUpdatePlaybar();
}

function kmPlayRoute() {
  if (!kmCurrentRoute) return;
  const stops = kmCurrentRoute.stops.filter(s => s.kshetra?.latitude);
  if (!stops.length) return;

  const playIcon = document.getElementById('km-pb-play-icon');
  const palette = KM_ROUTE_COLORS[kmCurrentRoute.name] || { pin:'#7A5C10' };

  if (kmPlayInterval) {
    // Pause
    clearInterval(kmPlayInterval);
    kmPlayInterval = null;
    playIcon.innerHTML = '<path d="M5 3.5l10 5.5-10 5.5z"/>';
    // Reset pulsing marker
    if (kmRouteMarkers[kmPlayStep]) {
      const el = kmRouteMarkers[kmPlayStep]?.getElement?.();
      if (el) { el.style.transform = 'scale(1)'; el.style.filter = ''; }
    }
    return;
  }

  // Play icon → pause icon
  playIcon.innerHTML = '<rect x="4" y="3" width="4" height="12" rx="1"/><rect x="10" y="3" width="4" height="12" rx="1"/>';

  // If at end, restart
  if (kmPlayStep >= stops.length - 1) { kmPlayStep = 0; }

  const advance = () => {
    if (kmPlayStep >= stops.length) {
      clearInterval(kmPlayInterval);
      kmPlayInterval = null;
      playIcon.innerHTML = '<path d="M5 3.5l10 5.5-10 5.5z"/>';
      kmPlayStep = stops.length - 1;
      kmUpdatePlaybar();
      // Reset all pulsing
      kmRouteMarkers.forEach(m => {
        const el = m.getElement?.();
        if (el) { el.style.transform='scale(1)'; el.style.filter=''; }
      });
      return;
    }

    // De-pulse previous
    if (kmPlayStep > 0 && kmRouteMarkers[kmPlayStep - 1]) {
      const prev = kmRouteMarkers[kmPlayStep - 1].getElement?.();
      if (prev) { prev.style.transform='scale(1)'; prev.style.filter=''; prev.style.transition='transform 0.4s ease, filter 0.4s ease'; }
    }

    // Pulse current
    if (kmRouteMarkers[kmPlayStep]) {
      const el = kmRouteMarkers[kmPlayStep].getElement?.();
      if (el) {
        el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease';
        el.style.transform = 'scale(1.7)';
        el.style.filter = `drop-shadow(0 0 10px ${palette.pin})`;
      }
    }

    kmFocusStop(kmPlayStep, 'right');
    kmPlayStep++;
    kmUpdatePlaybar();
  };

  advance();
  kmPlayInterval = setInterval(advance, 3200);
}

function kmFocusStop(idx, direction) {
  if (!kmCurrentRoute) return;
  const stops = kmCurrentRoute.stops.filter(s => s.kshetra?.latitude);
  const stop = stops[idx];
  if (!stop) return;

  kmRenderStopList(stops, idx);

  // Smooth pan with easing
  kmMap.flyTo(
    [parseFloat(stop.kshetra.latitude), parseFloat(stop.kshetra.longitude)],
    Math.max(kmMap.getZoom(), 8),
    { animate: true, duration: 0.9, easeLinearity: 0.25 }
  );

  // Show popup with directional slide animation
  const popup = document.getElementById('km-popup');
  popup.classList.remove('anim-left','anim-right');

  // Fill popup content
  const temple = kmData.temples.find(t => t.id === stop.kshetra.id) || {
    id: stop.kshetra.id,
    temple_name: stop.kshetra.temple_name,
    location_city: stop.kshetra.location_city,
    location_state: stop.kshetra.location_state,
    tradition: '', significance: stop.travel_note || '',
    pancha_bhuta_stala: false, divya_desam_number: null, deity: ''
  };
  kmShowPopup(temple, stop);

  // Trigger animation after brief paint delay
  setTimeout(() => {
    if (direction === 'right') popup.classList.add('anim-right');
    else if (direction === 'left') popup.classList.add('anim-left');
    else { popup.classList.add('anim-right'); }
  }, 10);
}

function kmClearRoute() {
  if (kmPlayInterval) { clearInterval(kmPlayInterval); kmPlayInterval = null; }
  kmRouteLines.forEach(l => { try { l.remove(); } catch(e){} });
  kmRouteMarkers.forEach(m => { try { m.remove(); } catch(e){} });
  kmRouteLines = [];
  kmRouteMarkers = [];
  kmCurrentRoute = null;
  kmPlayStep = 0;
  document.getElementById('km-route-panel').style.display = 'none';
  document.getElementById('km-playbar').style.display = 'none';
  const routeBtn = document.getElementById('km-route-btn');
  if (routeBtn) routeBtn.textContent = '— Select a route —';
  document.getElementById('km-pb-play-icon').innerHTML = '<path d="M5 3.5l10 5.5-10 5.5z"/>';
  kmClosePopup();
}



let kmData = { temples: [], compositions: [], junctions: [] };
let kmLoaded = false;
let kmCurrentFilter = 'all';
let kmMap = null;
let kmMarkers = [];
let kmActiveMarker = null;

const KM_COMPOSERS = [
  { id: 'cd478bac-fc19-4fc7-b30a-4045a97b9806', name: 'Muthuswami Dikshitar',            color: '#8B5E10' },
  { id: 'b6dbb72e-0cc3-43e2-a997-a291778a449e', name: 'Tyagaraja',                       color: '#8B3A0F' },
  { id: 'f4cd87e3-ea8e-4850-a7b6-62db009a085c', name: 'Syama Sastri',                    color: '#5C3A8C' },
  { id: '4daf4cea-d672-46b0-b3e3-cf9ee2ad8596', name: 'Tallapaka Annamacharya',          color: '#1A6040' },
  { id: '23c8f9c1-b6e3-42b8-bd3b-2a20d76f832a', name: 'Purandara Dasa',                 color: '#6B4A0F' },
  { id: '589e0bab-6742-4cb8-80eb-9fe7ec88aaf9', name: 'Swati Tirunal',                   color: '#2A4080' },
  { id: '10d1e3ae-5086-4fff-8d4b-cf7bd49782b6', name: 'Ootukkaadu Venkatakavi',         color: '#2A6060' },
  { id: 'f14f0e83-ffb7-46d3-b28d-30a880970ae1', name: 'Mysore Vasudevachar',             color: '#4A6B0F' },
  { id: 'db943134-ce2f-4a03-8529-471c8e09905e', name: 'Harikesanallur Muthiah Bhagavathar', color: '#7A2020' },
  { id: 'b508190c-71c4-4f48-b9ae-4d97f76b384b', name: 'Papanasam Sivan',                color: '#0F5C6B' }
];

function kmGetComposer(id){ return KM_COMPOSERS.find(x=>x.id===id)||{name:'Unknown',color:'#7A5C10'}; }

async function kmInit() {
  if (kmLoaded && kmMap) {
    setTimeout(() => { kmMap.invalidateSize(); kmApplyFilter(); }, 100);
    return;
  }

  document.getElementById('km-loading').style.display = 'flex';
  document.getElementById('km-leaflet').style.display = 'none';

  try {
    const [r1, r2, r3] = await Promise.all([
      db.from('kshetras').select('*').limit(500),
      db.from('compositions').select('id,title,composer_id,raga,tala,language,form,metadata').limit(500),
      db.from('composition_kshetra').select('composition_id,kshetra_id').limit(500)
    ]);

    const rawTemples = r1.data||[];
    const withCoords = rawTemples.filter(t=>t.latitude&&t.longitude);

    kmData.temples      = withCoords;
    kmData.compositions = r2.data||[];
    kmData.junctions    = r3.data||[];

    // Fill composer custom dropdown
    const list = document.getElementById('km-composer-list');
    list.innerHTML = `<div class="km-dropdown-item selected" onclick="kmPickComposer('all','All Composers')">All Composers</div>`;
    KM_COMPOSERS.forEach(c => {
      if(kmData.compositions.some(x=>x.composer_id===c.id)){
        const item = document.createElement('div');
        item.className = 'km-dropdown-item';
        item.textContent = c.name;
        item.onclick = () => kmPickComposer(c.id, c.name);
        list.appendChild(item);
      }
    });

    kmLoaded = true;
    kmBuildMap();
    kmLoadRoutes().then(() => kmShowRouteSelector('all'));

  } catch(e) {
    document.getElementById('km-loading').innerHTML =
      `<div style="padding:24px;text-align:center;font-family:'EB Garamond',serif;font-style:italic;color:var(--txl);">
        Could not load map data.<br><small style="font-size:11px;">${e.message||''}</small>
      </div>`;
  }
}

function kmBuildMap() {
  document.getElementById('km-loading').style.display = 'none';
  const leafletEl = document.getElementById('km-leaflet');
  leafletEl.style.display = 'block';
  leafletEl.style.filter = 'sepia(20%) saturate(85%) brightness(105%)';

  // Destroy existing map
  if (kmMap) { try { kmMap.remove(); } catch(e){} kmMap = null; kmMarkers = []; }

  // CRITICAL: use screen dimensions as guaranteed fallback
  // wrap.clientWidth/Height may be 0 if panel just became visible
  const wrap = document.getElementById('km-map-wrap');
  const W = Math.max(wrap.clientWidth  || 0, window.innerWidth  - 244);
  const H = Math.max(wrap.clientHeight || 0, window.innerHeight - 172);
  leafletEl.style.width  = W + 'px';
  leafletEl.style.height = H + 'px';

  kmMap = L.map('km-leaflet', {
    center: [13.5, 80.0],
    zoom: 6,
    zoomControl: false,
    preferCanvas: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(kmMap);

  kmMap.invalidateSize(true);
  kmMap.on('click', () => kmClosePopup());

  setTimeout(() => kmApplyFilter(), 500);
}

// Global name cleaner — removes internal suffixes anywhere temple names appear
function kmCleanName(name) {
  return (name||'').replace(/ HMB$/i,'').replace(/ Dikshitar$/i,'').replace(/ \(HMB\)$/i,'').trim();
}

// SVG temple icon generator
function kmTempleIcon(temple, size) {
  const isPancha  = !!temple.pancha_bhuta_stala;
  const isDivya   = !!temple.divya_desam_number;
  const isShaiva  = temple.tradition === 'Shaivite';

  // Color scheme
  // Shaivite: warm saffron-ochre
  // Vaishnavite: deep teal-blue
  // Pancha Bhuta: bright gold ring (special Shaivite)
  // Divya Desam: cyan ring (special Vaishnavite)
  const bodyColor  = isShaiva ? '#B5651D' : '#1A7A6E';
  const roofColor  = isShaiva ? '#D4850A' : '#0E5A52';
  const ringColor  = isPancha ? '#E8A020' : isDivya ? '#2ABCBC' : 'white';
  const ringWidth  = (isPancha || isDivya) ? 2.5 : 1.5;

  // Gopuram / temple tower SVG — works for both traditions
  // Shaivite: taller spire (gopuram)
  // Vaishnavite: rounded shikhara top
  const s = size;
  const half = s / 2;

  let svgContent;
  if (isShaiva) {
    // Gopuram — tiered tower with pointed top
    svgContent = `
      <rect x="${half-3}" y="${s*0.62}" width="6" height="${s*0.38}" fill="${bodyColor}"/>
      <rect x="${half-4}" y="${s*0.50}" width="8" height="${s*0.14}" fill="${roofColor}"/>
      <rect x="${half-3}" y="${s*0.38}" width="6" height="${s*0.14}" fill="${bodyColor}"/>
      <rect x="${half-2}" y="${s*0.28}" width="4" height="${s*0.12}" fill="${roofColor}"/>
      <polygon points="${half},${s*0.04} ${half-2},${s*0.28} ${half+2},${s*0.28}" fill="${bodyColor}"/>
      <rect x="${half-1}" y="${s*0.60}" width="2" height="${s*0.16}" fill="${roofColor}" opacity="0.6"/>`;
  } else {
    // Shikhara — rounded dome top (Vaishnavite style)
    svgContent = `
      <rect x="${half-3}" y="${s*0.60}" width="6" height="${s*0.40}" fill="${bodyColor}"/>
      <rect x="${half-4}" y="${s*0.52}" width="8" height="${s*0.10}" fill="${roofColor}"/>
      <ellipse cx="${half}" cy="${s*0.36}" rx="3.5" ry="${s*0.18}" fill="${bodyColor}"/>
      <ellipse cx="${half}" cy="${s*0.22}" rx="2.2" ry="${s*0.12}" fill="${roofColor}"/>
      <circle cx="${half}" cy="${s*0.10}" r="1.5" fill="${bodyColor}"/>
      <rect x="${half-1}" y="${s*0.60}" width="2" height="${s*0.15}" fill="${roofColor}" opacity="0.6"/>`;
  }

  const html = `<div style="position:relative;width:${s}px;height:${s}px;">
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg"
      style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <circle cx="${half}" cy="${half}" r="${half-1}" fill="white" fill-opacity="0.92"
        stroke="${ringColor}" stroke-width="${ringWidth}"/>
      ${svgContent}
    </svg>
    ${isPancha ? `<div style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#E8A020;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);font-size:6px;display:flex;align-items:center;justify-content:center;color:white;">✦</div>` : ''}
    ${isDivya  ? `<div style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:2px;background:#2ABCBC;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>` : ''}
  </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize:   [s, s],
    iconAnchor: [half, half]
  });
}

function kmApplyFilter() {
  if (!kmMap) return;

  kmMarkers.forEach(m => { try { m.remove(); } catch(e){} });
  kmMarkers = [];

  const isFiltered = kmCurrentFilter !== 'all';
  const temples = kmGetFilteredTemples();
  kmUpdateStats(temples);

  temples.forEach(temple => {
    const lat = parseFloat(temple.latitude);
    const lng = parseFloat(temple.longitude);
    if (isNaN(lat) || isNaN(lng) || lat===0 || lng===0) return;

    const kritiCount = kmGetTempleKritis(temple.id).length;

    // Icon size: larger when filtered
    const size = isFiltered
      ? Math.max(28, Math.min(44, 28 + kritiCount * 1.2))
      : Math.max(18, Math.min(28, 18 + kritiCount * 0.5));

    const icon = kmTempleIcon(temple, size);

    // Tooltip — always use clean name
    const cleanName = kmCleanName(temple.temple_name);
    const tooltipText = isFiltered
      ? `${cleanName}  ·  ${kritiCount} kriti${kritiCount!==1?'s':''}`
      : cleanName;

    const marker = L.marker([lat, lng], {
      icon,
      title: cleanName,
      zIndexOffset: kritiCount * 10
    });

    marker.bindTooltip(tooltipText, {
      permanent: false, direction: 'top',
      className: 'km-tooltip',
      offset: [0, -(size/2) - 4]
    });

    marker.on('click', e => {
      L.DomEvent.stopPropagation(e);
      kmShowPopup(temple);
    });

    marker.addTo(kmMap);
    kmMarkers.push(marker);
  });
}

function kmGetFilteredTemples() {
  let temples = kmData.temples;

  // Composer filter
  if (kmCurrentFilter !== 'all') {
    const compIds = new Set(
      kmData.compositions.filter(c=>c.composer_id===kmCurrentFilter).map(c=>c.id)
    );
    const templeIds = new Set(
      kmData.junctions.filter(j=>compIds.has(j.composition_id)).map(j=>j.kshetra_id)
    );
    temples = temples.filter(t=>templeIds.has(t.id));
  }

  // Tradition filter
  if (kmTraditionFilter === 'shaivite')  temples = temples.filter(t=>t.tradition==='Shaivite');
  if (kmTraditionFilter === 'vaishnavite') temples = temples.filter(t=>t.tradition==='Vaishnavite');
  if (kmTraditionFilter === 'pancha')    temples = temples.filter(t=>!!t.pancha_bhuta_stala);
  if (kmTraditionFilter === 'divya')     temples = temples.filter(t=>!!t.divya_desam_number);

  return temples;
}

let kmTraditionFilter = 'all';

function kmSetTraditionFilter(val) {
  // Toggle off if already active
  kmTraditionFilter = (kmTraditionFilter === val) ? 'all' : val;

  // Update active state on legend items
  ['shaivite','vaishnavite','pancha','divya'].forEach(k => {
    const el = document.getElementById('lf-' + k);
    if (el) el.classList.toggle('km-lf-active', kmTraditionFilter === k);
  });

  // Update sidebar subtitle
  const sub = document.querySelector('.km-sidebar-sub');
  if (sub) {
    const labels = {
      shaivite: 'Showing Shaivite temples',
      vaishnavite: 'Showing Vaishnavite temples',
      pancha: 'Showing Pancha Bhuta Stalas',
      divya: 'Showing Divya Desam temples'
    };
    if (kmCurrentFilter !== 'all') {
      // Composer filter is active — don't override its subtitle
    } else {
      sub.textContent = kmTraditionFilter === 'all'
        ? 'Sacred temples & the compositions they inspired'
        : labels[kmTraditionFilter];
    }
  }

  kmClosePopup();
  kmApplyFilter();
}

function kmGetTempleKritis(templeId) {
  const compIds = new Set(
    kmData.junctions.filter(j=>j.kshetra_id===templeId).map(j=>j.composition_id)
  );
  let kritis = kmData.compositions.filter(c=>compIds.has(c.id));
  if (kmCurrentFilter !== 'all') kritis = kritis.filter(c=>c.composer_id===kmCurrentFilter);
  return kritis;
}

function kmUpdateStats(temples) {
  const total = temples.reduce((n,t)=>n+kmGetTempleKritis(t.id).length, 0);
  document.getElementById('km-stat-temples').textContent = temples.length;
  document.getElementById('km-stat-kritis').textContent = total;
}

function kmShowPopup(temple, routeStop) {
  const kritis = kmGetTempleKritis(temple.id);

  document.getElementById('km-popup-tradition').textContent =
    (temple.tradition||'').toUpperCase() + ' TRADITION';
  // Clean up any internal suffixes from temple names
  const cleanName = (temple.temple_name||'').replace(/ HMB$/,'').replace(/ Dikshitar$/,'').trim();
  document.getElementById('km-popup-name').textContent = cleanName;
  document.getElementById('km-popup-location').textContent =
    [temple.location_city, temple.location_state].filter(Boolean).join(', ');
  document.getElementById('km-popup-deity').textContent = temple.deity||'';

  const badgeEl = document.getElementById('km-popup-badges');
  badgeEl.innerHTML = '';
  if (temple.pancha_bhuta_stala)
    badgeEl.innerHTML += '<span class="km-badge pancha">★ PANCHA BHUTA STALA</span>';
  if (temple.divya_desam_number)
    badgeEl.innerHTML += `<span class="km-badge divya">◈ DIVYA DESAM #${temple.divya_desam_number}</span>`;

  document.getElementById('km-popup-sig').textContent = temple.significance||'';

  // Travel note (route context)
  let travelNoteEl = document.getElementById('km-popup-travel');
  if (!travelNoteEl) {
    travelNoteEl = document.createElement('div');
    travelNoteEl.id = 'km-popup-travel';
    travelNoteEl.style.cssText = 'padding:0 16px 12px;font-family:"EB Garamond",serif;font-size:13px;color:var(--tl);line-height:1.6;font-style:italic;border-top:1px solid var(--bo);margin-top:2px;padding-top:10px;';
    document.getElementById('km-popup-sig').after(travelNoteEl);
  }
  if (routeStop?.travel_note) {
    travelNoteEl.textContent = '🛤 ' + routeStop.travel_note;
    travelNoteEl.style.display = 'block';
  } else {
    travelNoteEl.style.display = 'none';
  }

  const kritisEl   = document.getElementById('km-popup-kritis');
  const kritisLabel = document.getElementById('km-popup-kritis-label');

  if (!kritis.length) {
    kritisLabel.style.display='none'; kritisEl.innerHTML='';
  } else {
    kritisLabel.style.display='block';
    kritisLabel.textContent = `${kritis.length} KRITI${kritis.length!==1?'S':''} COMPOSED HERE`;
    kritisEl.innerHTML = kritis.map(k => {
      const meta = (typeof k.metadata==='string'?JSON.parse(k.metadata):k.metadata)||{};
      const cycle = meta.cycle||null;
      const sig   = meta.significance||'';
      const comp  = kmGetComposer(k.composer_id);
      return `<div class="km-kriti-card">
        ${cycle?`<div class="km-kriti-cycle">✦ ${cycle}</div>`:''}
        <div class="km-kriti-title">${k.title||''}</div>
        <div class="km-kriti-composer" style="color:${comp.color}">${comp.name.toUpperCase()}</div>
        <div class="km-kriti-meta">
          ${k.raga?`<span class="km-kriti-tag">${k.raga}</span>`:''}
          ${k.tala?`<span class="km-kriti-tag">· ${k.tala}</span>`:''}
          ${k.language?`<span class="km-kriti-tag">· ${k.language}</span>`:''}
        </div>
        ${sig?`<div class="km-kriti-sig">${sig}</div>`:''}
      </div>`;
    }).join('');
  }

  document.getElementById('km-popup').style.display='block';
}

function kmClosePopup() {
  document.getElementById('km-popup').style.display='none';
}

function kmFilterComposer(val) {
  kmCurrentFilter = val;
  kmClosePopup();
  kmClearRoute();
  kmApplyFilter();
  kmShowRouteSelector(val);

  // Update sidebar sub-title
  const sub = document.querySelector('.km-sidebar-sub');
  if (val === 'all') {
    sub.textContent = 'Sacred temples & the compositions they inspired';
    if (kmMap) kmMap.setView([13.5, 80.0], 6);
  } else {
    const comp = kmGetComposer(val);
    sub.innerHTML = `Showing temples of <strong style="color:${comp.color}">${comp.name}</strong>`;
    const temples = kmGetFilteredTemples();
    if (temples.length && kmMap) {
      const lats = temples.map(t=>parseFloat(t.latitude));
      const lngs = temples.map(t=>parseFloat(t.longitude));
      const pad = 0.8;
      kmMap.fitBounds(
        [[Math.min(...lats)-pad, Math.min(...lngs)-pad],
         [Math.max(...lats)+pad, Math.max(...lngs)+pad]],
        { padding:[40,40], maxZoom:9, animate:true, duration:0.8 }
      );
    }
  }
}

function kmZoomIn()    { if(kmMap) kmMap.zoomIn(); }
function kmZoomOut()   { if(kmMap) kmMap.zoomOut(); }
function kmResetView() {
  // Reset composer filter
  kmCurrentFilter = 'all';
  const sel = document.querySelector('.km-select');
  if (sel) sel.value = 'all';

  // Reset tradition filter
  kmTraditionFilter = 'all';
  ['shaivite','vaishnavite','pancha','divya'].forEach(k => {
    const el = document.getElementById('lf-' + k);
    if (el) el.classList.remove('km-lf-active');
  });

  // Reset subtitle
  const sub = document.querySelector('.km-sidebar-sub');
  if (sub) sub.textContent = 'Sacred temples & the compositions they inspired';

  // Clear route
  kmClearRoute();

  // Hide route selector
  kmShowRouteSelector('all');

  // Re-render all temples
  kmApplyFilter();

  // Reset map view
  if (kmMap) kmMap.setView([13.5, 80.0], 6);
}


