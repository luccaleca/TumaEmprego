const AREA_LABELS = {
  analise_dados: "Análise de dados",
  BI: "BI",
  SQL: "SQL",
  "Power BI": "Power BI",
  TI: "TI",
  growth_marketing: "Growth / Marketing",
};

const MODO_BUSCA_LABELS = {
  focado: "Focado",
  amplo: "Amplo",
  hibrido: "Híbrido",
};

const NIVEL_LABELS = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
};

const MODO_CV_LABELS = {
  enfase_por_vaga: "Ênfase por vaga",
  dev: "Desenvolvimento",
  bi: "BI",
  dados: "Dados",
};

export function labelArea(key) {
  return AREA_LABELS[key] ?? key.replace(/_/g, " ");
}

export function labelModoBusca(key) {
  return MODO_BUSCA_LABELS[key] ?? key;
}

export function labelNivel(key) {
  return NIVEL_LABELS[key] ?? key;
}

export function labelModoCv(key) {
  return MODO_CV_LABELS[key] ?? key?.replace(/_/g, " ");
}

export function maskCpf(cpf) {
  const digits = String(cpf ?? "").replace(/\D/g, "");
  if (digits.length !== 11) return "—";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

export function maskCep(cep) {
  const digits = String(cep ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatCidade(profile) {
  const { cidade, estado } = profile ?? {};
  if (!cidade && !estado) return null;
  if (cidade && estado && !String(cidade).includes(estado)) {
    return `${cidade}, ${estado}`;
  }
  return cidade || estado;
}

export function formatAddress(profile) {
  const parts = [
    profile.logradouro,
    profile.numero && `nº ${profile.numero}`,
    profile.complemento,
    profile.bairro,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

export function formatNaturalidade(profile) {
  const { naturalidade_cidade, naturalidade_estado } = profile ?? {};
  if (!naturalidade_cidade && !naturalidade_estado) return null;
  if (naturalidade_cidade && naturalidade_estado) {
    return `${naturalidade_cidade}, ${naturalidade_estado}`;
  }
  return naturalidade_cidade || naturalidade_estado;
}

export function formatCnh(profile) {
  const { cnh, cnh_categoria } = profile ?? {};
  if (!cnh) return null;
  if (cnh === "Não") return "Não";
  if (cnh === "Sim" && cnh_categoria) return `Sim — ${cnh_categoria}`;
  return cnh;
}

export function calcIdade(dataNascimento) {
  const match = String(dataNascimento ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const birth = new Date(year, month - 1, day);

  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 && age < 120 ? age : null;
}

export function displayIdade(dataNascimento) {
  const age = calcIdade(dataNascimento);
  return age == null ? null : `${age} anos`;
}

export function yesNo(value) {
  if (value === true || value === "sim" || value === "Sim") return "Sim";
  if (value === false || value === "nao" || value === "não" || value === "Não")
    return "Não";
  return value || "—";
}

export function initials(nome) {
  return String(nome ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}
