# Tuma Emprego — Roadmap

> Mapa das pastas: [`../README.md`](../README.md)

## Fase 0 — Fundação ✅

- [x] Arquitetura: `dados/`, `site/`, `extensao/`, `agente/`
- [x] `agente/AGENTS.md` + rules + skill
- [x] `dados/` — estrutura de arquivos
- [x] `docs/` — visão e roadmap
- [ ] `dados/cv-base.md` preenchido (com usuário)
- [ ] `dados/config/profile.yml` (copiar do example)

## Fase 1 — Site + banco

- [ ] Next.js em `site/` — porta 3737
- [ ] PostgreSQL + Prisma
- [ ] Telas: Perfil, CV base, Resultados, Respostas
- [ ] API `GET /api/profile`, `GET /api/health`

## Fase 2 — Vagas + kanban

- [ ] CRUD vagas, colar JD
- [ ] Kanban por status
- [ ] Avaliação via Agent → `agente/relatorios/`
- [ ] `GET /api/jobs/:id/package`

## Fase 3 — PDF

- [ ] Template `dados/templates/cv.html`
- [ ] `scripts/generate-pdf.mjs`
- [ ] Salvar em `dados/pdfs/`

## Fase 4 — Extensão Chrome (em andamento)

- [x] `extensao/` — Manifest V3, botão detectar vaga, popup
- [x] `POST /api/curriculo/vaga/pacote` — classifica segmento + CV + PDF
- [x] `GET /api/extensao/ping`
- [ ] Autofill de formulários (Gupy, LinkedIn)

## Fase 5 — E-mail + polish

- [ ] Gmail OAuth, parsers, kanban automático
- [ ] LinkedIn Easy Apply

## Se o tempo apertar

1. `site/` — perfil + respostas
2. API para extensão
3. `extensao/` Gupy básica
4. PDF adaptado
5. Kanban + e-mail
