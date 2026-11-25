/** Single source of truth for project data (cards, reel, posters, skills). Every number is verified in the repos. */

export type Project = {
  id: string;
  name: string;
  year: string;
  /** e.g. "Team project · 3 people · Web" */
  kind: string;
  value: string;
  checks: string[];
  stack: string[];
  /** extra stack items not shown as chips */
  more?: number;
  links: { label: string; href: string }[];
  private?: boolean;
  featured?: boolean;
  /** pending note shown in the design as [PENDIENTE] */
  pending?: string;
};

export const PROJECTS: Project[] = [
  {
    id: 'cp', name: 'CelularPro', year: '2026', kind: 'Team project · 3 people · Web', featured: true,
    value: 'Online store for new, refurbished and verified used phones that tackles distrust in the used market with verified technical inspection. I built five admin and catalog features and owned their quality.',
    checks: ['415 unit', '32 e2e', '32 visual', 'axe a11y'],
    stack: ['React', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL'], more: 8,
    links: [{ label: 'Web code', href: 'https://github.com/Santiago-mg/celularpro-web' }, { label: 'API code', href: 'https://github.com/Santiago-mg/celularpro-api' }],
    pending: 'captura · tienda, catálogo y ficha',
  },
  {
    id: 'oc', name: 'OpenCart QA', year: '2026', kind: 'Team project · 2 people · QA & security', featured: true,
    value: 'Quality, security and CI/CD on OpenCart 4.1.0.3, a widely used open-source PHP e-commerce platform — with real defects fixed in its code.',
    checks: ['534 tests', '37 defects fixed', 'Quality Gate passed'],
    stack: ['PHP', 'PHPUnit', 'Vitest', 'Serenity/JS', 'Jenkins'], more: 5,
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/opencart' }],
    pending: 'captura · SonarQube con Quality Gate aprobado',
  },
  {
    id: 'lf', name: 'LandingForge', year: '2026', kind: 'Team project · 2 people · Web + generative AI', featured: true, private: true,
    value: 'Turns one product photo into the full visual kit of an e-commerce landing page — brand palette, conversion copy and per-section art prompts — streamed from Google Gemini.',
    checks: ['66 e2e', 'WCAG contrast', 'API key never in bundle'],
    stack: ['Next.js', 'TypeScript', 'Tailwind v4', 'Gemini', 'Playwright'], more: 4,
    links: [],
    pending: 'video de la portada · permiso del compañero',
  },
  {
    id: 'ep', name: 'EstadiaPro', year: '2026', kind: 'Web · Full-stack', featured: true,
    value: 'Airbnb-style stays platform with traveler, host and admin roles: three isolated layers, each in its own Docker image, and a dynamic pricing engine.',
    checks: ['3 Docker images', 'K8s manifests', 'Jest · bookings'],
    stack: ['Express', 'Sequelize', 'MySQL 8', 'Pug', 'Kubernetes'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/estadiapro' }],
    pending: 'captura · dashboard de administración',
  },
  {
    id: 'mb', name: 'Mi Boleta', year: '2026', kind: 'Frontend · React', featured: true,
    value: 'SPA to log lottery tickets, raffles and draws — amount, place, date and result — with charts and an admin module.',
    checks: ['JWT routes', 'Zod forms', '1,000+ seed rows'],
    stack: ['React', 'TypeScript', 'Vite', 'RHF + Zod'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/Mi-boleta' }],
    pending: 'captura · estadísticas',
  },
  {
    id: 'mv', name: 'Movies', year: '2026', kind: 'Flutter · Mobile + web', featured: true,
    value: 'Explore films and keep personal notes and ratings that work offline and sync to the cloud once you are back online.',
    checks: ['offline-first', 'pendingSync retry', '4 platforms'],
    stack: ['Flutter', 'Dart', 'Drift', 'Firestore'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/movies-drift-firebase' }],
    pending: 'captura · Android y web',
  },
  {
    id: 're', name: 'Real Estate API', year: 'May 2026', kind: 'Backend · REST API',
    value: 'REST API with Clean Architecture · Express · Sequelize · PostgreSQL (Supabase) · JWT',
    checks: ['Clean Architecture', 'JWT', 'Joi'], stack: ['Express', 'Sequelize', 'PostgreSQL'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/real-estate-api' }],
  },
  {
    id: 'dv', name: 'Dream Vacation', year: 'Apr 2026', kind: 'Full-stack · DevOps',
    value: 'React + Express + MySQL · a GitHub Actions matrix publishes both images to Docker Hub',
    checks: ['GitHub Actions', 'Docker Hub'], stack: ['React', 'Express', 'MySQL'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/dream-vacation-app' }],
  },
  {
    id: 'pc', name: 'Spring PetClinic', year: 'DevOps lab', kind: 'DevOps lab',
    value: 'Jenkins pipeline that builds and publishes the Docker image',
    checks: ['Jenkins', 'Docker'], stack: ['Java', 'Jenkins', 'Docker'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/spring-petclinic' }],
  },
  {
    id: 'kn', name: 'Knote', year: 'DevOps lab', kind: 'DevOps lab',
    value: 'Spring Boot refactored to stateless · Docker Hub · Kubernetes',
    checks: ['stateless', 'Kubernetes'], stack: ['Spring Boot', 'Docker', 'Kubernetes'],
    links: [{ label: 'Code', href: 'https://github.com/Santiago-mg/knote' }],
  },
  {
    id: 'early', name: 'Where I started', year: '2024–25 · Private', kind: 'Early work',
    value: 'Payroll system (Python, MVC, 3 UIs) · Battleship (Kivy) · Bookings (FastAPI + Supabase)',
    checks: ['MVC', 'unit tests'], stack: ['Python', 'Kivy', 'FastAPI'],
    links: [], private: true,
  },
];

export const FEATURED = PROJECTS.filter((p) => p.featured);
export const MORE = PROJECTS.filter((p) => !p.featured);
