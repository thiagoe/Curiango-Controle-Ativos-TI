import logging

logger = logging.getLogger("app")

def render_pdf_from_html(html_str: str) -> bytes:
    """
    Fallback para geração de PDF quando WeasyPrint não está disponível.
    Retorna o HTML como texto em formato de bytes.
    """
    logger.warning("WeasyPrint não disponível - retornando HTML como texto")
    
    # Converter HTML para formato mais legível para impressão
    clean_html = html_str.replace('<br>', '\n').replace('<p>', '\n').replace('</p>', '\n')
    
    # Remover tags HTML básicas
    import re
    clean_text = re.sub('<[^<]+?>', '', clean_html)
    
    return clean_text.encode('utf-8')