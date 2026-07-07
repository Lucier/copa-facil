# Runbook de Operações — Cerrados Esportes

## 1. Bootstrap Guide (Ambiente Local)

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Docker     | 24+           |
| Docker Compose | v2.20+   |
| pnpm       | 9+            |
| Node.js    | 22+           |

### Subindo o stack completo

```sh
# 1. Clone e entre no diretório
git clone https://github.com/seu-org/cerrados-esportes.git
cd cerrados-esportes

# 2. Copie o arquivo de ambiente
cp .env.example .env
# Edite .env se necessário (valores de dev funcionam out-of-the-box)

# 3. Suba os serviços de infraestrutura (Postgres, Redis, MinIO)
docker compose up -d postgres redis minio minio-init

# Aguarde o healthcheck do minio-init completar antes de prosseguir:
docker compose logs minio-init --follow

# 4. Instale as dependências do monorepo
pnpm install

# 5. Execute as migrações do banco
pnpm --filter backend db:migrate

# 6. Inicie backend e frontend em modo dev (hot-reload)
pnpm --filter backend dev   # terminal 1 → http://localhost:3001
pnpm --filter frontend dev  # terminal 2 → http://localhost:3000
```

### Ativando a Stack de Observabilidade

```sh
docker compose --profile monitoring up -d

# URLs disponíveis:
# Grafana    → http://localhost:3002  (admin / admin)
# Prometheus → http://localhost:9090
# MinIO UI   → http://localhost:9001  (minioadmin / minioadmin123)
```

### Verificação da Camada Nginx (Wildcard de Tenant)

Em produção, o Nginx extrai o tenant do subdomínio:

```
equipe-gaucha.cerrados-esportes.com.br → X-Tenant-ID: equipe-gaucha
```

Para testar localmente sem DNS wildcard, passe o header manualmente:

```sh
# Teste de health com tenant explícito
curl http://localhost:3001/api/v1/health \
  -H "x-tenant-id: meu-clube"

# Em produção (com Nginx rodando)
curl http://meu-clube.cerrados-esportes.com.br/api/v1/health
```

Para simular o roteamento Nginx localmente:

```sh
docker compose -f docker-compose.prod.yml up -d nginx

# Adicione uma entrada no /etc/hosts para testar:
echo "127.0.0.1 meu-clube.cerrados-esportes.local" | sudo tee -a /etc/hosts
curl http://meu-clube.cerrados-esportes.local/api/v1/health
```

---

## 2. Blueprint de Provisionamento de Tenant

Quando um novo cliente adquire um plano, o seguinte fluxo ocorre automaticamente:

### Fluxo de Criação

```
POST /api/v1/auth/register
  body: { name: "Clube Gaúcho", slug: "clube-gaucho", email, password }
    │
    ▼
RegisterUseCase
    │
    ├─► Insere em public.users
    ├─► Insere em public.organizations (slug, schema_name = "tenant_clube-gaucho")
    │
    ▼
TenantRegistryService.provision("clube-gaucho")
    │
    ▼
PostgreSQL DDL:
    CREATE SCHEMA IF NOT EXISTS tenant_clube_gaucho;
    SET search_path TO tenant_clube_gaucho;
    CREATE TABLE memberships (...);
    CREATE TABLE teams (...);
    CREATE TABLE players (...);
    ... (todas as tabelas do tenant)
```

### Verificação Pós-Provisionamento

```sh
# Liste todos os schemas criados
docker compose exec postgres psql -U cerradosesportes -c "\dn" cerradosesportes

# Verifique as tabelas do novo tenant
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'tenant_clube_gaucho'
  ORDER BY table_name;"

# Verifique o registro na tabela organizations
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT id, name, slug, schema_name, created_at
  FROM public.organizations
  WHERE slug = 'clube-gaucho';"
```

### Impacto na Infraestrutura por Novo Tenant

| Recurso       | Impacto estimado |
|---------------|------------------|
| PostgreSQL    | ~50 novas tabelas, ~500 KB overhead inicial |
| Redis         | Prefixo `auth:<tenantId>:*`, overhead < 1 MB |
| MinIO         | Pasta `/cerrados-esportes-assets/<slug>/` criada on-demand |
| Nginx         | Nenhum — extração é dinâmica via `map $http_host` |

**Capacidade:** Com `max_connections=200` e connection pooling via postgres-js (pool de 10 por instância backend), o sistema suporta ~100 tenants com uso concorrente moderado.

---

## 3. SRE Runbook — Interpretação de Alertas Grafana

### ALERTA: Alta Latência de API (p95 > 2 s)

**Dashboard:** Cerrados Esportes — API Overview → painel "Latência p95"

**Diagnóstico passo a passo:**

```sh
# 1. Identifique a rota mais lenta (painel "Top Rotas por p95" no Grafana)

# 2. Verifique queries lentas no PostgreSQL
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT query, round(mean_exec_time::numeric, 2) AS mean_ms,
         calls, round(total_exec_time::numeric, 2) AS total_ms
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;"

# 3. Verifique uso de recursos do container
docker stats cerrados_esportes_backend --no-stream

# 4. Verifique logs de erro recentes
docker compose logs cerrados_esportes_backend --tail=200 | grep -E "ERROR|WARN|error"
```

**Ações corretivas:**

| Causa raiz | Ação |
|------------|------|
| Query lenta no DB | Adicionar índice ou otimizar a query |
| Alta carga de CPU | Escalar horizontalmente (adicionar réplicas backend) |
| Memória insuficiente | Aumentar `deploy.resources.limits.memory` no compose |
| Dependência externa lenta | Verificar gateway de pagamento / MinIO |

---

### ALERTA: Pool de Conexões PostgreSQL Saturado (> 90%)

**Dashboard:** Cerrados Esportes — PostgreSQL & Tenants → painel "Uso do Pool (%)"

**Diagnóstico:**

```sh
# Conexões abertas por estado e usuário
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT state, usename, count(*)
  FROM pg_stat_activity
  GROUP BY state, usename
  ORDER BY count DESC;"

# Conexões idle há mais de 5 minutos (vazamento de conexão)
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT pid, state, state_change,
         left(query, 80) AS query_snippet
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < NOW() - INTERVAL '5 minutes'
  ORDER BY state_change;"

# Conexões bloqueadas por locks
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT pid, wait_event_type, wait_event, left(query, 80) AS query
  FROM pg_stat_activity
  WHERE wait_event IS NOT NULL;"
```

**Ações corretivas:**

```sh
# Reiniciar backend (libera pool de conexões)
docker compose -f docker-compose.prod.yml restart backend

# Encerrar conexões idle travadas (substituir <pid> pelo valor real)
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
    AND state_change < NOW() - INTERVAL '10 minutes';"

# Configurar timeout de sessão idle (persistente)
docker compose exec postgres psql -U cerradosesportes cerradosesportes -c "
  ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
  SELECT pg_reload_conf();"
```

---

### ALERTA: Fila BullMQ com Jobs Falhando (> 10 falhas em 5 min)

**Dashboard:** Cerrados Esportes — Filas BullMQ → painel "Falhas (5 min)"

**Diagnóstico:**

```sh
# Verifique os últimos jobs com falha no Redis
docker compose exec redis redis-cli KEYS "bull:*:failed" 2>/dev/null | head -10

# Inspecione a fila específica com falha
docker compose exec redis redis-cli LRANGE "bull:nome-da-fila:failed" 0 5

# Logs do worker
docker compose logs cerrados_esportes_backend --tail=200 | grep -iE "bullmq|job|failed|error"
```

**Ações corretivas:**

```sh
# Reiniciar backend para liberar workers travados
docker compose -f docker-compose.prod.yml restart backend

# Reprocessar jobs falhados (se for seguro fazer retry)
docker compose exec backend node -e "
  const { Queue } = require('bullmq');
  const q = new Queue('nome-da-fila', { connection: { host: 'redis' } });
  q.retryJobs({ count: 100, state: 'failed' }).then(n => {
    console.log('Requeued:', n);
    process.exit(0);
  });"
```

---

### ALERTA: Redis com Uso de Memória > 80%

**Dashboard:** Cerrados Esportes — Filas BullMQ → painel "Memória Redis Utilizada"

**Diagnóstico:**

```sh
# Uso atual de memória
docker compose exec redis redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"

# Top keys por tamanho
docker compose exec redis redis-cli --bigkeys 2>/dev/null | tail -30

# Contagem de keys por prefixo
docker compose exec redis redis-cli DBSIZE
docker compose exec redis redis-cli KEYS "auth:*" | wc -l
docker compose exec redis redis-cli KEYS "bull:*" | wc -l
```

**Ações corretivas:**

```sh
# Limpar tokens de refresh expirados manualmente (se TTL não estiver configurado)
docker compose exec redis redis-cli --scan --pattern "auth:refresh:*" | \
  xargs -L 100 docker compose exec redis redis-cli DEL

# Aumentar limite de memória (edite docker-compose.prod.yml e reinicie)
# Linha: --maxmemory 1gb
docker compose -f docker-compose.prod.yml up -d --no-deps redis
```

---

### ALERTA: Deploy com Falha no Health Check

Após um deploy via `cd.yml`, se o backend não responder:

```sh
# 1. Verifique os logs do container
docker compose -f docker-compose.prod.yml logs backend --tail=50

# 2. Verifique se o container está rodando
docker compose -f docker-compose.prod.yml ps

# 3. Rollback para a imagem anterior
export IMAGE_TAG=sha-<commit-anterior>
export REGISTRY=ghcr.io/seu-org/cerrados-esportes
docker compose -f docker-compose.prod.yml up -d --no-deps backend

# 4. Verifique o histórico de imagens disponíveis
docker images ghcr.io/seu-org/cerrados-esportes-backend \
  --format "table {{.Tag}}\t{{.CreatedAt}}" | head -10
```

---

## 4. Comandos de Health Check

```sh
# Backend API
curl -sf http://localhost:3001/api/v1/health | jq .

# PostgreSQL
docker compose exec postgres pg_isready -U cerradosesportes -d cerradosesportes

# Redis
docker compose exec redis redis-cli ping

# MinIO
curl -sf http://localhost:9000/minio/health/live

# Verificar todos os containers
docker compose ps
```

## 5. Rotação de Secrets em Produção

```sh
# 1. Gere novos secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# 2. Atualize .env.production no servidor
# (use seu gerenciador de secrets preferido: Vault, AWS Secrets Manager, etc.)

# 3. Reinicie o backend (os tokens antigos serão invalidados — usuários precisarão relogar)
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```
