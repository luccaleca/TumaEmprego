import PerfilWorkspace from "@/components/profile/PerfilWorkspace";
import { migrarFerramentasBancoSeNecessario } from "@/lib/migrarStackDoBanco";
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
import { listarTodosSegmentosCatalogo } from "@/lib/segmentosAtivos";
import { getVagaCatalogo } from "@/lib/vagaCatalogo";

export const metadata = {
  title: "Tuma Emprego — Perfil",
};

export default async function PerfilPage() {
  await migrarFerramentasBancoSeNecessario();

  const profile = getProfile();
  const formacao = getFormacao();
  const candidatura = getRespostasPadrao();
  const hasPhoto = Boolean(getProfilePhotoPath());

  const catalogoVagas = await getVagaCatalogo();
  const todosSegmentos = listarTodosSegmentosCatalogo(catalogoVagas);

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
    <PerfilWorkspace
      profile={profile}
      formacao={formacao}
      candidatura={candidatura}
      hasPhoto={hasPhoto}
      catalogo={catalogo}
      tecnologias={tecnologias}
      todosSegmentos={todosSegmentos}
    />
  );
}
