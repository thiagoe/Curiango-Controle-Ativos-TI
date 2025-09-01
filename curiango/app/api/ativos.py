from flask import Blueprint, request, jsonify
from ..core.db import db
from ..core.auth import api_auth_required, admin_required
from ..models.dominio import Ativo, Manutencao, Computador, Smartphone, ChipSim, Marca, Operadora, Colaborador, UnidadeNegocio, HistoricoAlocacao, LogAuditoria, NotaAtivo
from ..services.transferencia_service import transferir_ativo, remover_alocacao
from ..services.auditoria_service import log_audit, obter_descricao_ativo
from ..core.auth import get_username, get_user_full_name
from ..schemas.ativos import TransferenciaSchema, ManutencaoCreateSchema
from datetime import datetime
import logging
from ..core.timezone_utils import to_local_isoformat

bp = Blueprint("ativos", __name__)
logger = logging.getLogger("app")

def parse_date_or_none(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None

@bp.get("")
def listar_ativos():
    tipo = request.args.get("tipo")
    q = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    
    # Query base simples
    query = db.session.query(Ativo)

    # Joins conforme o tipo
    if tipo == 'smartphone':
        query = query.outerjoin(Smartphone, Ativo.id == Smartphone.ativo_id)
        query = query.outerjoin(Marca, Smartphone.marca_id == Marca.id)
    elif tipo == 'notebook':
        query = query.outerjoin(Computador, Ativo.id == Computador.ativo_id)
        query = query.outerjoin(Marca, Computador.marca_id == Marca.id)
    elif tipo == 'chip_sim':
        query = query.outerjoin(ChipSim, Ativo.id == ChipSim.ativo_id)
        query = query.outerjoin(Operadora, ChipSim.operadora_id == Operadora.id)
    
    # Filtro por tipo
    if tipo:
        query = query.filter(Ativo.tipo == tipo)
    
    # Filtro por status/condição
    if status:
        query = query.filter(Ativo.condicao == status)
    
    # Busca textual
    if q:
        if tipo == 'smartphone':
            query = query.filter(db.or_(
                Smartphone.modelo.ilike(f'%{q}%'),
                Marca.nome.ilike(f'%{q}%'),
                Smartphone.imei_slot1.ilike(f'%{q}%')
            ))
        elif tipo == 'notebook':
            query = query.filter(db.or_(
                Computador.modelo.ilike(f'%{q}%'),
                Marca.nome.ilike(f'%{q}%'),
                Computador.patrimonio.ilike(f'%{q}%'),
                Computador.serie.ilike(f'%{q}%')
            ))
        elif tipo == 'chip_sim':
            query = query.filter(db.or_(
                ChipSim.numero.ilike(f'%{q}%'),
                Operadora.nome.ilike(f'%{q}%')
            ))
    
    # Limita resultados por performance
    ativos = query.limit(500).all()
    
    resultado = []
    
    for ativo in ativos:
        # Buscar colaborador separadamente se necessário
        usuario_atual_nome = None
        if ativo.usuario_atual_id:
            colaborador = db.session.query(Colaborador).filter_by(id=ativo.usuario_atual_id).first()
            usuario_atual_nome = colaborador.nome if colaborador else f"ID #{ativo.usuario_atual_id}"
        
        # Buscar unidade de negócio
        unidade_negocio_nome = None
        if ativo.unidade_negocio_id:
            unidade = db.session.query(UnidadeNegocio).filter_by(id=ativo.unidade_negocio_id).first()
            unidade_negocio_nome = unidade.nome if unidade else f"ID #{ativo.unidade_negocio_id}"
        
        # Dados base
        item = {
            "id": ativo.id,
            "tipo": ativo.tipo,
            "condicao": ativo.condicao,
            "usuario_atual_id": ativo.usuario_atual_id,
            "usuario_atual_nome": usuario_atual_nome,
            "unidade_negocio_id": ativo.unidade_negocio_id,
            "unidade_negocio_nome": unidade_negocio_nome,
            "valor": float(ativo.valor) if ativo.valor else 0.0
        }
        
        # Dados específicos por tipo
        if ativo.tipo == "smartphone":
            smartphone = db.session.query(Smartphone).filter_by(ativo_id=ativo.id).first()
            if smartphone:
                marca = db.session.query(Marca).filter_by(id=smartphone.marca_id).first()
                item.update({
                    "modelo": smartphone.modelo,
                    "marca_nome": marca.nome if marca else None,
                    "imei_slot": smartphone.imei_slot,
                    "acessorios": smartphone.acessorios
                })
        elif ativo.tipo == "notebook":
            computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
            if computador:
                marca = db.session.query(Marca).filter_by(id=computador.marca_id).first()
                item.update({
                    "modelo": computador.modelo,
                    "marca_nome": marca.nome if marca else None,
                    "patrimonio": computador.patrimonio,
                    "processador": computador.processador,
                    "memoria": computador.memoria,
                    "acessorios": computador.acessorios,
                    "so": computador.so_versao
                })
        elif ativo.tipo == "chip_sim":
            chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
            if chip:
                operadora = db.session.query(Operadora).filter_by(id=chip.operadora_id).first()
                item.update({
                    "numero": chip.numero,
                    "operadora_nome": operadora.nome if operadora else None,
                    "tipo": chip.tipo
                })

        elif ativo.tipo in ["notebook", "desktop"]:
            computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
            if computador:
                marca = db.session.query(Marca).filter_by(id=computador.marca_id).first()
                item.update({
                    "modelo": computador.modelo,
                    "fabricante": marca.nome if marca else None,
                    "marca_nome": marca.nome if marca else None,
                    "processador": computador.processador,
                    "cpu": computador.processador,  # alias
                    "memoria": computador.memoria,
                    "hd": computador.hd,
                    "disco": computador.hd,  # alias
                    "serie": computador.serie,
                    "so_versao": computador.so_versao,
                    "patrimonio": computador.patrimonio,
                    # "monitor": computador.monitor,  # Campo não existe no banco
                    "acessorios": computador.acessorios,
                    "tipo_computador": computador.tipo_computador
                })
                
                # Filtro de busca para computadores
                if q:
                    busca_lower = q.lower()
                    if not any([
                        busca_lower in (computador.modelo or "").lower(),
                        busca_lower in (marca.nome if marca else "").lower(),
                        busca_lower in (computador.processador or "").lower(),
                        busca_lower in (computador.serie or "").lower(),
                        busca_lower in (computador.patrimonio or "").lower()
                    ]):
                        continue
        
        elif ativo.tipo == "chip_sim":
            chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
            if chip:
                operadora = db.session.query(Operadora).filter_by(id=chip.operadora_id).first()
                item.update({
                    "numero": chip.numero,
                    "operadora_id": chip.operadora_id,
                    "operadora": operadora.nome if operadora else None,
                    "operadora_nome": operadora.nome if operadora else None,
                    # "condicao_chip": chip.condicao  # Campo não existe - usa condição do ativo pai
                })
                
                # Filtro de busca para chips
                if q:
                    busca_lower = q.lower()
                    if not any([
                        busca_lower in (chip.numero or "").lower(),
                        busca_lower in (operadora.nome if operadora else "").lower()
                    ]):
                        continue
        
        resultado.append(item)
    
    return jsonify(resultado)

@bp.post("")
def criar_ativo():
    data = request.get_json() or {}

    # Valida tipo
    tipo = data.get("tipo")
    if tipo not in ("smartphone", "notebook", "desktop", "chip_sim"):
        return jsonify(error="tipo inválido"), 400

    # Valida/define condicao alinhada ao schema
    condicao = (data.get("condicao") or "novo").lower()
    if condicao not in ("novo", "usado", "danificado", "em_manutencao", "inativo"):
        return jsonify(error="condicao inválida"), 400

    # Monta Ativo com campos comuns
    a = Ativo(
        tipo=tipo,
        condicao=condicao,
        usuario_atual_id=data.get("usuario_atual_id"),
        unidade_negocio_id=data.get("unidade_negocio_id"),
        valor=data.get("valor")
    )

    try:
        db.session.add(a)
        db.session.flush()  # garante a.id para usar nas tabelas específicas

        # fabricante_id (do front) -> marca_id (no banco)
        marca_id = data.get("fabricante_id") or data.get("marca_id")

        if tipo in ("notebook", "desktop"):
            patrimonio = data.get("patrimonio")
            if patrimonio:
                # Verificar se já existe um computador com o mesmo patrimônio
                comp_existente = Computador.query.filter_by(patrimonio=patrimonio).first()
                if comp_existente:
                    db.session.rollback()
                    return jsonify(
                        error="Patrimônio duplicado", 
                        detail=f"Já existe um computador com o patrimônio {patrimonio}"
                    ), 400
            
            comp = Computador(
                ativo_id=a.id,
                tipo_computador=tipo,            # 'notebook' ou 'desktop'
                marca_id=marca_id,
                modelo=data.get("modelo"),
                processador=data.get("cpu") or data.get("processador"),
                memoria=data.get("memoria"),
                hd=data.get("disco") or data.get("hd"),
                acessorios=data.get("acessorios"),
                # opcionais
                serie=data.get("serie"),
                so_versao=data.get("so_versao"),
                patrimonio=patrimonio
            )
            db.session.add(comp)

        elif tipo == "smartphone":
            imei = data.get("imei") or data.get("imei_slot")
            if imei:
                # Verificar se já existe um smartphone com o mesmo IMEI
                smartphone_existente = Smartphone.query.filter_by(imei_slot=imei).first()
                if smartphone_existente:
                    db.session.rollback()
                    return jsonify(
                        error="IMEI duplicado", 
                        detail=f"Já existe um smartphone com o IMEI {imei}"
                    ), 400
            
            sm = Smartphone(
                ativo_id=a.id,
                marca_id=marca_id,
                modelo=data.get("modelo"),
                imei_slot=imei,
                acessorios=data.get("acessorios")
            )
            db.session.add(sm)

        elif tipo == "chip_sim":
            numero = data.get("numero")
            if numero:
                # Verificar se já existe um chip com o mesmo número
                chip_existente = ChipSim.query.filter_by(numero=numero).first()
                if chip_existente:
                    db.session.rollback()
                    return jsonify(
                        error="Número duplicado", 
                        detail=f"Já existe um chip SIM com o número {numero}"
                    ), 400
            
            chip = ChipSim(
                ativo_id=a.id,
                numero=numero,
                operadora_id=data.get("operadora_id"),
                tipo=data.get("tipo", "voz")
            )
            db.session.add(chip)

        db.session.commit()
        
        # Log de auditoria com descrição detalhada
        ativo_descricao = obter_descricao_ativo(a.id)
        log_audit(
            acao="CREATE",
            tabela="ativos",
            registro_id=a.id,
            descricao=f"Novo ativo criado: {ativo_descricao}",
            dados_novos={"tipo": a.tipo, "condicao": a.condicao}
        )
        
        logger.info(f"Ativo criado id={a.id} tipo={a.tipo}")
        return jsonify({"id": a.id, "tipo": a.tipo, "condicao": a.condicao}), 201

    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao criar ativo")
        return jsonify(error="Erro ao criar ativo", detail=str(e)), 500

@bp.get("/<int:ativo_id>")
def obter_ativo(ativo_id):
    a = Ativo.query.get_or_404(ativo_id)
    
    # Buscar colaborador separadamente se necessário
    usuario_atual_nome = None
    if a.usuario_atual_id:
        colaborador = db.session.query(Colaborador).filter_by(id=a.usuario_atual_id).first()
        usuario_atual_nome = colaborador.nome if colaborador else f"ID #{a.usuario_atual_id}"
    
    # Buscar unidade de negócio
    unidade_negocio_nome = None
    if a.unidade_negocio_id:
        unidade = db.session.query(UnidadeNegocio).filter_by(id=a.unidade_negocio_id).first()
        unidade_negocio_nome = unidade.nome if unidade else f"ID #{a.unidade_negocio_id}"
    
    # Dados base
    resultado = {
        "id": a.id,
        "tipo": a.tipo,
        "condicao": a.condicao,
        "usuario_atual_id": a.usuario_atual_id,
        "usuario_atual_nome": usuario_atual_nome,
        "unidade_negocio_id": a.unidade_negocio_id,
        "unidade_negocio_nome": unidade_negocio_nome,
        "valor": float(a.valor) if a.valor else 0.0
    }
    
    # Adiciona dados específicos
    if a.tipo == "smartphone":
        smartphone = db.session.query(Smartphone).filter_by(ativo_id=a.id).first()
        if smartphone:
            marca = db.session.query(Marca).filter_by(id=smartphone.marca_id).first()
            resultado.update({
                "modelo": getattr(smartphone, 'modelo', None),
                "fabricante": marca.nome if marca else None,
                "imei_slot": getattr(smartphone, 'imei_slot', None),
                "serie": getattr(smartphone, 'serie', None),  # Campo não existe no banco
                "acessorios": getattr(smartphone, 'acessorios', None)
            })
    
    elif a.tipo in ["notebook", "desktop"]:
        computador = db.session.query(Computador).filter_by(ativo_id=a.id).first()
        if computador:
            marca = db.session.query(Marca).filter_by(id=computador.marca_id).first()
            resultado.update({
                "modelo": getattr(computador, 'modelo', None),
                "fabricante": marca.nome if marca else None,
                "processador": getattr(computador, 'processador', None),
                "memoria": getattr(computador, 'memoria', None),
                "hd": getattr(computador, 'hd', None),
                "serie": getattr(computador, 'serie', None),
                "so_versao": getattr(computador, 'so_versao', None),
                "patrimonio": getattr(computador, 'patrimonio', None),
                "monitor": getattr(computador, 'monitor', None),  # Campo pode não existir
                "acessorios": getattr(computador, 'acessorios', None),
                "tipo_computador": getattr(computador, 'tipo_computador', None)
            })
    
    elif a.tipo == "chip_sim":
        chip = db.session.query(ChipSim).filter_by(ativo_id=a.id).first()
        if chip:
            operadora = db.session.query(Operadora).filter_by(id=chip.operadora_id).first()
            resultado.update({
                "numero": getattr(chip, 'numero', None),
                "operadora_id": getattr(chip, 'operadora_id', None),
                "operadora": operadora.nome if operadora else None,
                "condicao_chip": getattr(chip, 'condicao', None),  # Campo pode não existir
                "tipo_chip": getattr(chip, 'tipo', None)
            })
    
    return jsonify(resultado)

# Função removida - duplicata

@bp.delete("/<int:ativo_id>")
@admin_required
def excluir_ativo(ativo_id):
    try:
        a = Ativo.query.get_or_404(ativo_id)
        
        # VALIDAÇÃO: Verificar se o ativo não está alocado
        if a.usuario_atual_id is not None:
            from ..models.dominio import Colaborador
            colaborador = Colaborador.query.get(a.usuario_atual_id)
            colaborador_nome = colaborador.nome if colaborador else "Usuário não encontrado"
            
            return jsonify({
                "error": "Ativo não pode ser excluído", 
                "detail": f"Ativo está alocado para {colaborador_nome}. Devolva o ativo antes de excluir."
            }), 400
        
        # VALIDAÇÃO: Verificar se há histórico de alocações ativas
        from ..models.dominio import HistoricoAlocacao
        alocacoes_ativas = HistoricoAlocacao.query.filter_by(ativo_id=ativo_id, data_fim=None).count()
        if alocacoes_ativas > 0:
            return jsonify({
                "error": "Ativo não pode ser excluído", 
                "detail": "Ativo possui alocações ativas. Finalize todas as alocações antes de excluir."
            }), 400
        
        # Log de auditoria antes da exclusão
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="DELETE",
            tabela="ativos",
            registro_id=ativo_id,
            descricao=f"Ativo excluído: {ativo_descricao}",
            dados_antigos={"tipo": a.tipo, "condicao": a.condicao, "usuario_atual_id": a.usuario_atual_id}
        )
        
        # Excluir o ativo (cascade irá remover relacionamentos históricos)
        db.session.delete(a)
        db.session.commit()
        
        logger.info(f"Ativo excluído id={ativo_id} (sem alocação ativa)")
        return jsonify({"ok": True, "message": "Ativo excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao excluir ativo {ativo_id}")
        return jsonify({"error": "Erro ao excluir ativo", "detail": str(e)}), 500

@bp.post("/transferir")
def transferir():
    payload = TransferenciaSchema().load(request.get_json() or {})
    hist = transferir_ativo(payload["ativo_id"], payload["colaborador_id"], payload.get("motivo"), "api_user")
    return jsonify({"historico_id": hist.id, "termo_gerado": hist.termo_gerado}), 201

@bp.post("/<int:ativo_id>/alocacao")
def alocar_ativo(ativo_id):
    """Aloca um ativo a um colaborador"""
    try:
        data = request.get_json() or {}
        colaborador_id = data.get('colaborador_id')
        
        if not colaborador_id:
            return jsonify({"error": "colaborador_id é obrigatório"}), 400
            
        motivo = data.get('motivo', 'Alocação via sistema')
        hist = transferir_ativo(ativo_id, colaborador_id, motivo, "api_user")
        
        logger.info(f"Ativo {ativo_id} alocado ao colaborador {colaborador_id}")
        return jsonify({
            "ok": True,
            "historico_id": hist.id, 
            "termo_gerado": hist.termo_gerado
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao alocar ativo {ativo_id}")
        return jsonify({"error": "Erro ao alocar ativo", "detail": str(e)}), 500

@bp.post("/<int:ativo_id>/devolucao")
def devolver_ativo(ativo_id):
    """Devolve um ativo (remove alocação)"""
    try:
        remover_alocacao(ativo_id, "api_user")
        logger.info(f"Ativo {ativo_id} devolvido")
        return jsonify({"ok": True}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao devolver ativo {ativo_id}")
        return jsonify({"error": "Erro ao devolver ativo", "detail": str(e)}), 500

@bp.post("/<int:ativo_id>/remover-alocacao")
def remover(ativo_id):
    """Endpoint legado - usar /devolucao"""
    remover_alocacao(ativo_id, "api_user")
    return jsonify({"ok": True})

@bp.put("/<int:ativo_id>")
def atualizar_ativo(ativo_id):
    try:
        ativo = Ativo.query.get_or_404(ativo_id)
        data = request.get_json() or {}
        
        # Chips SIM não devem ter unidade de negócio - sempre limpar
        if ativo.tipo == 'chip_sim':
            ativo.unidade_negocio_id = None
        
        # Campos que podem ser atualizados
        if 'condicao' in data:
            ativo.condicao = data['condicao']
        if 'unidade_negocio_id' in data and ativo.tipo != 'chip_sim':
            # Só permite atualizar unidade se não for chip SIM
            ativo.unidade_negocio_id = data['unidade_negocio_id'] if data['unidade_negocio_id'] else None
        if 'valor' in data:
            ativo.valor = float(data['valor']) if data['valor'] else None
            
        # Atualizar campos específicos por tipo
        if ativo.tipo == "smartphone":
            smartphone = db.session.query(Smartphone).filter_by(ativo_id=ativo.id).first()
            if smartphone:
                if 'modelo' in data:
                    smartphone.modelo = data['modelo']
                if 'imei' in data:
                    novo_imei = data['imei']
                    # Verificar se o novo IMEI já existe em outro smartphone
                    if novo_imei and novo_imei != smartphone.imei_slot:
                        smartphone_existente = Smartphone.query.filter_by(imei_slot=novo_imei).first()
                        if smartphone_existente:
                            db.session.rollback()
                            return jsonify(
                                error="IMEI duplicado", 
                                detail=f"Já existe um smartphone com o IMEI {novo_imei}"
                            ), 400
                    smartphone.imei_slot = novo_imei
                if 'acessorios' in data:
                    smartphone.acessorios = data['acessorios']
                    
        elif ativo.tipo in ["notebook", "desktop"]:
            computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
            if computador:
                if 'modelo' in data:
                    computador.modelo = data['modelo']
                if 'patrimonio' in data:
                    novo_patrimonio = data['patrimonio']
                    # Verificar se o novo patrimônio já existe em outro computador
                    if novo_patrimonio and novo_patrimonio != computador.patrimonio:
                        comp_existente = Computador.query.filter_by(patrimonio=novo_patrimonio).first()
                        if comp_existente:
                            db.session.rollback()
                            return jsonify(
                                error="Patrimônio duplicado", 
                                detail=f"Já existe um computador com o patrimônio {novo_patrimonio}"
                            ), 400
                    computador.patrimonio = novo_patrimonio
                if 'processador' in data:
                    computador.processador = data['processador']
                if 'memoria' in data:
                    computador.memoria = data['memoria']
                if 'acessorios' in data:
                    computador.acessorios = data['acessorios']
                    
        elif ativo.tipo == "chip_sim":
            chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
            if chip:
                if 'numero' in data:
                    novo_numero = data['numero']
                    # Verificar se o novo número já existe em outro chip
                    if novo_numero and novo_numero != chip.numero:
                        chip_existente = ChipSim.query.filter_by(numero=novo_numero).first()
                        if chip_existente:
                            db.session.rollback()
                            return jsonify(
                                error="Número duplicado", 
                                detail=f"Já existe um chip SIM com o número {novo_numero}"
                            ), 400
                    chip.numero = novo_numero
                if 'tipo_chip' in data:
                    chip.tipo = data['tipo_chip']
        
        db.session.commit()
        logger.info(f"Ativo atualizado id={ativo.id} tipo={ativo.tipo}")
        return jsonify({"id": ativo.id, "tipo": ativo.tipo, "condicao": ativo.condicao}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception("Erro ao atualizar ativo")
        return jsonify(error="Erro ao atualizar ativo", detail=str(e)), 500

@bp.post("/<int:ativo_id>/manutencoes")
def adicionar_manutencao(ativo_id):
    try:
        request_data = request.get_json() or {}
        
        # Validações básicas
        if not request_data.get('tipo'):
            return jsonify({"error": "Campo 'tipo' é obrigatório"}), 400
        if not request_data.get('descricao'):
            return jsonify({"error": "Campo 'descricao' é obrigatório"}), 400
        
        m = Manutencao(
            ativo_id=ativo_id,
            tipo=request_data['tipo'],
            descricao=request_data['descricao'],
            observacoes=request_data.get('observacoes')
        )
        
        db.session.add(m)
        db.session.commit()
        
        # Log de auditoria
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="CREATE",
            tabela="manutencoes",
            registro_id=m.id,
            descricao=f"Manutenção {request_data['tipo']} registrada para {ativo_descricao}",
            dados_novos={
                "ativo_id": ativo_id,
                "tipo": request_data['tipo'],
                "descricao": request_data['descricao'],
                "observacoes": request_data.get('observacoes')
            }
        )
        
        logger.info(f"Manutenção adicionada ativo_id={ativo_id} manutencao_id={m.id}")
        return jsonify({"id": m.id}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao adicionar manutenção para ativo {ativo_id}")
        return jsonify({"error": "Erro ao adicionar manutenção", "detail": str(e)}), 500

@bp.get("/<int:ativo_id>/termo-pdf")
def gerar_termo_pdf_endpoint(ativo_id):
    """Gera o PDF do termo de responsabilidade para download"""
    try:
        # Verificar se o ativo existe e está alocado
        ativo = Ativo.query.get_or_404(ativo_id)
        
        if not ativo.usuario_atual_id:
            return jsonify({"error": "Ativo não está alocado a nenhum usuário"}), 400
            
        # Gerar o PDF
        from ..services.termo_service import gerar_termo_pdf
        from flask import make_response
        
        pdf_bytes = gerar_termo_pdf(ativo_id, ativo.usuario_atual_id)
        
        # Criar resposta com o PDF
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="termo_responsabilidade_ativo_{ativo_id}.pdf"'
        
        # Log da ação
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="READ",
            tabela="ativos",
            registro_id=ativo_id,
            descricao=f"Termo de responsabilidade gerado para {ativo_descricao}"
        )
        
        return response
        
    except Exception as e:
        logger.exception(f"Erro ao gerar termo PDF para ativo {ativo_id}")
        return jsonify({"error": "Erro ao gerar termo", "detail": str(e)}), 500

@bp.get("/<int:ativo_id>/historico")
def obter_historico(ativo_id):
    """Obtém histórico completo do ativo incluindo alocações, devoluções e manutenções"""
    try:
        # Verificar se o ativo existe
        ativo = Ativo.query.get_or_404(ativo_id)
        
        historico_completo = []
        
        # 1. Buscar histórico de alocações/devoluções
        historicos_alocacao = db.session.query(HistoricoAlocacao).filter_by(ativo_id=ativo_id).order_by(HistoricoAlocacao.data_inicio.desc()).all()
        
        for hist in historicos_alocacao:
            # Buscar colaborador separadamente para evitar problemas de relacionamento
            colaborador = db.session.query(Colaborador).filter_by(id=hist.colaborador_id).first()
            colaborador_nome = colaborador.nome if colaborador else "Usuário não encontrado"
            
            # Evento de alocação - usar timestamp da auditoria (correto)
            if hist.data_inicio:
                # Buscar timestamp de alocação na auditoria
                log_alocacao = db.session.query(LogAuditoria).filter(
                    LogAuditoria.tabela == 'ativos',
                    LogAuditoria.registro_id == ativo_id,
                    LogAuditoria.acao == 'TRANSFER',
                    LogAuditoria.descricao.like(f'%alocado para {colaborador_nome}%')
                ).order_by(LogAuditoria.created_at.desc()).first()
                
                data_alocacao = to_local_isoformat(log_alocacao.created_at) if log_alocacao else to_local_isoformat(hist.created_at)
                
                historico_completo.append({
                    "data": data_alocacao,
                    "tipo": "alocacao",
                    "descricao": f"Ativo alocado para {colaborador_nome}",
                    "usuario_nome": colaborador_nome,
                    "observacao": hist.motivo_transferencia or ""
                })
            
            # Evento de devolução - usar timestamp da auditoria (correto)
            if hist.data_fim:
                # Buscar timestamp de devolução na auditoria
                log_devolucao = db.session.query(LogAuditoria).filter(
                    LogAuditoria.tabela == 'ativos',
                    LogAuditoria.registro_id == ativo_id,
                    LogAuditoria.acao == 'REMOVE_ALLOCATION',
                    LogAuditoria.descricao.like(f'%devolvido por {colaborador_nome}%')
                ).order_by(LogAuditoria.created_at.desc()).first()
                
                data_devolucao = to_local_isoformat(log_devolucao.created_at) if log_devolucao else to_local_isoformat(hist.created_at)
                
                historico_completo.append({
                    "data": data_devolucao,
                    "tipo": "devolucao", 
                    "descricao": f"Ativo devolvido por {colaborador_nome}",
                    "usuario_nome": colaborador_nome,
                    "observacao": hist.motivo_transferencia or ""
                })
        
        # 2. Buscar histórico de manutenções
        manutencoes = db.session.query(Manutencao).filter_by(ativo_id=ativo_id).order_by(Manutencao.created_at.desc()).all()
        
        for manut in manutencoes:
            # Buscar usuário que criou a manutenção na auditoria
            log_auditoria = db.session.query(LogAuditoria).filter(
                LogAuditoria.tabela == 'manutencoes',
                LogAuditoria.registro_id == manut.id,
                LogAuditoria.acao == 'CREATE'
            ).first()
            
            usuario_criacao = log_auditoria.usuario if log_auditoria else "Sistema"
            
            # Evento da manutenção
            historico_completo.append({
                "data": to_local_isoformat(manut.created_at),
                "tipo": "manutencao",
                "descricao": f"Manutenção {manut.tipo}: {manut.descricao}",
                "usuario_nome": usuario_criacao,
                "observacao": manut.observacoes
            })
            
        
        # 3. Ordenar todo o histórico por data (mais recente primeiro)
        historico_completo.sort(key=lambda x: x["data"], reverse=True)
        
        return jsonify(historico_completo)
        
    except Exception as e:
        logger.exception(f"Erro ao buscar histórico do ativo {ativo_id}")
        return jsonify({"error": "Erro ao buscar histórico", "detail": str(e)}), 500

@bp.get("/export")
def exportar_ativos():
    """Exporta todos os ativos para CSV com dados completos de cadastro"""
    try:
        # Buscar todos os ativos com informações relacionadas
        ativos = db.session.query(Ativo).all()
        
        ativos_data = []
        for ativo in ativos:
            # Buscar colaborador atual
            colaborador_atual = ""
            if ativo.usuario_atual_id:
                colaborador = db.session.query(Colaborador).filter_by(id=ativo.usuario_atual_id).first()
                if colaborador:
                    colaborador_atual = colaborador.nome
            
            # Buscar unidade
            unidade_nome = ""
            if ativo.unidade_negocio_id:
                unidade_obj = db.session.query(UnidadeNegocio).filter_by(id=ativo.unidade_negocio_id).first()
                if unidade_obj:
                    unidade_nome = unidade_obj.nome
            
            # Dados base do ativo
            ativo_dict = {
                "id": ativo.id,
                "tipo": ativo.tipo,
                "condicao": ativo.condicao or "",
                "valor": f"{float(ativo.valor or 0):.2f}".replace('.', ','),
                "usuario_atual": colaborador_atual,
                "unidade_negocio_id": ativo.unidade_negocio_id or "",
                "unidade_negocio_nome": unidade_nome,
                "created_at": ativo.created_at.strftime('%d/%m/%Y %H:%M:%S') if ativo.created_at else "",
                # Campos específicos que serão preenchidos conforme o tipo
                "marca_id": "",
                "marca_nome": "",
                "modelo": "",
                "patrimonio": "",
                "serie": "",
                "so_versao": "",
                "processador": "",
                "memoria": "",
                "hd": "",
                "acessorios": "",
                "imei_slot": "",
                "operadora_id": "",
                "operadora_nome": "",
                "numero": "",
                "tipo_chip": ""
            }
            
            # Preencher dados específicos por tipo
            if ativo.tipo == "smartphone":
                smartphone = db.session.query(Smartphone).filter_by(ativo_id=ativo.id).first()
                if smartphone:
                    ativo_dict.update({
                        "marca_id": smartphone.marca_id or "",
                        "modelo": smartphone.modelo or "",
                        "imei_slot": smartphone.imei_slot or "",
                        "acessorios": smartphone.acessorios or ""
                    })
                    
                    # Buscar nome da marca
                    if smartphone.marca_id:
                        marca_obj = db.session.query(Marca).filter_by(id=smartphone.marca_id).first()
                        if marca_obj:
                            ativo_dict["marca_nome"] = marca_obj.nome
                            
            elif ativo.tipo in ["notebook", "desktop"]:
                computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
                if computador:
                    ativo_dict.update({
                        "marca_id": computador.marca_id or "",
                        "modelo": computador.modelo or "",
                        "patrimonio": computador.patrimonio or "",
                        "serie": computador.serie or "",
                        "so_versao": computador.so_versao or "",
                        "processador": computador.processador or "",
                        "memoria": computador.memoria or "",
                        "hd": computador.hd or "",
                        "acessorios": computador.acessorios or ""
                    })
                    
                    # Buscar nome da marca
                    if computador.marca_id:
                        marca_obj = db.session.query(Marca).filter_by(id=computador.marca_id).first()
                        if marca_obj:
                            ativo_dict["marca_nome"] = marca_obj.nome
                            
            elif ativo.tipo == "chip_sim":
                chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
                if chip:
                    ativo_dict.update({
                        "operadora_id": chip.operadora_id or "",
                        "numero": chip.numero or "",
                        "tipo_chip": chip.tipo or ""
                    })
                    
                    # Buscar nome da operadora
                    if chip.operadora_id:
                        op_obj = db.session.query(Operadora).filter_by(id=chip.operadora_id).first()
                        if op_obj:
                            ativo_dict["operadora_nome"] = op_obj.nome
            
            ativos_data.append(ativo_dict)
        
        return jsonify({
            "ativos": ativos_data,
            "total": len(ativos_data)
        })
        
    except Exception as e:
        logger.exception("Erro ao exportar ativos")
        return jsonify({"error": "Erro ao exportar ativos", "detail": str(e)}), 500

@bp.get("/<int:ativo_id>/notas")
def listar_notas_ativo(ativo_id):
    """Lista todas as notas de um ativo"""
    try:
        # Verificar se o ativo existe
        ativo = Ativo.query.get_or_404(ativo_id)
        
        # Buscar notas ordenadas por data (mais recentes primeiro)
        notas = db.session.query(NotaAtivo).filter_by(ativo_id=ativo_id).order_by(NotaAtivo.created_at.desc()).all()
        
        resultado = []
        for nota in notas:
            resultado.append({
                "id": nota.id,
                "conteudo": nota.conteudo,
                "usuario": nota.usuario,
                "created_at": to_local_isoformat(nota.created_at) if nota.created_at else None,
                "updated_at": to_local_isoformat(nota.updated_at) if nota.updated_at else None
            })
        
        return jsonify({
            "notas": resultado,
            "total": len(resultado)
        })
        
    except Exception as e:
        logger.exception(f"Erro ao listar notas do ativo {ativo_id}")
        return jsonify({"error": "Erro ao listar notas", "detail": str(e)}), 500

@bp.post("/<int:ativo_id>/notas")
def adicionar_nota_ativo(ativo_id):
    """Adiciona uma nova nota ao ativo"""
    try:
        # Verificar se o ativo existe
        ativo = Ativo.query.get_or_404(ativo_id)
        
        data = request.get_json() or {}
        conteudo = data.get("conteudo", "").strip()
        
        if not conteudo:
            return jsonify({"error": "Conteúdo da nota é obrigatório"}), 400
            
        # Obter nome completo do usuário atual
        usuario = get_user_full_name()
        
        # Criar nova nota
        nota = NotaAtivo(
            ativo_id=ativo_id,
            conteudo=conteudo,
            usuario=usuario
        )
        
        db.session.add(nota)
        db.session.commit()
        
        # Log de auditoria
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="CREATE",
            tabela="notas_ativos",
            registro_id=nota.id,
            descricao=f"Nova nota adicionada ao ativo {ativo_descricao}",
            dados_novos={
                "ativo_id": ativo_id,
                "conteudo": conteudo[:100] + "..." if len(conteudo) > 100 else conteudo,
                "usuario": usuario
            }
        )
        
        logger.info(f"Nova nota adicionada ao ativo {ativo_id} pelo usuário {usuario}")
        
        return jsonify({
            "id": nota.id,
            "conteudo": nota.conteudo,
            "usuario": nota.usuario,
            "created_at": to_local_isoformat(nota.created_at) if nota.created_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao adicionar nota ao ativo {ativo_id}")
        return jsonify({"error": "Erro ao adicionar nota", "detail": str(e)}), 500

@bp.delete("/<int:ativo_id>/notas/<int:nota_id>")
def excluir_nota_ativo(ativo_id, nota_id):
    """Exclui uma nota do ativo (apenas o autor pode excluir)"""
    try:
        # Verificar se o ativo existe
        ativo = Ativo.query.get_or_404(ativo_id)
        
        # Buscar a nota
        nota = db.session.query(NotaAtivo).filter_by(id=nota_id, ativo_id=ativo_id).first()
        if not nota:
            return jsonify({"error": "Nota não encontrada"}), 404
            
        # Verificar se o usuário atual é o autor da nota  
        # Como a nota foi salva com nome completo, comparamos com nome completo
        usuario_atual = get_user_full_name()
        if nota.usuario != usuario_atual:
            return jsonify({"error": "Apenas o autor pode excluir a nota"}), 403
            
        # Log de auditoria antes da exclusão
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="DELETE",
            tabela="notas_ativos",
            registro_id=nota_id,
            descricao=f"Nota excluída do ativo {ativo_descricao}",
            dados_antigos={
                "ativo_id": ativo_id,
                "conteudo": nota.conteudo[:100] + "..." if len(nota.conteudo) > 100 else nota.conteudo,
                "usuario": nota.usuario
            }
        )
        
        db.session.delete(nota)
        db.session.commit()
        
        logger.info(f"Nota {nota_id} excluída do ativo {ativo_id} pelo usuário {usuario_atual}")
        
        return jsonify({"message": "Nota excluída com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.exception(f"Erro ao excluir nota {nota_id} do ativo {ativo_id}")
        return jsonify({"error": "Erro ao excluir nota", "detail": str(e)}), 500

@bp.post("/import")
def importar_ativos():
    """Endpoint para importar ativos via CSV"""
    if 'file' not in request.files:
        return jsonify({"error": "Arquivo não fornecido"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400
    
    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Arquivo deve ser CSV"}), 400
    
    try:
        import csv
        import io
        from decimal import Decimal
        
        # Ler conteúdo do arquivo
        content = file.read().decode('utf-8-sig')  # utf-8-sig remove BOM se existir
        csv_reader = csv.DictReader(io.StringIO(content))
        
        sucessos = 0
        erros = []
        
        for linha_num, linha in enumerate(csv_reader, start=2):  # Começar do 2 por causa do cabeçalho
            try:
                # Campos obrigatórios
                tipo = linha.get('tipo', '').strip().lower()
                condicao = linha.get('condicao', '').strip().lower()
                valor_str = linha.get('valor', '').strip()
                unidade_negocio_id = linha.get('unidade_negocio_id', '').strip()
                
                # Validações básicas
                if not tipo:
                    erros.append(f"Linha {linha_num}: Tipo é obrigatório")
                    continue
                
                if tipo not in ['smartphone', 'notebook', 'desktop', 'chip_sim']:
                    erros.append(f"Linha {linha_num}: Tipo '{tipo}' inválido")
                    continue
                
                if not condicao:
                    erros.append(f"Linha {linha_num}: Condição é obrigatória")
                    continue
                
                if condicao not in ['novo', 'usado', 'danificado', 'em_manutencao', 'inativo']:
                    erros.append(f"Linha {linha_num}: Condição '{condicao}' inválida")
                    continue
                
                # Validar valor
                valor = None
                if valor_str:
                    try:
                        valor = Decimal(valor_str.replace(',', '.'))
                    except:
                        erros.append(f"Linha {linha_num}: Valor '{valor_str}' inválido")
                        continue
                
                # Validar unidade de negócio
                if unidade_negocio_id:
                    try:
                        unidade_negocio_id = int(unidade_negocio_id)
                        unidade = UnidadeNegocio.query.get(unidade_negocio_id)
                        if not unidade:
                            erros.append(f"Linha {linha_num}: Unidade de negócio ID {unidade_negocio_id} não encontrada")
                            continue
                    except ValueError:
                        erros.append(f"Linha {linha_num}: Unidade de negócio ID deve ser numérico")
                        continue
                else:
                    unidade_negocio_id = None
                
                # Criar ativo base
                ativo = Ativo(
                    tipo=tipo,
                    condicao=condicao,
                    valor=valor,
                    unidade_negocio_id=unidade_negocio_id
                )
                
                db.session.add(ativo)
                db.session.flush()  # Para obter o ID do ativo
                
                # Criar registro específico baseado no tipo
                if tipo == 'smartphone':
                    marca_id = linha.get('marca_id', '').strip()
                    if marca_id:
                        try:
                            marca_id = int(marca_id)
                            if not Marca.query.get(marca_id):
                                erros.append(f"Linha {linha_num}: Marca ID {marca_id} não encontrada")
                                continue
                        except ValueError:
                            erros.append(f"Linha {linha_num}: Marca ID deve ser numérico")
                            continue
                    else:
                        marca_id = None
                    
                    smartphone = Smartphone(
                        ativo_id=ativo.id,
                        marca_id=marca_id,
                        modelo=linha.get('modelo', '').strip() or None,
                        imei_slot=linha.get('imei_slot', '').strip() or None,
                        acessorios=linha.get('acessorios', '').strip() or None
                    )
                    db.session.add(smartphone)
                    
                elif tipo in ['notebook', 'desktop']:
                    marca_id = linha.get('marca_id', '').strip()
                    if marca_id:
                        try:
                            marca_id = int(marca_id)
                            if not Marca.query.get(marca_id):
                                erros.append(f"Linha {linha_num}: Marca ID {marca_id} não encontrada")
                                continue
                        except ValueError:
                            erros.append(f"Linha {linha_num}: Marca ID deve ser numérico")
                            continue
                    else:
                        marca_id = None
                    
                    computador = Computador(
                        ativo_id=ativo.id,
                        tipo_computador=tipo,
                        marca_id=marca_id,
                        modelo=linha.get('modelo', '').strip() or None,
                        patrimonio=linha.get('patrimonio', '').strip() or None,
                        serie=linha.get('serie', '').strip() or None,
                        so_versao=linha.get('so_versao', '').strip() or None,
                        processador=linha.get('processador', '').strip() or None,
                        memoria=linha.get('memoria', '').strip() or None,
                        hd=linha.get('hd', '').strip() or None,
                        acessorios=linha.get('acessorios', '').strip() or None
                    )
                    db.session.add(computador)
                    
                elif tipo == 'chip_sim':
                    operadora_id = linha.get('operadora_id', '').strip()
                    if operadora_id:
                        try:
                            operadora_id = int(operadora_id)
                            if not Operadora.query.get(operadora_id):
                                erros.append(f"Linha {linha_num}: Operadora ID {operadora_id} não encontrada")
                                continue
                        except ValueError:
                            erros.append(f"Linha {linha_num}: Operadora ID deve ser numérico")
                            continue
                    else:
                        operadora_id = None
                    
                    chip_sim = ChipSim(
                        ativo_id=ativo.id,
                        operadora_id=operadora_id,
                        numero=linha.get('numero', '').strip() or None,
                        tipo=linha.get('tipo_chip', '').strip() or None
                    )
                    db.session.add(chip_sim)
                
                sucessos += 1
                
            except Exception as e:
                erros.append(f"Linha {linha_num}: Erro ao processar - {str(e)}")
        
        if sucessos > 0:
            db.session.commit()
            
            # Log de auditoria
            log_audit(
                acao="CREATE",
                tabela="ativos", 
                registro_id=None,
                descricao=f"Importação em lote de {sucessos} ativos via CSV",
                dados_antigos=None, 
                dados_novos={"total_importados": sucessos}
            )
        else:
            db.session.rollback()
        
        resultado = {
            "sucessos": sucessos,
            "erros": len(erros),
            "detalhes_erros": erros[:10]  # Limitar a 10 erros para não sobrecarregar
        }
        
        if len(erros) > 10:
            resultado["mais_erros"] = f"... e mais {len(erros) - 10} erros"
        
        return jsonify(resultado)
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro na importação de ativos: {e}")
        return jsonify({"error": f"Erro ao processar arquivo: {str(e)}"}), 500