---
name: tuma-emprego
description: Hub local de candidaturas BR — avaliar vagas, adaptar CV, métricas, pacote de candidatura, extensão autofill.
---

# Tuma Emprego — Skill

## Antes de agir

1. Ler `agente/AGENTS.md`
2. Ler `docs/VISAO.md` se for arquitetura ou produto
3. Ler `dados/cv-base.md` e `dados/config/profile.yml` se existirem

## Comandos mentais

| Usuário diz | Fazer |
|-------------|-------|
| Cola JD / URL | Nota 1–5 → `agente/relatorios/` |
| Adapta CV / PDF | Ênfase a partir de cv-base; nunca inventar |
| Pacote de candidatura | PDF + fields + textareas |
| Formulário / Gupy | `dados/respostas/` + resultados |

## Regras inegociáveis

- Não inventar experiência, ferramentas ou números
- **Currículo:** 1ª pessoa, tom humano; sem metadados da plataforma — ver `agente/AGENTS.md` (“Tom e voz” e “Metadados da plataforma”)
- PDFs em `dados/pdfs/`
- App em `site/`, extensão em `extensao/`
- UI com texto curto — sem justificativas do pedido em labels, hints ou comentários

## Stack

Next.js JS em `site/`, Postgres, Prisma, Playwright em `scripts/`, porta 3737.
