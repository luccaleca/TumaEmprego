# Tuma Emprego — Instruções para o Agent

> Regras do Agent · Produto: [`../docs/VISAO.md`](../docs/VISAO.md)

## Regras para iniciante (sempre seguir)

1. **Respostas curtas** — direto ao ponto; detalhes e tutorial só se o usuário pedir.
2. **Um passo por vez** — não implementar várias fases juntas; confirmar antes de avançar.
3. **Explicar o porquê** — ao criar arquivo ou comando, dizer em 1 linha o que faz.
4. **JavaScript só** — sem TypeScript; sem bibliotecas extras sem necessidade.
5. **Respeitar as pastas** — `dados/` = arquivos do usuário · `site/` = app · `extensao/` = Chrome · `agente/` = IA · `scripts/` = utilitários.
6. **Nunca inventar no CV** — consultar **toda** a fonte do candidato (perfil, tecnologias, conteúdo, formação, busca, resultados, cv-base); ênfase por vaga, mesmos fatos.
7. **Código simples** — preferir a solução mais óbvia; evitar over-engineering.
8. **Não commitar** — só quando o usuário pedir explicitamente.
9. **Não apagar dados** — não sobrescrever `cv-base.md` ou `profile.yml` sem backup ou confirmação.
10. **Perguntar quando faltar info** — CV, métrica, JD incompleta: pedir em vez de chutar.
11. **UI limpa, sem justificativa** — não colocar na aplicação (títulos, labels, hints, descrições, tooltips) o raciocínio ou contexto do pedido. Explicações ficam **no chat**, não no produto. Na tela: texto curto e direto — ex.: **"Contato"**, não "Dados de contato pedidos em Gupy, Catho, InfoJobs e LinkedIn". O mesmo para comentários no código que só repetem o pedido.
12. **Linguagem simples** — comentários no código, commits e mensagens em português claro, como programador iniciante; sem jargão nem texto robótico.
13. **Commits** — só commitar quando o usuário pedir. Título **curto no imperativo** (como o GitHub usa): `adiciona secao tecnologias`, `remove profile.yml do git` — **não** 1ª pessoa (`eu adicionei…`). Corpo opcional, 1–3 linhas, só se precisar. **Nunca** `Co-authored-by`, trailers de ferramenta de IA, nem texto que pareça gerado por IA.

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
| IA (dev) | **Agente** — este arquivo + `docs/VISAO.md` |
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
- **Sempre** consultar a fonte unificada do candidato antes de adaptar:
  - `dados/cv-base.md`
  - `dados/conteudo/banco.yml` (experiências, projetos, cursos, competências)
  - `dados/config/profile.yml` (contato, identificação)
  - `dados/config/tecnologias.yml` (níveis e stack — ex.: n8n em *outras*)
  - `dados/config/formacao.yml`
  - `dados/config/busca.yml` (segmentos e cargos alvo)
  - `dados/resultados/*.yml` (métricas confirmadas)
  - No código: `site/lib/fonteCandidato.js` (`getFonteCandidato()`)
- **Adaptar** = **reframe**, não criar fatos novos.

#### Reframe por segmento (a ideia central)

Uma mesma experiência (ex.: estágio em varejo) pode envolver **várias competências reais** — dev, dados, marketing, etc. Cada variação de currículo **destaca o que importa para aquela área**, usando só o que a pessoa de fato fez ou faria naturalmente naquele papel.

| Segmento | Ênfase na mesma experiência |
|---|---|
| **Desenvolvimento** | React, Next.js, Node.js, JavaScript, SQL, automações, Git, entregas web |
| **Dados / BI** | SQL, consultas, Python/Pandas, Power BI, modelagem, KPIs |
| **Marketing / Growth** | Google Ads, Meta Ads, segmentação, funil, KPIs, Power BI |
| **IA** | Base analítica (SQL, Python) que sustenta produto e priorização |

**Como fazer:** bullets em `dados/conteudo/banco.yml` com `segmentos` (em quais CVs aparece) e, quando o mesmo fato precisa de wording diferente, `texto_por_segmento` (reframe por área). Métricas só de `dados/resultados/`.

**Como NÃO fazer:** inventar cargo, stack ou entrega que não existiu; copiar o mesmo parágrafo de resumo em todos os segmentos; tratar variação como “outro emprego”.

### Metadados da plataforma — NUNCA no currículo

`dados/cv-base.md` e os `.md` de variação alimentam o **PDF enviado a recrutadores**. Só pode ir para o markdown do currículo o que apareceria num CV real.

**Proibido** (nem comentário HTML):

- `<!-- ... -->` com notas internas do Tuma Emprego
- `**Cargo-alvo (base):**` — metadado interno; no cv-base **não** existe cargo-alvo
- Blockquotes explicativos: `> Fonte única…`, `> Versão adaptada…`, `> Estrutura ATS…`, `> derivada do cv-base`
- Linhas de segmentação: `**Stack (visão geral):**`, `**Ramificações:**`, `**Áreas:**`, `**Foco:**` (fora do parágrafo do resumo)
- Frases tipo “Este arquivo é a fonte…”, “versões por segmento enfatizam…”

**Permitido no cabeçalho do cv-base:** `# Nome` + uma linha de contato (cidade · e-mail · telefone · links).

**Variações por segmento:** pode ter `**Cargo-alvo:**` (sem “base”) com o cargo daquela versão — isso é conteúdo de CV, não metadado da plataforma.

Organização interna (segmentos, ramificações, prompts) fica em `agente/`, `dados/curriculo/*.json`, código — **nunca** no texto que vira PDF.

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
- `Co-authored-by`, trailers de ferramenta de IA ou assinatura de IA em commits
