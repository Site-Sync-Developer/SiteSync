# Backend Port 3001 Troubleshooting (Windows + Git Bash)

When you see this error:

`Error: listen EADDRINUSE: address already in use :::3001`

it means another process is already using port `3001`.

## Quick Fix (most common)

Run these commands in your terminal:

```bash
netstat -ano | findstr :3001
taskkill //PID <PID_FROM_NETSTAT> //F
npm run backend:dev
```

Example:

```bash
netstat -ano | findstr :3001
# LISTENING       1724
taskkill //PID 1724 //F
npm run backend:dev
```

## Step-by-step (safe way)

1. Check who is listening on port `3001`:

```bash
netstat -ano | findstr :3001
```

2. Look for lines with `LISTENING`.
   - The last number in the row is the PID.

3. Kill that PID:

```bash
taskkill //PID <PID> //F
```

4. Verify the port is free:

```bash
netstat -ano | findstr :3001
```

If there is no `LISTENING` entry for `:3001`, you are good.

5. Start backend again:

```bash
npm run backend:dev
```

## One-liner helper (PowerShell)

Use this from Git Bash when you want an automatic kill for port `3001`:

```bash
powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess; if($p){ Stop-Process -Id $p -Force; Write-Host ('Killed PID ' + $p) } else { Write-Host 'Port 3001 is already free' }"
```

Then run:

```bash
npm run backend:dev
```

## Notes

- `TIME_WAIT` lines are normal and do not block startup.
- The only blocking state is usually `LISTENING`.
- If this keeps happening, make sure you do not have multiple terminals running `npm run backend:dev` at the same time.
