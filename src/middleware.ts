import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESSAO, lerSessao } from "@/lib/session";

const ROTAS_PUBLICAS = ["/login"];

/**
 * Primeira barreira de acesso: válida a assinatura do cookie de sessao.
 * A checagem definitiva (usuário existe, e/ou é administrador) acontece em
 * cada página e server action, já com acesso ao banco.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessao = await lerSessao(request.cookies.get(COOKIE_SESSAO)?.value);
  const rotaPublica = ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  if (!sessao && !rotaPublica) {
    const destino = new URL("/login", request.url);

    if (pathname !== "/") {
      destino.searchParams.set("proximo", pathname);
    }

    return NextResponse.redirect(destino);
  }

  if (sessao && rotaPublica) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
