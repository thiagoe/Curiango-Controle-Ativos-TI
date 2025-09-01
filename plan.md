# Plano: Correção de Sobreposição do Ícone de Lupa nos Campos de Pesquisa

## Problema Identificado
Nas interfaces de **Estoque** e **Colaboradores**, o ícone de lupa (🔍) está sobreposto ao texto digitado nos campos de busca, causando problemas de usabilidade.

## Análise do Problema

### Interfaces Afetadas
1. **Estoque** (`templates/estoque.html`) - Linha 28-32
2. **Colaboradores** (`templates/colaboradores.html`) - Linha 20-24
3. **Auditoria** (`templates/auditoria.html`) - Linha 16-22

### Código Atual Problemático

#### Estoque (linhas 27-32):
```html
<div class="relative">
  <input id="busca" class="mt-1 w-full border rounded-lg px-3 py-2 pl-12" placeholder="Buscar por nome ou modelo..." />
  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
    <i class="fa fa-search"></i>
  </span>
</div>
```

#### Colaboradores (linhas 20-24):
```html
<div class="relative">
  <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
  <input id="fBusca" class="pl-12 w-full border rounded-lg px-3 py-2" 
    placeholder="Digite nome, CPF ou matrícula..." />
</div>
```

#### Auditoria (linhas 16-22):
```html
<div class="relative">
  <input id="buscaGeral" class="mt-1 w-full border rounded-lg px-3 py-2 pl-12" 
         placeholder="Buscar na descrição..." />
  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
    <i class="fa fa-search"></i>
  </span>
</div>
```

### Diagnóstico Técnico

#### Problema Principal:
- O ícone está posicionado com `left-3` (12px do canto esquerdo)
- O input tem `pl-12` (padding-left: 48px), mas isso pode não ser suficiente
- Falta z-index no ícone para garantir que fique "atrás" do texto
- Possível conflito com estilos do Tailwind CSS + Bootstrap

#### Diferenças entre Interfaces:
- **Estoque**: Usa `<span>` com `<i>` dentro, input depois do span
- **Colaboradores**: Usa `<i>` diretamente, input depois do ícone
- **Auditoria**: Usa `<span>` com `<i>` dentro, input antes do span
- Posicionamentos ligeiramente diferentes

## Soluções Propostas

### Abordagem 1: Ajuste de Padding e Z-Index
```html
<div class="relative">
  <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>
  <input class="pl-10 w-full border rounded-lg px-3 py-2" placeholder="..." />
</div>
```

### Abordagem 2: Reposicionamento do Ícone
```html
<div class="relative">
  <i class="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
  <input class="pl-12 w-full border rounded-lg px-4 py-2" placeholder="..." />
</div>
```

### Abordagem 3: CSS Customizado (mais robusta)
```css
.search-input-container {
  position: relative;
}

.search-input-container .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  pointer-events: none;
  z-index: 1;
}

.search-input-container input {
  padding-left: 40px;
}
```

## Modificações Planejadas

### 1. Padronizar Estrutura HTML
**Objetivo**: Unificar o código entre as duas interfaces

**Template Estoque** (linha 27-32):
```html
<div class="relative">
  <i class="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10"></i>
  <input id="busca" class="w-full border rounded-lg px-4 py-2 pl-12" placeholder="Buscar por nome ou modelo..." />
</div>
```

**Template Colaboradores** (linha 20-24):
```html
<div class="relative">
  <i class="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"></i>
  <input id="fBusca" class="w-full border rounded-lg px-4 py-2 pl-12" 
    placeholder="Digite nome, CPF ou matrícula..." />
</div>
```

**Template Auditoria** (linha 16-22):
```html
<div class="relative">
  <i class="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none z-10"></i>
  <input id="buscaGeral" class="w-full border rounded-lg px-4 py-2 pl-12" 
         placeholder="Buscar na descrição..." />
</div>
```

### 2. Adicionar CSS de Segurança (Opcional)
**Local**: `static/css/app.css`
```css
/* Fix para campos de busca com ícone */
.search-field-container {
  position: relative;
}

.search-field-container .search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 10;
}

.search-field-container input {
  padding-left: 48px !important;
}
```

## Testes Requeridos

### Cenários de Teste
1. **Funcionalidade**: Verificar se a busca continua funcionando
2. **Visual**: Confirmar que o ícone não sobrepõe o texto
3. **Responsivo**: Testar em diferentes tamanhos de tela
4. **Navegadores**: Chrome, Firefox, Safari
5. **Acessibilidade**: Tab navigation e screen readers

### Critérios de Sucesso
- [ ] Ícone visível mas não sobrepondo texto digitado
- [ ] Padding adequado no input
- [ ] Funcionalidade de busca mantida
- [ ] Layout responsivo preservado
- [ ] Consistência visual entre as duas telas

## Rollback Plan

### Para Reverter Mudanças
1. **Restaurar HTML original** nos templates
2. **Remover CSS customizado** se adicionado
3. **Testar funcionamento** das buscas

### Backup dos Arquivos (CRIADO AUTOMATICAMENTE)
- `templates/estoque.html` (linhas 27-32) → `.backup`
- `templates/colaboradores.html` (linhas 20-24) → `.backup`
- `templates/auditoria.html` (linhas 16-22) → `.backup`
- `static/css/app.css` (se modificado) → `.backup`

## Implementação

### Prioridade: ALTA
- Problema de usabilidade crítico
- Afeta experiência do usuário
- Correção simples e rápida

### Sequência de Execução
1. **Backup dos arquivos** atuais
2. **Aplicar correções HTML** nos templates
3. **Testar funcionamento** das buscas
4. **Ajustar CSS** se necessário
5. **Validar em diferentes navegadores**

## Status
- [x] Análise do problema concluída
- [x] Identificação dos arquivos envolvidos
- [x] Plano de correção definido
- [x] **APROVADO PELO USUÁRIO**
- [x] **IMPLEMENTAÇÃO CONCLUÍDA**
- [x] **TESTES REALIZADOS - SERVIDOR FUNCIONANDO**

## Histórico de Implementação
- **22/08/2025**: Identificado problema de sobreposição em 3 interfaces
- **22/08/2025**: Criados backups automáticos (.backup)
- **22/08/2025**: Aplicadas correções padronizadas em todas as interfaces
- **22/08/2025**: Servidor testado - funcionando corretamente

## Correções Aplicadas
✅ **Estoque**: Campo de busca corrigido (linha 27-32) - `left-3` + `pl-24`
✅ **Colaboradores**: Campo de busca corrigido (linha 20-24) - `left-3` + `pl-24`
✅ **Auditoria**: Campo de busca corrigido (linha 16-22) - `left-3` + `pl-24`

## Ajuste Final de Espaçamento (22/08/2025)
**Problema**: Espaçamento insuficiente entre ícone e texto
**1ª Correção**: `left-4` + `pl-12` → `left-3` + `pl-14` (~44px livres)
**2ª Correção**: `left-3` + `pl-14` → `left-3` + `pl-20` (~52px livres)
**3ª Correção**: `left-3` + `pl-20` → `left-3` + `pl-24` (~68px livres)
**Resultado**: ~68px de espaçamento livre entre ícone e texto

## Rollback Disponível
Para reverter as modificações:
```bash
cd /var/www/html/curiango-controle ativo/curiango/app/templates
mv estoque.html.backup estoque.html
mv colaboradores.html.backup colaboradores.html  
mv auditoria.html.backup auditoria.html
```

---

# Plano: Correção do Gráfico de Ativos Disponíveis por Categoria

## Problema Identificado
O usuário solicitou que o gráfico de ativos disponíveis seja separado por categoria, e que ativos em manutenção, danificados e inativos **NÃO** sejam contados como disponíveis.

## Análise Atual

### Backend (`dashboard.py`) ✅ **JÁ CORRETO**
- **Linha 89-93**: Lógica de "disponíveis" está correta
- Já filtra `condicao.in_(['novo', 'usado'])` e `usuario_atual_id.is_(None)`
- **Exclui automaticamente**: em_manutencao, danificado, inativo

### Frontend (`dashboard.html`) ❌ **PROBLEMA**
- Cards por categoria existem (linhas 68-140) ✅
- **Falta**: Gráfico específico de "Disponíveis por Categoria"

## Solução Proposta

### 1. Adicionar Endpoint para Gráfico de Disponíveis
**Local**: `/api/dashboard/disponiveis-por-categoria`
```python
@bp.get("/disponiveis-por-categoria") 
def disponiveis_por_categoria():
    tipos = ['smartphone', 'notebook', 'desktop', 'chip_sim']
    resultado = []
    
    for tipo in tipos:
        disponiveis = db.session.query(func.count(Ativo.id)).filter(
            Ativo.tipo == tipo,
            Ativo.usuario_atual_id.is_(None),
            Ativo.condicao.in_(['novo', 'usado'])  # EXCLUI: em_manutencao, danificado, inativo
        ).scalar() or 0
        
        resultado.append({"categoria": tipo, "disponiveis": disponiveis})
    
    return jsonify(resultado)
```

### 2. Adicionar Gráfico no Frontend
**Local**: `dashboard.html` após linha 150
```html
<!-- Gráfico Ativos Disponíveis por Categoria -->
<div class="bg-white rounded-xl shadow-lg p-6 mb-8">
  <h3 class="text-lg font-semibold text-slate-800 mb-4">
    <i class="fas fa-chart-bar text-orange-600 mr-2"></i>
    Ativos Disponíveis por Categoria
  </h3>
  <canvas id="graficoDisponiveis" width="400" height="200"></canvas>
</div>
```

### 3. JavaScript para Renderizar
**Local**: `dashboard-moderno.js`
```javascript
async function carregarGraficoDisponiveis() {
    const response = await fetch('/api/dashboard/disponiveis-por-categoria');
    const data = await response.json();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.categoria),
            datasets: [{
                label: 'Disponíveis',
                data: data.map(item => item.disponiveis),
                backgroundColor: ['#FB7185', '#34D399', '#FBBF24', '#A78BFA']
            }]
        }
    });
}
```

## Status
- [x] Análise do código atual
- [x] Identificação do problema
- [x] Plano de solução definido
- [x] **APROVAÇÃO RECEBIDA**
- [x] **IMPLEMENTAÇÃO CONCLUÍDA**
- [x] **TESTES REALIZADOS - FUNCIONANDO**

## Implementação Realizada (22/08/2025)

### Backend - Novo Endpoint
✅ **Adicionado**: `/api/dashboard/disponiveis-por-categoria`
- **Arquivo**: `dashboard.py` linhas 155-187
- **Lógica**: Exclui `em_manutencao`, `danificado`, `inativo`
- **Teste**: Endpoint retornando dados corretos

### Frontend - Novo Gráfico  
✅ **Adicionado**: Gráfico de barras "Ativos Disponíveis por Categoria"
- **HTML**: `dashboard.html` linhas 172-181
- **JavaScript**: `dashboard-moderno.js` linhas 257-318
- **Layout**: Grid 2 colunas (disponíveis + status)

### Funcionalidades
- ✅ Gráfico de barras coloridas por categoria
- ✅ Tooltip mostra quantidade de disponíveis
- ✅ Exclui corretamente ativos indisponíveis
- ✅ Atualização automática a cada 5 minutos
- ✅ Layout responsivo