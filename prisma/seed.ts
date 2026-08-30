import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL_ADMIN = (process.env.ADMIN_EMAIL ?? "admin@escola.local").toLowerCase();
const SENHA_INFORMADA = process.env.ADMIN_SENHA;
const SENHA_ADMIN = SENHA_INFORMADA ?? "admin12345";
const NOME_ADMIN = process.env.ADMIN_NOME ?? "Administrador";

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
