import CurriculoWorkspace from "@/components/curriculo/CurriculoWorkspace";
import { parseCvBase } from "@/lib/cv";
import { getCvBase, getCurriculoArquivo } from "@/lib/dados";

export const metadata = {
  title: "Tuma Emprego — Currículo",
};

export default function CurriculoPage() {
  const content = getCvBase();
  const sections = parseCvBase(content);
  const arquivo = getCurriculoArquivo();

  return (
    <main className="w-full">
      <CurriculoWorkspace
        initialContent={content}
        initialSections={sections}
        initialArquivo={arquivo}
      />
    </main>
  );
}
