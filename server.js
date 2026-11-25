import express from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { db, migrate, addEvent, now } from './db.js';

migrate();
if (!db.prepare('SELECT 1 FROM cases LIMIT 1').get()) await import('./scripts/seed.js');
const uploadDir = process.env.SITAP_UPLOAD_DIR || (process.env.VERCEL ? '/tmp/sitap/uploads' : 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const app = express(); const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });
app.use(express.json()); app.use(express.static('public'));
const demoProfiles = {
  'citizen-ahmad':{id:'citizen-ahmad',name:'Ahmad Pratama',role:'citizen',area:{province:'Jawa Tengah',regency:'Kota Semarang',district:'Kecamatan Tembalang',village:'Kelurahan Tembalang'}},
  'citizen-andi':{id:'citizen-andi',name:'Andi Pratama',role:'citizen',area:{province:'Jawa Tengah',regency:'Kabupaten Arunika',district:'Kecamatan Cendana',village:'Desa Sukamaju'}},
  'village-nadia':{id:'village-nadia',name:'Nadia Permata',role:'village',area:{province:'Jawa Tengah',regency:'Kabupaten Arunika',district:'Kecamatan Cendana',village:'Desa Sukamaju'},institution:'Kantor Desa Sukamaju'},
  'district-arief':{id:'district-arief',name:'Arief Mahendra',role:'district',area:{province:'Jawa Tengah',regency:'Kabupaten Arunika',district:'Kecamatan Cendana'},institution:'Kecamatan Cendana'},
  'opd-dian':{id:'opd-dian',name:'Dian Anggraini',role:'opd',area:{province:'Jawa Tengah',regency:'Kabupaten Arunika'},institution:'Dinas Pekerjaan Umum Kabupaten Arunika'},
  'official-lestari':{id:'official-lestari',name:'Ir. Lestari Wibowo',role:'official',area:{province:'Jawa Tengah',regency:'Kabupaten Arunika'},institution:'Pemerintah Kabupaten Arunika'},
  'central-demo':{id:'central-demo',name:'Pusat SITAP Demo',role:'central',area:{},institution:'Pemerintah Pusat - Kementerian SITAP Demo'},
  'auditor-bima':{id:'auditor-bima',name:'Bima Wirawan',role:'auditor',area:{},institution:'Inspektorat Demo'},
  'admin-demo':{id:'admin-demo',name:'Admin Demo',role:'admin',area:{},institution:'SITAP Demo'}
};
const roleLabels = {public:'Pengunjung Publik',citizen:'Masyarakat',village:'Pemerintah Desa',district:'Pemerintah Kecamatan',opd:'Operator OPD',official:'Pejabat Berwenang',central:'Pemerintah Pusat',auditor:'Auditor/Pengawas',admin:'Administrator Demo'};
const viewerRoles = Object.keys(roleLabels);
function profileForRole(role, profileId) {
  if (role === 'public') return null;
  const profile = demoProfiles[profileId] || Object.values(demoProfiles).find(item => item.role === role);
  return profile?.role === role ? profile : null;
}
function resolveViewer(role, profileId) {
  if (!viewerRoles.includes(role)) return null;
  const profile = profileForRole(role, profileId);
  if (role !== 'public' && !profile) return null;
  return {role,profile};
}
function actor(role, profileId) {
  const profile=profileForRole(role,profileId);
  return {actor:profile?.name||'Sistem SITAP',role:roleLabels[role]||'Sistem',institution:profile?.institution||'SITAP Demo'};
}
function getCase(id) { return db.prepare('SELECT * FROM cases WHERE case_id=?').get(id); }
function requireCase(req,res,next){ const c=getCase(req.params.caseId); if(!c) return res.status(404).json({error:'Pengajuan tidak ditemukan'}); req.case=c; next(); }
function makeId(prefix, table, col){ const year=new Date().getFullYear(); const count=db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n+1; return `${prefix}-${year}-${String(count).padStart(6,'0')}`; }
function isCitizenArea(c, profile) {
  const fields=Object.entries(profile.area).filter(([,value])=>value);
  return fields.length>0&&fields.every(([key,value])=>c[key]===value);
}
function publicCaseSummary(c) {
  return {
    case_id:c.case_id, title:c.title, category:c.category, province:c.province, regency:c.regency,
    public_summary:c.public_summary || c.title, created_at:c.created_at,
    decision_outcome:c.decision_outcome === 'Belum ada' ? null : c.decision_outcome,
    implementation_status:c.decision_outcome === 'Diterima' ? c.implementation_status : null
  };
}
function isProfileOwner(c, profile) {
  return Boolean(profile&&(c.owner_profile_id===profile.id||(!c.owner_profile_id&&c.owner_name===profile.name)));
}
function caseListItem(c, viewer) {
  if (!['public','citizen'].includes(viewer.role)) return c;
  if (viewer.role === 'citizen' && isProfileOwner(c,viewer.profile)) return c;
  return publicCaseSummary(c);
}
function caseForViewer(c, viewer) {
  if (!['public','citizen'].includes(viewer.role)) return c;
  const isOwner=viewer.role==='citizen'&&isProfileOwner(c,viewer.profile);
  const hasLocalAccess=viewer.role==='citizen'&&(isCitizenArea(c,viewer.profile)||isOwner);
  const events = db.prepare('SELECT * FROM events WHERE case_id=? AND is_public=1 ORDER BY created_at ASC').all(c.case_id);
  if (hasLocalAccess) {
    return {
      ...c, owner_name:isOwner ? c.owner_name : undefined, location:undefined,
      events, detail_scope:'local',
      decision:db.prepare('SELECT * FROM decisions WHERE case_id=?').get(c.case_id),
      feedback:isOwner ? db.prepare('SELECT * FROM feedback WHERE case_id=?').get(c.case_id) : null
    };
  }
  const summary = publicCaseSummary(c);
  if (c.decision_outcome !== 'Diterima') return { ...summary, detail_scope:'summary' };
  return {
    ...summary, process_status:c.process_status, progress:c.progress,
    detail_scope:'approved',
    events:events.map(({action,after_status,created_at}) => ({action,after_status,created_at}))
  };
}
app.get('/api/cases', (req,res) => {
  const role=req.query.role||'public';
  const viewer=resolveViewer(role,req.query.profile);
  if(!viewer) return res.status(400).json({error:'Role atau profil tampilan tidak dikenal'});
  let sql=role==='citizen'?"SELECT * FROM cases WHERE (visibility='public' OR owner_profile_id=? OR (owner_profile_id IS NULL AND owner_name=?))":"SELECT * FROM cases WHERE visibility='public'";
  const vals=role==='citizen'?[viewer.profile.id,viewer.profile.name]:[];
  const filters=['public','citizen'].includes(role)
    ?[['search','title'],['category','category'],['province','province'],['regency','regency']]
    :[['search','title'],['status','process_status'],['category','category'],['institution','responsible_institution'],['province','province'],['regency','regency']];
  for(const [key,col] of filters) if(req.query[key]){sql+=` AND ${col} LIKE ?`;vals.push(`%${req.query[key]}%`)}
  const rows=db.prepare(sql+' ORDER BY created_at DESC').all(...vals);
  res.json(rows.map(c=>caseListItem(c,viewer)));
});
app.get('/api/cases/:caseId', requireCase, (req,res) => {
  const c=req.case, role=req.query.role||'public';
  const viewer=resolveViewer(role,req.query.profile);
  if(!viewer) return res.status(400).json({error:'Role atau profil tampilan tidak dikenal'});
  const isOwner=role==='citizen'&&isProfileOwner(c,viewer.profile);
  if(['public','citizen'].includes(role)&&c.visibility!=='public'&&!isOwner) return res.status(404).json({error:'Informasi publik tidak ditemukan'});
  const visible=caseForViewer(c,viewer);
  if(visible.detail_scope==='local') return res.json(visible);
  if(visible.detail_scope==='approved') return res.json(visible);
  if(['public','citizen'].includes(role)) return res.json(visible);
  res.json({...c, events:db.prepare('SELECT * FROM events WHERE case_id=? ORDER BY created_at ASC').all(c.case_id), decision:db.prepare('SELECT * FROM decisions WHERE case_id=?').get(c.case_id), feedback:db.prepare('SELECT * FROM feedback WHERE case_id=?').get(c.case_id)});
});
app.get('/api/stats',(req,res)=>{ const rows=db.prepare("SELECT process_status,decision_outcome,implementation_status,COUNT(*) n FROM cases WHERE visibility='public' GROUP BY process_status,decision_outcome,implementation_status").all(); const total=rows.reduce((a,r)=>a+r.n,0); res.json({total, inProgress:rows.filter(r=>!['Selesai'].includes(r.process_status)).reduce((a,r)=>a+r.n,0), accepted:rows.filter(r=>r.decision_outcome==='Diterima').reduce((a,r)=>a+r.n,0), rejected:rows.filter(r=>r.decision_outcome==='Ditolak').reduce((a,r)=>a+r.n,0), completed:rows.filter(r=>r.implementation_status==='Selesai').reduce((a,r)=>a+r.n,0), pending:rows.filter(r=>r.process_status==='Diajukan').reduce((a,r)=>a+r.n,0)});});
app.post('/api/cases', upload.single('attachment'), (req,res)=>{
  const b=req.body;
  for(const k of ['title','type','category','description','province','regency','district','village']) if(!b[k]?.trim()) return res.status(400).json({error:`${k} wajib diisi`});
  const profile=demoProfiles[b.profileId];
  if(!profile||profile.role!=='citizen') return res.status(400).json({error:'Profil masyarakat tidak dikenal'});
  const levels={village:'Desa/Kelurahan',district:'Kecamatan',regency:'Kabupaten/Kota',province:'Provinsi'};
  if(!levels[b.submissionLevel]||!profile.area[b.submissionLevel]) return res.status(400).json({error:'Tingkat tujuan tidak sesuai dengan wilayah profil'});
  const id=makeId('SITAP-ASP','cases','case_id');
  db.prepare('INSERT INTO cases (case_id,title,type,category,description,province,regency,district,village,location,visibility,process_status,responsible_institution,owner_name,created_at,public_summary,owner_profile_id,submission_level,submission_area) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id,b.title,b.type,b.category,b.description,profile.area.province,profile.area.regency,profile.area.district||'',profile.area.village||'',b.location||'',b.visibility==='terbatas'?'restricted':'public','Diajukan','Menunggu klasifikasi',profile.name,now(),b.publicSummary?.trim()||b.title,profile.id,b.submissionLevel,profile.area[b.submissionLevel]);
  addEvent(id,{...actor('citizen',profile.id),action:'Pengajuan dibuat',beforeStatus:'Draft',afterStatus:'Diajukan',note:req.file?'Lampiran simulasi diterima.':'Pengajuan dikirim tanpa lampiran.',isPublic:true});
  res.status(201).json({caseId:id});
});
app.post('/api/cases/:caseId/verify',requireCase,(req,res)=>{ const {note='', target='Dinas Pekerjaan Umum Kabupaten Arunika', role='village',profileId}=req.body; const profile=profileForRole(role,profileId); if(!profile)return res.status(400).json({error:'Profil pelaksana tidak dikenal'}); const before=req.case.process_status; db.prepare('UPDATE cases SET process_status=?, responsible_institution=? WHERE case_id=?').run('Terverifikasi',target,req.case.case_id); addEvent(req.case.case_id,{...actor(role,profile.id),action:'Verifikasi kelengkapan',beforeStatus:before,afterStatus:'Terverifikasi',note,isPublic:true});res.json({ok:true});});
app.post('/api/cases/:caseId/route',requireCase,(req,res)=>{const {target,note='',role='village',profileId}=req.body;const profile=profileForRole(role,profileId);if(!profile)return res.status(400).json({error:'Profil pelaksana tidak dikenal'});if(!target) return res.status(400).json({error:'Instansi tujuan wajib dipilih'});const before=req.case.process_status;db.prepare('UPDATE cases SET process_status=?,responsible_institution=? WHERE case_id=?').run('Diteruskan',target,req.case.case_id);addEvent(req.case.case_id,{...actor(role,profile.id),action:'Pengajuan diteruskan',beforeStatus:before,afterStatus:'Diteruskan',note:`Diteruskan ke ${target}. ${note}`,isPublic:true});res.json({ok:true});});
app.post('/api/cases/:caseId/progress',requireCase,upload.single('evidence'),(req,res)=>{const {progress,note='',status='Dalam Pelaksanaan',role='opd',profileId}=req.body;const profile=profileForRole(role,profileId);if(!profile)return res.status(400).json({error:'Profil pelaksana tidak dikenal'});const p=Math.max(0,Math.min(100,Number(progress)));db.prepare('UPDATE cases SET process_status=?, implementation_status=?, progress=? WHERE case_id=?').run(status,p>=100?'Selesai':'Sedang dilaksanakan',p,req.case.case_id);addEvent(req.case.case_id,{...actor(role,profile.id),action:'Progres pelaksanaan diperbarui',beforeStatus:req.case.process_status,afterStatus:status,note:`${p}% — ${note}${req.file?' Bukti pelaksanaan simulasi ditambahkan.':''}`,isPublic:true});res.json({ok:true});});
app.post('/api/cases/:caseId/decision',requireCase,(req,res)=>{const {outcome,reason,consideration,role='official',profileId}=req.body;const profile=profileForRole(role,profileId);if(!profile)return res.status(400).json({error:'Profil pelaksana tidak dikenal'});if(!['Diterima','Ditolak'].includes(outcome)||!reason?.trim()||!consideration?.trim()) return res.status(400).json({error:'Hasil, alasan, dan dasar pertimbangan wajib diisi'});db.prepare('INSERT OR REPLACE INTO decisions (case_id,outcome,reason,consideration,official,created_at) VALUES (?,?,?,?,?,?)').run(req.case.case_id,outcome,reason,consideration,profile.name,now());const process=outcome==='Diterima'?'Dalam Perencanaan':'Selesai';db.prepare('UPDATE cases SET decision_outcome=?,process_status=?,implementation_status=? WHERE case_id=?').run(outcome,process,outcome==='Ditolak'?'Tidak dapat direalisasikan':req.case.implementation_status,req.case.case_id);addEvent(req.case.case_id,{...actor(role,profile.id),action:`Keputusan ${outcome.toLowerCase()} diberikan`,beforeStatus:req.case.decision_outcome,afterStatus:outcome,note:`${reason} Dasar: ${consideration}`,isPublic:true});res.json({ok:true});});
app.post('/api/cases/:caseId/feedback',requireCase,(req,res)=>{const b=req.body;const profile=profileForRole(b.role||'citizen',b.profileId);if(!profile||profile.role!=='citizen'||!isProfileOwner(req.case,profile))return res.status(403).json({error:'Evaluasi hanya untuk pengajuan milik profil masyarakat Anda'});for(const k of ['responsiveness','transparency','timeliness','resultScore']) if(Number(b[k])<1||Number(b[k])>5) return res.status(400).json({error:'Semua rating 1–5 wajib diisi'});db.prepare('INSERT OR REPLACE INTO feedback (case_id,responsiveness,transparency,timeliness,result_score,comment,created_at) VALUES (?,?,?,?,?,?,?)').run(req.case.case_id,b.responsiveness,b.transparency,b.timeliness,b.resultScore,b.comment||'',now());addEvent(req.case.case_id,{...actor('citizen',profile.id),action:'Evaluasi masyarakat dikirim',beforeStatus:null,afterStatus:null,note:'Penilaian pengalaman penanganan direkam.',isPublic:false});res.json({ok:true});});
app.get('/api/audit',(req,res)=>{const viewer=resolveViewer(req.query.role,req.query.profile);if(!viewer||!['auditor','admin'].includes(viewer.role))return res.status(403).json({error:'Audit trail hanya tersedia untuk profil Auditor/Pengawas atau Administrator Demo'});res.json(db.prepare('SELECT e.*,c.title FROM events e JOIN cases c ON c.case_id=e.case_id ORDER BY e.created_at DESC').all())});
app.post('/api/documents',upload.single('file'),async(req,res)=>{
  const b=req.body;
  for(const k of ['title','sourceInstitution','targetInstitution','letterNumber','letterDate'])if(!b[k])return res.status(400).json({error:`${k} wajib diisi`});
  const documentId=makeId('SITAP-DOC','documents','document_id');
  const token=crypto.randomBytes(16).toString('hex');
  const status=b.targetInstitution.toLowerCase().includes('pusat')?'Menunggu Persetujuan Pusat':'Terdaftar';
  db.prepare('INSERT INTO documents (document_id,case_id,title,source_institution,target_institution,letter_number,letter_date,description,status,verification_token,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(documentId,b.caseId||null,b.title,b.sourceInstitution,b.targetInstitution,b.letterNumber,b.letterDate,b.description||'',status,token,now());
  res.status(201).json({documentId,token});
});
app.get('/api/documents',(req,res)=>{res.json(db.prepare('SELECT document_id,case_id,title,source_institution,target_institution,letter_number,letter_date,status,reviewed_by,review_note,reviewed_at,created_at FROM documents ORDER BY created_at DESC').all())});
app.post('/api/documents/:documentId/review',(req,res)=>{
  const {profileId,decision,note=''}=req.body;
  const profile=profileForRole('central',profileId);
  if(profileId!=='central-demo'||!profile)return res.status(403).json({error:'Persetujuan dokumen hanya tersedia untuk profil Pemerintah Pusat'});
  if(!['approve','reject'].includes(decision)||typeof note!=='string'||!note.trim())return res.status(400).json({error:'Keputusan dan catatan pemeriksaan wajib diisi'});
  const document=db.prepare('SELECT * FROM documents WHERE document_id=?').get(req.params.documentId);
  if(!document)return res.status(404).json({error:'Dokumen tidak ditemukan'});
  if(!document.target_institution.toLowerCase().includes('pusat'))return res.status(409).json({error:'Dokumen ini tidak ditujukan ke Pemerintah Pusat'});
  const status=decision==='approve'?'Disetujui Pusat':'Perlu Perbaikan';
  db.prepare('UPDATE documents SET status=?,reviewed_by=?,review_note=?,reviewed_at=? WHERE document_id=?').run(status,profile.name,note.trim(),now(),document.document_id);
  if(document.case_id&&getCase(document.case_id)){
    addEvent(document.case_id,{...actor('central',profile.id),action:decision==='approve'?'Dokumen disetujui Pemerintah Pusat':'Dokumen dikembalikan untuk perbaikan',beforeStatus:document.status,afterStatus:status,note:note.trim(),isPublic:false});
  }
  res.json({ok:true,status});
});
app.get('/api/documents/:documentId',async(req,res)=>{const d=db.prepare('SELECT * FROM documents WHERE document_id=?').get(req.params.documentId);if(!d)return res.status(404).json({error:'Dokumen tidak ditemukan'});const url=`${req.protocol}://${req.get('host')}/verify/${d.verification_token}`;res.json({...d,verifyUrl:url,qrDataUrl:await QRCode.toDataURL(url,{width:360,margin:2,color:{dark:'#0f2747',light:'#ffffff'}})});});
app.get('/api/documents/:documentId/qr.png',async(req,res)=>{const d=db.prepare('SELECT * FROM documents WHERE document_id=?').get(req.params.documentId);if(!d)return res.sendStatus(404);const url=`${req.protocol}://${req.get('host')}/verify/${d.verification_token}`;res.type('png').send(await QRCode.toBuffer(url,{width:800,margin:2}));});
app.get('/api/documents/:documentId/cover-sheet',async(req,res)=>{const d=db.prepare('SELECT * FROM documents WHERE document_id=?').get(req.params.documentId);if(!d)return res.sendStatus(404);res.setHeader('Content-Disposition',`attachment; filename=${d.document_id}-lembar-kendali.pdf`);res.type('pdf');const doc=new PDFDocument({margin:54});doc.pipe(res);doc.fillColor('#0f2747').fontSize(22).text('LEMBAR KENDALI SITAP');doc.fillColor('#56657a').fontSize(10).text('SIMULASI • DATA FIKTIF • BUKAN PENGESAHAN RESMI');doc.moveDown();doc.fillColor('#111827').fontSize(13);[['ID Dokumen',d.document_id],['Judul',d.title],['Instansi Pengaju',d.source_institution],['Instansi Tujuan',d.target_institution],['Nomor Surat',d.letter_number],['Tanggal Surat',d.letter_date],['Status',d.status]].forEach(([a,b])=>{doc.font('Helvetica-Bold').text(a);doc.font('Helvetica').text(b);doc.moveDown(.5)});const url=`${req.protocol}://${req.get('host')}/verify/${d.verification_token}`;const qr=await QRCode.toDataURL(url,{width:200});doc.image(Buffer.from(qr.split(',')[1],'base64'),360,130,{width:150});doc.fontSize(8).fillColor('#56657a').text('Pindai untuk verifikasi metadata dokumen',330,290,{width:210,align:'center'});doc.end();});
app.get('/api/verify/:token',(req,res)=>{const d=db.prepare('SELECT document_id,title,source_institution,target_institution,letter_number,letter_date,status,created_at FROM documents WHERE verification_token=?').get(req.params.token);if(!d)return res.status(404).json({error:'Token verifikasi tidak valid'});res.json(d);});
app.post('/api/reset',async(req,res)=>{db.exec('DELETE FROM feedback; DELETE FROM decisions; DELETE FROM events; DELETE FROM documents; DELETE FROM cases;');const { spawnSync }=await import('node:child_process');const r=spawnSync(process.execPath,['scripts/seed.js'],{cwd:process.cwd()});if(r.status!==0)return res.status(500).json({error:'Reset dataset gagal'});res.json({ok:true,message:'Data awal dipulihkan.'});});
app.get('/{*splat}',(req,res)=>res.sendFile(new URL('./public/index.html',import.meta.url).pathname));
app.listen(process.env.PORT||3000,()=>console.log('SITAP berjalan di http://localhost:3000'));
