"use client";

import { useRef, useState } from "react";
import {
  FormField,
  inputClass,
  selectClass,
} from "@/components/profile/FormField";
import { FormSubsection } from "@/components/profile/FormSubsection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DataLink, DataList, DataRow } from "@/components/profile/ViewData";
import {
  OPCOES_CNH,
  OPCOES_COR_RACA,
  OPCOES_ESTADO_CIVIL,
  OPCOES_SEXO,
} from "@/lib/profileOpcoes";
import {
  displayIdade,
  formatCnh,
  formatNaturalidade,
  maskCep,
  maskCpf,
} from "@/lib/format";

function SelectField({ label, value, onChange, options, hint, full = false }) {
  return (
    <FormField label={label} hint={hint} full={full}>
      <select
        className={selectClass}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option || "__empty"} value={option}>
            {option || "Selecione"}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export default function ProfileEditor({ initial, hasPhoto = false }) {
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotRef = useRef(null);

  function update(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    snapshotRef.current = { ...profile };
    setEditing(true);
    setMessage("");
  }

  function cancelEdit() {
    if (snapshotRef.current) setProfile(snapshotRef.current);
    snapshotRef.current = null;
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error);

      setProfile(data.profile);
      snapshotRef.current = null;
      setEditing(false);
      setMessage("Alterações salvas.");
    } catch (err) {
      setMessage(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const cepFmt = maskCep(profile.cep) || profile.cep;

  return (
    <>
      {message ? (
        <p
          className={`mb-2 text-right text-xs font-medium ${message.includes("salvas") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <ProfileSection
        title="Contato"
        isEditing={editing}
        saving={saving}
        onEdit={startEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        view={
          <div className="space-y-5">
            <FormSubsection title="Identificação">
              <DataList>
                <DataRow label="Nome completo">{profile.nome}</DataRow>
                <DataRow label="Nome social">{profile.nome_social}</DataRow>
                <DataRow label="Data de nascimento">
                  {profile.data_nascimento}
                </DataRow>
                <DataRow label="Idade">
                  {displayIdade(profile.data_nascimento)}
                </DataRow>
                <DataRow label="CPF">{maskCpf(profile.cpf)}</DataRow>
                <DataRow label="RG">{profile.rg}</DataRow>
                <DataRow label="Órgão emissor">{profile.rg_orgao}</DataRow>
                <DataRow label="Nacionalidade">{profile.nacionalidade}</DataRow>
                <DataRow label="Sexo">{profile.sexo}</DataRow>
                <DataRow label="Estado civil">{profile.estado_civil}</DataRow>
                <DataRow label="Naturalidade">
                  {formatNaturalidade(profile)}
                </DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Documentos">
              <DataList>
                <DataRow label="CNH">{formatCnh(profile)}</DataRow>
                <DataRow label="Categoria CNH">{profile.cnh_categoria}</DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Comunicação">
              <DataList>
                <DataRow label="E-mail">
                  <DataLink
                    href={profile.email && `mailto:${profile.email}`}
                    label={profile.email}
                    external={false}
                  />
                </DataRow>
                <DataRow label="Celular">{profile.telefone}</DataRow>
                <DataRow label="WhatsApp">{profile.whatsapp}</DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Endereço">
              <DataList>
                <DataRow label="CEP">{cepFmt}</DataRow>
                <DataRow label="Logradouro">{profile.logradouro}</DataRow>
                <DataRow label="Número">{profile.numero}</DataRow>
                <DataRow label="Complemento">{profile.complemento}</DataRow>
                <DataRow label="Bairro">{profile.bairro}</DataRow>
                <DataRow label="Cidade">{profile.cidade}</DataRow>
                <DataRow label="Estado (UF)">{profile.estado}</DataRow>
                <DataRow label="País">{profile.pais}</DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Links">
              <DataList>
                <DataRow label="LinkedIn">
                  <DataLink href={profile.linkedin} label={profile.linkedin} />
                </DataRow>
                <DataRow label="GitHub">
                  <DataLink href={profile.github} label={profile.github} />
                </DataRow>
                <DataRow label="Portfólio">
                  <DataLink href={profile.portfolio} label={profile.portfolio} />
                </DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Diversidade">
              <DataList>
                <DataRow label="PCD">{profile.pcd}</DataRow>
                <DataRow label="Cor ou raça">{profile.cor_ou_raca}</DataRow>
              </DataList>
            </FormSubsection>

            <FormSubsection title="Foto">
              {hasPhoto ? (
                <img
                  src="/api/photo"
                  alt="Foto de perfil"
                  className="h-28 w-28 rounded-lg border border-zinc-200 object-cover"
                />
              ) : (
                <DataList>
                  <DataRow label="Arquivo" />
                </DataList>
              )}
            </FormSubsection>
          </div>
        }
        edit={
          <div className="space-y-5">
            <FormSubsection title="Identificação">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="Nome completo" full>
                  <input
                    className={inputClass}
                    value={profile.nome ?? ""}
                    onChange={(e) => update("nome", e.target.value)}
                  />
                </FormField>
                <FormField label="Nome social">
                  <input
                    className={inputClass}
                    value={profile.nome_social ?? ""}
                    onChange={(e) => update("nome_social", e.target.value)}
                  />
                </FormField>
                <FormField label="Data de nascimento" hint="DD/MM/AAAA">
                  <input
                    className={inputClass}
                    placeholder="01/01/2000"
                    value={profile.data_nascimento ?? ""}
                    onChange={(e) => update("data_nascimento", e.target.value)}
                  />
                </FormField>
                <FormField label="Idade" hint="Calculada pela data de nascimento">
                  <input
                    className={`${inputClass} bg-zinc-50 text-zinc-500`}
                    readOnly
                    value={displayIdade(profile.data_nascimento) ?? ""}
                    tabIndex={-1}
                  />
                </FormField>
                <FormField label="CPF">
                  <input
                    className={inputClass}
                    value={profile.cpf ?? ""}
                    onChange={(e) => update("cpf", e.target.value)}
                  />
                </FormField>
                <FormField label="RG">
                  <input
                    className={inputClass}
                    value={profile.rg ?? ""}
                    onChange={(e) => update("rg", e.target.value)}
                  />
                </FormField>
                <FormField label="Órgão emissor">
                  <input
                    className={inputClass}
                    placeholder="SSP/SP"
                    value={profile.rg_orgao ?? ""}
                    onChange={(e) => update("rg_orgao", e.target.value)}
                  />
                </FormField>
                <FormField label="Nacionalidade">
                  <input
                    className={inputClass}
                    value={profile.nacionalidade ?? "Brasileira"}
                    onChange={(e) => update("nacionalidade", e.target.value)}
                  />
                </FormField>
                <SelectField
                  label="Sexo"
                  value={profile.sexo}
                  onChange={(v) => update("sexo", v)}
                  options={OPCOES_SEXO}
                />
                <SelectField
                  label="Estado civil"
                  value={profile.estado_civil}
                  onChange={(v) => update("estado_civil", v)}
                  options={OPCOES_ESTADO_CIVIL}
                />
                <FormField label="Naturalidade (cidade)">
                  <input
                    className={inputClass}
                    value={profile.naturalidade_cidade ?? ""}
                    onChange={(e) => update("naturalidade_cidade", e.target.value)}
                  />
                </FormField>
                <FormField label="Naturalidade (UF)">
                  <input
                    className={inputClass}
                    placeholder="SP"
                    maxLength={2}
                    value={profile.naturalidade_estado ?? ""}
                    onChange={(e) =>
                      update("naturalidade_estado", e.target.value.toUpperCase())
                    }
                  />
                </FormField>
              </div>
            </FormSubsection>

            <FormSubsection title="Documentos">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <SelectField
                  label="CNH"
                  value={profile.cnh}
                  onChange={(v) => update("cnh", v)}
                  options={OPCOES_CNH}
                />
                <FormField
                  label="Categoria CNH"
                  hint={profile.cnh === "Sim" ? "Ex.: B, AB" : "Só se tiver CNH"}
                >
                  <input
                    className={inputClass}
                    placeholder="B"
                    value={profile.cnh_categoria ?? ""}
                    onChange={(e) =>
                      update("cnh_categoria", e.target.value.toUpperCase())
                    }
                    disabled={profile.cnh !== "Sim"}
                  />
                </FormField>
              </div>
            </FormSubsection>

            <FormSubsection title="Comunicação">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="E-mail" full>
                  <input
                    type="email"
                    className={inputClass}
                    value={profile.email ?? ""}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </FormField>
                <FormField label="Celular">
                  <input
                    className={inputClass}
                    value={profile.telefone ?? ""}
                    onChange={(e) => update("telefone", e.target.value)}
                  />
                </FormField>
                <FormField label="WhatsApp" hint="Vazio = mesmo do celular">
                  <input
                    className={inputClass}
                    value={profile.whatsapp ?? ""}
                    onChange={(e) => update("whatsapp", e.target.value)}
                  />
                </FormField>
              </div>
            </FormSubsection>

            <FormSubsection title="Endereço">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="CEP">
                  <input
                    className={inputClass}
                    placeholder="00000-000"
                    value={profile.cep ?? ""}
                    onChange={(e) => update("cep", e.target.value)}
                  />
                </FormField>
                <FormField label="Estado (UF)">
                  <input
                    className={inputClass}
                    placeholder="SP"
                    maxLength={2}
                    value={profile.estado ?? ""}
                    onChange={(e) =>
                      update("estado", e.target.value.toUpperCase())
                    }
                  />
                </FormField>
                <FormField label="Logradouro" full>
                  <input
                    className={inputClass}
                    value={profile.logradouro ?? ""}
                    onChange={(e) => update("logradouro", e.target.value)}
                  />
                </FormField>
                <FormField label="Número">
                  <input
                    className={inputClass}
                    value={profile.numero ?? ""}
                    onChange={(e) => update("numero", e.target.value)}
                  />
                </FormField>
                <FormField label="Complemento">
                  <input
                    className={inputClass}
                    value={profile.complemento ?? ""}
                    onChange={(e) => update("complemento", e.target.value)}
                  />
                </FormField>
                <FormField label="Bairro">
                  <input
                    className={inputClass}
                    value={profile.bairro ?? ""}
                    onChange={(e) => update("bairro", e.target.value)}
                  />
                </FormField>
                <FormField label="Cidade">
                  <input
                    className={inputClass}
                    value={profile.cidade ?? ""}
                    onChange={(e) => update("cidade", e.target.value)}
                  />
                </FormField>
                <FormField label="País">
                  <input
                    className={inputClass}
                    value={profile.pais ?? "Brasil"}
                    onChange={(e) => update("pais", e.target.value)}
                  />
                </FormField>
              </div>
            </FormSubsection>

            <FormSubsection title="Links">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="LinkedIn" full>
                  <input
                    className={inputClass}
                    value={profile.linkedin ?? ""}
                    onChange={(e) => update("linkedin", e.target.value)}
                  />
                </FormField>
                <FormField label="GitHub">
                  <input
                    className={inputClass}
                    value={profile.github ?? ""}
                    onChange={(e) => update("github", e.target.value)}
                  />
                </FormField>
                <FormField label="Portfólio">
                  <input
                    className={inputClass}
                    value={profile.portfolio ?? ""}
                    onChange={(e) => update("portfolio", e.target.value)}
                  />
                </FormField>
              </div>
            </FormSubsection>

            <FormSubsection title="Diversidade">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <FormField label="PCD">
                  <input
                    className={inputClass}
                    value={profile.pcd ?? "Não"}
                    onChange={(e) => update("pcd", e.target.value)}
                  />
                </FormField>
                <SelectField
                  label="Cor ou raça"
                  value={profile.cor_ou_raca}
                  onChange={(v) => update("cor_ou_raca", v)}
                  options={OPCOES_COR_RACA}
                />
              </div>
            </FormSubsection>

            <FormSubsection title="Foto">
              <p className="text-xs text-zinc-500">
                Coloque um jpg ou png em{" "}
                <code className="rounded bg-zinc-100 px-1">dados/fotos/</code>.
                {hasPhoto ? " Foto atual será exibida ao salvar." : ""}
              </p>
              {hasPhoto ? (
                <img
                  src="/api/photo"
                  alt="Foto de perfil"
                  className="mt-2 h-28 w-28 rounded-lg border border-zinc-200 object-cover"
                />
              ) : null}
            </FormSubsection>
          </div>
        }
      />
    </>
  );
}
