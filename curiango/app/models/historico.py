from ..core.db import db

class HistoricoAtivo(db.Model):
    __tablename__ = 'historico_ativos'
    
    id = db.Column(db.Integer, primary_key=True)
    ativo_id = db.Column(db.Integer, db.ForeignKey('ativos.id'), nullable=False)
    colaborador_id = db.Column(db.Integer, db.ForeignKey('colaboradores.id'), nullable=False)
    data_inicio = db.Column(db.TIMESTAMP, nullable=False)
    data_fim = db.Column(db.TIMESTAMP)
    tipo = db.Column(db.String(20), nullable=False)  # 'alocacao' ou 'devolucao'
    observacao = db.Column(db.String(500))
    
    # Remover relacionamentos bi-direcionais por enquanto para evitar erros
    # ativo = db.relationship('Ativo', back_populates='historico')
    # colaborador = db.relationship('Colaborador', back_populates='historico_ativos')

    def to_dict(self):
        return {
            'id': self.id,
            'ativo_id': self.ativo_id,
            'colaborador_id': self.colaborador_id,
            'colaborador_nome': self.colaborador.nome if self.colaborador else None,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_fim': self.data_fim.isoformat() if self.data_fim else None,
            'tipo': self.tipo,
            'observacao': self.observacao
        }
