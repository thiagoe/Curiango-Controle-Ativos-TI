# 🚀 API Documentation - Curiango Controle de Ativos

## Índice
- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [🔐 Auth](#-auth)
  - [📱 Ativos](#-ativos)
  - [👥 Colaboradores](#-colaboradores)
  - [🏢 Setores](#-setores)
  - [⚙️ Parâmetros](#️-parâmetros)
  - [📊 Dashboard](#-dashboard)
  - [📋 Auditoria](#-auditoria)
- [Códigos de Resposta](#códigos-de-resposta)
- [Exemplos de Uso](#exemplos-de-uso)

## Visão Geral

Base URL: `http://your-server:5000`

Todas as APIs seguem o padrão REST e retornam dados no formato JSON.

### Headers Padrão
```
Content-Type: application/json
Authorization: Bearer <token> (quando necessário)
```

## Autenticação

O sistema utiliza autenticação baseada em sessão para interface web e JWT opcional para APIs.

---

## Endpoints

### 🔐 Auth

#### `POST /auth/login`
Realiza login no sistema

**Request Body:**
```json
{
  "username": "usuario",
  "password": "senha"
}
```

**Response Success (200):**
```json
{
  "user": {
    "id": 1,
    "nome": "Usuário Teste",
    "email": "usuario@teste.com"
  },
  "message": "Login realizado com sucesso"
}
```

#### `POST /auth/logout`
Realiza logout do usuário

**Response Success (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

#### `GET /auth/me`
Retorna informações do usuário autenticado

**Response Success (200):**
```json
{
  "username": "usuario.teste",
  "full_name": "Usuário Teste",
  "authenticated": true,
  "groups": ["CN=TI,OU=Groups,DC=empresa,DC=com"]
}
```

#### `POST /auth/activity`
Atualiza timestamp da última atividade do usuário na sessão

**Response Success (200):**
```json
{
  "status": "success",
  "timestamp": "2025-01-15T10:30:00"
}
```

#### `GET /auth/session-status`
Retorna status detalhado da sessão incluindo tempo restante

**Response Success (200):**
```json
{
  "authenticated": true,
  "user": {
    "username": "usuario.teste",
    "full_name": "Usuário Teste"
  },
  "session_remaining_minutes": 25,
  "inactive_minutes": 5,
  "total_session_minutes": 35,
  "warning": false
}
```

#### `GET /auth/random-login-image`
Retorna uma imagem aleatória para a tela de login

**Response Success (200):**
```json
{
  "image": "/static/img/login/image.png",
  "filename": "image.png"
}
```

---

### 📱 Ativos

#### `GET /api/ativos`
Lista todos os ativos com filtros opcionais

**Query Parameters:**
- `tipo` - Filtrar por tipo (smartphone, notebook, desktop, chip_sim)
- `status` - Filtrar por status 
- `limit` - Limite de resultados (padrão: 100)
- `offset` - Offset para paginação (padrão: 0)
- `q` - Busca textual

**Response Success (200):**
```json
[
  {
    "id": 1,
    "tipo": "smartphone",
    "condicao": "novo",
    "usuario_atual_id": 1,
    "valor": "1500.00",
    "data_alocacao": "2025-01-15T10:30:00",
    "detalhes": {
      "marca": "Apple",
      "modelo": "iPhone 13",
      "imei": "123456789012345"
    }
  }
]
```

#### `POST /api/ativos`
Cria um novo ativo

**Request Body:**
```json
{
  "tipo": "smartphone",
  "condicao": "novo",
  "valor": 1500.00,
  "unidade_negocio_id": 1,
  // Dados específicos por tipo:
  "marca_id": 1,
  "modelo": "iPhone 13",
  "imei": "123456789012345",
  "acessorios": "Carregador, fone"
}
```

**Response Success (201):**
```json
{
  "id": 1,
  "tipo": "smartphone",
  "condicao": "novo",
  "message": "Ativo criado com sucesso"
}
```

#### `GET /api/ativos/{id}`
Retorna detalhes de um ativo específico

**Response Success (200):**
```json
{
  "id": 1,
  "tipo": "smartphone",
  "condicao": "novo",
  "usuario_atual_id": 1,
  "valor": "1500.00",
  "data_alocacao": "2025-01-15T10:30:00",
  "colaborador_nome": "João Silva",
  "detalhes_equipamento": "Smartphone Apple iPhone 13 - IMEI 123456789012345",
  "marca": "Apple",
  "modelo": "iPhone 13",
  "imei_slot": "123456789012345",
  "acessorios": "Carregador, fone"
}
```

#### `PUT /api/ativos/{id}`
Atualiza um ativo existente

**Request Body:**
```json
{
  "condicao": "usado",
  "valor": 1200.00,
  "modelo": "iPhone 13 Pro"
}
```

**Response Success (200):**
```json
{
  "id": 1,
  "tipo": "smartphone",
  "condicao": "usado",
  "message": "Ativo atualizado com sucesso"
}
```

#### `DELETE /api/ativos/{id}`
Remove um ativo

**Response Success (200):**
```json
{
  "ok": true,
  "message": "Ativo removido com sucesso"
}
```

#### `POST /api/ativos/{id}/alocacao`
Aloca um ativo para um colaborador

**Request Body:**
```json
{
  "colaborador_id": 1,
  "observacao": "Alocação inicial"
}
```

**Response Success (201):**
```json
{
  "message": "Ativo alocado com sucesso",
  "alocacao_id": 1
}
```

#### `POST /api/ativos/{id}/devolucao`
Registra devolução de um ativo

**Request Body:**
```json
{
  "observacao": "Devolução por troca"
}
```

**Response Success (200):**
```json
{
  "message": "Ativo devolvido com sucesso"
}
```

#### `POST /api/ativos/{id}/remover-alocacao`
Remove alocação atual de um ativo

**Request Body:**
```json
{
  "observacao": "Remoção de alocação"
}
```

**Response Success (200):**
```json
{
  "message": "Alocação removida com sucesso"
}
```

#### `GET /api/ativos/{id}/termo-pdf`
Gera termo de responsabilidade em PDF

**Response Success (200):**
```
Content-Type: application/pdf
[PDF Binary Data]
```

#### `GET /api/ativos/{id}/historico`
Retorna histórico de alocações do ativo

**Response Success (200):**
```json
[
  {
    "id": 1,
    "colaborador_id": 1,
    "colaborador_nome": "João Silva",
    "data_inicio": "2025-01-15",
    "data_fim": "2025-02-15",
    "observacao": "Troca de equipamento"
  }
]
```

#### `POST /api/ativos/{id}/manutencoes`
Registra manutenção do ativo

**Request Body:**
```json
{
  "tipo": "corretiva",
  "descricao": "Troca de tela",
  "data_inicio": "2025-01-20",
  "data_fim": "2025-01-22"
}
```

#### `GET /api/ativos/{id}/notas`
Lista notas do ativo

**Response Success (200):**
```json
[
  {
    "id": 1,
    "conteudo": "Equipamento apresentou problema na tela",
    "usuario": "Admin",
    "created_at": "2025-01-15T10:30:00"
  }
]
```

#### `POST /api/ativos/{id}/notas`
Adiciona nota ao ativo

**Request Body:**
```json
{
  "conteudo": "Observação sobre o equipamento"
}
```

#### `DELETE /api/ativos/{id}/notas/{nota_id}`
Remove uma nota do ativo

#### `GET /api/ativos/export`
Exporta lista de ativos para CSV

**Query Parameters:**
- `tipo` - Filtrar por tipo
- `status` - Filtrar por status

**Response Success (200):**
```
Content-Type: text/csv
[CSV Data]
```

#### `POST /api/ativos/import`
Importa ativos via arquivo CSV

**Request Body (multipart/form-data):**
- `file` - Arquivo CSV com dados dos ativos

**Response Success (200):**
```json
{
  "message": "Importação realizada com sucesso",
  "importados": 15,
  "erros": []
}
```

---

### 👥 Colaboradores

#### `GET /api/colaboradores`
Lista colaboradores

**Query Parameters:**
- `status` - Filtrar por status (ativo, desligado)
- `setor_id` - Filtrar por setor
- `q` - Busca por nome/email
- `limit` - Limite de resultados
- `offset` - Offset para paginação

**Response Success (200):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "matricula": "12345",
    "cpf": "123.456.789-00",
    "email": "joao@empresa.com",
    "cargo": "Desenvolvedor",
    "setor_id": 1,
    "setor_nome": "TI",
    "status": "ativo"
  }
]
```

#### `POST /api/colaboradores`
Cria novo colaborador

**Request Body:**
```json
{
  "nome": "Maria Santos",
  "matricula": "12346",
  "cpf": "987.654.321-00",
  "email": "maria@empresa.com",
  "cargo": "Analista",
  "setor_id": 1
}
```

#### `GET /api/colaboradores/{id}`
Detalhes do colaborador

#### `PUT /api/colaboradores/{id}`
Atualiza colaborador

#### `DELETE /api/colaboradores/{id}`
Remove colaborador

#### `POST /api/colaboradores/import`
Importa colaboradores via arquivo CSV

**Request Body (multipart/form-data):**
- `file` - Arquivo CSV com dados dos colaboradores

**Response Success (200):**
```json
{
  "message": "Importação realizada com sucesso",
  "importados": 25,
  "erros": []
}
```

---

### 🏢 Setores

#### `GET /api/setores`
Lista setores

**Response Success (200):**
```json
[
  {
    "id": 1,
    "nome": "Tecnologia da Informação",
    "email_responsavel": "ti@empresa.com",
    "ativo": true
  }
]
```

#### `POST /api/setores`
Cria novo setor

**Request Body:**
```json
{
  "nome": "Recursos Humanos",
  "email_responsavel": "rh@empresa.com"
}
```

#### `GET /api/setores/{id}`
Detalhes do setor

#### `PUT /api/setores/{id}`
Atualiza setor

#### `DELETE /api/setores/{id}`
Remove setor

#### `GET /api/setores/{id}/colaboradores`
Lista colaboradores do setor

---

### ⚙️ Parâmetros

#### `GET /api/parametros/marcas`
Lista marcas

**Query Parameters:**
- `q` - Busca por nome
- `limit` - Limite de resultados
- `offset` - Offset

**Response Success (200):**
```json
[
  {
    "id": 1,
    "nome": "Apple"
  }
]
```

#### `POST /api/parametros/marcas`
Cria nova marca

#### `GET /api/parametros/marcas/{id}`
Detalhes da marca

#### `PUT /api/parametros/marcas/{id}`
Atualiza marca

#### `DELETE /api/parametros/marcas/{id}`
Remove marca

#### `GET /api/parametros/operadoras`
Lista operadoras (mesmo padrão das marcas)

#### `GET /api/parametros/unidades`
Lista unidades de negócio (mesmo padrão das marcas)

#### `GET /api/parametros/sistema`
Lista parâmetros do sistema

**Response Success (200):**
```json
[
  {
    "id": 1,
    "chave": "termo_responsabilidade_template",
    "valor": "<html>...</html>",
    "tipo": "html",
    "descricao": "Template do termo de responsabilidade",
    "ativo": true,
    "created_at": "2025-01-15T10:30:00",
    "updated_at": "2025-01-15T10:30:00"
  }
]
```

#### `GET /api/parametros/sistema/{chave}`
Obtém parâmetro específico

#### `PUT /api/parametros/sistema/{chave}`
Atualiza parâmetro do sistema

**Request Body:**
```json
{
  "valor": "Novo valor",
  "tipo": "texto",
  "descricao": "Descrição atualizada"
}
```

---

### 📊 Dashboard

#### `GET /api/dashboard/resumo`
Resumo geral do dashboard

**Response Success (200):**
```json
{
  "total_ativos": 150,
  "em_uso": 120,
  "em_estoque": 25,
  "em_manutencao": 5,
  "por_tipo": {
    "smartphone": 50,
    "notebook": 70,
    "desktop": 20,
    "chip_sim": 10
  }
}
```

#### `GET /api/dashboard/graficos`
Dados para gráficos

**Response Success (200):**
```json
{
  "ativos_por_tipo": [
    {"tipo": "smartphone", "total": 50},
    {"tipo": "notebook", "total": 70}
  ],
  "status_distribuicao": [
    {"status": "em_uso", "total": 120},
    {"status": "estoque", "total": 25}
  ]
}
```

#### `GET /api/dashboard/estatisticas`
Estatísticas detalhadas

#### `GET /api/dashboard/categorias-detalhadas`
Categorias com detalhamento

#### `GET /api/dashboard/usuarios-resumo`
Resumo de usuários

---

### 📋 Auditoria

#### `GET /api/auditoria`
Lista logs de auditoria

**Query Parameters:**
- `limite` - Limite de resultados (padrão: 50)
- `offset` - Offset para paginação
- `usuario` - Filtrar por usuário
- `acao` - Filtrar por ação (CREATE, UPDATE, DELETE, etc.)
- `tabela` - Filtrar por tabela
- `data_inicio` - Data início (YYYY-MM-DD)
- `data_fim` - Data fim (YYYY-MM-DD)

**Response Success (200):**
```json
[
  {
    "id": 1,
    "usuario": "João Silva",
    "acao": "CREATE",
    "tabela": "ativos",
    "registro_id": 1,
    "descricao": "Smartphone Apple iPhone criado",
    "dados_antigos": null,
    "dados_novos": {"tipo": "smartphone", "marca": "Apple"},
    "created_at": "2025-01-15T10:30:00",
    "ip_address": "192.168.1.100"
  }
]
```

#### `GET /api/auditoria/{id}`
Detalhes de um log específico

#### `GET /api/auditoria/health`
Health check da API

**Response Success (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00"
}
```

---

## Códigos de Resposta

| Código | Descrição |
|---------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 422 | Erro de validação |
| 500 | Erro interno do servidor |

## Estrutura de Erro

```json
{
  "error": "Mensagem de erro",
  "detail": "Detalhes específicos do erro",
  "code": "ERROR_CODE"
}
```

---

## Exemplos de Uso

### Criar um Smartphone
```bash
curl -X POST http://localhost:5000/api/ativos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "smartphone",
    "condicao": "novo",
    "valor": 1500.00,
    "marca_id": 1,
    "modelo": "iPhone 13",
    "imei": "123456789012345"
  }'
```

### Alocar Ativo
```bash
curl -X POST http://localhost:5000/api/ativos/1/alocacao \
  -H "Content-Type: application/json" \
  -d '{
    "colaborador_id": 1,
    "observacao": "Alocação inicial"
  }'
```

### Buscar Ativos por Tipo
```bash
curl "http://localhost:5000/api/ativos?tipo=smartphone&limit=10"
```

### Gerar Termo de Responsabilidade
```bash
curl "http://localhost:5000/api/ativos/1/termo-pdf" \
  -H "Accept: application/pdf" \
  --output termo.pdf
```

---

## Notas Importantes

1. **Autenticação**: A maioria dos endpoints requer autenticação via sessão
2. **Paginação**: Use `limit` e `offset` para paginar resultados grandes
3. **Filtros**: Muitos endpoints suportam filtros via query parameters
4. **Audit Trail**: Todas as operações são registradas no sistema de auditoria
5. **Validação**: Dados são validados tanto no frontend quanto no backend
6. **Tipos de Ativo**: Cada tipo (smartphone, notebook, desktop, chip_sim) tem campos específicos
7. **PDF Generation**: Termos de responsabilidade são gerados dinamicamente com templates configuráveis
8. **Prevenção de Duplicatas**: Sistema previne duplicação de IMEI (smartphones), patrimônio (computadores) e números (chips SIM)
9. **Tipos de Chip**: Chips SIM podem ser "Voz/Dados" ou "Dados", com formatação automática de números telefônicos
10. **Templates Específicos**: Templates diferentes para smartphones, notebooks/desktops e chips SIM

---

## Template Variables (Termo de Responsabilidade)

As seguintes variáveis estão disponíveis nos templates:

### Dados do Usuário:
- `{{ NOME_USUARIO }}` - Nome completo do colaborador
- `{{ CPF_USUARIO }}` - CPF do colaborador formatado
- `{{ MATRICULA_USUARIO }}` - Matrícula corporativa do colaborador

### Dados do Equipamento:
- `{{ DETALHES_EQUIPAMENTO }}` - Descrição completa do equipamento (tipo, marca, modelo, IMEI/patrimônio/número, etc.)
- `{{ VALOR_EQUIPAMENTO }}` - Valor formatado do equipamento (ex: "R$ 1.500,00" ou "Não informado")
- `{{ ACESSORIOS }}` - Acessórios do equipamento (smartphones e computadores apenas, "Não disponível" se vazio)

### Parâmetros Configuráveis:
- `{{ VALOR_RESSARCIMENTO }}` - Valor configurável para ressarcimento em caso de perda/dano (padrão: "R$ 4.500,00")

---

**Versão da API**: 1.0  
**Última atualização**: Janeiro 2025

---

## Exemplos de Respostas de Erro

### IMEI Duplicado
```json
{
  "error": "IMEI duplicado",
  "detail": "Já existe um smartphone com o IMEI 123456789012345"
}
```

### Patrimônio Duplicado
```json
{
  "error": "Patrimônio duplicado", 
  "detail": "Já existe um computador com o patrimônio PAT001"
}
```

### Número de Chip Duplicado
```json
{
  "error": "Número duplicado",
  "detail": "Já existe um chip SIM com o número (11) 99999-9999"
}
```

### Dados Inválidos
```json
{
  "error": "Dados inválidos",
  "detail": "Campo 'tipo' é obrigatório"
}
```

---

## Especificações por Tipo de Ativo

### Smartphones
**Campos específicos:**
- `marca_id` (int) - ID da marca
- `modelo` (string) - Modelo do smartphone
- `imei` ou `imei_slot` (string) - IMEI único no sistema
- `acessorios` (text) - Lista de acessórios

**Validações:**
- IMEI deve ser único no sistema
- IMEI é opcional mas recomendado

### Notebooks/Desktops
**Campos específicos:**
- `tipo_computador` (string) - "notebook" ou "desktop"
- `marca_id` (int) - ID da marca
- `modelo` (string) - Modelo do computador
- `patrimonio` (string) - Número de patrimônio único
- `serie` (string) - Número de série
- `so_versao` (string) - Sistema operacional
- `processador` ou `cpu` (string) - Processador
- `memoria` (string) - Memória RAM
- `hd` ou `disco` (string) - Armazenamento
- `acessorios` (text) - Lista de acessórios

**Validações:**
- Patrimônio deve ser único no sistema
- Patrimônio é opcional mas recomendado

### Chips SIM
**Campos específicos:**
- `operadora_id` (int) - ID da operadora
- `numero` (string) - Número do chip no formato (DD) NNNNN-NNNN
- `tipo` (string) - "voz" (Voz/Dados) ou "dados" (Dados)

**Validações:**
- Número deve ser único no sistema
- Formato de telefone é validado automaticamente
- Chips SIM não possuem unidade de negócio (sempre null)

---

## Campos de Auditoria

Todos os modelos possuem campos automáticos de auditoria:
- `created_at` - Data/hora de criação
- `updated_at` - Data/hora da última atualização

O sistema de auditoria completo registra:
- **Usuário** que executou a ação
- **Ação** realizada (CREATE, UPDATE, DELETE, TRANSFER, etc.)
- **Tabela** afetada
- **ID do registro** afetado
- **Dados anteriores** (snapshot before)
- **Dados novos** (snapshot after)
- **IP do cliente**
- **Timestamp** da operação