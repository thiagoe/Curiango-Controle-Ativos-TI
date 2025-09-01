from ..core.db import db
from datetime import datetime

# Espelhando suas tabelas essenciais (campos mínimos para iniciar; expanda conforme seu SQL)
class UnidadeNegocio(db.Model):
    __tablename__ = "unidades_negocio"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Setor(db.Model):
    __tablename__ = "setores"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False, unique=True)
    email_responsavel = db.Column(db.String(150), nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Colaborador(db.Model):
    __tablename__ = "colaboradores"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    matricula = db.Column(db.String(50))
    cpf = db.Column(db.String(14))
    email = db.Column(db.String(150))
    cargo = db.Column(db.String(100))
    setor_id = db.Column(db.Integer, db.ForeignKey('setores.id'), nullable=True)
    status = db.Column(db.Enum("ativo", "desligado"), default="ativo")
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos com cascade para permitir exclusão
    setor = db.relationship('Setor', backref='colaboradores')
    historico_alocacoes = db.relationship('HistoricoAlocacao', cascade='all, delete-orphan', backref='colaborador')

class Marca(db.Model):
    __tablename__ = "marcas"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Operadora(db.Model):
    __tablename__ = "operadoras"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModeloTermo(db.Model):
    __tablename__ = "modelos_termo"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class Ativo(db.Model):
    __tablename__ = "ativos"
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.Enum("smartphone", "notebook", "desktop", "chip_sim"), nullable=False)
    condicao = db.Column(db.Enum("novo","usado","danificado","em_manutencao","inativo"), default="novo")
    usuario_atual_id = db.Column(db.Integer, db.ForeignKey("colaboradores.id"), nullable=True)
    unidade_negocio_id = db.Column(db.Integer, db.ForeignKey("unidades_negocio.id"))
    valor = db.Column(db.Numeric(10,2))
    data_alocacao = db.Column(db.TIMESTAMP, nullable=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos com cascade para permitir exclusão
    historico_alocacoes = db.relationship('HistoricoAlocacao', cascade='all, delete-orphan', backref='ativo')
    manutencoes = db.relationship('Manutencao', cascade='all, delete-orphan', backref='ativo')
    notas = db.relationship('NotaAtivo', cascade='all, delete-orphan', backref='ativo')

class Smartphone(db.Model):
    __tablename__ = "smartphones"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), unique=True, nullable=False)
    marca_id = db.Column(db.Integer, db.ForeignKey("marcas.id"))
    modelo = db.Column(db.String(100))
    imei_slot = db.Column(db.String(20), unique=True)
    acessorios = db.Column(db.Text)

class Computador(db.Model):
    __tablename__ = "computadores"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), unique=True, nullable=False)
    tipo_computador = db.Column(db.Enum("notebook","desktop"), nullable=False)
    patrimonio = db.Column(db.String(50), unique=True)
    marca_id = db.Column(db.Integer, db.ForeignKey("marcas.id"))
    modelo = db.Column(db.String(100))
    serie = db.Column(db.String(100))
    so_versao = db.Column(db.String(100))
    processador = db.Column(db.String(150))
    memoria = db.Column(db.String(50))
    hd = db.Column(db.String(100))
    acessorios = db.Column(db.Text)

class ChipSim(db.Model):
    __tablename__ = "chips_sim"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), unique=True, nullable=False)
    numero = db.Column(db.String(20), unique=True)
    operadora_id = db.Column(db.Integer, db.ForeignKey("operadoras.id"))
    tipo = db.Column(db.String(20))
    
class HistoricoAlocacao(db.Model):
    __tablename__ = "historico_alocacoes"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), nullable=False)
    colaborador_id = db.Column(db.Integer, db.ForeignKey("colaboradores.id", ondelete="CASCADE"), nullable=False)
    data_inicio = db.Column(db.TIMESTAMP, nullable=False)
    data_fim = db.Column(db.TIMESTAMP)
    motivo_transferencia = db.Column(db.Text)
    termo_gerado = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class Manutencao(db.Model):
    __tablename__ = "manutencoes"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class ParametroSistema(db.Model):
    __tablename__ = "parametros_sistema"
    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(100), unique=True, nullable=False)
    valor = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.Enum("texto", "html", "email"), default="texto")
    descricao = db.Column(db.Text)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

class LogAuditoria(db.Model):
    __tablename__ = "log_auditoria"
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(100), nullable=False)
    nivel = db.Column(db.String(10), nullable=False)
    acao = db.Column(db.Enum("CREATE","UPDATE","DELETE","TRANSFER","REMOVE_ALLOCATION","LOGIN","LOGOUT","READ"), nullable=False)
    tabela = db.Column(db.String(50))
    registro_id = db.Column(db.Integer)
    descricao = db.Column(db.Text, nullable=False)
    dados_antigos = db.Column(db.JSON)
    dados_novos = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

class NotaAtivo(db.Model):
    __tablename__ = "notas_ativos"
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey("ativos.id", ondelete="CASCADE"), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    usuario = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)