# Tuma Emprego

Hub local de candidaturas a emprego (Brasil). O repositório traz **código e templates vazios** — cada pessoa usa com **os próprios dados**, segmentos e variações de currículo.

## Para quem vai usar

Este projeto **não vem pronto com seu CV**. Quem clona precisa montar o ambiente na própria máquina e preencher `dados/` com informações reais. Nada disso vai para o GitHub (fica no `.gitignore`).

### 1. Seus dados pessoais

Na primeira vez que o site roda, os arquivos `*.example` viram cópias locais. Preencha com **suas** informações:

| O quê | Arquivo |
|-------|---------|
| Nome, contato, links | `dados/config/profile.yml` |
| Formação acadêmica | `dados/config/formacao.yml` |
| Tecnologias e nível | `dados/config/tecnologias.yml` |
| Respostas de formulário (salário, idiomas, etc.) | `dados/respostas/padrao.yml` |
| Perguntas comportamentais (STAR) | `dados/respostas/comportamental.yml` |
| Perfil em portais (ex.: Sólides) | copie `dados/portais/solides.example.yml` → `solides.yml` |

Detalhes de cada arquivo: **`dados/README.md`**.

### 2. Seu currículo base

`dados/cv-base.md` é a **estrutura ATS** (Resumo, Competências, Experiência, Projetos, Formação, Certificações). Use como esqueleto; o motor monta as variações a partir do **banco de conteúdo**, não inventa fatos.

### 3. Segmentos e cargos que você busca

Em `dados/config/busca.yml` você define:

- **`segmentos_ativos`** — áreas do seu interesse (ex.: dados/BI, desenvolvimento, marketing)
- **`titulos_ativos`** — cargos alvo por segmento e senioridade
- **`senioridades`** e **`modalidades_trabalho`** — estágio, remoto, etc.

Isso alimenta a página **Segmentos** no site e define quais **slots de currículo** ficam ativos.

### 4. Variações de currículo (banco de conteúdo)

`dados/conteudo/banco.yml` guarda experiências, projetos, cursos e competências **por segmento**. O motor gera uma versão do CV para cada área e adaptações por vaga — sempre com **seus** bullets, reordenados para a descrição da vaga.

Variações geradas ficam em `dados/curriculo/segmentacoes/` (local). Você revisa no site antes de enviar.

### 5. Assistente de IA (opcional — você escolhe)

O Tuma Emprego **não exige** um produto de IA específico.

| Camada | Precisa de IA? |
|--------|----------------|
| Site, motor de CV, PDF, extensão | **Não** — roda local com seus YAML/markdown |
| Ajudar a **desenvolver** ou **estender** o projeto | **Sim, se quiser** — use o assistente de IA do **seu** editor ou terminal |
| Avaliar vagas / relatórios avançados | Opcional — regras em `agente/AGENTS.md` |

Se for usar IA em algum momento, abra **`agente/AGENTS.md`** no seu assistente: lá estão as regras de tom do CV, o que não inventar e como tratar `dados/`. Funciona com qualquer ferramenta que leia arquivos do projeto (não está amarrado a um vendor).

**Importante:** a IA deve consultar **só** o que está em `dados/` — nunca commitar seus arquivos pessoais (regra também no `AGENTS.md`).

---

## Mapa das pastas

```
TumaEmprego/
├── dados/       ← seus arquivos (CV, respostas, PDFs) — não vão pro Git
├── site/        ← Next.js: telas + API + banco (porta 3737)
├── extensao/    ← Chrome: detectar vaga e gerar CV
├── agente/      ← regras para assistente de IA + relatórios de vagas
├── docs/        ← visão e roadmap
└── scripts/     ← PDF e utilitários CLI
```

## Onde me acho?

| Quero | Pasta / arquivo |
|-------|------------------|
| Editar CV base | `dados/cv-base.md` |
| Experiências e projetos por área | `dados/conteudo/banco.yml` |
| Segmentos e cargos alvo | `dados/config/busca.yml` |
| Perfil / contato | `dados/config/profile.yml` |
| Adaptar para uma vaga | site → aba **Vaga** ou extensão Chrome |
| Variações já geradas | `dados/curriculo/segmentacoes/` |
| Regras para IA | `agente/AGENTS.md` |
| Plano do produto | `docs/VISAO.md` |

## Rodar o site (da raiz)

```bash
# primeira vez — instala dependências do site
npm run install:site

# subir em http://localhost:3737
npm run dev
```

Também funciona de dentro de `site/` com `npm run dev`.

## Banco (Postgres + Prisma)

O schema Prisma fica em **`site/prisma/`**. Rode os comandos **da raiz** do repositório:

```bash
npm run db:up        # sobe Postgres (Docker)
npm run db:setup     # cria usuário/banco (Windows + psql local)
npm run db:generate  # gera o client Prisma (site/)
npm run db:push      # aplica o schema no banco
npm run db:seed      # popula catálogo de vagas e tecnologias
```

Atalho após o banco estar no ar: `npm run db:prepare` (generate + push + seed).

## Ordem sugerida (primeira configuração)

1. **`npm run dev`** — site sobe e cria os arquivos locais a partir dos `*.example`
2. **`dados/config/`** — perfil, formação, tecnologias, busca (segmentos e cargos)
3. **`dados/conteudo/banco.yml`** — experiências, projetos e cursos por segmento
4. **`dados/cv-base.md`** — cabeçalho e estrutura do CV
5. **Site → Segmentos** — conferir slots de currículo por área
6. **Site → Vaga** ou **extensão** — gerar adaptação para uma vaga específica
7. **`extensao/`** — carregar no Chrome (modo desenvolvedor) apontando para `localhost:3737`

## Status

Fase 1 em andamento — site em `http://localhost:3737` com perfil, conteúdo, segmentos, currículo por vaga, pacote Sólides e extensão Chrome.
