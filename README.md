# Tuma Emprego

Hub local de candidaturas a emprego (Brasil).

## Mapa das pastas

```
TumaEmprego/
├── dados/       ← seus arquivos (CV, respostas, PDFs)
├── site/        ← Next.js: telas + API + banco (porta 3737)
├── extensao/    ← Chrome: autofill Gupy/LinkedIn
├── agente/      ← regras do agente IA + relatórios de vagas
├── docs/        ← visão e roadmap
└── scripts/     ← PDF e utilitários CLI
```

## Onde me acho?

| Quero | Pasta |
|-------|--------|
| Editar CV | `dados/cv-base.md` |
| Perfil / busca | `dados/config/profile.yml` |
| Respostas formulário | `dados/respostas/` |
| Métricas | `dados/resultados/` |
| PDF gerado | `dados/pdfs/` |
| Site / kanban | `site/` |
| Extensão Chrome | `extensao/` |
| Regras do Agent | `agente/AGENTS.md` |
| Relatório de vaga | `agente/relatorios/` |
| Plano do produto | `docs/VISAO.md` |

## Para quem desenvolve com IA

Leia **`agente/AGENTS.md`** antes de implementar.

## Rodar o site (da raiz)

```bash
# primeira vez — instala dependências do site
npm run install:site

# subir em http://localhost:3737
npm run dev
```

Também funciona de dentro de `site/` com `npm run dev`.

## Banco (Postgres + Prisma)

O schema Prisma fica em **`site/prisma/`**. Rode os comandos **da raiz** do repositório (não use `npx prisma` na raiz — isso baixa outra versão e não acha o schema):

```bash
npm run db:up        # sobe Postgres (Docker)
npm run db:setup     # cria usuário/banco (Windows + psql local)
npm run db:generate  # gera o client Prisma (site/)
npm run db:push      # aplica o schema no banco
npm run db:seed      # popula catálogo de vagas e tecnologias
```

Atalho após o banco estar no ar: `npm run db:prepare` (generate + push + seed).

Equivalente dentro de `site/`: `npm run db:generate`, `npm run db:push`, `npm run db:seed`.

## Ordem sugerida

1. `dados/` — na primeira execução o site copia os `*.example` para arquivos locais (gitignored); preencha com seus dados  
2. `site/` — app + Postgres (catálogo de vagas)  
3. `scripts/` — gerar PDF  
4. `extensao/` — autofill  
5. `agente/` — avaliar vagas com IA  

Detalhes dos arquivos em **`dados/README.md`**.

## Status

Fase 1 em andamento — site com página de perfil em `site/` (porta 3737).
