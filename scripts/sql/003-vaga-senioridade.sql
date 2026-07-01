-- Tuma Emprego — senioridade separada do título de vaga
-- Rode após 002-vaga-catalogo.sql; repopule com: npm run db:seed

BEGIN;

CREATE TABLE IF NOT EXISTS vaga_senioridade (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  sinonimos  TEXT[] NOT NULL DEFAULT '{}',
  ordem      INT NOT NULL DEFAULT 0,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- Exemplo de busca combinada:
-- SELECT s.nome AS senioridade, t.titulo, n.nome AS nicho, a.nome AS area
-- FROM vaga_senioridade s
-- CROSS JOIN vaga_titulo t
-- JOIN vaga_nicho n ON n.id = t.nicho_id
-- JOIN vaga_area a ON a.id = n.area_id
-- WHERE s.slug = 'estagio' AND t.titulo = 'Analista de Dados';
