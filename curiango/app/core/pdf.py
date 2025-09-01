import logging

logger = logging.getLogger("app")

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
    logger.info("WeasyPrint disponível para geração de PDF")
except (ImportError, OSError) as e:
    WEASYPRINT_AVAILABLE = False
    logger.warning(f"WeasyPrint não disponível: {e}")
    from .pdf_fallback import render_pdf_from_html as _fallback_render

def render_pdf_from_html(html_str: str) -> bytes:
    """
    Renderiza HTML para PDF usando WeasyPrint, ou fallback se não disponível
    """
    if WEASYPRINT_AVAILABLE:
        try:
            return HTML(string=html_str).write_pdf()
        except Exception as e:
            logger.error(f"Erro ao gerar PDF com WeasyPrint: {e}")
            logger.warning("Usando fallback para geração de documento")
            return _fallback_render(html_str)
    else:
        logger.warning("WeasyPrint não disponível - usando fallback")
        return _fallback_render(html_str)