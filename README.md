# ROLLR Platform

Zero-commission directory for Mumbai event **shooters** and **editors**. Clients send a brief; creators open WhatsApp to the client only after accepting. Creator numbers stay private.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Mock data + browser `localStorage` for demos (Supabase schema ready)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve production build
```

## Deploy free (Vercel) — recommended

Best free host for Next.js. ~2 minutes once you have a GitHub account.

### Option A — GitHub + Vercel (best for sharing updates)

1. Create a GitHub repo and push this project:
   ```bash
   git init
   git add .
   git commit -m "ROLLR demo ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/rollr-platform.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Leave defaults (Framework: Next.js). Click **Deploy**.
4. Share the `*.vercel.app` URL.

Optional env (after first deploy):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` |

Redeploy once after setting it so Open Graph URLs resolve cleanly.

### Option B — Vercel CLI

```bash
npm i -g vercel
cd rollr-platform
vercel
```

Follow prompts; then `vercel --prod` for production.

### Mumbai edge (optional)

`vercel.json` sets region `bom1` (Mumbai) for slightly faster India responses.

## Routes

| Path | Description |
|------|-------------|
| `/` | Photographers directory |
| `/editors` | Editors directory |
| `/creators/[id]` | Profile · gallery · external links · `?tab=edit` |
| `/studio` | Local creator listing builder (quality checks, portfolio, links) |
| `/inbox` | Creator brief inbox (demo) |
| `/job-board` | Open briefs |
| `/list` | ₹299 plan + portfolio requirements + waitlist |
| `/setup/supabase` | Supabase connection checklist + health test |
| `/login` · `/signup` | Auth (email/password + magic link) |
| `/auth/callback` | OAuth / magic-link session exchange |

## Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run in order:
   - `supabase/migrations/00001_init.sql`
   - `supabase/migrations/00002_rls_and_profile_trigger.sql`
3. Copy **Project URL** + **anon public** key from **Settings → API** into `.env.local` (see `.env.local.example`)
4. Restart `npm run dev`
5. Open [/setup/supabase](http://localhost:3000/setup/supabase) or `GET /api/supabase/health`
6. **Auth URLs (required for shareable verify emails)** — Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://rollrgigs.vercel.app` (your production URL, not `localhost`)
   - **Redirect URLs** (add all):
     - `https://rollrgigs.vercel.app/**`
     - `https://rollrgigs.vercel.app/auth/confirm`
     - `https://rollrgigs.vercel.app/auth/callback`
     - `http://localhost:3000/**` (local dev only)

If Site URL stays on `http://localhost:3000`, friends who click “confirm email” get **can’t connect to server** — the link opens on *their* machine, where nothing is running.

Signup emails come from Supabase (not Resend). Users should check spam. They can use **Resend confirmation email** on the sign-in page if the first link expires.

Directory UI still uses mock data until live queries are wired. Auth UI is the next slice after connection works.

## Demo notes for viewers

- Sample creators / jobs (not live bookings)
- Briefs + inbox use **browser storage** only
- Send brief from a **profile** page
- Tick **Save my details** to autofill next brief
- Inbox → **Accept & open WhatsApp** messages the **client**

## Design

- Background `#09090b` · Surface `#18181b` · Accent `#eab308`

## License

Private POC — not open source unless you choose otherwise.
