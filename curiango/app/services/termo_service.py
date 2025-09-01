from flask import render_template_string
from ..core.pdf import render_pdf_from_html
from ..models.dominio import Ativo, Colaborador, Smartphone, Computador, ChipSim, Marca, Operadora
from .parametros_service import obter_parametro

def detalhes_equipamento(ativo: Ativo) -> str:
    if ativo.tipo == "smartphone":
        s = Smartphone.query.filter_by(ativo_id=ativo.id).first()
        marca = Marca.query.get(s.marca_id).nome if s and s.marca_id else "-"
        return f"Smartphone {marca} {s.modelo or '-'} - IMEI {getattr(s, 'imei_slot', '-')}"
    if ativo.tipo in ["notebook", "desktop"]:
        c = Computador.query.filter_by(ativo_id=ativo.id).first()
        marca = Marca.query.get(c.marca_id).nome if c and c.marca_id else "-"
        return f"{c.tipo_computador.title()} {marca} {c.modelo} - Patrimônio {c.patrimonio}"
    if ativo.tipo == "chip_sim":
        ch = ChipSim.query.filter_by(ativo_id=ativo.id).first()
        if ch:
            op = Operadora.query.get(ch.operadora_id).nome if ch.operadora_id else "-"
            # Formatação dos tipos conforme solicitado
            if ch.tipo == "dados":
                tipo_chip = "Dados"
            else:
                tipo_chip = "Voz/Dados"
            return f"Chip {op} - Número {getattr(ch, 'numero', '-')} - Tipo: {tipo_chip}"
        else:
            return "Chip SIM - dados não encontrados"
    return "Ativo"

def formatar_status(status: str) -> str:
    """Formatar status do ativo para exibição nos termos."""
    status_map = {
        "novo": "Novo",
        "usado": "Usado",
        "danificado": "Danificado",
        "em_manutencao": "Em Manutenção",
        "inativo": "Inativo"
    }
    return status_map.get(status, status.title())

def gerar_termo_pdf(ativo_id: int, colaborador_id: int) -> bytes:
    ativo = Ativo.query.get_or_404(ativo_id)
    col = Colaborador.query.get_or_404(colaborador_id)
    equipamento = detalhes_equipamento(ativo)
    
    # Formatar valor do equipamento
    valor_equipamento = "R$ {:.2f}".format(float(ativo.valor)) if ativo.valor else "Não informado"
    
    # Formatar status do ativo
    status_equipamento = formatar_status(ativo.condicao)
    
    # Obter acessórios do ativo
    acessorios = "Não disponível"
    if ativo.tipo == "smartphone":
        s = Smartphone.query.filter_by(ativo_id=ativo.id).first()
        if s and s.acessorios:
            acessorios = s.acessorios
    elif ativo.tipo in ["notebook", "desktop"]:
        c = Computador.query.filter_by(ativo_id=ativo.id).first()
        if c and c.acessorios:
            acessorios = c.acessorios
    
    # Determinar qual template usar baseado no tipo do ativo
    template_key = None
    if ativo.tipo == "smartphone":
        template_key = 'termo_smartphone_template'
    elif ativo.tipo in ["notebook", "desktop"]:
        template_key = 'termo_notebook_template'
    elif ativo.tipo == "chip_sim":
        template_key = 'termo_chip_sim_template'
    else:
        # Fallback para template de smartphone se tipo não reconhecido
        template_key = 'termo_smartphone_template'
    
    # Obter template específico do tipo de ativo
    template_html = obter_parametro(template_key)
    
    if not template_html:
        # Fallback para template padrão se não existir no banco
        from flask import render_template
        html = render_template(
            "termo_responsabilidade.html",
            NOME_USUARIO=col.nome,
            CPF_USUARIO=col.cpf or "-",
            MATRICULA_USUARIO=col.matricula or "-",
            DETALHES_EQUIPAMENTO=equipamento,
            VALOR_EQUIPAMENTO=valor_equipamento,
            ACESSORIOS=acessorios,
            STATUS=status_equipamento,
        )
    else:
        # Usar template específico do banco
        html = render_template_string(
            template_html,
            NOME_USUARIO=col.nome,
            CPF_USUARIO=col.cpf or "-",
            MATRICULA_USUARIO=col.matricula or "-",
            DETALHES_EQUIPAMENTO=equipamento,
            VALOR_EQUIPAMENTO=valor_equipamento,
            ACESSORIOS=acessorios,
            STATUS=status_equipamento,
        )
    
    return render_pdf_from_html(html)