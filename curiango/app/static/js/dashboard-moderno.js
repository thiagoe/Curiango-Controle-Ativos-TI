// Estado global do dashboard
let dashboardData = {
  resumo: {},
  graficos: {},
  estatisticas: {}
};

// Cores para gráficos
const cores = {
  smartphones: '#3B82F6',
  notebook: '#10B981', 
  desktop: '#10B981',
  chip_sim: '#F59E0B',
  em_uso: '#22C55E',
  em_estoque: '#F97316',
  novo: '#22C55E',
  usado: '#3B82F6',
  em_manutencao: '#EF4444',
  danificado: '#DC2626',
  inativo: '#64748B'
};

// Função para formatar números
function formatNumber(num) {
  return new Intl.NumberFormat('pt-BR').format(num);
}

// Função para traduzir labels
function traduzirTipo(tipo) {
  const traducoes = {
    'smartphone': 'Smartphones',
    'notebook': 'Notebooks',
    'desktop': 'Desktops', 
    'chip_sim': 'Chips SIM'
  };
  return traducoes[tipo] || tipo;
}

function traduzirStatus(status) {
  const traducoes = {
    'novo': 'Disponível',
    'usado': 'Disponível',
    'em_uso': 'Em Uso',
    'em_estoque': 'Disponível',
    'em_manutencao': 'Em Manutenção',
    'danificado': 'Danificado',
    'inativo': 'Inativo'
  };
  return traducoes[status] || status;
}

// Carregar dados do resumo
async function carregarResumo() {
  try {
    const response = await fetch('/api/dashboard/resumo');
    if (!response.ok) throw new Error('Erro ao carregar resumo');
    
    const data = await response.json();
    dashboardData.resumo = data;
    
    // Atualizar cards principais
    document.getElementById('cardTotal').textContent = formatNumber(data.total || 0);
    document.getElementById('cardEmUso').textContent = formatNumber(data.em_uso || 0);
    document.getElementById('cardEstoque').textContent = formatNumber(data.em_estoque || 0);
    document.getElementById('cardInativos').textContent = formatNumber(data.inativos || 0);
    
    return data;
  } catch (error) {
    console.error('Erro ao carregar resumo:', error);
    return {};
  }
}

// Carregar estatísticas avançadas
async function carregarEstatisticas() {
  try {
    const response = await fetch('/api/dashboard/estatisticas');
    if (!response.ok) throw new Error('Erro ao carregar estatísticas');
    
    const data = await response.json();
    dashboardData.estatisticas = data;
    
    // Nenhum card de estatística adicional necessário
    
    return data;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    return {};
  }
}

// Carregar dados para gráficos
async function carregarGraficos() {
  try {
    const response = await fetch('/api/dashboard/graficos');
    if (!response.ok) throw new Error('Erro ao carregar gráficos');
    
    const data = await response.json();
    dashboardData.graficos = data;
    
    return data;
  } catch (error) {
    console.error('Erro ao carregar gráficos:', error);
    return {};
  }
}

// Renderizar atividades recentes
function renderizarAtividades(atividades) {
  const container = document.getElementById('ultimasAtividades');
  
  if (!atividades || atividades.length === 0) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full text-slate-400">
        <i class="fas fa-inbox mr-2"></i>
        Nenhuma atividade recente
      </div>
    `;
    return;
  }
  
  const html = atividades.map(atividade => {
    const data = new Date(atividade.data_hora);
    const tempo = data.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let icone = 'fa-info-circle';
    let cor = 'text-blue-600';
    
    if (atividade.acao === 'CREATE') {
      icone = 'fa-plus-circle';
      cor = 'text-green-600';
    } else if (atividade.acao === 'UPDATE') {
      icone = 'fa-edit';
      cor = 'text-blue-600';
    } else if (atividade.acao === 'DELETE') {
      icone = 'fa-trash';
      cor = 'text-red-600';
    }
    
    return `
      <div class="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
        <div class="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
          <i class="fas ${icone} ${cor} text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-800 truncate">${atividade.descricao}</p>
          <p class="text-xs text-slate-500 mt-1">
            <i class="fas fa-user mr-1"></i>${atividade.usuario} • 
            <i class="fas fa-clock mr-1"></i>${tempo}
          </p>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}


// Criar gráfico pizza para um tipo específico de ativo
async function criarGraficoPorTipo(tipo, canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  try {
    const response = await fetch(`/api/dashboard/status-por-tipo/${tipo}`);
    if (!response.ok) throw new Error(`Erro ao carregar dados do tipo ${tipo}`);
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      const context = ctx.getContext('2d');
      context.fillStyle = '#94A3B8';
      context.font = '14px Arial';
      context.textAlign = 'center';
      context.fillText('Nenhum dado disponível', ctx.width/2, ctx.height/2);
      return;
    }
    
    const labels = data.map(item => item.status);
    const valores = data.map(item => item.quantidade);
    
    // Cores por status
    const coresPorStatus = {
      'Em Uso': '#22C55E',
      'Disponíveis': '#F97316', 
      'Em Manutenção': '#EF4444',
      'Danificados': '#DC2626',
      'Inativos': '#64748B'
    };
    
    const cores = labels.map(label => coresPorStatus[label] || '#94A3B8');
    
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: cores,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((context.parsed * 100) / total).toFixed(1) : '0';
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error(`Erro ao criar gráfico para ${tipo}:`, error);
  }
}

// Criar todos os gráficos por tipo de ativo
async function criarGraficosPorTipo() {
  // Criar gráficos individuais para cada tipo
  await Promise.all([
    criarGraficoPorTipo('smartphone', 'graficoSmartphones'),
    criarGraficoPorTipo('notebook', 'graficoNotebooks'), 
    criarGraficoPorTipo('desktop', 'graficoDesktops'),
    criarGraficoPorTipo('chip_sim', 'graficoChips')
  ]);
}

// Carregar categorias detalhadas
async function carregarCategoriasDetalhadas() {
  try {
    const response = await fetch('/api/dashboard/categorias-detalhadas');
    if (!response.ok) throw new Error('Erro ao carregar categorias detalhadas');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar categorias detalhadas:', error);
    return {};
  }
}

// Carregar resumo de usuários
async function carregarUsuariosResumo() {
  try {
    const response = await fetch('/api/dashboard/usuarios-resumo');
    if (!response.ok) throw new Error('Erro ao carregar resumo de usuários');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar resumo de usuários:', error);
    return { total: 0, ativos: 0, inativos: 0 };
  }
}

// Criar resumo de usuários
async function criarResumoUsuarios() {
  const container = document.getElementById('resumoUsuarios');
  if (!container) return;
  
  const usuariosData = await carregarUsuariosResumo();
  
  const html = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Total de Usuários -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-slate-800">Total</h3>
            <p class="text-2xl font-bold text-blue-600">${formatNumber(usuariosData.total)}</p>
          </div>
        </div>
      </div>

      <!-- Usuários Ativos -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100">
            <i class="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-slate-800">Ativos</h3>
            <p class="text-2xl font-bold text-green-600">${formatNumber(usuariosData.ativos)}</p>
          </div>
        </div>
      </div>

      <!-- Usuários Inativos -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-red-100">
            <i class="fas fa-user-times text-red-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-slate-800">Inativos</h3>
            <p class="text-2xl font-bold text-red-600">${formatNumber(usuariosData.inativos)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Criar tabela de detalhes por categoria
async function criarTabelaCategorias() {
  const container = document.getElementById('tabelaCategorias');
  if (!container) return;
  
  const categoriasData = await carregarCategoriasDetalhadas();
  
  // Atualizar cards por categoria
  atualizarCardsCategorias(categoriasData);
  
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Categoria</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Total</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Em Uso</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Disponíveis</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Manutenção</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Danificados</th>
            <th class="px-4 py-3 text-center text-sm font-medium text-slate-700">Inativos</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
  `;
  
  // Processar dados por categoria
  Object.keys(categoriasData).forEach(tipo => {
    const dados = categoriasData[tipo];
    
    html += `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3 font-medium text-slate-800">${traduzirTipo(tipo)}</td>
        <td class="px-4 py-3 text-center font-semibold">${formatNumber(dados.total)}</td>
        <td class="px-4 py-3 text-center text-green-600 font-medium">${formatNumber(dados.em_uso)}</td>
        <td class="px-4 py-3 text-center text-orange-600 font-medium">${formatNumber(dados.disponiveis)}</td>
        <td class="px-4 py-3 text-center text-red-600 font-medium">${formatNumber(dados.em_manutencao)}</td>
        <td class="px-4 py-3 text-center text-red-800 font-medium">${formatNumber(dados.danificados)}</td>
        <td class="px-4 py-3 text-center text-slate-600 font-medium">${formatNumber(dados.inativos)}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

// Atualizar cards por categoria
function atualizarCardsCategorias(categoriasData) {
  // Smartphones
  if (categoriasData.smartphone) {
    const smartphonesTotal = document.getElementById('smartphonesTotal');
    const smartphonesEmUso = document.getElementById('smartphonesEmUso');
    const smartphonesDisponiveis = document.getElementById('smartphonesDisponiveis');
    
    if (smartphonesTotal) smartphonesTotal.textContent = formatNumber(categoriasData.smartphone.total);
    if (smartphonesEmUso) smartphonesEmUso.textContent = formatNumber(categoriasData.smartphone.em_uso);
    if (smartphonesDisponiveis) smartphonesDisponiveis.textContent = formatNumber(categoriasData.smartphone.disponiveis);
  }
  
  // Computadores (notebook + desktop)
  const computadores = {
    total: (categoriasData.notebook?.total || 0) + (categoriasData.desktop?.total || 0),
    em_uso: (categoriasData.notebook?.em_uso || 0) + (categoriasData.desktop?.em_uso || 0),
    disponiveis: (categoriasData.notebook?.disponiveis || 0) + (categoriasData.desktop?.disponiveis || 0)
  };
  
  const computadoresTotal = document.getElementById('computadoresTotal');
  const computadoresEmUso = document.getElementById('computadoresEmUso');
  const computadoresDisponiveis = document.getElementById('computadoresDisponiveis');
  
  if (computadoresTotal) computadoresTotal.textContent = formatNumber(computadores.total);
  if (computadoresEmUso) computadoresEmUso.textContent = formatNumber(computadores.em_uso);
  if (computadoresDisponiveis) computadoresDisponiveis.textContent = formatNumber(computadores.disponiveis);
  
  // Chips SIM
  if (categoriasData.chip_sim) {
    const chipsTotal = document.getElementById('chipsTotal');
    const chipsEmUso = document.getElementById('chipsEmUso');
    const chipsDisponiveis = document.getElementById('chipsDisponiveis');
    
    if (chipsTotal) chipsTotal.textContent = formatNumber(categoriasData.chip_sim.total);
    if (chipsEmUso) chipsEmUso.textContent = formatNumber(categoriasData.chip_sim.em_uso);
    if (chipsDisponiveis) chipsDisponiveis.textContent = formatNumber(categoriasData.chip_sim.disponiveis);
  }
}


// Ocultar overlay de loading
function ocultarLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Inicializar dashboard
async function inicializarDashboard() {
  try {
    // Carregar dados em paralelo
    const [resumo, graficos, estatisticas] = await Promise.all([
      carregarResumo(),
      carregarGraficos(),
      carregarEstatisticas()
    ]);
    
    // Criar gráficos por tipo
    criarGraficosPorTipo();
    criarResumoUsuarios();
    criarTabelaCategorias();
    
  } catch (error) {
    console.error('Erro ao inicializar dashboard:', error);
  } finally {
    ocultarLoading();
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', inicializarDashboard);

// Atualizar dados a cada 5 minutos
setInterval(inicializarDashboard, 5 * 60 * 1000);