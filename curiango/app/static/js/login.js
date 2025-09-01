document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const msg = document.getElementById('loginMsg');
  const buttonText = document.getElementById('loginButtonText');
  const buttonLoading = document.getElementById('loginButtonLoading');
  const loginButton = document.getElementById('loginButton');
  
  // Ativar estado de carregamento
  if (buttonText && buttonLoading) {
    buttonText.classList.add('hidden');
    buttonLoading.classList.remove('hidden');
    loginButton.disabled = true;
  }
  
  msg.textContent = 'Autenticando...';
  msg.className = 'text-sm text-center transition-all duration-300 text-white/80';
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!res.ok) {
      // Estado de erro
      msg.textContent = data.message || 'Falha no login. Verifique suas credenciais.';
      msg.className = 'text-sm text-center transition-all duration-300 text-red-300 bg-red-500/20 px-4 py-2 rounded-lg';
      
      // Resetar botão
      if (buttonText && buttonLoading) {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        loginButton.disabled = false;
      }
      
      // Efeito visual de erro (shake)
      loginButton.style.animation = 'shake 0.5s';
      setTimeout(() => {
        loginButton.style.animation = '';
      }, 500);
      
      return;
    }
    
    // Estado de sucesso
    msg.textContent = '✓ Login efetuado com sucesso! Redirecionando...';
    msg.className = 'text-sm text-center transition-all duration-300 text-green-300 bg-green-500/20 px-4 py-2 rounded-lg';
    
    // Animação de sucesso
    if (buttonText && buttonLoading) {
      buttonLoading.innerHTML = '<i class="fas fa-check mr-2"></i>Sucesso!';
    }
    
    // Redirecionar após um pequeno delay para mostrar o feedback
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    
  } catch (err) {
    // Estado de erro de rede
    msg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
    msg.className = 'text-sm text-center transition-all duration-300 text-red-300 bg-red-500/20 px-4 py-2 rounded-lg';
    
    // Resetar botão
    if (buttonText && buttonLoading) {
      buttonText.classList.remove('hidden');
      buttonLoading.classList.add('hidden');
      loginButton.disabled = false;
    }
  }
});

// Adicionar animação de shake para erros
const shakeAnimation = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;

// Adicionar o CSS da animação shake
const style = document.createElement('style');
style.textContent = shakeAnimation;
document.head.appendChild(style);