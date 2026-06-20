# Role & Contexto

Você é um Arquiteto de Software Sênior especialista em Engenharia de Software Moderna, Arquitetura de Software Escalável (Clean Architecture/Hexagonal) e DevOps.
Sua missão é gerar toda a estrutura inicial e boilerplate de um novo projeto (Monorepo ou Polyrepo) com base nas definições de stack, arquitetura, padronização e infraestrutura fornecidas abaixo. Este projeto servirá como o "Template Base" (Boilerplate oficial) para futuras aplicações da empresa.

---

# 1. Tech Stack (Definição do Projeto)

O projeto deve ser configurado estritamente com as seguintes tecnologias:

{{TECH_STACK}}

---

# 2. Padronização de Código & Code Style

Sua tarefa é configurar e aplicar um padrão de estilização consistente em todo o projeto (Linting, Formatação e Convenções).

## Objetivos de Padronização

1. Configurar as ferramentas de Linting e Formatação para trabalharem em conjunto e sem conflitos.
2. Garantir que os arquivos gerados já sigam essas regras nativamente.
3. Configurar aliases de importação (Absolute Imports) para evitar caminhos relativos complexos (ex: `../../../../`).

## Regras de Estilo e Configurações Obrigatórias

{{CODE_STYLE_CONFIGS}}

---

# 3. Diretrizes de Arquitetura & Padrões

Aplique os padrões arquiteturais descritos abaixo, focando em manutenibilidade, testabilidade e escalabilidade, evitando over-engineering.

- **Padrão Arquitetural:** {{ARCHITECTURE_PATTERN}}
- **Organização de Pastas:** {{FOLDER_ORGANIZATION_STYLE}} (Ex: Orientada a Domínio/Feature, em Camadas, etc.)
- **Regras de Negócio:** Isoladas de frameworks, ORMs e bibliotecas externas.
- **Regras de Infraestrutura:** Adaptadores, drivers e integrações externas devem ser facilmente substituíveis.
- **Regras de Negócio Específicas (SaaS/Multitenancy):** {{BUSINESS_RULES_CONTEXT}}

---

# 4. DevOps & Containerização

O projeto deve estar pronto para rodar localmente e em ambientes de staging/produção utilizando containers.

## Requisitos de Infraestrutura:

- Configuração de ambiente de desenvolvimento isolado e reprodutível.
- Orquestração de serviços dependentes (bancos de dados, caches, etc.).
- Otimização de builds do Docker (Multi-stage builds) para manter as imagens de produção leves e seguras.

{{DEVOPS_CONFIGS}}

---

# 5. Estrutura de Pastas e Boilerplate Requerido

Gere a árvore de diretórios, os arquivos de configuração essenciais (`package.json`, arquivos do linter, tsconfig, etc.) e os arquivos base estruturais.

## Estrutura Global de Referência (`src/` ou Raiz)

{{GLOBAL_FOLDER_TREE}}

## Estrutura Interna por Módulo/Feature/Componente

{{MODULE_FOLDER_TREE}}

---

# 6. Tarefas Solicitadas (Deliverables)

1. **Configuração de Ambiente:** Gere todos os arquivos de configuração de ferramentas (Linters, Formatadores, Compiladores, Bundlers, Testes).
2. **Infraestrutura como Código Local:** Gere os `Dockerfiles` necessários e o `docker-compose.yml` funcional para erguer o ecossistema local com um único comando.
3. **Scaffolding de Pastas:** Crie a estrutura de pastas vazia ou com arquivos `README.md`/`.gitkeep` para representação.
4. **Código Boilerplate Implementado:** Crie um exemplo funcional de "ponta a ponta" (ex: um módulo de Saúde/Ping ou Usuários) aplicando a arquitetura solicitada, incluindo:
   - Definição de entidade/schema.
   - Caso de uso (Use Case) ou lógica de negócio.
   - Controller / Handler / Camada de apresentação.
   - Um teste unitário e um teste de integração base de exemplo.

---

# VARIÁVEIS DO PROJETO (Preencha antes de enviar)

Substitua os blocos abaixo com as especificações do projeto atual:

### {{TECH_STACK}}

- **Backend Framework/Language:** NestJS (TypeScript)
- **Backend ORM & Database:** Drizzle ORM com PostgreSQL (Estratégia de Schema por Tenant)
- **Validation:** Zod
- **Backend Testing:** Vitest
- **API Documentation:** Swagger (@nestjs/swagger)
- **Frontend Framework/Language:** Next.js App Router (TypeScript)
- **Frontend Styling & Testing:** Tailwind CSS e Vitest

### {{CODE_STYLE_CONFIGS}}

- **Prettier:** singleQuote: true, semi: false, trailingComma: 'all', tabWidth: 2, printWidth: 100, arrowParens: 'always'.
- **ESLint:** Proibir ponto e vírgula, forçar aspas simples, e forçar imports de tipo explícitos (`import type`).
- **Path Aliases:** Configurar `@/*` apontando para `src/*` no TypeScript e garantir que o ecossistema (testes/compilador) o reconheça.

### {{ARCHITECTURE_PATTERN}}

"Clean Architecture pragmática com isolamento estrito de regras de negócio. O isolamento de dados do SaaS Multi-Tenant deve ser previsto na camada de banco de dados (Drizzle) e passado via contexto/interceptors."

### {{FOLDER_ORGANIZATION_STYLE}}

"Orientada a Domínio (Domain-Driven / Feature-Driven)."

### {{BUSINESS_RULES_CONTEXT}}

"SaaS Multi-Tenant isolado por Schema do PostgreSQL. A aplicação deve identificar o tenant (via subdomínio ou header) e injetar a conexão correta do Drizzle para aquele schema."

### {{DEVOPS_CONFIGS}}

- **Dockerfiles:** Criar Dockerfiles otimizados usando Multi-stage build (build / runner) para o Backend (NestJS) e Frontend (Next.js), utilizando imagens Node Alpine.
- **Docker Compose:** Criar um `docker-compose.yml` que configure:
  1. O banco de dados PostgreSQL (com healthcheck para garantir que o banco está pronto antes da app subir).
  2. O serviço do Backend (conectado ao Postgres, rodando em modo de desenvolvimento com live-reload ou produção conforme a env).
  3. O serviço do Frontend (conectado ao Backend).
  4. Gerenciamento de volumes para persistência de dados do PostgreSQL.

### {{GLOBAL_FOLDER_TREE}}

```text
. (raiz do projeto)
├── apps/ or src/
│   ├── backend/          # Caso opte por monorepo, ou estrutura direta se for polyrepo
│   │   ├── src/
│   │   │   ├── modules/          # Domínios/Features da aplicação
│   │   │   ├── shared/           # Recursos compartilhados (Erros, DTOs genéricos)
│   │   │   ├── infrastructure/   # Adaptadores HTTP, interceptors, guards
│   │   │   ├── database/         # Configurações do Drizzle, schemas e migrations
│   │   │   └── auth/             # Módulo de autenticação
│   │   ├── Dockerfile
│   │   └── ...
│   └── frontend/
│       ├── src/
│       ├── Dockerfile
│       └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```

### {{MODULE_FOLDER_TREE}}

```text
module-name/
├── domain/           # Entidades, agregados, regras de negócio puras e interfaces de repositórios
├── application/      # Casos de uso (Use Cases) e DTOs de entrada/saída
├── infrastructure/   # Implementação de repositórios (Drizzle), serviços externos, mapeadores
├── presentation/     # Controllers (NestJS), resolvers ou handlers HTTP
└── tests/            # Testes unitários e de integração específicos do módulo
```
