"use client";

import TrajetoriaPerfil from "@/components/conteudo/TrajetoriaPerfil";
import CandidaturaEditor from "@/components/candidatura/CandidaturaEditor";
import FormacaoEditor from "@/components/formacao/FormacaoEditor";
import ProfileEditor from "@/components/profile/ProfileEditor";
import TecnologiasEditor from "@/components/tecnologias/TecnologiasEditor";

const ANCORAS = [
  { id: "sec-contato", label: "Contato" },
  { id: "sec-formacao", label: "Formação" },
  { id: "sec-candidatura", label: "Candidatura" },
  { id: "sec-tecnologias", label: "Tecnologias" },
  { id: "sec-experiencia", label: "Experiência" },
  { id: "sec-projetos", label: "Projetos" },
  { id: "sec-cursos", label: "Cursos" },
];

function PerfilIndice() {
  return (
    <nav
      aria-label="Índice do perfil"
      className="mb-5 flex flex-wrap gap-x-2 gap-y-1 border-b border-zinc-100 pb-3"
    >
      {ANCORAS.map((item, i) => (
        <span key={item.id} className="inline-flex items-center gap-2">
          {i > 0 ? <span className="text-zinc-300" aria-hidden>·</span> : null}
          <a
            href={`#${item.id}`}
            className="text-[11px] font-medium text-zinc-500 hover:text-emerald-700"
          >
            {item.label}
          </a>
        </span>
      ))}
    </nav>
  );
}

export default function PerfilWorkspace({
  profile,
  formacao,
  candidatura,
  hasPhoto,
  catalogo,
  tecnologias,
  todosSegmentos,
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-zinc-900">Perfil</h1>

      <PerfilIndice />

      <div className="space-y-4">
        <div id="sec-contato" className="scroll-mt-20">
          <ProfileEditor initial={profile} hasPhoto={hasPhoto} />
        </div>

        <div id="sec-formacao" className="scroll-mt-20">
          <FormacaoEditor initial={formacao} />
        </div>

        <div id="sec-candidatura" className="scroll-mt-20">
          <CandidaturaEditor initial={candidatura} />
        </div>

        <div id="sec-tecnologias" className="scroll-mt-20">
          <TecnologiasEditor
            initial={{ catalogo, tecnologias }}
            todosSegmentos={todosSegmentos}
          />
        </div>

        <TrajetoriaPerfil todosSegmentos={todosSegmentos} />
      </div>
    </main>
  );
}
