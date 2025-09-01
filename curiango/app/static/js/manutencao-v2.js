// Sistema de Manutenção - Versão 2 (Abordagem Alternativa)
// Modal simplificado com captura de eventos no momento do clique

let dadosFormularioManutencao = {
  tipo: 'corretiva',
  observacoes: '',
  descricao: ''
};

// Função principal para abrir modal
async function abrirModalManutencaoV2(ativoId) {
  try {
    // Buscar dados do ativo
    const response = await fetch(`/api/ativos/${ativoId}`);
    if (!response.ok) throw new Error(`Erro ao buscar ativo: ${response.status}`);
    const ativo = await response.json();
    
    // Resetar dados do formulário
    dadosFormularioManutencao = {
      tipo: 'corretiva',
      observacoes: '',
      descricao: ''
    };
    
    // Remover modal anterior se existir
    const modalExistente = document.getElementById('modalManutencaoV2');
    if (modalExistente) {
      modalExistente.remove();
    }
    
    // Criar modal HTML diretamente no body
    const modalHTML = `
      <div id="modalManutencaoV2" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           style="display: flex;" onclick="handleModalBackdropClick(event)">
        <div class="bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl" onclick="event.stopPropagation()">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-semibold text-gray-800">Registrar Manutenção</h3>
              <button type="button" class="text-gray-400 hover:text-gray-600" 
                      onclick="fecharModalManutencaoV2()">
                <i class="fa fa-times"></i>
              </button>
            </div>
            
            <div class="mb-4">
              <p class="font-medium text-gray-700">Ativo:</p>
              <p class="text-gray-600">${ativo.modelo || ativo.numero || ativo.patrimonio || `ID #${ativo.id}`}</p>
            </div>
            
            <div class="space-y-4">
              <!-- Tipo -->
              <div>
                <label class="block font-medium mb-2 text-gray-700">Tipo de Manutenção:</label>
                <select class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        onchange="atualizarCampo('tipo', this.value)">
                  <option value="preventiva">Preventiva</option>
                  <option value="corretiva" selected>Corretiva</option>
                  <option value="upgrade">Upgrade</option>
                </select>
              </div>
              
              <!-- Descrição -->
              <div>
                <label class="block font-medium mb-2 text-gray-700">Descrição: <span class="text-red-500">*</span></label>
                <textarea class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          rows="3" 
                          placeholder="Descreva detalhadamente a manutenção realizada..."
                          oninput="atualizarCampo('descricao', this.value)"
                          onchange="atualizarCampo('descricao', this.value)"></textarea>
              </div>
              
              <!-- Observações -->
              <div>
                <label class="block font-medium mb-2 text-gray-700">Observações:</label>
                <textarea class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          rows="2" 
                          placeholder="Observações adicionais (opcional)..."
                          oninput="atualizarCampo('observacoes', this.value)"
                          onchange="atualizarCampo('observacoes', this.value)"></textarea>
              </div>
            </div>
            
            
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" 
                      class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" 
                      onclick="fecharModalManutencaoV2()">
                Cancelar
              </button>
              <button type="button" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
                      onclick="salvarManutencaoV2(${ativoId})">
                <i class="fa fa-save mr-1"></i>
                Registrar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Inserir modal no body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Foco no campo de descrição
    setTimeout(() => {
      const textarea = document.querySelector('#modalManutencaoV2 textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
    
  } catch (error) {
    if (typeof mostrarMensagem === 'function') {
      mostrarMensagem('error', 'Erro ao carregar dados do ativo');
    } else {
      alert('Erro ao carregar dados do ativo');
    }
  }
}

// Função para atualizar campos em tempo real
function atualizarCampo(campo, valor) {
  dadosFormularioManutencao[campo] = valor;
}

// Função para salvar manutenção
async function salvarManutencaoV2(ativoId) {
  try {
    // Validações
    if (!dadosFormularioManutencao.tipo || dadosFormularioManutencao.tipo.trim() === '') {
      throw new Error('Por favor, selecione o tipo de manutenção');
    }
    
    if (!dadosFormularioManutencao.descricao || dadosFormularioManutencao.descricao.trim() === '') {
      throw new Error('Por favor, preencha a descrição da manutenção (campo obrigatório)');
    }
    
    // Preparar dados para envio
    const dadosParaEnvio = {
      tipo: dadosFormularioManutencao.tipo.trim(),
      descricao: dadosFormularioManutencao.descricao.trim(),
      observacoes: dadosFormularioManutencao.observacoes.trim()
    };
    
    // Enviar para API
    const response = await fetch(`/api/ativos/${ativoId}/manutencoes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosParaEnvio)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro HTTP ${response.status}`);
    }
    
    const resultado = await response.json();
    
    // Fechar modal
    fecharModalManutencaoV2();
    
    // Atualizar lista
    if (typeof atualizarLista === 'function') {
      await atualizarLista();
    } else if (typeof listarAtivos === 'function') {
      await listarAtivos();
    }
    
    // Mostrar sucesso
    if (typeof mostrarMensagem === 'function') {
      mostrarMensagem('success', `Manutenção registrada com sucesso! ID: ${resultado.id}`);
    } else {
      alert(`Manutenção registrada com sucesso! ID: ${resultado.id}`);
    }
    
  } catch (error) {
    if (typeof mostrarMensagem === 'function') {
      mostrarMensagem('error', error.message || 'Erro ao registrar manutenção');
    } else {
      alert('Erro: ' + (error.message || 'Erro ao registrar manutenção'));
    }
  }
}

// Função para lidar com clique no backdrop
function handleModalBackdropClick(event) {
  // Só fecha se clicou diretamente no backdrop (não em elementos filhos)
  if (event.target === event.currentTarget) {
    fecharModalManutencaoV2();
  }
}

// Função para fechar modal
function fecharModalManutencaoV2() {
  const modal = document.getElementById('modalManutencaoV2');
  if (modal) {
    modal.remove();
  }
  
  // Resetar dados
  dadosFormularioManutencao = {
    tipo: 'corretiva',
    observacoes: '',
    descricao: ''
  };
}

// Registrar funções globais
window.abrirModalManutencaoV2 = abrirModalManutencaoV2;
window.salvarManutencaoV2 = salvarManutencaoV2;
window.fecharModalManutencaoV2 = fecharModalManutencaoV2;
window.handleModalBackdropClick = handleModalBackdropClick;
window.atualizarCampo = atualizarCampo;

// Sobrescrever a função original para usar a nova versão
window.registrarManutencao = abrirModalManutencaoV2;
window.abrirModalManutencao = abrirModalManutencaoV2;