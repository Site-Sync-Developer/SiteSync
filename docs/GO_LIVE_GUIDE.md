# SiteSync Go-Live Guide (Render + Web + iOS + Android)

This guide is the production runbook for launching:

- Backend API on Render
- Admin web app and Staff web app
- Admin mobile app (iOS + Android)
- Staff mobile app (iOS + Android)

It is written for the current repository structure:

- `backend`
- `apps/admin-app`
- `apps/staff-app`

---

## 1) Release Strategy (Recommended)

Use a phased rollout to reduce risk:

1. Deploy backend + database first
2. Point web clients to production backend and validate
3. Distribute mobile builds to internal testers (TestFlight/Internal Testing)
4. Submit to App Store + Play Store
5. Enable production users after store approvals

This lets you run real production tests before full public release.

---

## 2) Production Architecture

- **Backend hosting:** Render Web Service (`backend`)
- **Database:** Neon Postgres
- **Auth:** JWT handled by backend (`JWT_SECRET`)
- **Clients:** Expo apps (`admin-app`, `staff-app`) for web + mobile
- **Realtime:** Socket endpoint uses backend origin

Production URLs:

- API base: `https://sitesync-backend.onrender.com/api`
- Socket base: `https://sitesync-backend.onrender.com`

### Current deployment status

- Backend deployed on Render: `https://sitesync-backend.onrender.com`
- Production database created on Neon
- Render Blueprint created and connected to GitHub

---

## 3) Pre-Go-Live Checklist

Before touching production:

- [ ] All critical flows pass in local/staging
- [ ] Database backups enabled
- [ ] Production `DATABASE_URL` ready
- [ ] Strong `JWT_SECRET` generated
- [ ] CORS allowlist finalized (`ALLOWED_ORIGINS`)
- [ ] Privacy policy and support email ready for store submissions
- [ ] App icons/splash/screenshots ready (Admin + Staff)
- [ ] Terms/privacy links available publicly (website or docs page)

---

## 3.1) Environment Variables Matrix (what goes where)

Use this section as the source of truth for production configuration.

### A) Render backend service (`sitesync-backend`)

Set in Render -> Backend service -> Environment:

- `NODE_VERSION=20.18.0`
- `NODE_ENV=production`
- `DATABASE_URL=<your-neon-postgres-url>`
- `JWT_SECRET=<long-random-secret>`
- `ALLOWED_ORIGINS=https://sitesync-admin-web.onrender.com,https://sitesync-staff-web.onrender.com`
- `PUBLIC_API_BASE_URL=https://sitesync-backend.onrender.com`
- `SEED_ON_DEPLOY=false` (set `true` once for controlled initial seed, then revert to `false`)

Xero (backend only):

- `XERO_CLIENT_ID=<from-xero-developer-app>`
- `XERO_CLIENT_SECRET=<from-xero-developer-app>`
- `XERO_REDIRECT_URI=https://sitesync-backend.onrender.com/api/xero/oauth/callback`
- Optional: `XERO_SCOPES=<space-separated-scopes>`
- Optional: `XERO_TOKEN_ENCRYPTION_KEY=<32+-char-secret>`

### B) Render admin web service (`sitesync-admin-web`)

Set in Render -> Admin web service -> Environment:

- `NODE_VERSION=20.18.0`
- `EXPO_PUBLIC_API_URL=https://sitesync-backend.onrender.com/api`
- `EXPO_PUBLIC_SOCKET_URL=https://sitesync-backend.onrender.com`
- `EXPO_PUBLIC_XERO_REDIRECT_URI=https://sitesync-backend.onrender.com/api/xero/oauth/callback`

### C) Render staff web service (`sitesync-staff-web`)

Set in Render -> Staff web service -> Environment:

- `NODE_VERSION=20.18.0`
- `EXPO_PUBLIC_API_URL=https://sitesync-backend.onrender.com/api`
- `EXPO_PUBLIC_SOCKET_URL=https://sitesync-backend.onrender.com`

### D) Local development files (never commit secrets)

- `backend/.env` -> backend-only secrets and database settings
- `apps/admin-app/.env` -> admin app `EXPO_PUBLIC_*` values
- `apps/staff-app/.env` -> staff app `EXPO_PUBLIC_*` values

Only `EXPO_PUBLIC_*` values belong in frontend environments. Keep all secrets in backend env only.

---

## 4) Backend Go-Live on Render

The repo already includes `render.yaml` with backend service settings.

### 4.1 Create service

In Render (already completed for this project):

1. New -> Blueprint (or Web Service)
2. Connect GitHub repo
3. Confirm service uses:
   - `rootDir: backend`
   - build command from `render.yaml`
   - start command: `npm start`
   - health check: `/health`

### 4.2 Required environment variables

Set these in Render service:

- `DATABASE_URL` (Postgres connection string)
- `JWT_SECRET` (long random secret)
- `ALLOWED_ORIGINS` (comma-separated frontend origins)
- `PUBLIC_API_BASE_URL` (public backend base URL, no `/api`)
- `SEED_ON_DEPLOY` (`false` by default; set `true` only once if needed)

Suggested `ALLOWED_ORIGINS` example:

`https://admin.staff4dshire.com,https://staff.staff4dshire.com`

### 4.3 Database migration and seed behavior

Current build already runs:

- `npx prisma generate`
- `npx prisma migrate deploy`
- optional seed when `SEED_ON_DEPLOY=true`

For first production deployment:

1. Set `SEED_ON_DEPLOY=true`
2. Deploy once
3. Confirm seed output in Render logs
4. Immediately set `SEED_ON_DEPLOY=false`
5. Redeploy

This prevents accidental reseeding on future deploys.

### 4.4 Health validation

After deploy, verify:

- `GET /health` returns healthy response
- API calls from web/mobile succeed
- Realtime/socket connects

---

## 5) Production Accounts and Invitations

Current seed is configured for go-live:

- Company: `Staff4dshire Properties`
- Superadmin: `tom@staff4dshireproperties.com`
- Password: `123456`
- Admin invitation prepared for: `adam@staff4dshireproperties.com`

First-login hardening:

- Sign in as Tom
- Change password immediately
- Invite/activate additional admins through normal flow
- Confirm invitation acceptance and role assignments

---

## 6) Web Go-Live (Admin + Staff on Web)

Both Expo apps support web output and can run in browsers.

### 6.1 Set production environment variables

For each app environment:

- `EXPO_PUBLIC_API_URL=https://sitesync-backend.onrender.com/api`
- `EXPO_PUBLIC_SOCKET_URL=https://sitesync-backend.onrender.com`
- `EXPO_PUBLIC_XERO_REDIRECT_URI=https://sitesync-backend.onrender.com/api/xero/oauth/callback`

Apply to:

- `apps/admin-app/.env`
- `apps/staff-app/.env`

### 6.2 Deploy frontends on Render (Web Services)

Create **two Render Web Services** (one for Admin web, one for Staff web), each serving exported Expo web assets with a Node static server.

> Important: Render **Free** Web Services also sleep after inactivity. Use a paid always-on plan (for example Starter+) to prevent sleep.

#### A) Add tiny static servers

Create one server file per app:

- `apps/admin-app/server.js`
- `apps/staff-app/server.js`

Use this content in each file:

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexFile = path.join(distDir, 'index.html');

const server = http.createServer((req, res) => {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(distDir, reqPath.split('?')[0]);
  const safePath = path.normalize(filePath);

  if (!safePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(safePath, (err, data) => {
    if (err) {
      fs.readFile(indexFile, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(500);
          res.end('Server error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      });
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Web app listening on port ${port}`);
});
```

#### B) Admin web service

In Render -> New -> Web Service:

- **Name:** `sitesync-admin-web`
- **Runtime:** Node
- **Branch:** `main`
- **Root directory:** `apps/admin-app`
- **Build command:** `cd ../.. && npm install --legacy-peer-deps && npm run shared:build && cd apps/admin-app && npx expo export --platform web --output-dir dist --clear`
- **Start command:** `node server.js`

Set environment variables:

- `EXPO_PUBLIC_API_URL=https://sitesync-backend.onrender.com/api`
- `EXPO_PUBLIC_SOCKET_URL=https://sitesync-backend.onrender.com`
- `EXPO_PUBLIC_XERO_REDIRECT_URI=https://sitesync-backend.onrender.com/api/xero/oauth/callback`
- `NODE_VERSION=20.18.0`

#### C) Staff web service

In Render -> New -> Web Service:

- **Name:** `sitesync-staff-web`
- **Runtime:** Node
- **Branch:** `main`
- **Root directory:** `apps/staff-app`
- **Build command:** `cd ../.. && npm install --legacy-peer-deps && npm run shared:build && cd apps/staff-app && npx expo export --platform web --output-dir dist --clear`
- **Start command:** `node server.js`

Set environment variables:

- `EXPO_PUBLIC_API_URL=https://sitesync-backend.onrender.com/api`
- `EXPO_PUBLIC_SOCKET_URL=https://sitesync-backend.onrender.com`
- `NODE_VERSION=20.18.0`

#### D) Domain and CORS follow-up

After both web services are live, update backend `ALLOWED_ORIGINS` in Render with the exact frontend URLs, for example:

`https://sitesync-admin-web.onrender.com,https://sitesync-staff-web.onrender.com`

#### E) Render form values (copy/paste)

Admin web service:

- `Name`: `sitesync-admin-web`
- `Runtime`: `Node`
- `Branch`: `main`
- `Root Directory`: `apps/admin-app`
- `Build Command`: `cd ../.. && npm install --legacy-peer-deps && npm run shared:build && cd apps/admin-app && npx expo export --platform web --output-dir dist --clear`
- `Start Command`: `node server.js`

Staff web service:

- `Name`: `sitesync-staff-web`
- `Runtime`: `Node`
- `Branch`: `main`
- `Root Directory`: `apps/staff-app`
- `Build Command`: `cd ../.. && npm install --legacy-peer-deps && npm run shared:build && cd apps/staff-app && npx expo export --platform web --output-dir dist --clear`
- `Start Command`: `node server.js`

---

## 7) Mobile Release Setup (Both Apps)

You have two separate mobile apps:

- Admin app: `com.staff4dshire.admin`
- Staff app: `com.staff4dshire.staff`

Treat each as a separate store listing on Apple and Google.

### 7.1 Install EAS CLI

From repo root:

```bash
npm install -g eas-cli
eas login
```

### 7.2 Initialize EAS in each app

Run in each app folder:

```bash
cd apps/admin-app
eas build:configure
cd ../staff-app
eas build:configure
```

This creates `eas.json` files. Commit them after review.

### 7.3 Create release profiles

For each app `eas.json`, create at least:

- `preview` (internal testers)
- `production` (store submission)

Set environment per profile to production backend URLs.

---

## 8) Android Play Store Go-Live

Do these steps for **both** Admin and Staff apps.

### 8.1 Google Play Console

1. Create two apps in Play Console:
   - SiteSync Admin
   - SiteSync Staff
2. Package names must match:
   - `com.staff4dshire.admin`
   - `com.staff4dshire.staff`

### 8.2 Build Android production binaries

In each app folder:

```bash
eas build --platform android --profile production
```

Use AAB for Play Store submission.

### 8.3 Internal testing before production

1. Upload AAB to Internal Testing track
2. Add tester emails
3. Validate login, chat, timesheets, notifications, media upload
4. Fix and rebuild until stable

### 8.4 Publish to Production

1. Complete store listing content (description, graphics, contact, privacy policy)
2. Complete Data Safety form
3. Complete App Content declarations
4. Submit production release

Rollout recommendation:

- Start at 10-20%
- Monitor crashes/feedback
- Increase to 100% when stable

---

## 9) iOS App Store Go-Live (via TestFlight)

Do these steps for **both** Admin and Staff apps.

### 9.1 Apple setup

1. Apple Developer account active
2. Create two app records in App Store Connect:
   - bundle `com.staff4dshire.admin`
   - bundle `com.staff4dshire.staff`
3. Configure certificates/signing (EAS can manage automatically)

### 9.2 Build iOS binaries

In each app folder:

```bash
eas build --platform ios --profile production
```

### 9.3 Upload and test in TestFlight

Upload via EAS submit or Transporter, then:

1. Add internal testers
2. Run complete UAT on real devices
3. Verify permissions prompts (camera/photos/location)
4. Confirm push notifications behavior if enabled

### 9.4 Submit for App Review

For each app listing:

- Add screenshots for supported device sizes
- Add privacy policy URL
- Fill app privacy questionnaire
- Fill age rating/content info
- Submit for review

---

## 10) CI/CD and Release Control

Recommended branch model:

- `main` = production-ready only
- feature branches -> PR -> merge to `main`
- Render auto-deploy from `main`

Recommended gates:

- TypeScript build passes (`backend` + shared package)
- Prisma migrations reviewed before merge
- Smoke tests pass on a preview environment

---

## 11) Launch Day Runbook

### 11.1 Final pre-launch checks

- [ ] Render deploy healthy
- [ ] DB migrations complete
- [ ] Seed run only once
- [ ] Superadmin login works
- [ ] Admin invitation flow works
- [ ] Chat/timesheets/projects tested
- [ ] Error logs clean

### 11.2 Launch execution

1. Announce production URLs to internal team
2. Enable first wave of users
3. Monitor Render logs + DB metrics continuously for 24-48h
4. Keep rollback plan ready (revert to previous backend deploy if needed)

### 11.3 Post-launch (first week)

- Daily review of:
  - auth failures
  - API errors
  - crash reports
  - user onboarding issues
- Patch quickly and redeploy in small increments

---

## 12) Security and Compliance Minimums

Before full public adoption:

- Enforce strong passwords and password reset process
- Rotate `JWT_SECRET` if leaked/unknown
- Restrict CORS to known frontends only
- Use HTTPS everywhere (Render default)
- Ensure DB backup retention and restore testing
- Remove debug/test credentials after stabilization

---

## 13) Practical Commands

From repo root:

```bash
npm install
npm run shared:build
npm run backend:build
```

Backend local verification:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Admin app:

```bash
cd apps/admin-app
npm start
```

Staff app:

```bash
cd apps/staff-app
npm start
```

---

## 14) Recommended Immediate Next Steps

1. Confirm Render environment variables are complete (`DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, Xero vars).
2. Run one controlled seed (`SEED_ON_DEPLOY=true`) to create go-live company/accounts, then set it back to `false`.
3. Set production app env values in both apps to `https://sitesync-backend.onrender.com`.
4. Create EAS configs and generate preview builds for Admin and Staff apps.
5. Complete UAT with internal testers (auth, invites, chat, timesheets, incidents, onboarding).
6. Submit Admin + Staff apps to Play Console and App Store Connect.

