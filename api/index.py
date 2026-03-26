from flask import Flask, request, jsonify
from functools import wraps
from flask_cors import CORS
from database import get_supabase_client, save_interaction
from workflow import process_ai_response
from auth import login as auth_login, get_user_from_token
from dashboard import get_dashboard_metrics, get_recent_messages, get_grupos_list

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
        
        # Devolver con estructura consistente: { data: { token, user } }
        return jsonify({
            "data": {
                "token": result["token"],
                "user": result["user"]
            }
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
        "data": user
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
# GRUPOS ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/grupos', methods=['GET'])
@require_auth
def get_group_info(user=None):
    """
    Endpoint para obtener información del grupo.
    Query params: codigo={group_code}
    """
    try:
        codigo = request.args.get('codigo')
        
        if not codigo:
            return jsonify({
                "status": "error",
                "message": "Parámetro 'codigo' es requerido"
            }), 400
        
        # Obtener grupo de Supabase
        result = supabase.table("grupos").select("*").eq("codigo_grupo", codigo).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify([])  # Retornar array vacío si no existe
        
        return jsonify(result.data)
    
    except Exception as e:
        print(f"Error en get_group_info: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/grupos/<codigo>', methods=['PATCH'])
@require_auth
def update_group_info(codigo, user=None):
    """
    Endpoint para actualizar información del grupo.
    Body: {
        "area_curricular": string,
        "eje_ambiental": string,
        "problematica": string,
        "grado": number
    }
    """
    try:
        data = request.json
        
        # Validar que el usuario pertenece al grupo
        if user.get("groupCode") != codigo:
            return jsonify({
                "status": "error",
                "message": "No tienes permiso para actualizar este grupo"
            }), 403
        
        # Actualizar grupo en Supabase
        update_data = {
            "area_curricular": data.get("area_curricular"),
            "eje_ambiental": data.get("eje_ambiental"),
            "problematica": data.get("problematica"),
            "grado": int(data.get("grado")) if data.get("grado") else None
        }
        
        # Log para debugging
        print(f"Actualizando grupo {codigo} con datos: {update_data}")
        
        result = supabase.table("grupos").update(update_data).eq("codigo_grupo", codigo).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                "status": "error",
                "message": "No se encontró el grupo para actualizar"
            }), 404
        
        return jsonify({"status": "success", "message": "Información del grupo actualizada correctamente", "data": result.data})
    
    except Exception as e:
        print(f"Error en update_group_info: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ─────────────────────────────────────────────
# DEBUG ENDPOINTS (para diagnóstico)
# ─────────────────────────────────────────────

@app.route('/debug/interacciones-count', methods=['GET'])
def debug_interacciones_count():
    """
    Endpoint de debug para ver cuántos registros hay en la tabla interacciones
    """
    try:
        # Contar total
        result_total = supabase.table("interacciones").select("count", count="exact").execute()
        total = result_total.count if result_total.count else 0
        
        # Contar por rol
        result_assistant = supabase.table("interacciones").select("*").eq("rol", "assistant").execute()
        assistant_count = len(result_assistant.data) if result_assistant.data else 0
        
        result_user = supabase.table("interacciones").select("*").eq("rol", "user").execute()
        user_count = len(result_user.data) if result_user.data else 0
        
        # Obtener una muestra
        sample = supabase.table("interacciones").select("*").limit(5).execute().data if result_assistant.data else []
        
        return jsonify({
            "total": total,
            "assistant_count": assistant_count,
            "user_count": user_count,
            "sample": sample[:1] if sample else []
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─────────────────────────────────────────────
# DASHBOARD ENDPOINTS
# ─────────────────────────────────────────────

@app.route('/teacher/metrics', methods=['GET'])
@require_auth
def get_metrics(user=None):
    """
    Endpoint para obtener métricas del dashboard.
    Query params (todos opcionales):
      - codigo_grupo: string (ej: "ECO-2026-A")
      - fecha: string (formato ISO: YYYY-MM-DD)
    
    Retorna:
      - inter_total: Total de interacciones
      - relev_prom: Promedio de relevancia (%)
      - Promedio_calidad: Promedio de calidad (0-2)
      - calidad_promedio_data: Array de últimas 30 respuestas con calidad
      - Cada_funcion: Array con desglose por función utilizada
      - total_relevantes: Número de interacciones relevantes
      - Total_irrelevantes: Número de interacciones no relevantes
      - calidad_0, calidad_1, calidad_2: Conteos por puntuación
    """
    try:
        # Obtener parámetros de query
        codigo_grupo = request.args.get('codigo_grupo')
        fecha = request.args.get('fecha')
        
        # DEBUG: Logear qué parámetros se reciben
        print(f"\n[DEBUG] GET /teacher/metrics")
        print(f"  - codigo_grupo: {codigo_grupo}")
        print(f"  - fecha: {fecha}")
        print(f"  - Query params completos: {request.args.to_dict()}")
        
        # Llamar función de dashboard
        metrics = get_dashboard_metrics(
            supabase,
            codigo_grupo=codigo_grupo,
            fecha=fecha
        )
        
        # DEBUG: Logear resultados
        print(f"  - Status respuesta: {metrics.get('status')}")
        print(f"  - Interacciones totales: {metrics.get('inter_total')}")
        print(f"  - Funciones con datos: {sum(1 for f in metrics.get('Cada_funcion', []) if f.get('count', 0) > 0)}")
        
        return jsonify(metrics), 200
    
    except Exception as e:
        print(f"Error en get_metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/teacher/recent-messages', methods=['GET'])
@require_auth
def get_messages(user=None):
    """
    Endpoint para obtener mensajes recientes del dashboard.
    Query params (todos opcionales):
      - codigo_grupo: string (ej: "ECO-2026-A")
      - fecha_inicio: string (formato ISO: YYYY-MM-DD)
      - fecha_fin: string (formato ISO: YYYY-MM-DD)
      - limit: número (default: 50, max: 500)
    
    Retorna:
      - data: Array de mensajes recientes
      - total: Número total de mensajes
    """
    try:
        # Obtener parámetros de query
        codigo_grupo = request.args.get('codigo_grupo')
        fecha = request.args.get('fecha')
        limit = int(request.args.get('limit', 50))
        
        # Validar límite máximo
        if limit > 500:
            limit = 500
        
        # Llamar función de dashboard
        messages = get_recent_messages(
            supabase,
            codigo_grupo=codigo_grupo,
            fecha=fecha,
            limit=limit
        )
        
        return jsonify(messages), 200
    
    except Exception as e:
        print(f"Error en get_messages: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/teacher/groups', methods=['GET'])
@require_auth
def get_groups(user=None):
    """
    Endpoint para obtener lista de todos los grupos disponibles.
    
    Retorna:
      Array de grupos con estructura: { id, code, area, eje, macroEje, problematica, icon, iconBg, iconColor, status }
    """
    try:
        # Llamar función de dashboard
        grupos = get_grupos_list(supabase)
        
        return jsonify(grupos), 200
    
    except Exception as e:
        print(f"Error en get_groups: {str(e)}")
        return jsonify([]), 500

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