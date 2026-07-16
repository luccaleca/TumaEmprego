# Tuma Emprego — Instruções para o Agent

> Regras do Agent · Produto: [`../docs/VISAO.md`](../docs/VISAO.md)

## Regras para iniciante (sempre seguir)

1. **Respostas curtas** — direto ao ponto; detalhes e tutorial só se o usuário pedir.
2. **Um passo por vez** — não implementar várias fases juntas; confirmar antes de avançar.
3. **Explicar o porquê** — ao criar arquivo ou comando, dizer em 1 linha o que faz.
4. **JavaScript só** — sem TypeScript; sem bibliotecas extras sem necessidade.
5. **Respeitar as pastas** — `dados/` = arquivos do usuário · `site/` = app · `extensao/` = Chrome · `agente/` = IA · `scripts/` = utilitários.
6. **CV: fatos + inferência sem exagero** — consultar a fonte do candidato. **Não inventar** empresa, cargo sênior ou data falsa. **Pode e deve** completar atividade de estágio e **consequência qualitativa plausível** quando o usuário não lembrar (ex.: lista limpa → disparo sem contato inválido; painel → time/dono enxerga progresso). **Sem** % / R$ de vaidade. Ver “Inferência de estágio”. **1ª pessoa**; sem instruções internas no PDF.
7. **Código simples** — preferir a solução mais óbvia; evitar over-engineering.
8. **Não commitar** — só quando o usuário pedir explicitamente.
9. **Não apagar dados** — não sobrescrever `cv-base.md` ou `profile.yml` sem backup ou confirmação.
10. **Perguntar quando faltar info crítica** — JD incompleta, dúvida de fato grave: pedir. **Não** travar o CV pedindo toda consequência de estágio — inferir no tom certo.
11. **UI intuitiva, zero tutorial** — a tela deve se explicar sozinha (layout, labels curtos, estado visual). **Não** colocar na aplicação (`site/`, `extensao/`), nem em PDFs/artefatos do usuário, textos que ensinem a usar o produto: fluxo, “como o Tuma monta”, onde ficam os arquivos, comparação com `cv-base`, detecção de portal, etc. **Permitido:** rótulos de campo, títulos de aba/seção, placeholders objetivos, estados (`Gerando…`, `Desatualizado`), erros factuais. **Explicações** ficam no chat com o agente ou em aba dedicada de guia/ajuda — nunca em telas de trabalho (Perfil, Vaga, Currículo, Portais…). Regra Cursor: `.cursor/rules/ui-sem-texto-obvio.mdc` (se existir).
12. **Linguagem simples** — comentários no código, commits e mensagens em português claro, como programador iniciante; sem jargão nem texto robótico.
13. **Commits** — só commitar quando o usuário pedir. Título **curto no imperativo** (como o GitHub usa): `adiciona secao tecnologias`, `ajusta templates em dados/` — **não** 1ª pessoa (`eu adicionei…`). Corpo opcional, 1–3 linhas, só se precisar. **Nunca** `Co-authored-by`, trailers de ferramenta de IA, nem texto que pareça gerado por IA.
14. **Dados locais / Git** — ajustes em `dados/`, gitignore ou histórico: commits e mensagens **neutros** (`ajusta templates`, `separa arquivos locais`). Não narrar “dados sensíveis”, privacidade ou limpeza de PII em commits/PRs, salvo pedido explícito do usuário.
15. **Mercado brasileiro** — vagas, cargos, certificações e exemplos em **pt-BR** e relevantes para o Brasil (Alura, DIO, Skillshop, Udemy BR, etc.). Regra Cursor: `.cursor/rules/mercado-brasil.mdc`. Cursos do candidato em `banco.yml` prevalecem; fallback em `site/lib/certificacoesBr.js`.
16. **Projetos no CV** — título com resumo em uma linha + uma linha por tecnologia explicando o uso; ver `agente/AGENTS.md` → “Projetos no currículo”.
17. **Resumo anti-IBGE** — faz bem → prova → encaixe no **cargo** (nunca “quero trabalhar na empresa X”); CV conta experiência adaptada, não mendiga a vaga.
18. **Nunca subir dados pessoais ao Git** — **proibido** commitar ou push de arquivos com dados reais do usuário ou que variem de pessoa para pessoa. Versionar **somente** templates `*.example.yml` / `*.example.md` genéricos. **Nunca** commitar: `profile.yml`, `banco.yml`, `atividades.yml`, `cv-base.md`, `formacao.yml`, `tecnologias.yml`, `busca.yml`, `respostas/*.yml`, `portais/solides.yml`, `segmentacoes/`, PDFs, fotos, `pedido-*.json`, prompts/fontes de adaptação, `.env`, chaves (`*.pem`, `*.crx`). No **código** versionado, não hardcodar nome, e-mail, CPF, empresa real, formação real ou métricas pessoais — ler de `dados/` em runtime. Antes de `git add`, revisar o diff; se houver dado identificável, **não commitar**.
19. **Erro do usuário = grupo** — se ele apontar um problema (data, cidade, idioma…), **não** corrija só o exemplo. Investigue e ajuste o **bloco inteiro** e falhas **parecidas** (mesmo seletor, parse, overwrite, PT/EN). Ex.: data de formação → início e fim; endereço → CEP+rua+estado+cidade. Regra Cursor: `.cursor/rules/erro-grupo-relacionado.mdc`.

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

### Tom e voz do currículo (1ª pessoa, humano)

O CV é **seu** — quem lê acha que **você** escreveu. Recrutadores e ATS não podem perceber IA nem ferramenta interna.

**Sempre em 1ª pessoa:**
- `Entrego análises com SQL e Power BI…` / `Tenho experiência com…` / `Desenvolvi…` — não `Candidato a…` nem 3ª pessoa
- Bullets de experiência e projetos no imperativo ou 1ª pessoa (`- Desenvolvi…`, `- Montei…`)

#### Resumo (obrigatório — denso, estilo CV feito à mão)

Em **todo** CV (segmento ou vaga), o **Resumo** é um parágrafo curto (3–5 linhas) na ordem:

1. **Contexto + o que faz** — curso/instituição em **uma fração** (ex.: `Estudante de Sistemas de Informação (IMT)`) + stack/entregas **do segmento** aplicadas a negócio
2. **Prova** — o que já fez (estágio ou projeto), com consequência; se houver métrica em `resultados/`, priorizar
3. **Encaixe** — `Busco …` só no **final** (cargo/área genéricos — **nunca** nome da empresa/programa)

**Referência boa (densidade / tom):** CV feito à mão do candidato (1 página, impacto, texto natural) — não o tom robótico de “Atuo com A, B, C, em X”.

**Proibido:**
- `Busco estágio…` como **primeira** frase
- Resumo só de curso + “busco vaga” (sem prova)
- **Frase coringa** `entregas em sistemas, dados e operação` (igual em todo segmento)
- **Mendigar** empresa/vaga

**Ok:** começar com “Estudante de … (IMT) com experiência prática em …” **se** a frase já carrega stack + prova em seguida.

**Exemplo de direção:** `Estudante de SI (IMT) com experiência prática em SQL, Python e análise de dados. Atuei com extração, relatórios e dashboards para apoiar decisão. Busco estágio em análise de dados.`  
**Ruim:** `Atuo com SQL, Python, Power BI, PostgreSQL, Excel, em análises…` (lista fria) / `Busco estágio na Empresa X.`

**Proibido no texto que vira PDF** (instruções internas, não conteúdo de CV):
- Referências a arquivos ou pastas: `banco.yml`, `conteudo/`, `dados/`, `cv-base`, prompts, agente
- Frases para o agente: “Destaque projetos…”, “Inclua do seu banco…”, “deve estar no banco”
- Seção **Destaques** separada — conquistas e entregas ficam em **Experiência** e **Projetos**
- Comentários HTML (`<!-- Adaptado em… -->`) ou qualquer rastro de geração automática

**Layout (1 página para estágio — obrigatório tentar caber):**  
Resumo → Experiência → Projetos (curto) → Competências → Formação → Certificações.  
**Exceção IA / agentes:** Projetos pode vir antes da Experiência (prova principal).

#### Qualidade do motor (todas as variações)

Além do formato, o gerador deve:

1. **Fonte única = perfil do candidato** — todo CV (Base e vaga) sai de `getFonteCandidato()` / `dados/` (`banco.yml`, `tecnologias.yml`, `atividades.yml`, `formacao.yml`, `profile.yml`, `resultados/`). A IA **não inventa** stack nem emprego fora disso; só reordena e enfoca.
2. **1 página (estágio)** — obrigatório tentar caber. Enxugar certs/projetos/competências antes de aceitar pág. 2.
3. **Competências densas** — no máx. **2 linhas** de ferramentas + idiomas. Ferramentas **na mesma linha**, separadas por vírgula (`SQL, MySQL, PostgreSQL`). **Proibido** uma tech por bullet (desperdiça espaço). Até ~10 tools com evidência. Sem órfãos.
4. **Experiência = pool primeiro** — provas em `atividades.yml` (ação + ferramenta + pra quê). `banco.yml` complementa e traz impacto (%/R$). Sem duplicar o mesmo tema (ex.: 2× Power BI).
5. **Projetos** — `### Nome — o que é` + `- **Tech** — uso`; **no máx. 1 projeto** (2 em IA); stack enxuta (até 4 techs).
6. **Certificações** — no máx. **5**, as mais alinhadas ao segmento/JD.
7. **Mesma regra Base e vaga** — Base = reframe do segmento; vaga = mesmos dados + ênfase da JD, sem nome da empresa no PDF.

#### ATS que funciona vs que não funciona (todas as partes)

| Parte | Funciona | Não funciona |
|-------|----------|--------------|
| **Cabeçalho** | `# Nome` + contato + `**Cargo-alvo:**` do segmento | Foto, colunas, ícones, QR, nomes inventados |
| **Resumo** | Contexto estudo curto + stack do segmento + prova + `Busco **cargo**` | Lista fria de tools; coringa; mendigar empresa; só “busco” no início |
| **Experiência** | Pool `atividades.yml` (ferramenta + pra quê); impacto do banco; 1 tema | Banco só; 2× mesmo Power BI; bullet genérico |
| **Projetos** | 1 projeto forte com `Tech — uso` | 3 projetos cheios empurrando certs p/ pág. 2 |
| **Competências** | 1–2 linhas: `Ferramentas: A, B, C` + idiomas | Uma tech por linha (`- SQL`); dump sem evidência |
| **Formação** | Curso, instituição, período | Formação como único conteúdo do Resumo |
| **Certificações** | Até 5 cursos reais do `banco.yml` (pt-BR) | 8+ certs quebrando página |
| **Export PDF** | **1 página** no estágio | 2ª página por lista de tools/certs |

**Motor:** `site/lib/adaptarCvLocal.js` + `buildResumoPerfil` + `conteudoBanco.js`. Sanitização: `site/lib/cv.js`.

Instruções de montagem ficam em `agente/`, `site/lib/` e prompts — **nunca** no markdown do currículo.

### CV e ênfase por vaga

- **Não inventar** empresa, período ou cargo sênior. % / R$ só com confirmação ou `resultados/`.
- **Inferência de estágio (ok, sem exagero):** a experiência existe no banco (ex.: Ótica) → o agente **completa** atividades e **consequências qualitativas** típicas, mesmo quando o usuário não lembra o resultado. Ex.: “fiz dashboard” → times viram progresso / gestão priorizou conversa. **Não** virar liderança formal nem “+40% de receita” sem confirmação.
- Fonte de pool: `dados/conteudo/atividades.yml` + `banco.yml`. Se faltar “pra quê”, **inventar consequência razoável de estágio**.
- **Sempre** consultar a fonte unificada do candidato antes de adaptar:
  - `dados/cv-base.md` — **só estrutura** (nome, contato e títulos das seções); conteúdo vem das fontes abaixo
  - `dados/conteudo/banco.yml` (experiências, projetos, cursos, competências)
  - `dados/conteudo/atividades.yml` (pool de atividades de estágio por segmento)
  - `dados/config/profile.yml` (contato, identificação)
  - `dados/config/tecnologias.yml` (níveis e stack — ex.: n8n em *outras*)
  - `dados/config/formacao.yml`
  - `dados/config/busca.yml` (segmentos e cargos alvo)
  - `dados/resultados/*.yml` (métricas confirmadas)
  - No código: `site/lib/fonteCandidato.js` (`getFonteCandidato()`)
- **Adaptar** = **reframe** + provas + consequência; não criar emprego novo.

#### Contexto por segmento (Ótica + projetos)

Ao montar prova/bullet, **ancorar no contexto certo**:

| Segmento | Contexto principal | Exemplos |
|----------|-------------------|----------|
| **Desenvolvimento** / Eng. software | Softwares da Ótica | App **estoque** (SQL, PHP, HTML/CSS/JS); **portal do vendedor** (Next, React, Node, Firebase) + painel admin |
| **Dados / BI** | Mesmos sistemas + SQL/Excel/Power BI na Ótica | Consultas, CSV, dashboard dos 4 times, dados por vendedor no portal |
| **Marketing / Growth** | **Lançamentos** na Ótica | Lista WhatsApp, SendFlow, Meta/Google Ads, atendimento no lançamento, mídia × venda |
| **IA / ML** | **Projetos** (não inventar LLM na Ótica) | TumaIA, TumaCore — RAG, Chat SQL, produto com IA |

Na Ótica, IA = no máximo base limpa/visualização; **LLM/ML fica nos projetos**.

#### Inferência de estágio

| Pode | Não pode |
|------|----------|
| Bullet de tarefa típica de estágio alinhada ao que já existe (SQL, dashboard, ajuste de tela, apoio a Ads) | Inventar “aumentei 40%” / R$ sem base (salvo o usuário confirmar) |
| Completar o que a pessoa não lembrou, se couber no contexto da empresa/período | Inventar cargo de pleno/sênior ou liderança formal |
| **Uma situação, vários ângulos** — mesmo fato com `texto_por_segmento` (ex.: CSV → WhatsApp vira dados OU growth) | Copiar atividade de outro emprego ou stack que não usou |
| Usar `atividades.yml` como pool e filtrar por segmento/vaga | Prova genérica sem situação (“tenho experiência com Excel”) |
| **Consequência de estágio** (usuário não lembra): efeito humano/operacional plausível | “Aumentei faturamento em X%” / “salvei a empresa” sem ele confirmar |

**Formato bom de prova:** o que fiz + ferramenta + **pra quê** (resultado qualitativo).  
Ex.: `Ajustei telas em React para melhorar a visualização e atender às demandas do time.`  
Ex.: `Dashboard Power BI de 4 times de vendas — progresso visível, disputa pelo prêmio e dono priorizando conversas.`  
Evitar só “melhorei telas” sem finalidade. % / R$ só com confirmação ou `resultados/`.

#### Reframe por segmento (a ideia central)

Uma mesma experiência (ex.: estágio em varejo) pode envolver **várias competências reais** — dev, dados, marketing, etc. Cada variação de currículo **destaca o que importa para aquela área**, usando só o que a pessoa de fato fez ou faria naturalmente naquele papel.

| Segmento | Ênfase na mesma experiência |
|---|---|
| **Desenvolvimento** | React, Next.js, Node.js, JavaScript, SQL, automações, Git, entregas web |
| **Dados / BI** | SQL, consultas, Python/Pandas, Power BI, modelagem, KPIs |
| **Marketing / Growth** | Google Ads, Meta Ads, segmentação, funil, KPIs, Power BI |
| **IA** | Base analítica (SQL, Python) que sustenta produto e priorização |

**Como fazer:** bullets em `dados/conteudo/banco.yml` com `segmentos` (em quais CVs aparece) e, quando o mesmo fato precisa de wording diferente, `texto_por_segmento` (reframe por área). **Projetos:** `resumo_por_segmento` + `stack_uso_por_segmento` (ver seção “Projetos no currículo”). Métricas só de `dados/resultados/`.

**Como NÃO fazer:** inventar métrica ou cargo sênior; copiar o mesmo parágrafo de resumo em todos os segmentos; tratar variação como “outro emprego”; listar projetos só com `**Stack:**` ou bullets sem explicar o papel de cada tecnologia.

### Metadados da plataforma — NUNCA no currículo

`dados/cv-base.md` e os `.md` de variação alimentam o **PDF enviado a recrutadores**. Só pode ir para o markdown do currículo o que apareceria num CV real.

**Proibido** (nem comentário HTML):

- `<!-- ... -->` com notas internas do Tuma Emprego
- **3ª pessoa** no resumo ou corpo: `Candidato a…`, `O candidato…`, `Possui experiência…`
- Instruções internas: `banco.yml`, `conteudo/`, paths, “Destaque projetos do seu banco…”
- Seção **Destaques** (ou similar) — usar **Experiência** e **Projetos**
- `**Cargo-alvo (base):**` — metadado interno; no cv-base **não** existe cargo-alvo
- Blockquotes explicativos: `> Fonte única…`, `> Versão adaptada…`, `> Estrutura ATS…`, `> derivada do cv-base`
- Linhas de segmentação: `**Stack (visão geral):**`, `**Ramificações:**`, `**Áreas:**`, `**Foco:**` (fora do parágrafo do resumo)
- Frases tipo “Este arquivo é a fonte…”, “versões por segmento enfatizam…”

**Permitido no cabeçalho do cv-base:** `# Nome` + uma linha de contato (cidade · e-mail · telefone · links).

**cv-base é esqueleto (modelo ATS):** `# Nome`, contato e **formato** de cada seção — linhas-guia mostram o layout que a IA repete nas variações. **Sem** conteúdo real (experiências, projetos, certificações preenchidos); isso vem de `banco.yml`, `formacao.yml` e slots. Inclui `## Certificações` só como referência de estrutura; nas variações o motor preenche com cursos reais.

**Variações por segmento:** pode ter `**Cargo-alvo:**` (sem “base”) com o cargo daquela versão — isso é conteúdo de CV, não metadado da plataforma.

Organização interna (segmentos, ramificações, prompts) fica em `agente/`, `dados/curriculo/*.json`, código — **nunca** no texto que vira PDF.

### Métricas e resultados

- Métricas **só** de `dados/resultados/` ou confirmadas pelo usuário.
- Escala **estagiário/júnior**. **Nunca** inventar % ou R$ sem base.

### Avaliação de vagas

- Nota 1.0–5.0. **Recomendar candidatura apenas se ≥ 4.0**.
- Relatório em `agente/relatorios/`.
- Contexto **Brasil**: portais locais, senioridade em português, JD em pt-BR; não assumir mercado internacional salvo pedido.

### Certificações e cursos no CV

- **Prioridade 1:** `dados/conteudo/banco.yml` → seção `cursos` (o que o candidato realmente fez).
- **Fallback** (só se não houver curso no segmento): `site/lib/certificacoesBr.js` — lista pt-BR (Skillshop, Alura, DIO, Udemy BR).
- Não listar certificação em inglês só porque é famosa globalmente; preferir equivalente BR ou curso do candidato.

### Projetos no currículo

Em **toda** variação de CV, a seção **Projetos** segue este formato (fonte: `banco.yml` → `resumo_por_segmento` + `stack_uso_por_segmento`; motor em `site/lib/conteudoBanco.js`):

1. **Título com resumo** — `### Nome do projeto — o que é o projeto em uma linha simples` (linguagem clara, sem jargão de implementação).
2. **Tecnologia + uso** — abaixo, **uma linha por tecnologia**: `- **Tecnologia** — para que foi usada neste projeto`.
3. **Sempre explicar o porquê** — cada tech deve ter um papel concreto no projeto; não listar stack solta nem bullets genéricos de “como foi feito” sem ligar à ferramenta.

**Proibido no PDF:** linha `**Stack:**` com lista separada por vírgula; bullets que só descrevem passos sem dizer qual tech cumpre qual função.

**Ao cadastrar ou adaptar:** preencher `resumo_por_segmento` (uma frase por segmento) e `stack_uso_por_segmento` (lista `Tecnologia — uso`). Mesmo projeto pode ter resumo e stack diferentes por segmento (dev vs dados vs marketing).

### Pacote de candidatura

- PDF em `dados/pdfs/`
- Respostas + dados do perfil
- **Descrição por vaga** (Gupy “A empresa deseja saber mais sobre você”): motor em `site/lib/descricaoVaga.js`. É um **parágrafo-resumo** (quem sou + trajetória em 1 frase + por que sou útil no desafio da JD) — **não** é o bloco Experiência do Perfil/CV. Sem nome da empresa da vaga. API `POST /api/curriculo/vaga/descricao`; botão na página **Vaga**; autofill `descricao_vaga`; Sólides `apresentacao` usa o mesmo texto.
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
| Gera descrição da vaga | JD + banco → texto “fale sobre você” (`descricaoVaga.js`) |
| Atualiza tracker | Kanban no `site/` ou `dados/candidaturas/` |
| Onboarding | Verificar cv-base.md e profile.yml |

## Leitura obrigatória

1. `docs/VISAO.md`
2. `docs/ROADMAP.md`
3. `dados/cv-base.md` e `dados/config/profile.yml`

## O que NÃO fazer

- Inventar métrica (% / R$), empresa, período ou cargo sênior sem base
- Transformar estágio em “liderança estratégica” ou entrega que não cabe no contexto
- Candidatura em massa automatizada
- BYTEA no Postgres para PDF/foto
- Secrets no código ou commits
- Texto verboso na UI ou comentários que justificam o pedido do usuário (contexto de portais, JD, etc.)
- `Co-authored-by`, trailers de ferramenta de IA ou assinatura de IA em commits
