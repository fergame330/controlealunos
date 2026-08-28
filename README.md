# Controle de Alunos

Sistema de registro de **frequência** e **notas** de alunos por preceptores, com
login por e-mail e senha e um perfil administrador que cadastra os acessos de
preceptores e os alunos.

Feito com **Next.js (App Router)**, **Prisma** (SQLite), **Tailwind CSS** e
TypeScript. A autenticação é própria (senha com bcrypt + sessão JWT em cookie
`httpOnly`), sem dependência externa.

## Como funciona

### Administrador

- Cadastra, edita e remove **acessos** (preceptores e outros administradores) em
  `/admin/preceptores`: nome, e-mail e senha provisória. Também redefine senhas e
  concede/remove a permissão de administrador.
- Cadastra, edita e remove **alunos** em `/admin/alunos`: nome, número de
  matrícula e CPF (com validação dos dígitos verificadores).
- Faz tudo o que um preceptor faz e, além disso, é o único que pode **excluir**
  frequências e pontuações já lançadas.

### Preceptor

1. Entra no painel e informa o **número de matrícula ou o CPF** do aluno.
2. O sistema abre a tela do aluno, com duas abas:

**Frequência** — informa a data referente, o horário de início e o horário de
fim. A **carga horária** é calculada automaticamente a partir do intervalo e pode
ser ajustada para baixo (por exemplo, descontando um intervalo), nunca para além
do período informado.

**Nota** — atribui uma nota (0 a 10) e um **peso** a cada competência avaliada. A
nota final é a **média ponderada** de todas as pontuações:

```
nota final = Σ (valor × peso) ÷ Σ (pesos)
```

A tela mostra a memória de cálculo (soma ponderada / soma dos pesos) e a
contribuição de cada competência.

### Auditoria

Todo lançamento de frequência ou pontuação grava, junto com o registro, **quem
lançou** e **de onde**: preceptor, data e hora do envio, IP, navegador, sistema
operacional e tipo de dispositivo. Essas informações aparecem na coluna
*Registro* de cada tabela.

## Como rodar

Requer Node.js 20+.

```bash
npm install                 # instala e gera o Prisma Client
cp .env.example .env        # ajuste as variáveis (veja abaixo)
npm run db:migrate          # cria o banco SQLite
npm run db:seed             # cria o administrador inicial
npm run dev                 # http://localhost:3000
```

### Variáveis de ambiente

| Variável       | Descrição                                                        |
| -------------- | ---------------------------------------------------------------- |
| `DATABASE_URL` | Caminho do banco. Padrão: `file:./dev.db`                         |
| `AUTH_SECRET`  | Segredo que assina o cookie de sessão (mínimo de 16 caracteres)   |

Gere um segredo forte para produção:

```bash
openssl rand -base64 32
```

### Primeiro acesso

O seed cria um administrador. Sem variáveis definidas, ele usa:

- **e-mail:** `admin@escola.local`
- **senha:** `admin12345`

**Troque essa senha no primeiro acesso** (Preceptores → *Nova senha*), ou defina
`ADMIN_EMAIL`, `ADMIN_SENHA` e `ADMIN_NOME` antes de rodar o seed:

```bash
ADMIN_EMAIL=voce@instituicao.br ADMIN_SENHA='uma-senha-forte' npm run db:seed
```

Para popular também um preceptor e alguns alunos de exemplo:

```bash
SEED_EXEMPLOS=1 npm run db:seed
```

## Scripts

| Script               | O que faz                                        |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento                      |
| `npm run build`      | Gera o Prisma Client e compila para produção     |
| `npm start`          | Sobe a build de produção                         |
| `npm run typecheck`  | Checagem de tipos do TypeScript                  |
| `npm run db:migrate` | Aplica as migrations                             |
| `npm run db:push`    | Sincroniza o schema sem migration (só em dev)    |
| `npm run db:seed`    | Cria/atualiza o administrador inicial            |
| `npm run db:studio`  | Abre o Prisma Studio                             |

## Estrutura

```
prisma/
  schema.prisma            modelos Usuario, Matricula, Frequencia, Nota, Pontuacao
  migrations/              migration inicial versionada
  seed.ts                  administrador inicial (e dados de exemplo opcionais)
src/
  middleware.ts            primeira barreira de acesso (valida o cookie)
  app/
    login/                 tela de login
    (painel)/
      painel/              busca do aluno por matrícula ou CPF
      alunos/[id]/         abas de frequência e nota + lançamentos
      admin/preceptores/   cadastro de acessos
      admin/alunos/        cadastro de alunos
  lib/
    auth.ts                sessão, hash de senha, exigirUsuario/exigirAdministrador
    session.ts             assinatura e leitura do JWT (compatível com o middleware)
    request-info.ts        IP, navegador, SO e dispositivo para a auditoria
    utils.ts               CPF, horários, formatação e cálculo da nota final
```

## Segurança

- Senhas com **bcrypt** (12 rounds); a comparação em login roda mesmo quando o
  e-mail não existe, para não revelar quais e-mails estão cadastrados.
- Sessão em cookie **httpOnly**, `sameSite=lax`, `secure` em produção, com
  validade de 8 horas.
- O papel de administrador é sempre lido do banco a cada requisição, nunca do
  token — remover um acesso tem efeito imediato.
- Todas as *server actions* revalidam autenticação e permissão no servidor; o
  middleware é apenas a primeira barreira.
- O sistema impede remover o último administrador ou o próprio acesso.

## Notas de implementação

- **Carga horária em minutos.** O schema define `cargaHoraria Int`; guardar
  minutos permite registrar meia hora sem perder precisão. A interface mostra o
  valor formatado (`4h 30min`).
- **Escala das notas de 0 a 10**, com peso inteiro de 1 a 100. Ambos os limites
  ficam em `src/lib/constantes.ts`.
- **Data referente em UTC.** É gravada à meia-noite UTC e formatada com
  `timeZone: "UTC"`, para que o fuso do servidor não mude o dia registrado.
- **CPF** é armazenado apenas com dígitos e exibido formatado; a busca aceita as
  duas formas.
