-- As notas antigas eram competência em texto livre, sem área e com peso.
-- Não há como convertê-las para o modelo novo, então as duas tabelas são
-- recriadas em vez de alteradas. Frequências e cadastros não são tocados.
DROP TABLE IF EXISTS "Pontuacao";
DROP TABLE IF EXISTS "Nota";

-- CreateTable
CREATE TABLE "Pontuacao" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "valor" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "Pontuacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competencia" (
    "id" TEXT NOT NULL,
    "grupo" VARCHAR(60) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "ordem" SMALLINT NOT NULL,

    CONSTRAINT "Competencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "preceptorId" TEXT NOT NULL,
    "dataEnvio" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45) NOT NULL,
    "browser" VARCHAR(120) NOT NULL,
    "os" VARCHAR(120) NOT NULL,
    "dispositivo" VARCHAR(120) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_nome_key" ON "Area"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Competencia_nome_key" ON "Competencia"("nome");

-- CreateIndex
CREATE INDEX "Competencia_ordem_idx" ON "Competencia"("ordem");

-- CreateIndex
CREATE INDEX "Avaliacao_alunoId_idx" ON "Avaliacao"("alunoId");

-- CreateIndex
CREATE INDEX "Avaliacao_areaId_idx" ON "Avaliacao"("areaId");

-- CreateIndex
CREATE INDEX "Avaliacao_preceptorId_idx" ON "Avaliacao"("preceptorId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_alunoId_areaId_preceptorId_key" ON "Avaliacao"("alunoId", "areaId", "preceptorId");

-- CreateIndex
CREATE INDEX "Pontuacao_avaliacaoId_idx" ON "Pontuacao"("avaliacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pontuacao_avaliacaoId_competenciaId_key" ON "Pontuacao"("avaliacaoId", "competenciaId");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Matricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_preceptorId_fkey" FOREIGN KEY ("preceptorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pontuacao" ADD CONSTRAINT "Pontuacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pontuacao" ADD CONSTRAINT "Pontuacao_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "Competencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

