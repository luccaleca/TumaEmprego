# Dados — seus arquivos locais

Na primeira execução do site, vários arquivos são **criados automaticamente** a partir dos `*.example` (se ainda não existirem). Você preenche com **seus** dados; nada pessoal vai para o Git.

## Primeira vez (opcional — manual)

```bash
cp dados/config/profile.example.yml dados/config/profile.yml
cp dados/config/busca.example.yml dados/config/busca.yml
cp dados/config/formacao.example.yml dados/config/formacao.yml
cp dados/config/tecnologias.example.yml dados/config/tecnologias.yml
cp dados/cv-base.example.md dados/cv-base.md
cp dados/respostas/padrao.example.yml dados/respostas/padrao.yml
cp dados/respostas/comportamental.example.yml dados/respostas/comportamental.yml
cp dados/curriculo/ativo.example.yml dados/curriculo/ativo.yml
cp dados/conteudo/banco.example.yml dados/conteudo/banco.yml
```

## O quê vai onde

| O quê | Arquivo local (gitignored) | Modelo no repositório |
|-------|---------------------------|------------------------|
| CV completo | `cv-base.md` | `cv-base.example.md` |
| Perfil / contato | `config/profile.yml` | `profile.example.yml` |
| Formação | `config/formacao.yml` | `formacao.example.yml` |
| Tecnologias | `config/tecnologias.yml` | `tecnologias.example.yml` |
| Segmentos / busca | `config/busca.yml` | `busca.example.yml` |
| Conteúdo por área | `conteudo/banco.yml` | `conteudo/banco.example.yml` |
| Candidatura (formulários) | `respostas/padrao.yml` | `padrao.example.yml` |
| Comportamental (STAR) | `respostas/comportamental.yml` | `comportamental.example.yml` |
| Vaga atual | `curriculo/ativo.yml` | `ativo.example.yml` |
| CVs por segmento | `curriculo/segmentacoes/` | — |
| PDF gerado | `pdfs/` | — |
| Foto | `fotos/` | — |
| Métricas / fatos | `resultados/*.yml` | `resultados/exemplo.yml` |
| Última busca de vagas | `busca/ultima.yml` | `busca/ultima.example.yml` |
| Tracker | `candidaturas/` | — |

## No GitHub

Só entram **templates e exemplos fictícios**. Seu `profile.yml`, `banco.yml`, e-mail no CV, etc. ficam só na sua máquina.
