// Funções de ação para o menu de ações

// Flags para evitar execuções múltiplas
let modalAlocacaoAberto = false;
let modalHistoricoAberto = false;

// Função helper para mostrar mensagens
function mostrarMensagem(tipo, mensagem) {
  if (typeof showToast === 'function') {
    showToast(tipo, mensagem);
  } else if (typeof window.showToast === 'function') {
    window.showToast(tipo, mensagem);
  } else {
    const prefixo = tipo === 'error' ? 'Erro: ' : tipo === 'success' ? 'Sucesso: ' : '';
    alert(prefixo + mensagem);
  }
}

// Função helper para atualizar lista
async function atualizarLista() {
  if (typeof listarAtivos === 'function') {
    await listarAtivos();
  } else if (typeof window.listarAtivos === 'function') {
    await window.listarAtivos();
  } else {
    // Recarrega a página como fallback
    window.location.reload();
  }
}

async function editarAtivo(id) {
  try {
    const res = await fetch(`/api/ativos/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const ativo = await res.json();
    
    // Preenche o formulário com os dados do ativo
    Object.entries(ativo).forEach(([key, value]) => {
      const input = formNovoAtivo.elements[key];
      if (input) input.value = value || '';
    });
    
    modalNovoAtivo.classList.remove('hidden');
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    mostrarMensagem('error', 'Erro ao carregar dados do ativo');
  }
}

async function alocarAtivo(id) {
  // Evita execuções múltiplas
  if (modalAlocacaoAberto) {
    return;
  }
  
  modalAlocacaoAberto = true;
  
  // Verifica se já existe um modal aberto
  const existingModal = document.querySelector('.fixed.inset-0');
  if (existingModal) {
    existingModal.remove();
  }
  
  try {
    // Primeiro carrega os dados do ativo
    const res = await fetch(`/api/ativos/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ativo = await res.json();
    
    // Depois busca os colaboradores disponíveis
    const resColab = await fetch('/api/colaboradores?status=ativo');
    if (!resColab.ok) throw new Error(`HTTP ${resColab.status}`);
    const colaboradores = await resColab.json();
    
    // Abre o modal de alocação
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.id = 'modalAlocacao';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-lg w-full mx-4">
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-4">Alocar/Devolver Ativo</h3>
          <div class="mb-4">
            <p class="font-medium">Ativo:</p>
            <p class="text-gray-600">${ativo.modelo || ativo.numero || ativo.patrimonio}</p>
          </div>
          ${ativo.usuario_atual_id ? `
            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
              <p class="font-medium">Alocação Atual:</p>
              <p class="text-blue-600">${ativo.usuario_atual_nome}</p>
              <div class="flex justify-end gap-2 mt-4">
                <button type="button" class="px-4 py-2 border rounded-lg hover:bg-gray-50" onclick="cancelarAlocacao()">
                  Cancelar
                </button>
                <button type="button" class="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg" onclick="devolverAtivo(${id})">
                  <i class="fa fa-undo mr-1"></i> Devolver Ativo
                </button>
              </div>
            </div>
          ` : `
            <div class="mb-4">
              <label class="block font-medium mb-2">Selecionar Colaborador:</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="inputBuscaColaborador" 
                  class="w-full border rounded-lg px-3 py-2 pr-12" 
                  placeholder="Digite nome ou matrícula..." 
                  autocomplete="off"
                />
                <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <div id="listaColaboradores" class="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto hidden">
                  ${colaboradores.map(c => `
                    <div class="colaborador-item px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0" 
                         data-id="${c.id}" 
                         data-nome="${c.nome.toLowerCase()}" 
                         data-matricula="${(c.matricula || '').toLowerCase()}">
                      <div class="font-medium">${c.nome}</div>
                      <div class="text-sm text-gray-600">
                        ${c.matricula ? `Matrícula: ${c.matricula}` : 'Sem matrícula'} 
                        ${c.setor ? `• ${c.setor.nome}` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <input type="hidden" id="colaboradorSelecionado" />
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <button type="button" class="px-4 py-2 border rounded-lg hover:bg-gray-50" onclick="cancelarAlocacao()">
                Cancelar
              </button>
              <button type="button" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark" 
                onclick="confirmarAlocacao(${id})">
                Confirmar
              </button>
            </div>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Configurar funcionalidade de busca após criar o modal
    if (!ativo.usuario_atual_id) {
      configurarBuscaColaborador();
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados para alocação:', error);
    mostrarMensagem('error', 'Erro ao carregar dados para alocação');
    modalAlocacaoAberto = false;
  }
}

// Função para configurar a funcionalidade de busca de colaboradores
function configurarBuscaColaborador() {
  const inputBusca = document.getElementById('inputBuscaColaborador');
  const lista = document.getElementById('listaColaboradores');
  const hiddenInput = document.getElementById('colaboradorSelecionado');
  
  if (!inputBusca || !lista) return;
  
  let colaboradorAtualSelecionado = null;
  
  // Mostra lista ao focar no campo
  inputBusca.addEventListener('focus', () => {
    lista.classList.remove('hidden');
    filtrarColaboradores(''); // Mostra todos inicialmente
  });
  
  // Filtra conforme digita
  inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    filtrarColaboradores(termo);
    lista.classList.remove('hidden');
    
    // Limpa seleção se o texto não corresponde ao colaborador selecionado
    if (colaboradorAtualSelecionado && !colaboradorAtualSelecionado.nome.toLowerCase().includes(termo)) {
      colaboradorAtualSelecionado = null;
      hiddenInput.value = '';
    }
  });
  
  // Função para filtrar colaboradores
  function filtrarColaboradores(termo) {
    const itens = lista.querySelectorAll('.colaborador-item');
    let visibleCount = 0;
    
    itens.forEach(item => {
      const nome = item.dataset.nome;
      const matricula = item.dataset.matricula;
      const matches = nome.includes(termo) || matricula.includes(termo);
      
      if (matches) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    
    // Mostra mensagem se nenhum resultado
    let msgVazia = lista.querySelector('.no-results');
    if (visibleCount === 0) {
      if (!msgVazia) {
        msgVazia = document.createElement('div');
        msgVazia.className = 'no-results px-3 py-4 text-center text-gray-500';
        msgVazia.innerHTML = '<i class="fas fa-user-slash mr-2"></i>Nenhum colaborador encontrado';
        lista.appendChild(msgVazia);
      }
      msgVazia.style.display = 'block';
    } else if (msgVazia) {
      msgVazia.style.display = 'none';
    }
  }
  
  // Clique em item da lista
  lista.addEventListener('click', (e) => {
    const item = e.target.closest('.colaborador-item');
    if (!item) return;
    
    const id = item.dataset.id;
    const nome = item.querySelector('.font-medium').textContent;
    
    // Seleciona o colaborador
    colaboradorAtualSelecionado = { id, nome };
    hiddenInput.value = id;
    inputBusca.value = nome;
    lista.classList.add('hidden');
  });
  
  // Fecha lista ao clicar fora
  document.addEventListener('click', (e) => {
    if (!inputBusca.contains(e.target) && !lista.contains(e.target)) {
      lista.classList.add('hidden');
    }
  });
  
  // Navegação por teclado
  inputBusca.addEventListener('keydown', (e) => {
    const itensPara = lista.querySelectorAll('.colaborador-item:not([style*="display: none"])');
    const ativo = lista.querySelector('.colaborador-item.bg-blue-100');
    let proximoIndex = 0;
    
    if (ativo) {
      const currentIndex = Array.from(itensPara).indexOf(ativo);
      if (e.key === 'ArrowDown') {
        proximoIndex = Math.min(currentIndex + 1, itensPara.length - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        proximoIndex = Math.max(currentIndex - 1, 0);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        ativo.click();
        e.preventDefault();
        return;
      }
    } else if (e.key === 'ArrowDown' && itensPara.length > 0) {
      proximoIndex = 0;
      e.preventDefault();
    }
    
    // Remove destaque atual
    lista.querySelectorAll('.colaborador-item').forEach(item => {
      item.classList.remove('bg-blue-100');
    });
    
    // Adiciona destaque no próximo item
    if (itensPara[proximoIndex]) {
      itensPara[proximoIndex].classList.add('bg-blue-100');
      itensPara[proximoIndex].scrollIntoView({ block: 'nearest' });
    }
  });
}

async function confirmarAlocacao(ativoId) {
  // Busca o campo hidden que contém o ID do colaborador selecionado
  const colaboradorId = document.getElementById('colaboradorSelecionado')?.value;
  
  if (!colaboradorId) {
    mostrarMensagem('error', 'Selecione um colaborador');
    return;
  }

  try {
    const res = await fetch(`/api/ativos/${ativoId}/alocacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ colaborador_id: colaboradorId })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const result = await res.json();
    
    // Remove o modal
    const modal = document.getElementById('modalAlocacao');
    if (modal) {
      modal.remove();
    }
    
    // Libera a flag
    modalAlocacaoAberto = false;
    
    await atualizarLista();
    mostrarMensagem('success', 'Ativo alocado com sucesso');
    
  } catch (error) {
    console.error('Erro ao alocar ativo:', error);
    mostrarMensagem('error', 'Erro ao alocar ativo: ' + error.message);
    modalAlocacaoAberto = false;
  }
}

function cancelarAlocacao() {
  const modal = document.getElementById('modalAlocacao');
  if (modal) {
    modal.remove();
  }
  modalAlocacaoAberto = false;
}

async function devolverAtivo(ativoId) {
  try {
    const res = await fetch(`/api/ativos/${ativoId}/devolucao`, {
      method: 'POST'
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Remove o modal específico de alocação se existir
    const modalAlocacao = document.getElementById('modalAlocacao');
    if (modalAlocacao) {
      modalAlocacao.remove();
      modalAlocacaoAberto = false;
    } else {
      // Fallback: busca por outros seletores possíveis
      const modal = document.querySelector('.fixed.inset-0') || 
                    document.querySelector('.fixed') || 
                    document.querySelector('[class*="modal"]');
      if (modal) {
        modal.remove();
      }
    }
    
    await atualizarLista();
    mostrarMensagem('success', 'Ativo devolvido com sucesso');
    
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('error', 'Erro ao devolver ativo');
  }
}

// Função de manutenção removida - agora está em manutencao.js
// Esta função é mantida aqui apenas para compatibilidade
async function registrarManutencao(id) {
  // Redireciona para a nova função no arquivo manutencao.js
  if (typeof window.abrirModalManutencao === 'function') {
    return window.abrirModalManutencao(id);
  } else {
    console.error('Sistema de manutenção não carregado');
    mostrarMensagem('error', 'Erro: Sistema de manutenção não disponível');
  }
}

async function verHistorico(id) {
  console.log('verHistorico chamada para ativo:', id);
  
  // Evita execuções múltiplas
  if (modalHistoricoAberto) {
    console.log('Modal já está aberto, retornando');
    return;
  }
  
  modalHistoricoAberto = true;
  
  // Verifica se já existe um modal de histórico aberto
  const existingModal = document.querySelector('#modalHistorico');
  if (existingModal) {
    existingModal.remove();
  }
  
  try {
    console.log('Fazendo requisição para histórico...');
    const res = await fetch(`/api/ativos/${id}/historico?t=${Date.now()}`);
    console.log('Resposta recebida:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
    }
    
    const historico = await res.json();
    console.log('Histórico carregado:', historico.length, 'eventos');
    
    // Função para formatar tipos de eventos
    function formatarTipo(tipo) {
      const tipos = {
        'alocacao': 'Alocação',
        'devolucao': 'Devolução',
        'manutencao': 'Manutenção',
        'manutencao_concluida': 'Manutenção Concluída'
      };
      return tipos[tipo] || tipo;
    }
    
    // Função para obter classe CSS do badge
    function getClasseBadge(tipo) {
      const classes = {
        'alocacao': 'bg-green-100 text-green-700',
        'devolucao': 'bg-blue-100 text-blue-700', 
        'manutencao': 'bg-yellow-100 text-yellow-700',
        'manutencao_concluida': 'bg-purple-100 text-purple-700'
      };
      return classes[tipo] || 'bg-gray-100 text-gray-700';
    }
    
    // Função para formatar data
    function formatarData(isoDate) {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Abre o modal de histórico
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.id = 'modalHistorico';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">Histórico do Ativo #${id}</h3>
            <button type="button" class="text-gray-400 hover:text-gray-600" 
              onclick="fecharModalHistorico()">
              <i class="fa fa-times"></i>
            </button>
          </div>
          <div class="overflow-y-auto max-h-[70vh]">
            ${historico.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <i class="fa fa-history text-4xl mb-3 block"></i>
                <p>Nenhum histórico encontrado para este ativo.</p>
              </div>
            ` : `
              <table class="min-w-full">
                <thead class="bg-gray-50 sticky top-0">
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium">Data</th>
                    <th class="text-left py-3 px-4 font-medium">Tipo</th>
                    <th class="text-left py-3 px-4 font-medium">Descrição</th>
                    <th class="text-left py-3 px-4 font-medium">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  ${historico.map(h => `
                    <tr class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 text-sm">${formatarData(h.data)}</td>
                      <td class="py-3 px-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${getClasseBadge(h.tipo)}">
                          ${formatarTipo(h.tipo)}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-sm">${h.descricao}</td>
                      <td class="py-3 px-4 text-sm">${h.usuario_nome || '-'}</td>
                    </tr>
                    ${h.observacao ? `
                      <tr class="border-b bg-gray-25">
                        <td colspan="4" class="py-2 px-4 text-xs text-gray-600 italic">
                          <i class="fa fa-comment mr-1"></i> ${h.observacao}
                        </td>
                      </tr>
                    ` : ''}
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    mostrarMensagem('error', 'Erro ao carregar histórico: ' + error.message);
    modalHistoricoAberto = false;
  }
}

function fecharModalHistorico() {
  const modal = document.getElementById('modalHistorico');
  if (modal) {
    modal.remove();
  }
  modalHistoricoAberto = false;
}

async function excluirAtivo(id) {
  if (!confirm('Tem certeza que deseja excluir este ativo?')) return;
  
  try {
    const res = await fetch(`/api/ativos/${id}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    await atualizarLista();
    mostrarMensagem('success', 'Ativo excluído com sucesso');
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('error', 'Erro ao excluir ativo');
  }
}

// Controle do dropdown
document.addEventListener('click', (e) => {
  // Fecha todos os dropdowns quando clica fora
  if (!e.target.closest('.btn-actions')) {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.add('hidden'));
    return;
  }
  
  // Toggle do dropdown quando clica no botão
  const btn = e.target.closest('.btn-actions');
  if (btn) {
    const dropdown = btn.nextElementSibling;
    
    // Fecha outros dropdowns
    document.querySelectorAll('.dropdown').forEach(d => {
      if (d !== dropdown) d.classList.add('hidden');
    });

    // Toggle do dropdown atual
    if (dropdown.classList.contains('hidden')) {
      // Posiciona o dropdown acima do botão
      const btnRect = btn.getBoundingClientRect();
      const dropdownHeight = 240; // Altura aproximada do menu
      
      dropdown.style.left = `${btnRect.left + (btnRect.width / 2)}px`;
      
      // Verifica se tem espaço suficiente acima
      if (btnRect.top > dropdownHeight) {
        // Posiciona acima do botão
        dropdown.style.top = `${btnRect.top + window.scrollY - dropdownHeight - 10}px`;
        dropdown.classList.add('has-arrow-bottom');
        dropdown.classList.remove('has-arrow-top');
      } else {
        // Se não tiver espaço suficiente, posiciona abaixo
        dropdown.style.top = `${btnRect.bottom + window.scrollY + 10}px`;
        dropdown.classList.add('has-arrow-top');
        dropdown.classList.remove('has-arrow-bottom');
      }
    }
    
    dropdown.classList.toggle('hidden');
    e.stopPropagation();
  }
});

// Fecha dropdowns ao rolar a página
window.addEventListener('scroll', () => {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.add('hidden'));
});

// Log para confirmar que o arquivo foi carregado
console.log('acoes_ativos.js carregado - função verHistorico:', typeof verHistorico);
