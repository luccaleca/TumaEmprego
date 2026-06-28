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
} from "@/lib/dados";

export default function PerfilPage() {
  const profile = getProfile();
  const formacao = getFormacao();
  const candidatura = getRespostasPadrao();
  const tecnologias = getTecnologias();
  const hasPhoto = Boolean(getProfilePhotoPath());

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-5 text-xl font-semibold tracking-tight text-zinc-900">
        Perfil
      </h1>

      <div className="space-y-4">
        <ProfileEditor initial={profile} hasPhoto={hasPhoto} />
        <FormacaoEditor initial={formacao} />
        <CandidaturaEditor initial={candidatura} />
        <TecnologiasEditor initial={tecnologias} />
      </div>
    </main>
  );
}
