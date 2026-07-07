# Tuma Emprego — Visão do Produto

## Em uma frase

Hub local: **`site/`** = cadastro + API + banco · **`extensao/`** = autofill · **`agente/`** = IA · **`dados/`** = seus arquivos.

## Solução

| Peça | Pasta | Função |
|------|-------|--------|
| **Site (Next.js)** | `site/` | Perfil, respostas, kanban, API |
| **PostgreSQL** | dentro do `site/` | Dados + paths para arquivos |
| **Arquivos** | `dados/` | CV, PDFs, fotos |
| **Extensão Chrome** | `extensao/` | Preenche formulário → usuário envia |
| **Agente IA** | `agente/` | Avalia vaga, adapta CV, relatórios |
| **Scripts PDF** | `scripts/` | Playwright → PDF |

## Fluxo do usuário

```
1. Cadastra no site (site/)
2. Vaga chega (link, e-mail)
3. Agent pontua aderência (≥ 4 recomenda)
4. Gera pacote: PDF + respostas (dados/)
5. Extensão preenche formulário
6. Usuário revisa → Envia
7. Kanban atualiza (site/)
```

## Princípio: ênfase, não mentira

- CV base em `dados/cv-base.md`
- Por vaga: reordenar e destacar o que a JD pede
- Métricas só em `dados/resultados/`

## Pacote de candidatura (API ↔ extensão)

```javascript
// GET /api/jobs/:id/package  (roda em site/)
{
  jobId: "uuid",
  pdfUrl: "/api/files/pdfs/localiza-estagio-bi.pdf",
  fields: { nome, cpf, email, telefone, linkedin },
  textareas: [{ key, labelMatch, content }]
}
```

## Kanban

`inbox` → `evaluating` → `ready` → `applied` → `viewed` → `interview` → `rejected` | `offer`

## Stack

- JavaScript, Next.js 15, App Router
- PostgreSQL + Prisma
- Tailwind + shadcn/ui
- Playwright, Chrome MV3, Gmail API (fase 2)
- `localhost:3737` — local no PC (v1)

## Persona (exemplo)

Estudante ou profissional em início de carreira em dados, desenvolvimento ou marketing — busca estágio/trainee via LinkedIn, Catho, InfoJobs, Gupy, etc. Cada pessoa preenche seus próprios arquivos em `dados/` (não versionados).
