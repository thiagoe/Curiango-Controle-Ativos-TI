/**
 * Módulo para gerenciar export/import de dados na parametrização
 * Funções de importação e exportação de ativos e colaboradores
 */

// Função para mostrar mensagem temporária
function mostrarMensagem(elementId, mensagem, tipo = 'info') {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensagem;
        elemento.className = `text-sm mt-2 ${tipo === 'error' ? 'text-red-600' : tipo === 'success' ? 'text-green-600' : 'text-blue-600'}`;
        
        // Limpar mensagem após 5 segundos se for sucesso
        if (tipo === 'success') {
            setTimeout(() => {
                elemento.textContent = '';
            }, 5000);
        }
    }
}

/**
 * Exportar ativos
 */
async function exportarAtivos() {
    try {
        mostrarMensagem('msg-export-ativos', 'Preparando exportação...');
        
        const response = await fetch('/api/ativos/export');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Erro no servidor`);
        }
        
        const data = await response.json();
        
        if (!data.ativos || data.ativos.length === 0) {
            mostrarMensagem('msg-export-ativos', 'Nenhum ativo encontrado para exportação', 'error');
            return;
        }
        
        // Converter para CSV com todos os campos específicos
        const csv = convertToCSV(data.ativos, [
            'ID', 'Tipo', 'Condição', 'Valor', 'Usuário Atual', 
            'Unidade Negócio ID', 'Unidade Negócio Nome',
            'Marca ID', 'Marca Nome', 'Modelo', 'Patrimônio', 'Série',
            'SO Versão', 'Processador', 'Memória', 'HD', 'Acessórios',
            'IMEI Slot', 'Operadora ID', 'Operadora Nome', 'Número',
            'Tipo Chip', 'Data Criação'
        ]);
        
        // Fazer download
        downloadCSV(csv, 'ativos_export.csv');
        
        mostrarMensagem('msg-export-ativos', `${data.total} ativos exportados com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao exportar ativos:', error);
        mostrarMensagem('msg-export-ativos', 'Erro ao exportar ativos: ' + error.message, 'error');
    }
}

/**
 * Exportar colaboradores
 */
async function exportarColaboradores() {
    try {
        mostrarMensagem('msg-export-colaboradores', 'Preparando exportação...');
        
        const response = await fetch('/api/colaboradores/export');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Erro no servidor`);
        }
        
        const data = await response.json();
        
        if (!data.colaboradores || data.colaboradores.length === 0) {
            mostrarMensagem('msg-export-colaboradores', 'Nenhum colaborador encontrado para exportação', 'error');
            return;
        }
        
        // Converter para CSV
        const csv = convertToCSV(data.colaboradores, [
            'ID', 'Nome', 'Matrícula', 'CPF', 'Email', 'Cargo', 
            'Setor ID', 'Setor Nome', 'Status', 'Data Criação'
        ]);
        
        // Fazer download
        downloadCSV(csv, 'colaboradores_export.csv');
        
        mostrarMensagem('msg-export-colaboradores', `${data.total} colaboradores exportados com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao exportar colaboradores:', error);
        mostrarMensagem('msg-export-colaboradores', 'Erro ao exportar colaboradores: ' + error.message, 'error');
    }
}

/**
 * Importar ativos
 */
async function importarAtivos() {
    const fileInput = document.getElementById('arquivo-ativos');
    const file = fileInput.files[0];
    
    if (!file) {
        mostrarMensagem('msg-import-ativos', 'Por favor, selecione um arquivo CSV', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        mostrarMensagem('msg-import-ativos', 'Arquivo deve ser do tipo CSV', 'error');
        return;
    }
    
    try {
        mostrarMensagem('msg-import-ativos', 'Processando arquivo...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/ativos/import', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro no servidor');
        }
        
        let mensagem = `Importação concluída: ${result.sucessos} sucessos`;
        if (result.erros > 0) {
            mensagem += `, ${result.erros} erros`;
        }
        
        const tipo = result.erros > 0 ? 'info' : 'success';
        mostrarMensagem('msg-import-ativos', mensagem, tipo);
        
        // Mostrar detalhes dos erros se houver
        if (result.detalhes_erros && result.detalhes_erros.length > 0) {
            console.log('Erros na importação:', result.detalhes_erros);
            
            // Criar lista de erros para mostrar
            const listaErros = result.detalhes_erros.join('\n');
            setTimeout(() => {
                mostrarMensagem('msg-import-ativos', 
                    `${mensagem}\n\nPrimeiros erros:\n${listaErros}`, 'error');
            }, 2000);
        }
        
        // Limpar input após importação bem-sucedida
        if (result.sucessos > 0) {
            fileInput.value = '';
        }
        
    } catch (error) {
        console.error('Erro na importação:', error);
        mostrarMensagem('msg-import-ativos', 'Erro na importação: ' + error.message, 'error');
    }
}

/**
 * Importar colaboradores
 */
async function importarColaboradores() {
    const fileInput = document.getElementById('arquivo-colaboradores');
    const file = fileInput.files[0];
    
    if (!file) {
        mostrarMensagem('msg-import-colaboradores', 'Por favor, selecione um arquivo CSV', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        mostrarMensagem('msg-import-colaboradores', 'Arquivo deve ser do tipo CSV', 'error');
        return;
    }
    
    try {
        mostrarMensagem('msg-import-colaboradores', 'Processando arquivo...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/colaboradores/import', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro no servidor');
        }
        
        let mensagem = `Importação concluída: ${result.sucessos} sucessos`;
        if (result.erros > 0) {
            mensagem += `, ${result.erros} erros`;
        }
        
        const tipo = result.erros > 0 ? 'info' : 'success';
        mostrarMensagem('msg-import-colaboradores', mensagem, tipo);
        
        // Mostrar detalhes dos erros se houver
        if (result.detalhes_erros && result.detalhes_erros.length > 0) {
            console.log('Erros na importação:', result.detalhes_erros);
            
            // Criar lista de erros para mostrar
            const listaErros = result.detalhes_erros.join('\n');
            setTimeout(() => {
                mostrarMensagem('msg-import-colaboradores', 
                    `${mensagem}\n\nPrimeiros erros:\n${listaErros}`, 'error');
            }, 2000);
        }
        
        // Limpar input após importação bem-sucedida
        if (result.sucessos > 0) {
            fileInput.value = '';
        }
        
    } catch (error) {
        console.error('Erro na importação:', error);
        mostrarMensagem('msg-import-colaboradores', 'Erro na importação: ' + error.message, 'error');
    }
}

/**
 * Baixar exemplo de CSV para ativos
 */
function baixarExemploAtivos() {
    const csvContent = `tipo,condicao,valor,unidade_negocio_id,marca_id,modelo,patrimonio,serie,so_versao,processador,memoria,hd,acessorios,imei_slot,operadora_id,numero,tipo_chip
smartphone,novo,1500,1,1,iPhone 13,,,,,,,Capa + película,123456789012345,,,
notebook,usado,3000,1,3,Latitude 5520,PAT001,SN123456,Windows 11,Intel i5,8GB,256GB SSD,Mouse + teclado,,,,,
desktop,novo,2500,1,3,OptiPlex 7090,PAT002,SN789012,Windows 11,Intel i7,16GB,1TB HDD,Monitor + teclado,,,,,
chip_sim,novo,50,,,,,,,,,,,,1,21987654321,dados`;
    
    downloadCSV(csvContent, 'exemplo_ativos.csv');
    mostrarMensagem('msg-import-ativos', 'Arquivo de exemplo baixado!', 'success');
}

/**
 * Baixar exemplo de CSV para colaboradores
 */
function baixarExemploColaboradores() {
    // Gerar timestamp para tornar dados únicos
    const timestamp = new Date().getTime();
    const csvContent = `nome,email,matricula,cpf,cargo,setor_id,status
Joao Silva,joao${timestamp}@empresa.com,${timestamp}01,111.222.333-44,Desenvolvedor,1,ativo
Maria Santos,maria${timestamp}@empresa.com,${timestamp}02,555.666.777-88,Analista,2,ativo
Pedro Costa,pedro${timestamp}@empresa.com,${timestamp}03,999.888.777-66,Gerente,1,ativo`;
    
    downloadCSV(csvContent, 'exemplo_colaboradores.csv');
    mostrarMensagem('msg-import-colaboradores', 'Arquivo de exemplo baixado!', 'success');
}

/**
 * Funções utilitárias para CSV
 */

function convertToCSV(data, headers) {
    // Mapear dados baseado nos headers
    const keyMap = {
        'ID': 'id',
        'Tipo': 'tipo',
        'Condição': 'condicao',
        'Valor': 'valor',
        'Usuário Atual': 'usuario_atual',
        'Unidade Negócio ID': 'unidade_negocio_id',
        'Unidade Negócio Nome': 'unidade_negocio_nome',
        'Marca ID': 'marca_id',
        'Marca Nome': 'marca_nome',
        'Modelo': 'modelo',
        'Patrimônio': 'patrimonio',
        'Série': 'serie',
        'SO Versão': 'so_versao',
        'Processador': 'processador',
        'Memória': 'memoria',
        'HD': 'hd',
        'Acessórios': 'acessorios',
        'IMEI Slot': 'imei_slot',
        'Operadora ID': 'operadora_id',
        'Operadora Nome': 'operadora_nome',
        'Número': 'numero',
        'Tipo Chip': 'tipo_chip',
        'Data Criação': 'created_at',
        // Manter campos antigos para compatibilidade
        'Marca': 'marca',
        'Número Série': 'numero_serie',
        'Status': 'status',
        'Unidade': 'unidade',
        'Detalhes': 'detalhes',
        // Campos de colaboradores
        'Nome': 'nome',
        'Matrícula': 'matricula',
        'CPF': 'cpf',
        'Email': 'email',
        'Cargo': 'cargo',
        'Setor ID': 'setor_id',
        'Setor Nome': 'setor_nome',
        'Data Criação': 'data_criacao'
    };
    
    const rows = data.map(item => {
        return headers.map(header => {
            const key = keyMap[header] || header.toLowerCase().replace(/\s+/g, '_');
            const value = item[key] || '';
            return sanitizeValue(value);
        });
    });
    
    // Combinar headers e rows
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function sanitizeValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    // Converter para string e escapar aspas duplas
    return String(value).replace(/"/g, '""');
}

function downloadCSV(csvContent, filename) {
    try {
        // Criar blob sem BOM para evitar problemas de parsing
        const blob = new Blob([csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpar URL do objeto após uso
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
            throw new Error('Download não suportado pelo navegador');
        }
    } catch (error) {
        console.error('Erro ao fazer download:', error);
        throw new Error('Falha ao baixar arquivo CSV');
    }
}

// Disponibilizar funções no escopo global
window.exportarAtivos = exportarAtivos;
window.exportarColaboradores = exportarColaboradores;
window.importarAtivos = importarAtivos;
window.importarColaboradores = importarColaboradores;
window.baixarExemploAtivos = baixarExemploAtivos;
window.baixarExemploColaboradores = baixarExemploColaboradores;