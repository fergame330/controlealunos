# Controle de Alunos

Sistema de registro de **frequência** e **notas** de alunos por preceptores, com
login por e-mail e senha e um perfil administrador que cadastra os acessos de
preceptores e os alunos.

Feito com **Next.js (App Router)**, **Prisma** (PostgreSQL), **Tailwind CSS** e
TypeScript. A autenticação é própria (senha com bcrypt + sessão JWT em cookie
`httpOnly`), sem dependência externa.

## Como funciona

### Administrador

- Cadastra, edita e remove **acessos** (preceptores e outros administradores) em
  `/admin/preceptores`: nome, e-mail e senha provisória. Também redefine senhas e
  concede/remove a permissão de administrador.
- Cadastra, edita e remove **alunos** em `/admin/alunos`: nome, número de
  matrícula, CPF (com validação dos dígitos verificadores) e **foto**.
- Cadastra e renomeia as **áreas** em `/admin/areas`. Sem pelo menos uma área,
  os preceptores não conseguem avaliar. Uma área que já tem avaliações não pode
  ser excluída.
- Faz tudo o que um preceptor faz e, além disso, é o único que pode **excluir**
  frequências e pontuações já lançadas.

### Preceptor

1. Entra no painel e busca o aluno pelo **nome**, pelo **número de matrícula**
   ou pelo **CPF**. Matrícula ou CPF completos abrem o aluno direto; o nome
   lista os que combinam, cada um com a **foto**, para escolher olhando.
2. O sistema abre a tela do aluno, com duas abas:

**Frequência** — informa a data referente, o horário de início e o horário de
fim. A **carga horária** é calculada automaticamente a partir do intervalo e pode
ser ajustada para baixo (por exemplo, descontando um intervalo), nunca para além
do período informado.

**Nota** — escolhe a **área** e dá nota (0 a 10) a **todas as 14 competências**
da lista fixa. Não há peso: toda competência vale o mesmo.

O cálculo tem três níveis:

```
nota do preceptor na área = média das 14 competências
nota da área              = média das notas dos preceptores que avaliaram nela
nota final do aluno       = média das notas de todos os preceptores
```

A nota final é a média de **todas as avaliações**, não a média das áreas. Uma
área avaliada por dois preceptores entra com duas notas na conta.

Cada preceptor tem uma avaliação por área: salvar de novo substitui a nota
dele, sem alterar as dos outros. As competências são fixas e ficam em
`src/lib/competencias.ts`:

| Grupo | Competências |
| --- | --- |
| Frequência | Assiduidade · Pontualidade |
| Aprendizado | Conhecimento teórico · Conhecimento prático · Busca ativa por conhecimento · Evolução do conhecimento durante o estágio |
| Comunicação | Relação com pacientes e acompanhantes · Relação com outros estudantes e profissionais da mesma ou de outras áreas |
| Conduta | Interesse · Capacidade de tomar iniciativa · Postura ética/humanista com o paciente · Dedicação ao paciente (tentar garantir assistência) · Responsabilidade com suas tarefas · Postura crítica diante da dinâmica de trabalho e assistência do serviço |

Os quatro grupos são apenas títulos de seção — quem recebe nota são as 14
competências.

**O banco guarda apenas a nota de cada preceptor**, não as notas competência a
competência: a média é calculada no envio do formulário e só ela é gravada. Em
troca da simplicidade, não há histórico de em qual competência o aluno foi bem
ou mal, e reavaliar uma área exige preencher a lista inteira de novo — não há o
que pré-preencher.

### Foto do aluno

A foto é opcional e aparece na busca, na listagem de alunos e no cabeçalho da
tela do aluno. Quem não tem foto aparece com as iniciais.

O navegador **recorta em quadrado e reduz para 512px** antes de enviar, então
uma foto de celular de 4 MB chega ao servidor com algumas dezenas de KB. O
servidor confere o formato pelos **bytes iniciais**, não pelo `content-type`
declarado, e aceita JPEG, PNG ou WebP até 1 MB.

A imagem fica no próprio PostgreSQL (`bytea`) e é servida por
`/api/alunos/[id]/foto`, que **exige sessão** — é dado pessoal e não pode ficar
acessível por URL solta. A URL leva `?v=<data do envio>`, então trocar a foto
invalida o cache na hora.

Guardar imagem no banco não escala para milhares de fotos grandes. Na escala
deste sistema — uma foto pequena por aluno — evita depender de um serviço de
storage externo e de mais credenciais para configurar. Se um dia crescer, o
caminho é mover os bytes para um bucket e guardar só a URL.

### Auditoria

Todo lançamento de frequência ou avaliação grava, junto com o registro, **quem
lançou** e **de onde**: preceptor, data e hora do envio, IP, navegador, sistema
operacional e tipo de dispositivo. Essas informações aparecem na coluna
*Registro* de cada tabela.

## Como rodar

Requer Node.js 20+ e PostgreSQL 14+. Para subir um Postgres local com Docker:

```bash
docker run -d --name controlealunos-db \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=controlealunos \
  -p 5432:5432 postgres:16
```

```bash
npm install                 # instala e gera o Prisma Client
cp .env.example .env        # ajuste as variáveis (veja abaixo)
npm run db:migrate          # cria as tabelas
npm run db:seed             # cria o administrador inicial
npm run dev                 # http://localhost:3000
```

### Variáveis de ambiente

| Variável       | Descrição                                                        |
| -------------- | ---------------------------------------------------------------- |
| `DATABASE_URL` | Conexão do PostgreSQL: `postgresql://usuario:senha@host:5432/controlealunos?schema=public` |
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

### Recuperar o acesso

Rodar o seed com `ADMIN_SENHA` redefine a senha de um administrador que já
exista com aquele e-mail:

```bash
ADMIN_EMAIL=voce@instituicao.br ADMIN_SENHA='nova-senha' npm run db:seed
```

Sem `ADMIN_SENHA`, o seed não toca na senha de quem já está cadastrado — assim
rodá-lo de novo não desfaz uma troca feita pela interface.

### Acessos criados fora do sistema

As senhas são guardadas como hash bcrypt. Um acesso criado à mão no banco
(`INSERT` manual, importação de planilha) costuma gravar a senha em texto puro,
que jamais conferiria com `bcrypt.compare`.

Para não trancar ninguém para fora, o login aceita esse formato herdado: se o
valor gravado não tem cara de hash bcrypt, ele é comparado como texto e, quando
confere, **é regravado como hash na hora**. O texto puro dura até o primeiro
login bem-sucedido daquele usuário.

Ainda assim, prefira o seed ou a tela de preceptores: enquanto a senha estiver
em texto puro, quem lê o banco lê a senha.

### Publicando com Postgres gerenciado

Em Neon, Supabase, Railway ou Render, basta apontar a `DATABASE_URL` para a
string de conexão do provedor e rodar `npm run db:migrate` uma vez.

**Se o host for serverless** (Vercel, Netlify), cada requisição pode abrir uma
conexão nova e estourar o limite do banco. Nesse caso use a string **pooled**
do provedor na `DATABASE_URL` e informe a conexão direta para as migrations,
que não funcionam através do pooler:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (pgbouncer)
  directUrl = env("DIRECT_URL")     // conexão direta, usada nas migrations
}
```

Deixei isso fora do schema de propósito: `directUrl` passa a ser obrigatório
assim que declarado, e em Postgres comum ele só atrapalha. Acrescente quando
for para um host serverless.

## Scripts

| Script               | O que faz                                        |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento                      |
| `npm run build`      | Gera o Prisma Client e compila para produção     |
| `npm start`          | Sobe a build de produção                         |
| `npm run typecheck`  | Checagem de tipos do TypeScript                  |
| `npm run db:migrate` | Aplica as migrations no banco                    |
| `npm run db:push`    | Sincroniza o schema sem migration (só em dev)    |
| `npm run db:seed`    | Cria/atualiza o administrador inicial            |
| `npm run db:studio`  | Abre o Prisma Studio                             |

## Estrutura

```
prisma/
  schema.prisma            Usuario, Matricula, Frequencia, Area, Avaliacao
  migrations/              migration inicial versionada (PostgreSQL)
  seed.ts                  administrador inicial (e dados de exemplo opcionais)
src/
  middleware.ts            primeira barreira de acesso (valida o cookie)
  app/
    api/alunos/[id]/foto/  serve a foto do aluno (exige sessão)
    login/                 tela de login
    (painel)/
      painel/              busca do aluno por nome, matrícula ou CPF
      alunos/[id]/         abas de frequência e nota + lançamentos
      admin/preceptores/   cadastro de acessos
      admin/alunos/        cadastro de alunos
      admin/areas/         cadastro de áreas
  lib/
    auth.ts                sessão, hash de senha, exigirUsuario/exigirAdministrador
    session.ts             assinatura e leitura do JWT (compatível com o middleware)
    competencias.ts        lista fixa das 14 competências, agrupada
    imagem.ts              validação da foto e iniciais do avatar
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
- **Escala das notas de 0 a 10**, definida em `src/lib/constantes.ts`. Não
  existe peso: toda competência vale o mesmo na média.
- **A lista de competências vive no código**, em `src/lib/competencias.ts`.
  Para mudar a lista, edite `GRUPOS_COMPETENCIAS` — nada precisa ser rodado no
  banco, já que só a média é gravada. Alterar a lista não recalcula avaliações
  antigas: a nota delas continua sendo a média das competências que valiam na
  época.
- **Data referente em UTC.** É gravada à meia-noite UTC e formatada com
  `timeZone: "UTC"`, para que o fuso do servidor não mude o dia registrado.
- **CPF** é armazenado apenas com dígitos e exibido formatado; a busca aceita as
  duas formas.
- **Filtro de alunos usa `mode: "insensitive"`.** No PostgreSQL o `contains` do
  Prisma diferencia maiúsculas de minúsculas (vira `LIKE`), ao contrário do
  SQLite. Sem esse modo, buscar `ana` não encontraria `Ana Beatriz`.
- **`valor` é `DECIMAL(5,2)`.** O padrão do Prisma no Postgres seria
  `DECIMAL(65,30)`; cinco dígitos com duas casas cobrem a escala de notas com
  folga.
- **`ip` é `VARCHAR(45)`, não `INET`.** O tipo `inet` do Postgres recusa
  qualquer coisa que não seja um endereço válido, e a auditoria grava
  `desconhecido` quando a requisição não traz cabeçalho de IP — o caso normal
  em desenvolvimento. 45 caracteres comportam IPv6.
