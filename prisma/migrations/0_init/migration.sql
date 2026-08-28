-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "administrador" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Frequencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alunoId" TEXT NOT NULL,
    "preceptorId" TEXT NOT NULL,
    "dataEnvio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "dataReferente" DATETIME NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "cargaHoraria" INTEGER NOT NULL,
    CONSTRAINT "Frequencia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Matricula" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Frequencia_preceptorId_fkey" FOREIGN KEY ("preceptorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alunoId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Nota_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Matricula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pontuacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notaId" TEXT NOT NULL,
    "preceptorId" TEXT NOT NULL,
    "dataEnvio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Pontuacao_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "Nota" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pontuacao_preceptorId_fkey" FOREIGN KEY ("preceptorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

