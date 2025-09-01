/**
 * Módulo para exportação de dados em formato CSV
 * Funcionalidades de exportação para diferentes tipos de dados
 */

// Configurações de exportação
const ExportConfig = {
  ativos: {
    endpoint: '/api/ativos/export',
    filename: 'ativos_export.csv',
    headers: [
      'ID', 'Tipo', 'Marca', 'Modelo', 'Patrimônio', 'Número Série', 
      'Valor', 'Condição', 'Status', 'Usuário Atual', 'Unidade', 
      'Observações', 'Detalhes', 'Data Aquisição', 'Data Criação'
    ]
  },
  // Futuras exportações podem ser adicionadas aqui
  colaboradores: {
    endpoint: '/api/colaboradores/export',
    filename: 'colaboradores_export.csv',
    headers: ['ID', 'Nome', 'Email', 'Cargo', 'Setor', 'Status']
  }
};

/**
 * Classe principal para exportação CSV
 */
class CSVExporter {
  /**
   * Exporta dados para CSV
   * @param {string} type - Tipo de dados a exportar (ativos, colaboradores, etc.)
   * @param {Function} showToast - Função para mostrar notificações
   */
  static async export(type, showToast) {
    try {
      const config = ExportConfig[type];
      if (!config) {
        throw new Error(`Tipo de exportação '${type}' não configurado`);
      }

      // Mostrar feedback de início
      showToast('Preparando exportação...');
      
      // Fazer requisição para obter os dados
      const response = await fetch(config.endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Erro no servidor`);
      }
      
      const data = await response.json();
      
      // Verificar se há dados para exportar
      if (!data[type] || data[type].length === 0) {
        showToast('Nenhum dado encontrado para exportação');
        return;
      }
      
      // Converter para CSV
      const csv = CSVExporter.convertToCSV(data[type], config.headers);
      
      // Fazer download
      CSVExporter.downloadCSV(csv, config.filename);
      
      // Mostrar feedback de sucesso
      showToast(`${data.total || data[type].length} registros exportados com sucesso!`);
      
    } catch (error) {
      console.error(`Erro ao exportar ${type}:`, error);
      showToast('Erro ao exportar dados: ' + error.message);
    }
  }

  /**
   * Converte array de objetos para formato CSV
   * @param {Array} data - Array de objetos com os dados
   * @param {Array} headers - Array com os cabeçalhos das colunas
   * @returns {string} - String no formato CSV
   */
  static convertToCSV(data, headers) {
    // Mapear dados baseado nos headers
    const rows = data.map(item => {
      return headers.map(header => {
        const key = CSVExporter.getObjectKey(item, header);
        const value = item[key] || '';
        
        // Tratar valores especiais
        return CSVExporter.sanitizeValue(value);
      });
    });
    
    // Combinar headers e rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Mapeia o nome do header para a chave do objeto
   * @param {Object} item - Objeto com os dados
   * @param {string} header - Nome do header
   * @returns {string} - Chave correspondente no objeto
   */
  static getObjectKey(item, header) {
    const keyMap = {
      'ID': 'id',
      'Tipo': 'tipo',
      'Marca': 'marca',
      'Modelo': 'modelo',
      'Patrimônio': 'patrimonio',
      'Número Série': 'numero_serie',
      'Valor': 'valor',
      'Condição': 'condicao',
      'Status': 'status',
      'Usuário Atual': 'usuario_atual',
      'Unidade': 'unidade',
      'Detalhes': 'detalhes',
      'Data Aquisição': 'data_aquisicao',
      'Data Criação': 'created_at',
      'Nome': 'nome',
      'Email': 'email',
      'Cargo': 'cargo',
      'Setor': 'setor'
    };
    
    return keyMap[header] || header.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Sanitiza valores para CSV (escape de aspas duplas)
   * @param {any} value - Valor a ser sanitizado
   * @returns {string} - Valor sanitizado
   */
  static sanitizeValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Converter para string e escapar aspas duplas
    return String(value).replace(/"/g, '""');
  }

  /**
   * Faz download do arquivo CSV
   * @param {string} csvContent - Conteúdo CSV
   * @param {string} filename - Nome do arquivo
   */
  static downloadCSV(csvContent, filename) {
    try {
      // Adicionar BOM para compatibilidade com Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
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
}

/**
 * Funções de conveniência para exportações específicas
 */

// Exportar ativos
async function exportarAtivos(showToast) {
  return CSVExporter.export('ativos', showToast);
}

// Exportar colaboradores (para uso futuro)
async function exportarColaboradores(showToast) {
  return CSVExporter.export('colaboradores', showToast);
}

// Disponibilizar no escopo global
window.CSVExporter = CSVExporter;
window.exportarAtivos = exportarAtivos;
window.exportarColaboradores = exportarColaboradores;