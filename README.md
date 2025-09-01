# 🦅 Curiango - Controle de Ativos

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![MariaDB](https://img.shields.io/badge/MariaDB-11.4+-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Sistema completo de gerenciamento de ativos de TI desenvolvido em Flask, projetado para pequenas empresas que precisam controlar e rastrear equipamentos corporativos notebooks, desktops, smartphones e chips SIM.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#️-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso](#-uso)
- [API](#-api)
- [Docker](#-docker)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Screenshots](#-screenshots)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## ✨ Características

### 🎯 Principais Funcionalidades
- **Gestão Completa de Ativos**: Controle de notebooks, desktops, smartphones e chips SIM
- **Sistema de Alocação**: Vinculação de equipamentos a colaboradores com histórico completo
- **Termos de Responsabilidade**: Geração automática de PDFs personalizáveis
- **Auditoria Detalhada**: Log completo de todas as operações do sistema
- **Dashboard Analítico**: Visão geral com métricas e gráficos em tempo real
- **Controle de Manutenção**: Registro e acompanhamento de manutenções
- **Sistema de Notas**: Anotações por ativo para documentação adicional
- **Import/Export**: Importação e exportação em massa via CSV

### 🔒 Segurança e Controle
- **Autenticação JWT**: Sistema seguro de autenticação
- **Integração LDAP**: Suporte a Active Directory corporativo
- **Validação de Duplicatas**: Prevenção de registros duplicados (IMEI, patrimônio, número de chip)
- **Controle de Permissões**: Sistema baseado em grupos LDAP
- **Audit Trail**: Rastreamento completo de todas as mudanças

### 📊 Relatórios e Analytics
- **Dashboard Moderno**: Interface responsiva com gráficos interativos
- **Exportação CSV**: Relatórios customizáveis para análise externa
- **Histórico Detalhado**: Rastreamento completo do ciclo de vida dos ativos
- **Métricas em Tempo Real**: Contadores de ativos por status e tipo

## 🛠️ Tecnologias

### Backend
- **Python 3.12+** - Linguagem principal
- **Flask 3.0+** - Framework web
- **SQLAlchemy** - ORM para banco de dados
- **Flask-JWT-Extended** - Autenticação JWT
- **Marshmallow** - Serialização de dados
- **WeasyPrint** - Geração de PDFs
- **python-ldap** - Integração com Active Directory

### Frontend
- **HTML5/CSS3** - Estrutura e estilização
- **Vanilla JavaScript** - Interatividade sem frameworks
- **Bootstrap 5** - Framework CSS responsivo
- **Chart.js** - Gráficos e visualizações
- **Font Awesome** - Ícones

### Banco de Dados
- **MariaDB 11.4+** - Banco principal
- **MySQL** - Compatível
- **SQLite** - Para desenvolvimento (opcional)

### DevOps
- **Docker & Docker Compose** - Containerização
- **Nginx** - Proxy reverso (produção)
- **Gunicorn** - WSGI server (produção)

## 🚀 Instalação

### Opção 1: Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/curiango-controle-ativos.git
cd curiango-controle-ativos

# Inicie os containers
docker-compose up -d

# Acesse a aplicação
http://localhost:5000
```

### Opção 2: Instalação Manual

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/curiango-controle-ativos.git
cd curiango-controle-ativos

# Configure o banco de dados
cd db/
docker-compose up -d
cd ..

# Configure o ambiente Python
cd curiango/
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute a aplicação
python manage.py
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `curiango/` com as seguintes configurações:

```env
# Banco de Dados
SQLALCHEMY_DATABASE_URI=mysql+pymysql://usuario_app:SUA_SENHA_AQUI@localhost:3306/sistema_ativos_db

# Segurança
SECRET_KEY=sua-chave-secreta-super-segura
JWT_SECRET_KEY=sua-chave-jwt-super-segura

# Email (opcional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app

# LDAP (opcional)
LDAP_SERVER=ldap://seu-servidor-ad.com
LDAP_BASE_DN=DC=empresa,DC=com
LDAP_BIND_USER=usuario@empresa.com
LDAP_BIND_PASSWORD=senha

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### Configuração do Banco

O sistema utiliza MariaDB/MySQL. O schema é criado automaticamente na primeira execução usando o arquivo `db/sql/db.sql`.

#### Estrutura Principal:
- **ativos** - Tabela principal de ativos
- **smartphones** - Detalhes específicos de smartphones
- **computadores** - Detalhes de notebooks/desktops
- **chips_sim** - Detalhes de chips SIM
- **colaboradores** - Usuários do sistema
- **historico_alocacoes** - Histórico de movimentações
- **log_auditoria** - Auditoria completa

## 📱 Uso

### Dashboard Principal
Acesse `http://localhost:5000` para visualizar:
- Resumo geral dos ativos
- Gráficos de distribuição por tipo e status
- Atividades recentes
- Alertas e notificações

### Gestão de Ativos

#### Adicionar Novo Ativo
1. Vá para **Estoque** → **Adicionar Ativo**
2. Selecione o tipo (Smartphone, Notebook, Desktop, Chip SIM)
3. Preencha os campos obrigatórios
4. Clique em **Salvar**

#### Alocar Equipamento
1. Na lista de ativos, clique em **Ações** → **Alocar**
2. Selecione o colaborador
3. Adicione observações (opcional)
4. Confirme a alocação
5. O termo de responsabilidade será gerado automaticamente

#### Manutenção
1. Selecione o ativo → **Ações** → **Manutenção**
2. Registre o tipo de manutenção
3. Adicione descrição detalhada
4. Salve o registro

### Relatórios

#### Exportar Dados
- **Estoque Completo**: Export → Ativos
- **Lista de Colaboradores**: Export → Colaboradores
- **Histórico de Movimentações**: Relatórios → Histórico

#### Importar em Massa
1. Baixe o template CSV
2. Preencha com os dados
3. Faça upload do arquivo
4. Confirme a importação

## 🔌 API

O sistema oferece uma API REST completa para integração com outros sistemas.

### Endpoints Principais

```bash
# Autenticação
POST /api/auth/login          # Login
POST /api/auth/refresh        # Refresh token

# Ativos
GET    /api/ativos           # Listar ativos
POST   /api/ativos           # Criar ativo
PUT    /api/ativos/{id}      # Atualizar ativo
DELETE /api/ativos/{id}      # Excluir ativo

# Alocações
POST /api/ativos/{id}/alocacao     # Alocar ativo
POST /api/ativos/{id}/devolucao    # Devolver ativo

# Colaboradores
GET    /api/colaboradores    # Listar colaboradores
POST   /api/colaboradores    # Criar colaborador
PUT    /api/colaboradores/{id} # Atualizar colaborador

# Relatórios
GET /api/dashboard/stats     # Estatísticas do dashboard
GET /api/auditoria          # Logs de auditoria
```

### Exemplo de Uso

```python
import requests

# Login
response = requests.post('http://localhost:5000/api/auth/login', json={
    'username': 'admin',
    'password': 'senha'
})
token = response.json()['access_token']

# Listar ativos
headers = {'Authorization': f'Bearer {token}'}
ativos = requests.get('http://localhost:5000/api/ativos', headers=headers)
print(ativos.json())
```

## 🐳 Docker

### Desenvolvimento

```bash
# Subir apenas o banco
docker-compose -f docker-compose.yml up mariadb -d

# Executar aplicação local
cd curiango/
python manage.py
```

### Produção

```bash
# Build e deploy completo
docker-compose up -d

# Verificar logs
docker-compose logs -f curiango-app

# Backup do banco
docker-compose exec mariadb mysqldump -u root -p sistema_ativos_db > backup.sql
```

### Configuração de Produção

Para ambiente de produção, utilize:

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - curiango-app

  curiango-app:
    build: .
    command: gunicorn --bind 0.0.0.0:5000 wsgi:app
    environment:
      - FLASK_ENV=production
```

## 📁 Estrutura do Projeto

```
curiango-controle-ativos/
├── curiango/                 # Aplicação principal
│   ├── app/
│   │   ├── api/             # Endpoints da API
│   │   ├── core/            # Configurações e utilitários
│   │   ├── models/          # Modelos do banco de dados
│   │   ├── services/        # Lógica de negócio
│   │   ├── static/          # Arquivos estáticos (CSS, JS)
│   │   └── templates/       # Templates HTML
│   ├── logs/                # Arquivos de log
│   ├── venv/                # Ambiente virtual Python
│   ├── manage.py            # Script principal
│   ├── requirements.txt     # Dependências
│   └── wsgi.py             # WSGI para produção
├── db/                      # Banco de dados
│   ├── sql/
│   │   ├── db.sql          # Schema principal
│   │   └── migrations/     # Migrações
│   └── docker-compose.yml  # MariaDB container
├── docker/                  # Configurações Docker
├── Dockerfile              # Build da aplicação
├── docker-compose.yml      # Orquestração completa
└── README.md              # Este arquivo
```

## 🎯 Funcionalidades

### Gestão de Ativos

#### Smartphones
- **Campos**: Marca, modelo, IMEI, acessórios
- **Validações**: IMEI único no sistema
- **Funcionalidades**: Alocação, manutenção, histórico

#### Computadores (Notebooks/Desktops)
- **Campos**: Marca, modelo, patrimônio, série, SO, processador, memória, HD
- **Validações**: Patrimônio único no sistema
- **Funcionalidades**: Controle completo de configuração

#### Chips SIM
- **Campos**: Operadora, número, tipo (Voz/Dados ou Dados)
- **Validações**: Número único no sistema
- **Funcionalidades**: Máscara de telefone, validação de formato

### Colaboradores
- **Campos**: Nome, CPF, matrícula, email, cargo, setor
- **Funcionalidades**: Histórico de equipamentos, termos de responsabilidade

### Auditoria e Logs
- **Rastreamento Completo**: Todas as operações são logadas
- **Dados Armazenados**: Usuário, ação, data/hora, dados antes/depois
- **Tipos de Ação**: CREATE, UPDATE, DELETE, TRANSFER, LOGIN, LOGOUT

### Relatórios
- **Dashboard**: Métricas em tempo real
- **Exportação**: CSV personalizável
- **Histórico**: Movimentações detalhadas
- **Gráficos**: Visualização de dados por tipo, status, período

## 📊 Screenshots

### Dashboard Principal
![Dashboard](screenshots/dashboard.png)

### Gestão de Ativos
![Ativos](screenshots/ativos.png)


## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:


### Reportar Bugs
Use a seção **Issues** do GitHub com:
- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do ambiente

## 📄 Licença

Este projeto está licenciado sob a licença MIT

## 🙏 Agradecimentos

- [Flask](https://flask.palletsprojects.com/) - Framework web Python
- [Bootstrap](https://getbootstrap.com/) - Framework CSS
- [Chart.js](https://www.chartjs.org/) - Biblioteca de gráficos
- [WeasyPrint](https://weasyprint.org/) - Geração de PDFs
- [MariaDB](https://mariadb.org/) - Sistema de banco de dados

## 📞 Suporte

Para suporte e dúvidas:

- **Issues**: Use o sistema de issues do GitHub
- **Email**: thiago3@gmail.com

---

<div align="center">

**Desenvolvido com ❤️ para simplificar o controle de ativos de TI**

[⬆ Voltar ao topo](#-curiango---controle-de-ativos)

</div>