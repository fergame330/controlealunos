-- Foto do aluno guardada no próprio banco. As colunas são nulas: aluno sem
-- foto continua válido e a interface mostra as iniciais no lugar.
ALTER TABLE "Matricula"
  ADD COLUMN "foto" BYTEA,
  ADD COLUMN "fotoTipo" VARCHAR(40),
  ADD COLUMN "fotoEnviadaEm" TIMESTAMPTZ(3);
