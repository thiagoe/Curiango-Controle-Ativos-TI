// Sistema de Cadastro de Manutenções
// Controle dedicado para formulário de manutenção

let manutencaoModal = null;

// Função principal para abrir modal de manutenção
async function abrirModalManutencao(ativoId) {
  try {
    // Fechar modal existente se houver
    if (manutencaoModal) {
      manutencaoModal.remove();
      manutencaoModal = null;
    }
    
    // Buscar dados do ativo
    const response = await fetch(`/api/ativos/${ativoId}`);
    if (!response.ok) throw new Error(`Erro ao buscar ativo: ${response.status}`);
    const ativo = await response.json();
    
    // Criar modal
    manutencaoModal = document.createElement('div');
    manutencaoModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    manutencaoModal.id = 'modalManutencao';
    
    const hoje = new Date().toISOString().split('T')[0];
    
    manutencaoModal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Registrar Manutenção</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600" onclick="fecharModalManutencao()">
              <i class="fa fa-times"></i>
            </button>
          </div>
          
          <div class="mb-4">
            <p class="font-medium text-gray-700">Ativo:</p>
            <p class="text-gray-600">${ativo.modelo || ativo.numero || ativo.patrimonio || `ID #${ativo.id}`}</p>
          </div>
          
          <form id="formManutencao">
            <div class="mb-4">
              <label class="block font-medium mb-2 text-gray-700">Tipo de Manutenção:</label>
              <select id="tipoManutencao" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="preventiva">Preventiva</option>
                <option value="corretiva" selected>Corretiva</option>
                <option value="emergencial">Emergencial</option>
              </select>
            </div>
            
            <div class="mb-4">
              <label class="block font-medium mb-2 text-gray-700">Defeito/Motivo:</label>
              <input type="text" id="observacoesManutencao" 
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Descreva o defeito ou motivo da manutenção...">
            </div>
            
            <div class="mb-4">
              <label class="block font-medium mb-2 text-gray-700">Descrição:</label>
              <textarea id="descricaoManutencao" 
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows="3" required 
                placeholder="Descreva detalhadamente a manutenção realizada..."></textarea>
            </div>
            
            <div class="mb-4">
              <label class="block font-medium mb-2 text-gray-700">Data de Início:</label>
              <input type="date" id="dataInicioManutencao" 
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value="${hoje}" required>
            </div>
            
            <div class="mb-6">
              <label class="block font-medium mb-2 text-gray-700">Data de Conclusão:</label>
              <input type="date" id="dataConclusaoManutencao" 
                class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value="${hoje}" required>
            </div>
            
            <div class="flex justify-end gap-3">
              <button type="button" 
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" 
                onclick="fecharModalManutencao()">
                Cancelar
              </button>
              <button type="button" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
                onclick="salvarManutencao(${ativoId})">
                <i class="fa fa-save mr-1"></i>
                Registrar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(manutencaoModal);
    
    // Adicionar listeners para debug em tempo real
    setTimeout(() => {
      const descricaoField = document.getElementById('descricaoManutencao');
      const observacoesField = document.getElementById('observacoesManutencao');
      const tipoField = document.getElementById('tipoManutencao');
      
      if (descricaoField) {
        descricaoField.focus();
        
        // Listeners para debug
        descricaoField.addEventListener('input', function(e) {
          console.log('Descrição alterada para:', e.target.value);
        });
        
        descricaoField.addEventListener('change', function(e) {
          console.log('Descrição change evento:', e.target.value);
        });
        
        descricaoField.addEventListener('blur', function(e) {
          console.log('Descrição blur evento:', e.target.value);
        });
      }
      
      if (observacoesField) {
        observacoesField.addEventListener('input', function(e) {
          console.log('Observações alterada para:', e.target.value);
        });
      }
      
      if (tipoField) {
        tipoField.addEventListener('change', function(e) {
          console.log('Tipo alterado para:', e.target.value);
        });
      }
    }, 100);
    
  } catch (error) {
    console.error('Erro ao abrir modal de manutenção:', error);
    if (typeof mostrarMensagem === 'function') {
      mostrarMensagem('error', 'Erro ao carregar dados do ativo');
    } else {
      alert('Erro ao carregar dados do ativo');
    }
  }
}

// Função para salvar manutenção
async function salvarManutencao(ativoId) {
  try {
    console.log('=== INÍCIO DO PROCESSO DE SALVAMENTO ===');
    
    // Aguardar um momento para garantir que todos os valores foram capturados
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capturar valores diretamente dos elementos DOM
    const tipoElement = document.querySelector('#modalManutencao #tipoManutencao');
    const observacoesElement = document.querySelector('#modalManutencao #observacoesManutencao');
    const descricaoElement = document.querySelector('#modalManutencao #descricaoManutencao');
    const dataInicioElement = document.querySelector('#modalManutencao #dataInicioManutencao');
    const dataConclusaoElement = document.querySelector('#modalManutencao #dataConclusaoManutencao');
    
    console.log('Debug - Elementos encontrados:', {
      tipoElement: !!tipoElement,
      observacoesElement: !!observacoesElement,
      descricaoElement: !!descricaoElement,
      dataInicioElement: !!dataInicioElement,
      dataConclusaoElement: !!dataConclusaoElement
    });
    
    // Verificar se todos os elementos existem
    if (!tipoElement || !descricaoElement || !dataInicioElement || !dataConclusaoElement) {
      throw new Error('Campos obrigatórios não encontrados no formulário');
    }
    
    // Debug: mostrar valores brutos ANTES da captura
    console.log('Debug - Valores brutos dos elementos:', {
      tipoRaw: tipoElement.value,
      observacoesRaw: observacoesElement ? observacoesElement.value : null,
      descricaoRaw: descricaoElement.value,
      dataInicioRaw: dataInicioElement.value,
      dataConclusaoRaw: dataConclusaoElement.value
    });
    
    // Debug: propriedades dos elementos
    console.log('Debug - Propriedades dos elementos:', {
      descricaoInnerText: descricaoElement.innerText,
      descricaoTextContent: descricaoElement.textContent,
      descricaoCurrentValue: descricaoElement.value,
      descricaoDefaultValue: descricaoElement.defaultValue
    });
    
    // Capturar valores de múltiplas formas para garantir
    const tipo = tipoElement.value ? tipoElement.value.trim() : '';
    const observacoes = observacoesElement ? (observacoesElement.value || '').trim() : '';
    const descricao = descricaoElement.value ? descricaoElement.value.trim() : '';
    const dataInicio = dataInicioElement.value || '';
    const dataConclusao = dataConclusaoElement.value || '';
    
    console.log('Valores capturados:', {
      tipo,
      observacoes,
      descricao,
      dataInicio,
      dataConclusao
    });
    
    // Validações
    if (!tipo) {
      throw new Error('Por favor, selecione o tipo de manutenção');
    }
    
    // Se a descrição está vazia, tentar capturar novamente de forma mais agressiva
    if (!descricao) {
      console.log('Descrição vazia, tentando captura alternativa...');
      
      // Tentar diferentes métodos de captura
      const descricaoAlternativa1 = document.querySelector('#descricaoManutencao')?.value;
      const descricaoAlternativa2 = document.querySelector('textarea[id="descricaoManutencao"]')?.value;
      const descricaoAlternativa3 = document.querySelector('#modalManutencao textarea')?.value;
      
      console.log('Tentativas alternativas de captura da descrição:', {
        descricaoAlternativa1,
        descricaoAlternativa2,
        descricaoAlternativa3
      });
      
      const novaDescricao = descricaoAlternativa1 || descricaoAlternativa2 || descricaoAlternativa3 || '';
      
      if (!novaDescricao.trim()) {
        throw new Error('Por favor, preencha a descrição da manutenção');
      }
      
      // Usar a descrição capturada alternativamente
      console.log('Usando descrição alternativa:', novaDescricao);
      // Atualizar a variável local
      const descricaoFinal = novaDescricao.trim();
      
      // Atualizar dados para envio
      const dadosManutencaoAlternativa = {
        tipo: tipo,
        observacoes: observacoes,
        descricao: descricaoFinal,
        data_inicio: dataInicio,
        data_conclusao: dataConclusao
      };
      
      console.log('Dados corrigidos para envio:', dadosManutencaoAlternativa);
      
      // Enviar dados corrigidos
      return await enviarDadosManutencao(ativoId, dadosManutencaoAlternativa);
    }
    
    if (!dataInicio) {
      throw new Error('Por favor, selecione a data de início');
    }
    
    if (!dataConclusao) {
      throw new Error('Por favor, selecione a data de conclusão');
    }
    
    // Preparar dados para envio
    const dadosManutencao = {
      tipo: tipo,
      observacoes: observacoes,
      descricao: descricao,
      data_inicio: dataInicio,
      data_conclusao: dataConclusao
    };
    
    console.log('Dados que serão enviados:', dadosManutencao);
    
    // Enviar dados via função auxiliar
    return await enviarDadosManutencao(ativoId, dadosManutencao);
    
  } catch (error) {
    console.error('Erro ao salvar manutenção:', error);
    
    if (typeof mostrarMensagem === 'function') {
      mostrarMensagem('error', error.message || 'Erro ao registrar manutenção');
    } else {
      alert('Erro: ' + (error.message || 'Erro ao registrar manutenção'));
    }
  }
}

// Função auxiliar para enviar dados da manutenção
async function enviarDadosManutencao(ativoId, dadosManutencao) {
  console.log('Enviando dados para API:', dadosManutencao);
  
  // Enviar para a API
  const response = await fetch(`/api/ativos/${ativoId}/manutencoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dadosManutencao)
  });
  
  console.log('Status da resposta:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro da API:', errorData);
    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
  }
  
  const resultado = await response.json();
  console.log('Manutenção salva com sucesso. ID:', resultado.id);
  
  // Fechar modal
  fecharModalManutencao();
  
  // Atualizar lista se a função estiver disponível
  if (typeof atualizarLista === 'function') {
    await atualizarLista();
  } else if (typeof listarAtivos === 'function') {
    await listarAtivos();
  }
  
  // Mostrar mensagem de sucesso
  if (typeof mostrarMensagem === 'function') {
    mostrarMensagem('success', `Manutenção registrada com sucesso! ID: ${resultado.id}`);
  } else {
    alert(`Manutenção registrada com sucesso! ID: ${resultado.id}`);
  }
  
  console.log('=== PROCESSO ALTERNATIVO CONCLUÍDO ===');
}

// Função para fechar modal
function fecharModalManutencao() {
  if (manutencaoModal) {
    manutencaoModal.remove();
    manutencaoModal = null;
  }
}

// Função global para ser chamada pelos menus de ação
window.registrarManutencao = abrirModalManutencao;
window.abrirModalManutencao = abrirModalManutencao;
window.salvarManutencao = salvarManutencao;
window.fecharModalManutencao = fecharModalManutencao;

console.log('Sistema de manutenção carregado com sucesso');