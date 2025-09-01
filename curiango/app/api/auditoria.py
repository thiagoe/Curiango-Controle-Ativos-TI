from flask import Blueprint, request, jsonify
from ..core.auth import api_auth_required
from ..services.auditoria_service import buscar_logs_auditoria, converter_log_para_dict
from ..core.db import db
from ..models.dominio import LogAuditoria
import logging

bp = Blueprint("auditoria", __name__)
logger = logging.getLogger("app")

@bp.get("")
def listar_auditoria():
    """
    Lista logs de auditoria com filtros opcionais
    Suporta filtros: acao, usuario, tabela, data_inicio, data_fim, termo_busca, limite, offset
    """
    try:
        # Obter parâmetros de filtro
        filtros = {
            "acao": request.args.get("acao", "").strip(),
            "usuario": request.args.get("usuario", "").strip(),
            "tabela": request.args.get("tabela", "").strip(),
            "data_inicio": request.args.get("data_inicio", "").strip(),
            "data_fim": request.args.get("data_fim", "").strip(),
            "termo_busca": request.args.get("q", "").strip(),
            "limite": min(int(request.args.get("limite", 100)), 500),
            "offset": int(request.args.get("offset", 0))
        }
        
        # Remover filtros vazios
        filtros = {k: v for k, v in filtros.items() if v}
        
        logger.debug(f"Buscando logs de auditoria com filtros: {filtros}")
        
        # Buscar logs
        logs = buscar_logs_auditoria(filtros)
        
        # Converter para dicionários
        data = [converter_log_para_dict(log) for log in logs]
        
        return jsonify({
            "logs": data,
            "total": len(data),
            "filtros": filtros
        })
        
    except Exception as e:
        logger.exception("Erro ao listar logs de auditoria")
        return jsonify({"error": "Erro interno do servidor", "detail": str(e)}), 500

@bp.get("/<int:log_id>")
def obter_log_auditoria(log_id):
    """
    Obtém um log de auditoria específico pelo ID
    """
    try:
        log = db.session.query(LogAuditoria).filter_by(id=log_id).first()
        if not log:
            return jsonify({"error": "Log não encontrado"}), 404
        
        data = converter_log_para_dict(log)
        return jsonify(data)
        
    except Exception as e:
        logger.exception(f"Erro ao buscar log {log_id}")
        return jsonify({"error": "Erro interno do servidor", "detail": str(e)}), 500

@bp.get("/health")
def auditoria_health():
    return jsonify({"status": "ok"})