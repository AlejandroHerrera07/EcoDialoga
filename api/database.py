import os
from dotenv import load_dotenv
from supabase import create_client, Client


load_dotenv()

def get_supabase_client() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return create_client(url, key)

def save_interaction(supabase, sesion_id, role, content, student_id=None, reply_to=None):
    data = {
        "sesion_id": sesion_id,
        "rol": role,
        "contenido": content,
        "es_relevante": True if role == "assistant" else False
    }
    if student_id:
        data["estudiante_id"] = student_id
    if reply_to:
        data["reply_to"] = reply_to
        
    return supabase.table("interacciones").insert(data).execute()