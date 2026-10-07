# Rishta Ghar

A Muslim marriage bureau app that works on **iPhone, Android and laptops from one website**.
Families can install it on their home screen like a normal app, and nothing needs to go through an app store.

- **Families** browse published biodata, shortlist, see match scores, register their own biodata and send interests.
- **Bureau staff** review applications, publish profiles, record each family's answer to an interest, and download biodata images to share on WhatsApp.
- **Languages:** English and Urdu (right to left). Button labels stay in English.
- **Privacy:** contact details are for the bureau (admin) only. Members see first names; phone numbers, full names, guardians and private photos are visible only to bureau staff. Phone numbers, emails and WhatsApp/social links typed into public fields (such as About) are refused. These rules are enforced by the database itself, not just hidden in the app.

Built with React + TypeScript (Vite), Supabase (login, database, photo storage) and `vite-plugin-pwa` (installable app, offline-ready).

---

## 1. Create the Supabase project (one time, about 10 minutes)

1. Sign up at <https://supabase.com> and create a new project. Pick the region closest to your users.
2. **Database:** open *SQL Editor → New query*, paste all of [`supabase/schema.sql`](supabase/schema.sql), and press *Run*.
3. **Sign-in by email code:** go to *Authentication → Emails → Templates → Magic Link* and make sure the body contains the code, for example:

   ```html
   <h2>Your Rishta Ghar code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   ```

4. **Sending email to real users:** Supabase's built-in email only sends a few messages per hour. Before launch, add your own SMTP under *Authentication → Emails → SMTP Settings*. Brevo, Resend and Zoho all have free tiers.
5. **Keys:** under *Project Settings → API*, copy the **Project URL** and the **anon / publishable key**.

## 2. Run it on your computer

```bash
cp .env.example .env
```

Put the two values from step 1.5 into `.env`, then:

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:5173>, sign in with your email and the code you receive.

## 3. Make yourself bureau staff

After signing in once, run this in the Supabase SQL Editor with your email:

```sql
insert into public.staff (user_id) select id from auth.users where email = 'you@example.com';
```

Reload the app and the **Bureau desk** tab appears. Add your phone number, hours and address there.

## 4. Put it online

Any static host works. The easiest is **Vercel** (free):

1. Go to <https://vercel.com>, sign in with GitHub, and *Add New → Project → import* this repository.
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Deploy. You get a link like `rishta-ghar.vercel.app`, and you can connect your own domain later.
4. In Supabase *Authentication → URL Configuration*, set **Site URL** to that link.

Netlify and Cloudflare Pages work the same way: build command `npm run build`, output folder `dist`.
Hosting keeps working if you make the GitHub repository private later.

## 5. Installing on phones

| Device | How |
| --- | --- |
| Android (Chrome) | Open the link and tap **Install app**, or use the menu's *Add to Home screen*. |
| iPhone (Safari) | Open the link, tap **Share**, then **Add to Home Screen**. The app shows these steps itself. |
| Laptop (Chrome / Edge) | Click **Install app** in the header or the install icon in the address bar. |

When a new version is deployed, installed apps show an **Update** button.

---

## Project layout

```
supabase/schema.sql      tables, privacy rules, staff actions, photo buckets
src/lib/                 Supabase client, data calls, translations, match score, biodata image
src/components/          sign-in, profile card, biodata dialog, registration form, install prompt
src/views/               Browse, Shortlist, My interests, My profile, Bureau desk
public/logo.svg          app icon source; all icon sizes are generated from it at build time
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run locally with live reload |
| `npm run build` | Type-check and build the production site into `dist/` |
| `npm run preview` | Serve the built site locally, including the installable app |
| `npm run lint` | Check the code for common mistakes |

## Possible next steps

- Sign in with phone number (SMS code). This needs an SMS provider such as Twilio set up in Supabase.
- Publishing to Google Play as a wrapped app (Trusted Web Activity), if a Play Store listing is wanted.
- Email or WhatsApp alerts to staff when a new application or interest arrives.
