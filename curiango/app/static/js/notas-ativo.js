/**
 * Sistema de Notas para Ativos
 * Gerencia a adição, visualização e exclusão de notas/observações dos ativos
 */

class NotasAtivo {
    constructor() {
        this.ativoAtual = null;
        this.notas = [];
        this.initEventListeners();
    }

    initEventListeners() {
        // Event listener para fechar modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop') || e.target.closest('.btn-close-modal')) {
                this.fecharModal();
            }
        });

        // Event listener para tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.fecharModal();
            }
        });
    }

    /**
     * Abre o modal de notas para um ativo específico
     * @param {number} ativoId - ID do ativo
     * @param {string} ativoDescricao - Descrição do ativo
     */
    async abrirModal(ativoId, ativoDescricao) {
        this.ativoAtual = ativoId;
        
        // Criar modal se não existir
        this.criarModal();
        
        // Atualizar título
        document.getElementById('tituloModalNotas').textContent = `Notas - ${ativoDescricao}`;
        
        // Limpar formulário
        this.limparFormulario();
        
        // Carregar notas existentes
        await this.carregarNotas();
        
        // Mostrar modal
        document.getElementById('modalNotas').classList.remove('hidden');
        
        // Focar no textarea
        setTimeout(() => {
            document.getElementById('conteudoNota').focus();
        }, 100);
    }

    /**
     * Cria a estrutura HTML do modal
     */
    criarModal() {
        if (document.getElementById('modalNotas')) {
            return; // Modal já existe
        }

        const modalHTML = `
            <div id="modalNotas" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 modal-backdrop">
                <div class="bg-white rounded-lg max-w-4xl mx-auto mt-10 shadow-xl max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b">
                        <div class="flex justify-between items-center">
                            <h3 class="text-xl font-semibold" id="tituloModalNotas">Notas do Ativo</h3>
                            <button type="button" class="btn-close-modal text-gray-400 hover:text-gray-600">
                                <i class="fa fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 max-h-[70vh] overflow-y-auto">
                        <!-- Formulário para nova nota -->
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 class="text-lg font-medium mb-3">Adicionar Nova Nota</h4>
                            <form id="formNovaNota">
                                <div class="mb-3">
                                    <label for="conteudoNota" class="block text-sm font-medium text-gray-700 mb-2">
                                        Conteúdo da Nota
                                    </label>
                                    <textarea 
                                        id="conteudoNota" 
                                        name="conteudo" 
                                        rows="4" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Digite aqui suas observações sobre o ativo..."
                                        required
                                    ></textarea>
                                </div>
                                <div class="flex justify-end">
                                    <button 
                                        type="submit" 
                                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <i class="fa fa-plus mr-2"></i>Adicionar Nota
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Lista de notas existentes -->
                        <div>
                            <h4 class="text-lg font-medium mb-3">Histórico de Notas</h4>
                            <div id="listaNotas">
                                <div class="text-center py-8 text-gray-500">
                                    <i class="fa fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>Carregando notas...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Adicionar event listener para o formulário
        document.getElementById('formNovaNota').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarNota();
        });
    }

    /**
     * Carrega as notas do ativo
     */
    async carregarNotas() {
        try {
            showToast('info', 'Carregando notas...');
            
            const response = await fetch(`/api/ativos/${this.ativoAtual}/notas`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar notas');
            }

            this.notas = data.notas || [];
            this.renderizarNotas();

        } catch (error) {
            console.error('Erro ao carregar notas:', error);
            showToast('error', 'Erro ao carregar notas: ' + error.message);
            
            // Mostrar mensagem de erro na lista
            document.getElementById('listaNotas').innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fa fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Erro ao carregar notas</p>
                </div>
            `;
        }
    }

    /**
     * Renderiza a lista de notas
     */
    renderizarNotas() {
        const container = document.getElementById('listaNotas');

        if (this.notas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fa fa-sticky-note text-2xl mb-2"></i>
                    <p>Nenhuma nota encontrada para este ativo</p>
                </div>
            `;
            return;
        }

        const notasHTML = this.notas.map(nota => this.criarHTMLNota(nota)).join('');
        container.innerHTML = notasHTML;

        // Adicionar event listeners para botões de excluir
        container.querySelectorAll('.btn-excluir-nota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notaId = parseInt(e.target.closest('.btn-excluir-nota').dataset.notaId);
                this.confirmarExclusaoNota(notaId);
            });
        });
    }

    /**
     * Cria o HTML para uma nota
     * @param {Object} nota - Objeto da nota
     * @returns {string} HTML da nota
     */
    criarHTMLNota(nota) {
        const dataFormatada = new Date(nota.created_at).toLocaleString('pt-BR');
        // Verificar se o usuário atual é o autor da nota
        // Compara com o nome completo, pois é assim que está salvo no banco
        const currentUserFullName = window.currentUser?.fullName || '';
        const isAutor = nota.usuario === currentUserFullName;

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fa fa-user text-gray-500"></i>
                            <span class="font-medium text-gray-900">${nota.usuario}</span>
                            <span class="text-sm text-gray-500">•</span>
                            <span class="text-sm text-gray-500">${dataFormatada}</span>
                        </div>
                    </div>
                    ${isAutor ? `
                        <button 
                            type="button" 
                            class="btn-excluir-nota text-red-500 hover:text-red-700 ml-2"
                            data-nota-id="${nota.id}"
                            title="Excluir nota"
                        >
                            <i class="fa fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="text-gray-700 whitespace-pre-wrap">${this.escapeHtml(nota.conteudo)}</div>
            </div>
        `;
    }

    /**
     * Adiciona uma nova nota
     */
    async adicionarNota() {
        const form = document.getElementById('formNovaNota');
        const conteudo = form.conteudo.value.trim();

        if (!conteudo) {
            showToast('error', 'Digite o conteúdo da nota');
            return;
        }

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>Salvando...';
            submitBtn.disabled = true;

            const response = await fetch(`/api/ativos/${this.ativoAtual}/notas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ conteudo })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao adicionar nota');
            }

            // Limpar formulário
            this.limparFormulario();

            // Recarregar notas
            await this.carregarNotas();

            showToast('success', 'Nota adicionada com sucesso');

        } catch (error) {
            console.error('Erro ao adicionar nota:', error);
            showToast('error', 'Erro ao adicionar nota: ' + error.message);
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fa fa-plus mr-2"></i>Adicionar Nota';
            submitBtn.disabled = false;
        }
    }

    /**
     * Confirma a exclusão de uma nota
     * @param {number} notaId - ID da nota
     */
    confirmarExclusaoNota(notaId) {
        if (confirm('Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.')) {
            this.excluirNota(notaId);
        }
    }

    /**
     * Exclui uma nota
     * @param {number} notaId - ID da nota
     */
    async excluirNota(notaId) {
        try {
            showToast('info', 'Excluindo nota...');

            const response = await fetch(`/api/ativos/${this.ativoAtual}/notas/${notaId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir nota');
            }

            // Recarregar notas
            await this.carregarNotas();

            showToast('success', 'Nota excluída com sucesso');

        } catch (error) {
            console.error('Erro ao excluir nota:', error);
            showToast('error', 'Erro ao excluir nota: ' + error.message);
        }
    }

    /**
     * Limpa o formulário de nova nota
     */
    limparFormulario() {
        const form = document.getElementById('formNovaNota');
        if (form) {
            form.reset();
        }
    }

    /**
     * Fecha o modal
     */
    fecharModal() {
        const modal = document.getElementById('modalNotas');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.ativoAtual = null;
        this.notas = [];
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a ser escapado
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar sistema de notas
const notasAtivo = new NotasAtivo();

// Função global para abrir modal de notas (chamada pelo menu de ações)
window.abrirModalNotas = function(ativoId, ativoDescricao) {
    notasAtivo.abrirModal(ativoId, ativoDescricao);
};

console.log('Sistema de Notas para Ativos carregado');