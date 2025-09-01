-- Migração para permitir exclusão em cascata
-- Data: 2025-08-27
-- Descrição: Adiciona CASCADE DELETE para resolver problemas de exclusão de ativos e colaboradores

USE sistema_ativos_db;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. AJUSTAR FOREIGN KEYS PARA ATIVOS
-- ============================================================================

-- Remover constraints existentes e recriar com CASCADE
-- Smartphones
ALTER TABLE smartphones DROP FOREIGN KEY IF EXISTS smartphones_ibfk_1;
ALTER TABLE smartphones ADD CONSTRAINT fk_smartphones_ativo 
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;

-- Computadores  
ALTER TABLE computadores DROP FOREIGN KEY IF EXISTS computadores_ibfk_1;
ALTER TABLE computadores ADD CONSTRAINT fk_computadores_ativo
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;

-- Chips SIM
ALTER TABLE chips_sim DROP FOREIGN KEY IF EXISTS chips_sim_ibfk_1;  
ALTER TABLE chips_sim ADD CONSTRAINT fk_chips_sim_ativo
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;

-- Histórico de Alocações (CASCADE para ativo e colaborador)
ALTER TABLE historico_alocacoes DROP FOREIGN KEY IF EXISTS historico_alocacoes_ibfk_1;
ALTER TABLE historico_alocacoes DROP FOREIGN KEY IF EXISTS historico_alocacoes_ibfk_2;
ALTER TABLE historico_alocacoes ADD CONSTRAINT fk_historico_ativo
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;
ALTER TABLE historico_alocacoes ADD CONSTRAINT fk_historico_colaborador  
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;

-- Manutenções
ALTER TABLE manutencoes DROP FOREIGN KEY IF EXISTS manutencoes_ibfk_1;
ALTER TABLE manutencoes ADD CONSTRAINT fk_manutencoes_ativo
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;

-- Notas de Ativos  
ALTER TABLE notas_ativos DROP FOREIGN KEY IF EXISTS notas_ativos_ibfk_1;
ALTER TABLE notas_ativos ADD CONSTRAINT fk_notas_ativo
    FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. VERIFICAR SE TABELA historico_ativos EXISTE (pode ser duplicata)
-- ============================================================================

-- Se existir tabela historico_ativos (separada de historico_alocacoes)
-- ALTER TABLE historico_ativos DROP FOREIGN KEY IF EXISTS historico_ativos_ibfk_1;
-- ALTER TABLE historico_ativos DROP FOREIGN KEY IF EXISTS historico_ativos_ibfk_2;  
-- ALTER TABLE historico_ativos ADD CONSTRAINT fk_historico_ativos_ativo
--     FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE;
-- ALTER TABLE historico_ativos ADD CONSTRAINT fk_historico_ativos_colaborador
--     FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. LIMPAR REGISTROS ÓRFÃOS EXISTENTES (se houver)
-- ============================================================================

-- Remover smartphones sem ativo correspondente
DELETE FROM smartphones WHERE ativo_id NOT IN (SELECT id FROM ativos);

-- Remover computadores sem ativo correspondente  
DELETE FROM computadores WHERE ativo_id NOT IN (SELECT id FROM ativos);

-- Remover chips sem ativo correspondente
DELETE FROM chips_sim WHERE ativo_id NOT IN (SELECT id FROM ativos);

-- Remover histórico sem ativo ou colaborador correspondente
DELETE FROM historico_alocacoes WHERE ativo_id NOT IN (SELECT id FROM ativos);
DELETE FROM historico_alocacoes WHERE colaborador_id NOT IN (SELECT id FROM colaboradores);

-- Remover manutenções sem ativo correspondente
DELETE FROM manutencoes WHERE ativo_id NOT IN (SELECT id FROM ativos);

-- Remover notas sem ativo correspondente  
DELETE FROM notas_ativos WHERE ativo_id NOT IN (SELECT id FROM ativos);

-- Limpar referências de usuario_atual_id que apontam para colaboradores inexistentes
UPDATE ativos SET usuario_atual_id = NULL WHERE usuario_atual_id NOT IN (SELECT id FROM colaboradores);

-- ============================================================================
-- 4. REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS  
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar se as constraints foram criadas corretamente
SELECT 
    TABLE_NAME,
    COLUMN_NAME, 
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'sistema_ativos_db' 
  AND REFERENCED_TABLE_NAME IS NOT NULL
  AND TABLE_NAME IN ('smartphones', 'computadores', 'chips_sim', 'historico_alocacoes', 'manutencoes', 'notas_ativos')
ORDER BY TABLE_NAME, COLUMN_NAME;