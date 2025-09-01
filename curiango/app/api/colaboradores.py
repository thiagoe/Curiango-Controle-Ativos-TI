from flask import Blueprint, request, jsonify, session
from ..core.db import db
from ..core.auth import api_auth_required, admin_required
from ..models.dominio import Colaborador, UnidadeNegocio, Ativo, Smartphone, Computador, ChipSim, Marca, Operadora, Setor
import logging

bp = Blueprint("colaboradores", __name__)
logger = logging.getLogger("app")

def obter_ativos_alocados(colaborador_id):
    """Retorna lista de ativos alocados ao colaborador"""
    ativos = Ativo.query.filter_by(usuario_atual_id=colaborador_id).all()
    resultado = []
    
    for ativo in ativos:
        item = {
            "id": ativo.id,
            "tipo": ativo.tipo,
            "condicao": ativo.condicao,
            "descricao": f"Ativo #{ativo.id}"
        }
        
        # Adiciona detalhes específicos por tipo
        if ativo.tipo == "smartphone":
            smartphone = Smartphone.query.filter_by(ativo_id=ativo.id).first()
            if smartphone:
                marca = Marca.query.get(smartphone.marca_id) if smartphone.marca_id else None
                item["descricao"] = f"Smartphone {marca.nome if marca else ''} {smartphone.modelo or ''}"
                
        elif ativo.tipo in ["notebook", "desktop"]:
            computador = Computador.query.filter_by(ativo_id=ativo.id).first()
            if computador:
                marca = Marca.query.get(computador.marca_id) if computador.marca_id else None
                item["descricao"] = f"{ativo.tipo.title()} {marca.nome if marca else ''} {computador.modelo or ''}"
                item["patrimonio"] = computador.patrimonio
                
        elif ativo.tipo == "chip_sim":
            chip = ChipSim.query.filter_by(ativo_id=ativo.id).first()
            if chip:
                operadora = Operadora.query.get(chip.operadora_id) if chip.operadora_id else None
                item["descricao"] = f"Chip {operadora.nome if operadora else ''} - {chip.numero or ''}"
                
        resultado.append(item)
    
    return resultado

# Opcional: proteger por sessão
def require_login(func):
    def wrapper(*args, **kwargs):
        if not session.get("user"):
            return jsonify({"error": "unauthorized"}), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@bp.get("")
def listar_colaboradores():
    q = Colaborador.query
    nome = (request.args.get("nome") or "").strip()
    cpf = (request.args.get("cpf") or "").strip()
    matricula = (request.args.get("matricula") or "").strip()
    status = (request.args.get("status") or "").strip()
    unidade_id = request.args.get("unidade_id")

    if nome or cpf or matricula:
        # Busca por qualquer um dos campos
        filters = []
        if nome:
            filters.append(Colaborador.nome.ilike(f"%{nome}%"))
        if cpf:
            filters.append(Colaborador.cpf.ilike(f"%{cpf}%"))
        if matricula:
            filters.append(Colaborador.matricula.ilike(f"%{matricula}%"))
        q = q.filter(db.or_(*filters))
        
    if status in ("ativo", "desligado"):
        q = q.filter(Colaborador.status == status)

    limit = min(int(request.args.get("limit", 100)), 500)
    offset = int(request.args.get("offset", 0))
    itens = q.order_by(Colaborador.nome.asc()).offset(offset).limit(limit).all()

    def to_json(c: Colaborador):
        ativos_alocados = obter_ativos_alocados(c.id)
        
        # Buscar informações do setor
        setor_info = None
        if c.setor_id:
            setor = Setor.query.get(c.setor_id)
            if setor:
                setor_info = {
                    "id": setor.id,
                    "nome": setor.nome,
                    "email_responsavel": setor.email_responsavel
                }
        
        return {
            "id": c.id,
            "nome": c.nome,
            "matricula": c.matricula,
            "cpf": c.cpf,
            "email": c.email,
            "cargo": c.cargo,
            "status": c.status,
            "setor_id": c.setor_id,
            "setor": setor_info,
            "ativos_alocados": ativos_alocados,
            "total_ativos": len(ativos_alocados)
        }
    return jsonify([to_json(c) for c in itens])

@bp.post("")
def criar_colaborador():
    data = request.get_json() or {}
    nome = (data.get("nome") or "").strip()
    if not nome:
        return jsonify({"error": "nome é obrigatório"}), 400

    # Validar setor_id se fornecido
    setor_id = data.get("setor_id")
    if setor_id:
        setor = Setor.query.get(setor_id)
        if not setor or not setor.ativo:
            return jsonify({"error": "Setor inválido ou inativo"}), 400
    
    c = Colaborador(
        nome=nome,
        matricula=(data.get("matricula") or "").strip() or None,
        cpf=(data.get("cpf") or "").strip() or None,
        email=(data.get("email") or "").strip() or None,
        cargo=(data.get("cargo") or "").strip() or None,
        setor_id=setor_id,
        status=data.get("status") if data.get("status") in ("ativo", "desligado") else "ativo"
    )

    db.session.add(c)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao criar colaborador: {e}")
        return jsonify({"error": "falha ao criar colaborador"}), 500
    logger.info(f"Colaborador criado id={c.id} nome={c.nome}")
    # Buscar informações do setor para retorno
    setor_info = None
    if c.setor_id:
        setor = Setor.query.get(c.setor_id)
        if setor:
            setor_info = {
                "id": setor.id,
                "nome": setor.nome,
                "email_responsavel": setor.email_responsavel
            }
    
    return jsonify({
        "id": c.id, 
        "nome": c.nome, 
        "matricula": c.matricula, 
        "cpf": c.cpf,
        "email": c.email, 
        "cargo": c.cargo,
        "setor_id": c.setor_id,
        "setor": setor_info,
        "status": c.status
    }), 201

@bp.get("/<int:colab_id>")
def obter_colaborador(colab_id):
    c = Colaborador.query.get_or_404(colab_id)
    ativos_alocados = obter_ativos_alocados(c.id)
    
    # Buscar informações do setor
    setor_info = None
    if c.setor_id:
        setor = Setor.query.get(c.setor_id)
        if setor:
            setor_info = {
                "id": setor.id,
                "nome": setor.nome,
                "email_responsavel": setor.email_responsavel
            }
    
    return jsonify({
        "id": c.id, "nome": c.nome, "matricula": c.matricula, "cpf": c.cpf,
        "email": c.email, "cargo": c.cargo, "unidade_negocio_id": getattr(c, 'unidade_negocio_id', None), 
        "setor_id": c.setor_id, "setor": setor_info, "status": c.status,
        "ativos_alocados": ativos_alocados,
        "total_ativos": len(ativos_alocados)
    })

@bp.put("/<int:colab_id>")
def atualizar_colaborador(colab_id):
    c = Colaborador.query.get_or_404(colab_id)
    data = request.get_json() or {}

    if "nome" in data:
        nome = (data.get("nome") or "").strip()
        if not nome:
            return jsonify({"error": "nome é obrigatório"}), 400
        c.nome = nome

    for campo in ("matricula", "cpf", "email", "cargo"):
        if campo in data:
            valor = (data.get(campo) or "").strip()
            setattr(c, campo, valor or None)

    if "status" in data:
        st = data.get("status")
        if st not in ("ativo", "desligado"):
            return jsonify({"error": "status inválido"}), 400
        c.status = st

    if "unidade_negocio_id" in data:
        uid = data.get("unidade_negocio_id")
        if uid is not None and hasattr(c, 'unidade_negocio_id'):
            if not UnidadeNegocio.query.get(uid):
                return jsonify({"error": "unidade_negocio_id inválido"}), 400
            c.unidade_negocio_id = uid

    # Validar e atualizar setor_id se fornecido
    if "setor_id" in data:
        setor_id = data.get("setor_id")
        if setor_id:
            setor = Setor.query.get(setor_id)
            if not setor or not setor.ativo:
                return jsonify({"error": "Setor inválido ou inativo"}), 400
        c.setor_id = setor_id

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar colaborador id={colab_id}: {e}")
        return jsonify({"error": "falha ao atualizar colaborador"}), 500

    logger.info(f"Colaborador atualizado id={c.id} nome={c.nome}")
    # Buscar informações do setor para retorno
    setor_info = None
    if c.setor_id:
        setor = Setor.query.get(c.setor_id)
        if setor:
            setor_info = {
                "id": setor.id,
                "nome": setor.nome,
                "email_responsavel": setor.email_responsavel
            }
    
    return jsonify({
        "id": c.id, "nome": c.nome, "matricula": c.matricula, "cpf": c.cpf,
        "email": c.email, "cargo": c.cargo, "unidade_negocio_id": getattr(c, 'unidade_negocio_id', None), 
        "setor_id": c.setor_id, "setor": setor_info, "status": c.status
    })

@bp.delete("/<int:colab_id>")
@admin_required
def excluir_colaborador(colab_id):
    try:
        c = Colaborador.query.get_or_404(colab_id)
        
        # VALIDAÇÃO 1: Verificar se colaborador possui ativos alocados
        ativos_alocados = Ativo.query.filter_by(usuario_atual_id=colab_id).all()
        if ativos_alocados:
            # Obter descrições dos ativos alocados
            try:
                ativos_info = obter_ativos_alocados(colab_id)
                ativos_nomes = [info.get('descricao', f'Ativo #{info.get("id")}') for info in ativos_info]
                ativos_str = ', '.join(ativos_nomes[:3])
                if len(ativos_nomes) > 3:
                    ativos_str += '...'
            except:
                ativos_str = f"{len(ativos_alocados)} ativo(s)"
                
            return jsonify({
                "error": "Colaborador não pode ser excluído", 
                "detail": f"Colaborador possui ativo(s) alocado(s): {ativos_str}. Devolva todos os ativos antes de excluir."
            }), 400
            
        # VALIDAÇÃO 2: Verificar se há alocações ativas no histórico
        from ..models.dominio import HistoricoAlocacao
        alocacoes_ativas = HistoricoAlocacao.query.filter_by(colaborador_id=colab_id, data_fim=None).count()
        if alocacoes_ativas > 0:
            return jsonify({
                "error": "Colaborador não pode ser excluído", 
                "detail": f"Colaborador possui {alocacoes_ativas} alocação(ões) ativa(s) no histórico. Finalize todas as alocações antes de excluir."
            }), 400
        
        # Log de auditoria antes da exclusão
        from ..services.auditoria_service import log_audit
        log_audit(
            acao="DELETE",
            tabela="colaboradores",
            registro_id=colab_id,
            descricao=f"Colaborador excluído: {c.nome}",
            dados_antigos={"nome": c.nome, "email": c.email, "matricula": c.matricula, "status": c.status}
        )
        
        # Excluir o colaborador (cascade irá remover histórico de alocações antigas)
        db.session.delete(c)
        db.session.commit()
        
        logger.info(f"Colaborador excluído id={colab_id} nome={c.nome} (sem alocações ativas)")
        return jsonify({"ok": True, "message": "Colaborador excluído com sucesso"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao excluir colaborador id={colab_id}: {e}")
        return jsonify({"error": "Falha ao excluir colaborador", "detail": str(e)}), 500

@bp.get("/export")
def exportar_colaboradores():
    """Endpoint para exportar colaboradores em CSV"""
    colaboradores = Colaborador.query.all()
    
    resultado = []
    for colaborador in colaboradores:
        # Buscar setor
        setor_nome = ""
        if colaborador.setor_id:
            setor = Setor.query.get(colaborador.setor_id)
            setor_nome = setor.nome if setor else ""
        
        item = {
            "id": colaborador.id,
            "nome": colaborador.nome,
            "matricula": colaborador.matricula or "",
            "cpf": colaborador.cpf or "",
            "email": colaborador.email or "",
            "cargo": colaborador.cargo or "",
            "setor_id": colaborador.setor_id or "",
            "setor_nome": setor_nome,
            "status": colaborador.status,
            "data_criacao": colaborador.created_at.strftime("%Y-%m-%d %H:%M:%S") if colaborador.created_at else ""
        }
        resultado.append(item)
    
    return jsonify({
        "colaboradores": resultado,
        "total": len(resultado)
    })

@bp.post("/import")
def importar_colaboradores():
    """Endpoint para importar colaboradores via CSV"""
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
        
        # Ler conteúdo do arquivo
        content = file.read().decode('utf-8-sig')  # utf-8-sig remove BOM se existir
        csv_reader = csv.DictReader(io.StringIO(content))
        
        sucessos = 0
        erros = []
        
        for linha_num, linha in enumerate(csv_reader, start=2):  # Começar do 2 por causa do cabeçalho
            try:
                # Limpar caracteres invisíveis de todos os campos
                linha_limpa = {}
                for key, value in linha.items():
                    if value:
                        # Remove Zero Width Space (\u200b) e outros caracteres invisíveis
                        value_clean = value.replace('\u200b', '').replace('\ufeff', '').strip()
                        linha_limpa[key] = value_clean
                    else:
                        linha_limpa[key] = value
                
                # Campos obrigatórios
                nome = linha_limpa.get('nome', '').strip()
                email = linha_limpa.get('email', '').strip()
                
                # Validar tamanho dos campos
                if len(nome) > 150:
                    erros.append(f"Linha {linha_num}: Nome muito longo (máximo 150 caracteres)")
                    continue
                
                if len(email) > 150:
                    erros.append(f"Linha {linha_num}: Email muito longo (máximo 150 caracteres)")
                    continue
                
                if not nome:
                    erros.append(f"Linha {linha_num}: Nome é obrigatório")
                    continue
                
                if not email:
                    erros.append(f"Linha {linha_num}: Email é obrigatório")
                    continue
                
                # Verificar se já existe colaborador com mesmo email
                colaborador_existente = Colaborador.query.filter_by(email=email).first()
                if colaborador_existente:
                    erros.append(f"Linha {linha_num}: Email {email} já existe")
                    continue
                
                # Verificar se já existe colaborador com mesmo CPF (se fornecido)
                cpf = linha_limpa.get('cpf', '').strip() or None
                if cpf:
                    # Validar tamanho do CPF
                    if len(cpf) > 14:
                        erros.append(f"Linha {linha_num}: CPF muito longo (máximo 14 caracteres)")
                        continue
                    
                    # Permitir múltiplos registros com CPF 000.000.000.00 (considerado como "não informado")
                    if cpf != '000.000.000.00':
                        colaborador_cpf_existente = Colaborador.query.filter_by(cpf=cpf).first()
                        if colaborador_cpf_existente:
                            erros.append(f"Linha {linha_num}: CPF {cpf} já existe")
                            continue
                
                # Validar setor se fornecido
                setor_id = linha_limpa.get('setor_id', '').strip()
                if setor_id:
                    try:
                        setor_id = int(setor_id)
                        setor = Setor.query.get(setor_id)
                        if not setor or not setor.ativo:
                            erros.append(f"Linha {linha_num}: Setor ID {setor_id} inválido ou inativo")
                            continue
                    except ValueError:
                        erros.append(f"Linha {linha_num}: Setor ID deve ser numérico")
                        continue
                else:
                    setor_id = None
                
                # Validar status
                status = linha_limpa.get('status', 'ativo').strip().lower()
                if status not in ['ativo', 'desligado']:
                    status = 'ativo'
                
                # Validar tamanhos de outros campos
                matricula = linha_limpa.get('matricula', '').strip() or None
                if matricula and len(matricula) > 50:
                    erros.append(f"Linha {linha_num}: Matrícula muito longa (máximo 50 caracteres)")
                    continue
                
                # Verificar matrícula duplicada (exceto valores genéricos como "1", "0")
                if matricula and matricula not in ['0', '1']:
                    colaborador_matricula_existente = Colaborador.query.filter_by(matricula=matricula).first()
                    if colaborador_matricula_existente:
                        erros.append(f"Linha {linha_num}: Matrícula {matricula} já existe")
                        continue
                
                cargo = linha_limpa.get('cargo', '').strip() or None
                if cargo and len(cargo) > 100:
                    erros.append(f"Linha {linha_num}: Cargo muito longo (máximo 100 caracteres)")
                    continue
                
                # Criar colaborador
                # Tratar CPF 000.000.000.00 como NULL para evitar problemas com UNIQUE constraint
                cpf_final = None if cpf == '000.000.000.00' else cpf
                
                # Tratar matrículas genéricas como NULL para evitar duplicação
                matricula_final = None if matricula in ['0', '1'] else matricula
                
                colaborador = Colaborador(
                    nome=nome,
                    email=email,
                    matricula=matricula_final,
                    cpf=cpf_final,
                    cargo=cargo,
                    setor_id=setor_id,
                    status=status
                )
                
                db.session.add(colaborador)
                sucessos += 1
                
            except Exception as e:
                erros.append(f"Linha {linha_num}: Erro ao processar - {str(e)}")
        
        if sucessos > 0:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.error(f"Erro ao fazer commit da importação: {e}")
                return jsonify({"error": f"Erro ao salvar dados: {str(e)}"}), 500
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
        logger.error(f"Erro na importação de colaboradores: {e}")
        return jsonify({"error": f"Erro ao processar arquivo: {str(e)}"}), 500