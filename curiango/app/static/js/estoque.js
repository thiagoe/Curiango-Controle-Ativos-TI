// Estado
let currentTab = 'smartphone';
let query = '';
let statusFiltro = '';
let ativos = []; // Cache dos ativos carregados

// Elementos
const tblAtivos = document.getElementById('tblAtivos');
const toast = document.getElementById('toast');

// Modal Novo Ativo
const modalBackdrop = document.getElementById('modalBackdrop');
const modalNovoAtivo = document.getElementById('modalNovoAtivo');
const formNovoAtivo = document.getElementById('formNovoAtivo');
const dynamicFields = document.getElementById('dynamicFields');
const categoriaAtualEl = document.getElementById('categoriaAtual');
const msgNovoAtivo = document.getElementById('msgNovoAtivo');

// Cache de listas
let fabricantesCache = null;
let operadorasCache = null;

// Configuração de colunas por tipo de ativo
const columnConfig = {
  smartphone: [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'modelo', label: 'Modelo', align: 'left' },
    { key: 'fabricante', label: 'Fabricante', align: 'left' },
    { key: 'imei', label: 'IMEI', align: 'left' },
    { key: 'status', label: 'Status', align: 'left' },
    { key: 'unidade_negocio', label: 'Unidade de Negócio', align: 'left' },
    { key: 'usuario_atual', label: 'Usuário Atual', align: 'left' },
    { key: 'valor', label: 'Valor', align: 'right' },
    { key: 'acoes', label: 'Ações', align: 'center' }
  ],
  chip_sim: [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'numero', label: 'Número', align: 'left' },
    { key: 'operadora_nome', label: 'Operadora', align: 'left' },
    { key: 'tipo', label: 'Tipo', align: 'left' },
    { key: 'status', label: 'Status', align: 'left' },
    { key: 'usuario_atual', label: 'Usuário Atual', align: 'left' },
    { key: 'acoes', label: 'Ações', align: 'center' }
  ],
  notebook: [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'modelo', label: 'Modelo', align: 'left' },
    { key: 'fabricante', label: 'Fabricante', align: 'left' },
    { key: 'patrimonio', label: 'Patrimônio', align: 'left' },
    { key: 'processador', label: 'Processador', align: 'left' },
    { key: 'memoria', label: 'Memória', align: 'left' },
    { key: 'status', label: 'Status', align: 'left' },
    { key: 'unidade_negocio', label: 'Unidade de Negócio', align: 'left' },
    { key: 'usuario_atual', label: 'Usuário Atual', align: 'left' },
    { key: 'valor', label: 'Valor', align: 'right' },
    { key: 'acoes', label: 'Ações', align: 'center' }
  ],
  desktop: [
    { key: 'id', label: 'ID', align: 'center' },
    { key: 'modelo', label: 'Modelo', align: 'left' },
    { key: 'fabricante', label: 'Fabricante', align: 'left' },
    { key: 'patrimonio', label: 'Patrimônio', align: 'left' },
    { key: 'processador', label: 'Processador', align: 'left' },
    { key: 'memoria', label: 'Memória', align: 'left' },
    { key: 'status', label: 'Status', align: 'left' },
    { key: 'unidade_negocio', label: 'Unidade de Negócio', align: 'left' },
    { key: 'usuario_atual', label: 'Usuário Atual', align: 'left' },
    { key: 'valor', label: 'Valor', align: 'right' },
    { key: 'acoes', label: 'Ações', align: 'center' }
  ]
};

// Helpers para normalizar respostas da API
function normalizeArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const key = Object.keys(payload).find(k => Array.isArray(payload[k]));
  return key ? payload[key] : [];
}

function pickId(obj) {
  return obj.id ?? obj.fabricante_id ?? obj.marca_id ?? obj.operadora_id ?? obj.value ?? null;
}

function pickNome(obj) {
  return (
    obj.nome ??
    obj.descricao ??
    obj.nome_fantasia ??
    obj.razao_social ??
    obj.marca ??
    obj.fabricante ??
    obj.operadora ??
    obj.title ??
    obj.label ??
    String(pickId(obj) ?? '')
  );
}

function showModal(el){ modalBackdrop.classList.remove('hidden'); el.classList.remove('hidden'); }
function hideModal(el){ el.classList.add('hidden'); modalBackdrop.classList.add('hidden'); }

// Função para criar cabeçalho dinâmico da tabela
function createTableHeader(tipo) {
  const columns = columnConfig[tipo] || columnConfig.smartphone;
  const headerHtml = columns.map(col => {
    const alignClass = col.align === 'right' ? 'text-right' : 
                      col.align === 'center' ? 'text-center' : 'text-left';
    const paddingClass = col.key === 'acoes' ? 'px-2 py-3' : 'px-4 py-3';
    return `<th class="${alignClass} ${paddingClass}">${col.label}</th>`;
  }).join('');
  
  return `
    <thead class="bg-slate-50">
      <tr class="text-slate-600">
        ${headerHtml}
      </tr>
    </thead>
  `;
}

// Função para extrair dados específicos por tipo
function extractDataByType(ativo, tipo) {
  const baseData = {
    id: ativo.id,
    status: (ativo.condicao || ativo.status || 'novo').toLowerCase(),
    unidade_negocio: ativo.unidade_negocio_nome || ativo.unidade_negocio || 'Não definida',
    usuario_atual: ativo.usuario_atual_nome || ativo.usuario_atual || (ativo.usuario_atual_id ? `#${ativo.usuario_atual_id}` : 'Não alocado'),
    valor: typeof ativo.valor === 'number' ? ativo.valor : parseFloat(ativo.valor || 0)
  };

  switch(tipo) {
    case 'smartphone':
        return {
        ...baseData,
        modelo: ativo.modelo || ativo.smartphone?.modelo || '-',
        fabricante: ativo.fabricante || ativo.marca_nome || ativo.fabricante_nome || ativo.smartphone?.marca?.nome || '-',
        imei: ativo.imei_slot || ativo.imei || ativo.smartphone?.imei_slot || '-'
      };    case 'chip_sim':
      return {
        ...baseData,
        numero: ativo.numero || '-',
        operadora_nome: ativo.operadora_nome || '-',
        tipo: ativo.tipo ? (ativo.tipo === 'dados' ? 'Dados' : 'Voz/Dados') : '-',
        usuario_atual: ativo.usuario_atual_nome || 'Não alocado',
        status: labelStatus(ativo.condicao || 'novo')
      };
    
    case 'notebook':
      return {
        ...baseData,
        modelo: ativo.modelo || ativo.computador?.modelo || '-',
        fabricante: ativo.fabricante || ativo.marca_nome || ativo.fabricante_nome || ativo.computador?.marca?.nome || '-',
        patrimonio: ativo.patrimonio || ativo.computador?.patrimonio || '-',
        processador: ativo.processador || ativo.cpu || ativo.computador?.processador || '-',
        memoria: ativo.memoria || ativo.computador?.memoria || '-',
        so: ativo.so || ativo.sistema_operacional || ativo.computador?.so || '-'
      };
    
    default:
      return baseData;
  }
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('bg-white','text-primary','shadow');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('bg-white','text-primary','shadow');
    btn.setAttribute('aria-selected', 'true');
    currentTab = btn.dataset.tab;
    await listarAtivos();
  });
});

// Filtros
const inputBusca = document.getElementById('busca');
const selectStatus = document.getElementById('statusFiltro');

inputBusca.addEventListener('input', debounce(() => {
  query = inputBusca.value.trim();
  listarAtivos();
}, 300));

selectStatus.addEventListener('change', () => {
  statusFiltro = selectStatus.value;
  listarAtivos();
});

// Botão novo ativo
document.getElementById('btnNovoAtivo')?.addEventListener('click', async () => {
  await ensureListsLoaded();
  abrirModalNovoAtivo();
});


// Carregar listas (marcas e operadoras) de forma robusta e com fallbacks
async function fetchJsonSafe(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function ensureListsLoaded() {
  // Marcas (fabricantes)
  if (!fabricantesCache) {
    let arr = [];
    const tries = [
      '/api/parametros/marcas',
      '/api/marcas',
      '/api/fabricantes'
    ];
    for (const url of tries) {
      const data = await fetchJsonSafe(url);
      if (data) {
        const list = normalizeArray(data);
        if (list.length) {
          arr = list;
          break;
        }
      }
    }
    fabricantesCache = (arr || [])
      .map(x => ({ id: pickId(x), nome: pickNome(x) }))
      .filter(x => x.id != null);
  }

  // Operadoras
  if (!operadorasCache) {
    let arr = [];
    const tries = [
      '/api/parametros/operadoras',
      '/api/operadoras'
    ];
    for (const url of tries) {
      const data = await fetchJsonSafe(url);
      if (data) {
        const list = normalizeArray(data);
        if (list.length) {
          arr = list;
          break;
        }
      }
    }
    operadorasCache = (arr || [])
      .map(x => ({ id: pickId(x), nome: pickNome(x) }))
      .filter(x => x.id != null);
  }

  // Se já estiver com o modal aberto e as listas carregaram agora, refaz os campos
  if (!modalNovoAtivo.classList.contains('hidden')) {
    montarCamposDinamicos(currentTab);
  }
}

// Render atualizado com tabela dinâmica
function renderAtivos(items) {
  const tableElement = tblAtivos.closest('table');
  
  // Atualiza o cabeçalho da tabela
  const existingHeader = tableElement.querySelector('thead');
  if (existingHeader) {
    existingHeader.remove();
  }
  
  const headerHtml = createTableHeader(currentTab);
  tableElement.insertAdjacentHTML('afterbegin', headerHtml);
  
  // Limpa o tbody
  tblAtivos.innerHTML = '';
  
  // Renderiza as linhas
  (items || []).forEach(ativo => {
    const data = extractDataByType(ativo, currentTab);
    const columns = columnConfig[currentTab] || columnConfig.smartphone;
    
    const tr = document.createElement('tr');
    tr.className = 'border-b last:border-0 hover:bg-slate-50';
    
    const cellsHtml = columns.map(col => {
      if (col.key === 'acoes') {
        return `
          <td class="px-2 py-3 text-center relative">
            <button class="btn-actions w-8 h-8 rounded-full inline-flex items-center justify-center hover:bg-slate-100" 
              aria-haspopup="true" aria-expanded="false" data-id="${data.id}" title="Mais ações">
              <i class="fa fa-ellipsis-vertical text-slate-600"></i>
            </button>
            <div class="dropdown hidden w-52 bg-white border rounded-lg shadow-xl" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
              <div class="py-1">
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-gray-700" data-action="editar" data-id="${data.id}">
                  <i class="fa fa-pen mr-2"></i> Editar
                </button>
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-gray-700" data-action="alocar" data-id="${data.id}">
                  <i class="fa fa-user mr-2"></i> Alocar/Devolver
                </button>
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-gray-700" data-action="notas" data-id="${data.id}">
                  <i class="fa fa-sticky-note mr-2"></i> Notas
                </button>
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-gray-700" data-action="manutencao" data-id="${data.id}">
                  <i class="fa fa-wrench mr-2"></i> Manutenção
                </button>
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-gray-700" data-action="historico" data-id="${data.id}">
                  <i class="fa fa-clock-rotate-left mr-2"></i> Histórico
                </button>
                ${ativo.usuario_atual_id ? `
                  <button class="dd-item w-full text-left px-4 py-2 hover:bg-slate-50 text-blue-700" data-action="imprimir-termo" data-id="${data.id}">
                    <i class="fa fa-file-pdf mr-2"></i> Imprimir Termo
                  </button>
                ` : ''}
                <div class="border-t border-gray-100"></div>
                <button class="dd-item w-full text-left px-4 py-2 hover:bg-red-50 text-red-600" data-action="excluir" data-id="${data.id}">
                  <i class="fa fa-trash mr-2"></i> Excluir
                </button>
              </div>
            </div>
          </td>
        `;
      } else if (col.key === 'status') {
        return `
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusPillClass(data.status)}">
              ${labelStatus(data.status)}
            </span>
          </td>
        `;
      } else if (col.key === 'valor') {
        const valor = isFinite(data.valor) ? data.valor.toFixed(2) : '0.00';
        return `<td class="px-4 py-3 text-right font-medium">R$ ${valor}</td>`;
      } else if (col.key === 'id') {
        return `<td class="px-4 py-3 text-center text-sm font-mono text-slate-600">#${data.id}</td>`;
      } else {
        const alignClass = col.align === 'right' ? 'text-right' : 
                          col.align === 'center' ? 'text-center' : 'text-left';
        const value = data[col.key] || '-';
        return `<td class="px-4 py-3 ${alignClass}">${escapeHtml(value)}</td>`;
      }
    }).join('');
    
    tr.innerHTML = cellsHtml;
    tblAtivos.appendChild(tr);
  });

  // Se não há dados, mostra mensagem
  if (!items || items.length === 0) {
    const columns = columnConfig[currentTab] || columnConfig.smartphone;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="${columns.length}" class="px-4 py-8 text-center text-slate-500">
        <i class="fa fa-inbox text-2xl mb-2 block"></i>
        Nenhum ativo encontrado para esta categoria
      </td>
    `;
    tblAtivos.appendChild(tr);
  }
}

// Dropdown de ações agora é gerenciado pelo dropdown-acoes.js

window.handleRowAction = async function handleRowAction(action, id) {
  console.log(`Ação: ${action}, ID: ${id}`); // Debug
  
  if (action === 'editar') {
    // Chama a função do editar_ativo.js para usar o formulário completo
    if (typeof editarAtivo === 'function') {
      editarAtivo(id);
    } else {
      console.error('Função editarAtivo não encontrada');
      showToast('error', 'Função de edição não disponível');
    }
  }
  else if (action === 'excluir') {
    if (!confirm('Confirmar exclusão do ativo? Esta ação não pode ser desfeita.')) return;
    const res = await fetch(`/api/ativos/${id}`, { method: 'DELETE' });
    if (res.ok) { 
      showToast('success', 'Ativo excluído com sucesso!'); 
      await listarAtivos(); // Usar a função padrão da página 
    } else {
      const error = await res.json().catch(() => ({}));
      alert('Falha ao excluir: ' + (error.error || 'Erro desconhecido'));
    }
  }
  else if (action === 'alocar') {
    // Chama a função do acoes_ativos.js
    if (typeof alocarAtivo === 'function') {
      try {
        await alocarAtivo(id);
      } catch (error) {
        console.error('Erro ao executar alocarAtivo:', error);
      }
    } else {
      console.error('Função alocarAtivo não disponível');
      showToast('error', 'Função de alocação não disponível');
    }
  }
  else if (action === 'notas') {
    // Buscar dados do ativo para obter a descrição
    const ativo = ativos.find(a => a.id == id);
    let descricao = `Ativo #${id}`;
    
    if (ativo) {
      // Gerar descrição baseada no tipo de ativo
      if (ativo.tipo === 'smartphone' && ativo.marca_nome && ativo.modelo) {
        descricao = `Smartphone ${ativo.marca_nome} ${ativo.modelo}`;
      } else if (ativo.tipo === 'notebook' && ativo.marca_nome && ativo.modelo) {
        descricao = `Notebook ${ativo.marca_nome} ${ativo.modelo}`;
      } else if (ativo.tipo === 'desktop' && ativo.marca_nome && ativo.modelo) {
        descricao = `Desktop ${ativo.marca_nome} ${ativo.modelo}`;
      } else if (ativo.tipo === 'chip_sim' && ativo.operadora_nome && ativo.numero) {
        descricao = `Chip ${ativo.operadora_nome} - ${ativo.numero}`;
      }
    }
    
    // Chama a função global do notas-ativo.js
    if (typeof abrirModalNotas === 'function') {
      abrirModalNotas(id, descricao);
    } else {
      console.error('Função abrirModalNotas não encontrada');
      showToast('error', 'Sistema de notas não está disponível');
    }
  }
  else if (action === 'manutencao') {
    // Chama a nova função do manutencao.js
    if (typeof window.abrirModalManutencao === 'function') {
      await window.abrirModalManutencao(id);
    } else {
      showToast('error', 'Sistema de manutenção não disponível.');
    }
  }
  else if (action === 'historico') {
    // Chama a função do acoes_ativos.js
    console.log('Tentando abrir histórico para ativo:', id);
    console.log('Função verHistorico disponível:', typeof verHistorico === 'function');
    if (typeof verHistorico === 'function') {
      try {
        await verHistorico(id);
      } catch (error) {
        console.error('Erro ao abrir histórico:', error);
        showToast('error', 'Erro ao abrir histórico: ' + error.message);
      }
    } else {
      console.error('Função verHistorico não encontrada');
      showToast('error', 'Função verHistorico não encontrada');
    }
  }
  else if (action === 'imprimir-termo') {
    // Baixa o PDF do termo de responsabilidade
    try {
      showToast('info', 'Gerando termo de responsabilidade...');
      
      const response = await fetch(`/api/ativos/${id}/termo-pdf`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      // Criar um link temporário para download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo_responsabilidade_ativo_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('success', 'Termo baixado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao baixar termo:', error);
      showToast('error', 'Erro ao baixar termo: ' + error.message);
    }
  }
}

// Carregar dados
async function listarAtivos() {
  try {
    const params = new URLSearchParams();
    if (currentTab) params.set('tipo', currentTab);
    if (query) params.set('q', query);
    if (statusFiltro) params.set('status', statusFiltro);
    
    const url = `/api/ativos?${params.toString()}`;
    console.log('Carregando:', url); // Debug
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Dados recebidos:', data); // Debug
    
    // Atualizar cache global
    ativos = data || [];
    
    renderAtivos(ativos);
  } catch (error) {
    console.error('Erro ao carregar ativos:', error);
    showToast('error', 'Erro ao carregar dados. Verifique a conexão.');
    ativos = []; // Limpar cache em caso de erro
    renderAtivos([]); // Mostra tabela vazia
  }
}

// Helpers UI
function showLocalToast(text) {
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(showLocalToast._t);
  showLocalToast._t = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function debounce(fn, wait) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
}

function labelStatus(s) {
  const map = {
    novo: 'Novo',
    usado: 'Usado',
    em_manutencao: 'Em manutenção',
    danificado: 'Danificado',
    inativo: 'Inativo'
  };
  return map[s] || s;
}

function statusPillClass(s) {
  if (s === 'novo') return 'bg-emerald-100 text-emerald-700';
  if (s === 'usado') return 'bg-blue-100 text-blue-700';
  if (s === 'em_manutencao') return 'bg-amber-100 text-amber-700';
  if (s === 'danificado') return 'bg-red-100 text-red-700';
  if (s === 'inativo') return 'bg-slate-100 text-slate-700';
  return 'bg-slate-100 text-slate-700';
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[s]));
}

// Formulário dinâmico por categoria
function abrirModalNovoAtivo(){
  if (!formNovoAtivo) return;
  formNovoAtivo.reset();
  msgNovoAtivo.textContent = '';
  const categoria = currentTab;
  categoriaAtualEl.textContent = labelCategoria(categoria);
  montarCamposDinamicos(categoria);
  showModal(modalNovoAtivo);
}

function labelCategoria(tab){
  if (tab === 'smartphone') return 'Smartphone';
  if (tab === 'chip_sim') return 'Chip SIM';
  if (tab === 'notebook') return 'Notebook/Desktop';
  return tab;
}

function selectFromList({name, label, items, valueKey='id', textKey='nome', required=false}) {
  const list = Array.isArray(items) ? items : [];
  const options = list.map(i => {
    const val = i[valueKey] ?? pickId(i);
    const txt = i[textKey] ?? pickNome(i);
    return `<option value="${escapeHtml(val)}">${escapeHtml(txt)}</option>`;
  }).join('');
  const emptyOpt = !list.length ? `<option value="" disabled>Nenhum encontrado</option>` : '';
  return `
    <div>
      <label class="block text-sm font-medium">${label}</label>
      <select name="${name}" class="mt-1 w-full border rounded-lg px-3 py-2" ${required?'required':''}>
        <option value="">Selecione...</option>
        ${options || emptyOpt}
      </select>
    </div>`;
}

function montarCamposDinamicos(categoria){
  let camposHtml = '';

  if (categoria === 'smartphone') {
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">Modelo</label>
        <input name="modelo" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
    `;
    camposHtml += selectFromList({ name: 'fabricante_id', label: 'Fabricante', items: fabricantesCache, required: true });
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">IMEI</label>
        <input name="imei" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label class="block text-sm font-medium">Acessórios</label>
        <input name="acessorios" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium">Valor (R$)</label>
        <input name="valor" type="number" step="0.01" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>
    `;
  } else if (categoria === 'chip_sim') {
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">Número</label>
        <input name="numero" type="tel" class="mt-1 w-full border rounded-lg px-3 py-2" 
               placeholder="(11) 99999-9999" 
               pattern="\\([0-9]{2}\\)\\s[0-9]{4,5}-[0-9]{4}"
               title="Digite no formato: (11) 99999-9999" 
               required />
        <small class="text-gray-500 text-xs">Formato: (DDD) 99999-9999</small>
      </div>
    `;
    camposHtml += selectFromList({ name: 'operadora_id', label: 'Operadora', items: operadorasCache, required: true });
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">Tipo</label>
        <select name="tipo" class="mt-1 w-full border rounded-lg px-3 py-2" required>
          <option value="voz" selected>Voz/Dados</option>
          <option value="dados">Dados</option>
        </select>
      </div>
    `;
  } else if (categoria === 'notebook') {
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">Modelo</label>
        <input name="modelo" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
    `;
    camposHtml += selectFromList({ name: 'fabricante_id', label: 'Fabricante', items: fabricantesCache, required: true });
    camposHtml += `
      <div>
        <label class="block text-sm font-medium">Patrimônio</label>
        <input name="patrimonio" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label class="block text-sm font-medium">CPU</label>
        <input name="cpu" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label class="block text-sm font-medium">Memória</label>
        <input name="memoria" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label class="block text-sm font-medium">Disco</label>
        <input name="disco" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label class="block text-sm font-medium">Acessórios</label>
        <input name="acessorios" type="text" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium">Valor (R$)</label>
        <input name="valor" type="number" step="0.01" class="mt-1 w-full border rounded-lg px-3 py-2" />
      </div>`
  }

  dynamicFields.innerHTML = camposHtml;

  // Se alguma lista veio vazia, deixa uma dica visual
  if ((currentTab === 'smartphone' || currentTab === 'notebook') && (!fabricantesCache || !fabricantesCache.length)) {
    msgNovoAtivo.textContent = 'Nenhuma marca encontrada. Cadastre marcas em Parametrização.';
    msgNovoAtivo.className = 'text-sm text-amber-600';
  } else if (currentTab === 'chip_sim' && (!operadorasCache || !operadorasCache.length)) {
    msgNovoAtivo.textContent = 'Nenhuma operadora encontrada. Cadastre operadoras em Parametrização.';
    msgNovoAtivo.className = 'text-sm text-amber-600';
  } else {
    msgNovoAtivo.textContent = '';
    msgNovoAtivo.className = 'text-sm';
  }
}

// Fechar modal
[...document.querySelectorAll('.btn-close-novo')].forEach(b =>
  b.addEventListener('click', () => hideModal(modalNovoAtivo))
);
modalBackdrop?.addEventListener('click', () => hideModal(modalNovoAtivo));

// Submit do novo ativo
formNovoAtivo?.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgNovoAtivo.textContent = 'Salvando...'; msgNovoAtivo.className = 'text-sm text-blue-600';

  const fd = new FormData(formNovoAtivo);
  const payload = Object.fromEntries(fd.entries());

  payload.tipo = currentTab;
  if (payload.valor) payload.valor = parseFloat(payload.valor);
  if (!payload.condicao) payload.condicao = 'novo';

  // Remove valores vazios
  if (payload.fabricante_id === '') delete payload.fabricante_id;
  if (payload.operadora_id === '') delete payload.operadora_id;

  try {
    const res = await fetch('/api/ativos', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (res.ok) {
      msgNovoAtivo.textContent = 'Ativo criado com sucesso!'; 
      msgNovoAtivo.className = 'text-sm text-green-600';
      setTimeout(() => { 
        hideModal(modalNovoAtivo); 
        listarAtivos(); 
        showToast('success', 'Ativo adicionado com sucesso!');
      }, 1000);
    } else {
      const errorMessage = data.detail || data.error || 'Falha ao criar ativo.';
      msgNovoAtivo.textContent = errorMessage; 
      msgNovoAtivo.className = 'text-sm text-red-600';
    }
  } catch (error) {
    msgNovoAtivo.textContent = 'Erro de conexão. Tente novamente.'; 
    msgNovoAtivo.className = 'text-sm text-red-600';
  }
});

// Função para aplicar máscara de telefone
function applyPhoneMask(input) {
  input.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // Formato: (11) 99999-9999 ou (11) 9999-9999
      value = value.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    }
    
    this.value = value;
  });
  
  input.addEventListener('blur', function() {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (this.value && !phoneRegex.test(this.value)) {
      this.setCustomValidity('Formato inválido. Use: (11) 99999-9999');
    } else {
      this.setCustomValidity('');
    }
  });
}

// Observer para aplicar máscara quando novos campos são criados
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) { // Element node
        const phoneInputs = node.querySelectorAll('input[name="numero"]');
        phoneInputs.forEach(applyPhoneMask);
      }
    });
  });
});

// Inicialização

document.addEventListener('DOMContentLoaded', () => {
  const firstTab = document.querySelector('.tab-btn[data-tab="smartphone"]');
  if (firstTab) {
    firstTab.classList.add('bg-white','text-primary','shadow');
    firstTab.setAttribute('aria-selected', 'true');
  }
  
  // Iniciar o observer para monitorar novos elementos
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  listarAtivos().catch(console.error);
});