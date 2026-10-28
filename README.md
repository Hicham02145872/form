# Campus Écoute

Application React + TypeScript + Vite pour recueillir les difficultés et les solutions des étudiants sans demander leur identité.

## Démarrer

Node.js 22 ou supérieur et npm (ou pnpm).

```sh
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Le formulaire est la page d’accueil. Le lien « Espace administrateur » ouvre `/#admin`.

```sh
npm run build
npm run preview
```

## Configurer Supabase

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` une seule fois dans le SQL Editor.
3. Copier `.env.example` dans `.env.local` et renseigner l’URL du projet et sa clé **publishable** (ou ancienne clé **anon**). Ne jamais utiliser la clé service_role dans React.
4. Dans Authentication > Users, créer le compte administrateur avec un e-mail et un mot de passe. Désactiver les inscriptions publiques si elles ne sont pas nécessaires.
5. Copier son UUID et exécuter dans le SQL Editor :

```sql
insert into public.admins (user_id) values ('UUID-DU-COMPTE-ADMIN');
```

6. Relancer Vite. Se connecter via l’espace administrateur.

Les règles RLS et les droits SQL autorisent l’insertion publique sur les seuls champs du formulaire. La lecture des contributions et la modification du statut sont réservées aux membres de `admins`. Aucun identifiant étudiant n’est stocké dans la table. Le client envoie une insertion sans `.select()` pour ne pas demander une lecture publique.

Référence : [sécurisation des données Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Mode démonstration

En développement uniquement (`pnpm dev`), sans aucune variable Supabase, le formulaire enregistre les contributions dans le **sessionStorage** du navigateur. L’administration présente quatre exemples fictifs et les contributions de la session. Les bannières signalent ce mode. Ces données ne sont pas envoyées à un serveur. Fermer l’onglet supprime les contributions locales ; les modifications des exemples fictifs sont temporaires. Le mode démonstration ne fournit aucune protection d’accès et sert uniquement à découvrir l’interface.

En production, une configuration absente ou incomplète bloque l’administration et l’envoi du formulaire. Aucun aperçu administrateur public n’est activé automatiquement.

## Protection de l’administration

La route `/#admin` attend la validation de l’utilisateur par `auth.getUser()` puis vérifie son appartenance à `public.admins`. Le tableau de bord est monté uniquement après ces deux vérifications. Un compte connecté sans autorisation voit un refus d’accès ; une erreur réseau bloque l’accès avec une possibilité de réessayer. Les changements de session et le retour au premier plan déclenchent une nouvelle vérification et retirent le contenu privé pendant celle-ci. La déconnexion ferme la session du navigateur courant et démonte le tableau de bord, y compris les contributions et fenêtres de détail en mémoire.

Le formulaire étudiant reste public. Les politiques RLS de `supabase/schema.sql` protègent les données contre les requêtes directes ; la protection React ne remplace pas ces politiques. Les comptes administrateurs sont provisionnés dans Supabase, sans inscription publique dans l’application.

## Fonctionnalités

- Formulaire anonyme : sujet Études & pédagogie, difficulté, impact et solution facultative.
- Validation, consentement, confirmation et conservation du texte en cas d’échec.
- Authentification administrateur Supabase et contrôle des droits côté base.
- Compteurs, répartition par sujet et impact, recherche et filtre de statut.
- Consultation détaillée, statuts Nouveau / En cours / Résolu, export CSV filtré.
- Interface en français, responsive, navigation au clavier et réduction des animations.

## Avant une ouverture publique

Tester les politiques avec deux comptes (administrateur et non-administrateur) et un visiteur déconnecté. Vérifier que le visiteur peut envoyer une contribution mais ne peut ni lire les réponses, ni modifier leur statut, et que le compte non-administrateur ne peut pas accéder aux réponses. Les politiques ne peuvent être validées contre un projet réel tant que Supabase n’est pas configuré.

Le formulaire ne recueille pas de nom, e-mail ou numéro étudiant. Un texte libre peut toutefois identifier quelqu’un ; le formulaire invite à éviter ces informations. L’hébergement peut conserver des journaux techniques. Configurer la durée de conservation et les personnes habilitées en fonction de l’établissement. Pour une ouverture sur Internet, ajouter une protection anti-abus côté serveur (limitation des envois et CAPTCHA) ; la RLS seule ne limite pas le volume des soumissions.

Pour un hébergement statique, publier le dossier `dist` après la compilation et fournir les variables Vite au moment du build. Les routes utilisent le hash et ne nécessitent pas de règle de réécriture.

## Vérifications effectuées

Compilation TypeScript et build Vite validés. Le parcours a été testé en navigateur Edge en mode démonstration : envoi, consultation administrateur, modification du statut, recherche, filtre, export CSV, fermeture d’une fenêtre par Échap et absence de débordement à 375 px. Aucune erreur JavaScript relevée. La connexion Supabase réelle reste à tester après configuration.

Le scénario de démonstration reproductible est dans `tests/browser-smoke.cjs`. Il nécessite le paquet `playwright` et Microsoft Edge. Lancer le serveur **de développement** sans variables Supabase sur le port 5173 puis exécuter `node tests/browser-smoke.cjs`. La variable `PLAYWRIGHT_MODULE` peut pointer vers une installation existante de Playwright.

Le scénario `tests/auth-routes.cjs` vérifie le visiteur déconnecté, le compte sans droits, la connexion administrateur, la restauration de session, la révocation des droits, le rejet d’un jeton invalide et la déconnexion. Démarrer un serveur de développement séparé sur le port 5174 avec `VITE_SUPABASE_URL=https://auth-test.supabase.co` et `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_auth_test`, puis lancer `node tests/auth-routes.cjs`. Les réponses HTTP Supabase sont simulées ; ce test ne valide pas les politiques d’un projet hébergé.

# form
