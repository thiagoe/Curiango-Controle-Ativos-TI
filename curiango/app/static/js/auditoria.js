// Variáveis globais
let paginaAtual = 0;
const limitePorPagina = 50;
let filtrosAtuais = {};

// Elementos DOM
const tblAuditoria = document.getElementById('tblAuditoria');
const btnBuscar = document.getElementById('btnBuscar');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');
const btnExportar = document.getElementById('btnExportar');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');
const modalDetalhes = document.getElementById('modalDetalhes');
const btnFecharModal = document.getElementById('btnFecharModal');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarLogs();
    configurarEventListeners();
    configurarDatasPadrao();
});

function configurarEventListeners() {
    // Botões principais
    btnBuscar.addEventListener('click', aplicarFiltros);
    btnLimparFiltros.addEventListener('click', limparFiltros);
    btnExportar.addEventListener('click', exportarLogs);
    
    // Paginação
    btnAnterior.addEventListener('click', paginaAnterior);
    btnProximo.addEventListener('click', proximaPagina);
    
    // Modal
    btnFecharModal.addEventListener('click', fecharModal);
    modalDetalhes.addEventListener('click', function(e) {
        if (e.target === modalDetalhes) fecharModal();
    });
    
    // Enter para buscar
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    });
}

function configurarDatasPadrao() {
    // Define data fim como hoje
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataFim').value = hoje;
    
    // Define data início como 7 dias atrás
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    document.getElementById('dataInicio').value = seteDiasAtras.toISOString().split('T')[0];
}

async function carregarLogs() {
    try {
        mostrarCarregando();
        
        // Montar parâmetros da URL
        const params = new URLSearchParams({
            limite: limitePorPagina,
            offset: paginaAtual * limitePorPagina,
            ...filtrosAtuais
        });
        
        const response = await fetch(`/api/auditoria?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        exibirLogs(data.logs);
        atualizarEstatisticas(data);
        atualizarPaginacao(data.logs.length);
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        mostrarErro('Erro ao carregar logs de auditoria: ' + error.message);
    }
}

function exibirLogs(logs) {
    if (!logs || logs.length === 0) {
        tblAuditoria.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-slate-500">
                    <i class="fa fa-search text-2xl mb-2 block"></i>
                    Nenhum log encontrado com os filtros aplicados.
                </td>
            </tr>
        `;
        return;
    }
    
    tblAuditoria.innerHTML = logs.map(log => `
        <tr class="border-b hover:bg-slate-50">
            <td class="py-3 px-4">
                <div class="text-sm font-medium">
                    ${formatarDataHora(log.created_at)}
                </div>
            </td>
            <td class="py-3 px-4">
                <div class="text-sm font-medium text-slate-800">
                    ${escapeHtml(log.usuario)}
                </div>
            </td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getClasseAcao(log.acao)}">
                    ${formatarAcao(log.acao)}
                </span>
            </td>
            <td class="py-3 px-4">
                <span class="text-sm text-slate-600">
                    ${log.tabela || '-'}
                </span>
            </td>
            <td class="py-3 px-4">
                <div class="text-sm text-slate-800 max-w-xs truncate" title="${escapeHtml(log.descricao)}">
                    ${escapeHtml(log.descricao)}
                </div>
            </td>
            <td class="py-3 px-4">
                <span class="text-xs text-slate-500 font-mono">
                    ${log.ip_address || '-'}
                </span>
            </td>
            <td class="py-3 px-4">
                <button onclick="verDetalhes(${log.id})" 
                        class="text-primary hover:text-primary-dark text-sm">
                    <i class="fa fa-eye mr-1"></i>Detalhes
                </button>
            </td>
        </tr>
    `).join('');
}

function mostrarCarregando() {
    tblAuditoria.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-8 text-slate-500">
                <i class="fa fa-spinner fa-spin text-2xl mb-2 block"></i>
                Carregando logs de auditoria...
            </td>
        </tr>
    `;
}

function aplicarFiltros() {
    filtrosAtuais = {
        q: document.getElementById('buscaGeral').value.trim(),
        usuario: document.getElementById('filtroUsuario').value.trim(),
        acao: document.getElementById('filtroAcao').value,
        tabela: document.getElementById('filtroTabela').value.trim(),
        data_inicio: document.getElementById('dataInicio').value,
        data_fim: document.getElementById('dataFim').value
    };
    
    // Remove filtros vazios
    Object.keys(filtrosAtuais).forEach(key => {
        if (!filtrosAtuais[key]) {
            delete filtrosAtuais[key];
        }
    });
    
    paginaAtual = 0; // Reset para primeira página
    carregarLogs();
}

function limparFiltros() {
    document.getElementById('buscaGeral').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroAcao').value = '';
    document.getElementById('filtroTabela').value = '';
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    
    filtrosAtuais = {};
    paginaAtual = 0;
    carregarLogs();
}

function paginaAnterior() {
    if (paginaAtual > 0) {
        paginaAtual--;
        carregarLogs();
    }
}

function proximaPagina() {
    paginaAtual++;
    carregarLogs();
}

function atualizarPaginacao(totalLogs) {
    const inicio = paginaAtual * limitePorPagina + 1;
    const fim = inicio + totalLogs - 1;
    
    document.getElementById('paginaInfo').textContent = 
        totalLogs > 0 ? `${inicio}-${fim}` : '0';
    
    btnAnterior.disabled = paginaAtual === 0;
    btnProximo.disabled = totalLogs < limitePorPagina;
}

async function verDetalhes(logId) {
    try {
        const response = await fetch(`/api/auditoria/${logId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Log não encontrado');
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const log = await response.json();
        mostrarDetalhes(log);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mostrarErro('Erro ao carregar detalhes do log: ' + error.message);
    }
}

function mostrarDetalhes(log) {
    const conteudo = document.getElementById('conteudoDetalhes');
    
    conteudo.innerHTML = `
        <div class="space-y-6">
            <!-- Cabeçalho com informações principais -->
            <div class="bg-slate-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-lg font-semibold text-slate-800">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${getClasseAcao(log.acao)} mr-2">
                            ${formatarAcao(log.acao)}
                        </span>
                        Log #${log.id}
                    </h4>
                    <span class="px-2 py-1 rounded text-xs font-medium ${getClasseNivel(log.nivel)}">
                        ${log.nivel}
                    </span>
                </div>
                <p class="text-sm text-slate-600 mb-2">
                    <i class="fa fa-clock mr-1"></i>
                    ${formatarDataHoraCompleta(log.created_at)}
                </p>
                <p class="text-sm text-slate-600">
                    <i class="fa fa-user mr-1"></i>
                    Executado por: <strong>${escapeHtml(log.usuario)}</strong>
                    ${log.ip_address ? ` - IP: <code class="bg-white px-1 rounded">${log.ip_address}</code>` : ''}
                </p>
            </div>

            <!-- Descrição da operação -->
            <div>
                <h4 class="text-lg font-semibold mb-3 flex items-center">
                    <i class="fa fa-info-circle text-blue-500 mr-2"></i>
                    Descrição da Operação
                </h4>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p class="text-sm text-slate-800">${escapeHtml(log.descricao)}</p>
                    ${log.tabela ? `
                        <div class="mt-2 text-xs text-slate-600">
                            <strong>Tabela afetada:</strong> ${log.tabela}
                            ${log.registro_id ? ` | <strong>ID do registro:</strong> ${log.registro_id}` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Alterações de dados (se houver) -->
            ${(log.dados_antigos || log.dados_novos) ? `
                <div class="grid grid-cols-1 ${log.dados_antigos && log.dados_novos ? 'md:grid-cols-2' : ''} gap-4">
                    ${log.dados_antigos ? `
                        <div>
                            <h4 class="text-lg font-semibold mb-3 flex items-center text-red-700">
                                <i class="fa fa-arrow-left text-red-500 mr-2"></i>
                                Valores Anteriores
                            </h4>
                            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                ${formatarDadosJson(log.dados_antigos, 'red')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${log.dados_novos ? `
                        <div>
                            <h4 class="text-lg font-semibold mb-3 flex items-center text-green-700">
                                <i class="fa fa-arrow-right text-green-500 mr-2"></i>
                                Valores Novos
                            </h4>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                ${formatarDadosJson(log.dados_novos, 'green')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="bg-slate-50 border rounded-lg p-4 text-center">
                    <i class="fa fa-info-circle text-slate-400 text-2xl mb-2"></i>
                    <p class="text-slate-600">Nenhuma alteração de dados registrada para esta operação.</p>
                </div>
            `}

            <!-- Informações técnicas -->
            <div class="border-t pt-4">
                <details class="cursor-pointer">
                    <summary class="text-sm font-medium text-slate-600 hover:text-slate-800">
                        <i class="fa fa-cog mr-1"></i>
                        Informações Técnicas
                    </summary>
                    <div class="mt-3 bg-slate-50 rounded p-3 text-xs space-y-1">
                        <div><strong>ID do Log:</strong> ${log.id}</div>
                        <div><strong>Tabela:</strong> ${log.tabela || 'N/A'}</div>
                        <div><strong>Registro ID:</strong> ${log.registro_id || 'N/A'}</div>
                        <div><strong>Timestamp:</strong> ${log.created_at}</div>
                        <div><strong>IP Address:</strong> ${log.ip_address || 'N/A'}</div>
                        <div><strong>Nível:</strong> ${log.nivel}</div>
                    </div>
                </details>
            </div>
        </div>
    `;
    
    modalDetalhes.classList.remove('hidden');
}

function formatarDadosJson(dados, cor) {
    if (!dados || typeof dados !== 'object') {
        return `<p class="text-slate-600">Dados não disponíveis</p>`;
    }
    
    let html = '<div class="space-y-2">';
    Object.entries(dados).forEach(([chave, valor]) => {
        let valorFormatado = valor;
        if (valor === null) {
            valorFormatado = '<em class="text-slate-500">null</em>';
        } else if (typeof valor === 'boolean') {
            valorFormatado = valor ? '<strong class="text-green-600">true</strong>' : '<strong class="text-red-600">false</strong>';
        } else if (typeof valor === 'object') {
            valorFormatado = `<code class="bg-white px-1 rounded text-xs">${JSON.stringify(valor)}</code>`;
        } else {
            valorFormatado = `<span class="font-mono">${escapeHtml(String(valor))}</span>`;
        }
        
        html += `
            <div class="flex justify-between items-start py-1 border-b border-${cor}-200 last:border-b-0">
                <span class="font-medium text-${cor}-800 text-sm">${escapeHtml(chave)}:</span>
                <span class="text-${cor}-700 text-sm ml-2">${valorFormatado}</span>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

function fecharModal() {
    modalDetalhes.classList.add('hidden');
}

async function exportarLogs() {
    try {
        const params = new URLSearchParams({
            limite: 10000, // Limite maior para exportação
            ...filtrosAtuais
        });
        
        const response = await fetch(`/api/auditoria?${params}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Converter para CSV
        const csv = converterParaCSV(data.logs);
        downloadCSV(csv, 'auditoria_logs.csv');
        
        mostrarSucesso('Logs exportados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar logs:', error);
        mostrarErro('Erro ao exportar logs');
    }
}

function converterParaCSV(logs) {
    const headers = ['ID', 'Data/Hora', 'Usuário', 'Ação', 'Tabela', 'Registro ID', 'Descrição', 'IP', 'Nível'];
    const rows = logs.map(log => [
        log.id,
        formatarDataHoraCompleta(log.created_at),
        log.usuario,
        log.acao,
        log.tabela || '',
        log.registro_id || '',
        log.descricao.replace(/"/g, '""'), // Escape aspas duplas
        log.ip_address || '',
        log.nivel
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function atualizarEstatisticas(data) {
    document.getElementById('statTotal').textContent = data.total || 0;
    
    // Estatísticas básicas (você pode expandir conforme necessário)
    const logs = data.logs || [];
    
    // Último login
    const ultimoLogin = logs.find(log => log.acao === 'LOGIN');
    document.getElementById('statUltimoLogin').textContent = 
        ultimoLogin ? formatarDataHora(ultimoLogin.created_at) : '-';
    
    // Operações hoje
    const hoje = new Date().toISOString().split('T')[0];
    const operacoesHoje = logs.filter(log => 
        log.created_at && log.created_at.startsWith(hoje)
    ).length;
    document.getElementById('statHoje').textContent = operacoesHoje;
    
    // Usuários únicos
    const usuariosUnicos = new Set(logs.map(log => log.usuario)).size;
    document.getElementById('statUsuarios').textContent = usuariosUnicos;
}

// Funções auxiliares
function formatarDataHora(isoString) {
    if (!isoString) return '-';
    // Se já contém timezone info, usa diretamente
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) + ' ' + 
           date.toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo'});
}

function formatarDataHoraCompleta(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'}) + ' ' + 
           date.toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo'});
}

function formatarAcao(acao) {
    const acoes = {
        'CREATE': 'Criação',
        'UPDATE': 'Atualização',
        'DELETE': 'Exclusão',
        'TRANSFER': 'Transferência',
        'REMOVE_ALLOCATION': 'Remoção Alocação',
        'LOGIN': 'Login',
        'LOGOUT': 'Logout',
        'READ': 'Leitura'
    };
    return acoes[acao] || acao;
}

function getClasseAcao(acao) {
    const classes = {
        'CREATE': 'bg-green-100 text-green-700',
        'UPDATE': 'bg-blue-100 text-blue-700',
        'DELETE': 'bg-red-100 text-red-700',
        'TRANSFER': 'bg-purple-100 text-purple-700',
        'REMOVE_ALLOCATION': 'bg-orange-100 text-orange-700',
        'LOGIN': 'bg-emerald-100 text-emerald-700',
        'LOGOUT': 'bg-gray-100 text-gray-700',
        'READ': 'bg-slate-100 text-slate-700'
    };
    return classes[acao] || 'bg-gray-100 text-gray-700';
}

function getClasseNivel(nivel) {
    const classes = {
        'INFO': 'bg-blue-100 text-blue-700',
        'WARNING': 'bg-yellow-100 text-yellow-700',
        'ERROR': 'bg-red-100 text-red-700'
    };
    return classes[nivel] || 'bg-gray-100 text-gray-700';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarSucesso(mensagem) {
    if (typeof showToast === 'function') {
        showToast('success', mensagem);
    } else {
        alert(mensagem);
    }
}

function mostrarErro(mensagem) {
    if (typeof showToast === 'function') {
        showToast('error', mensagem);
    } else {
        alert('Erro: ' + mensagem);
    }
}