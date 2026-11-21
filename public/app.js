const $=s=>document.querySelector(s), app=$('#app');
const roles={public:['Publik','Informasi terbuka, statistik wilayah, dan pelacakan pengajuan.','◉'],citizen:['Masyarakat','Membuat, memantau, dan mengevaluasi pengajuan simulasi.','♙'],village:['Operator Desa','Memverifikasi dan meneruskan pengajuan tingkat lokal.','⌂'],district:['Operator Kecamatan','Mengkoordinasikan pengajuan lintas desa dan wilayah.','⌘'],opd:['Operator OPD','Melakukan penanganan teknis dan memperbarui realisasi.','▣'],official:['Pejabat Berwenang','Menetapkan keputusan demo dengan alasan dan pertimbangan.','⚖'],auditor:['Auditor/Pengawas','Memeriksa audit trail secara read-only.','◌'],admin:['Administrator Demo','Memulihkan data dan mengelola skenario simulasi.','⚙']};
let activeRole=localStorage.getItem('sitap-role')||'public',demoStep=Number(localStorage.getItem('sitap-demo-step')||0),provinceMap=null;
let demoMode=localStorage.getItem('sitap-demo-mode')==='true';
const api=(url,opt)=>fetch(url,opt).then(async r=>{const x=await r.json().catch(()=>({}));if(!r.ok)throw Error(x.error||'Permintaan gagal');return x});
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c])}
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),3200)}
function syncDemoMode(){
  const toggle=$('#demo-mode-toggle');
  toggle.setAttribute('aria-pressed',String(demoMode));
  toggle.setAttribute('aria-label',`${demoMode?'Matikan':'Nyalakan'} Mode Demo`);
  toggle.title=`${demoMode?'Matikan':'Nyalakan'} Mode Demo`;
  document.querySelectorAll('[data-demo-status]').forEach(status=>status.textContent=demoMode?'Mode Demo Aktif':'Mode Demo Nonaktif');
}
function setDemoMode(enabled){demoMode=enabled;localStorage.setItem('sitap-demo-mode',String(enabled));syncDemoMode()}
const demoModeToggle=$('#demo-mode-toggle');
demoModeToggle.addEventListener('click',()=>setDemoMode(!demoMode));
syncDemoMode();
function headerRoleLabel(role){return role==='public'?'Pengunjung Publik':(roles[role]||roles.public)[0]}
function syncProfileDropdown(){
  const name=$('#active-role-name'),avatar=$('#active-role-avatar'),menu=$('#profile-menu');
  const label=headerRoleLabel(activeRole);
  if(name)name.textContent=label;
  if(avatar)avatar.textContent=label.charAt(0).toUpperCase();
  if(menu)menu.querySelectorAll('[data-role]').forEach(item=>item.setAttribute('aria-checked',String(item.dataset.role===activeRole)));
}
function setProfileDropdownOpen(open,restoreFocus){
  const toggle=$('#profile-menu-toggle'),menu=$('#profile-menu');
  menu.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
  if(restoreFocus)toggle.focus();
}
function initProfileDropdown(){
  const container=$('.profile-dropdown'),toggle=$('#profile-menu-toggle'),menu=$('#profile-menu');
  menu.innerHTML=Object.entries(roles).map(([role])=>`<button type="button" role="menuitemradio" data-role="${role}" aria-checked="false">${esc(headerRoleLabel(role))}</button>`).join('');
  syncProfileDropdown();
  toggle.addEventListener('click',()=>{
    const open=menu.hidden;
    setProfileDropdownOpen(open,false);
    if(open){
      const selected=menu.querySelector('[aria-checked="true"]');
      (selected||menu.querySelector('button')).focus();
    }
  });
  menu.addEventListener('click',event=>{
    const item=event.target.closest('[data-role]');
    if(!item)return;
    setProfileDropdownOpen(false,true);
    setRole(item.dataset.role);
  });
  menu.addEventListener('keydown',event=>{
    const items=Array.from(menu.querySelectorAll('button'));
    const current=items.indexOf(document.activeElement);
    let next;
    if(event.key==='ArrowDown')next=(current+1)%items.length;
    else if(event.key==='ArrowUp')next=(current-1+items.length)%items.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=items.length-1;
    else return;
    event.preventDefault();
    items[next].focus();
  });
  document.addEventListener('click',event=>{
    if(!container.contains(event.target))setProfileDropdownOpen(false,false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu.hidden)setProfileDropdownOpen(false,true);
  });
}
function setRole(role){activeRole=role;localStorage.setItem('sitap-role',role);syncProfileDropdown();location.hash=role==='public'?'#/public':`#/role/${role}`}
initProfileDropdown();
function icon(d){return `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${d}</svg>`}
const ICONS={dash:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',submit:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',stats:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',map:'<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>',audit:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',report:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'};

function badge(x){let cls=/Ditolak|Tidak dapat/.test(x)?'no':/Selesai|Diterima|Terverifikasi/.test(x)?'ok':/Diajukan|Menunggu|Perlu/.test(x)?'warn':/Dalam Pelaksanaan/.test(x)?'purple':/Dalam Proses|Dalam Penanganan|Diteruskan/.test(x)?'inprogress':'info';return `<span class="badge ${cls}">${esc(x)}</span>`}

function sidebarHtml(){
  const pubMenus=[['Dashboard','#/public',ICONS.dash],['Pengajuan','#/public',ICONS.submit],['Statistik','#/public',ICONS.stats],['Peta Pengajuan','#/public',ICONS.map],['Audit Trail','#/audit',ICONS.audit],['Laporan','#/public',ICONS.report],['Pengaturan','#/explore',ICONS.settings]];
  return `<aside class="sidebar"><nav class="sidebar-nav">${pubMenus.map(([label,href,ic],i)=>`<a href="${href}" class="${i===0?'active':''}">${icon(ic)} ${label}</a>`).join('')}</nav><div class="sidebar-demo-box"><div class="sidebar-demo-box-header"><div class="demo-lamp"><svg width="12" height="12" fill="none" stroke="#0d2a50" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 3-2 5-3 6H9c-1-1-3-3-3-6a6 6 0 0 1 6-6z"/></svg></div><b data-demo-status>${demoMode?'Mode Demo Aktif':'Mode Demo Nonaktif'}</b></div><p>Seluruh data pada purwarupa ini bersifat fiktif untuk keperluan demonstrasi.</p><button class="btn-reset" onclick="window.resetDemo()">Reset ke Data Awal</button></div><div class="sitap-footer">&copy; 2025 SITAP &mdash; Purwarupa<br>Bukan layanan resmi pemerintah.</div></aside>`
}

function shell(title,content){
  const r=roles[activeRole]||roles.public;
  const menus=activeRole==='public'?[['Dashboard','#/public',ICONS.dash],['Pengajuan','#/public',ICONS.submit],['Statistik','#/public',ICONS.stats],['Peta Pengajuan','#/public',ICONS.map],['Audit Trail','#/audit',ICONS.audit],['Laporan','#/public',ICONS.report],['Pengaturan','#/explore',ICONS.settings]]:activeRole==='citizen'?[['Dashboard Saya','#/role/citizen',ICONS.dash],['Buat Pengajuan','#/new',ICONS.submit],['Pengajuan Saya','#/mine',ICONS.submit],['Notifikasi','#/mine',ICONS.report]]:activeRole==='auditor'?[['Ringkasan Audit','#/role/auditor',ICONS.dash],['Log Aktivitas','#/audit',ICONS.audit]]:activeRole==='admin'?[['Data Simulasi','#/role/admin',ICONS.dash],['Reset Skenario','#/role/admin',ICONS.settings]]:[['Dashboard',`#/role/${activeRole}`,ICONS.dash],['Inbox Pengajuan','#/inbox',ICONS.submit],['Dokumen & QR','#/documents',ICONS.report]];
  return `<div class="app-body" style="min-height:0"><aside class="sidebar"><nav class="sidebar-nav">${menus.map((m,i)=>`<a href="${m[1]}" class="${i===0?'active':''}">${icon(m[2])} ${m[0]}</a>`).join('')}</nav><div class="sidebar-demo-box"><div class="sidebar-demo-box-header"><div class="demo-lamp"><svg width="12" height="12" fill="none" stroke="#0d2a50" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 3-2 5-3 6H9c-1-1-3-3-3-6a6 6 0 0 1 6-6z"/></svg></div><b data-demo-status>${demoMode?'Mode Demo Aktif':'Mode Demo Nonaktif'}</b></div><p>Seluruh data bersifat fiktif untuk keperluan demonstrasi.</p><button class="btn-reset" onclick="window.resetDemo()">Reset ke Data Awal</button></div><div class="sitap-footer">&copy; 2025 SITAP &mdash; Purwarupa<br>Bukan layanan resmi pemerintah.</div></aside><section class="main-content"><div class="page-head"><div><div class="eyebrow">Role aktif &middot; ${r[0]}</div><h1>${title}</h1></div><button class="secondary" onclick="window.pickRole()">Ganti Role</button></div>${content}</section></div>`
}

async function stats(){return api('/api/stats')}

function statCards(s){
  const items=s.pending===undefined?[['Total pengajuan',s.total],['Dalam proses',s.inProgress],['Selesai direalisasikan',s.accepted],['Ditolak',s.rejected]]:[['Total pengajuan',s.total],['Dalam proses',s.inProgress],['Diterima',s.accepted],['Ditolak',s.rejected],['Selesai realisasi',s.completed],['Belum ditindaklanjuti',s.pending]];
  return `<div class="grid stats">${items.map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('')}</div>`
}

function table(cases){
  return `<div class="table-wrap"><table><thead><tr><th>ID & Judul</th><th>Wilayah</th><th>Instansi</th><th>Proses</th><th>Keputusan</th></tr></thead><tbody>${cases.map(c=>`<tr><td><a class="case-link" href="#/case/${c.case_id}">${c.case_id}</a><br><b>${esc(c.title)}</b></td><td>${esc(c.village)}, ${esc(c.regency)}</td><td>${esc(c.responsible_institution||'—')}</td><td>${badge(c.process_status)}</td><td>${badge(c.decision_outcome)}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:16px;color:#8098b4">Belum ada data yang sesuai.</td></tr>'}</tbody></table></div>`
}

/* ── PETA INDONESIA GEOGRAFIS ── */
function indonesiaMap(){
  /* Jalur SVG disederhanakan tapi geografis (viewBox 0 0 900 400) */
  const land='#8bbf8b', sea='#c2dff0', border='#fff', bw='1';
  /* Lokasi titik data dari seed: Jawa Tengah, Jawa Barat, DI Yogyakarta, Jawa Timur */
  const pts=[
    {x:490,y:255,r:8,c:'#c0392b',label:'Jawa Tengah',n:'3 kasus'},
    {x:420,y:252,r:6,c:'#c0392b',label:'Jawa Barat',n:'1 kasus'},
    {x:505,y:263,r:5,c:'#2168db',label:'DI Yogyakarta',n:'1 kasus'},
    {x:570,y:248,r:5,c:'#2168db',label:'Jawa Timur',n:'1 kasus'},
  ];
  const markers=pts.map(p=>`
    <circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.c}" stroke="#fff" stroke-width="1.5" opacity=".9"/>
    <text x="${p.x}" y="${p.y-p.r-3}" text-anchor="middle" font-size="8.5" fill="${p.c}" font-family="Inter,sans-serif" font-weight="700">${p.label}</text>
  `).join('');
  return `<svg viewBox="0 0 900 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="400" fill="${sea}"/>
  <!-- Sumatera: NW-SE elongated -->
  <path d="M 48,55 Q 72,32 108,34 Q 148,36 178,56 Q 205,72 220,100 Q 232,126 228,156 Q 220,184 200,202 Q 178,218 154,214 Q 128,210 106,198 Q 82,184 64,162 Q 46,138 38,110 Q 30,82 48,55 Z" fill="${land}" stroke="${border}" stroke-width="${bw}"/>
  <!-- Kepulauan Riau & Bangka Belitung -->
  <ellipse cx="230" cy="152" rx="10" ry="7" fill="${land}"/>
  <ellipse cx="244" cy="168" rx="13" ry="8" fill="${land}"/>
  <ellipse cx="228" cy="182" rx="11" ry="6" fill="${land}"/>
  <!-- Jawa: narrow E-W island -->
  <path d="M 188,238 Q 230,224 282,218 Q 340,213 400,217 Q 445,221 468,232 Q 474,245 466,257 Q 436,267 376,270 Q 310,274 252,266 Q 212,260 192,248 Z" fill="${land}" stroke="${border}" stroke-width="${bw}"/>
  <!-- Bali -->
  <ellipse cx="480" cy="258" rx="11" ry="8" fill="${land}" stroke="${border}" stroke-width=".8"/>
  <!-- Lombok -->
  <ellipse cx="498" cy="261" rx="8" ry="8" fill="${land}" stroke="${border}" stroke-width=".8"/>
  <!-- Sumbawa -->
  <ellipse cx="522" cy="265" rx="14" ry="7" fill="${land}" stroke="${border}" stroke-width=".8"/>
  <!-- Flores -->
  <path d="M 540,268 Q 562,264 580,268 Q 590,274 582,282 Q 568,286 548,284 Q 536,280 536,274 Z" fill="${land}" stroke="${border}" stroke-width=".8"/>
  <!-- Sumba -->
  <ellipse cx="550" cy="292" rx="16" ry="9" fill="${land}"/>
  <!-- Timor Barat -->
  <path d="M 594,274 Q 616,268 636,272 Q 646,278 642,288 Q 630,294 610,292 Q 596,288 590,282 Z" fill="${land}" stroke="${border}" stroke-width=".8"/>
  <!-- Kalimantan: large central island -->
  <path d="M 272,86 Q 312,58 364,46 Q 420,36 468,52 Q 505,66 525,96 Q 538,124 534,162 Q 528,194 508,218 Q 486,240 452,250 Q 416,258 376,254 Q 336,250 306,236 Q 278,220 268,196 Q 258,170 262,140 Q 264,112 272,86 Z" fill="${land}" stroke="${border}" stroke-width="${bw}"/>
  <!-- Sulawesi: K-shape, 4 peninsulas -->
  <!-- Lengan Utara -->
  <path d="M 574,80 Q 604,66 630,74 Q 648,84 646,108 Q 640,128 624,140 Q 606,150 588,148 Q 572,142 564,128 Q 556,112 562,96 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Badan Tengah -->
  <path d="M 564,128 Q 562,150 556,170 Q 550,190 544,206 Q 540,218 548,228 Q 558,236 570,232 Q 582,226 584,210 Q 586,194 580,176 Q 574,158 578,144 Q 580,136 588,148 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Lengan Tenggara -->
  <path d="M 578,144 Q 596,148 616,162 Q 632,176 636,196 Q 638,214 626,226 Q 614,234 598,228 Q 584,220 578,206 Q 572,190 578,174 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Lengan Timur -->
  <path d="M 624,140 Q 646,134 666,146 Q 682,158 684,176 Q 684,194 672,206 Q 658,214 644,208 Q 628,200 622,184 Q 616,168 622,152 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Lengan Barat-Selatan -->
  <path d="M 564,128 Q 554,142 544,160 Q 534,178 536,196 Q 540,210 552,216 Q 564,220 574,212 Q 584,202 584,188 Q 584,172 578,156 Q 572,142 564,128 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Maluku -->
  <circle cx="715" cy="134" r="7" fill="${land}"/>
  <circle cx="732" cy="150" r="5" fill="${land}"/>
  <circle cx="702" cy="158" r="5" fill="${land}"/>
  <circle cx="722" cy="174" r="5" fill="${land}"/>
  <circle cx="708" cy="196" r="6" fill="${land}"/>
  <circle cx="726" cy="214" r="5" fill="${land}"/>
  <circle cx="740" cy="180" r="4" fill="${land}"/>
  <!-- Papua Barat (Kepala Burung) -->
  <path d="M 756,108 Q 742,88 726,82 Q 712,78 704,90 Q 698,102 706,116 Q 716,128 734,132 Q 750,134 758,120 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Papua Tubuh Utama -->
  <path d="M 758,120 Q 764,102 778,92 Q 798,80 826,84 Q 856,90 874,108 Q 888,128 886,154 Q 882,180 866,200 Q 848,218 822,228 Q 796,236 772,230 Q 750,224 740,208 Q 730,190 732,166 Q 734,142 748,128 Z" fill="${land}" stroke="${border}" stroke-width=".9"/>
  <!-- Label pulau utama -->
  <text x="134" y="140" text-anchor="middle" font-size="9" fill="#3a6a3a" font-family="Inter,sans-serif" font-weight="600" opacity=".8">Sumatera</text>
  <text x="380" y="244" text-anchor="middle" font-size="9" fill="#3a6a3a" font-family="Inter,sans-serif" font-weight="600" opacity=".8">Jawa</text>
  <text x="395" y="148" text-anchor="middle" font-size="9" fill="#3a6a3a" font-family="Inter,sans-serif" font-weight="600" opacity=".8">Kalimantan</text>
  <text x="596" y="192" text-anchor="middle" font-size="9" fill="#3a6a3a" font-family="Inter,sans-serif" font-weight="600" opacity=".8">Sulawesi</text>
  <text x="810" y="162" text-anchor="middle" font-size="9" fill="#3a6a3a" font-family="Inter,sans-serif" font-weight="600" opacity=".8">Papua</text>
  <!-- Titik data simulasi (dari seed.js) -->
  ${markers}
  <!-- Legenda -->
  <rect x="12" y="368" width="8" height="8" rx="4" fill="#c0392b"/>
  <text x="24" y="376" font-size="9" fill="#444" font-family="Inter,sans-serif">Lokasi data simulasi (Jawa Tengah, Jawa Barat)</text>
  <rect x="12" y="382" width="8" height="8" rx="4" fill="#2168db"/>
  <text x="24" y="390" font-size="9" fill="#444" font-family="Inter,sans-serif">Lokasi data simulasi (DI Yogyakarta, Jawa Timur)</text>
</svg>`
}

const provinceCenters={
  aceh:[4.7,96.7],'sumatera utara':[2.0,99.5],'sumatera barat':[-0.5,100.5],riau:[0.6,101.8],
  jambi:[-1.6,103.6],'sumatera selatan':[-3.2,104.0],bengkulu:[-3.7,102.3],lampung:[-4.8,105.0],
  'kepulauan bangka belitung':[-2.7,106.5],'kepulauan riau':[3.9,108.2],banten:[-6.4,106.1],
  'dki jakarta':[-6.2,106.8],jakarta:[-6.2,106.8],'jawa barat':[-6.9,107.6],'jawa tengah':[-7.2,110.0],
  'di yogyakarta':[-7.8,110.4],'d.i. yogyakarta':[-7.8,110.4],'daerah istimewa yogyakarta':[-7.8,110.4],
  'jawa timur':[-7.5,112.5],bali:[-8.4,115.2],'nusa tenggara barat':[-8.6,117.4],
  'nusa tenggara timur':[-8.7,121.5],'kalimantan barat':[0.0,110.2],'kalimantan tengah':[-1.7,113.5],
  'kalimantan selatan':[-3.1,115.4],'kalimantan timur':[0.5,116.5],'kalimantan utara':[3.0,117.2],
  'sulawesi utara':[1.4,124.8],gorontalo:[0.7,122.4],'sulawesi tengah':[-1.4,120.0],
  'sulawesi barat':[-2.5,119.4],'sulawesi selatan':[-3.8,119.9],'sulawesi tenggara':[-4.1,122.2],
  maluku:[-3.2,130.3],'maluku utara':[1.5,127.5],'papua barat':[-1.0,132.0],
  'papua barat daya':[-0.8,132.5],papua:[-4.3,138.0],'papua tengah':[-3.0,136.0],
  'papua pegunungan':[-4.0,139.5],'papua selatan':[-7.5,139.0]
};

function initializeProvinceMap(provRows){
  const container=$('#province-map'),note=$('#province-map-note');
  if(provinceMap){provinceMap.remove();provinceMap=null}
  if(!window.L){
    container.innerHTML='<p class="map-load-error">Peta tidak dapat dimuat. Periksa koneksi internet, lalu muat ulang halaman.</p>';
    return;
  }
  const L=window.L,missing=[];
  provinceMap=L.map(container,{scrollWheelZoom:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(provinceMap);
  provinceMap.fitBounds([[-11,94],[6,141]],{padding:[8,8]});
  provRows.forEach(([province,count])=>{
    const coordinates=provinceCenters[province.trim().toLowerCase()];
    if(!coordinates){missing.push(province);return}
    L.circleMarker(coordinates,{
      radius:Math.min(13,6+Math.sqrt(count)),
      color:'#fff',
      weight:2,
      fillColor:'#1a5fcc',
      fillOpacity:.9
    }).addTo(provinceMap)
      .bindTooltip(`${esc(province)}: ${count} kasus`)
      .bindPopup(`<strong>${esc(province)}</strong><br>${count} kasus`);
  });
  note.textContent=missing.length
    ?`Lokasi belum tersedia pada peta untuk: ${missing.map(esc).join(', ')}.`
    :'Klik penanda untuk melihat jumlah kasus per provinsi.';
}

/* ── TREN PENGAJUAN — data ilustrasi, dilabel jelas ── */
function trendChart(total,selesai,ditolak){
  /* Gunakan angka nyata sebagai titik akhir, lainnya proporsional */
  const scale=n=>Math.round(n);
  const t6=scale(total*0.47),t5=scale(total*0.56),t4=scale(total*0.65),t3=scale(total*0.73),t2=scale(total*0.84),t1=total;
  const s6=scale(selesai*0.30),s5=scale(selesai*0.42),s4=scale(selesai*0.55),s3=scale(selesai*0.65),s2=scale(selesai*0.80),s1=selesai;
  const d6=scale(ditolak*0.50),d5=scale(ditolak*0.60),d4=scale(ditolak*0.68),d3=scale(ditolak*0.76),d2=scale(ditolak*0.88),d1=ditolak;
  const totalPts=[t6,t5,t4,t3,t2,t1];
  const selesaiPts=[s6,s5,s4,s3,s2,s1];
  const ditolakPts=[d6,d5,d4,d3,d2,d1];
  const months=['Jun','Jul','Agu','Sep','Okt','Nov'];
  const W=420,H=155,padL=32,padB=22,padT=8,padR=8;
  const gW=W-padL-padR, gH=H-padB-padT;
  const all=[...totalPts,...selesaiPts,...ditolakPts];
  const minV=0, maxV=Math.max(...all)||1;
  function px(v){return H-padB-(v-minV)/(maxV-minV)*gH}
  function gx(i){return padL+i/(months.length-1)*gW}
  const ySteps=4;
  const yTicks=Array.from({length:ySteps+1},(_,i)=>Math.round(maxV/ySteps*i));
  function polyline(pts,color){
    const points=pts.map((v,i)=>`${gx(i)},${px(v)}`).join(' ');
    const dots=pts.map((v,i)=>`<circle cx="${gx(i)}" cy="${px(v)}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"/>`).join('');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}`
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px">
    ${yTicks.map(v=>`<line x1="${padL}" y1="${px(v)}" x2="${W-padR}" y2="${px(v)}" stroke="#e8eef5" stroke-width="1"/>
    <text x="${padL-4}" y="${px(v)+4}" text-anchor="end" class="chart-axis-label">${v}</text>`).join('')}
    ${months.map((m,i)=>`<text x="${gx(i)}" y="${H-5}" text-anchor="middle" class="chart-axis-label">${m}</text>`).join('')}
    ${polyline(totalPts,'#1a5fcc')}
    ${polyline(selesaiPts,'#0e8a6a')}
    ${polyline(ditolakPts,'#c0640a')}
  </svg>`
}

async function landing(){
  const s=await stats();
  app.innerHTML=`
<div class="home-showcase">
<section class="hero-banner">
  <div class="hero-inner">
    <div class="hero-left">
      <div class="eyebrow">Purwarupa civic-tech &middot; data simulasi</div>
      <h1>Dari aspirasi<br>ke aksi yang<br>dapat ditelusuri.</h1>
      <p>SITAP menghubungkan pengajuan masyarakat, proses administrasi, keputusan, pelaksanaan, dan pengawasan dalam satu alur yang terbuka.</p>
      <div class="hero-actions">
        <a class="button demo-cta" href="#/demo">Ikuti Demo Terpandu <span class="demo-cta-arrow" aria-hidden="true">&nearr;</span></a>
        <a class="button secondary" href="#/explore">Jelajahi Manual</a>
      </div>
    </div>
    <aside class="hero-panel">
      <div class="eyebrow" style="color:#1a5fcc">Transparansi wilayah</div>
      <h3>Pengajuan terbuka untuk dipantau</h3>
      <div class="hero-stats">
        <div class="hero-stat"><strong>${s.total}</strong><span>Total pengajuan</span></div>
        <div class="hero-stat"><strong>${s.inProgress}</strong><span>Dalam proses</span></div>
        <div class="hero-stat"><strong>${s.completed}</strong><span>Selesai realisasi</span></div>
        <div class="hero-stat"><strong>${s.rejected}</strong><span>Ditolak</span></div>
        <div class="hero-stat"><strong>${s.completed}</strong><span>Selesai realisasi</span></div>
        <div class="hero-stat"><strong>${s.pending||0}</strong><span>Belum ditindaklanjuti</span></div>
      </div>
      <div class="hero-notice"><b>Catatan:</b> SITAP bukan kanal resmi pemerintah. Seluruh nama, data, dan keputusan dalam purwarupa ini adalah simulasi.</div>
    </aside>
  </div>
</section>
<section class="section home-features">
  <h2>Cara kerja SITAP</h2>
  <div class="cards">
    <div class="card"><div class="role-icon"><svg width="22" height="22" fill="none" stroke="#1a5fcc" stroke-width="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></div><h3>Terhubung antarperan</h3><p>Setiap perubahan status oleh satu peran langsung tampil pada timeline, dashboard, dan audit trail yang sama.</p></div>
    <div class="card"><div class="role-icon"><svg width="22" height="22" fill="none" stroke="#1a5fcc" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div><h3>Transparan sesuai porsi</h3><p>Portal publik hanya memperlihatkan data yang layak dibuka &mdash; tanpa identitas warga atau dokumen sensitif.</p></div>
    <div class="card"><div class="role-icon"><svg width="22" height="22" fill="none" stroke="#1a5fcc" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><h3>Setiap tindakan tercatat</h3><p>Setiap langkah penting menyimpan aktor, waktu, alasan, dan perubahan status secara kronologis di audit trail.</p></div>
  </div>
</section>
</div>
<section class="app-about">
  <div class="app-about-inner">
    <div class="eyebrow">Tentang aplikasi</div>
    <h2>Mengenal SITAP</h2>
    <p>SITAP (Sistem Integrasi, Transparansi, dan Akuntabilitas Pemerintahan) adalah purwarupa aplikasi untuk memperlihatkan alur aspirasi masyarakat, mulai dari pengajuan dan verifikasi hingga tindak lanjut, keputusan, serta pemantauan realisasi.</p>
    <p>Setiap peran melihat informasi dan tindakan sesuai kewenangannya. Informasi yang ditampilkan kepada publik dirancang agar proses dapat dipantau tanpa membuka identitas atau dokumen sensitif.</p>
    <div class="app-about-note">Seluruh data dan aktivitas pada aplikasi ini hanya simulasi untuk demonstrasi, bukan layanan resmi pemerintah.</div>
  </div>
</section>
<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="site-footer-brand">
      <strong>SITAP</strong>
      <span>Sistem Integrasi, Transparansi, dan Akuntabilitas Pemerintahan</span>
    </div>
    <span class="site-footer-copy">&copy; 2026 SITAP &middot; Purwarupa demonstrasi</span>
  </div>
</footer>`
}


async function publicPage(){
  const [s,cases]=await Promise.all([stats(),api('/api/cases')]);
  const featured=cases.slice(0,5);
  const total=s.total||0, selesai=s.completed||0, proses=s.inProgress||0, ditolak=s.rejected||0;
  const pct=n=>total?Math.round(n/total*100):0;

  /* Kelompokkan berdasarkan provinsi dari data nyata */
  const byProv={};
  cases.forEach(c=>{const p=c.province||'Lainnya';byProv[p]=(byProv[p]||0)+1});
  const provRows=Object.entries(byProv).sort((a,b)=>b[1]-a[1]);

  app.innerHTML=`
<div class="app-body">
${sidebarHtml()}
<div class="main-content">

<!-- HEADER BERANDA: langsung ke poin, tanpa hero banner dekoratif -->
<div class="dash-header">
  <div class="dash-header-left">
    <h1>Dashboard Publik <span class="tag-simulasi">Data Simulasi</span></h1>
    <p>Ringkasan pengajuan masyarakat yang dapat dipantau secara terbuka &mdash; data diambil langsung dari server.</p>
  </div>
  <a href="#/explore" class="button secondary">Ganti Peran &rarr;</a>
</div>

<!-- STAT CARDS: angka nyata dari API, tanpa grafik dekoratif -->
<div class="stat-grid">
  <div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-label">Total Pengajuan</span>
    </div>
    <div class="stat-value">${total}</div>
    <div class="stat-desc">Tercatat dalam sistem simulasi</div>
  </div>
  <div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-label">Sedang Diproses</span>
    </div>
    <div class="stat-value">${proses}</div>
    <div class="stat-desc">Belum selesai ditangani</div>
  </div>
  <div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-label">Selesai Direalisasikan</span>
    </div>
    <div class="stat-value">${selesai}</div>
    <div class="stat-desc">Sudah ada bukti pelaksanaan</div>
  </div>
  <div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-label">Tidak Dilanjutkan</span>
    </div>
    <div class="stat-value">${ditolak}</div>
    <div class="stat-desc">Alasan tersedia di detail kasus</div>
  </div>
</div>

<!-- GRID UTAMA: 2 kolom -->
<div class="dash-main-grid">

  <!-- KOLOM KIRI: Grafik tren + Tabel pengajuan -->
  <div class="dash-col">
    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>Tren Pengajuan 6 Bulan Terakhir</h3>
          <p class="panel-sub">Angka proyeksi proporsional dari data saat ini &mdash; bukan data historis nyata</p>
        </div>
      </div>
      <div class="chart-wrap">${trendChart(total,selesai,ditolak)}</div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-dot" style="background:#1a5fcc"></span>Total</span>
        <span class="legend-item"><span class="legend-dot" style="background:#0e8a6a"></span>Selesai</span>
        <span class="legend-item"><span class="legend-dot" style="background:#c0640a"></span>Ditolak</span>
      </div>
    </div>

    <!-- TABEL PENGAJUAN TERBARU -->
    <div class="panel">
      <div class="panel-head">
        <h3>Pengajuan Terbaru</h3>
        <a href="#/public">Lihat Semua &rarr;</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID Pengajuan</th>
              <th>Judul</th>
              <th>Wilayah</th>
              <th>Instansi</th>
              <th>Tgl. Masuk</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${featured.map(c=>{
              const tgl=c.created_at?new Date(c.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'—';
              return `<tr>
                <td><a class="case-link" href="#/case/${c.case_id}">${esc(c.case_id)}</a></td>
                <td><div class="td-title">${esc(c.title)}</div><div class="td-meta">${esc(c.category)}</div></td>
                <td><div class="td-title">${esc(c.regency||'—')}</div><div class="td-meta">${esc(c.province||'')}</div></td>
                <td style="font-size:12px;max-width:140px">${esc(c.responsible_institution||'—')}</td>
                <td style="font-size:12px;white-space:nowrap">${tgl}</td>
                <td>${badge(c.process_status)}</td>
                <td><button class="action-btn" title="Lihat detail" onclick="location.hash='#/case/${c.case_id}'">${icon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>')}</button></td>
              </tr>`
            }).join('')||'<tr><td colspan="7" style="text-align:center;padding:18px;color:#8098b4">Belum ada data.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- KOLOM KANAN: Peta + Status + Sebaran provinsi + Info QR -->
  <div class="dash-col">

    <!-- PETA INDONESIA GEOGRAFIS -->
    <div class="panel">
      <div class="panel-head">
        <div>
          <h3>Sebaran per Provinsi</h3>
          <p class="panel-sub">Peta interaktif OpenStreetMap</p>
        </div>
      </div>
      <div id="province-map" class="map-container" role="application" aria-label="Peta interaktif sebaran pengajuan per provinsi"></div>
      <p class="map-note" id="province-map-note" aria-live="polite"></p>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
        ${provRows.map(([prov,n])=>`
          <div class="sbar-row">
            <div class="sbar-meta"><span class="sbar-name">${esc(prov)}</span><span class="sbar-pct">${n} kasus</span></div>
            <div class="sbar-track"><div class="sbar-fill" style="width:${Math.round(n/total*100)}%;background:#1a5fcc"></div></div>
          </div>`).join('')}
      </div>
    </div>

    <!-- RINGKASAN STATUS: bar horizontal, bukan donut dekoratif -->
    <div class="panel">
      <div class="panel-head">
        <h3>Ringkasan Status</h3>
      </div>
      <div class="status-bars">
        <div class="sbar-row">
          <div class="sbar-meta"><span class="sbar-name">Selesai Direalisasikan</span><span class="sbar-pct">${selesai} kasus (${pct(selesai)}%)</span></div>
          <div class="sbar-track"><div class="sbar-fill" style="width:${pct(selesai)}%;background:#0e8a6a"></div></div>
        </div>
        <div class="sbar-row">
          <div class="sbar-meta"><span class="sbar-name">Sedang Diproses</span><span class="sbar-pct">${proses} kasus (${pct(proses)}%)</span></div>
          <div class="sbar-track"><div class="sbar-fill" style="width:${pct(proses)}%;background:#1a5fcc"></div></div>
        </div>
        <div class="sbar-row">
          <div class="sbar-meta"><span class="sbar-name">Tidak Dilanjutkan</span><span class="sbar-pct">${ditolak} kasus (${pct(ditolak)}%)</span></div>
          <div class="sbar-track"><div class="sbar-fill" style="width:${pct(ditolak)}%;background:#c0640a"></div></div>
        </div>
        <div class="sbar-row">
          <div class="sbar-meta"><span class="sbar-name">Belum Ditindaklanjuti</span><span class="sbar-pct">${s.pending||0} kasus (${pct(s.pending||0)}%)</span></div>
          <div class="sbar-track"><div class="sbar-fill" style="width:${pct(s.pending||0)}%;background:#9baabb"></div></div>
        </div>
      </div>
    </div>

    <!-- INFO QR: fungsional, bukan dekoratif -->
    <div class="qr-strip">
      <div class="qr-strip-icon">
        <svg width="22" height="22" fill="none" stroke="#1a5fcc" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/><rect x="18" y="18" width="3" height="3"/></svg>
      </div>
      <div class="qr-strip-text">
        <h4>Verifikasi Dokumen via QR</h4>
        <p>Setiap dokumen yang diregistrasikan mendapat QR unik yang menampilkan metadata &mdash; bukan isi dokumen sensitif.</p>
      </div>
      <div class="qr-strip-action">
        <a href="#/documents" class="button secondary">Coba &rarr;</a>
      </div>
    </div>

  </div>
</div>

<!-- FILTER & DAFTAR LENGKAP -->
<div class="panel" style="margin-top:14px">
  <div class="panel-head">
    <h3>Telusuri Semua Pengajuan</h3>
  </div>
  <div class="filters" style="margin-bottom:12px">
    <input id="search" placeholder="Cari ID atau judul pengajuan...">
    <select id="filter-status">
      <option value="">Semua status proses</option>
      ${[...new Set(cases.map(c=>c.process_status))].map(v=>`<option>${v}</option>`).join('')}
    </select>
    <select id="filter-prov">
      <option value="">Semua provinsi</option>
      ${[...new Set(cases.map(c=>c.province).filter(Boolean))].map(v=>`<option>${v}</option>`).join('')}
    </select>
  </div>
  <div id="case-table">${table(cases)}</div>
</div>

</div>
</div>`;

  function filter(){
    const q=$('#search').value.toLowerCase();
    const st=$('#filter-status').value;
    const pv=$('#filter-prov').value;
    $('#case-table').innerHTML=table(cases.filter(c=>
      (!q||`${c.case_id} ${c.title}`.toLowerCase().includes(q))&&
      (!st||c.process_status===st)&&
      (!pv||c.province===pv)
    ));
  }
  $('#search').oninput=filter;
  $('#filter-status').onchange=filter;
  $('#filter-prov').onchange=filter;
  initializeProvinceMap(provRows);
}

function rolePicker(){app.innerHTML=`<section class="section"><div class="eyebrow">Jelajahi Manual</div><h1>Pilih konteks simulasi</h1><p class="muted">Pemilihan peran hanya mengatur pengalaman demo, bukan autentikasi sistem produksi.</p><div class="cards">${Object.entries(roles).map(([k,r])=>`<div class="card"><div class="role-icon">${r[2]}</div><h3>${r[0]}</h3><p>${r[1]}</p><button onclick="window.selectRole('${k}')">Masuk sebagai ${r[0]}</button></div>`).join('')}</div></section>`}

const demo=[['Publik melihat masalah','Pengunjung melihat dashboard wilayah dan contoh pengajuan yang terbuka.','public','#/public'],['Masyarakat mengajukan aspirasi','Buka formulir pengajuan dan kirim usulan perbaikan jalan. ID pengajuan dibuat oleh server.','citizen','#/new'],['Operator desa memverifikasi','Periksa kelengkapan dan ubah status menjadi terverifikasi.','village','#/inbox'],['OPD menangani','Teruskan atau perbarui progres penanganan teknis.','opd','#/inbox'],['Pejabat memutuskan','Keputusan diterima atau ditolak selalu memerlukan alasan dan dasar pertimbangan.','official','#/inbox'],['OPD mencatat realisasi','Perbarui progres pelaksanaan dan bukti simulasi.','opd','#/inbox'],['Masyarakat mengevaluasi','Berikan rating setelah kasus memungkinkan evaluasi.','citizen','#/mine'],['Auditor memeriksa','Audit trail bersifat baca-saja dan memperlihatkan aktor serta waktu.','auditor','#/audit']];

function demoPage(){let d=demo[demoStep]||demo[0];app.innerHTML=`<section class="section"><div class="eyebrow">Demo terpandu &middot; ${demoStep+1}/${demo.length}</div><h1>Ikuti satu perjalanan data SITAP</h1><div class="demo-panel"><div class="step">TAHAP ${demoStep+1} &middot; ROLE: ${roles[d[2]][0].toUpperCase()}</div><h3>${d[0]}</h3><p>${d[1]}</p><div class="actions"><button class="secondary" onclick="window.demoNav(-1)" ${demoStep===0?'disabled':''}>Kembali</button><button onclick="window.openDemoStep()">Lihat halaman terkait</button><button class="secondary" onclick="window.demoNav(1)" ${demoStep===demo.length-1?'disabled':''}>Lanjut</button><button class="secondary" onclick="window.resetDemo()">Reset demo</button></div></div><div class="progress"><i style="width:${(demoStep+1)/demo.length*100}%"></i></div><p class="notice">Setiap tindakan tetap dilakukan pada halaman nyata. Ketika status diubah, dashboard publik, detail pengajuan, dan log audit membaca data server yang sama.</p></section>`}

function newCase(){app.innerHTML=shell('Buat Pengajuan',`<p class="notice">Setelah dikirim, pengajuan memperoleh nomor pelacakan dan muncul pada inbox operator simulasi.</p><form id="new-case"><div class="form-grid"><label>Judul pengajuan<input name="title" required placeholder="Contoh: Perbaikan jalan lingkungan"></label><label>Jenis pengajuan<select name="type"><option>Aspirasi</option><option>Pengaduan</option><option>Permintaan informasi</option></select></label><label>Kategori<select name="category"><option>Usulan Pembangunan</option><option>Infrastruktur</option><option>Kesehatan</option><option>Pendidikan</option></select></label><label>Visibilitas informasi<select name="visibility"><option value="public">Publik (ringkasan disaring)</option><option value="terbatas">Terbatas</option></select></label></div><label>Deskripsi<textarea name="description" required placeholder="Jelaskan masalah atau usulan dengan jelas."></textarea></label><div class="form-grid"><label>Provinsi<input name="province" value="Jawa Tengah" required></label><label>Kabupaten/kota<input name="regency" value="Kabupaten Arunika" required></label><label>Kecamatan<input name="district" value="Kecamatan Cendana" required></label><label>Desa/kelurahan<input name="village" value="Desa Sukamaju" required></label><label>Lokasi spesifik<input name="location" placeholder="RT/RW atau patokan lokasi"></label><label>Lampiran simulasi<input type="file" name="attachment" accept="image/*,.pdf"></label></div><button>Kirim Pengajuan</button></form>`);$('#new-case').onsubmit=async e=>{e.preventDefault();try{let r=await api('/api/cases',{method:'POST',body:new FormData(e.target)});toast(`Pengajuan berhasil dibuat: ${r.caseId}`);location.hash=`#/case/${r.caseId}`}catch(x){toast(x.message)}}}

function actionForm(c){if(['village','district'].includes(activeRole))return `<form id="action"><h3>Verifikasi &amp; penerusan</h3><label>Catatan verifikasi<textarea name="note" required placeholder="Tuliskan hasil pemeriksaan."></textarea></label><label>Instansi tujuan<input name="target" value="Dinas Pekerjaan Umum Kabupaten Arunika" required></label><div class="actions"><button value="verify">Verifikasi</button><button class="secondary" value="route">Teruskan</button></div></form>`;if(activeRole==='opd')return `<form id="action" enctype="multipart/form-data"><h3>Pembaruan progres</h3><label>Progres 0–100<input type="number" name="progress" min="0" max="100" value="${c.progress}"></label><label>Status proses<select name="status"><option>Dalam Penanganan</option><option>Dalam Pelaksanaan</option><option>Selesai</option></select></label><label>Catatan pelaksanaan<textarea name="note" required></textarea></label><label>Bukti pelaksanaan simulasi<input type="file" name="evidence"></label><button>Perbarui progres</button></form>`;if(activeRole==='official')return `<form id="action"><h3>Keputusan simulasi</h3><label>Hasil keputusan<select name="outcome"><option>Diterima</option><option>Ditolak</option></select></label><label>Alasan keputusan<textarea name="reason" required></textarea></label><label>Dasar pertimbangan<textarea name="consideration" required></textarea></label><button>Simpan keputusan</button></form>`;if(activeRole==='citizen'&&c.owner_name==='Andi Pratama'&&(['Selesai','Dalam Pelaksanaan'].includes(c.process_status)||c.decision_outcome!=='Belum ada'))return `<form id="action"><h3>Evaluasi pemerintah</h3><div class="form-grid">${[['responsiveness','Responsivitas'],['transparency','Transparansi'],['timeliness','Ketepatan waktu'],['resultScore','Hasil penyelesaian']].map(r=>`<label>${r[1]}<select name="${r[0]}">${[5,4,3,2,1].map(x=>`<option value="${x}">${x} / 5</option>`).join('')}</select></label>`).join('')}</div><label>Komentar<textarea name="comment"></textarea></label><button>Kirim evaluasi</button></form>`;return `<div class="card"><h3>Informasi akses</h3><p class="muted">Tidak ada tindakan yang tersedia untuk peran ini. Pilih peran lain untuk melanjutkan alur simulasi.</p></div>`}

async function caseDetail(id){try{const c=await api(`/api/cases/${id}`);app.innerHTML=shell(c.title,`<div class="notice"><b>${c.case_id}</b> &middot; ${c.category} &middot; ${esc(c.village)}, ${esc(c.district)}, ${esc(c.regency)}</div><div class="detail-grid section"><div class="grid"><div class="card"><div class="actions">${badge(c.process_status)} ${badge(c.decision_outcome)} ${badge(c.implementation_status)}</div><h3>Ringkasan pengajuan</h3><p>${esc(c.description)}</p><p class="muted"><b>Instansi:</b> ${esc(c.responsible_institution)}<br><b>Pelapor simulasi:</b> ${esc(c.owner_name)}</p>${c.progress?`<b>Realisasi ${c.progress}%</b><div class="progress"><i style="width:${c.progress}%"></i></div>`:''}</div>${c.decision?`<div class="card"><h3>Keputusan: ${badge(c.decision.outcome)}</h3><p><b>Alasan:</b> ${esc(c.decision.reason)}</p><p><b>Dasar:</b> ${esc(c.decision.consideration)}</p><small>Simulasi oleh ${esc(c.decision.official)}</small></div>`:''}<div class="card"><h3>Riwayat aktivitas</h3><div class="timeline">${c.events.map(e=>`<div class="event"><b>${esc(e.action)}</b><br><span>${esc(e.note||'')}</span><br><small>${esc(e.actor)} &middot; ${esc(e.role)} &middot; ${new Date(e.created_at).toLocaleString('id-ID')}</small></div>`).join('')}</div></div></div><aside>${actionForm(c)}</aside></div>`);const f=$('#action');if(f)f.onsubmit=async e=>{e.preventDefault();try{let endpoint='',body;const form=new FormData(f);if(activeRole==='opd'){endpoint=`/api/cases/${id}/progress`;form.append('role','opd');body=form}else{let o=Object.fromEntries(form);o.role=activeRole;endpoint=activeRole==='official'?`/api/cases/${id}/decision`:activeRole==='citizen'?`/api/cases/${id}/feedback`:e.submitter?.value==='route'?`/api/cases/${id}/route`:`/api/cases/${id}/verify`;body=JSON.stringify(o)}await api(endpoint,{method:'POST',headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body});toast('Perubahan tersimpan dan dicatat pada audit trail.');caseDetail(id)}catch(x){toast(x.message)}}}catch(x){app.innerHTML=`<p>${esc(x.message)}</p>`}}

async function inbox(){const cases=await api('/api/cases');let title=activeRole==='official'?'Antrean Keputusan':activeRole==='opd'?'Antrean Penanganan':'Inbox Pengajuan';let filtered=cases.filter(c=>activeRole==='official'?c.process_status==='Menunggu Keputusan'||c.decision_outcome==='Belum ada':activeRole==='opd'?['Diteruskan','Dalam Penanganan','Dalam Pelaksanaan'].includes(c.process_status):true);app.innerHTML=shell(title,`<p class="muted">Pilih satu pengajuan untuk menampilkan tindakan sesuai peran aktif.</p>${table(filtered)}`)}

async function mine(){const cases=(await api('/api/cases')).filter(c=>c.owner_name==='Andi Pratama');app.innerHTML=shell('Pengajuan Saya',`${table(cases)}`)}

async function audit(){const rows=await api('/api/audit');app.innerHTML=shell('Audit Trail',`<p class="notice">Peran auditor bersifat hanya-baca. Riwayat tidak dapat diubah atau dihapus melalui antarmuka.</p><div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Kasus</th><th>Aktivitas</th><th>Aktor</th><th>Perubahan</th></tr></thead><tbody>${rows.map(e=>`<tr><td style="font-size:11px;white-space:nowrap">${new Date(e.created_at).toLocaleString('id-ID')}</td><td><a class="case-link" href="#/case/${e.case_id}">${e.case_id}</a><br><small>${esc(e.title)}</small></td><td>${esc(e.action)}<br><small>${esc(e.note||'')}</small></td><td>${esc(e.actor)}<br><small>${esc(e.role)} &middot; ${esc(e.institution)}</small></td><td style="font-size:12px">${esc(e.before_status||'—')} &rarr; ${esc(e.after_status||'—')}</td></tr>`).join('')}</tbody></table></div>`)}

function documents(){app.innerHTML=shell('Registrasi Dokumen & QR',`<p class="notice">QR hanya memuat tautan token verifikasi, bukan NIK atau isi dokumen sensitif. Keputusan tidak berubah karena pemindaian QR.</p><form id="doc"><div class="form-grid"><label>Judul dokumen<input name="title" required></label><label>ID kasus terkait (opsional)<input name="caseId" placeholder="SITAP-ASP-2026-000001"></label><label>Instansi pengaju<input name="sourceInstitution" required></label><label>Instansi tujuan<input name="targetInstitution" required></label><label>Nomor surat<input name="letterNumber" required></label><label>Tanggal surat<input type="date" name="letterDate" required></label></div><label>Deskripsi<textarea name="description"></textarea></label><label>File dokumen simulasi<input type="file" name="file" accept=".pdf,.doc,.docx"></label><button>Registrasikan dokumen</button></form><div id="doc-result"></div>`);$('#doc').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/documents',{method:'POST',body:new FormData(e.target)});const d=await api(`/api/documents/${r.documentId}`);$('#doc-result').innerHTML=`<div class="card section"><h3>Dokumen berhasil diregistrasikan</h3><p><b>${d.document_id}</b><br>Token verifikasi aman dibuat untuk metadata dokumen.</p><img src="${d.qrDataUrl}" width="180" alt="QR verifikasi ${d.document_id}"><div class="actions"><a class="button" href="/api/documents/${d.document_id}/qr.png" download>Unduh QR PNG</a><a class="button secondary" href="/api/documents/${d.document_id}/cover-sheet">Unduh Lembar Kendali PDF</a><a class="button secondary" href="#/verify/${d.verification_token}">Buka Verifikasi</a></div></div>`;toast('ID dan QR berhasil dibuat.')}catch(x){toast(x.message)}}}

async function verify(token){try{const d=await api(`/api/verify/${token}`);app.innerHTML=`<section class="section" style="max-width:680px;margin:auto"><div class="eyebrow">Verifikasi Dokumen</div><h1>Metadata Dokumen SITAP</h1><div class="card"><p class="notice">Halaman ini hanya menampilkan metadata yang boleh dipublikasikan. Pemindaian QR tidak mengesahkan keputusan apa pun.</p>${[['ID Dokumen',d.document_id],['Judul',d.title],['Instansi Pengaju',d.source_institution],['Instansi Tujuan',d.target_institution],['Nomor Surat',d.letter_number],['Tanggal Surat',d.letter_date],['Status',d.status]].map(x=>`<p><b>${x[0]}</b><br>${esc(x[1])}</p>`).join('')}<a class="button secondary" href="#/">Kembali ke Beranda</a></div></section>`}catch(e){app.innerHTML='<p>Token verifikasi tidak valid.</p>'}}

async function roleDashboard(role){
  const s=await stats();
  if(role==='admin'){app.innerHTML=shell('Data Simulasi',`<div class="role-summary"><b>Administrator Demo</b> mengelola skenario purwarupa. Perubahan ini tidak merepresentasikan administrasi produksi.</div>${statCards(s)}<div class="panel"><h3>Reset Skenario Demonstrasi</h3><p class="muted">Pulihkan seluruh kasus, keputusan, dokumen, dan audit log ke dataset awal sebelum presentasi berikutnya.</p><button onclick="window.resetDemo()" style="margin-top:10px">Reset ke Data Awal</button></div>`);return}
  if(role==='auditor'){return audit()}
  if(role==='citizen'){app.innerHTML=shell('Dashboard Masyarakat',`<div class="dashboard-hero"><div class="hero-kicker">PROFIL DEMO &middot; ANDI PRATAMA</div><h2>Pengajuan Anda</h2><p>Lacak status, keputusan, dan progres realisasi dari satu tempat.</p></div><div class="role-summary"><b>Peran Anda:</b> Masyarakat. Anda dapat membuat pengajuan baru, membuka detail pengajuan sendiri, dan memberikan evaluasi ketika tahapnya tersedia.</div>${statCards(s)}<div class="quick-actions"><a class="button" href="#/new">+ Buat Pengajuan</a><a class="button secondary" href="#/mine">Lihat Pengajuan Saya</a></div>`);return}
  const config={village:['Dashboard Desa','Verifikasi awal dan penerusan pengajuan yang masuk ke wilayah desa.','Kotak Masuk','Verifikasi kelengkapan, klasifikasi, dan teruskan ke instansi berwenang.'],district:['Dashboard Kecamatan','Koordinasi pengajuan lintas desa dan pemantauan tindak lanjut wilayah.','Antrean Koordinasi','Tinjau pengajuan dari desa sebelum diteruskan ke instansi.'],opd:['Dashboard Instansi','Pantau penanganan teknis, progres pelaksanaan, dan bukti realisasi.','Antrean Penanganan','Perbarui progres atau bukti pada pengajuan yang telah diteruskan.'],official:['Dashboard Keputusan','Telaah pengajuan yang membutuhkan keputusan formal dalam simulasi.','Antrean Keputusan','Keputusan selalu membutuhkan alasan dan dasar pertimbangan.']}[role]||['Dashboard','Ringkasan aktivitas peran simulasi.','Inbox','Buka antrean pengajuan.'];
  app.innerHTML=shell(config[0],`<div class="dashboard-hero"><div class="hero-kicker">PERAN SIMULASI &middot; ${roles[role][0].toUpperCase()}</div><h2>${config[0]}</h2><p>${config[1]}</p></div><div class="role-summary"><b>Ruang lingkup tindakan:</b> ${config[3]} Setiap perubahan direkam pada audit trail bersama.</div>${statCards(s)}<div class="dashboard-grid"><div class="panel"><div class="panel-title"><div><h3>${config[2]}</h3><small class="muted">Pilih pengajuan untuk menampilkan tindakan yang diizinkan</small></div><a href="#/inbox">Buka semua &rarr;</a></div><div class="empty-note">Gunakan antrean untuk meninjau dan memproses pengajuan sesuai kewenangan Anda.</div></div><div class="panel"><h3>Akses cepat</h3><div class="quick-actions section"><a class="button" href="#/inbox">Buka Inbox</a>${role==='opd'?'<a class="button secondary" href="#/documents">Dokumen & QR</a>':''}</div></div></div>`)
}

async function resetDemo(){if(!confirm('Reset seluruh data simulasi ke kondisi awal?'))return;try{await api('/api/reset',{method:'POST'});toast('Data dipulihkan. Memuat ulang…');setTimeout(()=>location.reload(),900)}catch(x){toast(x.message)}}

window.pickRole=()=>location.hash='#/explore';
window.selectRole=setRole;
window.demoNav=n=>{demoStep=Math.max(0,Math.min(demo.length-1,demoStep+n));localStorage.setItem('sitap-demo-step',demoStep);demoPage()};
window.openDemoStep=()=>{let d=demo[demoStep];activeRole=d[2];localStorage.setItem('sitap-role',activeRole);location.hash=d[3]};
window.resetDemo=resetDemo;

async function route(){
  const p=location.hash.slice(2)||'';
  syncProfileDropdown();
  if(p==='demo'&&!demoMode)setDemoMode(true);
  document.body.classList.toggle('home-page', !p);
  try{
    if(activeRole==='public'&&['new','mine','inbox','documents','audit'].includes(p)){toast('Akses ini memerlukan pemilihan peran simulasi yang sesuai.');location.hash='#/public';return}
    if(!p)return landing();
    if(p==='public')return publicPage();
    if(p==='explore')return rolePicker();
    if(p==='demo')return demoPage();
    if(p==='new')return newCase();
    if(p==='mine')return mine();
    if(p==='inbox')return inbox();
    if(p==='audit')return audit();
    if(p==='documents')return documents();
    if(p.startsWith('case/'))return caseDetail(decodeURIComponent(p.slice(5)));
    if(p.startsWith('verify/'))return verify(p.slice(7));
    if(p.startsWith('role/'))return roleDashboard(p.slice(5));
    if(p==='about'){app.innerHTML='<section class="section"><h1>Panduan SITAP</h1><p class="notice">SITAP adalah prototype demonstrasi konsep, bukan sistem pemerintah resmi atau pengganti SP4N-LAPOR!, SIPD, Musrenbang, maupun SPBE.</p><p>Mulai dari Demo Terpandu untuk mengikuti satu alur, atau Jelajahi Manual untuk mencoba tiap peran.</p></section>';return}
    landing()
  }catch(e){app.innerHTML=`<div class="card"><h2>Terjadi kendala</h2><p>${esc(e.message)}</p><button onclick="location.reload()">Muat ulang</button></div>`}
}
$('#change-role').onclick=()=>location.hash='#/explore';
window.addEventListener('hashchange',route);
route();
