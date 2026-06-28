# Tuma Emprego

Hub local de candidaturas a emprego (Brasil).

## Mapa das pastas

```
TumaEmprego/
├── dados/       ← seus arquivos (CV, respostas, PDFs)
├── site/        ← Next.js: telas + API + banco (porta 3737)
├── extensao/    ← Chrome: autofill Gupy/LinkedIn
├── agente/      ← Cursor Agent: regras + relatórios de vagas
├── docs/        ← visão e roadmap
└── .cursor/     ← config do editor (não editar manualmente)
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

## Para o Cursor Agent

Leia **`agente/AGENTS.md`** antes de implementar.

## Rodar o site (da raiz)

```bash
# primeira vez — instala dependências do site
npm run install:site

# subir em http://localhost:3737
npm run dev
```

Também funciona de dentro de `site/` com `npm run dev`.

## Ordem sugerida

1. `dados/` — preencher CV e perfil  
2. `site/` — app + Postgres  
3. `scripts/` — gerar PDF  
4. `extensao/` — autofill  
5. `agente/` — avaliar vagas com IA  

## Status

Fase 1 em andamento — site com página de perfil em `site/` (porta 3737).
