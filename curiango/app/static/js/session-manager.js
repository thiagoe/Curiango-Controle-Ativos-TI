/**
 * Gerenciador de Sessão com Timeout por Inatividade
 * Monitora atividade do usuário e gerencia avisos de desconexão
 */

class SessionManager {
    constructor() {
        this.isActive = true;
        this.lastActivity = Date.now();
        this.checkInterval = null;
        this.warningModal = null;
        this.warningShown = false;
        this.countdownInterval = null;
        
        // Configurações
        this.ACTIVITY_EVENTS = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'focus', 'input', 'change'
        ];
        this.CHECK_INTERVAL = 30000; // Verificar a cada 30 segundos
        this.WARNING_TIME = 300; // Mostrar aviso nos últimos 5 minutos (300 segundos)
        
        this.init();
    }
    
    init() {
        console.log('SessionManager: Iniciando gerenciamento de sessão');
        
        // Configurar detectores de atividade
        this.setupActivityDetectors();
        
        // Iniciar verificação periódica
        this.startPeriodicCheck();
        
        // Configurar handlers para visibilidade da página
        this.setupVisibilityHandlers();
    }
    
    setupActivityDetectors() {
        // Adicionar listeners para eventos de atividade
        this.ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, this.handleActivity.bind(this), true);
        });
        
        console.log('SessionManager: Detectores de atividade configurados');
    }
    
    handleActivity() {
        const now = Date.now();
        
        // Só considera atividade significativa se passou mais de 10 segundos
        if (now - this.lastActivity > 10000) {
            this.lastActivity = now;
            this.updateServerActivity();
            
            // Se estava mostrando aviso, esconder
            if (this.warningShown) {
                this.hideWarning();
            }
        }
    }
    
    async updateServerActivity() {
        try {
            await fetch('/auth/activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.warn('SessionManager: Erro ao atualizar atividade no servidor:', error);
        }
    }
    
    startPeriodicCheck() {
        this.checkInterval = setInterval(() => {
            this.checkSessionStatus();
        }, this.CHECK_INTERVAL);
        
        console.log('SessionManager: Verificação periódica iniciada');
    }
    
    async checkSessionStatus() {
        try {
            const response = await fetch('/auth/session-status');
            const data = await response.json();
            
            if (!response.ok || !data.authenticated) {
                this.handleSessionExpired(data.reason);
                return;
            }
            
            // Verificar se deve mostrar aviso
            if (data.warning && !this.warningShown) {
                this.showWarning(data.time_remaining_seconds);
            } else if (!data.warning && this.warningShown) {
                this.hideWarning();
            }
            
        } catch (error) {
            console.warn('SessionManager: Erro ao verificar status da sessão:', error);
        }
    }
    
    showWarning(timeRemaining) {
        this.warningShown = true;
        
        // Criar modal de aviso se não existir
        if (!this.warningModal) {
            this.createWarningModal();
        }
        
        // Mostrar modal
        this.warningModal.style.display = 'flex';
        
        // Iniciar countdown
        this.startCountdown(timeRemaining);
        
        console.log('SessionManager: Aviso de sessão mostrado');
    }
    
    hideWarning() {
        this.warningShown = false;
        
        if (this.warningModal) {
            this.warningModal.style.display = 'none';
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        console.log('SessionManager: Aviso de sessão escondido');
    }
    
    createWarningModal() {
        this.warningModal = document.createElement('div');
        this.warningModal.id = 'sessionWarningModal';
        this.warningModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]';
        this.warningModal.style.display = 'none';
        
        this.warningModal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div class="flex items-center mb-4">
                    <div class="bg-yellow-100 p-3 rounded-full">
                        <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    </div>
                    <div class="ml-4">
                        <h3 class="text-lg font-semibold text-gray-900">Sessão Expirando</h3>
                        <p class="text-sm text-gray-600">Sua sessão expirará em breve por inatividade</p>
                    </div>
                </div>
                
                <div class="mb-6 text-center">
                    <p class="text-gray-700 mb-2">Tempo restante:</p>
                    <div id="countdownDisplay" class="text-3xl font-bold text-red-600 font-mono">
                        05:00
                    </div>
                    <p class="text-sm text-gray-500 mt-2">
                        Clique em "Continuar" para manter sua sessão ativa
                    </p>
                </div>
                
                <div class="flex gap-3 justify-end">
                    <button type="button" 
                            onclick="sessionManager.handleLogout()" 
                            class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        Fazer Logout
                    </button>
                    <button type="button" 
                            onclick="sessionManager.handleContinueSession()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-clock mr-2"></i>Continuar Sessão
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.warningModal);
    }
    
    startCountdown(initialSeconds) {
        let remainingSeconds = initialSeconds;
        const display = document.getElementById('countdownDisplay');
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.countdownInterval = setInterval(() => {
            remainingSeconds--;
            
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            
            if (display) {
                display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (remainingSeconds <= 0) {
                clearInterval(this.countdownInterval);
                this.handleSessionExpired('inactivity_timeout');
            }
        }, 1000);
        
        // Atualizar display inicial
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        if (display) {
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    handleContinueSession() {
        // Registrar atividade
        this.handleActivity();
        
        // Esconder aviso
        this.hideWarning();
        
        // Mostrar confirmação
        if (typeof showToast === 'function') {
            showToast('success', 'Sessão renovada com sucesso!');
        }
    }
    
    async handleLogout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                window.location.href = '/login';
            } else {
                throw new Error('Erro no logout');
            }
        } catch (error) {
            console.error('SessionManager: Erro no logout:', error);
            // Forçar redirecionamento mesmo com erro
            window.location.href = '/login';
        }
    }
    
    handleSessionExpired(reason = 'unknown') {
        console.log('SessionManager: Sessão expirada. Motivo:', reason);
        
        // Limpar intervalos
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Mostrar mensagem e redirecionar
        if (typeof showToast === 'function') {
            showToast('warning', 'Sua sessão expirou por inatividade. Redirecionando...');
        } else {
            alert('Sua sessão expirou por inatividade.');
        }
        
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    }
    
    setupVisibilityHandlers() {
        // Pausar verificações quando página não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Página ficou invisível - pausar verificações frequentes
                if (this.checkInterval) {
                    clearInterval(this.checkInterval);
                    this.checkInterval = null;
                }
            } else {
                // Página ficou visível - retomar verificações
                if (!this.checkInterval) {
                    this.startPeriodicCheck();
                }
                // Verificar status imediatamente
                this.checkSessionStatus();
            }
        });
    }
    
    destroy() {
        // Limpar todos os intervalos e listeners
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, this.handleActivity.bind(this), true);
        });
        
        if (this.warningModal) {
            this.warningModal.remove();
        }
        
        console.log('SessionManager: Destruído');
    }
}

// Inicializar gerenciador de sessão quando DOM estiver pronto
let sessionManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sessionManager = new SessionManager();
    });
} else {
    sessionManager = new SessionManager();
}

// Disponibilizar globalmente
window.sessionManager = sessionManager;