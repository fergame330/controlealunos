import { formatarDataHora } from "@/lib/utils";

type Props = {
  dataEnvio: Date;
  ip: string;
  browser: string;
  os: string;
  dispositivo: string;
};

/** Rastro de quem/como o lançamento foi enviado, gravado junto com o registro. */
export function Auditoria({ dataEnvio, ip, browser, os, dispositivo }: Props) {
  return (
    <div>
      <p className="text-slate-700">{formatarDataHora(dataEnvio)}</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {dispositivo} · {os} · {browser} · IP {ip}
      </p>
    </div>
  );
}
