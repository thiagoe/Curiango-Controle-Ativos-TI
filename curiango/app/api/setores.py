from flask import Blueprint, request, jsonify
from ..core.db import db
from ..core.auth import api_auth_required
from ..models.dominio import Setor
from ..services.auditoria_service import log_audit
from sqlalchemy.exc import IntegrityError
import logging

bp = Blueprint("setores", __name__)
logger = logging.getLogger("app")

@bp.get("")
def listar_setores():
    """Lista todos os setores ativos"""
    try:
        # Query base ordenada por nome
        setores = db.session.query(Setor)\
            .filter(Setor.ativo == True)\
            .order_by(Setor.nome)\
            .all()
        
        resultado = []
        for setor in setores:
            # Contar quantos colaboradores estão no setor
            from ..models.dominio import Colaborador
            colaboradores_count = db.session.query(Colaborador)\
                .filter(Colaborador.setor_id == setor.id)\
                .filter(Colaborador.status == 'ativo')\
                .count()
            
            resultado.append({
                "id": setor.id,
                "nome": setor.nome,
                "email_responsavel": setor.email_responsavel,
                "ativo": setor.ativo,
                "colaboradores_count": colaboradores_count,
                "created_at": setor.created_at.isoformat() if setor.created_at else None
            })
        
        return jsonify(resultado)
        
    except Exception as e:
        logger.exception("Erro ao listar setores")
        return jsonify({"error": "Erro ao listar setores", "detail": str(e)}), 500

@bp.post("")
def criar_setor():
    """Cria um novo setor"""
    try:
        data = request.get_json() or {}
        
        # Validações
        nome = data.get("nome", "").strip()
        email_responsavel = data.get("email_responsavel", "").strip()
        
        if not nome:
            return jsonify({"error": "Nome do setor é obrigatório"}), 400
        
        if not email_responsavel:
            return jsonify({"error": "Email do responsável é obrigatório"}), 400
        
        if len(nome) > 150:
            return jsonify({"error": "Nome do setor deve ter até 150 caracteres"}), 400
        
        if len(email_responsavel) > 150:
            return jsonify({"error": "Email deve ter até 150 caracteres"}), 400
        
        # Validar formato básico do email
        if "@" not in email_responsavel or "." not in email_responsavel:
            return jsonify({"error": "Email inválido"}), 400
        
        # Criar setor
        setor = Setor(
            nome=nome,
            email_responsavel=email_responsavel,
            ativo=data.get("ativo", True)
        )
        
        db.session.add(setor)
        db.session.commit()
        
        # Log de auditoria
        log_audit(
            acao="CREATE",
            tabela="setores",
            registro_id=setor.id,
            descricao=f"Novo setor criado: {nome}",
            dados_novos={
                "nome": nome,
                "email_responsavel": email_responsavel,
                "ativo": setor.ativo
            }
        )
        
        logger.info(f"Setor criado: {nome} (ID: {setor.id})")
        
        return jsonify({
            "id": setor.id,
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Já existe um setor com este nome"}), 409
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao criar setor")
        return jsonify({"error": "Erro ao criar setor", "detail": str(e)}), 500

@bp.get("/<int:setor_id>")
def obter_setor(setor_id):
    """Obtém dados de um setor específico"""
    try:
        setor = Setor.query.get_or_404(setor_id)
        
        # Contar colaboradores
        from ..models.dominio import Colaborador
        colaboradores_count = db.session.query(Colaborador)\
            .filter(Colaborador.setor_id == setor.id)\
            .filter(Colaborador.status == 'ativo')\
            .count()
        
        return jsonify({
            "id": setor.id,
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo,
            "colaboradores_count": colaboradores_count,
            "created_at": setor.created_at.isoformat() if setor.created_at else None,
            "updated_at": setor.updated_at.isoformat() if setor.updated_at else None
        })
        
    except Exception as e:
        logger.exception(f"Erro ao obter setor {setor_id}")
        return jsonify({"error": "Erro ao obter setor", "detail": str(e)}), 500

@bp.put("/<int:setor_id>")
def atualizar_setor(setor_id):
    """Atualiza dados de um setor"""
    try:
        setor = Setor.query.get_or_404(setor_id)
        data = request.get_json() or {}
        
        # Armazenar dados antigos para auditoria
        dados_antigos = {
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo
        }
        
        # Validações e atualizações
        if "nome" in data:
            nome = data["nome"].strip()
            if not nome:
                return jsonify({"error": "Nome do setor é obrigatório"}), 400
            if len(nome) > 150:
                return jsonify({"error": "Nome do setor deve ter até 150 caracteres"}), 400
            setor.nome = nome
        
        if "email_responsavel" in data:
            email = data["email_responsavel"].strip()
            if not email:
                return jsonify({"error": "Email do responsável é obrigatório"}), 400
            if len(email) > 150:
                return jsonify({"error": "Email deve ter até 150 caracteres"}), 400
            if "@" not in email or "." not in email:
                return jsonify({"error": "Email inválido"}), 400
            setor.email_responsavel = email
        
        if "ativo" in data:
            setor.ativo = bool(data["ativo"])
        
        db.session.commit()
        
        # Dados novos para auditoria
        dados_novos = {
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo
        }
        
        # Log de auditoria
        log_audit(
            acao="UPDATE",
            tabela="setores",
            registro_id=setor.id,
            descricao=f"Setor atualizado: {setor.nome}",
            dados_antigos=dados_antigos,
            dados_novos=dados_novos
        )
        
        logger.info(f"Setor atualizado: {setor.nome} (ID: {setor.id})")
        
        return jsonify({
            "id": setor.id,
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Já existe um setor com este nome"}), 409
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao atualizar setor {setor_id}")
        return jsonify({"error": "Erro ao atualizar setor", "detail": str(e)}), 500

@bp.delete("/<int:setor_id>")
def excluir_setor(setor_id):
    """Exclui (inativa) um setor"""
    try:
        setor = Setor.query.get_or_404(setor_id)
        
        # Verificar se há colaboradores vinculados
        from ..models.dominio import Colaborador
        colaboradores_vinculados = db.session.query(Colaborador)\
            .filter(Colaborador.setor_id == setor.id)\
            .filter(Colaborador.status == 'ativo')\
            .count()
        
        if colaboradores_vinculados > 0:
            return jsonify({
                "error": f"Não é possível excluir o setor. Existem {colaboradores_vinculados} colaboradores vinculados."
            }), 409
        
        # Inativar ao invés de deletar
        dados_antigos = {
            "nome": setor.nome,
            "email_responsavel": setor.email_responsavel,
            "ativo": setor.ativo
        }
        
        setor.ativo = False
        db.session.commit()
        
        # Log de auditoria
        log_audit(
            acao="DELETE",
            tabela="setores",
            registro_id=setor.id,
            descricao=f"Setor inativado: {setor.nome}",
            dados_antigos=dados_antigos,
            dados_novos={"ativo": False}
        )
        
        logger.info(f"Setor inativado: {setor.nome} (ID: {setor.id})")
        
        return jsonify({"message": "Setor inativado com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao excluir setor {setor_id}")
        return jsonify({"error": "Erro ao excluir setor", "detail": str(e)}), 500

@bp.get("/<int:setor_id>/colaboradores")
def listar_colaboradores_setor(setor_id):
    """Lista colaboradores de um setor"""
    try:
        setor = Setor.query.get_or_404(setor_id)
        
        from ..models.dominio import Colaborador
        colaboradores = db.session.query(Colaborador)\
            .filter(Colaborador.setor_id == setor.id)\
            .filter(Colaborador.status == 'ativo')\
            .order_by(Colaborador.nome)\
            .all()
        
        resultado = []
        for colaborador in colaboradores:
            resultado.append({
                "id": colaborador.id,
                "nome": colaborador.nome,
                "matricula": colaborador.matricula,
                "email": colaborador.email,
                "cargo": colaborador.cargo
            })
        
        return jsonify({
            "setor": {
                "id": setor.id,
                "nome": setor.nome,
                "email_responsavel": setor.email_responsavel
            },
            "colaboradores": resultado,
            "total": len(resultado)
        })
        
    except Exception as e:
        logger.exception(f"Erro ao listar colaboradores do setor {setor_id}")
        return jsonify({"error": "Erro ao listar colaboradores", "detail": str(e)}), 500