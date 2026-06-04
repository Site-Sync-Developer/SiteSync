# Create the database in pgAdmin and test APIs in Postman

This guide walks through creating a PostgreSQL database using **pgAdmin 4**, connecting the backend with **Prisma**, and calling the API from **Postman**.

---

## Part 1: Install PostgreSQL and pgAdmin

1. Download **PostgreSQL** for Windows from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) (or use the EnterpriseDB installer).
2. During setup, note:
   - **Port** (default `5432`)
   - **Superuser password** for the `postgres` user (you will need this to log in)
3. **pgAdmin** is usually installed with the same installer. If not, install **pgAdmin 4** separately from [pgadmin.org](https://www.pgadmin.org/download/).

---

## Part 2: Open pgAdmin and connect to the server

1. Open **pgAdmin 4**.
2. In the left **Browser** tree, expand **Servers**.
3. You should see something like **PostgreSQL 16** (version may differ). Click it.
4. Enter the **password** you set for the `postgres` user during installation.  
   - Optionally check **Save password** so you are not prompted every time.
5. The server should expand and show **Databases**, **Login/Group Roles**, etc.

If you do not see a server, add one:

1. Right-click **Servers** → **Register** → **Server**.
2. **General** tab: name it e.g. `Local PostgreSQL`.
3. **Connection** tab:
   - **Host:** `localhost`
   - **Port:** `5432` (or your port)
   - **Maintenance database:** `postgres`
   - **Username:** `postgres`
   - **Password:** your postgres password  
4. Click **Save**.

---

## Part 3: Create a new database

1. In the tree, expand your server → **Databases**.
2. Right-click **Databases** → **Create** → **Database…**
3. **Database** field: enter a name, e.g. `staff4dshire`  
   - Use lowercase; avoid spaces.
4. **Owner:** leave as `postgres` (or your admin user) unless you use a dedicated user.
5. Open the **Definition** tab if you want to set encoding; default **UTF8** is fine.
6. Click **Save**.

You should see `staff4dshire` (or your name) under **Databases**.

---

## Part 4: (Optional) Create a dedicated database user

For production you would use a non-superuser. For local testing, using `postgres` is acceptable.

If you want a dedicated user:

1. Expand **Login/Group Roles**, right-click → **Create** → **Login/Group Role…**
2. **General** → **Name:** e.g. `staff4dshire_app`
3. **Definition** → set a **Password** and confirm.
4. **Privileges** → enable **Can login?** if shown.
5. **Save**.
6. Right-click your database → **Properties** → **Privileges** (or use SQL) to grant that user rights on the database.

For the rest of this guide, we assume user **`postgres`** and database **`staff4dshire`**.

---

## Part 5: Build the `DATABASE_URL` for the backend

Prisma uses a single connection string. Format:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Example** (replace `YOUR_PASSWORD` with your real postgres password):

```text
postgresql://postgres:YOUR_PASSWORD@localhost:5432/staff4dshire?schema=public
```

**Special characters in the password** (e.g. `@`, `#`, `%`) must be **URL-encoded** in the connection string, or the URL will break. For example, `@` becomes `%40`.

### If you created the database with SQL (e.g. in pgAdmin Query Tool)

PostgreSQL does **not** print a “connection URL” when you run `CREATE DATABASE`. You build the URL yourself from the same facts you already used:

| Piece in `CREATE DATABASE` / your setup | Maps to URL part |
|------------------------------------------|------------------|
| `OWNER = postgres` | **USER** = `postgres` |
| *(password you set for that user)* | **PASSWORD** (not shown in `CREATE DATABASE`; it is the password for login `postgres`) |
| Server host (same machine as the app) | **HOST** = `localhost` or `127.0.0.1` |
| Default PostgreSQL port (unless you changed it) | **PORT** = `5432` |
| Database name: `staff4dshire` | **DATABASE** = `staff4dshire` |

So for a local server, database `staff4dshire`, user `postgres`, the URL is:

```text
postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/staff4dshire?schema=public
```

Replace `YOUR_POSTGRES_PASSWORD` with the password for the `postgres` role (the one you type when connecting in pgAdmin).

**Note:** Options like `LC_COLLATE`, `ENCODING`, `TABLESPACE` in your `CREATE DATABASE` statement do **not** change the URL format — only user, password, host, port, and database name matter for the connection string.

---

## Part 6: Configure the backend and create tables

1. In your project, go to the `backend` folder.
2. Copy the example env file:
   - Copy `backend/.env.example` to `backend/.env`.
3. Edit **`backend/.env`** and set:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/staff4dshire?schema=public"
   PORT=3001
   JWT_SECRET=a-long-random-string-for-development
   ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
   ```

4. In a terminal, from the **`staff4dshire-rn`** (monorepo) root:

   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **`db push`** creates all tables in the database you created in pgAdmin. You can refresh the database in pgAdmin → **Schemas** → **public** → **Tables** to see them.
6. **`db seed`** inserts a demo company, admin user, and project.

---

## Part 7: Start the API server

From the monorepo root:

```bash
npm run backend:dev
```

You should see something like: `API + Socket.io listening on http://localhost:3001`.

Quick check in a browser: open `http://localhost:3001/health` — you should see JSON like `{"ok":true,"service":"staff4dshire-api"}`.

---

## Part 8: Install Postman

1. Download **Postman** from [postman.com/downloads](https://www.postman.com/downloads/).
2. Install and sign in (or use it without an account for basic use).
3. You can use the **desktop app** or **Postman on the web**; steps below work for both.

---

## Part 9: Test a public endpoint (no login)

1. Open Postman → **New** → **HTTP Request** (or use **+** to create a tab).
2. Method: **GET**
3. URL: `http://localhost:3001/health`
4. Click **Send**.
5. **Response** should be `200 OK` with JSON `ok: true`.

If this fails:

- Confirm the backend terminal is running.
- Confirm nothing else uses port `3001`.
- Try `http://127.0.0.1:3001/health`.

---

## Part 10: Log in and get a JWT token

Most routes require **Bearer** authentication.

### 10.1 Login request

1. Method: **POST**
2. URL: `http://localhost:3001/api/auth/login`
3. Open the **Body** tab → select **raw** → type **JSON**.
4. Body (use the seeded user after `db seed`):

   ```json
   {
     "email": "admin@demo.local",
     "password": "demo123456"
   }
   ```

5. **Send**.

### 10.2 Read the response

You should get **200 OK** with JSON like:

```json
{
  "user": {
    "id": "...",
    "email": "admin@demo.local",
    "first_name": "Admin",
    "last_name": "Demo",
    "role": "superadmin",
    "company_id": "...",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Copy the **`token`** value (the long string).

---

## Part 11: Call a protected endpoint (Bearer token)

1. Create a new request (or duplicate the login tab).
2. Method: **GET**
3. URL: `http://localhost:3001/api/users`
4. Open the **Authorization** tab:
   - **Type:** `Bearer Token`
   - **Token:** paste the JWT from the login response
5. **Send**.

You should get **200 OK** with a JSON array of users (at least the seeded admin).

### Alternative: manual header

Instead of the Authorization tab, use **Headers**:

| Key             | Value                    |
|-----------------|--------------------------|
| `Authorization` | `Bearer eyJhbGciOiJ...`  |

(Paste your full token after `Bearer ` with a space.)

---

## Part 12: Save the token in Postman (optional)

1. After login, in the response, select the `token` value.
2. Create an **Environment** (gear icon → **Environments** → **Add**):
   - Variable: `token`
   - Initial value: paste your JWT
   - Save.
3. Select that environment in the top-right dropdown.
4. In other requests, **Authorization** → **Bearer Token** → use `{{token}}` as the token value.

Or use **Tests** script on the login request to save automatically:

```javascript
const json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
}
```

Then use `{{token}}` in Bearer auth on other requests.

---

## Part 13: More requests to try

Use **POST** with **Body → raw → JSON** where noted. Always send **Bearer token** except for `/health` and `/api/auth/*`.

| Method | URL | Body (JSON) |
|--------|-----|-------------|
| GET | `http://localhost:3001/api/companies` | — |
| GET | `http://localhost:3001/api/projects` | — |
| GET | `http://localhost:3001/api/timesheets` | — |
| POST | `http://localhost:3001/api/auth/register` | `{"email":"new@demo.local","password":"secret123","first_name":"Test","last_name":"User"}` (no Bearer) |
| POST | `http://localhost:3001/api/projects` | `{"name":"Site B"}` (Bearer required; company inferred for non-superadmin) |

**Register** creates a new organisation if you omit `company_id`.

---

## Part 14: Troubleshooting

| Issue | What to check |
|--------|----------------|
| pgAdmin cannot connect | PostgreSQL service running (Windows: Services → postgresql) |
| `db push` fails | `DATABASE_URL` in `.env`, password special chars encoded, database name matches pgAdmin |
| Postman `ECONNREFUSED` | Backend running on port 3001 |
| Postman `401` on `/api/users` | Valid `Authorization: Bearer <token>`; token not expired (default 7 days) |
| Postman `CORS` errors | Usually from a **browser**; Postman desktop ignores CORS. For browser apps, set `ALLOWED_ORIGINS` in `.env` |

---

## Quick reference

- **pgAdmin:** create database → note name, user, password, port.
- **`.env`:** `DATABASE_URL=postgresql://...`
- **Terminal:** `npx prisma db push` → `npx prisma db seed` → `npm run backend:dev`
- **Postman:** `POST /api/auth/login` → copy `token` → `GET /api/users` with **Bearer** token.

For API behaviour and roles, see [`../backend/README.md`](../backend/README.md).
