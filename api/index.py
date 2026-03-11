from flask import Flask, request, jsonify
from functools import wraps
from flask_cors import CORS
from database import get_supabase_client, save_interaction
from workflow import process_ai_response
from auth import login as auth_login, get_user_from_token

app = Flask(__name__)
CORS(app)
supabase = get_supabase_client()

# ─────────────────────────────────────────────
# Middleware de autenticación
# ─────────────────────────────────────────────

def require_auth(f):
    """Decorador para proteger endpoints que requieren autenticación."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"status": "error", "message": "Authorization header requerido"}), 401
        
        try:
            user = get_user_from_token(auth_header)
            # Pasar el usuario al endpoint
            return f(user=user, *args, **kwargs)
        except ValueError as e:
            return jsonify({"status": "error", "message": str(e)}), 401
    
    return decorated_function

# ─────────────────────────────────────────────
# AUTH ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/auth/login', methods=['POST'])
def login_handler():
    print("Entrando a login")
    """
    Endpoint de login.
    Body: { "groupCode": string, "studentCode": string }
    """
    try:
        data = request.json
        group_code = data.get("groupCode")
        student_code = data.get("studentCode")
        
        if not group_code or not student_code:
            return jsonify({
                "status": "error",
                "message": "groupCode y studentCode son requeridos"
            }), 400
        
        # Validar contra Supabase
        result = auth_login(group_code, student_code)
        
        return jsonify({
            "status": "success",
            "token": result["token"],
            "user": result["user"]
        })
    
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500

@app.route('/auth/me', methods=['GET'])
@require_auth
def me_handler(user=None):
    """
    Endpoint para obtener el usuario actual.
    Requiere Authorization header con JWT token.
    """
    return jsonify({
        "status": "success",
        "user": user
    })

@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout_handler(user=None):
    """
    Endpoint de logout.
    Solo invalida el token en el cliente (el token no se almacena en servidor).
    """
    return jsonify({
        "status": "success",
        "message": "Sesión cerrada correctamente"
    })

@app.route('/auth/consent', methods=['PUT'])
@require_auth
def update_consent_handler(user=None):
    """
    Endpoint para actualizar el estado de consentimiento del estudiante.
    Body: { "consentimiento": boolean }
    """
    try:
        data = request.json
        consentimiento = data.get("consentimiento")
        
        if consentimiento is None:
            return jsonify({
                "status": "error",
                "message": "consentimiento es requerido"
            }), 400
        
        # Actualizar en la tabla estudiantes
        student_code = user["studentCode"]
        result = supabase.table("estudiantes").update({
            "consentimiento": consentimiento
        }).eq("identificador_estudiante", student_code).execute()
        
        if not result.data:
            raise ValueError("No se pudo actualizar el consentimiento del estudiante")
        
        return jsonify({
            "status": "success",
            "message": "Consentimiento actualizado",
            "consentimiento": consentimiento
        })
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─────────────────────────────────────────────
# CHAT ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/api/chat', methods=['POST'])
@require_auth
def chat_handler(user=None):
    #print(data)
    try:
        data = request.json
        user_msg = data.get("content")
        sesion_id = user["sesion_id"]
        group_code = user["groupCode"]  # Usar ID del usuario 
        student_id = user["studentCode"]  # Usar ID del usuario

        # 1. Obtener la sesión para ver si ya tiene un thread_id
        sesion_data = supabase.table("grupos").select("thread_id").eq("codigo_grupo", group_code).single().execute()
        current_thread_id = sesion_data.data.get("thread_id") if sesion_data.data else None

        grupo_data = supabase.table("grupos").select("id").eq("codigo_grupo", group_code).single().execute()
        group_id = grupo_data.data.get("id")

        estudiante_res = supabase.table("estudiantes").select("id").eq("identificador_estudiante", student_id).single().execute()
        estudiante_id = estudiante_res.data.get("id")
        # 2. Guardar el mensaje del estudiante
        res_user = save_interaction(supabase, sesion_id, "user", user_msg, estudiante_id,)
        pregunta_id = res_user.data[0]['id']

        # 3. Procesar con OpenAI Agent Builder
        #ai_text, """final_thread_id"""
        ai_text = process_ai_response(user_msg, supabase, estudiante_id)
        print("Ai text:", ai_text)

        #if not current_thread_id and final_thread_id:
        #    supabase.table("grupos").update({"thread_id": final_thread_id}).eq("codigo_grupo", group_code).execute()
        # 4. Guardar la respuesta de la IA vinculada a la pregunta
        save_interaction(supabase, sesion_id, "assistant", ai_text, reply_to=pregunta_id)

        return jsonify({
            "status": "success",
            "message": ai_text
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check para verificar que el servidor está activo."""
    return jsonify({"status": "ok", "message": "EcoDialoga Backend está activo"}), 200

# Requerido para Vercel
def handler(request):
    return app(request)

if __name__ == '__main__':
    # Esto asegura que el servidor corra en el puerto 5000 cuando hagas 'python index.py'
    app.run(host='0.0.0.0', port=5000, debug=True)