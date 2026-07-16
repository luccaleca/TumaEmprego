import AcompanhamentoBoard from "@/components/acompanhamento/AcompanhamentoBoard";
import { listarCandidaturas } from "@/lib/candidaturas";

export const metadata = {
  title: "Tuma Emprego — Status",
};

export default function AcompanhamentoPage() {
  let initial = [];
  try {
    initial = listarCandidaturas();
  } catch {
    initial = [];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-zinc-900">
        Status
      </h1>
      <AcompanhamentoBoard initial={initial} />
    </main>
  );
}
