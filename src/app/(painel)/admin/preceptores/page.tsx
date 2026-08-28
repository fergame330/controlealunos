import type { Metadata } from "next";

import { exigirAdministrador } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarDataHora } from "@/lib/utils";
import { AcoesUsuario } from "./acoes-usuario";
import { FormularioPreceptor } from "./formulario-preceptor";

export const metadata: Metadata = { title: "Preceptores | Controle de Alunos" };

export default async function PaginaPreceptores({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const admin = await exigirAdministrador();
  const { erro, sucesso } = await searchParams;

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ administrador: "desc" }, { nome: "asc" }],
    include: {
      _count: { select: { frequencias: true, pontuacoes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Preceptores</h1>
        <p className="texto-apoio mt-1">
          Cadastre e gerencie os acessos de preceptores e administradores.
        </p>
      </div>

      {erro ? (
        <p className="alerta-erro" role="alert">
          {erro}
        </p>
      ) : null}

      {sucesso ? (
        <p className="alerta-sucesso" role="status">
          {sucesso}
        </p>
      ) : null}

      <section className="cartao">
        <div className="cartao-corpo">
          <h2 className="titulo-secao mb-4">Novo acesso</h2>
          <FormularioPreceptor />
        </div>
      </section>

      <section className="cartao overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="titulo-secao">
            Acessos cadastrados{" "}
            <span className="text-sm font-normal text-slate-500">({usuarios.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Lançamentos</th>
                <th>Criado em</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="font-medium text-slate-900">
                    {usuario.nome}
                    {usuario.id === admin.id ? (
                      <span className="ml-2 text-xs font-normal text-slate-400">(você)</span>
                    ) : null}
                  </td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={usuario.administrador ? "badge-admin" : "badge-preceptor"}>
                      {usuario.administrador ? "Administrador" : "Preceptor"}
                    </span>
                  </td>
                  <td className="text-slate-500">
                    {usuario._count.frequencias} freq. · {usuario._count.pontuacoes} pont.
                  </td>
                  <td className="text-slate-500">{formatarDataHora(usuario.criadoEm)}</td>
                  <td>
                    <AcoesUsuario
                      usuarioId={usuario.id}
                      nome={usuario.nome}
                      administrador={usuario.administrador}
                      ehVoce={usuario.id === admin.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
