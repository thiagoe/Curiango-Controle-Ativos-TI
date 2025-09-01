from flask import Flask, render_template, session, redirect, request, jsonify
from flask_cors import CORS
from .core.config import Config
from .core.db import db
from .core.mail import mail
from .core.logger import setup_logging

def register_blueprints(app: Flask):
    from .api.auth import bp as auth_bp
    from .api.ativos import bp as ativos_bp
    from .api.colaboradores import bp as colaboradores_bp
    from .api.parametros import bp as parametros_bp
    from .api.auditoria import bp as auditoria_bp
    from .api.dashboard import bp as dashboard_bp
    from .api.setores import bp as setores_bp
    from .api.health import bp as health_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(ativos_bp, url_prefix="/api/ativos")
    app.register_blueprint(colaboradores_bp, url_prefix="/api/colaboradores")
    app.register_blueprint(parametros_bp, url_prefix="/api/parametros")
    app.register_blueprint(auditoria_bp, url_prefix="/api/auditoria")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(setores_bp, url_prefix="/api/setores")
    app.register_blueprint(health_bp, url_prefix="/api")

def create_app(config_class=Config):
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(config_class)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Logging
    setup_logging(level=app.config["LOG_LEVEL"], log_file=app.config["LOG_FILE"])

    db.init_app(app)
    mail.init_app(app)

    register_blueprints(app)
    
    # Inicializar parâmetros padrão do sistema
    with app.app_context():
        from .services.parametros_service import inicializar_parametros_padrao
        try:
            inicializar_parametros_padrao()
        except Exception as e:
            app.logger.warning(f"Erro ao inicializar parâmetros padrão: {e}")

    # Context processor para disponibilizar informações do usuário em todos os templates
    @app.context_processor
    def inject_user():
        user = session.get("user", {})
        return {
            "current_user": user,
            "user_name": user.get("full_name", "Usuário"),
            "username": user.get("username", ""),
            "is_authenticated": bool(user)
        }

    # Middleware de proteção - exige autenticação para páginas web, mas não para APIs
    @app.before_request
    def protect_views():
        from datetime import datetime, timedelta
        
        # Rotas que não precisam de autenticação
        public_paths = ["/auth/login", "/auth/random-login-image", "/login", "/static", "/api"]
        
        # Verifica se é uma rota pública
        if any(request.path.startswith(path) for path in public_paths):
            return
            
        # Verifica se usuário está autenticado
        user = session.get("user")
        if not user:
            app.logger.warning(f"Acesso negado à rota {request.path} - usuário não autenticado")
            return redirect("/login")
            
        # Verificar timeout por inatividade (apenas para páginas web, não APIs)
        if not request.path.startswith("/api"):
            last_activity = session.get("last_activity")
            if last_activity:
                try:
                    last_activity_time = datetime.fromisoformat(last_activity)
                    current_time = datetime.now()
                    inactive_time = current_time - last_activity_time
                    
                    # 1 hora de timeout por inatividade
                    if inactive_time >= timedelta(hours=1):
                        app.logger.info(f"Sessão expirada por inatividade para usuário {user.get('username')} - {inactive_time}")
                        session.clear()
                        return redirect("/login")
                        
                except (ValueError, TypeError):
                    # Se houver erro no timestamp, limpar sessão
                    app.logger.warning(f"Timestamp inválido na sessão para usuário {user.get('username')}")
                    session.clear()
                    return redirect("/login")


    @app.get("/login")
    def login_view():
        return render_template("login.html", page="login")

    @app.get("/")
    def index():
        return render_template("dashboard.html", page="dashboard")

    @app.get("/estoque")
    def estoque_view():
        return render_template("estoque.html", page="estoque")

    @app.get("/colaboradores")
    def colaboradores_view():
        return render_template("colaboradores.html", page="colaboradores")

    @app.get("/parametrizacao")
    def parametrizacao_view():
        return render_template("parametrizacao.html", page="parametrizacao")

    @app.get("/auditoria")
    def auditoria_view():
        return render_template("auditoria.html", page="auditoria")

    return app