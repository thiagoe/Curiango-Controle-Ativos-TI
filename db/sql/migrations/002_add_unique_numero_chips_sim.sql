-- Migração: Adicionar constraints únicas para prevenir duplicidade
-- Data: 2024-08-28
-- Descrição: Prevenir duplicidade de números de chips SIM e patrimônios de computadores

-- 1. Remover possíveis duplicatas de números de chips SIM (se houver)
-- Esta query mantém apenas o chip com menor ID em caso de duplicata
DELETE c1 FROM chips_sim c1
INNER JOIN chips_sim c2 
WHERE c1.id > c2.id AND c1.numero = c2.numero AND c1.numero IS NOT NULL;

-- 2. Remover possíveis duplicatas de patrimônios (se houver)
-- Esta query mantém apenas o computador com menor ID em caso de duplicata
DELETE c1 FROM computadores c1
INNER JOIN computadores c2 
WHERE c1.id > c2.id AND c1.patrimonio = c2.patrimonio AND c1.patrimonio IS NOT NULL;

-- 3. Adicionar constraint única no campo numero de chips SIM
ALTER TABLE chips_sim 
ADD CONSTRAINT uk_chips_sim_numero UNIQUE (numero);

-- 4. Adicionar constraint única no campo patrimonio de computadores
ALTER TABLE computadores 
ADD CONSTRAINT uk_computadores_patrimonio UNIQUE (patrimonio);