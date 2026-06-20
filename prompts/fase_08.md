Act as a Staff Software Engineer and Financial Systems Architect.

Your task is to fully implement the **CMS**, **Registrations**, and **Payments** modules inside our NestJS backend workspace. These modules govern the portal execution, team onboarding pipeline, and cash flow operations of our sports SaaS platform.

You must strictly follow **Clean Architecture** rules. All tables, files (receipts, legal documents), and database transactions must live inside the active, dynamic **Tenant Schema** managed by our `TenantConnectionManager`. Financial integrations must be completely abstract, utilizing the Gateway pattern to avoid direct coupling with specific payment providers.

### Domain & Business Specifications:

#### 1. CMS Module (Gestão de Conteúdo do Portal do Campeonato)

- **Notícias:** CRUD for articles supporting markdown/html content, draft/published states, categories, and cover images.
- **Galerias:** Album structure containing multiple images with descriptions, tags, and cloud URLs.
- **Vídeos:** Storage for video metadata, embedding configurations (YouTube, Vimeo, or direct storage links), and descriptions.

#### 2. Registrations Module (Esteira de Inscrições de Equipes)

- **Inscrições:** Pipeline for public or private team applications to a specific championship category.
- **Upload de Documentos:** Document management system supporting compliance workflows (e.g., medical certificates, identity cards for players, payment receipts). Must support structural states: `PENDENTE`, `EM_ANALISE`, `APROVADO`, `REJEITADO` (with rejection reason).
- **Aprovação Workflow:** Use Cases for league administrators to approve or reject whole team applications or specific player registrations based on their document status.

#### 3. Payments Module (Módulo Financeiro e Infraestrutura de Pagamentos)

- **Categorização de Receitas:** Track and report income split into: `INSCRICAO` (Championship entry fees), `PATROCINIO` (Sponsorship packages), and `RECEITA_AVULSA` (Fine collections, merchandise, etc.).
- **Gateway Architecture:** Create a generic `IPaymentGateway` interface prepared to support core payment methods natively:
  - **PIX:** Dynamic QR Code and Copy/Paste string generation with short TTL (e.g., 30 minutes).
  - **Boleto:** PDF invoice generation and barcode strings.
  - **Cartão de Crédito:** Secure tokenized payload processing supporting immediate capturing, split payments, or refunding workflows.
- **Transaction States:** Strict state machine tracking: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUNDED`.

### Directory Structure & Code Files to Generate:

Create the following modular architecture files under `src/modules/business_ops/` (or matching our current subfolder distribution structure):

```text
src/modules/cms/
├── domain/
│   ├── entities/          # Article, Gallery, MediaAsset, Video
│   └── repositories/      # IArticleRepository, IMediaRepository
└── presentation/          # Controllers for public-facing tournament website widgets

src/modules/registrations/
├── domain/
│   ├── entities/          # RegistrationRequest, RegistrationDocument
│   └── repositories/      # IRegistrationRepository
└── application/use-cases/ # SubmitRegistrationUseCase, ReviewDocumentUseCase, ApproveTeamUseCase

src/modules/payments/
├── domain/
│   ├── entities/          # Transaction, LedgerEntry, PaymentMethod (Value Object)
│   ├── gateways/          # IPaymentGateway (Core clean contract interface)
│   └── repositories/      # ITransactionRepository
├── application/use-cases/ # CreatePaymentOrderUseCase, ProcessWebhookUseCase, RefundTransactionUseCase
├── infrastructure/
│   └── adapters/          # MockPaymentGatewayAdapter.ts (Simulating PIX/Boleto responses)
└── presentation/
    ├── controllers/       # PaymentsController (Checkout and user actions)
    └── webhooks/          # PaymentWebhooksController (Public provider callbacks - dynamic tenant resolving)
```
