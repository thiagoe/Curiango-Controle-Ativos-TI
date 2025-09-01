from flask import Blueprint, jsonify
from sqlalchemy import text, func
from ..core.db import db
from ..core.auth import api_auth_required
from ..models.dominio import LogAuditoria, Colaborador, Ativo, Manutencao, HistoricoAlocacao, Marca, Operadora
from ..core.timezone_utils import to_local_isoformat
from datetime import datetime, timedelta
import logging

bp = Blueprint("dashboard", __name__)
logger = logging.getLogger("app")

@bp.get("/resumo")
def resumo():
    try:
        total = em_uso = em_estoque = em_manutencao = inativos = 0
        por_categoria = {}
        status = {"em_uso": 0, "em_estoque": 0, "inativos": 0, "em_manutencao": 0}

        with db.engine.connect() as conn:
            # usa a view se disponível
            cat_rows = conn.execute(text("SELECT tipo, total, em_uso, em_estoque, inativos, em_manutencao FROM vw_dashboard_contadores"))
            for r in cat_rows:
                por_categoria[r.tipo] = int(r.total)
                total += int(r.total)
                status["em_uso"] += int(r.em_uso)
                status["em_estoque"] += int(r.em_estoque)
                status["inativos"] += int(r.inativos)
                status["em_manutencao"] += int(r.em_manutencao)

        em_uso = status["em_uso"]
        em_estoque = status["em_estoque"]
        em_manutencao = status["em_manutencao"]
        inativos = status["inativos"]

        return jsonify({
            "total": total,
            "em_uso": em_uso,
            "em_estoque": em_estoque,
            "em_manutencao": em_manutencao,
            "inativos": inativos,
            "por_categoria": por_categoria,
            "status": status
        })
    except Exception as e:
        logger.error(f"Erro ao montar resumo do dashboard: {e}")
        return jsonify({"error": "Falha ao obter resumo"}), 500

@bp.get("/graficos")
def graficos_dashboard():
    """Dados para gráficos do dashboard"""
    try:
        # Gráfico de pizza - Distribuição por tipo
        distribuicao_tipos = db.session.query(
            Ativo.tipo,
            func.count(Ativo.id).label('total')
        ).group_by(Ativo.tipo).all()
        
        tipos_data = [{"tipo": row.tipo, "total": row.total} for row in distribuicao_tipos]
        
        return jsonify({
            "distribuicao_tipos": tipos_data
        })
        
    except Exception as e:
        logger.error(f"Erro ao carregar dados para gráficos: {e}")
        return jsonify({"error": "Falha ao carregar gráficos"}), 500

@bp.get("/categorias-detalhadas")
def categorias_detalhadas():
    """Dados detalhados por categoria para tabela"""
    try:
        resultados = {}
        
        # Para cada tipo de ativo, buscar estatísticas detalhadas
        tipos = ['smartphone', 'notebook', 'desktop', 'chip_sim']
        
        for tipo in tipos:
            # Total por tipo
            total = db.session.query(func.count(Ativo.id)).filter(Ativo.tipo == tipo).scalar() or 0
            
            # Em uso (com usuario_atual_id preenchido)
            em_uso = db.session.query(func.count(Ativo.id)).filter(
                Ativo.tipo == tipo,
                Ativo.usuario_atual_id.isnot(None)
            ).scalar() or 0
            
            # Disponíveis (sem usuario_atual_id e em condições normais)
            disponiveis = db.session.query(func.count(Ativo.id)).filter(
                Ativo.tipo == tipo,
                Ativo.usuario_atual_id.is_(None),
                Ativo.condicao.in_(['novo', 'usado'])
            ).scalar() or 0
            
            # Em manutenção
            em_manutencao = db.session.query(func.count(Ativo.id)).filter(
                Ativo.tipo == tipo,
                Ativo.condicao == 'em_manutencao'
            ).scalar() or 0
            
            # Danificados
            danificados = db.session.query(func.count(Ativo.id)).filter(
                Ativo.tipo == tipo,
                Ativo.condicao == 'danificado'
            ).scalar() or 0
            
            # Inativos
            inativos = db.session.query(func.count(Ativo.id)).filter(
                Ativo.tipo == tipo,
                Ativo.condicao == 'inativo'
            ).scalar() or 0
            
            resultados[tipo] = {
                "total": total,
                "em_uso": em_uso,
                "disponiveis": disponiveis,
                "em_manutencao": em_manutencao,
                "danificados": danificados,
                "inativos": inativos
            }
        
        return jsonify(resultados)
        
    except Exception as e:
        logger.error(f"Erro ao carregar categorias detalhadas: {e}")
        return jsonify({"error": "Falha ao carregar categorias"}), 500

@bp.get("/usuarios-resumo")
def usuarios_resumo():
    """Resumo de usuários ativos, inativos e total"""
    try:
        # Total de usuários
        total_usuarios = db.session.query(func.count(Colaborador.id)).scalar() or 0
        
        # Usuários ativos (status='ativo')
        usuarios_ativos = db.session.query(func.count(Colaborador.id)).filter(
            Colaborador.status == 'ativo'
        ).scalar() or 0
        
        # Usuários inativos (status='inativo')
        usuarios_inativos = db.session.query(func.count(Colaborador.id)).filter(
            Colaborador.status == 'inativo'
        ).scalar() or 0
        
        return jsonify({
            "total": total_usuarios,
            "ativos": usuarios_ativos,
            "inativos": usuarios_inativos
        })
        
    except Exception as e:
        logger.error(f"Erro ao carregar resumo de usuários: {e}")
        return jsonify({"error": "Falha ao carregar resumo de usuários"}), 500

@bp.get("/status-por-tipo/<tipo>")
def status_por_tipo(tipo):
    """Dados de status para um tipo específico de ativo"""
    try:
        if tipo not in ['smartphone', 'notebook', 'desktop', 'chip_sim']:
            return jsonify({"error": "Tipo inválido"}), 400
        
        # Em uso (com usuario_atual_id preenchido)
        em_uso = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.usuario_atual_id.isnot(None)
        ).scalar() or 0
        
        # Disponíveis (sem usuario_atual_id e em condições normais)
        disponiveis = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.usuario_atual_id.is_(None),
            Ativo.condicao.in_(['novo', 'usado'])
        ).scalar() or 0
        
        # Em manutenção
        em_manutencao = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.condicao == 'em_manutencao'
        ).scalar() or 0
        
        # Danificados
        danificados = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.condicao == 'danificado'
        ).scalar() or 0
        
        # Inativos
        inativos = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.condicao == 'inativo'
        ).scalar() or 0
        
        resultado = []
        
        if em_uso > 0:
            resultado.append({"status": "Em Uso", "quantidade": em_uso})
        if disponiveis > 0:
            resultado.append({"status": "Disponíveis", "quantidade": disponiveis})
        if em_manutencao > 0:
            resultado.append({"status": "Em Manutenção", "quantidade": em_manutencao})
        if danificados > 0:
            resultado.append({"status": "Danificados", "quantidade": danificados})
        if inativos > 0:
            resultado.append({"status": "Inativos", "quantidade": inativos})
        
        return jsonify(resultado)
        
    except Exception as e:
        logger.error(f"Erro ao carregar status do tipo {tipo}: {e}")
        return jsonify({"error": "Falha ao carregar dados"}), 500

@bp.get("/estatisticas")
def estatisticas_avancadas():
    """Estatísticas avançadas para cards do dashboard"""
    try:
        # Total de usuários únicos com ativos alocados
        usuarios_ativos = db.session.query(
            func.count(func.distinct(Ativo.usuario_atual_id))
        ).filter(Ativo.usuario_atual_id.isnot(None)).scalar() or 0
        
        # Ativos em manutenção (usando campo condicao do ativo)
        manutencoes_abertas = db.session.query(
            func.count(Ativo.id)
        ).filter(Ativo.condicao == 'em_manutencao').scalar() or 0
        
        # Valor total do patrimônio
        valor_total = db.session.query(
            func.coalesce(func.sum(Ativo.valor), 0)
        ).scalar() or 0.0
        
        # Últimas atividades (auditoria)
        ultimas_atividades = db.session.query(LogAuditoria).order_by(
            LogAuditoria.created_at.desc()
        ).limit(10).all()
        
        atividades_data = [{
            "id": log.id,
            "acao": log.acao,
            "tabela": log.tabela,
            "descricao": log.descricao,
            "data_hora": to_local_isoformat(log.created_at),
            "usuario": log.usuario or "Sistema"
        } for log in ultimas_atividades]
        
        # Alocações por mês (últimos 12 meses)
        doze_meses_atras = datetime.now() - timedelta(days=365)
        alocacoes_mensais = db.session.query(
            func.date_format(HistoricoAlocacao.data_inicio, '%Y-%m').label('mes'),
            func.count(HistoricoAlocacao.id).label('total')
        ).filter(
            HistoricoAlocacao.data_inicio >= doze_meses_atras
        ).group_by(
            func.date_format(HistoricoAlocacao.data_inicio, '%Y-%m')
        ).order_by('mes').all()
        
        alocacoes_data = [{"mes": row.mes, "total": row.total} for row in alocacoes_mensais]
        
        return jsonify({
            "usuarios_ativos": usuarios_ativos,
            "manutencoes_abertas": manutencoes_abertas,
            "valor_total_patrimonio": float(valor_total),
            "ultimas_atividades": atividades_data,
            "alocacoes_mensais": alocacoes_data
        })
        
    except Exception as e:
        logger.error(f"Erro ao carregar estatísticas avançadas: {e}")
        return jsonify({"error": "Falha ao carregar estatísticas"}), 500