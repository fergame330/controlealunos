import "server-only";

import { headers } from "next/headers";

export type DadosRequisicao = {
  ip: string;
  browser: string;
  os: string;
  dispositivo: string;
};

function extrairIp(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for");

  if (encaminhado) {
    const primeiro = encaminhado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }

  return (
    cabecalhos.get("x-real-ip") ??
    cabecalhos.get("cf-connecting-ip") ??
    cabecalhos.get("x-vercel-forwarded-for") ??
    "desconhecido"
  );
}

function identificarBrowser(ua: string): string {
  const testes: Array<[RegExp, string]> = [
    [/Edg[A-Z]?\//i, "Microsoft Edge"],
    [/OPR\/|Opera/i, "Opera"],
    [/SamsungBrowser/i, "Samsung Internet"],
    [/Firefox\/|FxiOS/i, "Firefox"],
    [/CriOS/i, "Chrome"],
    [/Chrome\//i, "Chrome"],
    [/Safari\//i, "Safari"],
    [/MSIE |Trident\//i, "Internet Explorer"],
  ];

  for (const [padrao, nome] of testes) {
    if (padrao.test(ua)) return nome;
  }

  return "Desconhecido";
}

function identificarSistema(ua: string): string {
  const testes: Array<[RegExp, string]> = [
    [/Windows NT 10\.0/i, "Windows 10/11"],
    [/Windows NT/i, "Windows"],
    [/Android/i, "Android"],
    [/(iPhone|iPad|iPod)/i, "iOS"],
    [/Mac OS X|Macintosh/i, "macOS"],
    [/CrOS/i, "ChromeOS"],
    [/Linux/i, "Linux"],
  ];

  for (const [padrao, nome] of testes) {
    if (padrao.test(ua)) return nome;
  }

  return "Desconhecido";
}

function identificarDispositivo(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return "Tablet";
  }

  if (/Mobi|iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua)) {
    return "Celular";
  }

  if (ua.trim() === "") {
    return "Desconhecido";
  }

  return "Computador";
}

/**
 * Coleta os dados de auditoria da requisicao atual. Sempre chamado dentro de
 * server actions, antes de gravar frequências e pontuações.
 */
export async function dadosDaRequisicao(): Promise<DadosRequisicao> {
  const cabecalhos = await headers();
  const ua = cabecalhos.get("user-agent") ?? "";

  return {
    ip: extrairIp(cabecalhos),
    browser: identificarBrowser(ua),
    os: identificarSistema(ua),
    dispositivo: identificarDispositivo(ua),
  };
}
