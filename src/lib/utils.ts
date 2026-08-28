export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(cpf: string): string {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Valida os dois dígitos verificadores do CPF. */
export function cpfValido(cpf: string): boolean {
  const d = somenteDigitos(cpf);

  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    let peso = ate + 1;

    for (let i = 0; i < ate; i += 1) {
      soma += Number(d[i]) * peso;
      peso -= 1;
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

const HORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function horarioValido(horario: string): boolean {
  return HORARIO.test(horario);
}

export function horarioEmMinutos(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

/** Diferenca em minutos entre dois horários "HH:MM" do mesmo dia. */
export function minutosEntre(inicio: string, fim: string): number {
  return horarioEmMinutos(fim) - horarioEmMinutos(inicio);
}

/** 150 -> "2h 30min" */
export function formatarMinutos(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return "0min";

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto}min`;
  if (resto === 0) return `${horas}h`;

  return `${horas}h ${resto}min`;
}

/**
 * Converte "AAAA-MM-DD" (input type=date) para um Date fixado em meia-noite UTC,
 * evitando que o fuso do servidor mude o dia gravado.
 */
export function dataDoFormulario(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;

  const data = new Date(`${valor}T00:00:00.000Z`);

  return Number.isNaN(data.getTime()) ? null : data;
}

/** Date -> "AAAA-MM-DD" (lendo em UTC, par de dataDoFormulario). */
export function dataParaInput(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export type PontuacaoCalculo = { valor: number; peso: number };

export type ResultadoNota = {
  notaFinal: number | null;
  somaPesos: number;
  somaPonderada: number;
};

/**
 * Nota final = soma(valor * peso) / soma(pesos).
 * Retorna notaFinal nula quando não há pontuações com peso.
 */
export function calcularNotaFinal(pontuacoes: PontuacaoCalculo[]): ResultadoNota {
  const somaPesos = pontuacoes.reduce((total, p) => total + p.peso, 0);
  const somaPonderada = pontuacoes.reduce((total, p) => total + p.valor * p.peso, 0);

  return {
    notaFinal: somaPesos > 0 ? somaPonderada / somaPesos : null,
    somaPesos,
    somaPonderada,
  };
}

export function formatarNota(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
