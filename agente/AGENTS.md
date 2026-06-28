# Tuma Emprego — Instruções para o Agent

> Regras do Agent · Produto: [`../docs/VISAO.md`](../docs/VISAO.md)

## Regras para iniciante (sempre seguir)

1. **Respostas curtas** — direto ao ponto; detalhes e tutorial só se o usuário pedir.
2. **Um passo por vez** — não implementar várias fases juntas; confirmar antes de avançar.
3. **Explicar o porquê** — ao criar arquivo ou comando, dizer em 1 linha o que faz.
4. **JavaScript só** — sem TypeScript; sem bibliotecas extras sem necessidade.
5. **Respeitar as pastas** — `dados/` = arquivos do usuário · `site/` = app · `extensao/` = Chrome · `agente/` = IA · `scripts/` = utilitários.
6. **Nunca inventar no CV** — só `dados/cv-base.md` e `dados/resultados/`; ênfase por vaga, mesmos fatos.
7. **Código simples** — preferir a solução mais óbvia; evitar over-engineering.
8. **Não commitar** — só quando o usuário pedir explicitamente.
9. **Não apagar dados** — não sobrescrever `cv-base.md` ou `profile.yml` sem backup ou confirmação.
10. **Perguntar quando faltar info** — CV, métrica, JD incompleta: pedir em vez de chutar.
11. **UI limpa, sem justificativa** — não colocar na aplicação (títulos, labels, hints, descrições, tooltips) o raciocínio ou contexto do pedido. Explicações ficam **no chat**, não no produto. Na tela: texto curto e direto — ex.: **"Contato"**, não "Dados de contato pedidos em Gupy, Catho, InfoJobs e LinkedIn". O mesmo para comentários no código que só repetem o pedido.
12. **Linguagem simples** — comentários no código, commits e mensagens em português claro, como programador iniciante; sem jargão nem texto robótico.
13. **Commits como o Lucca** — só commitar quando ele pedir. Mensagem curta em 1ª pessoa. **Nunca** `Co-authored-by`, `Made-with: Cursor`, nem frase que pareça gerada por IA.

**Comentários no código:** português, só onde não for óbvio — nunca como justificativa de tarefa.

## O que é este projeto

**Tuma Emprego** é um hub local de candidaturas a emprego (Brasil). O usuário cadastra perfil, CV base, respostas e resultados uma vez; o sistema ajuda a avaliar vagas, adaptar o currículo por demanda, gerar PDFs e (futuro) preencher formulários via extensão Chrome.

**Não é** ferramenta de spam ou candidatura automática. O usuário sempre revisa e clica em Enviar.

## Stack (confirmada)

| Camada | Tecnologia |
|--------|------------|
| App | Next.js (App Router), **JavaScript** — pasta `site/` |
| Banco | **PostgreSQL local** + Prisma |
| Arquivos | `dados/pdfs/` e `dados/fotos/` — paths no banco, não binário |
| IA (dev) | **Cursor Agent** — este arquivo + `docs/VISAO.md` |
| PDF | HTML template + Playwright — `scripts/` |
| Extensão | Chrome MV3 — `extensao/` |
| Porta dev | `3737` |

## Arquitetura

```
dados/      = CV, respostas, resultados, PDFs, fotos
site/       = front + API + banco (Next.js)
extensao/   = lê API do site e preenche formulários
agente/     = regras IA, relatórios de vagas (este arquivo)
scripts/    = gerar PDF, utilitários
```

## Regras de negócio (CRÍTICO)

### CV e ênfase por vaga

- **Nunca inventar** empregos, anos, ferramentas ou métricas.
- **Sempre** partir de `dados/cv-base.md` e `dados/resultados/`.
- **Adaptar** = reordenar bullets, mudar ênfase (dev | bi | dados), keywords da JD **só com base real**.

### Métricas e resultados

- Métricas **só** de `dados/resultados/` ou confirmadas pelo usuário.
- Escala **estagiário/júnior**. **Nunca** inventar % ou R$ sem base.

### Avaliação de vagas

- Nota 1.0–5.0. **Recomendar candidatura apenas se ≥ 4.0**.
- Relatório em `agente/relatorios/`.

### Pacote de candidatura

- PDF em `dados/pdfs/`
- Respostas + dados do perfil
- Contrato API: ver `docs/VISAO.md`

### Human-in-the-loop

- Extensão **preenche**, usuário **revisa e envia**.

## Modos / comandos

| Pedido do usuário | Ação |
|-------------------|------|
| Cola JD ou URL | Nota + relatório em `agente/relatorios/` |
| Adapta CV | JD + cv-base → ênfase → PDF |
| Pacote de candidatura | PDF + fields + textareas |
| Gera respostas formulário | `dados/respostas/` + contexto da vaga |
| Atualiza tracker | Kanban no `site/` ou `dados/candidaturas/` |
| Onboarding | Verificar cv-base.md e profile.yml |

## Leitura obrigatória

1. `docs/VISAO.md`
2. `docs/ROADMAP.md`
3. `dados/cv-base.md` e `dados/config/profile.yml`

## O que NÃO fazer

- Inventar experiência ou métricas
- Candidatura em massa automatizada
- BYTEA no Postgres para PDF/foto
- Secrets no código ou commits
- Texto verboso na UI ou comentários que justificam o pedido do usuário (contexto de portais, JD, etc.)
- `Co-authored-by`, `Made-with: Cursor` ou assinatura de IA em commits
