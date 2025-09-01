from flask import Blueprint, request, jsonify, session
from ..core.db import db
from ..core.auth import api_auth_required
from ..models.dominio import Marca, Operadora, UnidadeNegocio
from ..services.parametros_service import listar_parametros, atualizar_parametro, obter_parametro
import logging

bp = Blueprint("parametros", __name__)
logger = logging.getLogger("app")

# Opcional: proteger por sessão
def require_login(func):
    def wrapper(*args, **kwargs):
        if not session.get("user"):
            return jsonify({"error": "unauthorized"}), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

# ------------- Marcas -------------
@bp.get("/marcas")
def listar_marcas():
    q = Marca.query
    termo = (request.args.get("q") or "").strip()
    if termo:
        q = q.filter(Marca.nome.like(f"%{termo}%"))
    limit = min(int(request.args.get("limit", 100)), 500)
    offset = int(request.args.get("offset", 0))
    itens = q.order_by(Marca.nome.asc()).offset(offset).limit(limit).all()
    return jsonify([{"id": m.id, "nome": m.nome} for m in itens])

@bp.post("/marcas")
def criar_marca():
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    m = Marca(nome=nome)
    db.session.add(m)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar marca: {e}")
        return jsonify({"error": "falha ao criar marca"}), 500
    logger.info(f"Marca criada id={m.id} nome={m.nome}")
    return jsonify({"id": m.id, "nome": m.nome}), 201

@bp.get("/marcas/<int:marca_id>")
def obter_marca(marca_id):
    m = Marca.query.get_or_404(marca_id)
    return jsonify({"id": m.id, "nome": m.nome})

@bp.put("/marcas/<int:marca_id>")
def atualizar_marca(marca_id):
    m = Marca.query.get_or_404(marca_id)
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    m.nome = nome
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar marca id={marca_id}: {e}")
        return jsonify({"error": "falha ao atualizar marca"}), 500
    logger.info(f"Marca atualizada id={m.id} nome={m.nome}")
    return jsonify({"id": m.id, "nome": m.nome})

@bp.delete("/marcas/<int:marca_id>")
def excluir_marca(marca_id):
    m = Marca.query.get_or_404(marca_id)
    db.session.delete(m)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir marca id={marca_id}: {e}")
        return jsonify({"error": "falha ao excluir marca"}), 500
    logger.info(f"Marca excluída id={marca_id}")
    return jsonify({"ok": True}), 200

# ------------- Operadoras -------------
@bp.get("/operadoras")
def listar_operadoras():
    q = Operadora.query
    termo = (request.args.get("q") or "").strip()
    if termo:
        q = q.filter(Operadora.nome.like(f"%{termo}%"))
    limit = min(int(request.args.get("limit", 100)), 500)
    offset = int(request.args.get("offset", 0))
    itens = q.order_by(Operadora.nome.asc()).offset(offset).limit(limit).all()
    return jsonify([{"id": o.id, "nome": o.nome} for o in itens])

@bp.post("/operadoras")
def criar_operadora():
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    o = Operadora(nome=nome)
    db.session.add(o)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar operadora: {e}")
        return jsonify({"error": "falha ao criar operadora"}), 500
    logger.info(f"Operadora criada id={o.id} nome={o.nome}")
    return jsonify({"id": o.id, "nome": o.nome}), 201

@bp.get("/operadoras/<int:operadora_id>")
def obter_operadora(operadora_id):
    o = Operadora.query.get_or_404(operadora_id)
    return jsonify({"id": o.id, "nome": o.nome})

@bp.put("/operadoras/<int:operadora_id>")
def atualizar_operadora(operadora_id):
    o = Operadora.query.get_or_404(operadora_id)
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    o.nome = nome
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar operadora id={operadora_id}: {e}")
        return jsonify({"error": "falha ao atualizar operadora"}), 500
    logger.info(f"Operadora atualizada id={o.id} nome={o.nome}")
    return jsonify({"id": o.id, "nome": o.nome})

@bp.delete("/operadoras/<int:operadora_id>")
def excluir_operadora(operadora_id):
    o = Operadora.query.get_or_404(operadora_id)
    db.session.delete(o)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir operadora id={operadora_id}: {e}")
        return jsonify({"error": "falha ao excluir operadora"}), 500
    logger.info(f"Operadora excluída id={operadora_id}")
    return jsonify({"ok": True}), 200

# ------------- Unidades de Negócio -------------
@bp.get("/unidades")
def listar_unidades():
    q = UnidadeNegocio.query
    termo = (request.args.get("q") or "").strip()
    if termo:
        q = q.filter(UnidadeNegocio.nome.like(f"%{termo}%"))
    limit = min(int(request.args.get("limit", 100)), 500)
    offset = int(request.args.get("offset", 0))
    itens = q.order_by(UnidadeNegocio.nome.asc()).offset(offset).limit(limit).all()
    return jsonify([{"id": u.id, "nome": u.nome} for u in itens])

@bp.post("/unidades")
def criar_unidade():
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    u = UnidadeNegocio(nome=nome)
    db.session.add(u)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar unidade: {e}")
        return jsonify({"error": "falha ao criar unidade"}), 500
    logger.info(f"Unidade criada id={u.id} nome={u.nome}")
    return jsonify({"id": u.id, "nome": u.nome}), 201

@bp.get("/unidades/<int:unidade_id>")
def obter_unidade(unidade_id):
    u = UnidadeNegocio.query.get_or_404(unidade_id)
    return jsonify({"id": u.id, "nome": u.nome})

@bp.put("/unidades/<int:unidade_id>")
def atualizar_unidade(unidade_id):
    u = UnidadeNegocio.query.get_or_404(unidade_id)
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400
    u.nome = nome
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar unidade id={unidade_id}: {e}")
        return jsonify({"error": "falha ao atualizar unidade"}), 500
    logger.info(f"Unidade atualizada id={u.id} nome={u.nome}")
    return jsonify({"id": u.id, "nome": u.nome})

@bp.delete("/unidades/<int:unidade_id>")
def excluir_unidade(unidade_id):
    u = UnidadeNegocio.query.get_or_404(unidade_id)
    db.session.delete(u)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir unidade id={unidade_id}: {e}")
        return jsonify({"error": "falha ao excluir unidade"}), 500
    logger.info(f"Unidade excluída id={unidade_id}")
    return jsonify({"ok": True}), 200

# ------------- Parâmetros do Sistema -------------
@bp.get("/sistema")
def listar_parametros_sistema():
    """Lista todos os parâmetros do sistema"""
    try:
        parametros = listar_parametros()
        
        resultado = []
        for param in parametros:
            resultado.append({
                "id": param.id,
                "chave": param.chave,
                "valor": param.valor,
                "tipo": param.tipo,
                "descricao": param.descricao,
                "ativo": param.ativo,
                "created_at": param.created_at.isoformat() if param.created_at else None,
                "updated_at": param.updated_at.isoformat() if param.updated_at else None
            })
        
        return jsonify(resultado)
        
    except Exception as e:
        logger.exception("Erro ao listar parâmetros")
        return jsonify({"error": "Erro interno do servidor", "detail": str(e)}), 500

@bp.get("/sistema/<chave>")
def obter_parametro_sistema(chave):
    """Obtém um parâmetro específico pela chave"""
    try:
        valor = obter_parametro(chave)
        if not valor:
            return jsonify({"error": "Parâmetro não encontrado"}), 404
        
        return jsonify({"chave": chave, "valor": valor})
        
    except Exception as e:
        logger.exception(f"Erro ao obter parâmetro {chave}")
        return jsonify({"error": "Erro interno do servidor", "detail": str(e)}), 500

@bp.put("/sistema/<chave>")
def atualizar_parametro_sistema(chave):
    """Atualiza um parâmetro do sistema"""
    try:
        data = request.get_json() or {}
        
        if "valor" not in data:
            return jsonify({"error": "Campo 'valor' é obrigatório"}), 400
        
        param = atualizar_parametro(
            chave=chave,
            valor=data["valor"],
            tipo=data.get("tipo", "texto"),
            descricao=data.get("descricao", "")
        )
        
        return jsonify({
            "id": param.id,
            "chave": param.chave,
            "valor": param.valor,
            "tipo": param.tipo,
            "descricao": param.descricao,
            "updated_at": param.updated_at.isoformat() if param.updated_at else None
        })
        
    except Exception as e:
        logger.exception(f"Erro ao atualizar parâmetro {chave}")
        return jsonify({"error": "Erro interno do servidor", "detail": str(e)}), 500