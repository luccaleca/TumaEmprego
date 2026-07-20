/**
 * CLI via API local (site precisa estar rodando em :3737).
 * Uso: node scripts/buscar-vagas.mjs
 */
const base = process.env.TUMA_URL || "http://127.0.0.1:3737";

const res = await fetch(`${base}/api/busca/vagas`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ portais: ["gupy", "solides"], maxPorConsulta: 8 }),
});

const data = await res.json();
if (!res.ok) {
  console.error(data.error || data);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      gerado_em: data.gerado_em,
      total: data.total_coletadas,
      elegiveis: data.total_elegiveis,
      nota_minima: data.nota_minima,
      consultas: data.consultas,
      top: (data.vagas ?? []).slice(0, 10).map((v) => ({
        nota: v.nota,
        portal: v.portal,
        titulo: v.titulo,
        empresa: v.empresa,
      })),
      erros: data.erros,
    },
    null,
    2,
  ),
);
