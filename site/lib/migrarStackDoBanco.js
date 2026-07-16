import { getConteudoBanco, getTecnologias, saveConteudoBanco, saveTecnologias } from "./dados.js";
import { getTecnologiaCatalogo, resolverItensAtivos } from "./tecnologiaCatalogo.js";
import { migrarFerramentasBancoParaStack } from "./tecnologiasStack.js";
import { normalizarTecnologias } from "./tecnologiasCampos.js";

/** Migra banco.ferramentas → tecnologias.extras e remove ferramentas do banco. */
export async function migrarFerramentasBancoSeNecessario() {
  const banco = getConteudoBanco();
  const ferramentas = banco?.ferramentas ?? [];
  if (!ferramentas.length) return { migrado: false };

  let tecnologias = getTecnologias();
  const catalogo = await getTecnologiaCatalogo();

  if (!tecnologias.itens?.length && tecnologias.ativas?.length) {
    tecnologias = {
      ...tecnologias,
      itens: resolverItensAtivos(catalogo, tecnologias.ativas),
    };
  }

  const { tecnologias: atualizado, mudou } = migrarFerramentasBancoParaStack(tecnologias, ferramentas);
  if (mudou) {
    saveTecnologias(atualizado);
  }

  const { ferramentas: _removido, ...bancoSemFerramentas } = banco;
  saveConteudoBanco(bancoSemFerramentas);

  return { migrado: true, tecnologias: normalizarTecnologias(getTecnologias()) };
}
