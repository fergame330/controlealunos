import { redirect } from "next/navigation";

import { usuarioAtual } from "@/lib/auth";

export default async function Home() {
  const usuario = await usuarioAtual();

  redirect(usuario ? "/painel" : "/login");
}
