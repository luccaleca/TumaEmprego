import { Suspense } from "react";
import VagaWorkspace from "@/components/vaga/VagaWorkspace";

export const metadata = {
  title: "Tuma Emprego — Vaga",
};

export default function VagaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">…</p>}>
      <VagaWorkspace />
    </Suspense>
  );
}
