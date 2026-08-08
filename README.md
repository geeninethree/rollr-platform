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
