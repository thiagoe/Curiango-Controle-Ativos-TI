"""
Utility functions for safe data access and error handling
"""
import logging

logger = logging.getLogger("app")

def safe_getattr(obj, attr, default=None):
    """
    Safely get attribute from object, with logging for missing attributes
    """
    try:
        return getattr(obj, attr, default)
    except AttributeError as e:
        logger.warning(f"Campo '{attr}' não encontrado no objeto {type(obj).__name__}: {e}")
        return default

def safe_dict_update(target_dict, source_obj, field_mapping):
    """
    Safely update dictionary with object attributes
    
    Args:
        target_dict: Dictionary to update
        source_obj: Source object to get attributes from  
        field_mapping: Dict mapping target_key -> source_attribute_name
    """
    for target_key, source_attr in field_mapping.items():
        try:
            value = getattr(source_obj, source_attr, None)
            target_dict[target_key] = value
        except AttributeError as e:
            logger.warning(f"Campo '{source_attr}' não existe em {type(source_obj).__name__}: {e}")
            target_dict[target_key] = None