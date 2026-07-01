import BuscaEditor from "@/components/busca/BuscaEditor";
import { getBusca } from "@/lib/dados";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";

export const metadata = {
  title: "Tuma Emprego — Segmentos",
};

export default async function SegmentosPage() {
  const [busca, catalogo] = await Promise.all([
    Promise.resolve(getBusca()),
    getVagaCatalogo(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-5 text-xl font-semibold tracking-tight text-zinc-900">
        Segmentos
      </h1>

      <BuscaEditor initial={busca} catalogo={catalogo} />
    </main>
  );
}
