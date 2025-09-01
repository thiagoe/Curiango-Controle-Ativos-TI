// Gerenciamento de templates do sistema
let parametrosCarregados = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que a página carregou completamente
    setTimeout(() => {
        if (document.getElementById('termo_template')) {
            carregarParametros();
        }
    }, 100);
});

// Função para mostrar/esconder tabs
function mostrarTab(tab) {
    // Esconder todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Remover classe ativa de todos os botões
    document.querySelectorAll('.tab-button').forEach(el => {
        el.classList.remove('active', 'text-primary', 'border-primary');
        el.classList.add('text-gray-500', 'border-transparent');
    });
    
    // Mostrar conteúdo da tab selecionada
    const content = document.getElementById(`content-${tab}`);
    if (content) {
        content.classList.remove('hidden');
    }
    
    // Ativar botão da tab selecionada
    const button = document.getElementById(`tab-${tab}`);
    if (button) {
        button.classList.add('active', 'text-primary', 'border-primary');
        button.classList.remove('text-gray-500', 'border-transparent');
    }
    
    // Carregar parâmetros se for a aba de templates e ainda não foram carregados
    if (tab === 'templates' && !parametrosCarregados) {
        carregarParametros();
    }
}

async function carregarParametros() {
    if (parametrosCarregados) return;
    
    try {
        console.log('Carregando parâmetros do sistema...');
        
        const response = await fetch('/api/parametros/sistema');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const parametros = await response.json();
        console.log('Parâmetros carregados:', parametros);
        
        // Mapear parâmetros por chave
        const paramMap = {};
        parametros.forEach(param => {
            paramMap[param.chave] = param.valor;
        });
        
        // Preencher os campos dos templates específicos
        preencherCampo('termo_smartphone_template', paramMap['termo_smartphone_template']);
        preencherCampo('termo_notebook_template', paramMap['termo_notebook_template']);
        preencherCampo('termo_chip_sim_template', paramMap['termo_chip_sim_template']);
        preencherCampo('email_alocacao_assunto', paramMap['email_alocacao_assunto']);
        preencherCampo('email_alocacao_corpo', paramMap['email_alocacao_corpo']);
        preencherCampo('email_devolucao_assunto', paramMap['email_devolucao_assunto']);
        preencherCampo('email_devolucao_corpo', paramMap['email_devolucao_corpo']);
        
        parametrosCarregados = true;
        console.log('Parâmetros carregados com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar parâmetros:', error);
        mostrarErro('Erro ao carregar parâmetros do sistema');
    }
}

function preencherCampo(id, valor) {
    const campo = document.getElementById(id);
    if (campo && valor) {
        campo.value = valor;
        campo.placeholder = '';
    } else if (campo) {
        campo.placeholder = 'Parâmetro não encontrado';
    }
}

async function salvarParametro(chave) {
    const campo = document.getElementById(chave);
    if (!campo) {
        console.error('Campo não encontrado:', chave);
        return;
    }
    
    const valor = campo.value.trim();
    if (!valor) {
        mostrarErro('O campo não pode estar vazio');
        return;
    }
    
    mostrarCarregamento(true);
    
    // Remover mensagem anterior se existir
    const botaoSalvar = document.querySelector(`button[onclick*="${chave}"]`);
    if (botaoSalvar) {
        const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
        if (msgExistente) {
            msgExistente.remove();
        }
    }
    
    try {
        console.log('Salvando parâmetro:', chave);
        
        const response = await fetch(`/api/parametros/sistema/${chave}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                valor: valor,
                tipo: chave.includes('template') ? 'html' : 'email'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || error.error || `HTTP ${response.status}`);
        }
        
        const resultado = await response.json();
        console.log('Parâmetro salvo:', resultado);
        
        // Feedback específico baseado no tipo de parâmetro
        let mensagem = 'Parâmetro salvo com sucesso!';
        if (chave === 'termo_smartphone_template') {
            mensagem = 'Template do termo para smartphones salvo com sucesso!';
        } else if (chave === 'termo_notebook_template') {
            mensagem = 'Template do termo para notebooks/desktops salvo com sucesso!';
        } else if (chave === 'termo_chip_sim_template') {
            mensagem = 'Template do termo para chips SIM salvo com sucesso!';
        } else if (chave.includes('email')) {
            mensagem = 'Template de email salvo com sucesso!';
        }
        
        // Mostrar mensagem simples ao lado do botão
        const botaoSalvar = document.querySelector(`button[onclick*="${chave}"]`);
        if (botaoSalvar) {
            // Remove mensagem existente se houver
            const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
            if (msgExistente) {
                msgExistente.remove();
            }
            
            // Cria e mostra mensagem
            const msgSalvo = document.createElement('span');
            msgSalvo.className = 'msg-salvo text-green-600 text-sm ml-2';
            msgSalvo.innerHTML = '<i class="fa fa-check mr-1"></i>Salvo!';
            botaoSalvar.parentNode.appendChild(msgSalvo);
            
            // Remove mensagem após 3 segundos
            setTimeout(() => {
                msgSalvo.remove();
            }, 3000);
        }
        
    } catch (error) {
        console.error('Erro ao salvar parâmetro:', error);
        mostrarErro('Erro ao salvar parâmetro: ' + error.message);
    } finally {
        mostrarCarregamento(false);
    }
}

async function salvarEmailAlocacao() {
    const assunto = document.getElementById('email_alocacao_assunto').value.trim();
    const corpo = document.getElementById('email_alocacao_corpo').value.trim();
    
    if (!assunto || !corpo) {
        mostrarErro('Assunto e corpo do email são obrigatórios');
        return;
    }
    
    mostrarCarregamento(true);
    
    // Remover mensagem anterior se existir
    const botaoSalvar = document.querySelector('button[onclick="salvarEmailAlocacao()"]');
    if (botaoSalvar) {
        const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
        if (msgExistente) {
            msgExistente.remove();
        }
    }
    
    try {
        // Salvar assunto
        await fetch('/api/parametros/sistema/email_alocacao_assunto', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: assunto, tipo: 'email' })
        });
        
        // Salvar corpo
        await fetch('/api/parametros/sistema/email_alocacao_corpo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: corpo, tipo: 'email' })
        });
        
        // Mostrar mensagem simples ao lado do botão
        const botaoSalvar = document.querySelector('button[onclick="salvarEmailAlocacao()"]');
        if (botaoSalvar) {
            // Remove mensagem existente se houver
            const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
            if (msgExistente) {
                msgExistente.remove();
            }
            
            // Cria e mostra mensagem
            const msgSalvo = document.createElement('span');
            msgSalvo.className = 'msg-salvo text-green-600 text-sm ml-2';
            msgSalvo.innerHTML = '<i class="fa fa-check mr-1"></i>Salvo!';
            botaoSalvar.parentNode.appendChild(msgSalvo);
            
            // Remove mensagem após 3 segundos
            setTimeout(() => {
                msgSalvo.remove();
            }, 3000);
        }
        
    } catch (error) {
        console.error('Erro ao salvar email de alocação:', error);
        mostrarErro('Erro ao salvar template de email');
    } finally {
        mostrarCarregamento(false);
    }
}

async function salvarEmailDevolucao() {
    const assunto = document.getElementById('email_devolucao_assunto').value.trim();
    const corpo = document.getElementById('email_devolucao_corpo').value.trim();
    
    if (!assunto || !corpo) {
        mostrarErro('Assunto e corpo do email são obrigatórios');
        return;
    }
    
    mostrarCarregamento(true);
    
    // Remover mensagem anterior se existir
    const botaoSalvar = document.querySelector('button[onclick="salvarEmailDevolucao()"]');
    if (botaoSalvar) {
        const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
        if (msgExistente) {
            msgExistente.remove();
        }
    }
    
    try {
        // Salvar assunto
        await fetch('/api/parametros/sistema/email_devolucao_assunto', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: assunto, tipo: 'email' })
        });
        
        // Salvar corpo
        await fetch('/api/parametros/sistema/email_devolucao_corpo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: corpo, tipo: 'email' })
        });
        
        // Mostrar mensagem simples ao lado do botão
        const botaoSalvar = document.querySelector('button[onclick="salvarEmailDevolucao()"]');
        if (botaoSalvar) {
            // Remove mensagem existente se houver
            const msgExistente = botaoSalvar.parentNode.querySelector('.msg-salvo');
            if (msgExistente) {
                msgExistente.remove();
            }
            
            // Cria e mostra mensagem
            const msgSalvo = document.createElement('span');
            msgSalvo.className = 'msg-salvo text-green-600 text-sm ml-2';
            msgSalvo.innerHTML = '<i class="fa fa-check mr-1"></i>Salvo!';
            botaoSalvar.parentNode.appendChild(msgSalvo);
            
            // Remove mensagem após 3 segundos
            setTimeout(() => {
                msgSalvo.remove();
            }, 3000);
        }
        
    } catch (error) {
        console.error('Erro ao salvar email de devolução:', error);
        mostrarErro('Erro ao salvar template de email');
    } finally {
        mostrarCarregamento(false);
    }
}

function mostrarCarregamento(mostrar) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (mostrar) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function mostrarSucesso(mensagem) {
    // Tentar usar a função global de toast se existir
    if (typeof showToast === 'function') {
        showToast('success', mensagem);
    } else {
        alert(mensagem);
    }
}

function mostrarErro(mensagem) {
    // Tentar usar a função global de toast se existir
    if (typeof showToast === 'function') {
        showToast('error', mensagem);
    } else {
        alert('Erro: ' + mensagem);
    }
}