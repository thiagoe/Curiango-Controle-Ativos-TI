#!/bin/bash
# =============================================================================
# DOCKER ENTRYPOINT - CURIANGO CONTROLE DE ATIVOS
# =============================================================================
# Script de inicialização do container Flask

set -e

echo "🚀 Iniciando Curiango Controle de Ativos..."

# Aguardar disponibilidade do banco de dados
echo "⏳ Aguardando MariaDB ficar disponível..."
while ! curl -s mysql://db:3306 >/dev/null 2>&1; do
    echo "   Banco ainda não disponível, aguardando 5s..."
    sleep 5
done
echo "✅ MariaDB disponível!"

# Verificar conectividade com o banco
echo "🔍 Testando conectividade com banco de dados..."
python -c "
import pymysql
import os
import time

# Configurações do banco via variáveis de ambiente
db_config = {
    'host': 'db',
    'user': 'usuario_app', 
    'password': 'senha_exemplo',
    'database': 'sistema_ativos_db',
    'port': 3306
}

max_retries = 30
for i in range(max_retries):
    try:
        conn = pymysql.connect(**db_config)
        conn.close()
        print('✅ Conexão com banco estabelecida!')
        break
    except Exception as e:
        if i == max_retries - 1:
            print(f'❌ Falha na conexão após {max_retries} tentativas: {e}')
            exit(1)
        print(f'   Tentativa {i+1}/{max_retries} falhou, tentando novamente em 2s...')
        time.sleep(2)
"

echo "🔧 Configurando ambiente Flask..."

# Criar diretórios se não existirem
mkdir -p logs
mkdir -p app/static/uploads

# Configurar permissões
chmod 755 logs
chmod 755 app/static/uploads

echo "📚 Aplicando migrações de banco (se necessário)..."
# Aqui poderíamos adicionar comandos de migração se necessário
# python -c "from app import create_app; from app.core.db import db; app = create_app(); app.app_context().push(); db.create_all()"

echo "✅ Configuração concluída!"
echo "🌐 Iniciando servidor Flask na porta 5000..."

# Executar comando passado como parâmetro
exec "$@"