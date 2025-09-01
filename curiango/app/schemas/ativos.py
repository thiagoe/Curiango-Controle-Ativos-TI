from marshmallow import Schema, fields

class TransferenciaSchema(Schema):
    ativo_id = fields.Int(required=True)
    colaborador_id = fields.Int(required=True)
    motivo = fields.Str(required=False, allow_none=True)

class ManutencaoCreateSchema(Schema):
    tipo = fields.Str(required=True)
    descricao = fields.Str(required=True)
    observacoes = fields.Str(required=False, allow_none=True)