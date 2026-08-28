-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "administrador" BOOLEAN NOT NULL DEFAULT false,
    "email" VARCHAR(180) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "matricula" VARCHAR(30) NOT NULL,
    "cpf" CHAR(11) NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Frequencia" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "preceptorId" TEXT NOT NULL,
    "dataEnvio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45) NOT NULL,
    "browser" VARCHAR(120) NOT NULL,
    "os" VARCHAR(120) NOT NULL,
    "dispositivo" VARCHAR(120) NOT NULL,
    "dataReferente" DATE NOT NULL,
    "horarioInicio" VARCHAR(5) NOT NULL,
    "horarioFim" VARCHAR(5) NOT NULL,
    "cargaHoraria" SMALLINT NOT NULL,

    CONSTRAINT "Frequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pontuacao" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "preceptorId" TEXT NOT NULL,
    "dataEnvio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45) NOT NULL,
    "browser" VARCHAR(120) NOT NULL,
    "os" VARCHAR(120) NOT NULL,
    "dispositivo" VARCHAR(120) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "valor" DECIMAL(5,2) NOT NULL,
    "peso" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "Pontuacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_matricula_key" ON "Matricula"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Matricula_cpf_key" ON "Matricula"("cpf");

-- CreateIndex
CREATE INDEX "Matricula_nome_idx" ON "Matricula"("nome");

-- CreateIndex
CREATE INDEX "Frequencia_alunoId_dataReferente_idx" ON "Frequencia"("alunoId", "dataReferente");

-- CreateIndex
CREATE INDEX "Frequencia_preceptorId_idx" ON "Frequencia"("preceptorId");

-- CreateIndex
CREATE UNIQUE INDEX "Nota_alunoId_key" ON "Nota"("alunoId");

-- CreateIndex
CREATE INDEX "Pontuacao_notaId_idx" ON "Pontuacao"("notaId");

-- CreateIndex
CREATE INDEX "Pontuacao_preceptorId_idx" ON "Pontuacao"("preceptorId");

-- AddForeignKey
ALTER TABLE "Frequencia" ADD CONSTRAINT "Frequencia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Frequencia" ADD CONSTRAINT "Frequencia_preceptorId_fkey" FOREIGN KEY ("preceptorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pontuacao" ADD CONSTRAINT "Pontuacao_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "Nota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pontuacao" ADD CONSTRAINT "Pontuacao_preceptorId_fkey" FOREIGN KEY ("preceptorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

