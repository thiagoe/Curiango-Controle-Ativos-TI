from flask_mail import Message
from ..core.mail import mail
from ..core.db import db
from ..models.dominio import Colaborador, Ativo, Smartphone, Computador, ChipSim, Setor
from .parametros_service import obter_parametro
from flask import current_app
from datetime import date

def _obter_email_colaborador(colaborador_id: int) -> str:
    """Busca o email do colaborador no banco de dados"""
    colaborador = db.session.query(Colaborador).filter_by(id=colaborador_id).first()
    if not colaborador or not colaborador.email:
        raise ValueError(f"Email não encontrado para o colaborador ID {colaborador_id}")
    return colaborador.email

def _obter_descricao_ativo(ativo_id: int) -> str:
    """Busca a descrição/modelo do ativo"""
    ativo = db.session.query(Ativo).filter_by(id=ativo_id).first()
    if not ativo:
        return f"Ativo ID {ativo_id}"
    
    # Buscar detalhes específicos do tipo
    if ativo.tipo == "smartphone":
        smartphone = db.session.query(Smartphone).filter_by(ativo_id=ativo.id).first()
        return smartphone.modelo if smartphone and smartphone.modelo else f"Smartphone ID {ativo_id}"
    elif ativo.tipo in ["notebook", "desktop"]:
        computador = db.session.query(Computador).filter_by(ativo_id=ativo.id).first()
        return computador.modelo if computador and computador.modelo else f"Computador ID {ativo_id}"
    elif ativo.tipo == "chip_sim":
        chip = db.session.query(ChipSim).filter_by(ativo_id=ativo.id).first()
        return chip.numero if chip and chip.numero else f"Chip SIM ID {ativo_id}"
    
    return f"Ativo ID {ativo_id}"

def _processar_template(template: str, variaveis: dict) -> str:
    """Processa um template substituindo as variáveis"""
    resultado = template
    for chave, valor in variaveis.items():
        placeholder = f"{{{{ {chave} }}}}"
        resultado = resultado.replace(placeholder, str(valor))
    return resultado

def enviar_email_transferencia(colaborador_id: int, ativo_id: int, pdf_bytes: bytes):
    """Envia email de alocação de ativo com termo de responsabilidade"""
    try:
        colaborador = db.session.query(Colaborador).filter_by(id=colaborador_id).first()
        if not colaborador:
            raise ValueError(f"Colaborador não encontrado: ID {colaborador_id}")
        
        if not colaborador.email:
            print(f"Aviso: Colaborador {colaborador.nome} não possui email cadastrado")
            return
        
        ativo_desc = _obter_descricao_ativo(ativo_id)
        
        # Obter templates personalizados
        template_assunto = obter_parametro('email_alocacao_assunto', f"Ativo Alocado - {ativo_desc}")
        template_corpo = obter_parametro('email_alocacao_corpo', f"""Olá {colaborador.nome},

Um ativo foi alocado para você:

Ativo: {ativo_desc}
Data de Alocação: {date.today().strftime('%d/%m/%Y')}

Em anexo você encontrará o termo de responsabilidade que deve ser assinado e devolvido ao setor responsável.

Atenciosamente,
Sistema de Controle de Ativos""")
        
        # Variáveis para substituição
        variaveis = {
            'NOME_COLABORADOR': colaborador.nome,
            'ATIVO_DESCRICAO': ativo_desc,
            'DATA_ALOCACAO': date.today().strftime('%d/%m/%Y')
        }
        
        # Processar templates
        assunto = _processar_template(template_assunto, variaveis)
        corpo = _processar_template(template_corpo, variaveis)
        
        # Lista de destinatários: colaborador + responsável do setor
        recipients = [colaborador.email]
        
        # Adicionar email do responsável do setor se existir
        if colaborador.setor_id:
            setor = db.session.query(Setor).filter_by(id=colaborador.setor_id, ativo=True).first()
            if setor and setor.email_responsavel and setor.email_responsavel not in recipients:
                recipients.append(setor.email_responsavel)
        
        msg = Message(
            subject=assunto,
            recipients=recipients
        )
        
        msg.body = corpo

        msg.attach("termo_responsabilidade.pdf", "application/pdf", pdf_bytes)
        mail.send(msg)
        
    except Exception as e:
        print(f"Erro ao enviar email de alocação: {e}")
        raise

def enviar_email_devolucao(colaborador_id: int, ativo_id: int):
    """Envia email de devolução/remoção de ativo"""
    try:
        colaborador = db.session.query(Colaborador).filter_by(id=colaborador_id).first()
        if not colaborador:
            print(f"Aviso: Colaborador ID {colaborador_id} não encontrado para envio de email de devolução")
            return
        
        if not colaborador.email:
            print(f"Aviso: Colaborador {colaborador.nome} não possui email cadastrado")
            return
        
        ativo_desc = _obter_descricao_ativo(ativo_id)
        
        # Obter templates personalizados
        template_assunto = obter_parametro('email_devolucao_assunto', f"Ativo Devolvido - {ativo_desc}")
        template_corpo = obter_parametro('email_devolucao_corpo', f"""Olá {colaborador.nome},

O ativo que estava sob sua responsabilidade foi devolvido:

Ativo: {ativo_desc}
Data de Devolução: {date.today().strftime('%d/%m/%Y')}

Este ativo não está mais sob sua responsabilidade.

Atenciosamente,
Sistema de Controle de Ativos""")
        
        # Variáveis para substituição
        variaveis = {
            'NOME_COLABORADOR': colaborador.nome,
            'ATIVO_DESCRICAO': ativo_desc,
            'DATA_DEVOLUCAO': date.today().strftime('%d/%m/%Y')
        }
        
        # Processar templates
        assunto = _processar_template(template_assunto, variaveis)
        corpo = _processar_template(template_corpo, variaveis)
        
        # Lista de destinatários: colaborador + responsável do setor
        recipients = [colaborador.email]
        
        # Adicionar email do responsável do setor se existir
        if colaborador.setor_id:
            setor = db.session.query(Setor).filter_by(id=colaborador.setor_id, ativo=True).first()
            if setor and setor.email_responsavel and setor.email_responsavel not in recipients:
                recipients.append(setor.email_responsavel)
        
        msg = Message(
            subject=assunto,
            recipients=recipients
        )
        
        msg.body = corpo

        mail.send(msg)
        
    except Exception as e:
        print(f"Erro ao enviar email de devolução: {e}")
        # Não levanta exceção para não interromper o processo de devolução

def enviar_email_remocao(colaborador_email: str, ativo_desc: str):
    """Função legada - manter para compatibilidade"""
    msg = Message(subject="Alocação removida", recipients=[colaborador_email])
    msg.body = f"A alocação do ativo {ativo_desc} foi removida."
    mail.send(msg)