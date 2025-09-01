-- =====================================================
-- Sistema de Gerenciamento de Ativos de TI
-- Banco: sistema_ativos_db (definido no docker-compose)
-- Objetivo: Criar/atualizar schema de tabelas, índices, views e seeds.
-- Observações:
--  - Executado automaticamente pelo container MariaDB em sua primeira subida.
--  - Chips SIM simplificado: SEM PUK, PIN1, ICCID.
--  - Auditoria detalhada: nível, ação, tabela, dados antes/depois.
-- =====================================================

-- Garante a existência do banco (por compatibilidade com ambientes locais)
CREATE DATABASE IF NOT EXISTS sistema_ativos_db;
USE sistema_ativos_db;

-- =========================
-- PARTE 1: Tabelas de Parametrização
-- =========================

-- Tabela: marcas
-- Descrição: Catálogo de marcas dos equipamentos (ex.: Apple, Dell).
CREATE TABLE IF NOT EXISTS marcas (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único da marca
  nome VARCHAR(100) NOT NULL UNIQUE,                                -- Nome da marca (único)
  ativo BOOLEAN DEFAULT TRUE,                                       -- Flag de uso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Cadastro de marcas dos equipamentos';

-- Tabela: operadoras
-- Descrição: Operadoras de telefonia para chips SIM.
CREATE TABLE IF NOT EXISTS operadoras (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único da operadora
  nome VARCHAR(100) NOT NULL UNIQUE,                                -- Nome da operadora (único)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Cadastro de operadoras de telefonia';

-- Tabela: unidades_negocio
-- Descrição: Unidades/áreas da organização para alocação de ativos/colaboradores.
CREATE TABLE IF NOT EXISTS unidades_negocio (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único da unidade
  nome VARCHAR(150) NOT NULL,                                       -- Nome da unidade
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Unidades de negócio';

-- Tabela: modelos_termo
-- Descrição: Modelos de termo de responsabilidade para geração de PDF.
CREATE TABLE IF NOT EXISTS modelos_termo (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do modelo
  nome VARCHAR(100) NOT NULL UNIQUE,                                -- Nome descritivo do modelo (agora com UNIQUE para evitar duplicatas)
  conteudo TEXT NOT NULL,                                           -- Template com placeholders (ex.: {NOME_USUARIO})
  ativo BOOLEAN DEFAULT TRUE,                                       -- Flag de uso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Modelos de termos de responsabilidade';

-- Tabela: parametros_sistema
-- Descrição: Parâmetros configuráveis do sistema (templates de email, termo, etc.)
CREATE TABLE IF NOT EXISTS parametros_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do parâmetro
  chave VARCHAR(100) NOT NULL UNIQUE,                               -- Chave única do parâmetro
  valor TEXT NOT NULL,                                              -- Valor do parâmetro
  tipo ENUM('texto', 'html', 'email') DEFAULT 'texto',              -- Tipo do parâmetro
  descricao TEXT,                                                   -- Descrição do parâmetro
  ativo BOOLEAN DEFAULT TRUE,                                       -- Flag de uso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Parâmetros configuráveis do sistema';

-- =========================
-- PARTE 2: Tabelas de Setores e Colaboradores
-- =========================

-- Tabela: setores
-- Descrição: Setores/departamentos da empresa com responsável.
CREATE TABLE IF NOT EXISTS setores (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do setor
  nome VARCHAR(150) NOT NULL UNIQUE,                                -- Nome do setor (único)
  email_responsavel VARCHAR(150) NOT NULL,                          -- Email do responsável do setor
  ativo BOOLEAN DEFAULT TRUE,                                       -- Flag de uso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- Última atualização
) COMMENT='Cadastro de setores/departamentos';

-- Tabela: colaboradores
-- Descrição: Cadastro de usuários que podem receber ativos.
CREATE TABLE IF NOT EXISTS colaboradores (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do colaborador
  nome VARCHAR(150) NOT NULL,                                       -- Nome completo
  matricula VARCHAR(50) UNIQUE,                                     -- Matrícula corporativa (única)
  cpf VARCHAR(14) UNIQUE,                                           -- CPF (único)
  email VARCHAR(150),                                               -- E-mail
  cargo VARCHAR(100),                                               -- Cargo/função
  setor_id INT NULL,                                                -- FK para setor
  status ENUM('ativo', 'desligado') DEFAULT 'ativo',                -- Situação atual
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Última atualização
  
  FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL -- Relacionamento com setor
) COMMENT='Cadastro de colaboradores';

-- =========================
-- PARTE 3: Tabelas de Ativos
-- =========================

-- Tabela: ativos
-- Descrição: Tabela base de ativos com campos comuns e relacionamentos.
CREATE TABLE IF NOT EXISTS ativos (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do ativo
  tipo ENUM('smartphone','notebook','desktop','chip_sim') NOT NULL, -- Tipo de ativo
  condicao ENUM('novo','usado','danificado','em_manutencao','inativo') DEFAULT 'novo',  -- Estado/condição
  usuario_atual_id INT NULL,                                        -- FK para colaborador atual (alocado)
  unidade_negocio_id INT,                                           -- FK para unidade de negócio
  valor DECIMAL(10,2),                                              -- Valor aquisitivo
  data_alocacao TIMESTAMP NULL,                                    -- Data da última alocação
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Última atualização
  FOREIGN KEY (usuario_atual_id) REFERENCES colaboradores(id) ON DELETE SET NULL,  -- Se colaborador apagado, zera alocação
  FOREIGN KEY (unidade_negocio_id) REFERENCES unidades_negocio(id)  -- Unidade do ativo
) COMMENT='Campos comuns dos ativos';

-- Tabela: historico_ativos
-- Descrição: Histórico de todas as movimentações de ativos (alocações/devoluções)
CREATE TABLE IF NOT EXISTS historico_ativos (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único do histórico
  ativo_id INT NOT NULL,                                           -- FK para o ativo
  colaborador_id INT NOT NULL,                                      -- FK para o colaborador
  data_inicio TIMESTAMP NOT NULL,                                  -- Data início da alocação/evento (com horário)
  data_fim TIMESTAMP NULL,                                         -- Data fim (com horário, para devoluções)
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('alocacao', 'devolucao')), -- Tipo do evento
  observacao TEXT,                                                 -- Observações sobre a movimentação
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação do registro
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,  -- Se ativo apagado, apaga histórico
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE -- Colaborador com CASCADE
) COMMENT='Histórico de movimentações dos ativos';

-- Tabela: manutencoes
-- Descrição: Registro de manutenções realizadas nos ativos
CREATE TABLE IF NOT EXISTS manutencoes (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único da manutenção
  ativo_id INT NOT NULL,                                           -- FK para o ativo
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('preventiva', 'corretiva', 'upgrade')), -- Tipo da manutenção
  descricao TEXT NOT NULL,                                         -- Descrição do que foi feito
  observacoes TEXT,                                                -- Observações adicionais
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,          -- Data de criação
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Última atualização
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE   -- Se ativo apagado, apaga manutenções
) COMMENT='Registro de manutenções dos ativos';

-- Tabela: smartphones
-- Descrição: Detalhes específicos para ativos do tipo smartphone.
CREATE TABLE IF NOT EXISTS smartphones (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único
  ativo_id INT NOT NULL UNIQUE,                                     -- FK único para ativos (1:1)
  marca_id INT,                                                     -- FK para marca
  modelo VARCHAR(100),                                              -- Modelo (ex.: iPhone 14)
  imei_slot VARCHAR(20) UNIQUE,                                    -- IMEI principal (único)
  acessorios TEXT,                                                  -- Lista de acessórios
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,   -- Exclui junto com ativo
  FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL   -- Relaciona marca
) COMMENT='Dados de smartphones';

-- Tabela: computadores
-- Descrição: Detalhes específicos para notebooks e desktops.
CREATE TABLE IF NOT EXISTS computadores (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único
  ativo_id INT NOT NULL UNIQUE,                                     -- FK único para ativos (1:1)
  tipo_computador ENUM('notebook','desktop') NOT NULL,              -- Tipo de computador
  patrimonio VARCHAR(50) UNIQUE,                                    -- Número de patrimônio (único)
  marca_id INT,                                                     -- FK para marca
  modelo VARCHAR(100),                                              -- Modelo
  serie VARCHAR(100),                                               -- Número de série
  so_versao VARCHAR(100),                                           -- Sistema operacional/versão
  processador VARCHAR(150),                                         -- CPU
  memoria VARCHAR(50),                                              -- RAM
  hd VARCHAR(100),                                                  -- Armazenamento
  acessorios TEXT,                                                  -- Acessórios
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,   -- Exclui junto com ativo
  FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL   -- Marca
) COMMENT='Dados de notebooks/desktops';

-- Tabela: chips_sim (simplificado)
-- Descrição: Dados específicos de chips SIM; simplificado sem PUK/PIN1/ICCID.
CREATE TABLE IF NOT EXISTS chips_sim (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único
  ativo_id INT NOT NULL UNIQUE,                                     -- FK único para ativos (1:1)
  numero VARCHAR(20) UNIQUE,                                        -- Número da linha (único)
  tipo VARCHAR(20),                                                 -- Voz ou Dados
  operadora_id INT,                                                 -- FK para operadora  
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,   -- Exclui junto com ativo
  FOREIGN KEY (operadora_id) REFERENCES operadoras(id) ON DELETE SET NULL -- Operadora
) COMMENT='Dados de chips SIM (simplificado)';

-- =========================
-- PARTE 4: Histórico, Manutenções e Auditoria
-- =========================

-- Tabela: historico_alocacoes
-- Descrição: Rastreia transferências e alocações ao longo do tempo.
CREATE TABLE IF NOT EXISTS historico_alocacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único
  ativo_id INT NOT NULL,                                            -- FK para ativo
  colaborador_id INT NOT NULL,                                      -- FK para colaborador
  data_inicio TIMESTAMP NOT NULL,                                   -- Início da alocação (com horário)
  data_fim TIMESTAMP NULL,                                          -- Fim da alocação (com horário, nulo = atual)
  motivo_transferencia TEXT,                                        -- Motivo informado
  termo_gerado BOOLEAN DEFAULT FALSE,                               -- Se termo (PDF) foi gerado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,   -- Exclui junto com ativo
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE -- Referência colaborador com CASCADE
) COMMENT='Histórico de alocações de ativos';


-- Tabela: log_auditoria
-- Descrição: Auditoria detalhada de ações (CRUD, transferências, login/logout).
CREATE TABLE IF NOT EXISTS log_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único
  usuario VARCHAR(100) NOT NULL,                                    -- Usuário responsável
  nivel VARCHAR(10) NOT NULL,                                       -- Nível do log: INFO/DEBUG/WARN/ERROR
  acao ENUM('CREATE','UPDATE','DELETE','TRANSFER','REMOVE_ALLOCATION','LOGIN','LOGOUT','READ') NOT NULL, -- Ação
  tabela VARCHAR(50),                                               -- Tabela impactada (opcional)
  registro_id INT,                                                  -- ID do registro impactado (opcional)
  descricao TEXT NOT NULL,                                          -- Mensagem descritiva
  dados_antigos JSON,                                               -- Snapshot anterior (quando aplicável)
  dados_novos JSON,                                                 -- Snapshot novo (quando aplicável)
  ip_address VARCHAR(45),                                           -- IP do cliente
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP                    -- Data/hora do evento
) COMMENT='Log detalhado de auditoria';

-- =========================
-- PARTE 5: Views para Relatórios/Dashboard
-- =========================

-- View: vw_ativos_completos
-- Descrição: Consolida dados de ativos com descrições legíveis e relacionamentos comuns.
CREATE OR REPLACE VIEW vw_ativos_completos AS
SELECT 
  a.id,
  a.tipo,
  a.condicao,
  a.valor,
  c.nome AS usuario_atual,
  un.nome AS unidade_negocio,
  CASE 
    WHEN a.tipo='smartphone' THEN CONCAT(m.nome,' ', s.modelo)
    WHEN a.tipo IN ('notebook','desktop') THEN CONCAT(m2.nome,' ', comp.modelo)
    WHEN a.tipo='chip_sim' THEN CONCAT('Chip ', op.nome, ' - ', ch.numero)
  END AS descricao_ativo
FROM ativos a
LEFT JOIN colaboradores c ON c.id = a.usuario_atual_id
LEFT JOIN unidades_negocio un ON un.id = a.unidade_negocio_id
LEFT JOIN smartphones s ON s.ativo_id = a.id
LEFT JOIN marcas m ON m.id = s.marca_id
LEFT JOIN computadores comp ON comp.ativo_id = a.id
LEFT JOIN marcas m2 ON m2.id = comp.marca_id
LEFT JOIN chips_sim ch ON ch.ativo_id = a.id
LEFT JOIN operadoras op ON op.id = ch.operadora_id;

-- View: vw_dashboard_contadores
-- Descrição: Agregados para cards do dashboard e gráficos de status.
CREATE OR REPLACE VIEW vw_dashboard_contadores AS
SELECT 
  tipo,
  COUNT(*) AS total,                                                -- Total por tipo
  SUM(CASE WHEN usuario_atual_id IS NOT NULL THEN 1 ELSE 0 END) AS em_uso,       -- Alocados
  SUM(CASE WHEN usuario_atual_id IS NULL THEN 1 ELSE 0 END) AS em_estoque,       -- Sem alocação
  SUM(CASE WHEN condicao='inativo' THEN 1 ELSE 0 END) AS inativos,               -- Inativos
  SUM(CASE WHEN condicao='em_manutencao' THEN 1 ELSE 0 END) AS em_manutencao     -- Em manutenção
FROM ativos
GROUP BY tipo;

-- =========================
-- PARTE 6: Índices para Performance
-- =========================

-- Índices em colunas frequentemente filtradas/joinadas.
CREATE INDEX IF NOT EXISTS idx_ativos_tipo ON ativos(tipo);
CREATE INDEX IF NOT EXISTS idx_ativos_usuario ON ativos(usuario_atual_id);
CREATE INDEX IF NOT EXISTS idx_ativos_unidade ON ativos(unidade_negocio_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);
CREATE INDEX IF NOT EXISTS idx_log_created ON log_auditoria(created_at);

-- =========================
-- PARTE 7: Seeds (dados iniciais)
-- =========================

-- Povoa tabelas básicas se ainda não houver registros (idempotente).
INSERT INTO marcas (nome) VALUES ('Apple'),('Samsung'),('Dell'),('HPX')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

INSERT INTO operadoras (nome) VALUES ('Vivo'),('Claro'),('TIM'),('OiX')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

INSERT INTO unidades_negocio (nome) VALUES ('TI')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

INSERT INTO setores (nome, email_responsavel) VALUES 
('Tecnologia da Informação', 'ti@empresa.com'),
('Recursos Humanos', 'rh@empresa.com'),
('Financeiro', 'financeiro@empresa.com'),
('Operações', 'operacoes@empresa.com'),
('Comercial', 'comercial@empresa.com')
ON DUPLICATE KEY UPDATE nome=VALUES(nome), email_responsavel=VALUES(email_responsavel);

INSERT INTO modelos_termo (nome, conteudo) VALUES 
('Termo Padrão', 'TERMO DE RESPONSABILIDADE\n\nEu, {NOME_USUARIO}, CPF {CPF_USUARIO}, matrícula {MATRICULA_USUARIO}, recebi:\n{DETALHES_EQUIPAMENTO}\n\nData: {DATA_TERMO}\nAssinatura: __________________')
ON DUPLICATE KEY UPDATE nome=VALUES(nome);

-- Parâmetros padrão do sistema
INSERT INTO parametros_sistema (chave, valor, tipo, descricao) VALUES 
('termo_responsabilidade_template', '<!DOCTYPE html>
<html>
<head>
    <title>Termo de Responsabilidade</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TERMO DE RESPONSABILIDADE DE EQUIPAMENTO</h2>
    </div>
    
    <div class="content">
        <p>Eu, <strong>{{ NOME_USUARIO }}</strong>, portador(a) do CPF <strong>{{ CPF_USUARIO }}</strong>, matrícula <strong>{{ MATRICULA_USUARIO }}</strong>, declaro ter recebido o seguinte equipamento:</p>
        
        <p><strong>Equipamento:</strong> {{ DETALHES_EQUIPAMENTO }}</p>
        
        <p>Comprometo-me a:</p>
        <ul>
            <li>Utilizar o equipamento apenas para fins profissionais</li>
            <li>Zelar pela integridade física do equipamento</li>
            <li>Comunicar imediatamente qualquer dano ou problema</li>
            <li>Devolver o equipamento quando solicitado</li>
        </ul>
        
        <p>Declaro estar ciente de que sou responsável pelo equipamento recebido e que eventuais danos serão de minha responsabilidade.</p>
    </div>
    
    <div class="signature">
        <p>Data: ___/___/______</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ NOME_USUARIO }}</p>
        <p>CPF: {{ CPF_USUARIO }}</p>
    </div>
</body>
</html>', 'html', 'Template HTML do termo de responsabilidade'),
('email_alocacao_assunto', 'Ativo Alocado - {{ ATIVO_DESCRICAO }}', 'email', 'Assunto do email de alocação de ativo'),
('email_alocacao_corpo', 'Olá {{ NOME_COLABORADOR }},

Um ativo foi alocado para você:

Ativo: {{ ATIVO_DESCRICAO }}
Data de Alocação: {{ DATA_ALOCACAO }}

Em anexo você encontrará o termo de responsabilidade que deve ser assinado e devolvido ao setor responsável.

Atenciosamente,
Sistema de Controle de Ativos', 'email', 'Corpo do email de alocação de ativo'),
('email_devolucao_assunto', 'Ativo Devolvido - {{ ATIVO_DESCRICAO }}', 'email', 'Assunto do email de devolução de ativo'),
('email_devolucao_corpo', 'Olá {{ NOME_COLABORADOR }},

O ativo que estava sob sua responsabilidade foi devolvido:

Ativo: {{ ATIVO_DESCRICAO }}
Data de Devolução: {{ DATA_DEVOLUCAO }}

Este ativo não está mais sob sua responsabilidade.

Atenciosamente,
Sistema de Controle de Ativos', 'email', 'Corpo do email de devolução de ativo')
ON DUPLICATE KEY UPDATE chave=VALUES(chave);

-- =========================
-- PARTE 8: Tabela de Notas dos Ativos
-- =========================

-- Tabela: notas_ativos
-- Descrição: Notas/observações sobre ativos com histórico
CREATE TABLE IF NOT EXISTS notas_ativos (
  id INT AUTO_INCREMENT PRIMARY KEY,                                -- Identificador único da nota
  ativo_id INT NOT NULL,                                           -- FK para ativo
  conteudo TEXT NOT NULL,                                          -- Conteúdo da nota
  usuario VARCHAR(100) NOT NULL,                                   -- Usuário que criou a nota
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                   -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Última atualização
  
  FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE CASCADE,  -- Relacionamento com ativo
  INDEX idx_notas_ativo_id (ativo_id),                            -- Índice para consultas por ativo
  INDEX idx_notas_created_at (created_at)                         -- Índice para ordenação por data
) COMMENT='Notas e observações dos ativos com histórico';

-- =========================
-- PARTE 9: Migrações
-- =========================

-- Migração para remover o campo observacoes da tabela ativos
-- Execute apenas se o campo ainda existir
ALTER TABLE ativos DROP COLUMN IF EXISTS observacoes;

-- Migração para simplificar tabela de manutenções - remover campos de data
-- Remove campos de data que não são mais necessários no novo conceito
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_inicio;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS previsao_conclusao;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_conclusao;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS data_manutencao;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS descricao_servico;
ALTER TABLE manutencoes DROP COLUMN IF EXISTS valor;