from ..core.db import db
from ..models.dominio import ParametroSistema
from .auditoria_service import log_audit
import logging

logger = logging.getLogger("app")

def obter_parametro(chave: str, valor_padrao: str = ""):
    """Obtém um parâmetro do sistema pela chave"""
    param = db.session.query(ParametroSistema).filter_by(chave=chave, ativo=True).first()
    return param.valor if param else valor_padrao

def atualizar_parametro(chave: str, valor: str, tipo: str = "texto", descricao: str = ""):
    """Atualiza ou cria um parâmetro do sistema"""
    param = db.session.query(ParametroSistema).filter_by(chave=chave).first()
    
    if param:
        # Atualizar parâmetro existente
        valor_anterior = param.valor
        param.valor = valor
        param.tipo = tipo
        param.descricao = descricao
        param.ativo = True
        
        log_audit(
            acao="UPDATE",
            tabela="parametros_sistema",
            registro_id=param.id,
            descricao=f"Parâmetro '{chave}' atualizado",
            dados_antigos={"valor": valor_anterior},
            dados_novos={"valor": valor}
        )
    else:
        # Criar novo parâmetro
        param = ParametroSistema(
            chave=chave,
            valor=valor,
            tipo=tipo,
            descricao=descricao
        )
        db.session.add(param)
        db.session.flush()
        
        log_audit(
            acao="CREATE",
            tabela="parametros_sistema",
            registro_id=param.id,
            descricao=f"Parâmetro '{chave}' criado",
            dados_novos={"chave": chave, "valor": valor, "tipo": tipo}
        )
    
    db.session.commit()
    return param

def listar_parametros():
    """Lista todos os parâmetros ativos do sistema"""
    return db.session.query(ParametroSistema).filter_by(ativo=True).order_by(ParametroSistema.chave).all()

def inicializar_parametros_padrao():
    """Inicializa parâmetros padrão do sistema se não existirem"""
    parametros_padrao = [
        {
            "chave": "termo_responsabilidade_template",
            "valor": """<!DOCTYPE html>
<html>
<head>
    <title>Termo de Responsabilidade</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TERMO DE RESPONSABILIDADE DE EQUIPAMENTO</h2>
    </div>
    
    <div class="content">
        <p>Eu, <strong>{{ NOME_USUARIO }}</strong>, portador(a) do CPF <strong>{{ CPF_USUARIO }}</strong>, matrícula <strong>{{ MATRICULA_USUARIO }}</strong>, declaro ter recebido o seguinte equipamento:</p>
        
        <p><strong>Equipamento:</strong> {{ DETALHES_EQUIPAMENTO }}</p>
        <p><strong>Valor:</strong> {{ VALOR_EQUIPAMENTO }}</p>
        
        <p>Comprometo-me a:</p>
        <ul>
            <li>Utilizar o equipamento apenas para fins profissionais</li>
            <li>Zelar pela integridade física do equipamento</li>
            <li>Comunicar imediatamente qualquer dano ou problema</li>
            <li>Devolver o equipamento quando solicitado</li>
        </ul>
        
        <p>Declaro estar ciente de que sou responsável pelo equipamento recebido e aceito as seguintes condições:</p>
        
        <p><strong>A –</strong> Em caso de ser o equipamento extraviado, danificado ou inutilizado por emprego inadequado, mau uso ou negligência, deverei ressarcir à WGO, o valor de {{ VALOR_EQUIPAMENTO }};</p>
        
        <p><strong>B –</strong> Em caso de dano, inutilização ou extravio do equipamento, deverei comunicar à Empresa imediata e expressamente a ocorrência;</p>
        
        <p><strong>C –</strong> Todos os equipamentos poderão ser objeto de inspeções a qualquer momento, por parte da Empresa;</p>
        
        <p><strong>D –</strong> O conteúdo dos equipamentos (notebooks, HDs, etc...) não devem ser divulgados ou compartilhados sem autorização expressa da Empresa;</p>
        
        <p><strong>E –</strong> Em caso de rescisão contratual por qualquer motivo, devolverei os equipamentos em perfeitas condições, até a data do acerto rescisório, sob pena de arcar com pagamento do valor acima;</p>
    </div>
    
    <div class="signature">
        <p>Data: ___/___/______</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ NOME_USUARIO }}</p>
        <p>CPF: {{ CPF_USUARIO }}</p>
    </div>
</body>
</html>""",
            "tipo": "html",
            "descricao": "Template HTML do termo de responsabilidade"
        },
        {
            "chave": "valor_ressarcimento_equipamento",
            "valor": "R$ 4.500,00",
            "tipo": "texto",
            "descricao": "Valor padrão para ressarcimento de equipamentos extraviados ou danificados"
        },
        {
            "chave": "email_alocacao_assunto",
            "valor": "Ativo Alocado - {{ ATIVO_DESCRICAO }}",
            "tipo": "email",
            "descricao": "Assunto do email de alocação de ativo"
        },
        {
            "chave": "email_alocacao_corpo",
            "valor": """Olá {{ NOME_COLABORADOR }},

Um ativo foi alocado para você:

Ativo: {{ ATIVO_DESCRICAO }}
Data de Alocação: {{ DATA_ALOCACAO }}

Em anexo você encontrará o termo de responsabilidade que deve ser assinado e devolvido ao setor responsável.

Atenciosamente,
Sistema de Controle de Ativos""",
            "tipo": "email",
            "descricao": "Corpo do email de alocação de ativo"
        },
        {
            "chave": "email_devolucao_assunto",
            "valor": "Ativo Devolvido - {{ ATIVO_DESCRICAO }}",
            "tipo": "email",
            "descricao": "Assunto do email de devolução de ativo"
        },
        {
            "chave": "email_devolucao_corpo",
            "valor": """Olá {{ NOME_COLABORADOR }},

O ativo que estava sob sua responsabilidade foi devolvido:

Ativo: {{ ATIVO_DESCRICAO }}
Data de Devolução: {{ DATA_DEVOLUCAO }}

Este ativo não está mais sob sua responsabilidade.

Atenciosamente,
Sistema de Controle de Ativos""",
            "tipo": "email",
            "descricao": "Corpo do email de devolução de ativo"
        },
        {
            "chave": "termo_smartphone_template",
            "valor": """<!DOCTYPE html>
<html>
<head>
    <title>Termo de Responsabilidade - Smartphone</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TERMO DE RESPONSABILIDADE - SMARTPHONE</h2>
    </div>
    
    <div class="content">
        <p>Eu, <strong>{{ NOME_USUARIO }}</strong>, portador(a) do CPF <strong>{{ CPF_USUARIO }}</strong>, matrícula <strong>{{ MATRICULA_USUARIO }}</strong>, declaro ter recebido o seguinte equipamento:</p>
        
        <p><strong>Equipamento:</strong> {{ DETALHES_EQUIPAMENTO }}</p>
        <p><strong>Valor:</strong> {{ VALOR_EQUIPAMENTO }}</p>
        
        <p>Comprometo-me a:</p>
        <ul>
            <li>Utilizar o smartphone apenas para fins profissionais e pessoais autorizados</li>
            <li>Zelar pela integridade física do aparelho</li>
            <li>Manter o aparelho sempre com película protetora e case/capa</li>
            <li>Não instalar aplicativos não autorizados pela empresa</li>
            <li>Comunicar imediatamente qualquer dano, perda ou roubo</li>
            <li>Devolver o equipamento quando solicitado</li>
        </ul>
        
        <p>Declaro estar ciente de que sou responsável pelo smartphone recebido e aceito as seguintes condições:</p>
        
        <p><strong>A –</strong> Em caso de ser o smartphone extraviado, danificado ou inutilizado por emprego inadequado, mau uso ou negligência, deverei ressarcir à empresa o valor de {{ VALOR_EQUIPAMENTO }};</p>
        
        <p><strong>B –</strong> Em caso de dano, inutilização ou extravio do smartphone, deverei comunicar à Empresa imediata e expressamente a ocorrência;</p>
        
        <p><strong>C –</strong> O smartphone poderá ser objeto de inspeções a qualquer momento, por parte da Empresa;</p>
        
        <p><strong>D –</strong> O conteúdo do smartphone não deve ser divulgado ou compartilhado sem autorização expressa da Empresa;</p>
        
        <p><strong>E –</strong> Em caso de rescisão contratual por qualquer motivo, devolverei o smartphone em perfeitas condições, até a data do acerto rescisório, sob pena de arcar com pagamento do valor acima;</p>
    </div>
    
    <div class="signature">
        <p>Data: ___/___/______</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ NOME_USUARIO }}</p>
        <p>CPF: {{ CPF_USUARIO }}</p>
    </div>
</body>
</html>""",
            "tipo": "html",
            "descricao": "Template HTML do termo de responsabilidade para smartphones"
        },
        {
            "chave": "termo_notebook_template", 
            "valor": """<!DOCTYPE html>
<html>
<head>
    <title>Termo de Responsabilidade - Notebook/Desktop</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TERMO DE RESPONSABILIDADE - COMPUTADOR</h2>
    </div>
    
    <div class="content">
        <p>Eu, <strong>{{ NOME_USUARIO }}</strong>, portador(a) do CPF <strong>{{ CPF_USUARIO }}</strong>, matrícula <strong>{{ MATRICULA_USUARIO }}</strong>, declaro ter recebido o seguinte equipamento:</p>
        
        <p><strong>Equipamento:</strong> {{ DETALHES_EQUIPAMENTO }}</p>
        <p><strong>Valor:</strong> {{ VALOR_EQUIPAMENTO }}</p>
        
        <p>Comprometo-me a:</p>
        <ul>
            <li>Utilizar o equipamento exclusivamente para fins profissionais</li>
            <li>Zelar pela integridade física do equipamento e seus acessórios</li>
            <li>Não instalar softwares não autorizados pela empresa</li>
            <li>Manter as configurações de segurança ativas</li>
            <li>Realizar backup regular dos dados importantes</li>
            <li>Comunicar imediatamente qualquer problema técnico ou dano</li>
            <li>Devolver o equipamento quando solicitado</li>
        </ul>
        
        <p>Declaro estar ciente de que sou responsável pelo equipamento recebido e aceito as seguintes condições:</p>
        
        <p><strong>A –</strong> Em caso de ser o equipamento extraviado, danificado ou inutilizado por emprego inadequado, mau uso ou negligência, deverei ressarcir à empresa o valor de {{ VALOR_EQUIPAMENTO }};</p>
        
        <p><strong>B –</strong> Em caso de dano, inutilização ou extravio do equipamento, deverei comunicar à Empresa imediata e expressamente a ocorrência;</p>
        
        <p><strong>C –</strong> O equipamento poderá ser objeto de inspeções a qualquer momento, por parte da Empresa;</p>
        
        <p><strong>D –</strong> O conteúdo do equipamento (arquivos, HDs, etc.) não deve ser divulgado ou compartilhado sem autorização expressa da Empresa;</p>
        
        <p><strong>E –</strong> Em caso de rescisão contratual por qualquer motivo, devolverei o equipamento em perfeitas condições, até a data do acerto rescisório, sob pena de arcar com pagamento do valor acima;</p>
    </div>
    
    <div class="signature">
        <p>Data: ___/___/______</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ NOME_USUARIO }}</p>
        <p>CPF: {{ CPF_USUARIO }}</p>
    </div>
</body>
</html>""",
            "tipo": "html",
            "descricao": "Template HTML do termo de responsabilidade para notebooks/desktops"
        },
        {
            "chave": "termo_chip_sim_template",
            "valor": """<!DOCTYPE html>
<html>
<head>
    <title>Termo de Responsabilidade - Chip SIM</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 50px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h2>TERMO DE RESPONSABILIDADE - CHIP SIM</h2>
    </div>
    
    <div class="content">
        <p>Eu, <strong>{{ NOME_USUARIO }}</strong>, portador(a) do CPF <strong>{{ CPF_USUARIO }}</strong>, matrícula <strong>{{ MATRICULA_USUARIO }}</strong>, declaro ter recebido o seguinte item:</p>
        
        <p><strong>Chip SIM:</strong> {{ DETALHES_EQUIPAMENTO }}</p>
        <p><strong>Valor:</strong> {{ VALOR_EQUIPAMENTO }}</p>
        
        <p>Comprometo-me a:</p>
        <ul>
            <li>Utilizar o chip SIM apenas para fins profissionais</li>
            <li>Zelar pela integridade física do chip</li>
            <li>Não compartilhar ou emprestar o chip para terceiros</li>
            <li>Comunicar imediatamente qualquer perda, roubo ou problema</li>
            <li>Devolver o chip quando solicitado</li>
            <li>Usar o chip apenas em equipamentos autorizados pela empresa</li>
        </ul>
        
        <p>Declaro estar ciente de que sou responsável pelo chip SIM recebido e aceito as seguintes condições:</p>
        
        <p><strong>A –</strong> Em caso de ser o chip extraviado, danificado ou inutilizado por emprego inadequado, mau uso ou negligência, deverei ressarcir à empresa o valor de {{ VALOR_EQUIPAMENTO }};</p>
        
        <p><strong>B –</strong> Em caso de perda, inutilização ou extravio do chip, deverei comunicar à Empresa imediata e expressamente a ocorrência para bloqueio da linha;</p>
        
        <p><strong>C –</strong> O uso do chip poderá ser monitorado a qualquer momento, por parte da Empresa;</p>
        
        <p><strong>D –</strong> Sou responsável por todos os custos de ligações e dados gerados pelo chip;</p>
        
        <p><strong>E –</strong> Em caso de rescisão contratual por qualquer motivo, devolverei o chip em perfeitas condições, até a data do acerto rescisório, sob pena de arcar com pagamento do valor acima;</p>
    </div>
    
    <div class="signature">
        <p>Data: ___/___/______</p>
        <br><br>
        <p>_________________________________</p>
        <p>{{ NOME_USUARIO }}</p>
        <p>CPF: {{ CPF_USUARIO }}</p>
    </div>
</body>
</html>""",
            "tipo": "html",
            "descricao": "Template HTML do termo de responsabilidade para chips SIM"
        }
    ]
    
    for param_config in parametros_padrao:
        param_existente = db.session.query(ParametroSistema).filter_by(chave=param_config["chave"]).first()
        if not param_existente:
            param = ParametroSistema(**param_config)
            db.session.add(param)
            logger.info(f"Parâmetro padrão criado: {param_config['chave']}")
    
    db.session.commit()