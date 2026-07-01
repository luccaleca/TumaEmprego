-- Tuma Emprego — catálogo de títulos de vagas de tecnologia
-- Espelho do schema Prisma (vaga_area → vaga_nicho → vaga_titulo)
-- População: npm run db:seed (site/prisma/seed.js)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vaga_area (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  titulos_raiz  TEXT[] NOT NULL DEFAULT '{}',
  ordem         INT NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vaga_nicho (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id  UUID NOT NULL REFERENCES vaga_area(id) ON DELETE CASCADE,
  slug     TEXT NOT NULL,
  nome     TEXT NOT NULL,
  ordem    INT NOT NULL DEFAULT 0,
  UNIQUE (area_id, slug)
);

CREATE TABLE IF NOT EXISTS vaga_titulo (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id   UUID NOT NULL REFERENCES vaga_nicho(id) ON DELETE CASCADE,
  titulo     TEXT NOT NULL,
  sinonimos  TEXT[] NOT NULL DEFAULT '{}',
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nicho_id, titulo)
);

CREATE TABLE IF NOT EXISTS vaga_palavra_chave (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id  UUID NOT NULL REFERENCES vaga_area(id) ON DELETE CASCADE,
  termo    TEXT NOT NULL,
  UNIQUE (area_id, termo)
);

CREATE INDEX IF NOT EXISTS idx_vaga_nicho_area ON vaga_nicho(area_id);
CREATE INDEX IF NOT EXISTS idx_vaga_titulo_nicho ON vaga_titulo(nicho_id);
CREATE INDEX IF NOT EXISTS idx_vaga_palavra_chave_area ON vaga_palavra_chave(area_id);

CREATE TABLE IF NOT EXISTS vaga_senioridade (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  sinonimos  TEXT[] NOT NULL DEFAULT '{}',
  ordem      INT NOT NULL DEFAULT 0,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- Listagem com senioridade (combinação na busca):
-- SELECT s.nome AS senioridade, t.titulo, n.nome AS nicho, a.nome AS area
-- FROM vaga_senioridade s
-- CROSS JOIN vaga_titulo t
-- JOIN vaga_nicho n ON n.id = t.nicho_id
-- JOIN vaga_area a ON a.id = n.area_id
-- WHERE s.slug = 'estagio' AND t.titulo ILIKE '%Analista de Dados%'
-- ORDER BY a.ordem, n.ordem, t.titulo;
