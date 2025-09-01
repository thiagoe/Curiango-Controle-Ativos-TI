# -*- coding: utf-8 -*-
from flask import request, session
from ..core.db import db
from ..models.dominio import LogAuditoria, Ativo, Smartphone, Computador, ChipSim, Marca, Operadora
from ..core.timezone_utils import to_local_isoformat
from datetime import datetime
import json
import logging

logger = logging.getLogger("app")

def obter_descricao_ativo(ativo_id: int) -> str:
    """
    Obtem uma descricao detalhada do ativo para logs
    """
    try:
        ativo = db.session.query(Ativo).filter_by(id=ativo_id).first()
        if not ativo:
            return f"Ativo ID {ativo_id}"
        
        descricao_base = f"Ativo {ativo.tipo} (ID: {ativo_id})"
        
        # Buscar detalhes específicos do tipo
        if ativo.tipo == "smartphone":
            smartphone = db.session.query(Smartphone).filter_by(ativo_id=ativo.id).first()
            if smartphone:
                marca = db.session.query(Marca).filter_by(id=smartphone.marca_id).first() if smartphone.marca_id else None
                marca_nome = marca.nome if marca else "Sem marca"
                modelo = smartphone.modelo or "Sem modelo"
                return f"Smartphone {marca_nome} {modelo} (ID: {ativo_id})"
        
        elif ativo.tipo in ["notebook", "desktop"]:
            computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
            if computador:
                marca = db.session.query(Marca).filter_by(id=computador.marca_id).first() if computador.marca_id else None
                marca_nome = marca.nome if marca else "Sem marca"
                modelo = computador.modelo or "Sem modelo"
                patrimonio = f" - Patrimônio: {computador.patrimonio}" if computador.patrimonio else ""
                return f"{ativo.tipo.title()} {marca_nome} {modelo}{patrimonio} (ID: {ativo_id})"
        
        elif ativo.tipo == "chip_sim":
            chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
            if chip:
                operadora = db.session.query(Operadora).filter_by(id=chip.operadora_id).first() if chip.operadora_id else None
                operadora_nome = operadora.nome if operadora else "Sem operadora"
                numero = chip.numero or "Sem número"
                return f"Chip SIM {operadora_nome} - {numero} (ID: {ativo_id})"
        
        return descricao_base
        
    except Exception as e:
        logger.error(f"Erro ao obter descricao do ativo {ativo_id}: {e}")
        return f"Ativo ID {ativo_id}"

def log_audit(acao: str, tabela: str = None, registro_id: int = None, descricao: str = "", 
              dados_antigos: dict = None, dados_novos: dict = None, nivel: str = "INFO"):
    """
    Registra uma operacao de auditoria no banco de dados
    
    Args:
        acao: Tipo de acao (CREATE, UPDATE, DELETE, TRANSFER, etc.)
        tabela: Nome da tabela afetada
        registro_id: ID do registro afetado
        descricao: Descricao da operacao
        dados_antigos: Dados antes da alteracao
        dados_novos: Dados apos a alteracao
        nivel: Nivel do log (INFO, WARNING, ERROR)
    """
    try:
        # Obter informacoes do usuario da sessao
        user = session.get("user", {})
        usuario = user.get("full_name") or user.get("username") or "Sistema"
        
        # Obter IP do request
        ip_address = None
        if request:
            ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        
        # Criar registro de auditoria
        log_entry = LogAuditoria(
            usuario=usuario,
            nivel=nivel,
            acao=acao,
            tabela=tabela,
            registro_id=registro_id,
            descricao=descricao,
            dados_antigos=dados_antigos,
            dados_novos=dados_novos,
            ip_address=ip_address
        )
        
        db.session.add(log_entry)
        db.session.commit()
        
        logger.info(f"Auditoria registrada: {acao} por {usuario} - {descricao}")
        
    except Exception as e:
        logger.error(f"Erro ao registrar auditoria: {e}")
        # Nao falha a operacao principal se a auditoria falhar
        try:
            db.session.rollback()
        except:
            pass

def buscar_logs_auditoria(filtros: dict):
    """
    Busca logs de auditoria com filtros
    
    Args:
        filtros: Dicionario com filtros (usuario, acao, tabela, data_inicio, data_fim, termo_busca)
    
    Returns:
        Lista de logs de auditoria
    """
    query = db.session.query(LogAuditoria)
    
    # Filtro por usuario
    if filtros.get("usuario"):
        query = query.filter(LogAuditoria.usuario.ilike(f"%{filtros['usuario']}%"))
    
    # Filtro por acao
    if filtros.get("acao"):
        query = query.filter(LogAuditoria.acao == filtros["acao"])
    
    # Filtro por tabela
    if filtros.get("tabela"):
        query = query.filter(LogAuditoria.tabela == filtros["tabela"])
    
    # Filtro por data inicio
    if filtros.get("data_inicio"):
        try:
            data_inicio = datetime.strptime(filtros["data_inicio"], "%Y-%m-%d")
            query = query.filter(LogAuditoria.created_at >= data_inicio)
        except ValueError:
            pass
    
    # Filtro por data fim
    if filtros.get("data_fim"):
        try:
            data_fim = datetime.strptime(filtros["data_fim"], "%Y-%m-%d")
            # Adiciona 23:59:59 para incluir todo o dia
            data_fim = data_fim.replace(hour=23, minute=59, second=59)
            query = query.filter(LogAuditoria.created_at <= data_fim)
        except ValueError:
            pass
    
    # Filtro por termo de busca (busca na descricao)
    if filtros.get("termo_busca"):
        termo = filtros["termo_busca"]
        query = query.filter(LogAuditoria.descricao.ilike(f"%{termo}%"))
    
    # Ordenar por data mais recente
    query = query.order_by(LogAuditoria.created_at.desc())
    
    # Paginacao
    limite = min(filtros.get("limite", 100), 500)  # Maximo 500 registros
    offset = filtros.get("offset", 0)
    
    return query.offset(offset).limit(limite).all()

def converter_log_para_dict(log: LogAuditoria):
    """
    Converte um LogAuditoria para dicionario para serializacao JSON
    """
    return {
        "id": log.id,
        "usuario": log.usuario,
        "nivel": log.nivel,
        "acao": log.acao,
        "tabela": log.tabela,
        "registro_id": log.registro_id,
        "descricao": log.descricao,
        "dados_antigos": log.dados_antigos,
        "dados_novos": log.dados_novos,
        "ip_address": log.ip_address,
        "created_at": to_local_isoformat(log.created_at) if log.created_at else None
    }