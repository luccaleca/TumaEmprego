# Adaptação de CV — modelo de prompt (local)

Leia `agente/AGENTS.md`.

Este arquivo é **gerado localmente** pelo motor com os dados do candidato. No repositório fica só este modelo; sua cópia com dados reais não vai para o Git.

## Regras

- Não inventar experiência, ferramentas ou números.
- Consultar perfil, tecnologias, conteúdo, formação e resultados em `dados/`.
- Manter markdown compatível com `cv-base.md` (mesmas seções).
- Escrever o resultado completo em markdown na resposta (não em arquivo).

## Fonte do candidato (preencher a partir dos YAML locais)

### Perfil
- Nome: (profile.yml)
- Segmentos ativos: (busca.yml)

### Tecnologias
- (tecnologias.yml)

### Formação
- (formacao.yml)

### Experiências e projetos
- (conteudo/banco.yml)

### Resultados / métricas
- (resultados/*.yml)

### Arquivos de referência
- dados/cv-base.md
- dados/conteudo/banco.yml
- dados/config/tecnologias.yml
- dados/config/formacao.yml
- dados/config/profile.yml

## Preferências e alvos

Preenchidos automaticamente a partir de `busca.yml` e do catálogo de vagas.
