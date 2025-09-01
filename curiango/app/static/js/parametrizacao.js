// Helpers
async function apiList(path, q){ 
  const url = q ? `${path}?q=${encodeURIComponent(q)}` : path;
  const res = await fetch(url); return res.json();
}
async function apiPost(path, body){
  const res = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return res;
}
async function apiPut(path, body){
  const res = await fetch(path,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return res;
}
async function apiDel(path){ return fetch(path,{method:'DELETE'}); }

function bindParamSection(section) {
  const {
    form, list, msg, basePath
  } = section;

  async function load() {
    const data = await apiList(basePath);
    renderList(data);
  }

  function renderList(items) {
    list.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between border rounded px-3 py-2';
      li.innerHTML = `
        <span><span class="text-gray-500 text-sm">${it.id}</span> - ${it.nome}</span>
        <div class="flex gap-2">
          <button class="text-primary underline" data-id="${it.id}" data-action="editar">Editar</button>
          <button class="text-red-600 underline" data-id="${it.id}" data-action="excluir">Excluir</button>
        </div>`;
      list.appendChild(li);
    });
  }

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'excluir') {
      if (!confirm('Confirmar exclusão?')) return;
      const res = await apiDel(`${basePath}/${id}`);
      if (res.ok) load(); else alert('Falha ao excluir.');
    }
    if (action === 'editar') {
      const novoNome = prompt('Novo nome:'); if (!novoNome) return;
      const res = await apiPut(`${basePath}/${id}`, { nome: novoNome });
      if (res.ok) load(); else alert('Falha ao atualizar.');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.textContent = 'Salvando...';
    const nome = form.querySelector('[name=nome]').value.trim();
    if (!nome) { msg.textContent = 'Nome é obrigatório.'; msg.className = 'text-sm text-red-600'; return; }
    const res = await apiPost(basePath, { nome });
    if (res.ok) {
      msg.textContent = 'Criado com sucesso.';
      msg.className = 'text-sm text-green-600';
      form.reset(); load();
    } else {
      const data = await res.json().catch(()=>({}));
      msg.textContent = data.error || 'Erro ao salvar.';
      msg.className = 'text-sm text-red-600';
    }
  });

  load();
}

// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  // Marcas
  bindParamSection({
    form: document.getElementById('formMarca'),
    list: document.getElementById('listaMarcas'),
    msg: document.getElementById('msgMarca'),
    basePath: '/api/parametros/marcas'
  });
  
  // Operadoras
  bindParamSection({
    form: document.getElementById('formOperadora'),
    list: document.getElementById('listaOperadoras'),
    msg: document.getElementById('msgOperadora'),
    basePath: '/api/parametros/operadoras'
  });
  
  // Unidades
  bindParamSection({
    form: document.getElementById('formUnidade'),
    list: document.getElementById('listaUnidades'),
    msg: document.getElementById('msgUnidade'),
    basePath: '/api/parametros/unidades'
  });
  
  // Inicializar seção de setores
  bindSetoresSection();
});

// Setores (implementação específica para múltiplos campos)
function bindSetoresSection() {
  const form = document.getElementById('formSetor');
  const list = document.getElementById('listaSetores');
  const msg = document.getElementById('msgSetor');
  const basePath = '/api/setores';

  async function load() {
    try {
      const res = await fetch(basePath);
      const data = await res.json();
      renderList(data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      msg.textContent = 'Erro ao carregar setores.';
      msg.className = 'text-sm text-red-600';
    }
  }

  function renderList(items) {
    list.innerHTML = '';
    items.forEach(setor => {
      const li = document.createElement('li');
      li.className = 'border rounded p-3 space-y-2';
      li.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="font-medium text-gray-900">
              <span class="text-gray-500 text-sm font-normal">${setor.id}</span> - ${setor.nome}
            </div>
            <div class="text-sm text-gray-600">
              <i class="fas fa-envelope mr-1"></i>${setor.email_responsavel}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              ${setor.colaboradores_count || 0} colaboradores
            </div>
          </div>
          <div class="flex gap-2">
            <button class="text-primary underline text-sm" data-id="${setor.id}" data-action="editar">
              <i class="fas fa-edit mr-1"></i>Editar
            </button>
            <button class="text-red-600 underline text-sm" data-id="${setor.id}" data-action="excluir">
              <i class="fas fa-trash mr-1"></i>Excluir
            </button>
          </div>
        </div>
      `;
      list.appendChild(li);
    });
    
    if (items.length === 0) {
      list.innerHTML = '<li class="text-gray-500 text-center py-4">Nenhum setor encontrado</li>';
    }
  }

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    
    if (action === 'excluir') {
      if (!confirm('Confirmar exclusão do setor?\\n\\nAtenção: Colaboradores vinculados a este setor ficarão sem setor.')) return;
      
      try {
        const res = await fetch(`${basePath}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          msg.textContent = 'Setor excluído com sucesso.';
          msg.className = 'text-sm text-green-600';
          load();
        } else {
          const data = await res.json();
          msg.textContent = data.error || 'Erro ao excluir setor.';
          msg.className = 'text-sm text-red-600';
        }
      } catch (error) {
        console.error('Erro ao excluir setor:', error);
        msg.textContent = 'Erro ao excluir setor.';
        msg.className = 'text-sm text-red-600';
      }
    }
    
    if (action === 'editar') {
      // Buscar dados atuais do setor
      try {
        const res = await fetch(`${basePath}/${id}`);
        const setorData = await res.json();
        
        // Abrir modal com dados do setor
        abrirModalSetor(setorData.id, setorData.nome, setorData.email_responsavel);
        
      } catch (error) {
        console.error('Erro ao buscar dados do setor:', error);
        msg.textContent = 'Erro ao buscar dados do setor.';
        msg.className = 'text-sm text-red-600';
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = form.querySelector('[name=nome]').value.trim();
    const email = form.querySelector('[name=email_responsavel]').value.trim();
    
    if (!nome) {
      msg.textContent = 'Nome do setor é obrigatório.';
      msg.className = 'text-sm text-red-600';
      return;
    }
    
    if (!email || !email.includes('@')) {
      msg.textContent = 'Email válido é obrigatório.';
      msg.className = 'text-sm text-red-600';
      return;
    }
    
    msg.textContent = 'Salvando...';
    msg.className = 'text-sm text-gray-600';
    
    try {
      const res = await fetch(basePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email_responsavel: email })
      });
      
      if (res.ok) {
        msg.textContent = 'Setor criado com sucesso.';
        msg.className = 'text-sm text-green-600';
        form.reset();
        load();
      } else {
        const data = await res.json();
        msg.textContent = data.error || 'Erro ao salvar setor.';
        msg.className = 'text-sm text-red-600';
      }
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      msg.textContent = 'Erro ao criar setor.';
      msg.className = 'text-sm text-red-600';
    }
  });


  // Event listener para formulário de edição
  const formEditarSetor = document.getElementById('formEditarSetor');
  const msgEditarSetor = document.getElementById('msgEditarSetor');
  
  if (formEditarSetor) {
    formEditarSetor.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('editSetorId').value;
      const nome = document.getElementById('editSetorNome').value.trim();
      const email = document.getElementById('editSetorEmail').value.trim();
      
      if (!nome) {
        msgEditarSetor.textContent = 'Nome do setor é obrigatório.';
        msgEditarSetor.className = 'text-sm text-red-600';
        return;
      }
      
      if (!email || !email.includes('@')) {
        msgEditarSetor.textContent = 'Email válido é obrigatório.';
        msgEditarSetor.className = 'text-sm text-red-600';
        return;
      }
      
      msgEditarSetor.textContent = 'Salvando...';
      msgEditarSetor.className = 'text-sm text-gray-600';
      
      try {
        const res = await fetch(`${basePath}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: nome,
            email_responsavel: email
          })
        });
        
        if (res.ok) {
          msgEditarSetor.textContent = 'Setor atualizado com sucesso.';
          msgEditarSetor.className = 'text-sm text-green-600';
          
          setTimeout(() => {
            fecharModalSetor();
            load();
            msg.textContent = 'Setor atualizado com sucesso.';
            msg.className = 'text-sm text-green-600';
          }, 1000);
          
        } else {
          const data = await res.json();
          msgEditarSetor.textContent = data.error || 'Erro ao atualizar setor.';
          msgEditarSetor.className = 'text-sm text-red-600';
        }
      } catch (error) {
        console.error('Erro ao atualizar setor:', error);
        msgEditarSetor.textContent = 'Erro ao atualizar setor.';
        msgEditarSetor.className = 'text-sm text-red-600';
      }
    });
  }

  // Carregar dados iniciais
  load();
}

