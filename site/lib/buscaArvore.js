export function novoNo(nome = "Nova área") {
  return {
    id: `no-${Date.now().toString(36)}`,
    nome,
    ativo: false,
    filhos: [],
  };
}

export function mapArvore(arvore, fn, pai = null) {
  if (!Array.isArray(arvore)) return [];

  return arvore.map((no) => {
    const atualizado = fn(no, pai);
    const filhos = mapArvore(atualizado.filhos ?? [], fn, atualizado);
    return { ...atualizado, filhos };
  });
}

export function updateNo(arvore, id, patch) {
  return mapArvore(arvore, (no) => (no.id === id ? { ...no, ...patch } : no));
}

export function addFilho(arvore, paiId, filho) {
  return mapArvore(arvore, (no) => {
    if (no.id !== paiId) return no;
    return {
      ...no,
      filhos: [...(no.filhos ?? []), filho],
    };
  });
}

export function removeNo(arvore, id) {
  return arvore
    .filter((no) => no.id !== id)
    .map((no) => ({
      ...no,
      filhos: removeNo(no.filhos ?? [], id),
    }));
}

/** Caminhos das folhas ativas (mais específicas) ou ramos pais sem filho ativo */
export function listarFolhasAtivas(arvore, caminho = []) {
  const lista = [];

  for (const no of arvore ?? []) {
    const atual = [...caminho, no.nome];
    const filhos = no.filhos ?? [];

    if (!filhos.length) {
      if (no.ativo) lista.push(atual.join(" → "));
      continue;
    }

    const folhas = listarFolhasAtivas(filhos, atual);
    if (folhas.length) {
      lista.push(...folhas);
    } else if (no.ativo) {
      lista.push(atual.join(" → "));
    }
  }

  return lista;
}

export function contarAtivos(arvore) {
  let total = 0;

  for (const no of arvore ?? []) {
    if (no.ativo) total += 1;
    total += contarAtivos(no.filhos);
  }

  return total;
}
