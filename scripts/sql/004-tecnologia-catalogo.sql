-- Tuma Emprego — catálogo de tecnologias por vertente
-- População: npm run db:seed (site/prisma/seed.js)

BEGIN;

CREATE TABLE IF NOT EXISTS tecnologia_vertente (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  ordem      INT NOT NULL DEFAULT 0,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tecnologia_item (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertente_id   UUID NOT NULL REFERENCES tecnologia_vertente(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  nome          TEXT NOT NULL,
  categoria     TEXT NOT NULL DEFAULT '',
  ordem         INT NOT NULL DEFAULT 0,
  segmentos_cv  TEXT[] NOT NULL DEFAULT '{}',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vertente_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_tecnologia_item_vertente ON tecnologia_item(vertente_id);

COMMIT;
