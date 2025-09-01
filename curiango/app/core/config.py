import os
from dotenv import load_dotenv
import pytz
from datetime import timedelta
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        "mysql+pymysql://usuario_app:SUA_SENHA_AQUI@localhost:3306/sistema_ativos_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"
    
    # Configurações de Sessão
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)  # 1 hora de timeout
    SESSION_REFRESH_EACH_REQUEST = False  # Não renova automaticamente a cada request
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # E-mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "no-reply@example.com")

    # LDAP
    LDAP_HOST = os.getenv("LDAP_HOST")
    LDAP_DOMAIN = os.getenv("LDAP_DOMAIN")
    LDAP_BASE_DN = os.getenv("LDAP_BASE_DN")
    LDAP_ALLOWED_GROUPS = os.getenv("LDAP_ALLOWED_GROUPS", "").split(",") if os.getenv("LDAP_ALLOWED_GROUPS") else []
    LDAP_ADMIN_GROUPS = os.getenv("LDAP_ADMIN_GROUPS", "").split(",") if os.getenv("LDAP_ADMIN_GROUPS") else []

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "/tmp/curiango_app.log")
    
    # Timezone
    TIMEZONE = pytz.timezone('America/Sao_Paulo')  # GMT-3