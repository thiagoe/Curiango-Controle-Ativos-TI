from flask import Blueprint, jsonify
from ..core.db import db
from datetime import datetime
import logging

bp = Blueprint("health", __name__)
logger = logging.getLogger("app")

@bp.get("/health")
def health_check():
    """Endpoint de verificação de saúde do sistema"""
    try:
        # Testar conexão com banco de dados
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "service": "curiango-controle-ativos"
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "database": "disconnected",
            "service": "curiango-controle-ativos",
            "error": str(e)
        }), 503