from datetime import date, datetime
from ..core.db import db
from ..models.dominio import Ativo, HistoricoAlocacao, Colaborador
from .termo_service import gerar_termo_pdf
from .email_service import enviar_email_transferencia, enviar_email_devolucao
from .auditoria_service import log_audit, obter_descricao_ativo
from ..core.timezone_utils import now_local, now_naive

def transferir_ativo(ativo_id: int, colaborador_id: int, motivo: str, usuario_sistema: str):
    ativo = Ativo.query.get_or_404(ativo_id)
    colaborador = Colaborador.query.get_or_404(colaborador_id)
    
    # Buscar colaborador anterior se houver
    colaborador_anterior = None
    if ativo.usuario_atual_id:
        colaborador_anterior = Colaborador.query.get(ativo.usuario_atual_id)
    
    # Fechar alocação anterior
    HistoricoAlocacao.query.filter_by(ativo_id=ativo_id, data_fim=None).update({"data_fim": now_naive()})
    
    # Atualizar ativo
    usuario_anterior_id = ativo.usuario_atual_id
    ativo.usuario_atual_id = colaborador_id
    ativo.data_alocacao = now_naive()  # Atualizar horário de alocação
    db.session.add(ativo)
    
    # Novo histórico
    hist = HistoricoAlocacao(ativo_id=ativo_id, colaborador_id=colaborador_id, data_inicio=now_naive(), motivo_transferencia=motivo)
    db.session.add(hist)
    db.session.flush()
    
    # Log de auditoria para transferência
    ativo_descricao = obter_descricao_ativo(ativo_id)
    if colaborador_anterior:
        descricao = f"{ativo_descricao} transferido de {colaborador_anterior.nome} para {colaborador.nome}"
    else:
        descricao = f"{ativo_descricao} alocado para {colaborador.nome}"
    
    log_audit(
        acao="TRANSFER",
        tabela="ativos",
        registro_id=ativo_id,
        descricao=descricao,
        dados_antigos={"usuario_atual_id": usuario_anterior_id, "colaborador_anterior": colaborador_anterior.nome if colaborador_anterior else None},
        dados_novos={"usuario_atual_id": colaborador_id, "colaborador_novo": colaborador.nome, "motivo": motivo}
    )
    
    # Gerar termo (PDF em bytes) e tentar enviar email
    try:
        pdf_bytes = gerar_termo_pdf(ativo_id, colaborador_id)
        enviar_email_transferencia(colaborador_id, ativo_id, pdf_bytes)
        hist.termo_gerado = True
    except Exception as e:
        # Log do erro mas não falha a operação
        print(f"Aviso: Falha ao gerar termo/enviar email: {e}")
        hist.termo_gerado = False
    
    db.session.commit()
    return hist

def remover_alocacao(ativo_id: int, usuario_sistema: str):
    ativo = Ativo.query.get_or_404(ativo_id)
    
    # Guardar o colaborador_id antes de remover para enviar email e auditoria
    colaborador_id_anterior = ativo.usuario_atual_id
    colaborador_anterior = None
    if colaborador_id_anterior:
        colaborador_anterior = Colaborador.query.get(colaborador_id_anterior)
    
    # Fechar histórico atual
    HistoricoAlocacao.query.filter_by(ativo_id=ativo_id, data_fim=None).update({"data_fim": now_naive()})
    
    # Remover do ativo
    ativo.usuario_atual_id = None
    ativo.data_alocacao = None  # Limpar data de alocação na devolução
    db.session.add(ativo)
    
    # Log de auditoria para remoção
    if colaborador_anterior:
        ativo_descricao = obter_descricao_ativo(ativo_id)
        log_audit(
            acao="REMOVE_ALLOCATION",
            tabela="ativos",
            registro_id=ativo_id,
            descricao=f"{ativo_descricao} devolvido por {colaborador_anterior.nome}",
            dados_antigos={"usuario_atual_id": colaborador_id_anterior, "colaborador": colaborador_anterior.nome},
            dados_novos={"usuario_atual_id": None, "status": "Disponível"}
        )
    
    db.session.commit()
    
    # Enviar email de devolução se havia um colaborador alocado
    if colaborador_id_anterior:
        try:
            enviar_email_devolucao(colaborador_id_anterior, ativo_id)
        except Exception as e:
            # Log do erro mas não falha a operação
            print(f"Aviso: Falha ao enviar email de devolução: {e}")
    
    return True