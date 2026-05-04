# Pulse

Outil de centralisation et priorisation du feedback produit. Projet de formation La Capsule.

**Stack** : Next.js 15 (App Router) · TypeScript · Tailwind v4 · Airtable · Auth JWT custom

---

## Setup local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer la base Airtable

1. Aller sur [airtable.com](https://airtable.com), créer un compte gratuit
2. **Add a base** → from scratch → la nommer `Pulse`
3. Récupérer le `Base ID` dans l'URL : `airtable.com/appXXXXXXXXXXXXXX/...` → la partie `appXXXXXXXXXXXXXX`
4. Créer un Personal Access Token : [airtable.com/create/tokens](https://airtable.com/create/tokens)
   - Name: `Pulse local`
   - Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`
   - Access: cocher uniquement la base Pulse

### 3. Créer les tables (dans la base Pulse)

Dans Airtable, modifier la table par défaut "Table 1" et en créer 2 autres :

#### Table `Users`
| Champ | Type | Notes |
|---|---|---|
| `Email` | Single line text | **Primary** |
| `PasswordHash` | Long text | |
| `Name` | Single line text | |
| `Role` | Single select | options : `user`, `admin` |
| `CreatedAt` | Created time | auto |

#### Table `Feedbacks`
| Champ | Type | Notes |
|---|---|---|
| `Title` | Single line text | **Primary** |
| `Description` | Long text | |
| `Type` | Single select | options : `bug`, `idée`, `amélioration` |
| `VoteCount` | Number (integer, precision 0) | default `0` |
| `Creator` | Link to another record → Users | single record link |
| `CreatedAt` | Created time | auto |

#### Table `Votes`
| Champ | Type | Notes |
|---|---|---|
| `Id` | Auto number | **Primary** |
| `Feedback` | Link to another record → Feedbacks | single record |
| `User` | Link to another record → Users | single record |
| `CreatedAt` | Created time | auto |

### 4. Configurer les variables d'env

```bash
cp .env.example .env.local
# Éditer .env.local et remplir AIRTABLE_TOKEN + AIRTABLE_BASE_ID
```

Le `JWT_SECRET` est déjà généré dans `.env.local`. Pour en regénérer un : `openssl rand -base64 48`.

### 5. Lancer

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

### 6. Créer un admin

Après s'être inscrit via `/signup`, ouvrir Airtable, table `Users`, modifier le champ `Role` du user à `admin`.

---

## Déploiement Vercel

1. `git push` sur GitHub
2. [vercel.com](https://vercel.com) → Import Git Repository → choisir `pulse`
3. Environment Variables : ajouter `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `JWT_SECRET` (Production + Preview)
4. Deploy

⚠️ Recommandé : créer 2 bases Airtable distinctes (`Pulse-Dev` pour `.env.local`, `Pulse-Prod` pour Vercel) pour ne pas polluer la prod avec de la data de test.

---

## Architecture

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── feedbacks/page.tsx
│   ├── feedback/[id]/page.tsx
│   ├── submit/page.tsx
│   ├── admin/page.tsx
│   ├── api/
│   │   ├── auth/{signup,login,logout}/route.ts
│   │   ├── me/route.ts
│   │   └── feedbacks/[id]/{vote,}/route.ts
│   └── layout.tsx
├── components/
│   ├── Header.tsx
│   ├── TypeBadge.tsx
│   └── FeedbackCard.tsx
├── lib/
│   ├── airtable.ts   ← seul endroit qui parle à Airtable
│   ├── auth.ts        ← bcrypt + JWT helpers
│   └── schemas.ts     ← validation Zod
└── middleware.ts      ← protection des routes
```

**Sécurité :**
- Le token Airtable ne quitte jamais le serveur (API routes Next.js)
- Auth via JWT signé dans cookie `httpOnly`, `secure`, `sameSite=lax`
- Toutes les mutations vérifient `getCurrentUser()` + ownership
- L'UI cache les boutons selon le rôle, mais c'est l'API qui refuse pour de vrai (403)
