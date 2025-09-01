import re

def sanitize_query_param(s: str) -> str:
    if s is None:
        return ""
    return re.sub(r"[^\\w\\s\\-@.]", "", s)