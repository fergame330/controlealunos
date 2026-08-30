/**
 * Lista fixa avaliada em toda avaliação, igual em todas as áreas.
 *
 * Fica no código, não no banco: o banco guarda apenas a nota final de cada
 * preceptor. Os quatro grupos são títulos de seção no formulário — quem recebe
 * nota são as competências dentro deles.
 *
 * O `id` vira o nome do campo no formulário; mudá-lo só afeta lançamentos em
 * andamento, já que nada dele é gravado.
 */
export type Competencia = { id: string; nome: string };
export type GrupoCompetencias = { grupo: string; competencias: Competencia[] };

export const GRUPOS_COMPETENCIAS: GrupoCompetencias[] = [
  {
    grupo: "Frequência",
    competencias: [
      { id: "assiduidade", nome: "Assiduidade" },
      { id: "pontualidade", nome: "Pontualidade" },
    ],
  },
  {
    grupo: "Aprendizado",
    competencias: [
      { id: "conhecimento-teorico", nome: "Conhecimento teórico" },
      { id: "conhecimento-pratico", nome: "Conhecimento prático" },
      { id: "busca-ativa", nome: "Busca ativa por conhecimento" },
      { id: "evolucao", nome: "Evolução do conhecimento durante o estágio" },
    ],
  },
  {
    grupo: "Comunicação",
    competencias: [
      { id: "relacao-pacientes", nome: "Relação com pacientes e acompanhantes" },
      {
        id: "relacao-equipe",
        nome: "Relação com outros estudantes e profissionais da mesma ou de outras áreas",
      },
    ],
  },
  {
    grupo: "Conduta",
    competencias: [
      { id: "interesse", nome: "Interesse" },
      { id: "iniciativa", nome: "Capacidade de tomar iniciativa" },
      { id: "postura-etica", nome: "Postura ética/humanista com o paciente" },
      { id: "dedicacao", nome: "Dedicação ao paciente (tentar garantir assistência)" },
      { id: "responsabilidade", nome: "Responsabilidade com suas tarefas" },
      {
        id: "postura-critica",
        nome: "Postura crítica diante da dinâmica de trabalho e assistência do serviço",
      },
    ],
  },
];

/** As 14 competências em sequência, sem os grupos. */
export const COMPETENCIAS: Competencia[] = GRUPOS_COMPETENCIAS.flatMap(
  (grupo) => grupo.competencias,
);
