/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SENIORIDADES = [
  {
    slug: "banco-de-talentos",
    nome: "Banco de Talentos",
    sinonimos: ["Talent Pool", "Cadastro de Talentos"],
    ordem: 1,
  },
  {
    slug: "jovem-aprendiz",
    nome: "Jovem Aprendiz",
    sinonimos: ["Aprendiz"],
    ordem: 2,
  },
  {
    slug: "estagio",
    nome: "Estágio",
    sinonimos: ["Estagiário", "Estagiária", "Estágio em"],
    ordem: 3,
  },
  {
    slug: "trainee",
    nome: "Trainee",
    sinonimos: ["Programa Trainee"],
    ordem: 4,
  },
  {
    slug: "junior",
    nome: "Júnior",
    sinonimos: ["Jr", "Junior", "Júnior I", "Júnior II"],
    ordem: 5,
  },
  {
    slug: "pleno",
    nome: "Pleno",
    sinonimos: ["Pl", "Mid", "Mid-level"],
    ordem: 6,
  },
  {
    slug: "senior",
    nome: "Sênior",
    sinonimos: ["Sr", "Senior", "Sênior I", "Sênior II"],
    ordem: 7,
  },
  {
    slug: "especialista",
    nome: "Especialista",
    sinonimos: ["Specialist"],
    ordem: 8,
  },
  {
    slug: "staff",
    nome: "Staff",
    sinonimos: ["Staff Engineer"],
    ordem: 9,
  },
];

const CATALOGO = [
  {
    slug: "dados-bi-analytics",
    nome: "Dados, BI e Analytics",
    titulosRaiz: [
      "Análise de Dados",
      "BI",
      "Analytics",
      "Data",
      "Inteligência de Dados",
    ],
    ordem: 1,
    palavrasChave: [
      "SQL",
      "Power BI",
      "Tableau",
      "Looker",
      "Python",
      "Excel",
      "BigQuery",
      "Excel avançado",
    ],
    nichos: [
      {
        slug: "analise",
        nome: "Análise",
        ordem: 1,
        titulos: [
          { titulo: "Analista de Dados" },
          { titulo: "Analista de BI", sinonimos: ["Business Intelligence"] },
          { titulo: "Analista de Data Analytics" },
          { titulo: "Analista de Inteligência de Dados" },
          {
            titulo: "Analista de Inteligência de Negócios",
            sinonimos: ["Inteligência de Negócios"],
          },
          { titulo: "Analista de Performance" },
          { titulo: "Analista de Planejamento de Dados" },
          { titulo: "Analista ETL" },
          { titulo: "Analista de Banco de Dados" },
          { titulo: "Analista Estatístico de Dados" },
          { titulo: "Analista de TI e Dados" },
        ],
      },
      {
        slug: "ciencia-engenharia-dados",
        nome: "Ciência e Engenharia de Dados",
        ordem: 2,
        titulos: [
          { titulo: "Especialista em Dados" },
          { titulo: "Cientista de Dados" },
          { titulo: "Engenheiro de Dados" },
          { titulo: "Engenheiro de Analytics" },
        ],
      },
      {
        slug: "banco-dados",
        nome: "Banco de Dados",
        ordem: 3,
        titulos: [{ titulo: "DBA", sinonimos: ["Administrador de Banco de Dados"] }],
      },
      {
        slug: "people-rh",
        nome: "People Analytics",
        ordem: 4,
        titulos: [
          { titulo: "People Analytics" },
          { titulo: "Data Analyst", sinonimos: ["Analista de Dados (RH)"] },
        ],
      },
      {
        slug: "estatistica",
        nome: "Estatística",
        ordem: 5,
        titulos: [{ titulo: "Estatístico" }],
      },
    ],
  },
  {
    slug: "desenvolvimento",
    nome: "Desenvolvimento de Software",
    titulosRaiz: ["Desenvolvimento", "Programação", "Software"],
    ordem: 2,
    palavrasChave: [],
    nichos: [
      {
        slug: "cargo-geral",
        nome: "Cargo geral",
        ordem: 1,
        titulos: [
          { titulo: "Desenvolvedor", sinonimos: ["Desenvolvedora"] },
          { titulo: "Programador", sinonimos: ["Programadora"] },
          { titulo: "Pessoa Desenvolvedora" },
          { titulo: "Analista Programador" },
          { titulo: "Analista Desenvolvedor" },
          { titulo: "Engenheiro de Software", sinonimos: ["Engenheira de Software"] },
        ],
      },
      {
        slug: "front-end",
        nome: "Front-end",
        ordem: 2,
        titulos: [
          { titulo: "Desenvolvedor Front-end", sinonimos: ["Front-end Developer"] },
        ],
      },
      {
        slug: "back-end",
        nome: "Back-end",
        ordem: 3,
        titulos: [
          { titulo: "Desenvolvedor Back-end", sinonimos: ["Backend Developer"] },
        ],
      },
      {
        slug: "full-stack",
        nome: "Full Stack",
        ordem: 4,
        titulos: [
          { titulo: "Desenvolvedor Full Stack", sinonimos: ["Fullstack"] },
        ],
      },
      {
        slug: "mobile",
        nome: "Mobile",
        ordem: 5,
        titulos: [
          { titulo: "Desenvolvedor Mobile" },
          { titulo: "Desenvolvedor React Native" },
          { titulo: "Desenvolvedor Flutter" },
        ],
      },
      {
        slug: "stack",
        nome: "Por linguagem / stack",
        ordem: 6,
        titulos: [
          { titulo: "Desenvolvedor Python" },
          { titulo: "Desenvolvedor Java" },
          { titulo: "Desenvolvedor .NET" },
          { titulo: "Desenvolvedor Node.js" },
          { titulo: "Desenvolvedor PHP" },
        ],
      },
      {
        slug: "web-frameworks",
        nome: "Web e frameworks",
        ordem: 7,
        titulos: [
          { titulo: "Desenvolvedor Web" },
          { titulo: "Desenvolvedor React" },
          { titulo: "Desenvolvedor Angular" },
          { titulo: "Desenvolvedor Vue" },
        ],
      },
    ],
  },
  {
    slug: "engenharia-software",
    nome: "Engenharia de Software e Arquitetura",
    titulosRaiz: ["Engenharia de Software", "Arquitetura"],
    ordem: 3,
    palavrasChave: [],
    nichos: [
      {
        slug: "engenharia",
        nome: "Engenharia",
        ordem: 1,
        titulos: [
          { titulo: "Engenheiro de Software", sinonimos: ["Engenheira de Software"] },
          { titulo: "Engenheiro de Sistemas", sinonimos: ["Engenheira de Sistemas"] },
          { titulo: "Engenheiro de Aplicação", sinonimos: ["Engenheira de Aplicação"] },
        ],
      },
      {
        slug: "arquitetura",
        nome: "Arquitetura",
        ordem: 2,
        titulos: [
          { titulo: "Arquiteto de Software", sinonimos: ["Arquiteta de Software"] },
          {
            titulo: "Arquiteto de Soluções",
            sinonimos: ["Arquiteta de Soluções"],
          },
        ],
      },
      {
        slug: "qualidade",
        nome: "Qualidade de Software",
        ordem: 3,
        titulos: [
          {
            titulo: "Engenheiro de Qualidade de Software",
            sinonimos: ["Engenheira de Qualidade de Software"],
          },
        ],
      },
      {
        slug: "embarcados",
        nome: "Embarcados e Firmware",
        ordem: 4,
        titulos: [
          { titulo: "Engenheiro de Firmware", sinonimos: ["Engenheira de Firmware"] },
          { titulo: "Engenheiro Embarcado", sinonimos: ["Engenheira Embarcada"] },
        ],
      },
      {
        slug: "lideranca-tecnica",
        nome: "Liderança técnica",
        ordem: 5,
        titulos: [
          { titulo: "Tech Lead" },
          { titulo: "Líder Técnico", sinonimos: ["Líder Técnica"] },
        ],
      },
    ],
  },
  {
    slug: "ia-ml",
    nome: "Inteligência Artificial e Machine Learning",
    titulosRaiz: ["Inteligência Artificial", "Machine Learning", "IA", "ML"],
    ordem: 4,
    palavrasChave: ["NLP", "LLM", "MLOps", "Deep Learning"],
    nichos: [
      {
        slug: "engenharia-ia",
        nome: "Engenharia de IA",
        ordem: 1,
        titulos: [
          {
            titulo: "Engenheiro de Inteligência Artificial",
            sinonimos: ["Engenheiro de IA", "Engenheira de IA"],
          },
          {
            titulo: "Engenheiro de Machine Learning",
            sinonimos: ["ML Engineer", "Engenheira de Machine Learning"],
          },
        ],
      },
      {
        slug: "ciencia-dados-ia",
        nome: "Ciência de Dados e IA",
        ordem: 2,
        titulos: [
          { titulo: "Cientista de Dados" },
          { titulo: "Analista de Dados e AI" },
        ],
      },
      {
        slug: "especialista-ia",
        nome: "Especialista",
        ordem: 3,
        titulos: [
          { titulo: "Especialista em IA" },
          { titulo: "Especialista em NLP" },
          { titulo: "Especialista em LLM" },
        ],
      },
      {
        slug: "mlops",
        nome: "MLOps",
        ordem: 4,
        titulos: [{ titulo: "MLOps Engineer" }],
      },
    ],
  },
];

async function main() {
  await prisma.vagaPalavraChave.deleteMany();
  await prisma.vagaTitulo.deleteMany();
  await prisma.vagaNicho.deleteMany();
  await prisma.vagaArea.deleteMany();
  await prisma.vagaSenioridade.deleteMany();

  for (const senioridade of SENIORIDADES) {
    await prisma.vagaSenioridade.create({ data: senioridade });
  }

  console.log(`${SENIORIDADES.length} níveis de senioridade cadastrados.`);

  for (const area of CATALOGO) {
    const areaRow = await prisma.vagaArea.create({
      data: {
        slug: area.slug,
        nome: area.nome,
        titulosRaiz: area.titulosRaiz,
        ordem: area.ordem,
        palavrasChave: {
          create: area.palavrasChave.map((termo) => ({ termo })),
        },
        nichos: {
          create: area.nichos.map((nicho) => ({
            slug: nicho.slug,
            nome: nicho.nome,
            ordem: nicho.ordem,
            titulos: {
              create: nicho.titulos.map(({ titulo, sinonimos = [] }) => ({
                titulo,
                sinonimos,
              })),
            },
          })),
        },
      },
    });

    console.log(`Área "${areaRow.nome}" cadastrada.`);
  }

  const [areas, nichos, titulos, palavras, senioridades] = await Promise.all([
    prisma.vagaArea.count(),
    prisma.vagaNicho.count(),
    prisma.vagaTitulo.count(),
    prisma.vagaPalavraChave.count(),
    prisma.vagaSenioridade.count(),
  ]);

  console.log(
    `Resumo: ${areas} áreas, ${nichos} nichos, ${titulos} títulos, ${senioridades} senioridades, ${palavras} palavras-chave.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
