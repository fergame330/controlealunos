import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL_ADMIN = (process.env.ADMIN_EMAIL ?? "admin@escola.local").toLowerCase();
const SENHA_ADMIN = process.env.ADMIN_SENHA ?? "admin12345";
const NOME_ADMIN = process.env.ADMIN_NOME ?? "Administrador";

const ALUNOS_EXEMPLO = [
  { nome: "Ana Beatriz Souza", matricula: "2024001234", cpf: "52998224725" },
  { nome: "Carlos Eduardo Lima", matricula: "2024005678", cpf: "15350946056" },
  { nome: "Mariana Alves Ferreira", matricula: "2024009012", cpf: "12345678909" },
];

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: EMAIL_ADMIN },
    update: { administrador: true },
    create: {
      nome: NOME_ADMIN,
      email: EMAIL_ADMIN,
      senha: await bcrypt.hash(SENHA_ADMIN, 12),
      administrador: true,
    },
  });

  console.log(`Administrador pronto: ${admin.email}`);

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
