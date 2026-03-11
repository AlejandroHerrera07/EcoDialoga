import os
import jwt
from datetime import datetime, timedelta
from flask import Request
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuración
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
JWT_SECRET = os.environ.get("JWT_SECRET", "tu_clave_secreta_desarrollo")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_token(group_code: str, student_code: str, sesion_id: str) -> str:
    """Genera un JWT token para la sesión del usuario incluyendo el ID de sesión."""
    payload = {
        "group_code": group_code,
        "student_code": student_code,
        "sesion_id": sesion_id,  # Vinculamos la sesión al token
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verifica un JWT token y retorna el payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido")

def login(group_code: str, student_code: str) -> dict:
    """
    Valida el código de grupo y estudiante, crea una sesión y retorna el token.
    """
    try:
        # 1. Buscar el grupo por código para obtener su ID real
        group_res = (
            supabase.table("grupos")
            .select("id, codigo_grupo")
            .eq("codigo_grupo", group_code)
            .execute()
        )
        
        if not group_res.data:
            raise ValueError("Código de grupo no válido.")
        
        grupo_db_id = group_res.data[0]["id"]
        grupo_code_val = group_res.data[0]["codigo_grupo"]
        
        # 2. Buscar el estudiante y validar que pertenezca a ese grupo
        student_res = (
            supabase.table("estudiantes")
            .select("identificador_estudiante, nombre_anonimo, consentimiento")
            .eq("identificador_estudiante", student_code)
            .eq("grupo_id", grupo_db_id)
            .execute()
        )
        
        if not student_res.data:
            raise ValueError("ID de estudiante no válido para este grupo.")
        
        estudiante = student_res.data[0]
        nombre = estudiante["nombre_anonimo"]
        consentimiento = estudiante.get("consentimiento", False)
        
        # 3. CREAR EL REGISTRO DE SESIÓN (Crucial para vincular interacciones)
        # Esto evita el error de 'null value in column sesion_id'
        sesion_res = supabase.table("sesiones").insert({
            "grupo_id": grupo_db_id,
            "momento_proceso": "Diseño"
        }).execute()

        if not sesion_res.data:
            raise ValueError("Error al crear la sesión en la base de datos.")
            
        sesion_id = sesion_res.data[0]["id"]
        
        # 4. Generar token JWT con el sesion_id
        token = generate_token(
            student_code=student_code,
            group_code=grupo_code_val,
            sesion_id=sesion_id
        )
        
        return {
            "token": token,
            "user": {
                "id": student_code,
                "studentCode": student_code,
                "groupCode": grupo_code_val,
                "name": nombre,
                "role": "student",
                "sesionId": sesion_id,  # Lo enviamos para que el front lo use
                "consentimiento": consentimiento
            },
        }
    
    except Exception as e:
        raise ValueError(str(e))

def get_user_from_token(authorization_header: str) -> dict:
    """
    Extrae el usuario del header Authorization.
    """
    if not authorization_header:
        raise ValueError("Authorization header no proporcionado")
    
    try:
        parts = authorization_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise ValueError("Formato de Authorization header inválido")
        
        token = parts[1]
        payload = verify_token(token)
        
        # Obtener datos del estudiante usando el código del payload
        student_res = (
            supabase.table("estudiantes")
            .select("nombre_anonimo, identificador_estudiante, consentimiento")
            .eq("identificador_estudiante", payload["student_code"])
            .single()
            .execute()
        )
        
        student = student_res.data
        
        return {
            "id": student["identificador_estudiante"],
            "name": student["nombre_anonimo"],
            "studentCode": student["identificador_estudiante"],
            "groupCode": payload["group_code"],
            "role": "student",
            "sesion_id": payload["sesion_id"],  # Ahora el usuario lleva su sesion_id siempre
            "consentimiento": student.get("consentimiento", False)
        }
    
    except Exception as e:
        raise ValueError(f"Token inválido: {str(e)}")
