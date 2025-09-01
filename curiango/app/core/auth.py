# -*- coding: utf-8 -*-
from functools import wraps
from flask import session, jsonify, request
import logging

logger = logging.getLogger("app")

def login_required(f):
    """
    Decorador que exige autenticacao para acessar uma rota.
    Verifica se o usuario esta autenticado via sessao.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get("user")
        if not user:
            logger.warning(f"Acesso negado a rota {request.endpoint} - usuario nao autenticado")
            return jsonify({
                "error": "Unauthorized", 
                "message": "Authentication required",
                "code": "AUTH_REQUIRED"
            }), 401
        return f(*args, **kwargs)
    return decorated_function

def api_auth_required(f):
    """
    Decorador especifico para APIs que tambem pode verificar JWT se necessario.
    Por enquanto usa a mesma logica de sessao.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get("user")
        if not user:
            logger.warning(f"API access denied to {request.endpoint} - user not authenticated")
            return jsonify({
                "error": "Unauthorized", 
                "message": "Authentication required to access this API",
                "code": "API_AUTH_REQUIRED"
            }), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """
    Retorna o usuario atual da sessao.
    """
    return session.get("user")

def is_authenticated():
    """
    Verifica se o usuario atual esta autenticado.
    """
    return bool(session.get("user"))

def get_username():
    """
    Retorna o username do usuario atual.
    """
    user = session.get("user", {})
    return user.get("username", "anonymous")

def get_user_full_name():
    """
    Retorna o nome completo do usuario atual.
    """
    user = session.get("user", {})
    return user.get("full_name", user.get("username", "Usuário Anônimo"))

def get_user_groups():
    """
    Retorna os grupos do usuario atual.
    """
    user = session.get("user", {})
    return user.get("groups", [])

def is_user_admin():
    """
    Verifica se o usuario atual tem privilegios administrativos.
    """
    from .ldap_auth import is_admin
    user_groups = get_user_groups()
    return is_admin(user_groups)

def admin_required(f):
    """
    Decorador que exige privilegios administrativos para acessar uma rota.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get("user")
        if not user:
            logger.warning(f"Acesso negado a rota {request.endpoint} - usuario nao autenticado")
            return jsonify({
                "error": "Unauthorized", 
                "message": "Authentication required",
                "code": "AUTH_REQUIRED"
            }), 401
        
        if not is_user_admin():
            logger.warning(f"Acesso negado a rota {request.endpoint} - usuario {get_username()} nao tem privilegios administrativos")
            return jsonify({
                "error": "Forbidden", 
                "message": "Administrator privileges required",
                "code": "ADMIN_REQUIRED"
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function