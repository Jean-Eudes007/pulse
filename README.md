# Pulse

> **Outil interne de centralisation et priorisation du feedback produit.**
> Vos collègues proposent (bugs, idées, améliorations), votent — vous priorisez sur des données, plus à l'instinct.

🌐 **Live** → [pulse-one-brown.vercel.app](https://pulse-one-brown.vercel.app)
📦 **Repo** → [github.com/VincentG32/pulse](https://github.com/VincentG32/pulse)

Stack : **Next.js 16** (App Router) · **TypeScript** · **Tailwind v4** · **Airtable** · **Auth JWT custom** · **Vercel**

---

## Sommaire
1. [Pourquoi Pulse](#pourquoi-pulse)
2. [Fonctionnalités livrées](#fonctionnalités-livrées)
3. [Stack & justifications](#stack--justifications)
4. [Architecture](#architecture)
5. [Modèle de sécurité](#modèle-de-sécurité)
6. [Accessibilité](#accessibilité)
7. [Setup local](#setup-local)
8. [Schéma Airtable](#schéma-airtable)
9. [Structure du code](#structure-du-code)
10. [Décisions techniques (mini-ADRs)](#décisions-techniques-mini-adrs)
11. [Roadmap V2 / V3](#roadmap-v2--v3)
12. [Limitations connues](#limitations-connues)
13. [Crédits](#crédits)

---

## Pourquoi Pulse

Dans une équipe produit, le feedback utilisateur arrive de partout : Slack, Notion, mails, tickets de support… Résultat :

- Priorisation **à l'instinct** ("celui qui crie le plus fort gagne")
- Idées **dupliquées** parce que personne ne sait ce qui a déjà été soumis
- Pas de signal clair sur ce qui compte **pour les utilisateurs**, pas pour celui qui le porte

Pulse résout ça avec un périmètre volontairement minimaliste :

- **Une source unique** de feedback, structurée (titre, description, type)
- **Un vote = un user** (un utilisateur ne peut voter qu'une seule fois par feedback)
- **Tri émergent** par nombre de votes : le top, c'est ce que l'équipe attend vraiment
- **Un dashboard admin** pour modérer

Pas de plugin, pas d'IA, pas d'intégration Slack. Juste l'essentiel pour arrêter de deviner.

---

## Fonctionnalités livrées

### Brief original (V1) ✅

**Authentification**
- Inscription email / mot de passe (bcrypt, 8 chars min)
- Connexion / déconnexion
- Rôle `user` attribué automatiquement à l'inscription
- Rôle `admin` configurable (manuellement dans Airtable)

**Feedbacks**
- Création (Title, Description, Type) — Creator et CreatedAt remplis automatiquement
- 3 types : 🐛 **Bug** · 💡 **Idée** · ✨ **Amélioration** (avec couleurs distinctes)
- Édition / suppression réservées au créateur
- Le bouton est masqué côté UI **et** l'API renvoie 403 si tentative cross-user

**Votes**
- Un user ne peut voter qu'une fois par feedback (anti-double-vote)
- `VoteCount` incrémenté atomiquement avec la création du Vote
- Tri descendant par votes sur la page liste

**Pages**
- `/` — landing
- `/login`, `/signup`
- `/feedbacks` — liste publique aux users connectés
- `/feedback/[id]` — détail avec actions (voter / éditer / supprimer)
- `/submit` — formulaire de création
- `/admin` — dashboard admin (suppression universelle)

**Sécurité**
- Toutes les mutations passent par un check `getCurrentUser()` côté serveur
- Permission par ressource : 401 / 403 / 409 selon le cas
- Cookie JWT `httpOnly` + `sameSite=lax` + `secure` en prod
- Le token Airtable ne quitte jamais le serveur

### Quick wins ajoutés (V1.5) ✅

- **Landing page** dédiée sur `/` (hero, 3 cards de features, "Comment ça marche", CTA) pour accueillir les nouveaux visiteurs au lieu de les dropper dans la liste
- **Auth gate** sur `/feedbacks` et `GET /api/feedbacks` : la liste n'est plus publique (incohérent avec un outil **interne** d'équipe)
- **Filtres par type** (chips cliquables) avec compteurs par catégorie
- **Toasts** ([sonner](https://sonner.emilkowal.ski/)) sur toutes les mutations (login, signup, vote, edit, delete, logout)
- **Édition inline** sur la page détail (toggle "Modifier" → form dans la même page, pas de route `/edit` séparée)

---

## Stack & justifications

| Couche | Choix | Pourquoi ce choix |
|---|---|---|
| Framework | **Next.js 16 App Router** | Server Components pour la liste (pas de `useEffect` de fetch côté client), API routes co-localisées, déploiement Vercel en 1 clic |
| Langage | **TypeScript strict** | Sécurité de type sur la frontière auth/Airtable où les bugs sont silencieux et coûteux |
| Styling | **Tailwind CSS v4** | Tokens de design définis en CSS custom properties (`@theme inline` dans `globals.css`), facile à thèmer en V2 (dark mode) |
| Backend | **API Routes Next.js (Node runtime)** | Mêmes types partagés avec le front via `lib/`, pas de serveur Express à maintenir |
| Base de données | **Airtable** | Plan gratuit suffisant pour un MVP, UI native pour debug, pas de migrations SQL à gérer pendant la formation |
| Auth | **JWT custom + bcryptjs** | Pédagogique pour une formation : on voit la mécanique (hash, signature, cookie), pas masqué derrière une lib |
| Validation | **Zod** | Schémas réutilisables côté form ET côté API (single source of truth) |
| Notifications | **sonner** | Léger, accessible, 0 config |
| Hébergement | **Vercel** | Déploiement `git push` → live, free tier généreux, Preview URLs par PR |

---

## Architecture

```
┌──────────────────────────────┐
│  Browser (React + Tailwind)  │
│  pages: /, /login, /signup,  │
│         /feedbacks, /submit, │
│         /feedback/[id],      │
│         /admin               │
└──────────┬───────────────────┘
           │ fetch + cookie JWT (httpOnly)
           ▼
┌──────────────────────────────┐
│  Next.js API routes (server) │  ← AIRTABLE_TOKEN, JWT_SECRET
│  /api/auth/{signup,login,    │     restent ici, jamais en client
│            logout}, /api/me, │
│  /api/feedbacks[/:id][/vote] │
│                              │
│  proxy.ts (middleware) :     │
│  redirige vers /login si     │
│  pas de cookie               │
└──────────┬───────────────────┘
           │ airtable.js SDK
           ▼
┌──────────────────────────────┐
│  Airtable base "Pulse Base"  │
│  Users · Feedbacks · Votes   │
└──────────────────────────────┘
```

**Single source of truth** : `src/lib/airtable.ts` est le **seul** module qui parle à Airtable. Aucun composant React ne connaît la forme des records — ils consomment des types `UserRecord` / `FeedbackWithCreator` / `VoteRecord` propres.

**Server Components par défaut, Client uniquement quand nécessaire.** Les pages liste / détail / admin sont des Server Components qui appellent directement `lib/airtable.ts` côté serveur — pas de hop fetch HTTP inutile. Seuls les composants interactifs (forms, boutons de vote) sont `"use client"`.

---

## Modèle de sécurité

Trois couches qui se renforcent. Compromettre une seule ne suffit pas.

### 1. Le token Airtable n'atteint jamais le navigateur
- Variable d'env `AIRTABLE_TOKEN` lue **côté serveur uniquement** (`process.env`)
- Aucun préfixe `NEXT_PUBLIC_` (qui exposerait au bundle client)
- Vérification : `curl https://pulse-one-brown.vercel.app/_next/static/...` ne contient jamais `pat...`

### 2. Authentification par cookie JWT signé
- Cookie `pulse_token` :
  - `httpOnly` (impossible à lire en JS, donc immune aux XSS)
  - `secure` en prod (HTTPS uniquement)
  - `sameSite=lax` (CSRF protection raisonnable, signup depuis un lien externe fonctionne)
  - `maxAge` = 7 jours
- Signé HS256 avec `JWT_SECRET` (256 bits aléatoires via `openssl rand -base64 48`)
- Payload : `{ sub: userId, email, role }` — le rôle est dans le JWT pour éviter un fetch DB par requête en middleware

### 3. Autorisation par ressource (server-side)
Les vérifications de propriété sont **dans les API routes**, pas dans l'UI :

| Action | 401 si | 403 si | 409 si |
|---|---|---|---|
| `POST /api/feedbacks` | non connecté | — | — |
| `PATCH /api/feedbacks/:id` | non connecté | `creator !== user.id` | — |
| `DELETE /api/feedbacks/:id` | non connecté | `creator !== user.id` ET `role !== admin` | — |
| `POST /api/feedbacks/:id/vote` | non connecté | — | vote déjà existant |

**Cacher un bouton dans l'UI ne suffit pas** — un `curl` direct contournerait. La vraie barrière est l'API route. L'UI ne fait que masquer ce qui n'est pas actionnable, pour la lisibilité.

### Tests d'attaque effectués (manuels)
- ✅ User A tente `PATCH /api/feedbacks/<id-de-B>` → 403
- ✅ User non connecté → 401 sur tous les endpoints sensibles (y compris `GET /api/feedbacks/[id]`)
- ✅ User normal essaie `/admin` → redirigé vers `/feedbacks`
- ✅ Vote 2× sur le même feedback → 409, `VoteCount` inchangé
- ✅ Token JWT bidouillé (signature invalide) → 401
- ✅ Token Airtable absent du JS bundle vérifié dans Network tab
- ✅ Login avec email inexistant : latence égale à un email valide (timing attack mitigé via `dummyVerify`)

### Hardening additionnel
- **Length caps Zod** : `email.max(254)` (RFC 5321), `password.max(128)` → empêche un payload géant qui ferait boucler bcrypt côté serverless
- **Rate limiting per-IP** (Upstash Redis, optionnel via `UPSTASH_REDIS_REST_*`) sur `/api/auth/login` (5/min), `/api/auth/signup` (3/min), `/api/feedbacks/[id]/vote` (20/min). No-op en dev/CI sans les env vars.
- **Vercel Analytics** + **Sentry** (optionnel via `SENTRY_DSN` env var) → monitoring d'erreurs et Web Vitals en prod
- **Tests E2E Playwright** sur 10 scenarios critiques (signup, login, vote, anti-double-vote, permissions cross-user, kanban workflow)

---

## Accessibilité

Cible **WCAG 2.1 AA**. Audit interne passé, correctifs appliqués sur les écarts les plus visibles.

### Fondations (déjà en place avant audit)

- `<html lang="fr">` + landmarks sémantiques (`<header>`, `<nav>`, `<main>`, `<aside>`)
- Tous les `<input>` ont un `<label htmlFor>` associé (Lighthouse 100)
- Tous les boutons icon-only (toggle thème, dismiss notif, select assign) ont un `aria-label`
- Hiérarchie de titres propre : 1 `<h1>` par page, `<h2>` cohérents
- `TypeBadge` / `StatusBadge` : emojis en `aria-hidden`, label texte lu par les lecteurs d'écran
- Le drag-drop kanban a un **fallback bouton complet** — toutes les actions sont accessibles au clavier sans drag

### Correctifs livrés (audit interne)

| ID | Correctif | Impact |
|---|---|---|
| **C-1** | Focus ring global (`:focus-visible` outline action color, 2px, offset 2px) | Tab navigation visible — WCAG 2.4.7 |
| **C-2** | Skip link "Aller au contenu principal" (sr-only, devient visible au focus) | Bypass du Header pour clavier — WCAG 2.4.1 |
| **C-3** | `text-tertiary` foncé en light (#6e6e6e) et dark (#9a9a9a) | Contraste AA 4.5:1 — WCAG 1.4.3 |
| **I-3** | `role="alert"` sur tous les blocs d'erreur form (login, signup, submit, reset, FeedbackActions) | Erreurs annoncées par lecteur d'écran après submit |
| **I-4** | `celebrate()` confetti respecte `prefers-reduced-motion: reduce` | WCAG 2.3.3, sensibilité vestibulaire |
| **A-2** | `aria-busy={pending}` sur boutons submit pendant les requêtes API | État "occupé" exposé aux lecteurs d'écran |
| **A-3** | Bannières `Notification` et `Verification` en `<aside aria-label>` | Landmarks navigables |
| **A-4** | `inputMode="email"` explicite sur les champs email | Clavier mobile correct, défense en profondeur sur `type=email` |
| **A-5** | `AppToaster` synchronise sonner avec `data-theme` Pulse (au lieu de `prefers-color-scheme`) | Toasts cohérents avec le thème manuel choisi |

### Items audit identifiés mais non encore corrigés (V3)

| ID | Item | Effort |
|---|---|---|
| I-1 | `KeyboardSensor` sur dnd-kit pour drag clavier (fallback bouton existe) | ~10 min |
| I-2 | Émojis dans labels de boutons en `aria-hidden` (ex: "📌 Backlog", "🗑️ Supprimer") | ~15 min |
| I-5 | `aria-current="page"` sur les liens du Header correspondant à la route active | ~15 min |

### Limites connues
- Pas d'audit a11y automatisé en CI (axe-core ou Lighthouse-CI). Listé en V3 dans la roadmap.
- Pas de test manuel avec lecteur d'écran réel (NVDA / VoiceOver) — testé via inspection statique du markup.

---

## Setup local

### Prérequis
- Node ≥ 20
- Compte Airtable (gratuit), GitHub, Vercel (gratuit)

### 1. Installer

```bash
git clone https://github.com/VincentG32/pulse.git
cd pulse
npm install
```

### 2. Créer la base Airtable
1. [airtable.com](https://airtable.com) → **Create a base** → la nommer `Pulse Base`
2. Récupérer le `Base ID` dans l'URL (`airtable.com/appXXXXXXXXXXXXXX/...`)
3. [airtable.com/create/tokens](https://airtable.com/create/tokens) → créer un PAT
   - Name : `Pulse local`
   - Scopes : `data.records:read`, `data.records:write`, `schema.bases:read`
   - Access : restreindre à la base `Pulse Base` (best practice sécu)

### 3. Créer les tables
Voir [Schéma Airtable](#schéma-airtable) ci-dessous.

### 4. Variables d'env

```bash
cp .env.example .env.local
# Éditer .env.local et remplir au minimum :
#   AIRTABLE_TOKEN=patXXXXXXXXXXXXXX...
#   AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
#   JWT_SECRET=$(openssl rand -base64 48)
```

Variables optionnelles :
- `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL`, `APP_URL`) — active l'envoi des emails de vérification et de reset password. Sans la clé, les URLs sont loggées dans la console serveur (suffisant en dev). Free tier 3k emails/mois.
- `REQUIRE_EMAIL_VERIFICATION=true` — active le gate API qui bloque `POST /api/feedbacks`, `/vote`, `/comments` pour les utilisateurs non vérifiés. Off par défaut pour ne pas casser les seeds existants — à activer après migration manuelle.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — active le rate limiting per-IP. Sans ces vars, le limiteur est no-op (pratique en dev/CI).
- `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (même valeur) — active le monitoring d'erreurs Sentry. Sans ces vars, le SDK reste no-op.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — pour l'upload de source maps au build (facultatif).

⚠️ **Ne jamais préfixer `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `JWT_SECRET` avec `NEXT_PUBLIC_`** — ce serait exposer le token côté client.

### 5. Lancer

```bash
npm run dev
# → http://localhost:3000
```

### 6. Créer un admin
Après inscription via `/signup`, ouvrir Airtable → table `Users` → changer `Role` à `admin`. Re-login pour rafraîchir le JWT.

### 6 bis. Comptes de test (base de dev)

Seed data utilisée pour les démos et les tests E2E. Tous marqués `EmailVerifiedAt` non null donc le banner de vérification ne s'affiche pas pour eux.

| Email | Role | Usage |
|---|---|---|
| `alice@test.com` | admin | Compte admin principal — accès au dashboard `/admin` (vue d'ensemble + liste/modération) |
| `bob@test.com` | user | Compte user générique pour vérifier les permissions cross-user |
| `prodtest@example.com` | user | Compte de test "réaliste" (domaine externe) |
| `vgranouillit.pro@gmail.com` | user | Compte propriétaire |
| `marc@pulse.app` | dev | Dev seed — assignations kanban |
| `yasmine@pulse.app` | dev | Dev seed |
| `lea@pulse.app` | dev | Dev seed |
| `marie@pulse.app` | user | User seed — feedbacks fictifs |
| `hugo@pulse.app` | user | User seed |
| `tom@pulse.app` | user | User seed |
| `sarah@pulse.app` | user | User seed |
| `alex@pulse.app` | user | User seed |

> **Comptes manquants ?** Les seeds `@pulse.app` sont fictifs : adresses non valides, emails de vérif/reset y seront loggés en console (pas envoyés). Pour tester un vrai flow Resend, utiliser une adresse réelle. Les mots de passe seed ne sont pas dans le repo — récupérables via password reset si Resend est configuré, ou en re-créant un user via `/signup`.

### 7. Déploiement Vercel
1. `git push` sur GitHub
2. [vercel.com/new](https://vercel.com/new) → Import → choisir le repo `pulse`
3. Environment Variables : ajouter les 3 mêmes (Production + Preview)
4. Deploy → URL en `xxx.vercel.app`

**Recommandé** : créer 2 bases Airtable séparées (`Pulse-Dev` et `Pulse-Prod`) pour ne pas polluer la prod avec de la data de test. Chaque environnement Vercel pointe sur sa base.

### 8. Tests E2E en CI (optionnel)

Le workflow `e2e` dans GitHub Actions exécute les 10 tests Playwright sur chaque push. Il est **opt-in** : tant qu'il n'est pas activé, le workflow CI tourne en `Typecheck · Lint · Build` seulement.

**Pour l'activer** :

1. **Créer une base Airtable de test isolée** :
   - airtable.com → Create base → la nommer `Pulse-Test`
   - Cloner manuellement le schéma de prod (5 tables : Users, Feedbacks, Votes, Notifications, Comments). Ou via [airtable.com/sync-data](https://airtable.com/sync-data).
   - Créer les 4 comptes de test : `alice@test.com` (admin), `bob@test.com` (user), `sarah@pulse.app` (user), `lea@pulse.app` (dev) — tous avec password `password123` (les tests les utilisent).
   - Récupérer le `Base ID` (commence par `app...`)
   - Créer un Personal Access Token dédié avec accès à cette base seulement.

2. **GitHub → Settings → Secrets and variables → Actions** :
   - Onglet **Secrets** : ajouter
     - `E2E_AIRTABLE_TOKEN` (le PAT de la base test)
     - `E2E_AIRTABLE_BASE_ID` (l'ID `app...` de la base test)
     - `E2E_JWT_SECRET` (n'importe quelle string aléatoire 32+ chars)
   - Onglet **Variables** : ajouter
     - `E2E_ENABLED` = `true`

3. Au prochain push, le job `E2E · Playwright` apparaît à côté du job `build`. Sur failure, le rapport HTML est uploadé en artifact (téléchargeable depuis l'onglet Actions).

⚠️ **Pourquoi une base séparée** : les tests créent et suppriment des feedbacks. Ils utilisent des titres préfixés `[E2E timestamp]` et nettoient via `afterEach`, mais une base dédiée garantit zéro pollution sur la prod.

---

## Schéma Airtable

### Diagramme des relations

```
┌──────────┐      ┌────────────┐      ┌──────┐
│  Users   │◄─────│ Feedbacks  │      │ Votes│
│          │  1:N │            │  1:N │      │
│ Email    │◄─────┤ Creator    │◄─────│ User │
│ Hash     │      │            │      │      │
│ Name     │      │            │◄─────┤ Feedback
│ Role     │      └────────────┘  1:N │      │
└──────────┘                          └──────┘
```

### Table `Users`
| Champ | Type | Notes |
|---|---|---|
| `Email` | Single line text | **Primary**, unique (vérifié à signup) |
| `PasswordHash` | Long text | bcrypt cost 10, jamais le password en clair |
| `Name` | Single line text | nom affiché |
| `Role` | Single select | `user` (default) · `dev` · `admin` |
| `CreatedAt` | dateTime | rempli explicitement à signup |
| `EmailVerifiedAt` | dateTime | null = email pas encore vérifié, set = vérifié à cette date |
| `VerificationToken` | Single line text | token de vérification d'email actif (24h), null après usage |
| `VerificationExpires` | dateTime | expiry du token de vérification |
| `ResetToken` | Single line text | token de reset password actif (1h), null après usage |
| `ResetExpires` | dateTime | expiry du token de reset |

> **Migration des utilisateurs existants** : après ajout des 5 champs ci-dessus, les rows existantes ont `EmailVerifiedAt` à null et seraient considérées comme non-vérifiées. Pour basculer les seeds (admin, devs de test) en vérifiés, mettez `EmailVerifiedAt` au timestamp ISO de votre choix dans Airtable. Le gate sur les actions API n'est actif que si `REQUIRE_EMAIL_VERIFICATION=true` (cf. setup), donc vous pouvez introduire la migration progressivement.

### Table `Feedbacks`
| Champ | Type | Notes |
|---|---|---|
| `Title` | Single line text | **Primary** |
| `Description` | Long text | |
| `Type` | Single select | `bug` · `idée` · `amélioration` |
| `VoteCount` | Number (integer) | dénormalisé pour le tri ; incrémenté dans la même route que `create Vote` |
| `Creator` | Link → Users | single record link |
| `CreatedAt` | dateTime | |

### Table `Votes`
| Champ | Type | Notes |
|---|---|---|
| `Reference` | Single line text | **Primary** (laissé vide, on n'utilise pas le primary field ici) |
| `Feedback` | Link → Feedbacks | single record |
| `User` | Link → Users | single record |
| `FeedbackId` | Single line text | **dupliqué pour le filtre** (cf. ⚠️ ci-dessous) |
| `UserId` | Single line text | idem |
| `CreatedAt` | dateTime | |

⚠️ **Pourquoi les champs texte `FeedbackId` / `UserId` en double des liens ?**
Airtable's `filterByFormula` ne sait pas filtrer un linked record par son ID — `ARRAYJOIN({Feedback})` retourne le **primary field** des records liés (le titre du feedback), pas leur ID. Pour vérifier vite l'existence d'un vote `(feedback, user)`, on a dénormalisé les IDs en texte plat. Petit coût en stockage, gros gain en simplicité de requête.

---

## Structure du code

```
src/
├── app/
│   ├── page.tsx                  # / (landing si déconnecté, redirect /feedbacks si connecté)
│   ├── login/                    # /login (page = Suspense + LoginForm client)
│   ├── signup/                   # /signup
│   ├── feedbacks/                # /feedbacks (server) + FeedbacksList (client) avec filtres
│   ├── feedback/[id]/            # /feedback/:id (server) + FeedbackActions (client)
│   ├── submit/                   # /submit (form client)
│   ├── admin/                    # /admin (server, gated par role) + AdminDeleteButton (client)
│   ├── api/
│   │   ├── auth/{signup,login,logout}/route.ts
│   │   ├── me/route.ts
│   │   └── feedbacks/
│   │       ├── route.ts                # GET (list, auth required), POST (create)
│   │       ├── [id]/route.ts           # GET, PATCH, DELETE (avec checks ownership/role)
│   │       └── [id]/vote/route.ts      # POST (anti-double-vote), GET (hasVoted)
│   ├── layout.tsx                # Header + Toaster + container
│   └── globals.css               # design tokens Tailwind v4 @theme
├── components/
│   ├── Header.tsx                # logo + nav contextuelle (admin link si role=admin)
│   ├── FeedbackCard.tsx          # cellule cliquable de la liste
│   ├── TypeBadge.tsx             # badge coloré par type
│   └── LogoutButton.tsx          # client (POST /api/auth/logout)
├── lib/
│   ├── airtable.ts               # SEUL module qui parle à Airtable
│   ├── auth.ts                   # bcrypt + JWT + getCurrentUser + cookie helpers
│   ├── schemas.ts                # Zod (signup, login, createFeedback, updateFeedback)
│   └── format.ts                 # formatDate, truncate
└── proxy.ts                       # Next.js 16 middleware (renommé) - gate par cookie
```

**Convention de nommage** : Server Component = `page.tsx` direct, Client Component = fichier dédié `XxxForm.tsx` / `XxxActions.tsx` co-localisé.

---

## Décisions techniques (mini-ADRs)

### ADR-1 : Pourquoi Airtable plutôt que Postgres ?
**Pour le projet de formation :**
- ✅ Pas de migration SQL à gérer
- ✅ UI native pour debug rapide (renommer un feedback à la main)
- ✅ Plan gratuit suffisant (1 500 records/base, 5 req/s)

**À reconsidérer à scale :**
- ❌ Pas de transaction atomique → race condition possible sur `VoteCount` (2 votes simultanés peuvent perdre une incrémentation)
- ❌ Rate limit 5 req/s ne tient pas au-delà d'une équipe
- ❌ Pas de Row-Level Security native — toute la sécu repose sur les API routes

### ADR-2 : Pourquoi JWT custom plutôt que NextAuth ?
- C'est un projet de **formation**. Exposer la mécanique (`bcrypt.hash`, `jwt.sign`, cookie `httpOnly`) est pédagogique. NextAuth aurait masqué tout ça derrière une abstraction.
- Trade-off : pas d'OAuth GitHub/Google prêt à l'emploi, pas de password reset out-of-the-box.

### ADR-3 : Pourquoi un champ `FeedbackId` (texte) en plus du link `Feedback` sur Votes ?
Voir [Schéma Airtable](#table-votes). Détaillé ci-dessus : `filterByFormula` ne sait pas matcher sur un linked record ID, donc on dénormalise.

### ADR-4 : Pourquoi `proxy.ts` plutôt que `middleware.ts` ?
Next.js 16 a déprécié le nom `middleware.ts` au profit de `proxy.ts` (renommage uniquement). La fonction exportée s'appelle désormais `proxy()` et non `middleware()`. Aucun changement de signature.

### ADR-5 : Pourquoi `force-dynamic` partout au lieu d'`ISR` ?
Pulse est un outil interne de petite équipe — la fraîcheur instantanée des votes prime sur la perf. `force-dynamic` simplifie aussi le mental model (pas de cache à invalider). À reconsidérer V3 quand on aura SWR côté client + cache HTTP côté Edge.

### ADR-6 : Pourquoi pas de `revalidatePath` après mutation ?
Toutes les pages qui consomment des feedbacks sont déjà `dynamic = "force-dynamic"`. Un `router.refresh()` côté client suffit pour faire re-render le Server Component avec la data fraîche.

### ADR-7 : Sécurité des mots de passe — bcrypt cost 10
Standard 2025. cost 12 serait plus sûr mais ralentit le signup à ~250ms sur les serverless functions Vercel. Trade-off accepté pour cette V1.

---

## Roadmap V2 / V3

Organisée par effort × impact. Les tiers sont indépendants — vous pouvez piocher.

### 🟢 Tier 1 — Quick wins déjà livrés (cf. [Fonctionnalités V1.5](#quick-wins-ajoutés-v15-))

### 🟡 Tier 2 — V2 (1-3 jours par feature)

| Feature | Description | Pourquoi |
|---|---|---|
| **Status sur feedback** | Champ `Status` (open / planned / in-progress / shipped / declined) modifiable par admin, badge sur la liste | Évite de re-soumettre des idées déjà traitées |
| **Recherche full-text** | Input avec debounce, filtre `?q=...` côté API via `SEARCH({Title}, q)` Airtable | Demandé par tous les seed users (top des votes !) |
| **Commentaires (thread)** | Nouvelle table `Comments`, route `/api/feedbacks/[id]/comments` | Discussion avant action |
| **Tags / catégories** | Champ `multipleSelects` Airtable, multi-filtre combiné avec type | Pour équipes multi-produits |
| **Email verification** | Resend.com (gratuit) + token jeton expirant, route `/verify/[token]` | N'importe qui peut signup avec un email random |
| **Password reset** | Resend + token expirant 1h | Aucune issue actuellement si user oublie |
| **Export CSV** (admin) | API `/api/admin/export` qui stream un CSV | Reporting mensuel |
| **Soft delete** | Champ `DeletedAt` au lieu de `DELETE` Airtable | Récupération en cas d'erreur admin |
| **Pagination cursor** | `?cursor=...` + bouton "Charger plus" | Au-delà de 100 feedbacks |
| **Optimistic vote** | Update UI **avant** la réponse API, rollback si 409 | Réactivité perçue |

### 🔴 Tier 3 — V3 / refonte (1+ semaine par feature)

| Feature | Pourquoi | Compromis |
|---|---|---|
| **Migration → Postgres** (Supabase / Neon) | Transactions atomiques, RLS, foreign keys, scalabilité | Apprentissage Prisma/Drizzle, perte de l'UI Airtable |
| **NextAuth.js** | OAuth GitHub/Google, sessions DB révocables, password reset out-of-the-box | Couche d'abstraction supplémentaire à comprendre |
| **Tests E2E (Playwright)** | Sécuriser les régressions sur signup, vote, anti-double-vote, permissions | Setup Playwright + DB de test |
| **Notifications email** | Vote reçu, status change | Resend + queue (Inngest ou Vercel Cron) |
| **i18n FR/EN** | Élargir l'audience | next-intl + refactor strings |
| **Audit a11y automatisé en CI** | Audit manuel WCAG AA déjà passé (cf. [Accessibilité](#accessibilité)). Manque axe-core / Lighthouse-CI pour ne pas régresser | Job CI `@axe-core/playwright`, ~2h setup |
| **CI/CD** (GitHub Actions) | Typecheck + lint + build à chaque PR | `.github/workflows/ci.yml` |
| **Sentry** | Erreurs prod actuellement silencieuses | `@sentry/nextjs`, free tier 5k events/mois |
| **Dark mode** 😏 | Top des feedbacks de Pulse lui-même | Tokens Tailwind déjà prêts, ~½ jour |
| **Mobile redesign** | Cards trop denses sur smartphone | 1-2 jours UX + tests sur vrais devices |

---

## Limitations connues

1. **Cohérence éventuelle sur `VoteCount`** — les 2 requêtes Airtable (`createVote` + `incrementVoteCount`) ne sont pas atomiques. Si la 2ᵉ échoue après la 1ʳᵉ, le compteur diverge. Acceptable au volume actuel (~10 utilisateurs), à durcir avec une vraie DB transactionnelle.
2. **Token JWT non révocable** — un cookie compromis reste valide jusqu'à expiration (7 jours). V3 : sessions DB ou tokens courts + refresh.
3. **Pas de password reset / email verification** — un user peut s'inscrire avec un email non vérifié. Pas critique pour un outil interne, à fixer avant un vrai déploiement multi-équipes.
4. **Aucun test automatisé** — validation 100% manuelle. Pas de CI. Premier truc à ajouter en V3.
5. **Performance Airtable** — 5 req/s par base. La page liste fait 2 requêtes (feedbacks + users batch). Tient jusqu'à ~50 utilisateurs simultanés grand max.
6. **Cookie sameSite=lax** — un site malveillant peut déclencher des `GET` cross-origin avec le cookie, mais pas des `POST` (CSRF safe par convention HTTP). Suffisant pour cette V1.
7. **Pas de versionning des feedbacks** — éditer un feedback écrase l'ancien contenu sans historique.

---

## Crédits

Projet final 2 jours du **programme Web Development** de [La Capsule](https://www.lacapsule.academy/), mai 2026.

Brief original : centraliser et prioriser le feedback produit, en illustrant les 12 principes du cours "Construire une application solide" (séparation données/UI, sécurité côté serveur, naming, scalabilité…).

Build : [@VincentG32](https://github.com/VincentG32) avec assistance Claude Code.

---

<sub>Made with 🤍 in Paris.</sub>
