-- Tuma Emprego — perfil do usuário
-- Padrão: 1 perfil (pai) → 1 linha em cada seção (filha)
-- Rode no DBeaver conectado ao banco tuma_emprego

BEGIN;

-- ============================================================
-- PAI — identificação, documentos, diversidade, preferências de busca
-- ============================================================
CREATE TABLE perfil (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  nome                    TEXT NOT NULL DEFAULT '',
  nome_social             TEXT NOT NULL DEFAULT '',
  data_nascimento         TEXT NOT NULL DEFAULT '',  -- DD/MM/AAAA (igual ao YAML)
  cpf                     TEXT NOT NULL DEFAULT '',
  rg                      TEXT NOT NULL DEFAULT '',
  rg_orgao                TEXT NOT NULL DEFAULT '',
  nacionalidade           TEXT NOT NULL DEFAULT 'Brasileira',
  sexo                    TEXT NOT NULL DEFAULT '',
  estado_civil            TEXT NOT NULL DEFAULT '',
  naturalidade_cidade     TEXT NOT NULL DEFAULT '',
  naturalidade_estado     TEXT NOT NULL DEFAULT '',

  -- Documentos
  cnh                     TEXT NOT NULL DEFAULT '',
  cnh_categoria           TEXT NOT NULL DEFAULT '',

  -- Diversidade
  pcd                     TEXT NOT NULL DEFAULT 'Não',
  cor_ou_raca             TEXT NOT NULL DEFAULT '',

  -- Busca (estava no profile.yml)
  nivel                   TEXT NOT NULL DEFAULT 'estagio',
  areas_foco              TEXT[] NOT NULL DEFAULT '{}',
  modo_busca              TEXT NOT NULL DEFAULT 'focado',
  remoto                  TEXT NOT NULL DEFAULT 'sim',
  modo_cv                 TEXT NOT NULL DEFAULT 'enfase_por_vaga',
  nota_minima_candidatar  NUMERIC(3, 1) NOT NULL DEFAULT 4.0,

  -- Arquivo local (não guardar foto no banco)
  foto_path               TEXT,

  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FILHAS — uma linha por perfil (UNIQUE em perfil_id)
-- ============================================================

-- Seção Contato (comunicação + endereço + links)
CREATE TABLE contato (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id       UUID NOT NULL UNIQUE REFERENCES perfil(id) ON DELETE CASCADE,

  email           TEXT NOT NULL DEFAULT '',
  telefone        TEXT NOT NULL DEFAULT '',
  whatsapp        TEXT NOT NULL DEFAULT '',
  cep             TEXT NOT NULL DEFAULT '',
  logradouro      TEXT NOT NULL DEFAULT '',
  numero          TEXT NOT NULL DEFAULT '',
  complemento     TEXT NOT NULL DEFAULT '',
  bairro          TEXT NOT NULL DEFAULT '',
  cidade          TEXT NOT NULL DEFAULT '',
  estado          TEXT NOT NULL DEFAULT '',
  pais            TEXT NOT NULL DEFAULT 'Brasil',
  linkedin        TEXT NOT NULL DEFAULT '',
  github          TEXT NOT NULL DEFAULT '',
  portfolio       TEXT NOT NULL DEFAULT '',

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seção Formação
CREATE TABLE formacao (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id               UUID NOT NULL UNIQUE REFERENCES perfil(id) ON DELETE CASCADE,

  instituicao             TEXT NOT NULL DEFAULT '',
  curso                   TEXT NOT NULL DEFAULT '',
  grau                    TEXT NOT NULL DEFAULT '',
  semestre                TEXT NOT NULL DEFAULT '',
  periodo_inicio          TEXT NOT NULL DEFAULT '',
  previsao_formatura      TEXT NOT NULL DEFAULT '',
  cidade_campus           TEXT NOT NULL DEFAULT '',
  estado_campus           TEXT NOT NULL DEFAULT '',
  status                  TEXT NOT NULL DEFAULT 'Cursando',
  turno                   TEXT NOT NULL DEFAULT '',
  horario_disponivel      TEXT NOT NULL DEFAULT '',
  carga_horaria_semanal   TEXT NOT NULL DEFAULT '',
  disponibilidade_inicio  TEXT NOT NULL DEFAULT '',

  criado_em               TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seção Candidatura (respostas padrão de formulário)
CREATE TABLE candidatura (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id             UUID NOT NULL UNIQUE REFERENCES perfil(id) ON DELETE CASCADE,

  disponibilidade       TEXT NOT NULL DEFAULT '',
  pretensao_salarial    TEXT NOT NULL DEFAULT '',
  ingles                TEXT NOT NULL DEFAULT '',
  espanhol              TEXT NOT NULL DEFAULT '',
  remoto                TEXT NOT NULL DEFAULT '',
  como_conheceu         TEXT NOT NULL DEFAULT '',
  trabalha_atualmente   TEXT NOT NULL DEFAULT '',
  indicacao_parente     TEXT NOT NULL DEFAULT '',
  aceita_viagem         TEXT NOT NULL DEFAULT '',
  observacao_padrao     TEXT NOT NULL DEFAULT '',

  criado_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seção Tecnologias (nível por ferramenta, igual ao YAML)
CREATE TABLE tecnologias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id       UUID NOT NULL UNIQUE REFERENCES perfil(id) ON DELETE CASCADE,

  excel           TEXT NOT NULL DEFAULT '',
  sql             TEXT NOT NULL DEFAULT '',
  power_bi        TEXT NOT NULL DEFAULT '',
  python          TEXT NOT NULL DEFAULT '',
  javascript      TEXT NOT NULL DEFAULT '',
  git             TEXT NOT NULL DEFAULT '',
  postgresql      TEXT NOT NULL DEFAULT '',
  outras          TEXT NOT NULL DEFAULT '',

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices nas FKs (consultas por perfil_id)
CREATE INDEX contato_perfil_id_idx ON contato (perfil_id);
CREATE INDEX formacao_perfil_id_idx ON formacao (perfil_id);
CREATE INDEX candidatura_perfil_id_idx ON candidatura (perfil_id);
CREATE INDEX tecnologias_perfil_id_idx ON tecnologias (perfil_id);

COMMIT;

-- ============================================================
-- Exemplo: criar 1 usuário com todas as seções
-- ============================================================
/*
WITH novo AS (
  INSERT INTO perfil (nome) VALUES ('Nome do Candidato') RETURNING id
)
INSERT INTO contato (perfil_id, email)
SELECT id, 'email@exemplo.com' FROM novo;

-- Ver tudo junto (JOIN):
SELECT
  p.*,
  c.email,
  f.curso,
  ca.disponibilidade,
  t.python
FROM perfil p
LEFT JOIN contato c ON c.perfil_id = p.id
LEFT JOIN formacao f ON f.perfil_id = p.id
LEFT JOIN candidatura ca ON ca.perfil_id = p.id
LEFT JOIN tecnologias t ON t.perfil_id = p.id;
*/
