# EnergyIQ

> Too Good To Go, but for wasted energy.

EnergyIQ helps businesses figure out where their energy actually goes — and what to do about it. You punch in your business type, zip code, square footage, and monthly bill, and we map you to real EPA eGRID emission data for your local utility grid. Not a national average. *Your* grid.

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
# Then open .env and fill in your Supabase keys (see "Environment variables" below)

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

## Project structure

```
├── client/          → Next.js frontend (TypeScript)
├── server/          → Express API (plain JavaScript)
├── design-system/   → Design tokens and style guide
├── schema.sql       → Supabase database schema (run this first!)
├── .env.example     → Template for environment variables
└── .env             → Your actual keys (gitignored)
```

The client talks to the server over HTTP (`localhost:4000/api/*`). The server talks to Supabase with the service role key. The client also talks to Supabase directly for auth (using the anon key). This is intentional — auth is client-side, data writes go through Express so we can run the EPA lookup logic server-side.

---

## Team roles

| Role | What you own | Key files |
|------|-------------|-----------|
| **Frontend Dev 1** | Pages, routing, layout, Tailwind theming | `client/app/*`, `client/app/globals.css` |
| **Frontend Dev 2** | Components, Supabase client queries, auth UI | `client/components/*`, `client/lib/*` |
| **Backend Dev** | Express routes, controllers, middleware, EPA data | `server/**` |
| **Fullstack / Flex** | DB schema in Supabase dashboard, API integration, deployment | `schema.sql`, `.env`, deployment configs |

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

**Important:** The `NEXT_PUBLIC_` prefix is what makes a variable accessible in the browser. Don't put the service role key behind `NEXT_PUBLIC_` — that key can bypass RLS.

---

## Common issues

**"CORS error in browser console"**
→ Check that the Express `cors` origin matches your Next.js port. By default it's `http://localhost:3000`. If you changed the Next.js port, update `CLIENT_URL` in `.env` or the cors config in `server/index.js`.

**"Supabase returns empty array"**
→ You probably haven't run `schema.sql` yet, or RLS is enabled but the policies aren't created. Go to Supabase SQL Editor and run the full `schema.sql` file.

**"401 on Express routes"**
→ The frontend needs to send the Supabase access token in the `Authorization: Bearer <token>` header. Check that `getAuthHeader()` in the dashboard page is actually getting a session.

**"Port 4000 already in use"**
→ Something else is running there. Either kill it (`lsof -ti:4000 | xargs kill`) or change `EXPRESS_PORT` in `.env`.

**"Can't find module X" in server**
→ Did you run `npm install` inside the `server/` directory? The client and server have separate `node_modules`.

**"Supabase auth not working"**
→ Make sure you've enabled email/password auth in Supabase Dashboard → Authentication → Providers → Email.

---

## Git workflow

- Branch off `main` for features: `git checkout -b feat/your-thing`
- Keep commits small and descriptive
- Talk to each other before touching shared files (especially `schema.sql`, `globals.css`, and `.env.example`)
- PR into `main` when ready

---

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

## What's next

- [ ] Wire up the "Ask for a 90-day plan" button to an API endpoint
- [ ] Persist adopted actions across sessions (they save to Supabase already, just need to load them back)
- [ ] Add a history view showing past analyses
- [ ] Replace the static eGRID lookup with live EPA API calls
- [ ] ENERGY STAR Portfolio Manager integration for real building benchmarks
