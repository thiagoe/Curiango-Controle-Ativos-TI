/**
 * Script específico para gerenciar o dropdown de ações dos ativos
 * Isolado para evitar conflitos com outros scripts
 */

class DropdownAcoes {
    constructor() {
        this.init();
    }

    init() {
        // Adicionar event listeners com capture phase para ter prioridade
        document.addEventListener('click', this.handleClick.bind(this), true);
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        console.log('DropdownAcoes: Inicializado com event listeners');
    }

    handleClick(e) {
        console.log('DropdownAcoes: Click event', {
            target: e.target,
            actionsBtn: e.target.closest('.btn-actions'),
            dropdown: e.target.closest('.dropdown'),
            ddItem: e.target.closest('.dd-item')
        });

        const actionsBtn = e.target.closest('.btn-actions');
        
        // Se clicou no botão de ações
        if (actionsBtn) {
            console.log('DropdownAcoes: Clicou no botão de ações');
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown(actionsBtn);
            return;
        }

        // Se clicou em um item do dropdown
        const dropdownItem = e.target.closest('.dd-item');
        if (dropdownItem) {
            console.log('DropdownAcoes: Clicou em item do dropdown');
            e.preventDefault();
            e.stopPropagation();
            this.executeAction(dropdownItem);
            return;
        }

        // Se clicou fora, fecha todos os dropdowns
        if (!e.target.closest('.dropdown')) {
            console.log('DropdownAcoes: Clicou fora - fechando dropdowns');
            this.closeAllDropdowns();
        }
    }

    handleKeydown(e) {
        // Fechar com ESC
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
        }
    }

    toggleDropdown(button) {
        const cell = button.parentElement;
        const dropdown = cell.querySelector('.dropdown');
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        console.log('DropdownAcoes: Toggle dropdown', { isOpen, button, dropdown });

        if (isOpen) {
            // Se já está aberto, fecha apenas este
            this.closeDropdown(button, dropdown);
        } else {
            // Se está fechado, fecha todos os outros e abre este
            this.closeAllDropdowns();
            if (dropdown) {
                this.openDropdown(button, dropdown);
            }
        }
    }

    openDropdown(button, dropdown) {
        // Posicionamento inteligente
        this.positionDropdown(button, dropdown);
        
        // Aplicar z-index alto e posicionamento fixed para escapar do contexto da tabela
        dropdown.style.position = 'fixed';
        dropdown.style.zIndex = '9999';
        
        // Abrir
        dropdown.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');

        console.log('DropdownAcoes: Dropdown aberto', dropdown);
    }

    closeDropdown(button, dropdown) {
        dropdown.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        
        // Reset positioning styles
        dropdown.style.position = '';
        dropdown.style.zIndex = '';
        dropdown.style.left = '';
        dropdown.style.top = '';
        
        console.log('DropdownAcoes: Dropdown fechado', dropdown);
    }

    positionDropdown(button, dropdown) {
        const buttonRect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Dimensões do dropdown (baseado no w-52)
        const dropdownWidth = 208;
        const estimatedHeight = 300;

        // Reset todas as classes de posicionamento e usar coordenadas fixas
        dropdown.classList.remove(
            'right-0', 'left-0', 'top-full', 'bottom-full', 
            'mt-1', 'mb-1', '-right-0', '-left-0'
        );
        
        // Reset inline styles
        dropdown.style.left = '';
        dropdown.style.top = '';
        dropdown.style.right = '';
        dropdown.style.bottom = '';

        // Posicionamento horizontal usando coordenadas fixas
        const spaceOnRight = viewportWidth - buttonRect.right;
        const spaceOnLeft = buttonRect.left;
        
        let leftPosition;
        if (spaceOnRight >= dropdownWidth) {
            // Alinha com a borda esquerda do botão
            leftPosition = buttonRect.left;
        } else if (spaceOnLeft >= dropdownWidth) {
            // Alinha com a borda direita do botão, dropdown vai para esquerda
            leftPosition = buttonRect.right - dropdownWidth;
        } else {
            // Centraliza no viewport se não há espaço suficiente em nenhum lado
            leftPosition = Math.max(10, (viewportWidth - dropdownWidth) / 2);
        }
        
        // Posicionamento vertical usando coordenadas fixas
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        let topPosition;
        if (spaceBelow >= estimatedHeight) {
            // Posiciona logo abaixo do botão
            topPosition = buttonRect.bottom + 5;
        } else if (spaceAbove >= estimatedHeight) {
            // Posiciona acima do botão
            topPosition = buttonRect.top - estimatedHeight - 5;
        } else {
            // Posiciona onde há mais espaço
            if (spaceBelow > spaceAbove) {
                topPosition = buttonRect.bottom + 5;
            } else {
                topPosition = Math.max(10, buttonRect.top - estimatedHeight - 5);
            }
        }
        
        // Aplicar posicionamento
        dropdown.style.left = leftPosition + 'px';
        dropdown.style.top = topPosition + 'px';

        console.log('DropdownAcoes: Posicionamento aplicado', {
            buttonRect,
            leftPosition,
            topPosition,
            spaceOnRight,
            spaceBelow,
            dropdownWidth,
            estimatedHeight
        });
    }

    closeAllDropdowns() {
        // Fecha todos os dropdowns
        document.querySelectorAll('.btn-actions').forEach(btn => {
            btn.setAttribute('aria-expanded', 'false');
        });
        
        document.querySelectorAll('.dropdown').forEach(dd => {
            dd.classList.add('hidden');
            // Reset positioning styles
            dd.style.position = '';
            dd.style.zIndex = '';
            dd.style.left = '';
            dd.style.top = '';
        });

        console.log('DropdownAcoes: Todos os dropdowns fechados');
    }

    executeAction(item) {
        const action = item.getAttribute('data-action');
        const id = item.getAttribute('data-id');

        console.log('DropdownAcoes: Executando ação', { action, id });

        // Fecha o dropdown
        this.closeAllDropdowns();

        // Executa a ação apropriada
        if (typeof window.handleRowAction === 'function') {
            window.handleRowAction(action, id);
        } else if (typeof handleRowAction === 'function') {
            handleRowAction(action, id);
        } else {
            console.error('DropdownAcoes: handleRowAction não encontrada');
            this.fallbackAction(action, id);
        }
    }

    fallbackAction(action, id) {
        // Ações básicas de fallback
        switch (action) {
            case 'editar':
                if (typeof editarAtivo === 'function') {
                    editarAtivo(id);
                } else {
                    alert('Função de edição não disponível');
                }
                break;
            case 'alocar':
                if (typeof alocarAtivo === 'function') {
                    alocarAtivo(id);
                } else {
                    alert('Função de alocação não disponível');
                }
                break;
            case 'excluir':
                if (confirm('Confirmar exclusão?')) {
                    this.deleteAsset(id);
                }
                break;
            default:
                console.warn('DropdownAcoes: Ação não reconhecida:', action);
        }
    }

    async deleteAsset(id) {
        try {
            const res = await fetch(`/api/ativos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (typeof showToast === 'function') {
                    showToast('success', 'Ativo excluído com sucesso!');
                }
                // Recarregar lista se disponível
                if (typeof listarAtivos === 'function') {
                    await listarAtivos();
                } else {
                    window.location.reload();
                }
            } else {
                throw new Error('Falha na exclusão');
            }
        } catch (error) {
            console.error('Erro ao excluir ativo:', error);
            alert('Erro ao excluir ativo');
        }
    }
}

// Função de inicialização
function initDropdownAcoes() {
    if (window.dropdownAcoes) {
        console.log('DropdownAcoes: Já inicializado, ignorando');
        return;
    }
    
    console.log('DropdownAcoes: Iniciando...');
    window.dropdownAcoes = new DropdownAcoes();
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdownAcoes);
} else {
    // DOM já carregado
    initDropdownAcoes();
}