-- Migração para corrigir tipos de data no histórico de alocações
-- Data: 2025-08-27
-- Descrição: Altera data_inicio e data_fim de DATE para TIMESTAMP para incluir horários

USE sistema_ativos_db;

-- Backup da estrutura atual (opcional - descomente se necessário)
-- CREATE TABLE historico_alocacoes_backup AS SELECT * FROM historico_alocacoes;

-- ============================================================================
-- 1. ALTERAR CAMPOS DE DATE PARA TIMESTAMP
-- ============================================================================

-- Alterar data_inicio de DATE para TIMESTAMP
ALTER TABLE historico_alocacoes 
MODIFY COLUMN data_inicio TIMESTAMP NOT NULL;

-- Alterar data_fim de DATE para TIMESTAMP (permitindo NULL)
ALTER TABLE historico_alocacoes 
MODIFY COLUMN data_fim TIMESTAMP NULL;

-- ============================================================================
-- 2. ATUALIZAR REGISTROS EXISTENTES PARA INCLUIR HORÁRIO
-- ============================================================================

-- Para registros existentes que têm apenas data (00:00:00), vamos ajustar:
-- - data_inicio: ajustar para 09:00:00 (horário típico de trabalho)
-- - data_fim: ajustar para 18:00:00 (horário típico de fim de expediente)

-- Atualizar data_inicio para incluir horário de 09:00
UPDATE historico_alocacoes 
SET data_inicio = DATE_ADD(DATE(data_inicio), INTERVAL 9 HOUR) 
WHERE TIME(data_inicio) = '00:00:00';

-- Atualizar data_fim para incluir horário de 18:00 (apenas onde não é NULL)
UPDATE historico_alocacoes 
SET data_fim = DATE_ADD(DATE(data_fim), INTERVAL 18 HOUR) 
WHERE data_fim IS NOT NULL AND TIME(data_fim) = '00:00:00';

-- ============================================================================
-- 3. VERIFICAR ALTERAÇÕES
-- ============================================================================

-- Mostrar alguns registros para verificar se a alteração foi aplicada corretamente
SELECT 
    id,
    ativo_id,
    colaborador_id,
    data_inicio,
    data_fim,
    created_at
FROM historico_alocacoes 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar a estrutura da tabela
DESCRIBE historico_alocacoes;