# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Curiango - Controle de Ativos** is a Flask-based IT asset management system for tracking and managing corporate assets like computers, smartphones, and SIM cards. The application manages asset allocation to employees, maintenance history, audit logs, and generates responsibility terms.

## Development Environment Setup

### Prerequisites
- Python 3.12+
- MariaDB database (via Docker)
- Virtual environment (venv included in project)

### Database Setup
```bash
cd db/
docker-compose up -d
```
This starts a MariaDB container with the initial database schema from `db/sql/db.sql`.

### Application Setup
```bash
cd curiango/
# Activate virtual environment
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run the application
python manage.py
```

The application runs in debug mode on http://0.0.0.0:5000 by default.

## Development Commands

### Running the Application
- **Development server**: `python manage.py` (from curiango/ directory)
- **Production WSGI**: Use `wsgi.py` with a WSGI server like Gunicorn

### Docker Development
**Complete Environment (Recommended)**:
```bash
# Start all services (database + application)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Database-only Setup** (for local Flask development):
```bash
# Start only the database
cd db/
docker-compose up -d

# Stop database
cd db/
docker-compose down
```

**Useful Docker Commands**:
```bash
# Build application container
docker-compose build app

# Database backup
docker-compose exec db mysqldump -u root -pSUA_SENHA_ROOT sistema_ativos_db > backup.sql

# Database restore
docker-compose exec -T db mysql -u root -pSUA_SENHA_ROOT sistema_ativos_db < backup.sql

# Health check
curl http://localhost:5000/api/health
```

### Database Operations
- **Start database**: `cd db/ && docker-compose up -d`
- **Stop database**: `cd db/ && docker-compose down`
- **Database migrations**: Manual execution of SQL scripts in `db/sql/migrations/`

### Environment Configuration
Multiple environment configuration files are available:
- `.env.docker` - Docker container configuration template
- `.env.production` - Production environment template 
- `curiango/.env` - Local development environment

Key environment variables:
- `SQLALCHEMY_DATABASE_URI`: Database connection string
- `SECRET_KEY`: Flask session secret
- `MAIL_*`: Email configuration for notifications
- `LDAP_*`: Active Directory/LDAP authentication settings
- `LOG_LEVEL`, `LOG_FILE`: Logging configuration

## Key Configuration

### Database Connection
- **Development (local)**: `mysql+pymysql://usuario_app:SUA_SENHA_AQUI@localhost:3306/sistema_ativos_db`
- **Docker**: `mysql+pymysql://usuario_app:SUA_SENHA_AQUI@db:3306/sistema_ativos_db`

### Requirements Management
- `curiango/requirements.txt` - Complete dependencies including WeasyPrint
- `curiango/requirements-minimal.txt` - Minimal dependencies (excludes WeasyPrint for environments with build issues)

## Architecture Overview

### Application Structure
```
curiango/app/
├── __init__.py          # Flask app factory and blueprint registration
├── api/                 # REST API endpoints (Blueprint-based)
│   ├── auth.py         # Authentication endpoints
│   ├── ativos.py       # Asset management endpoints
│   ├── colaboradores.py # Employee management
│   ├── dashboard.py    # Dashboard data endpoints
│   ├── parametros.py   # System parameters
│   └── auditoria.py    # Audit log endpoints
├── core/               # Core infrastructure
│   ├── config.py       # Configuration management
│   ├── db.py          # SQLAlchemy database setup
│   ├── auth.py        # JWT authentication logic
│   ├── ldap_auth.py   # LDAP/Active Directory integration
│   ├── mail.py        # Email service configuration
│   ├── pdf.py         # PDF generation (WeasyPrint)
│   ├── security.py    # Security utilities
│   └── logger.py      # Logging configuration
├── models/             # SQLAlchemy ORM models
│   ├── base.py        # Base model class
│   ├── dominio.py     # Domain models (Ativo, Colaborador, etc.)
│   └── historico.py   # Historical tracking models
├── schemas/            # Marshmallow serialization schemas
├── services/           # Business logic layer
│   ├── ativos_service.py      # Asset management business logic
│   ├── transferencia_service.py # Asset transfer operations
│   ├── termo_service.py       # Responsibility term generation
│   ├── email_service.py       # Email notification service
│   └── auditoria_service.py   # Audit logging service
├── templates/          # Jinja2 HTML templates
└── static/            # CSS/JavaScript frontend assets
```

### Key Models
- **Ativo**: Base asset model with type discrimination (smartphone, notebook, desktop, chip_sim)
- **Colaborador**: Employee/user management
- **HistoricoAlocacao**: Asset allocation history tracking
- **LogAuditoria**: Comprehensive audit trail
- **Manutencao**: Maintenance records
- **Smartphone/Computador/ChipSim**: Type-specific asset details

### Authentication & Authorization
- JWT-based API authentication (`Flask-JWT-Extended`)
- Session-based web interface authentication
- LDAP/Active Directory integration for user validation
- Group-based access control via LDAP groups

### Frontend Architecture
- Server-side rendered Jinja2 templates
- Vanilla JavaScript with modular components
- Bootstrap-based responsive design
- AJAX-based API interactions for dynamic content

## Business Logic Patterns

### Asset Management Flow
1. **Asset Creation**: Create base `Ativo` record + type-specific details
2. **Allocation**: Link asset to employee via `HistoricoAlocacao`
3. **Transfer**: End current allocation, create new allocation record
4. **Term Generation**: Generate PDF responsibility terms using WeasyPrint
5. **Audit Trail**: All operations logged via `LogAuditoria`

### Service Layer Pattern
Business logic is encapsulated in service classes (`services/`), separating concerns from API endpoints and providing reusable operations across different interfaces.

### Database Relationships
- Assets use single-table inheritance pattern with type-specific detail tables
- Historical tracking maintains complete allocation audit trail
- Soft deletion patterns for maintaining referential integrity

## Testing & Quality

**No automated testing framework is currently configured.** Manual testing is performed through the web interface and API endpoints.

**No linting or code quality tools are configured** - no flake8, black, ruff, or mypy setup. Code style follows standard Python conventions.

### Manual Testing Endpoints
- **Web Interface**: http://localhost:5000 (main application)
- **Health Check**: GET http://localhost:5000/api/health
- **API Documentation**: Refer to `README_API.md` for complete endpoint reference

## Deployment Notes

### Production Deployment
- **Containerized**: Full Docker setup with `docker-compose.yml`
- **WSGI**: Uses `wsgi.py` for production WSGI deployment (Gunicorn recommended)
- **Database**: MariaDB 11.4 via Docker container
- **Logging**: File-based output (`logs/app.log`) with configurable levels
- **Static Assets**: Served directly by Flask in development, use reverse proxy (nginx) in production

### Environment-specific Configurations
- `.env.docker` - Docker container settings
- `.env.production` - Production environment template
- Database migrations handled manually via SQL scripts in `db/sql/migrations/`

### Health Monitoring
- Built-in health check endpoint: `/api/health`
- Container health checks configured in Dockerfile
- Logging with configurable levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)

## Common Operations

### Adding New Asset Types
1. Add enum value to `Ativo.tipo` in `models/dominio.py`
2. Create type-specific detail model (similar to `Smartphone`, `Computador`)
3. Update API endpoints in `api/ativos.py` to handle new type
4. Add frontend handling in `static/js/` files

### Extending Audit Logging
Audit logging is handled via the `auditoria_service.py`. New operations should call `log_audit()` with appropriate action types.

## Important Notes

### Flask Application Structure
- The app uses Flask's application factory pattern (`create_app()` in `app/__init__.py`)
- Blueprints are used to organize API endpoints (`api/` directory)
- Database models use SQLAlchemy ORM with inheritance patterns
- Configuration is environment-based through `.env` files

### Security Considerations
- JWT tokens are used for API authentication
- LDAP integration for user validation against Active Directory
- All sensitive operations are logged via audit trail
- Email notifications for important system events

### PDF Generation
- Uses WeasyPrint for generating responsibility terms
- Templates are in HTML format for PDF generation
- CSS styling is applied for professional document formatting

### Template Variables for Responsibility Terms
The responsibility term templates support the following variables:

**User Information:**
- `{{ NOME_USUARIO }}` - Employee's full name
- `{{ CPF_USUARIO }}` - Employee's CPF document
- `{{ MATRICULA_USUARIO }}` - Employee's registration number

**Asset Information:**
- `{{ DETALHES_EQUIPAMENTO }}` - Complete equipment description (type, brand, model, serial, etc.)
- `{{ VALOR_EQUIPAMENTO }}` - Formatted equipment value (e.g., "R$ 1,500.00" or "Não informado")
- `{{ ACESSORIOS }}` - Asset accessories list (smartphones and computers only, "Não informados" if empty)
- `{{ STATUS }}` - Asset status/condition (e.g., "Novo", "Usado", "Em Manutenção", "Danificado", "Inativo")

**Configurable Parameters:**
- `{{ VALOR_RESSARCIMENTO }}` - Configurable reimbursement value (default: "R$ 4,500.00")
  - Can be modified via system parameters: `valor_ressarcimento_equipamento`

### System Parameters
Key configurable parameters accessible via the Parameters interface:

- `termo_responsabilidade_template` - HTML template for responsibility terms
- `valor_ressarcimento_equipamento` - Default reimbursement value for lost/damaged equipment
- `email_alocacao_assunto` / `email_alocacao_corpo` - Asset allocation email templates
- `email_devolucao_assunto` / `email_devolucao_corpo` - Asset return email templates

## Database Migrations

Manual database migrations are handled via SQL scripts in `db/sql/migrations/`. There is no automated migration framework like Alembic. 

**Running Migrations**:
- Place SQL files in `db/sql/migrations/`
- Execute manually via docker or mysql client:
```bash
# Via Docker
docker-compose exec db mysql -u root -pSUA_SENHA_ROOT sistema_ativos_db < db/sql/migrations/your_migration.sql

# Via local mysql client
mysql -h localhost -P 3306 -u usuario_app -pSUA_SENHA sistema_ativos_db < db/sql/migrations/your_migration.sql
```

### Available Migration Files
Current migrations in `db/sql/migrations/`:
- `002_add_unique_numero_chips_sim.sql` - Adds unique constraint for chip numbers
- `fix_cascade_delete.sql` - Fixes foreign key cascade delete issues
- `fix_datetime_historico.sql` - Fixes datetime issues in history tables
- `add_setores.sql` - Adds sectors/departments functionality
- `update_manutencoes_structure.sql` - Updates maintenance table structure

## Environment Files

Multiple environment configurations are available:
- **`.env.docker`** - Template for Docker container deployment (contains production-like settings)
- **`.env.production`** - Production environment template with real credentials placeholders
- **`curiango/.env`** - Active local development environment configuration

**Important**: Never commit `.env` files with real credentials. Use the template files and copy them locally.

## Port Configuration

- **Development (local)**: Application runs on `http://0.0.0.0:5000`
- **Docker deployment**: Application exposed on `http://localhost:5041` (mapped from internal port 5000)
- **Database**: MariaDB accessible on port `3306` (both local and Docker)

## Code Architecture Details

### Application Factory Pattern
The Flask application uses the factory pattern in `app/__init__.py` with:
- Blueprint registration for modular API endpoints
- Database and mail initialization
- Context processors for template globals
- Session-based authentication middleware
- Request protection for web routes (but not API routes)

### Authentication Flow
- **Web Interface**: Session-based authentication with 1-hour timeout
- **API Routes**: JWT authentication available (Flask-JWT-Extended)
- **LDAP Integration**: Active Directory authentication via ldap3
- **Session Management**: Automatic timeout after 1 hour of inactivity
- **Access Control**: Group-based permissions via LDAP groups

### Asset Type Hierarchy
The system uses single-table inheritance for assets:
- **Base Model**: `Ativo` (assets table)
- **Smartphone**: Additional table with IMEI, accessories, etc.
- **Computador**: Additional table with specs, patrimony, etc.
- **ChipSim**: Additional table with number, operator, type
- **Type Discrimination**: Uses `tipo` field ('smartphone', 'notebook', 'desktop', 'chip_sim')

### Key Validation Rules
- **Smartphones**: IMEI must be unique across all smartphones
- **Computers**: Patrimony number must be unique across all computers
- **Chips**: Phone number must be unique across all chips with automatic formatting
- **Soft Deletes**: Models use soft deletion to maintain referential integrity

## JavaScript Architecture

Frontend uses vanilla JavaScript with modular approach:
- **No frameworks**: Pure JavaScript with ES6+ features
- **Modular structure**: Each page has its own JS file
- **API Integration**: Fetch API for AJAX requests
- **Chart.js**: For dashboard visualizations
- **Bootstrap**: For UI components and responsiveness

### Key JavaScript Files
- `app.js` - Main application, session management, global utilities
- `dashboard-moderno.js` - Dashboard charts and real-time updates
- `estoque.js` - Asset inventory management
- `colaboradores.js` - Employee management functions
- `export-csv.js` - CSV export functionality
- `session-manager.js` - Session timeout warnings and management

## Troubleshooting Common Issues

### Database Connection Issues
- Verify MariaDB is running: `docker-compose ps`
- Check connection string in `.env` file
- Ensure database exists and user has permissions
- For Docker: hostname should be `db`, for local: `localhost`

### LDAP Authentication Issues
- Verify LDAP server connectivity
- Check group membership for authorization
- Validate DN and domain configurations
- Test with AD user credentials

### WeasyPrint PDF Generation Issues
- Install system dependencies for PDF generation
- Use `requirements-minimal.txt` if WeasyPrint causes build issues
- PDF fallback available in `core/pdf_fallback.py`

### Session Timeout Issues
- Sessions expire after 1 hour of inactivity
- Check browser console for session warnings
- Verify session configuration in `core/config.py`

## API Integration Notes

All API endpoints are documented in `README_API.md`. Key points:
- Most endpoints require session authentication
- JWT authentication available but session-based is primary
- All operations logged via audit service
- CRUD operations follow RESTful patterns
- Export/import functionality available via CSV