# Importa a função create_app do módulo app
# Esta função é responsável por inicializar e configurar a aplicação Flask
from app import create_app

# Cria uma instância da aplicação Flask chamando a função create_app
app = create_app()

# Verifica se este arquivo está sendo executado diretamente (não importado como módulo)
if __name__ == "__main__":
    # Inicia o servidor de desenvolvimento Flask com modo debug ativado
    # Debug=True permite:
    # - Recarregamento automático quando o código é alterado
    # - Mensagens detalhadas de erro no navegador
    # - Debugger interativo no navegador
    app.run(debug=True, host='0.0.0.0', port=5000)