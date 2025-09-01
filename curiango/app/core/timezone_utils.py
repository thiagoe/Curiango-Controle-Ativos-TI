from datetime import datetime, date
import pytz
from .config import Config

def to_local_timezone(dt):
    """Converte datetime UTC para timezone local (GMT-3)"""
    if dt is None:
        return None
    
    # Se for um objeto date (apenas data), converte para datetime
    if isinstance(dt, date) and not isinstance(dt, datetime):
        dt = datetime.combine(dt, datetime.min.time())
    
    if dt.tzinfo is None:
        # Se não tem timezone info, assume UTC
        dt = pytz.UTC.localize(dt)
    
    # Converte para timezone local
    return dt.astimezone(Config.TIMEZONE)

def to_local_isoformat(dt):
    """Converte datetime ou date para string ISO no timezone local"""
    if dt is None:
        return None
    
    # Se for um objeto date (apenas data), retorna apenas a data em formato ISO
    if isinstance(dt, date) and not isinstance(dt, datetime):
        return dt.isoformat()
    
    local_dt = to_local_timezone(dt)
    return local_dt.isoformat()

def now_local():
    """Retorna datetime atual no timezone local"""
    return datetime.now(Config.TIMEZONE)

def now_naive():
    """Retorna datetime atual naive (sem timezone) para compatibilidade com MySQL TIMESTAMP"""
    # Obtém o datetime no timezone local e remove a informação de timezone
    local_dt = datetime.now(Config.TIMEZONE)
    return local_dt.replace(tzinfo=None)