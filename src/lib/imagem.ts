/** Limite do que o servidor aceita. O navegador já reduz antes de enviar. */
export const TAMANHO_MAXIMO_FOTO = 1_000_000; // 1 MB

export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

export type TipoAceito = (typeof TIPOS_ACEITOS)[number];

/**
 * Identifica o formato pelos bytes iniciais, não pelo content-type declarado:
 * o cliente pode mentir no cabeçalho, mas não no conteúdo.
 */
export function tipoRealDaImagem(bytes: Uint8Array): TipoAceito | null {
  if (bytes.length < 12) return null;

  const ehJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (ehJpeg) return "image/jpeg";

  const ehPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (ehPng) return "image/png";

  const texto = (inicio: number, fim: number) =>
    String.fromCharCode(...bytes.subarray(inicio, fim));

  if (texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP") return "image/webp";

  return null;
}

export type FotoValidada = { bytes: Uint8Array<ArrayBuffer>; tipo: TipoAceito };

/**
 * Valida o arquivo enviado. Retorna `null` quando nenhum arquivo veio, um erro
 * legível quando veio algo inválido, ou os bytes prontos para gravar.
 */
export async function lerFotoEnviada(
  arquivo: FormDataEntryValue | null,
): Promise<{ erro: string } | { foto: FotoValidada | null }> {
  if (!arquivo || typeof arquivo === "string") return { foto: null };

  const file = arquivo as File;

  if (file.size === 0) return { foto: null };

  if (file.size > TAMANHO_MAXIMO_FOTO) {
    const limite = Math.round(TAMANHO_MAXIMO_FOTO / 1000);
    return { erro: `A foto deve ter no máximo ${limite} KB depois de reduzida.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const tipo = tipoRealDaImagem(bytes);

  if (!tipo) {
    return { erro: "Envie uma imagem JPEG, PNG ou WebP." };
  }

  return { foto: { bytes, tipo } };
}

/** Iniciais para o círculo mostrado quando o aluno não tem foto. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
