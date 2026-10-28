import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, AudioLines, BookOpen, Check, CheckCircle2, ChevronDown, CircleHelp, Download, GraduationCap, Heart, LayoutDashboard, Lightbulb, LockKeyhole, LogOut, MessageCircle, MessageSquare, Search, Send, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { categories, demoEnabled, demoFeedback, supabase } from './lib';
import { AdminRoute } from './auth';
import type { Feedback } from './lib';
import './styles.css';
import { LanguageProvider, LanguageSwitcher, useLanguage } from './i18n';

function App() {
  const { t } = useLanguage();
  const [page, setPage] = useState(location.hash.startsWith('#admin') ? 'admin' : 'student');
  const [info, setInfo] = useState(false);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      if (!dialog) return;
      if (event.key === 'Escape') dialog.querySelector<HTMLButtonElement>('.close-button')?.click();
      if (event.key === 'Tab') {
        const targets = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, a[href]'));
        const first = targets[0], last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);
  useEffect(() => { const listener = () => setPage(location.hash.startsWith('#admin') ? 'admin' : 'student'); window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  const navigate = (next: string) => { location.hash = next === 'admin' ? 'admin' : 'partager'; setPage(next); };
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#partager" onClick={() => navigate('student')}><span className="brand-icon"><AudioLines size={24}/></span><span>campus<span className="brand-second">écoute<span className="brand-dot">.</span></span></span></a>
      <div className="workspace-tag"><span className="tiny-dot"/> {t("L’espace des étudiants")}</div>
      <div className="nav-caption">{t("VOTRE ESPACE")}</div>
      <nav aria-label={t("Navigation principale")}><button className={page === 'student' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('student')}><MessageSquare size={19}/> {t("Partager mon expérience")} <span className="nav-point"/></button><button className="nav-item" onClick={() => setInfo(true)}><CircleHelp size={19}/> {t("Comment ça marche ?")}</button></nav>
      <div className="sidebar-note"><div className="note-icon"><BookOpen size={25}/></div><h3>{t("Les petits mots font")}<br/>{t("les grands changements.")}</h3><p>{t("Ensemble, faisons de notre campus un meilleur endroit.")}</p><span className="note-line"/></div>
      <div className="sidebar-bottom"><span className="secure-label"><ShieldCheck size={16}/> {t("Un espace de confiance")}</span><button className={page === 'admin' ? 'nav-item active admin-nav' : 'nav-item admin-nav'} onClick={() => navigate('admin')}><LayoutDashboard size={18}/> {t("Espace administrateur")} <ArrowUpRight size={15}/></button><span className="sidebar-copyright">© {new Date().getFullYear()} {t("Campus Écoute")}</span></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span>{t("La vie étudiante,")} <strong>{t("ça se construit ensemble.")}</strong></span><span className="anonymous-pill"><span className="tiny-dot"/>{page === 'student' ? t("Sans compte · Sans nom") : t("Espace de gestion")}</span><LanguageSwitcher/></header>
      {page === 'student' ? <StudentForm/> : <AdminRoute><Admin/></AdminRoute>}
      <footer><span>{t("Fait pour les étudiants. Pensé pour avancer.")}</span><button onClick={() => setInfo(true)}><ShieldCheck size={14}/> {t("Confidentialité & anonymat")} <ArrowUpRight size={13}/></button></footer>
    </div>
    {info && <div className="modal-backdrop" onClick={() => setInfo(false)}><section role="dialog" aria-modal="true" aria-labelledby="info-title" className="modal" onClick={e => e.stopPropagation()}><button autoFocus className="close-button" aria-label={t("Fermer")} onClick={() => setInfo(false)}><X/></button><ShieldCheck className="modal-icon" size={36}/><h2 id="info-title">{t("Un espace pour vous exprimer.")}</h2><p>{t("Choisissez un sujet, décrivez votre difficulté et proposez une idée si vous le souhaitez. L’équipe du campus peut ensuite consulter et traiter votre contribution.")}</p><p>{t("Aucun nom, e-mail ou numéro étudiant n’est demandé. Évitez de mentionner des personnes ou d’ajouter des informations permettant de vous identifier dans votre texte.")}</p><p>{t("Les réponses ne sont pas publiques. Seuls les administrateurs autorisés peuvent les consulter. L’hébergeur peut conserver des journaux techniques.")}</p><button className="primary" onClick={() => setInfo(false)}>{t("J’ai compris")} <Check size={16}/></button></section></div>}
  </div>;
}

function StudentForm() {
  const { t } = useLanguage();
  const category = categories[0];
  const [impact, setImpact] = useState('Modéré');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!category) { setError('Choisissez le sujet de votre contribution.'); document.getElementById('category-title')?.focus(); return; }
    if (problem.trim().length < 20 || title.trim().length < 5) { setError('Résumez le problème en au moins 5 caractères et une description d’au moins 20 caractères.'); return; }
    setBusy(true);
    try {
      if (supabase) {
        const { error: insertError } = await supabase.from('feedback').insert({ category, title: title.trim(), problem: problem.trim(), solution: solution.trim(), impact });
        if (insertError) throw insertError;
      } else if (demoEnabled) {
        const existing = JSON.parse(sessionStorage.getItem('campus-demo') || '[]');
        sessionStorage.setItem('campus-demo', JSON.stringify([{ id: crypto.randomUUID(), category, title: title.trim(), problem: problem.trim(), solution: solution.trim(), impact, status: 'Nouveau', created_at: new Date().toISOString() }, ...existing]));
      }
      if (!supabase && !demoEnabled) throw new Error('Supabase is not configured');
      setSuccess(true);
    } catch { setError('L’envoi a échoué. Votre texte est conservé : veuillez réessayer.'); } finally { setBusy(false); }
  }
  if (success) return <main className="success-page"><div className="success-icon"><CheckCircle2 size={42}/></div><span className="eyebrow">{t("CHAQUE VOIX COMPTE")}</span><h1>{t("Merci d’avoir pris la parole.")}</h1><p>{supabase ? t("Votre contribution a bien été envoyée à l’équipe du campus.") : t("Votre contribution de démonstration est enregistrée dans cette session du navigateur.")}<br/>{t("Vos idées nous aident à avancer, ensemble.")}</p><button className="primary" onClick={() => { setSuccess(false); setTitle(''); setProblem(''); setSolution(''); setConsent(false); }}>{t("Partager une autre expérience")} <ArrowRight size={17}/></button></main>;
  return <main className="student-main"><div className="page-intro"><div><div className="eyebrow"><span/> {t("UN CAMPUS QUI VOUS ÉCOUTE")}</div><h1>{t("Votre voix compte")}<span>.</span></h1><p>{t("Une difficulté, une idée, une solution ?")}<br/>{t("Partagez votre expérience pour faire bouger les choses.")}</p></div><div className="intro-illustration" aria-hidden="true"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="floating-spark"><Sparkles size={21}/></span><div className="bubble bubble-back"><Heart size={29}/></div><div className="bubble bubble-front"><MessageSquare size={38}/><span>···</span></div><span className="little-star">✦</span></div></div>
    {!supabase && <div className="demo-banner"><Sparkles size={15}/><span>{demoEnabled ? t("Mode démonstration — vos contributions restent dans cette session. Connectez Supabase pour les envoyer.") : t("Envoi indisponible — la connexion sécurisée est en cours de configuration.")}</span></div>}
    <div className="content-grid"><form className="form-card" onSubmit={submit}><div className="form-card-header"><div className="form-title-icon"><MessageSquare size={20}/></div><div><h2>{t("Parlons de votre expérience")}</h2><p>{t("Quelques minutes pour un campus meilleur.")}</p></div><span className="time-pill">{t("~ 3 min")}</span></div>
      <div className="form-body"><section className="form-section"><div className="section-title"><span className="step-number">01</span><h3 id="category-title">{t("Votre sujet")}</h3></div><div className="fixed-subject"><BookOpen size={20}/><span>{t("Études & pédagogie")}</span><Check size={16}/></div></section>
      <section className="form-section"><div className="section-title"><span className="step-number">02</span><h3>{t("Qu’est-ce qui pourrait être amélioré ?")}</h3></div><label htmlFor="title">{t("Quel problème rencontrez-vous ?")} <span className="required">*</span></label><input id="title" dir="auto" required minLength={5} maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder={t("Ex. : Des cours difficiles à suivre")}/><div className="label-row"><label htmlFor="problem">{t("Décrivez la difficulté rencontrée")} <span className="required">*</span></label><span>{problem.length}/2000</span></div><textarea dir="auto" id="problem" required minLength={20} maxLength={2000} rows={4} value={problem} onChange={e => setProblem(e.target.value)} placeholder={t("Que se passe-t-il ? Dans quelle situation ? Expliquez-nous avec vos mots…")}/><p className="field-hint"><LockKeyhole size={12}/> {t("Pensez à ne pas inclure de nom ou d’information personnelle.")}</p><label>{t("Quel impact cela a-t-il sur votre quotidien ?")}</label><div className="impact-options" role="group" aria-label={t("Impact sur votre quotidien")}>{['Faible', 'Modéré', 'Important'].map((level,i) => <button type="button" key={level} aria-pressed={impact===level} className={impact===level ? 'impact selected' : 'impact'} onClick={() => setImpact(level)}><span className={`impact-dot impact-${i}`}/>{t(level)}<span className="radio-mark"/></button>)}</div></section>
      <section className="form-section solution-section"><div className="section-title"><span className="step-number">03</span><h3>{t("Et si on trouvait une solution ?")}</h3><span className="optional">{t("Facultatif")}</span></div><p className="section-help">{t("Même une petite idée peut faire une grande différence.")}</p><label className="sr-only" htmlFor="solution">{t("Votre solution proposée")}</label><textarea dir="auto" id="solution" maxLength={2000} rows={3} value={solution} onChange={e => setSolution(e.target.value)} placeholder={t("Une suggestion, une piste d’amélioration, une initiative à proposer…")}/></section>
      <div className="submit-area"><label className="checkbox-label"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/><span>{t("Je partage cette contribution de manière respectueuse, sans information permettant d’identifier une personne.")}</span></label>{error && <p className="error" role="alert">{t(error)}</p>}<div className="submit-row"><span><ShieldCheck size={16}/> {t("Votre identité reste privée")}</span><button type="submit" className="primary" disabled={busy}>{busy ? t("Envoi en cours…") : t("Envoyer ma contribution")}<ArrowRight size={17}/></button></div></div></div>
    </form><aside className="right-column"><div className="trust-card"><span className="trust-icon"><ShieldCheck size={26}/></span><h3>{t("Exprimez-vous.")}<br/>{t("En toute confiance.")}</h3><p>{t("Cet espace est le vôtre. Votre parole est précieuse et mérite d’être entendue.")}</p><div className="trust-divider"/><TrustPoint icon={LockKeyhole} title={t("Une contribution anonyme")} text={t("Aucun nom, aucun e-mail, aucun compte étudiant demandé.")}/><TrustPoint icon={Users} title={t("Une écoute bienveillante")} text={t("Vos retours sont lus par une équipe dédiée à la vie étudiante.")}/><TrustPoint icon={BookOpen} title={t("Un impact concret")} text={t("Vos idées nourrissent les améliorations de demain.")}/></div><div className="tip-card"><Lightbulb size={22}/><h3>{t("Un petit conseil")}</h3><p>{t("Soyez précis dans votre description et constructif dans vos suggestions. C’est le meilleur point de départ pour agir.")}</p></div><div className="quote-card"><span>“</span><p>{t("Un meilleur campus")}<br/>{t("commence par")}<br/><em>{t("une voix. La vôtre.")}</em></p><div className="quote-line"/></div></aside></div>
  </main>;
}
function TrustPoint({icon: Icon, title, text}: {icon: LucideIcon; title:string;text:string}) { const { t } = useLanguage(); return <div className="trust-point"><Icon size={18}/><div><h4>{t(title)}</h4><p>{t(text)}</p></div></div>; }

function Admin() {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<Feedback[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('Tous');
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [tab, setTab] = useState('overview');
  async function load() {
    if (!supabase) { setRows([...JSON.parse(sessionStorage.getItem('campus-demo') || '[]'), ...demoFeedback]); return; }
    setBusy(true);
    const {data,error: loadError} = await supabase.from('feedback').select('*').order('created_at', {ascending:false});
    if (loadError) setError('Impossible de charger les contributions. Réessayez.'); else { setRows(data || []); setError(''); }
    setBusy(false);
  }
  useEffect(() => { void load(); }, []);
  async function logout() {
    if (!supabase) return;
    setBusy(true); setError('');
    try {
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      if (logoutError) throw logoutError;
    } catch { setError('La déconnexion a échoué. Réessayez.'); }
    finally { setBusy(false); }
  }
  async function updateStatus(status: string) {
    if(!selected) return;
    setBusy(true);setError('');
    try {
      if(supabase) { const {data,error: updateError} = await supabase.from('feedback').update({status}).eq('id',selected.id).select('id'); if(updateError || !data?.length) throw updateError || new Error('No updated row'); }
      else { const stored: Feedback[] = JSON.parse(sessionStorage.getItem('campus-demo') || '[]'); sessionStorage.setItem('campus-demo',JSON.stringify(stored.map(r => r.id === selected.id ? {...r,status} : r))); }
      setRows(rows.map(r => r.id === selected.id ? {...r,status} : r)); setSelected({...selected,status});
    } catch { setError('La modification a échoué. Réessayez.'); } finally {setBusy(false);}
  }
  function exportCSV() {
    const cell = (s:string) => '"'+ (/^[=+\-@\t\r]/.test(s) ? "'"+s : s).replaceAll('"','""')+'"';
    const csv = '\uFEFF'+[['Date','Catégorie','Titre','Difficulté','Solution','Impact','Statut'].map(t),...filtered.map(r => [r.created_at,t(r.category),r.title,r.problem,r.solution,t(r.impact),t(r.status)])].map(row => row.map(cell).join(';')).join('\r\n');
    const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));link.href=url;link.download='campus-contributions.csv';link.click();URL.revokeObjectURL(url);
  }
  const filtered = rows.filter(r => (filter === 'Tous' || r.status === filter) && `${r.title} ${r.problem} ${r.category} ${t(r.category)}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="student-main admin-main"><div className="admin-heading"><div><div className="eyebrow"><span/> {t("ÉCOUTER. COMPRENDRE. AGIR.")}</div><h1>{t("Le pouls du campus")}<span>.</span></h1><p>{t("Les expériences étudiantes, au cœur de vos décisions.")}</p></div>{supabase && <button className="secondary" disabled={busy} onClick={() => void logout()}><LogOut size={16}/> {t("Déconnexion")}</button>}</div>{!supabase && <div className="demo-banner"><Sparkles size={15}/> {t("Aperçu administrateur · Données fictives et contributions de cette session.")}</div>}{error && <p className="error" role="alert">{t(error)}</p>}
    <div className="stats-grid">{[{label:'Contributions reçues',value:rows.length,icon:MessageSquare,tag:'Chaque voix compte'},{label:'À écouter',value:rows.filter(r => r.status==='Nouveau').length,icon:MessageCircle,tag:'Nouvelles contributions'},{label:'En cours de traitement',value:rows.filter(r => r.status==='En cours').length,icon:BookOpen,tag:'Des idées en mouvement'},{label:'Situations résolues',value:rows.filter(r => r.status==='Résolu').length,icon:CheckCircle2,tag:'Des progrès concrets'}].map(s => <div className="stat-card" key={s.label}><span className="stat-label">{t(s.label)}<s.icon size={19}/></span><strong>{s.value}</strong><span className="stat-tag">{t(s.tag)}</span></div>)}</div>
    <div className="admin-tabs"><button className={tab==='overview'?'tab active':'tab'} onClick={() => setTab('overview')}><LayoutDashboard size={16}/> {t("Vue d’ensemble")}</button><button className={tab==='responses'?'tab active':'tab'} onClick={() => setTab('responses')}><MessageSquare size={16}/> {t("Contributions")}</button><button className="refresh" onClick={() => void load()} disabled={busy}>{busy?t("Chargement…"):t("Actualiser")}</button></div>
    {tab==='overview' && <div className="charts-grid"><section className="chart-card"><h2>{t("Les sujets qui vous concernent")}</h2><p>{t("Répartition des contributions par catégorie")}</p><div className="bar-chart">{categories.map((c,i) => {const count=rows.filter(r => r.category===c).length;return <div className="bar-item" key={c}><div><span>{t(c)}</span><strong>{count}</strong></div><div className="bar-track"><span style={{width:`${rows.length ? count/rows.length*100 : 0}%`,background:i%2?'#8ebcac':'#24785f'}}/></div></div>;})}</div></section><section className="chart-card impact-chart"><h2>{t("L’impact au quotidien")}</h2><p>{t("Ressenti exprimé par les étudiants")}</p><div className="impact-summary"><Heart size={32}/><strong>{rows.filter(r=>r.impact==='Important').length}</strong><span>{t("contribution(s) à impact important")}</span></div>{['Faible','Modéré','Important'].map((level,i)=><div className="impact-legend" key={level}><span><i className={`impact-dot impact-${i}`}/>{t(level)}</span><strong>{rows.filter(r=>r.impact===level).length}</strong></div>)}</section></div>}
    <section className="responses-card"><div className="responses-heading"><div><h2>{tab==='overview'?t("Dernières contributions"):t("Toutes les contributions")}</h2><p>{t("Des retours anonymes, des pistes pour avancer.")}</p></div><button className="secondary" onClick={exportCSV} disabled={!filtered.length}><Download size={16}/> {t("Exporter CSV")}</button></div><div className="table-toolbar"><div className="search-field"><Search size={17}/><input aria-label={t("Rechercher une contribution")} placeholder={t("Rechercher une contribution…")} value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="select-wrapper"><select aria-label={t("Filtrer par statut")} value={filter} onChange={e=>setFilter(e.target.value)}>{['Tous','Nouveau','En cours','Résolu'].map(s=><option key={s} value={s}>{s==='Tous'?t("Tous les statuts"):t(s)}</option>)}</select><ChevronDown size={14}/></div></div><div className="table-scroll"><table><thead><tr><th>{t("CONTRIBUTION")}</th><th>{t("CATÉGORIE")}</th><th>{t("IMPACT")}</th><th>{t("STATUT")}</th><th>{t("DATE")}</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><button className="table-title" onClick={()=>setSelected(r)}><bdi>{r.title}</bdi><ArrowUpRight size={14}/></button><span className="table-anonymous"><ShieldCheck size={11}/> {t("Contribution anonyme")}</span></td><td>{t(r.category)}</td><td><span className={`impact-dot impact-${['Faible','Modéré','Important'].indexOf(r.impact)}`}/>{t(r.impact)}</td><td><span className={`status status-${r.status==='Nouveau'?'new':r.status==='En cours'?'progress':'done'}`}>{t(r.status)}</span></td><td>{new Date(r.created_at).toLocaleDateString(locale,{day:'numeric',month:'short'})}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state"><MessageCircle size={28}/><h3>{t("Aucune contribution à afficher")}</h3><p>{t("Les retours reçus apparaîtront ici. Essayez aussi de modifier vos filtres.")}</p></div>}</div></section>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><section className="modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e=>e.stopPropagation()}><button autoFocus className="close-button" aria-label={t("Fermer")} onClick={()=>setSelected(null)}><X/></button><span className="eyebrow">{t("CONTRIBUTION ANONYME")}</span><h2 id="detail-title" dir="auto">{selected.title}</h2><span className="detail-category">{t(selected.category)} · {t('Impact')} {t(selected.impact)}</span><h3>{t("La difficulté rencontrée")}</h3><p className="preserve-text" dir="auto">{selected.problem}</p><h3>{t("La solution proposée")}</h3><p className="preserve-text" dir="auto">{selected.solution||t("Aucune solution proposée.")}</p><label htmlFor="status">{t("Suivi de la contribution")}</label><select id="status" value={selected.status} disabled={busy} onChange={e=>void updateStatus(e.target.value)}>{['Nouveau','En cours','Résolu'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select>{error && <p className="error" role="alert">{t(error)}</p>}<p className="field-hint">{t("Reçue le")} {new Date(selected.created_at).toLocaleString(locale)}</p></section></div>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider><App/></LanguageProvider></React.StrictMode>);

