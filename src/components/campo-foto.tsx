"use client";

import { useRef, useState } from "react";

import { iniciais } from "@/lib/imagem";

/** Lado máximo da imagem enviada. Fotos de celular passam de 3 MB; reduzidas
 *  aqui, chegam ao servidor com algumas dezenas de KB. */
const LADO_MAXIMO = 512;
const QUALIDADE = 0.82;

type Props = {
  nome: string;
  /** Nome do campo no formulário. */
  campo?: string;
  /** URL da foto atual, quando o aluno já tem uma. */
  fotoAtual?: string | null;
  nomeAluno?: string;
};

/**
 * Escolhe e reduz a foto no navegador antes de enviar. O arquivo original nunca
 * sobe: o canvas gera um JPEG de no máximo 512px, o que evita estourar o limite
 * de corpo das server actions e mantém o banco pequeno.
 */
export function CampoFoto({ nome, campo, fotoAtual = null, nomeAluno = "" }: Props) {
  const idCampo = campo ?? nome;
  const entrada = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(fotoAtual);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEscolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setProcessando(true);

    try {
      const reduzido = await reduzirImagem(arquivo);
      const transferencia = new DataTransfer();
      transferencia.items.add(reduzido);

      if (entrada.current) {
        entrada.current.files = transferencia.files;
      }

      setPrevia(URL.createObjectURL(reduzido));
    } catch {
      setErro("Não foi possível ler essa imagem. Tente outro arquivo.");
      if (entrada.current) entrada.current.value = "";
      setPrevia(fotoAtual);
    } finally {
      setProcessando(false);
    }
  }

  function limpar() {
    if (entrada.current) entrada.current.value = "";
    setPrevia(null);
    setErro(null);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {previa ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
          <img src={previa} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            {nomeAluno ? iniciais(nomeAluno) : "?"}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <label className="rotulo" htmlFor={idCampo}>
          Foto do aluno
        </label>

        <input
          ref={entrada}
          id={idCampo}
          name={nome}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={aoEscolher}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500">
            {processando
              ? "Preparando a imagem..."
              : "JPEG, PNG ou WebP. Reduzida automaticamente."}
          </p>

          {previa ? (
            <button
              type="button"
              onClick={limpar}
              className="text-xs text-slate-500 underline-offset-2 hover:underline"
            >
              Remover
            </button>
          ) : null}
        </div>

        {erro ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {erro}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Redesenha a imagem num canvas, cortada em quadrado e limitada a 512px. */
async function reduzirImagem(arquivo: File): Promise<File> {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const destino = Math.min(lado, LADO_MAXIMO);

  const canvas = document.createElement("canvas");
  canvas.width = destino;
  canvas.height = destino;

  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("canvas indisponível");

  // Recorte central: mantém o rosto no meio em fotos retangulares.
  contexto.drawImage(
    bitmap,
    (bitmap.width - lado) / 2,
    (bitmap.height - lado) / 2,
    lado,
    lado,
    0,
    0,
    destino,
    destino,
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE),
  );

  if (!blob) throw new Error("falha ao converter");

  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}
