from flask import Blueprint, request, jsonify, session, url_for
from ..core.ldap_auth import authenticate_user, is_authorized
from ..services.auditoria_service import log_audit
from datetime import datetime, timedelta
import logging
import os
import random

bp = Blueprint("auth", __name__)
logger = logging.getLogger("app")

@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"status": "error", "message": "Credenciais não informadas."}), 400

    auth = authenticate_user(username, password)
    if auth.get("status") != "success":
        logger.info(f"Login falhou para {username}: {auth.get('message')}")
        return jsonify(auth), 401

    groups = auth.get("groups", [])
    if not is_authorized(groups):
        logger.warning(f"Acesso negado. Usuário {username} não pertence aos grupos permitidos. Grupos: {groups}")
        return jsonify({"status": "forbidden", "message": "Usuário sem permissão de acesso."}), 403

    session.permanent = True
    session["user"] = {
        "username": auth["username"],
        "full_name": auth["full_name"],
        "groups": groups,
    }
    session["last_activity"] = datetime.now().isoformat()
    session["login_time"] = datetime.now().isoformat()
    
    # Log de auditoria para login
    log_audit(
        acao="LOGIN",
        descricao=f"Login realizado com sucesso",
        dados_novos={"username": auth["username"], "full_name": auth["full_name"]}
    )
    
    logger.info(f"Login bem-sucedido: {username}")
    return jsonify({"status": "success", "user": session["user"]})

@bp.post("/logout")
def logout():
    user = session.pop("user", None)
    
    # Log de auditoria para logout
    if user:
        log_audit(
            acao="LOGOUT",
            descricao=f"Logout realizado",
            dados_antigos={"username": user.get("username"), "full_name": user.get("full_name")}
        )
    
    logger.info(f"Logout de {user.get('username') if user else 'usuário anônimo'}")
    return jsonify({"status": "success"})

@bp.get("/me")
def get_current_user_info():
    """Retorna informações do usuário atual"""
    from ..core.auth import api_auth_required, get_current_user, get_user_full_name, get_username
    
    # Verificar autenticação
    user = get_current_user()
    if not user:
        return jsonify({"error": "Não autenticado"}), 401
    
    return jsonify({
        "username": get_username(),
        "full_name": get_user_full_name(),
        "authenticated": True,
        "groups": user.get("groups", [])
    })

@bp.post("/activity")
def update_activity():
    """Atualiza timestamp de última atividade do usuário"""
    if not session.get("user"):
        return jsonify({"error": "Não autenticado"}), 401
    
    session["last_activity"] = datetime.now().isoformat()
    return jsonify({"status": "success", "timestamp": session["last_activity"]})

@bp.get("/session-status")
def get_session_status():
    """Retorna status da sessão incluindo tempo restante"""
    if not session.get("user"):
        return jsonify({"authenticated": False, "expired": True}), 401
    
    last_activity = session.get("last_activity")
    login_time = session.get("login_time")
    
    if not last_activity:
        return jsonify({"authenticated": False, "expired": True}), 401
    
    try:
        last_activity_time = datetime.fromisoformat(last_activity)
        login_datetime = datetime.fromisoformat(login_time) if login_time else last_activity_time
        current_time = datetime.now()
        
        # Calcular tempo desde última atividade
        inactive_time = current_time - last_activity_time
        total_session_time = current_time - login_datetime
        
        # 1 hora de timeout por inatividade
        timeout_limit = timedelta(hours=1)
        time_remaining = timeout_limit - inactive_time
        
        # Verificar se sessão expirou
        if inactive_time >= timeout_limit:
            # Limpar sessão expirada
            session.clear()
            return jsonify({
                "authenticated": False,
                "expired": True,
                "reason": "inactivity_timeout"
            }), 401
        
        # Retornar status da sessão
        return jsonify({
            "authenticated": True,
            "expired": False,
            "time_remaining_minutes": int(time_remaining.total_seconds() / 60),
            "time_remaining_seconds": int(time_remaining.total_seconds()),
            "inactive_minutes": int(inactive_time.total_seconds() / 60),
            "total_session_minutes": int(total_session_time.total_seconds() / 60),
            "warning": time_remaining.total_seconds() <= 300  # Aviso nos últimos 5 minutos
        })
        
    except (ValueError, TypeError):
        # Se houver erro nos timestamps, considerar sessão inválida
        session.clear()
        return jsonify({"authenticated": False, "expired": True}), 401

@bp.get("/random-login-image")
def get_random_login_image():
    """Retorna uma imagem aleatória da pasta login para a tela de login"""
    try:
        # Caminho para a pasta de imagens de login
        from flask import current_app
        login_images_path = os.path.join(current_app.static_folder, 'img', 'login')
        
        # Verificar se a pasta existe
        if not os.path.exists(login_images_path):
            return jsonify({"error": "Pasta de imagens não encontrada"}), 404
        
        # Listar todas as imagens na pasta
        image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.webp')
        images = [f for f in os.listdir(login_images_path) 
                 if f.lower().endswith(image_extensions)]
        
        if not images:
            return jsonify({"error": "Nenhuma imagem encontrada"}), 404
        
        # Selecionar uma imagem aleatória
        random_image = random.choice(images)
        image_url = url_for('static', filename=f'img/login/{random_image}')
        
        return jsonify({
            "image": image_url,
            "filename": random_image
        })
        
    except Exception as e:
        logger.error(f"Erro ao carregar imagem aleatória: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500