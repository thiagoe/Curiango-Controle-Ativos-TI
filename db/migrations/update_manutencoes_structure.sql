-- Migração para atualizar estrutura da tabela de manutenções
-- Remove campos de data e simplifica a estrutura

USE sistema_ativos_db;

-- Remover campos de data que não são mais necessários
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_inicio;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS previsao_conclusao; 
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_conclusao;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_manutencao;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS descricao_servico;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS valor;

-- Garantir que a estrutura está correta
-- (Os campos tipo, descricao, observacoes, created_at, updated_at devem permanecer)

-- Verificar se os campos necessários existem, caso contrário criar
ALTER TABLE manutencoes 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'corretiva',
ADD COLUMN IF NOT EXISTS descricao TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Atualizar registros existentes que possam ter campos vazios
UPDATE manutencoes SET tipo = 'corretiva' WHERE tipo IS NULL OR tipo = '';
UPDATE manutencoes SET descricao = 'Manutenção registrada' WHERE descricao IS NULL OR descricao = '';