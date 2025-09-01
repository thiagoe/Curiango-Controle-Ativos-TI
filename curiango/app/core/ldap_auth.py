import logging
from ldap3 import Server, Connection, SUBTREE
from ldap3.core.exceptions import LDAPBindError, LDAPSocketOpenError, LDAPExceptionError
from flask import current_app

logger = logging.getLogger("app")

def authenticate_user(username, password):
    LDAP_HOST = current_app.config.get("LDAP_HOST")
    LDAP_DOMAIN = current_app.config.get("LDAP_DOMAIN")

    if not LDAP_HOST or not LDAP_DOMAIN:
        logger.error("Configurações LDAP não encontradas no arquivo .env")
        return {"status": "error", "message": "Configuração LDAP não disponível."}

    server = None
    conn = None
    try:
        logger.info(f"Conectando ao servidor LDAP: {LDAP_HOST}")
        server = Server(LDAP_HOST, use_ssl=False)

        user_bind_dn = f"{username}@{LDAP_DOMAIN}"
        logger.info(f"Tentando bind LDAP para DN: {user_bind_dn}")
        conn = Connection(server, user=user_bind_dn, password=password, auto_bind=True)

        logger.info(f"Autenticação LDAP bem-sucedida para o usuário: {username}")
        full_name, user_groups = get_user_info_from_ad(conn, username)
        return {
            "status": "success",
            "username": username,
            "full_name": full_name,
            "groups": user_groups
        } if full_name else {
            "status": "warning",
            "message": "Autenticação bem-sucedida, mas não foi possível obter informações detalhadas do usuário."
        }
    except LDAPBindError as e:
        logger.warning(f"Falha de autenticação para o usuário {username}: {e}")
        return {"status": "error", "message": "Usuário ou senha inválidos."}
    except LDAPSocketOpenError as e:
        logger.error(f"Servidor LDAP {LDAP_HOST} inacessível: {e}")
        return {"status": "error", "message": "Não foi possível conectar ao servidor de autenticação."}
    except LDAPExceptionError as e:
        logger.error(f"Erro LDAP inesperado no login de {username}: {e}")
        return {"status": "error", "message": f"Erro de operação LDAP: {e}"}
    except Exception as e:
        logger.critical(f"Erro inesperado na autenticação de {username}: {e}")
        return {"status": "error", "message": f"Erro inesperado: {e}"}
    finally:
        if conn and conn.bound:
            logger.info(f"Fechando conexão LDAP para o usuário {username}.")
            conn.unbind()
        else:
            logger.info("Nenhuma conexão LDAP ativa para fechar ou já fechada.")

def get_user_info_from_ad(ldap_conn, username):
    BASE_DN = current_app.config.get("LDAP_BASE_DN")
    
    if not BASE_DN:
        logger.error("LDAP_BASE_DN não configurado no arquivo .env")
        return None, None
    filter_str = f"(sAMAccountName={username})"
    attributes = ["cn", "memberof"]

    logger.info(f"Buscando usuário no LDAP: {username} com filtro: {filter_str}")
    try:
        success = ldap_conn.search(
            search_base=BASE_DN,
            search_filter=filter_str,
            search_scope=SUBTREE,
            attributes=attributes
        )
        if success and ldap_conn.entries:
            entry = ldap_conn.entries[0]
            logger.info(f"Usuário {username} encontrado. DN: {entry.entry_dn}")

            full_name = str(entry.cn) if entry.cn else 'Nome Desconhecido'
            groups = []
            if entry.memberOf:
                for group_dn in entry.memberOf:
                    group_name = next((part[3:] for part in group_dn.split(',') if part.lower().startswith("cn=")), "")
                    if group_name:
                        groups.append(group_name)
            logger.info(f"Grupos de {username}: {groups}")
            return full_name, groups
        logger.warning(f"Usuário {username} não encontrado no AD.")
        return None, None
    except Exception as e:
        logger.error(f"Erro ao obter info do usuário {username}: {e}")
        return None, None

def is_authorized(groups):
    allowed = current_app.config.get("LDAP_ALLOWED_GROUPS", [])
    if not allowed:
        logger.warning("LDAP_ALLOWED_GROUPS não configurado - negando acesso")
        return False
    return any(g in allowed for g in (groups or []))

def is_admin(groups):
    """Verifica se o usuário pertence aos grupos administrativos"""
    admin_groups = current_app.config.get("LDAP_ADMIN_GROUPS", [])
    if not admin_groups:
        logger.warning("LDAP_ADMIN_GROUPS não configurado - negando privilégios administrativos")
        return False
    return any(g in admin_groups for g in (groups or []))