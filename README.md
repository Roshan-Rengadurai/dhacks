# Terrain

Terrain helps businesses figure out where their energy actually goes — and what to do about it. You punch in your business type, zip code, square footage, and monthly bill, and we map you to real EPA eGRID emission data for your local utility grid. Not a national average. *Your* grid.

Then you get an action plan you can customize, a letter grade, and a 90-day roadmap.

Built at **Divergent Hacks 2026** — Sustainability track.

---

## Quick start

You need two terminal windows. Yes, two. Sorry.

```bash
# 1. Clone it
git clone https://github.com/Roshan-Rengadurai/dhacks.git
cd dhacks

# 2. Set up environment
cp .env.example .env

# 3. Set up the database
# Go to your Supabase dashboard → SQL Editor → paste the contents of schema.sql → Run

# 4. Install everything
cd client && npm install
cd ../server && npm install

# 5. Run both servers
# Terminal 1:
cd client && npm run dev    # → http://localhost:3000

# Terminal 2:
cd server && npm run dev    # → http://localhost:4000
```

That's it. You should see the landing page at localhost:3000.

---

## Tech stack

| What | Why |
|------|-----|
| **Next.js 16** (App Router, TypeScript) | File-based routing, SSR, the whole deal |
| **Tailwind CSS** + **shadcn/ui** | Fast styling without writing CSS files. shadcn gives us accessible components out of the box |
| **Express.js** | Simple backend for business logic and EPA data lookups |
| **Supabase** | Auth + Postgres + RLS. One service instead of three |

---

## Environment variables

| Variable | Where to find it | Used by |
|----------|-----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public | Client |
| `SUPABASE_URL` | Same URL as above (without the NEXT_PUBLIC prefix) | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret!) | Server |
| `EXPRESS_PORT` | Pick a port, default is 4000 | Server |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` locally | Client |



## Deployment

**Frontend (Vercel):**
1. Connect the GitHub repo to Vercel
2. Set the root directory to `client`
3. Add all `NEXT_PUBLIC_*` env vars in Vercel's dashboard
4. Deploy

**Backend (Railway or Render):**
1. Create a new web service pointing to the `server` directory
2. Set start command to `node index.js`
3. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `EXPRESS_PORT` as env vars
4. Update the `CLIENT_URL` env var to your Vercel URL (for CORS)
5. Update `NEXT_PUBLIC_API_URL` in Vercel to point to your deployed backend URL

---
