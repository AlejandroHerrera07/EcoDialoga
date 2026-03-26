import os
from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()

def get_supabase_client() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError(
            "❌ ERROR: Variables de Supabase no configuradas en Railway.\n"
            "Asegúrate de agregar en Railway → Variables:\n"
            "  - NEXT_PUBLIC_SUPABASE_URL\n"
            "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        )
    
    return create_client(url, key)

def save_interaction(supabase, sesion_id, role, content, group_code, student_id=None, student_code=None, reply_to=None, es_relevante=None, calidad_respuesta=None, funcion_utilizada=None):
    data = {
        "sesion_id": sesion_id,
        "rol": role,
        "codigo_grupo": group_code,
        "contenido": content,
    }
    if student_id:
        data["estudiante_id"] = student_id
    if student_code:
        data["identificador_estudiante"] = student_code
    if reply_to:
        data["reply_to"] = reply_to
    
    # Solo agregar métricas si es una respuesta del asistente
    if role == "assistant":
        if es_relevante is not None:
            data["es_relevante"] = es_relevante
        if calidad_respuesta is not None:
            data["calidad_respuesta"] = calidad_respuesta
        if funcion_utilizada is not None:
            data["funcion_utilizada"] = funcion_utilizada
        
    return supabase.table("interacciones").insert(data).execute()