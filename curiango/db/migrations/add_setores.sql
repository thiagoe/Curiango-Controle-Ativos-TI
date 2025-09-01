-- Migração para adicionar funcionalidade de setores
-- Criado em: 2025-08-14

-- Criar tabela setores
CREATE TABLE IF NOT EXISTS setores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL UNIQUE,
    email_responsavel VARCHAR(150) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Adicionar coluna setor_id na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN setor_id INT NULL,
ADD CONSTRAINT fk_colaborador_setor 
    FOREIGN KEY (setor_id) REFERENCES setores(id) 
    ON DELETE SET NULL;

-- Inserir alguns setores padrão
INSERT INTO setores (nome, email_responsavel) VALUES
('Tecnologia da Informação', 'ti@empresa.com'),
('Recursos Humanos', 'rh@empresa.com'),
('Financeiro', 'financeiro@empresa.com'),
('Operações', 'operacoes@empresa.com'),
('Comercial', 'comercial@empresa.com');