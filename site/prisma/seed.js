/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { TECNOLOGIA_VERTENTES } = require("./tecnologiaCatalogoData");

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
          {
            titulo: "Analista de Dados",
            sinonimos: [
              "Data Analyst",
              "Analista de Análise de Dados",
              "Assistente de Dados",
              "Assistente de Análise de Dados",
              "Estagiário de Dados",
              "Estagiária de Dados",
              "Estágio em Dados",
              "Estágio em Análise de Dados",
              "Estagiário em Análise de Dados",
              "MIS",
              "Analista MIS",
              "Assistente de Informações Gerenciais",
              "Analista de Informações Gerenciais",
            ],
          },
          {
            titulo: "Analista de BI",
            sinonimos: [
              "Business Intelligence",
              "Analista de Business Intelligence",
              "BI Analyst",
              "Analista BI",
              "Estágio em BI",
              "Estagiário de BI",
            ],
          },
          {
            titulo: "Analista de Data Analytics",
            sinonimos: ["Data Analytics", "Analytics Analyst", "Analista de Analytics"],
          },
          {
            titulo: "Analista de Inteligência de Dados",
            sinonimos: ["Inteligência de Dados", "Data Intelligence"],
          },
          {
            titulo: "Analista de Inteligência de Negócios",
            sinonimos: [
              "Inteligência de Negócios",
              "Business Intelligence Analyst",
              "Analista de Inteligência Comercial",
            ],
          },
          {
            titulo: "Analista de Performance",
            sinonimos: ["Performance Analyst", "Analista de Performance de Dados"],
          },
          {
            titulo: "Analista de Planejamento de Dados",
            sinonimos: [
              "Planejamento",
              "Analista de Planejamento",
              "Assistente de Planejamento",
              "Estágio em Planejamento",
            ],
          },
          {
            titulo: "Analista ETL",
            sinonimos: ["ETL Developer", "Analista de Integração de Dados"],
          },
          {
            titulo: "Analista de Banco de Dados",
            sinonimos: ["Database Analyst", "Analista de BD"],
          },
          {
            titulo: "Analista Estatístico de Dados",
            sinonimos: ["Analista Estatístico", "Statistical Analyst"],
          },
          {
            titulo: "Analista de TI e Dados",
            sinonimos: ["Analista de TI", "Analista de Sistemas e Dados"],
          },
        ],
      },
      {
        slug: "ciencia-engenharia-dados",
        nome: "Ciência e Engenharia de Dados",
        ordem: 2,
        titulos: [
          {
            titulo: "Especialista em Dados",
            sinonimos: ["Data Specialist", "Especialista de Dados"],
          },
          {
            titulo: "Cientista de Dados",
            sinonimos: ["Data Scientist", "Cientista de Data"],
          },
          {
            titulo: "Engenheiro de Dados",
            sinonimos: [
              "Data Engineer",
              "Engenheira de Dados",
              "Estágio em Engenharia de Dados",
              "Programa de Estágio - Engenharia de Dados",
            ],
          },
          {
            titulo: "Engenheiro de Analytics",
            sinonimos: ["Analytics Engineer", "Engenheira de Analytics"],
          },
        ],
      },
      {
        slug: "banco-dados",
        nome: "Banco de Dados",
        ordem: 3,
        titulos: [
          {
            titulo: "DBA",
            sinonimos: [
              "Administrador de Banco de Dados",
              "Administradora de Banco de Dados",
              "Database Administrator",
            ],
          },
        ],
      },
      {
        slug: "people-rh",
        nome: "People Analytics",
        ordem: 4,
        titulos: [
          {
            titulo: "People Analytics",
            sinonimos: [
              "Analista de People Analytics",
              "Estágio People Analytics",
              "HR Analytics",
              "Analista de RH e Dados",
            ],
          },
          {
            titulo: "Data Analyst",
            sinonimos: ["Analista de Dados (RH)", "People Data Analyst"],
          },
        ],
      },
      {
        slug: "estatistica",
        nome: "Estatística",
        ordem: 5,
        titulos: [
          {
            titulo: "Estatístico",
            sinonimos: ["Estatística", "Statistician", "Analista Estatístico"],
          },
        ],
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
          {
            titulo: "Desenvolvedor",
            sinonimos: [
              "Desenvolvedora",
              "Developer",
              "Dev",
              "Estágio em Desenvolvimento",
              "Estagiário de Desenvolvimento",
              "Estagiário de TI",
            ],
          },
          {
            titulo: "Programador",
            sinonimos: ["Programadora", "Programmer", "Estágio em Programação"],
          },
          {
            titulo: "Pessoa Desenvolvedora",
            sinonimos: ["Pessoa Desenvolvedor", "Pessoa Dev"],
          },
          {
            titulo: "Analista Programador",
            sinonimos: ["Analista Programadora", "Analista de Sistemas Programador"],
          },
          {
            titulo: "Analista Desenvolvedor",
            sinonimos: ["Analista Desenvolvedora", "Analista de Desenvolvimento"],
          },
          {
            titulo: "Engenheiro de Software",
            sinonimos: ["Engenheira de Software", "Software Engineer", "SWE"],
          },
        ],
      },
      {
        slug: "front-end",
        nome: "Front-end",
        ordem: 2,
        titulos: [
          {
            titulo: "Desenvolvedor Front-end",
            sinonimos: [
              "Front-end Developer",
              "Frontend Developer",
              "Frontend",
              "Front end",
              "Desenvolvedor Frontend",
            ],
          },
        ],
      },
      {
        slug: "back-end",
        nome: "Back-end",
        ordem: 3,
        titulos: [
          {
            titulo: "Desenvolvedor Back-end",
            sinonimos: [
              "Backend Developer",
              "Back-end Developer",
              "Backend",
              "Back end",
              "Desenvolvedor Backend",
            ],
          },
        ],
      },
      {
        slug: "full-stack",
        nome: "Full Stack",
        ordem: 4,
        titulos: [
          {
            titulo: "Desenvolvedor Full Stack",
            sinonimos: [
              "Fullstack",
              "Full-stack",
              "Full Stack Developer",
              "Fullstack Developer",
              "Desenvolvedor Fullstack",
            ],
          },
        ],
      },
      {
        slug: "mobile",
        nome: "Mobile",
        ordem: 5,
        titulos: [
          {
            titulo: "Desenvolvedor Mobile",
            sinonimos: ["Mobile Developer", "Desenvolvedor de Aplicativos"],
          },
          {
            titulo: "Desenvolvedor React Native",
            sinonimos: ["React Native Developer"],
          },
          {
            titulo: "Desenvolvedor Flutter",
            sinonimos: ["Flutter Developer"],
          },
        ],
      },
      {
        slug: "stack",
        nome: "Por linguagem / stack",
        ordem: 6,
        titulos: [
          { titulo: "Desenvolvedor Python", sinonimos: ["Python Developer", "Dev Python"] },
          { titulo: "Desenvolvedor Java", sinonimos: ["Java Developer", "Dev Java"] },
          { titulo: "Desenvolvedor .NET", sinonimos: [".NET Developer", "C# Developer", "Dev .NET"] },
          { titulo: "Desenvolvedor Node.js", sinonimos: ["Node.js Developer", "Node Developer"] },
          { titulo: "Desenvolvedor PHP", sinonimos: ["PHP Developer"] },
        ],
      },
      {
        slug: "web-frameworks",
        nome: "Web e frameworks",
        ordem: 7,
        titulos: [
          { titulo: "Desenvolvedor Web", sinonimos: ["Web Developer"] },
          { titulo: "Desenvolvedor React", sinonimos: ["React Developer", "Dev React"] },
          { titulo: "Desenvolvedor Angular", sinonimos: ["Angular Developer"] },
          { titulo: "Desenvolvedor Vue", sinonimos: ["Vue Developer", "Vue.js Developer"] },
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
          {
            titulo: "Engenheiro de Software",
            sinonimos: ["Engenheira de Software", "Software Engineer"],
          },
          {
            titulo: "Engenheiro de Sistemas",
            sinonimos: ["Engenheira de Sistemas", "Systems Engineer"],
          },
          {
            titulo: "Engenheiro de Aplicação",
            sinonimos: ["Engenheira de Aplicação", "Application Engineer"],
          },
        ],
      },
      {
        slug: "arquitetura",
        nome: "Arquitetura",
        ordem: 2,
        titulos: [
          {
            titulo: "Arquiteto de Software",
            sinonimos: ["Arquiteta de Software", "Software Architect"],
          },
          {
            titulo: "Arquiteto de Soluções",
            sinonimos: ["Arquiteta de Soluções", "Solutions Architect"],
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
            sinonimos: [
              "Engenheira de Qualidade de Software",
              "QA Engineer",
              "Analista de QA",
              "Analista de Qualidade",
              "Quality Assurance",
            ],
          },
        ],
      },
      {
        slug: "embarcados",
        nome: "Embarcados e Firmware",
        ordem: 4,
        titulos: [
          {
            titulo: "Engenheiro de Firmware",
            sinonimos: ["Engenheira de Firmware", "Firmware Engineer"],
          },
          {
            titulo: "Engenheiro Embarcado",
            sinonimos: ["Engenheira Embarcada", "Embedded Engineer"],
          },
        ],
      },
      {
        slug: "lideranca-tecnica",
        nome: "Liderança técnica",
        ordem: 5,
        titulos: [
          {
            titulo: "Tech Lead",
            sinonimos: ["Technical Lead", "Líder de Tecnologia"],
          },
          {
            titulo: "Líder Técnico",
            sinonimos: ["Líder Técnica", "Team Lead"],
          },
        ],
      },
    ],
  },
  {
    slug: "marketing-growth",
    nome: "Marketing e Growth",
    titulosRaiz: [
      "Marketing",
      "Growth",
      "Performance",
      "Mídia",
      "Marketing Digital",
      "Tráfego",
      "Social Media",
    ],
    ordem: 4,
    palavrasChave: [
      "Google Ads",
      "Meta Ads",
      "GA4",
      "GTM",
      "SEO",
      "Growth",
      "CRM",
      "Social Media",
      "E-commerce",
      "Shopify",
      "VTEX",
    ],
    nichos: [
      {
        slug: "cargo-geral",
        nome: "Cargo geral",
        ordem: 1,
        titulos: [
          {
            titulo: "Analista de Marketing",
            sinonimos: ["Marketing Analyst", "Estágio em Marketing", "Estagiário de Marketing"],
          },
          {
            titulo: "Assistente de Marketing",
            sinonimos: ["Assistente de Marketing Digital", "Auxiliar de Marketing"],
          },
          {
            titulo: "Profissional de Marketing",
            sinonimos: ["Marketing Professional"],
          },
          {
            titulo: "Especialista em Marketing",
            sinonimos: ["Marketing Specialist"],
          },
          {
            titulo: "Coordenador de Marketing",
            sinonimos: ["Coordenadora de Marketing", "Marketing Coordinator"],
          },
          {
            titulo: "Gerente de Marketing",
            sinonimos: ["Gerente de Marketing Digital", "Marketing Manager"],
          },
          {
            titulo: "Consultor de Marketing",
            sinonimos: ["Consultora de Marketing", "Marketing Consultant"],
          },
        ],
      },
      {
        slug: "marketing-digital",
        nome: "Marketing digital",
        ordem: 2,
        titulos: [
          {
            titulo: "Analista de Marketing Digital",
            sinonimos: [
              "Digital Marketing Analyst",
              "Estágio em Marketing Digital",
              "Estagiário de Marketing Digital",
            ],
          },
          {
            titulo: "Especialista em Marketing Digital",
            sinonimos: ["Digital Marketing Specialist"],
          },
          {
            titulo: "Coordenador de Marketing Digital",
            sinonimos: ["Coordenadora de Marketing Digital", "Digital Marketing Coordinator"],
          },
        ],
      },
      {
        slug: "performance",
        nome: "Performance / mídia paga",
        ordem: 3,
        titulos: [
          {
            titulo: "Analista de Performance",
            sinonimos: ["Performance Marketing", "Analista de Performance Digital"],
          },
          {
            titulo: "Analista de Mídia",
            sinonimos: ["Media Analyst", "Analista de Mídia Paga"],
          },
          {
            titulo: "Gestor de Tráfego",
            sinonimos: ["Gestora de Tráfego", "Traffic Manager", "Gestor de Tráfego Pago"],
          },
          {
            titulo: "Especialista em Mídia Paga",
            sinonimos: ["Paid Media Specialist", "Especialista em Ads"],
          },
          {
            titulo: "Especialista em Tráfego Pago",
            sinonimos: ["Paid Traffic Specialist"],
          },
          {
            titulo: "Media Buyer",
            sinonimos: ["Comprador de Mídia", "Media Buyer Google Ads", "Meta Ads Buyer"],
          },
        ],
      },
      {
        slug: "growth",
        nome: "Growth",
        ordem: 4,
        titulos: [
          {
            titulo: "Analista de Growth",
            sinonimos: ["Growth Analyst", "Estágio em Growth"],
          },
          {
            titulo: "Growth Marketing Manager",
            sinonimos: ["Gerente de Growth", "Growth Manager"],
          },
          {
            titulo: "Especialista em Growth",
            sinonimos: ["Growth Specialist"],
          },
          {
            titulo: "Growth Hacker",
            sinonimos: ["Growth Hacking"],
          },
        ],
      },
      {
        slug: "social-media",
        nome: "Social media",
        ordem: 5,
        titulos: [
          {
            titulo: "Analista de Social Media",
            sinonimos: ["Social Media Analyst", "Estágio em Social Media"],
          },
          {
            titulo: "Social Media",
            sinonimos: ["Social Media Manager", "Assistente de Social Media"],
          },
          {
            titulo: "Community Manager",
            sinonimos: ["Gestor de Comunidade", "Gestora de Comunidade"],
          },
          {
            titulo: "Especialista em Redes Sociais",
            sinonimos: ["Specialist Social Media"],
          },
        ],
      },
      {
        slug: "conteudo",
        nome: "Conteúdo",
        ordem: 6,
        titulos: [
          {
            titulo: "Analista de Conteúdo",
            sinonimos: ["Content Analyst", "Estágio em Conteúdo"],
          },
          {
            titulo: "Redator de Marketing",
            sinonimos: ["Redatora de Marketing", "Copywriter"],
          },
          {
            titulo: "Content Marketing",
            sinonimos: ["Marketing de Conteúdo", "Content Marketer"],
          },
          {
            titulo: "Especialista em Conteúdo Digital",
            sinonimos: ["Digital Content Specialist"],
          },
        ],
      },
      {
        slug: "crm-retencao",
        nome: "CRM e retenção",
        ordem: 7,
        titulos: [
          {
            titulo: "Analista de CRM",
            sinonimos: ["CRM Analyst", "Estágio em CRM"],
          },
          {
            titulo: "Especialista em CRM",
            sinonimos: ["CRM Specialist"],
          },
          {
            titulo: "Analista de Retenção",
            sinonimos: ["Retention Analyst"],
          },
          {
            titulo: "Analista de Relacionamento com Cliente",
            sinonimos: ["Customer Success Analyst", "Analista de Relacionamento"],
          },
        ],
      },
      {
        slug: "ecommerce",
        nome: "E-commerce",
        ordem: 8,
        titulos: [
          {
            titulo: "Analista de E-commerce",
            sinonimos: ["E-commerce Analyst", "Analista de Ecommerce", "Estágio em E-commerce"],
          },
          {
            titulo: "Especialista em E-commerce",
            sinonimos: ["E-commerce Specialist"],
          },
          {
            titulo: "Analista de Marketplace",
            sinonimos: ["Marketplace Analyst"],
          },
        ],
      },
      {
        slug: "seo",
        nome: "SEO",
        ordem: 9,
        titulos: [
          {
            titulo: "Analista de SEO",
            sinonimos: ["SEO Analyst", "Estágio em SEO"],
          },
          {
            titulo: "Especialista em SEO",
            sinonimos: ["SEO Specialist"],
          },
          {
            titulo: "Consultor de SEO",
            sinonimos: ["Consultora de SEO", "SEO Consultant"],
          },
        ],
      },
      {
        slug: "branding",
        nome: "Branding",
        ordem: 10,
        titulos: [
          {
            titulo: "Analista de Branding",
            sinonimos: ["Brand Analyst", "Analista de Marca"],
          },
          {
            titulo: "Especialista em Branding",
            sinonimos: ["Brand Specialist"],
          },
          {
            titulo: "Analista de Comunicação",
            sinonimos: ["Communication Analyst", "Estágio em Comunicação"],
          },
        ],
      },
    ],
  },
  {
    slug: "ia-ml",
    nome: "Inteligência Artificial e Machine Learning",
    titulosRaiz: ["Inteligência Artificial", "Machine Learning", "IA", "ML"],
    ordem: 5,
    palavrasChave: ["NLP", "LLM", "MLOps", "Deep Learning"],
    nichos: [
      {
        slug: "engenharia-ia",
        nome: "Engenharia de IA",
        ordem: 1,
        titulos: [
          {
            titulo: "Engenheiro de Inteligência Artificial",
            sinonimos: [
              "Engenheiro de IA",
              "Engenheira de IA",
              "AI Engineer",
              "Artificial Intelligence Engineer",
            ],
          },
          {
            titulo: "Engenheiro de Machine Learning",
            sinonimos: [
              "ML Engineer",
              "Engenheira de Machine Learning",
              "Machine Learning Engineer",
            ],
          },
        ],
      },
      {
        slug: "ciencia-dados-ia",
        nome: "Ciência de Dados e IA",
        ordem: 2,
        titulos: [
          {
            titulo: "Cientista de Dados",
            sinonimos: ["Data Scientist", "Cientista de Dados e IA"],
          },
          {
            titulo: "Analista de Dados e AI",
            sinonimos: ["Analista de Dados e IA", "AI Data Analyst"],
          },
        ],
      },
      {
        slug: "especialista-ia",
        nome: "Especialista",
        ordem: 3,
        titulos: [
          {
            titulo: "Especialista em IA",
            sinonimos: ["AI Specialist", "Especialista em Inteligência Artificial"],
          },
          {
            titulo: "Especialista em NLP",
            sinonimos: ["NLP Specialist", "Natural Language Processing"],
          },
          {
            titulo: "Especialista em LLM",
            sinonimos: ["LLM Specialist", "Large Language Models"],
          },
        ],
      },
      {
        slug: "mlops",
        nome: "MLOps",
        ordem: 4,
        titulos: [
          {
            titulo: "MLOps Engineer",
            sinonimos: ["Engenheiro de MLOps", "Engenheira de MLOps", "ML Ops"],
          },
        ],
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

  await prisma.tecnologiaItem.deleteMany();
  await prisma.tecnologiaVertente.deleteMany();

  let totalItens = 0;
  for (const vertente of TECNOLOGIA_VERTENTES) {
    const row = await prisma.tecnologiaVertente.create({
      data: {
        slug: vertente.slug,
        nome: vertente.nome,
        ordem: vertente.ordem,
        itens: {
          create: vertente.itens.map((item, index) => ({
            slug: item.slug,
            nome: item.nome,
            categoria: item.categoria ?? "",
            ordem: item.ordem ?? index + 1,
            segmentosCv: item.segmentosCv ?? [],
          })),
        },
      },
    });
    totalItens += vertente.itens.length;
    console.log(`Vertente "${row.nome}" — ${vertente.itens.length} tecnologias.`);
  }

  const [vertentes, itens] = await Promise.all([
    prisma.tecnologiaVertente.count(),
    prisma.tecnologiaItem.count(),
  ]);
  console.log(`Catálogo de tecnologias: ${vertentes} vertentes, ${itens} itens (${totalItens} no seed).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
