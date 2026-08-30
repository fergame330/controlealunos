-- A lista de competências passa a viver no código (src/lib/competencias.ts) e
-- o banco guarda apenas a nota resultante de cada preceptor.

-- Nullable primeiro, para poder preencher as avaliações que já existem.
ALTER TABLE "Avaliacao" ADD COLUMN "nota" DECIMAL(5,2);

-- Preserva o que já foi lançado: a nota vira a média das pontuações daquela
-- avaliação, exatamente o número que a tela já mostrava.
UPDATE "Avaliacao" a
SET "nota" = COALESCE(
  (SELECT ROUND(AVG(p."valor"), 2) FROM "Pontuacao" p WHERE p."avaliacaoId" = a."id"),
  0
);

ALTER TABLE "Avaliacao" ALTER COLUMN "nota" SET NOT NULL;

-- DropTable
DROP TABLE "Pontuacao";

-- DropTable
DROP TABLE "Competencia";
