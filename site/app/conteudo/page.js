import { redirect } from "next/navigation";

export const metadata = {
  title: "Conteúdo — Tuma Emprego",
};

const HASH = {
  experiencias: "sec-experiencia",
  projetos: "sec-projetos",
  cursos: "sec-cursos",
  stack: "sec-tecnologias",
  tecnologias: "sec-tecnologias",
  contato: "sec-contato",
  formacao: "sec-formacao",
  candidatura: "sec-candidatura",
};

export default function ConteudoPage({ searchParams }) {
  const sec = searchParams?.sec ?? searchParams?.tipo ?? "experiencias";
  const hash = HASH[sec] ?? "sec-experiencia";
  redirect(`/#${hash}`);
}
