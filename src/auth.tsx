import { useLanguage } from './i18n';
import { Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, LockKeyhole } from 'lucide-react';
import { demoEnabled, supabase } from './lib';

type Access = 'checking' | 'signed-out' | 'denied' | 'error' | 'admin';

// Mount protected content only after both identity and database membership are verified.
// RLS remains the authority for every data request; this guard controls the UI.
export function AdminRoute({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [access, setAccess] = useState<Access>('checking');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let disposed = false;
    let revision = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function verify(current: number) {
      try {
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (disposed || current !== revision) return;
        if (userError) {
          setAccess(userError.status === 401 || userError.status === 403 || userError.name === 'AuthSessionMissingError' ? 'signed-out' : 'error');
          return;
        }
        if (!user) { setAccess('signed-out'); return; }
        const { data, error: roleError } = await client.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
        if (disposed || current !== revision) return;
        if (roleError) { setAccess('error'); return; }
        setUserId(user.id);
        setAccess(data ? 'admin' : 'denied');
      } catch {
        if (!disposed && current === revision) setAccess('error');
      }
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      // Keep the callback synchronous; defer calls that acquire the Auth lock.
      const current = ++revision;
      clearTimeout(timer);
      setAccess(session ? 'checking' : 'signed-out');
      setUserId('');
      setPassword('');
      if (session) timer = setTimeout(() => void verify(current), 0);
    });
    void verify(++revision);
    const recheck = () => {
      if (document.visibilityState === 'hidden') return;
      setAccess('checking');
      clearTimeout(timer);
      void verify(++revision);
    };
    window.addEventListener('focus', recheck);
    return () => {
      disposed = true;
      ++revision;
      clearTimeout(timer);
      subscription.unsubscribe();
      window.removeEventListener('focus', recheck);
    };
  }, [retry]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) setError('Connexion refusée. Vérifiez vos identifiants.');
      setPassword('');
    } catch { setError('Connexion indisponible. Réessayez.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      setAccess('signed-out');
    } catch { setError('La déconnexion a échoué. Réessayez.'); }
    finally { setBusy(false); }
  }

  if (!supabase) {
    if (demoEnabled) return <>{children}</>;
    return <main className="login-page"><div className="login-card"><h1>{t("Administration indisponible.")}</h1><p>{t("La connexion sécurisée doit être configurée avant d’accéder à cet espace.")}</p><a href="#partager">{t("Retour à l’espace étudiant")}</a></div></main>;
  }
  if (access === 'checking') return <main className="student-main"><p role="status">{t("Vérification de votre accès…")}</p></main>;
  if (access === 'admin') return <Fragment key={userId}>{children}</Fragment>;
  return <main className="login-page"><div className="login-card"><span className="trust-icon"><LockKeyhole size={26}/></span><span className="eyebrow">{t("CAMPUS ÉCOUTE · ADMINISTRATION")}</span>
    {access === 'signed-out' ? <><h1>{t("Heureux de vous revoir.")}</h1><p>{t("Connectez-vous pour écouter, comprendre et agir.")}</p><form onSubmit={login}><label htmlFor="email">{t("Adresse e-mail")}</label><input id="email" dir="ltr" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/><label htmlFor="password">{t("Mot de passe")}</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/><button className="primary" disabled={busy}>{busy ? t("Connexion…") : t("Se connecter")}</button></form></> : <><h1>{access === 'denied' ? t("Accès réservé.") : t("Vérification indisponible.")}</h1><p>{access === 'denied' ? t("Ce compte ne possède pas les droits administrateur.") : t("Impossible de vérifier vos droits. Veuillez réessayer.")}</p><button className="primary" disabled={busy} onClick={() => { setAccess('checking'); setRetry(value => value + 1); }}>{t("Réessayer")}</button><button className="secondary" disabled={busy} onClick={() => void signOut()}>{t("Se déconnecter")}</button></>}
    {error && <p className="error" role="alert">{t(error)}</p>}<a href="#partager"><ChevronLeft size={15}/> {t("Retour à l’espace étudiant")}</a>
  </div></main>;
}
