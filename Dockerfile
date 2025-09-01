# =============================================================================
# DOCKERFILE - CURIANGO CONTROLE DE ATIVOS
# =============================================================================
# Container para aplicação Flask Python

FROM python:3.12-slim

# Metadados do container
LABEL maintainer="Curiango Team"
LABEL description="Sistema de Controle de Ativos IT"
LABEL version="1.0"

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=manage.py
ENV FLASK_ENV=production

# Instalar dependências do sistema básicas
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    pkg-config \
    default-libmysqlclient-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências específicas do WeasyPrint
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar e instalar dependências Python
COPY curiango/requirements.txt .
COPY curiango/requirements-minimal.txt .
RUN pip install --no-cache-dir --upgrade pip

# Instalar dependências básicas primeiro
RUN pip install --no-cache-dir -r requirements-minimal.txt

# Tentar instalar WeasyPrint separadamente
RUN pip install --no-cache-dir WeasyPrint==62.3 || \
    echo "WeasyPrint não pôde ser instalado - usando fallback"

# Copiar código da aplicação
COPY curiango/ .

# Criar diretórios necessários
RUN mkdir -p logs
RUN mkdir -p app/static/uploads

# Configurar permissões (mantendo root)
RUN chmod -R 777 /app/logs
RUN chmod -R 777 /app/app/static/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Expor porta
EXPOSE 5000

# Comando padrão (remover entrypoint script por enquanto)
CMD ["python", "manage.py"]