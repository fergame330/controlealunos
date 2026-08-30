import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL_ADMIN = (process.env.ADMIN_EMAIL ?? "admin@escola.local").toLowerCase();
const SENHA_INFORMADA = process.env.ADMIN_SENHA;
const SENHA_ADMIN = SENHA_INFORMADA ?? "admin12345";
const NOME_ADMIN = process.env.ADMIN_NOME ?? "Administrador";

/**
 * Lista fixa avaliada em toda avaliação. Os quatro grupos são apenas títulos
 * de seção no formulário: quem recebe nota são as 14 competências.
 */
const COMPETENCIAS: Array<{ grupo: string; nome: string }> = [
  { grupo: "Frequência", nome: "Assiduidade" },
  { grupo: "Frequência", nome: "Pontualidade" },
  { grupo: "Aprendizado", nome: "Conhecimento teórico" },
  { grupo: "Aprendizado", nome: "Conhecimento prático" },
  { grupo: "Aprendizado", nome: "Busca ativa por conhecimento" },
  { grupo: "Aprendizado", nome: "Evolução do conhecimento durante o estágio" },
  { grupo: "Comunicação", nome: "Relação com pacientes e acompanhantes" },
  {
    grupo: "Comunicação",
    nome: "Relação com outros estudantes e profissionais da mesma ou de outras áreas",
  },
  { grupo: "Conduta", nome: "Interesse" },
  { grupo: "Conduta", nome: "Capacidade de tomar iniciativa" },
  { grupo: "Conduta", nome: "Postura ética/humanista com o paciente" },
  { grupo: "Conduta", nome: "Dedicação ao paciente (tentar garantir assistência)" },
  { grupo: "Conduta", nome: "Responsabilidade com suas tarefas" },
  {
    grupo: "Conduta",
    nome: "Postura crítica diante da dinâmica de trabalho e assistência do serviço",
  },
];

const AREAS_EXEMPLO = ["Clínica Médica", "Pediatria", "Cirurgia Geral"];

const ALUNOS_EXEMPLO = [
  { nome: "Ana Beatriz Souza", matricula: "2024001234", cpf: "52998224725" },
  { nome: "Carlos Eduardo Lima", matricula: "2024005678", cpf: "15350946056" },
  { nome: "Mariana Alves Ferreira", matricula: "2024009012", cpf: "12345678909" },
];

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: EMAIL_ADMIN },
    update: {
      administrador: true,
      // Só redefine a senha quando ADMIN_SENHA foi informada. Assim um seed
      // rodado sem variáveis não sobrescreve uma senha já trocada na interface,
      // mas informar ADMIN_SENHA vira o caminho de recuperação de acesso.
      ...(SENHA_INFORMADA ? { senha: await bcrypt.hash(SENHA_INFORMADA, 12) } : {}),
    },
    create: {
      nome: NOME_ADMIN,
      email: EMAIL_ADMIN,
      senha: await bcrypt.hash(SENHA_ADMIN, 12),
      administrador: true,
    },
  });

  console.log(`Administrador pronto: ${admin.email}`);

  if (SENHA_INFORMADA) {
    console.log("Senha redefinida a partir de ADMIN_SENHA.");
  }

  // A lista de competências é parte do sistema, não dado de exemplo: sem ela
  // não há o que avaliar. A ordem do array define a ordem no formulário.
  for (const [indice, competencia] of COMPETENCIAS.entries()) {
    await prisma.competencia.upsert({
      where: { nome: competencia.nome },
      update: { grupo: competencia.grupo, ordem: indice },
      create: { ...competencia, ordem: indice },
    });
  }

  console.log(`Competências sincronizadas: ${COMPETENCIAS.length}.`);

  if (process.env.SEED_EXEMPLOS === "1") {
    const preceptor = await prisma.usuario.upsert({
      where: { email: "preceptor@escola.local" },
      update: {},
      create: {
        nome: "Preceptor Exemplo",
        email: "preceptor@escola.local",
        senha: await bcrypt.hash("preceptor123", 12),
        administrador: false,
      },
    });

    for (const nome of AREAS_EXEMPLO) {
      await prisma.area.upsert({ where: { nome }, update: {}, create: { nome } });
    }

    for (const aluno of ALUNOS_EXEMPLO) {
      await prisma.matricula.upsert({
        where: { matricula: aluno.matricula },
        update: {},
        create: aluno,
      });
    }

    console.log(`Dados de exemplo criados. Preceptor: ${preceptor.email} / preceptor123`);
  }

  console.log("\nSe voce usou a senha padrao, troque-a no primeiro acesso.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
