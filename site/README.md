# Site — front + back

Next.js: telas + API + (futuro) Prisma + Postgres.

## Rodar

```bash
cd site
npm install
npm run dev
```

Abre em **http://localhost:3737**

## API

- `GET /api/health` — status do serviço
- `GET /api/profile` — lê `dados/config/profile.yml`

A extensão em `extensao/` vai consumir essas rotas (`/api/jobs/:id/package` na Fase 2).
