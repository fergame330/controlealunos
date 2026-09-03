import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // O padrão é 1 MB e o corpo inclui a foto do aluno. O navegador reduz a
    // imagem antes de enviar, mas a folga evita rejeição por pouco.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
