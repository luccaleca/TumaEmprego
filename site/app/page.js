import CandidaturaEditor from "@/components/candidatura/CandidaturaEditor";
import FormacaoEditor from "@/components/formacao/FormacaoEditor";
import ProfileEditor from "@/components/profile/ProfileEditor";
import TecnologiasEditor from "@/components/tecnologias/TecnologiasEditor";
import {
  getFormacao,
  getProfile,
  getProfilePhotoPath,
  getRespostasPadrao,
  getTecnologias,
  saveTecnologias,
} from "@/lib/dados";
import {
  getTecnologiaCatalogo,
  resolverItensAtivos,
} from "@/lib/tecnologiaCatalogo";

export default async function PerfilPage() {
  const profile = getProfile();
  const formacao = getFormacao();
  const candidatura = getRespostasPadrao();
  const hasPhoto = Boolean(getProfilePhotoPath());

  let catalogo = [];
  let tecnologias = getTecnologias();

  try {
    catalogo = await getTecnologiaCatalogo();
    if (tecnologias.ativas?.length && !tecnologias.itens?.length) {
      const itens = resolverItensAtivos(catalogo, tecnologias.ativas);
      saveTecnologias({ ...tecnologias, itens });
      tecnologias = getTecnologias();
    }
  } catch {
    catalogo = [];
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-5 text-xl font-semibold tracking-tight text-zinc-900">
        Perfil
      </h1>

      <div className="space-y-4">
        <ProfileEditor initial={profile} hasPhoto={hasPhoto} />
        <FormacaoEditor initial={formacao} />
        <CandidaturaEditor initial={candidatura} />
        <TecnologiasEditor initial={{ catalogo, tecnologias }} />
      </div>
    </main>
  );
}
