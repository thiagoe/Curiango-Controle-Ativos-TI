// Modal de Edição de Ativo
const modalEditarAtivo = document.createElement('div');
modalEditarAtivo.className = 'fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center';
modalEditarAtivo.innerHTML = `
  <div class="bg-white rounded-lg w-full max-w-2xl mx-4">
    <div class="flex justify-between items-center px-6 py-4 border-b">
      <h3 class="text-lg font-semibold">Editar Ativo</h3>
      <button type="button" class="text-gray-400 hover:text-gray-600 btn-fechar">
        <i class="fa fa-times"></i>
      </button>
    </div>
    
    <form id="formEditarAtivo" class="p-6">
      <input type="hidden" name="id" id="editarAtivoId">
      
      <div class="space-y-4">
        <!-- Campos dinâmicos serão inseridos aqui -->
        <div id="camposEditarAtivo" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
        
        <!-- Campo Unidade Organizacional -->
        <div class="col-span-full">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="unidadeNegocioId">
            Unidade Organizacional
          </label>
          <select name="unidade_negocio_id" id="unidadeNegocioId" 
            class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="">Selecione uma unidade...</option>
          </select>
        </div>
        
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button type="button" class="px-4 py-2 border rounded-lg hover:bg-gray-50 btn-fechar">
          Cancelar
        </button>
        <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          Salvar Alterações
        </button>
      </div>
    </form>
  </div>
`;

// Adiciona o modal ao body
document.body.appendChild(modalEditarAtivo);

// Cache de dados
let unidadesCache = null;

// Função para carregar unidades organizacionais
async function carregarUnidades() {
  if (!unidadesCache) {
    try {
      const res = await fetch('/api/parametros/unidades');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      unidadesCache = data;
      
      // Preenche o select de unidades
      const select = document.getElementById('unidadeNegocioId');
      select.innerHTML = `
        <option value="">Selecione uma unidade...</option>
        ${unidadesCache.map(u => `
          <option value="${u.id}">${u.nome}</option>
        `).join('')}
      `;
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
      showToast('error', 'Erro ao carregar unidades organizacionais');
    }
  }
}

// Função para carregar os campos específicos do tipo de ativo
function carregarCamposAtivo(tipo, dados) {
  const container = document.getElementById('camposEditarAtivo');
  container.innerHTML = '';
  
  // Campos comuns para todos os tipos
  const camposComuns = [
    { nome: 'valor', label: 'Valor', tipo: 'number', step: '0.01' },
    { nome: 'condicao', label: 'Condição', tipo: 'select', opcoes: [
      { valor: 'novo', label: 'Novo' },
      { valor: 'usado', label: 'Usado' },
      { valor: 'danificado', label: 'Danificado' },
      { valor: 'em_manutencao', label: 'Em Manutenção' },
      { valor: 'inativo', label: 'Inativo' }
    ]}
  ];
  
  // Campos específicos por tipo
  const camposEspecificos = {
    smartphone: [
      { nome: 'modelo', label: 'Modelo', tipo: 'text', required: true },
      { nome: 'fabricante', label: 'Fabricante', tipo: 'text', readonly: true },
      { nome: 'imei', label: 'IMEI', tipo: 'text' },
      { nome: 'acessorios', label: 'Acessórios', tipo: 'text' }
    ],
    notebook: [
      { nome: 'modelo', label: 'Modelo', tipo: 'text', required: true },
      { nome: 'fabricante', label: 'Fabricante', tipo: 'text', readonly: true },
      { nome: 'patrimonio', label: 'Patrimônio', tipo: 'text' },
      { nome: 'processador', label: 'Processador', tipo: 'text' },
      { nome: 'memoria', label: 'Memória', tipo: 'text' },
      { nome: 'acessorios', label: 'Acessórios', tipo: 'text' }
    ],
    chip_sim: [
      { nome: 'numero', label: 'Número', tipo: 'text', required: true },
      { nome: 'operadora', label: 'Operadora', tipo: 'text', readonly: true },
      { nome: 'tipo_chip', label: 'Tipo', tipo: 'select', opcoes: [
        { valor: 'voz', label: 'Voz/Dados' },
        { valor: 'dados', label: 'Dados' }
      ]}
    ]
  };
  
  const campos = [...(camposEspecificos[tipo] || []), ...camposComuns];
  
  campos.forEach(campo => {
    const div = document.createElement('div');
    div.className = 'col-span-1';
    
    if (campo.tipo === 'select') {
      div.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1" for="${campo.nome}">
          ${campo.label}
        </label>
        <select name="${campo.nome}" id="${campo.nome}" 
          class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
          ${campo.required ? 'required' : ''}>
          ${campo.opcoes.map(opt => `
            <option value="${opt.valor}">${opt.label}</option>
          `).join('')}
        </select>
      `;
    } else {
      div.innerHTML = `
        <label class="block text-sm font-medium text-gray-700 mb-1" for="${campo.nome}">
          ${campo.label}
        </label>
        <input type="${campo.tipo}" name="${campo.nome}" id="${campo.nome}"
          class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary ${campo.readonly ? 'bg-gray-100' : ''}"
          ${campo.step ? `step="${campo.step}"` : ''}
          ${campo.required ? 'required' : ''}
          ${campo.readonly ? 'readonly' : ''}>
      `;
    }
    
    container.appendChild(div);
  });
  
  // Preenche os campos com os dados
  if (dados) {
    Object.entries(dados).forEach(([key, value]) => {
      const input = document.getElementById(key);
      if (input) {
        if (input.type === 'number') {
          input.value = value || '0';
        } else {
          input.value = value || '';
        }
      }
    });
  }
  
  // Adicionar seção de alocação (somente leitura)
  const alocacaoDiv = document.createElement('div');
  alocacaoDiv.className = 'col-span-1';
  alocacaoDiv.innerHTML = `
    <label class="block text-sm font-medium text-gray-700 mb-1">Usuário Atual</label>
    <input type="text" value="${dados?.usuario_atual_nome || 'Não alocado'}" 
      class="w-full border rounded-lg px-3 py-2 bg-gray-100" readonly>
  `;
  container.appendChild(alocacaoDiv);
}

// Função principal para editar ativo
async function editarAtivo(id) {
  try {
    // Carrega dados do ativo
    const res = await fetch(`/api/ativos/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const ativo = await res.json();
    
    // Carrega unidades (se necessário)
    await carregarUnidades();
    
    // Preenche o formulário
    document.getElementById('editarAtivoId').value = ativo.id;
    document.getElementById('unidadeNegocioId').value = ativo.unidade_negocio_id || '';
    
    // Controla visibilidade do campo Unidade de Negócio
    const unidadeField = document.getElementById('unidadeNegocioId').closest('.col-span-full');
    if (ativo.tipo === 'chip_sim') {
      unidadeField.style.display = 'none';  // Oculta para chips SIM
    } else {
      unidadeField.style.display = 'block'; // Mostra para outros tipos
    }
    
    // Carrega campos específicos do tipo
    carregarCamposAtivo(ativo.tipo, ativo);
    
    // Mostra o modal
    modalEditarAtivo.classList.remove('hidden');
    
  } catch (error) {
    console.error('Erro ao carregar ativo:', error);
    showToast('error', 'Erro ao carregar dados do ativo');
  }
}

// Event Listeners
document.querySelectorAll('.btn-fechar').forEach(btn => {
  btn.addEventListener('click', () => {
    modalEditarAtivo.classList.add('hidden');
  });
});

document.getElementById('formEditarAtivo').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const res = await fetch(`/api/ativos/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Atualiza a lista e fecha o modal
    await listarAtivos();
    modalEditarAtivo.classList.add('hidden');
    showToast('success', 'Ativo atualizado com sucesso');
    
  } catch (error) {
    console.error('Erro ao atualizar ativo:', error);
    showToast('error', 'Erro ao atualizar ativo');
  }
});
