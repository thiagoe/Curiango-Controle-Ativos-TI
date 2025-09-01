/**
 * Mostra uma mensagem toast
 * @param {'success'|'error'|'info'|'warning'} type 
 * @param {string} message 
 */
function showToast(type, message) {
  const container = document.getElementById('toastContainer');
  const template = document.getElementById('toastTemplate');
  if (!container || !template) return;

  const toast = template.content.cloneNode(true).children[0];
  const icon = toast.querySelector('i');
  const text = toast.querySelector('p');

  toast.classList.add('toast');
  text.textContent = message;

  // Configura cor e ícone baseado no tipo
  switch (type) {
    case 'success':
      toast.classList.add('bg-green-100', 'text-green-800');
      icon.classList.add('fa-check-circle', 'text-green-500');
      break;
    case 'error':
      toast.classList.add('bg-red-100', 'text-red-800');
      icon.classList.add('fa-exclamation-circle', 'text-red-500');
      break;
    case 'warning':
      toast.classList.add('bg-yellow-100', 'text-yellow-800');
      icon.classList.add('fa-exclamation-triangle', 'text-yellow-500');
      break;
    case 'info':
    default:
      toast.classList.add('bg-blue-100', 'text-blue-800');
      icon.classList.add('fa-info-circle', 'text-blue-500');
  }

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Remove o toast após 5 segundos
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Função para fazer logout do usuário
 */
async function logout() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      showToast('success', 'Logout realizado com sucesso');
      // Redireciona para a página de login após um breve delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } else {
      showToast('error', 'Erro ao fazer logout');
    }
  } catch (error) {
    console.error('Erro no logout:', error);
    showToast('error', 'Erro ao fazer logout');
  }
}
