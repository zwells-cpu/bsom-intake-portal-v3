# BSOM Intake Portal — v3

Internal intake operations portal for Behavioral Solutions of Mississippi. Version 3 is a full rewrite in React + Vite, replacing the previous single-file HTML versions.

## Tech Stack

- **React 18** — component-based UI
- **Vite** — fast build tool and dev server
- **React Router v6** — client-side navigation
- **Supabase** — PostgreSQL database + auth
- **DM Sans / DM Mono** — typography

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Badge.jsx       # Status badges, office pills, progress ring
│   ├── HomePage.jsx    # Landing screen with module grid
│   ├── ReferralModal.jsx  # Client detail / edit modal
│   ├── Sidebar.jsx     # Module navigation sidebar
│   └── ThemeToggle.jsx # Light/dark toggle
├── hooks/            # Data & state hooks
│   ├── useReferrals.js   # Referral CRUD (Supabase)
│   ├── useAssessments.js # Assessment CRUD (Supabase)
│   └── useTheme.js       # Light/dark theme persistence
├── lib/              # Utilities & constants
│   ├── constants.js    # OFFICES, STAFF, MODULES, field lists
│   ├── supabase.js     # Supabase client init
│   └── utils.js        # Badge colors, pct(), sortList(), exportCSV()
├── pages/            # Page-level components
│   ├── AllReferralsPage.jsx
│   ├── DashboardPage.jsx
│   ├── IntakePages.jsx   # IntakeDash, Pending, Insurance, NR
│   ├── NewReferralPage.jsx
│   └── AboutPage.jsx
├── styles/
│   └── global.css      # All CSS (CSS variables, layout, components)
├── App.jsx           # Root — routing + app shell
└── main.jsx          # React entry point
```

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/bsom-intake-portal.git
cd bsom-intake-portal
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ Never commit `.env` — it's in `.gitignore` by default.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for production

```bash
npm run build
```

Output goes to `/dist`. Deploy to Vercel or Netlify.

## Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click Deploy — auto-deploys on every push to `main`

## Notes

- Assessment and Operations pages are scaffolded with stubs and ready for the next build phase
- The original `index.html` single-file version is preserved separately for reference
- All Supabase queries use the official `@supabase/supabase-js` v2 client
