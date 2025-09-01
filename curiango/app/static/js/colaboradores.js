// Elementos DOM
const tblColab = document.getElementById('tblColab');
const fBusca = document.getElementById('fBusca');
const fStatus = document.getElementById('fStatus');
const modalColab = document.getElementById('modalColab');
const formColab = document.getElementById('formColab');
const btnNovoColab = document.getElementById('btnNovoColab');
const btnFiltrosToggle = document.getElementById('btnFiltrosToggle');
const filtros = document.getElementById('filtros');

// Funções principais
// Debounce function para evitar muitas requisições
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Função para carregar setores no dropdown
async function carregarSetores() {
  try {
    const res = await fetch('/api/setores');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const setores = await res.json();
    const selectSetor = formColab.querySelector('select[name="setor_id"]');
    
    // Limpa options existentes exceto o primeiro
    selectSetor.innerHTML = '<option value="">Selecione um setor...</option>';
    
    // Adiciona setores ativos
    setores.forEach(setor => {
      if (setor.ativo) {
        const option = document.createElement('option');
        option.value = setor.id;
        option.textContent = setor.nome;
        selectSetor.appendChild(option);
      }
    });
  } catch (error) {
    console.error('Erro ao carregar setores:', error);
    showToast('error', 'Erro ao carregar setores.');
  }
}

// Função showToast local caso não exista a global
function showToast(type, message) {
  // Tenta usar a função global primeiro, mas evita loop infinito
  if (window.showToast && typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(type, message);
    return;
  }
  
  // Fallback simples
  const alertType = type === 'error' ? 'Erro: ' : type === 'success' ? 'Sucesso: ' : '';
  alert(alertType + message);
}

async function listarColab() {
  try {
    const params = new URLSearchParams();
    const busca = fBusca.value.trim();
    if (busca) {
      // Remove pontuação do CPF para busca
      const cpfLimpo = busca.replace(/\D/g, '');
      if (cpfLimpo.length > 0) {
        params.set('cpf', cpfLimpo);
      }
      params.set('nome', busca);
      params.set('matricula', busca);
    }
    if (fStatus.value) params.set('status', fStatus.value);

    const res = await fetch('/api/colaboradores' + (params.toString() ? `?${params}` : ''));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderColab(data);
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    showToast('error', 'Erro ao carregar dados. Tente novamente.');
  }
}

function renderColab(items) {
  tblColab.innerHTML = '';
  if (!items?.length) {
    tblColab.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-500">
        <i class="fa fa-user-slash fa-2x mb-2"></i>
        <p>Nenhum colaborador encontrado</p>
      </div>`;
    return;
  }
  
  items.forEach(c => {
    // Criar lista de ativos alocados
    let ativosHtml = '';
    if (c.ativos_alocados && c.ativos_alocados.length > 0) {
      ativosHtml = `
        <div class="mt-2 p-2 bg-blue-50 rounded-lg">
          <p class="text-sm font-medium text-blue-800 mb-1">
            <i class="fa fa-laptop mr-1"></i>Ativos Alocados (${c.total_ativos})
          </p>
          <div class="text-xs text-blue-700 space-y-1">
            ${c.ativos_alocados.map(ativo => `
              <div class="flex justify-between items-center">
                <span>${ativo.descricao}</span>
                <span class="px-1 py-0.5 bg-blue-200 rounded text-xs">${ativo.tipo}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      ativosHtml = `
        <div class="mt-2 p-2 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">
            <i class="fa fa-inbox mr-1"></i>Nenhum ativo alocado
          </p>
        </div>
      `;
    }

    const div = document.createElement('div');
    div.className = 'bg-white border rounded-lg p-4 hover:shadow transition-shadow';
    div.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <h3 class="font-medium text-lg">${c.nome}</h3>
          <p class="text-gray-600">${c.email || '-'}</p>
          <p class="text-gray-600 text-sm mt-1">
            <span class="font-medium">Matrícula:</span> ${c.matricula || '-'} | 
            <span class="font-medium">Cargo:</span> ${c.cargo || '-'} |
            <span class="font-medium">CPF:</span> ${c.cpf || '-'}
            ${c.setor ? `<br><span class="font-medium">Setor:</span> ${c.setor.nome}` : ''}
          </p>
        </div>
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${c.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${c.status === 'ativo' ? 'Ativo' : 'Desligado'}
        </span>
      </div>
      ${ativosHtml}
      <div class="flex gap-2 mt-3">
        <button type="button" class="flex-1 text-primary hover:text-primary-dark px-3 py-1 rounded border border-primary hover:bg-primary/5" 
          onclick="editarColab(${c.id})">
          <i class="fa fa-pen mr-1"></i>Editar
        </button>
        <button type="button" class="flex-1 text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-600 hover:bg-red-50" 
          onclick="excluirColab(${c.id})">
          <i class="fa fa-trash mr-1"></i>Excluir
        </button>
      </div>`;
    tblColab.appendChild(div);
  });
}

// Máscara para CPF
function mascaraCPF(cpf) {
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Carrega setores para o dropdown
  carregarSetores();
  
  // Carrega lista inicial
  listarColab();

  // Máscara CPF
  const inputCPF = formColab.querySelector('input[name="cpf"]');
  inputCPF?.addEventListener('input', (e) => {
    e.target.value = mascaraCPF(e.target.value);
  });

  // Eventos do formulário
  formColab.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!formColab.nome.value.trim()) {
      showToast('error', 'Nome é obrigatório');
      formColab.nome.focus();
      return;
    }

    const submitBtn = formColab.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>Salvando...';

    try {
      const formData = new FormData(formColab);
      const data = Object.fromEntries(formData);
      const id = data.id;
      
      // Remove o id se estiver vazio (novo colaborador)
      if (!id || id.trim() === '') {
        delete data.id;
      }
      
      const res = await fetch(`/api/colaboradores${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Erro HTTP ${res.status}`);
      }

      await listarColab();
      modalColab.classList.add('hidden');
      formColab.reset();
      showToast('success', `Colaborador ${id ? 'atualizado' : 'cadastrado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('error', error.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Eventos dos botões
  btnNovoColab.addEventListener('click', () => {
    formColab.reset();
    modalColab.classList.remove('hidden');
  });

  // Botões fechar modal
  modalColab.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modalColab.classList.add('hidden');
      formColab.reset();
    });
  });

  // Toggle Filtros
  btnFiltrosToggle.addEventListener('click', () => {
    filtros.classList.toggle('hidden');
  });

  // Campos de Filtro
  fStatus.addEventListener('change', listarColab);
  
  // Busca em tempo real com debounce de 300ms
  const buscarComDebounce = debounce(() => {
    listarColab();
  }, 300);
  
  fBusca.addEventListener('input', buscarComDebounce);
});

// Funções de manipulação
async function editarColab(id) {
  try {
    const res = await fetch(`/api/colaboradores/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    // Preenche os campos do formulário
    Object.entries(data).forEach(([key, value]) => {
      if (formColab[key]) formColab[key].value = value || '';
    });
    
    // Define o setor selecionado se existir
    if (data.setor_id) {
      const selectSetor = formColab.querySelector('select[name="setor_id"]');
      if (selectSetor) {
        selectSetor.value = data.setor_id;
      }
    }
    
    // Atualiza a seção de ativos alocados
    const ativosDiv = document.getElementById('ativosAlocados');
    if (data.ativos_alocados && data.ativos_alocados.length > 0) {
      ativosDiv.innerHTML = `
        <div class="space-y-2">
          ${data.ativos_alocados.map(ativo => `
            <div class="flex justify-between items-center p-2 bg-blue-50 rounded border">
              <div>
                <span class="font-medium text-blue-900">${ativo.descricao}</span>
                <span class="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">${ativo.tipo}</span>
              </div>
              <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                ${ativo.condicao}
              </span>
            </div>
          `).join('')}
        </div>
        <p class="text-sm text-blue-600 mt-2">
          <i class="fa fa-info-circle mr-1"></i>
          Total: ${data.total_ativos} ativo(s) alocado(s)
        </p>
      `;
    } else {
      ativosDiv.innerHTML = `
        <p class="text-gray-500 text-sm">
          <i class="fa fa-inbox mr-1"></i>Nenhum ativo alocado
        </p>
      `;
    }
    
    modalColab.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showToast('error', 'Erro ao carregar dados. Tente novamente.');
  }
}

async function excluirColab(id) {
  if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;

  try {
    const res = await fetch(`/api/colaboradores/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    await listarColab();
    showToast('success', 'Colaborador excluído com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir:', error);
    showToast('error', 'Erro ao excluir. Tente novamente.');
  }
}
