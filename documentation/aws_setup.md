# AWS Setup — CheckMeIn

## Architecture

Single EC2 instance per environment running Docker Compose with three services:
- **Caddy** — reverse proxy, auto-provisions HTTPS via Let's Encrypt
- **CheckMeIn** — Next.js 16 app (multi-stage Docker build, standalone output)
- **PostgreSQL 15** — database, data persisted on EBS-backed Docker volume

## Environments

| Environment | Elastic IP | Domain (nip.io) | Instance Type |
|-------------|-----------|------------------|---------------|
| **Dev** | `3.17.46.175` | `3-17-46-175.nip.io` | `t3.small` |
| **Prod** | `3.147.146.220` | `3-147-146-220.nip.io` | `t3.small` |

Both instances run Ubuntu 24.04 with Docker CE and Docker Compose plugin.

The nip.io domains are free, zero-config DNS that resolve based on the embedded IP address. Caddy auto-provisions Let's Encrypt TLS certificates for these domains. When a real domain is ready (e.g., `checkmein.innovationtreehouse.org`), update the `DOMAIN` and `NEXTAUTH_URL` in `.env` and restart Caddy.

## SSH Access

```bash
# Dev
ssh -i /path/to/daniel_isntances.pem ubuntu@3.17.46.175

# Prod
ssh -i /path/to/daniel_isntances.pem ubuntu@3.147.146.220
```

The PEM key is an ED25519 SSH key named `daniel_isntances.pem`.

## Files on Each Instance

```
~/checkmein/
├── .env                    # Environment-specific config (not in git)
├── docker-compose.prod.yml # Production compose (Caddy + app + Postgres)
├── Caddyfile               # Reverse proxy config
├── Dockerfile              # Multi-stage build
└── ... (rest of repo)
```

## Environment Variables (`.env`)

| Variable | Description |
|----------|-------------|
| `DOMAIN` | nip.io domain (or real domain later) |
| `DB_PASSWORD` | PostgreSQL password (shared between app and Postgres container) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_URL` | Full HTTPS URL of the app |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |

> **Never set `NEXT_PUBLIC_DEV_AUTH`** on prod — it enables a dev-only auth bypass.

## Google OAuth Setup

Each domain needs its redirect URI registered in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

- Dev: `https://3-17-46-175.nip.io/api/auth/callback/google`
- Prod: `https://3-147-146-220.nip.io/api/auth/callback/google`

Currently using the same dev OAuth credentials on both instances. Production credentials should be created separately when ready.

## Common Operations

### Deploy / update
```bash
cd ~/checkmein
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Run database migrations
```bash
docker compose -f docker-compose.prod.yml exec web npx prisma db push
```

### Seed the database
```bash
docker compose -f docker-compose.prod.yml exec web npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### View logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just the app
docker compose -f docker-compose.prod.yml logs -f web
```

### Restart
```bash
docker compose -f docker-compose.prod.yml restart
```

### Full teardown (preserves data)
```bash
docker compose -f docker-compose.prod.yml down
```

### Full teardown (destroys data)
```bash
docker compose -f docker-compose.prod.yml down -v
```

## Security Notes

- PostgreSQL is **not** exposed to the internet — no port mapping, only accessible from the app container
- SSH (port 22), HTTP (80), and HTTPS (443) are the only inbound ports allowed by the security group
- HTTP automatically redirects to HTTPS via Caddy
- The dev auth bypass (`NEXT_PUBLIC_DEV_AUTH`) is **not** set on deployed instances
- The mock credentials provider in NextAuth only activates when `NODE_ENV=development` (production Docker image sets `NODE_ENV=production`)

## Cost

~$15–20/mo per instance:
- `t3.small` (2 vCPU / 2 GB): ~$15/mo
- 20 GB EBS gp3: ~$1.60/mo
- Elastic IP: free while attached to a running instance

## Future Improvements

- [ ] GitHub Actions CI/CD (auto-deploy to dev, manual promote to prod)
- [ ] Real domain name (replacing nip.io)
- [ ] Production Google OAuth credentials
- [ ] EBS snapshot backups on a schedule
- [ ] Monitoring / alerting
