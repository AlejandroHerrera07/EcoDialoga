from flask import Flask, request, jsonify, send_file
from functools import wraps
from flask_cors import CORS
from database import get_supabase_client, save_interaction, update_interaction_metrics
from workflow import process_ai_response, evaluate_response_metrics
from auth import login as auth_login, get_user_from_token
from dashboard import get_dashboard_metrics, get_recent_messages, get_grupos_list
from export import export_data_to_zip
import os
from threading import Thread

app = Flask(__name__)
CORS(app)
supabase = get_supabase_client()

# ─────────────────────────────────────────────
# Función para procesar métricas en background
# ─────────────────────────────────────────────

def evaluate_and_save_metrics(user_msg, ai_text, supabase, group_code, sesion_id, respuesta_id):
    """Evalúa métricas y las guarda sin bloquear la respuesta."""
    try:
        metrics = evaluate_response_metrics(user_msg, ai_text, supabase, group_code)
        
        # Actualizar la interacción con las métricas
        update_interaction_metrics(
            supabase, 
            respuesta_id,
            metrics.get("es_relevante"),
            metrics.get("calidad_respuesta"),
            metrics.get("funcion_utilizada")
        )
    except Exception as e:
        print(f"Error evaluando métricas en background: {str(e)}")

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
    try:
        data = request.json
        user_msg = data.get("content")
        sesion_id = user["sesion_id"]
        group_code = user["groupCode"]  
        student_id = user["studentCode"]

        # ✅ OPTIMIZACIÓN 1: Consolidar queries en una sola llamada
        # Obtener grupo e información del estudiante en una query
        grupo_data = supabase.table("grupos").select("id, thread_id").eq("codigo_grupo", group_code).single().execute()
        group_id = grupo_data.data.get("id")
        current_thread_id = grupo_data.data.get("thread_id")

        # Obtener ID del estudiante
        estudiante_res = supabase.table("estudiantes").select("id").eq("identificador_estudiante", student_id).single().execute()
        estudiante_id = estudiante_res.data.get("id")
        
        # 2. Guardar el mensaje del estudiante
        res_user = save_interaction(supabase, sesion_id, "user", user_msg, group_code, student_id=estudiante_id, student_code=student_id)
        pregunta_id = res_user.data[0]['id']

        # 3. Procesar con OpenAI (Responses API)
        ai_text = process_ai_response(user_msg, supabase, group_code)

        # ✅ OPTIMIZACIÓN 2: Guardar respuesta primero sin métricas
        res_assistant = save_interaction(
            supabase, 
            sesion_id, 
            "assistant", 
            ai_text, 
            group_code, 
            reply_to=pregunta_id
        )
        respuesta_id = res_assistant.data[0]['id']
        print(f"Respuesta guardada con ID: {respuesta_id} (sin métricas)")

        # 4. ✅ Evaluar métricas en background (no bloquea respuesta)
        metrics_thread = Thread(
            target=evaluate_and_save_metrics,
            args=(user_msg, ai_text, supabase, group_code, sesion_id, respuesta_id),
            daemon=True
        )
        metrics_thread.start()

        # Return respuesta inmediata sin esperar métricas
        return jsonify({
            "status": "success",
            "message": ai_text,
        })

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR EN CHAT_HANDLER: {str(e)}")
        print(f"Traceback:\n{error_trace}")
        return jsonify({"status": "error", "message": str(e), "details": error_trace}), 500

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
        "area_transversal": string,
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
            "area_transversal": data.get("area_transversal"),
            "eje_ambiental": data.get("eje_ambiental"),
            "problematica": data.get("problematica"),
            "grado": int(data.get("grado")) if data.get("grado") else None
        }
        
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

@app.route('/grupos', methods=['POST'])
@require_auth
def create_group(user=None):
    """
    Endpoint para crear un nuevo grupo.
    Body: {
        "codigo_grupo": string (ej: "ECO-2026-A")
    }
    """
    try:
        data = request.json
        codigo_grupo = data.get("codigo_grupo")
        
        if not codigo_grupo:
            return jsonify({
                "status": "error",
                "message": "El código del grupo es requerido"
            }), 400
        
        # Validar que el grupo no exista ya
        existing = supabase.table("grupos").select("id").eq("codigo_grupo", codigo_grupo).execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({
                "status": "error",
                "message": f"El grupo con código '{codigo_grupo}' ya existe"
            }), 409
        
        # Crear nuevo grupo en Supabase
        new_group_data = {
            "codigo_grupo": codigo_grupo
        }
        
        result = supabase.table("grupos").insert(new_group_data).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                "status": "error",
                "message": "No se pudo crear el grupo"
            }), 500
        
        # Transformar la respuesta a la estructura esperada por el frontend
        grupo_creado = result.data[0]
        grupo_respuesta = {
            "id": grupo_creado.get("id"),
            "code": grupo_creado.get("codigo_grupo"),
            "area": grupo_creado.get("area_curricular", ""),
            "area_transversal": grupo_creado.get("area_transversal", ""),
            "eje": grupo_creado.get("eje_ambiental", ""),
            "macroEje": grupo_creado.get("eje_ambiental", ""),
            "problematica": grupo_creado.get("problematica", ""),
            "icon": "science",
            "iconBg": "bg-blue-50",
            "iconColor": "text-blue-600",
            "status": "active"
        }
        
        return jsonify({
            "status": "success",
            "message": f"Grupo '{codigo_grupo}' creado correctamente",
            "data": grupo_respuesta
        }), 201
    
    except Exception as e:
        print(f"Error en create_group: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

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
      - fecha_inicio: string (formato ISO: YYYY-MM-DD)
      - fecha_fin: string (formato ISO: YYYY-MM-DD)
    
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
        
        # Llamar función de dashboard
        metrics = get_dashboard_metrics(
            supabase,
            codigo_grupo=codigo_grupo,
            fecha=fecha
        )
        
        return jsonify(metrics), 200
    
    except Exception as e:
        print(f"Error en get_metrics: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/teacher/recent-messages', methods=['GET'])
@require_auth
def get_messages(user=None):
    """
    Endpoint para obtener mensajes recientes del dashboard.
    Query params (todos opcionales):
      - codigo_grupo: string (ej: "ECO-2026-A")
      - fecha: string (formato ISO: YYYY-MM-DD)
      - limit: número (default: 50, max: 500)
    
    Retorna:
      Array de mensajes recientes con estructura:
      [
        {
          "id": int,
          "student": string,
          "date": string,
          "group": string,
          "content": string
        }
      ]
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

@app.route('/teacher/students', methods=['GET'])
@require_auth
def get_students(user=None):
    """
    Endpoint para obtener lista de estudiantes.
    
    Query params (opcionales):
      - codigo_grupo: string (ej: "ECO-2026-A") - Filtrar por grupo específico
    
    Retorna:
      Array de estudiantes con estructura: { id, identifier, name, groupCode }
    """
    try:
        codigo_grupo = request.args.get('codigo_grupo')
        
        # Construir query
        query = supabase.table("estudiantes").select(
            "id, identificador_estudiante, nombre_anonimo, codigo_grupo"
        )
        
        # Aplicar filtro si se especifica grupo
        if codigo_grupo:
            query = query.eq("codigo_grupo", codigo_grupo)
        
        query = query.order("codigo_grupo", desc=True)
        result = query.execute()
        
        # Transformar la respuesta a la estructura esperada por el frontend
        estudiantes_transformados = []
        for estudiante in result.data:
            estudiante_transformado = {
                "id": estudiante.get("id"),
                "identifier": estudiante.get("identificador_estudiante", ""),
                "name": estudiante.get("nombre_anonimo", ""),
                "groupCode": estudiante.get("codigo_grupo", "")
            }
            estudiantes_transformados.append(estudiante_transformado)
        
        return jsonify(estudiantes_transformados), 200
    
    except Exception as e:
        print(f"Error en get_students: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/teacher/students', methods=['POST'])
@require_auth
def create_student(user=None):
    """
    Endpoint para crear un nuevo estudiante.
    
    Body: {
        "identificador_estudiante": string (ej: "EST-001"),
        "nombre_anonimo": string (ej: "Juan Pérez"),
        "codigo_grupo": string (ej: "ECO-2026-A")
    }
    
    Retorna:
      { id, identifier, name, groupCode }
    """
    try:
        data = request.json
        identificador = data.get("identificador_estudiante")
        nombre = data.get("nombre_anonimo")
        codigo_grupo = data.get("codigo_grupo")
        
        # Validar campos requeridos
        if not identificador or not nombre or not codigo_grupo:
            return jsonify({
                "status": "error",
                "message": "Los campos identificador_estudiante, nombre_anonimo y codigo_grupo son requeridos"
            }), 400
        
        # Obtener el grupo_id desde la tabla grupos
        grupo_check = supabase.table("grupos").select("id").eq("codigo_grupo", codigo_grupo).single().execute()
        if not grupo_check.data:
            return jsonify({
                "status": "error",
                "message": f"El grupo '{codigo_grupo}' no existe"
            }), 404
        
        grupo_id = grupo_check.data.get("id")
        
        # Validar que el estudiante no exista ya
        existing = supabase.table("estudiantes").select("id").eq("identificador_estudiante", identificador).execute()
        if existing.data and len(existing.data) > 0:
            return jsonify({
                "status": "error",
                "message": f"El estudiante con identificador '{identificador}' ya existe"
            }), 409
        
        # Crear nuevo estudiante en Supabase con el grupo_id
        new_student_data = {
            "identificador_estudiante": identificador,
            "nombre_anonimo": nombre,
            "codigo_grupo": codigo_grupo,
            "grupo_id": grupo_id
        }
        
        result = supabase.table("estudiantes").insert(new_student_data).execute()
        
        if not result.data or len(result.data) == 0:
            return jsonify({
                "status": "error",
                "message": "No se pudo crear el estudiante"
            }), 500
        
        # Transformar la respuesta
        estudiante_creado = result.data[0]
        estudiante_respuesta = {
            "id": estudiante_creado.get("id"),
            "identifier": estudiante_creado.get("identificador_estudiante", ""),
            "name": estudiante_creado.get("nombre_anonimo", ""),
            "groupCode": estudiante_creado.get("codigo_grupo", "")
        }
        
        return jsonify({
            "status": "success",
            "message": "Estudiante creado correctamente",
            "data": estudiante_respuesta
        }), 201
    
    except Exception as e:
        print(f"Error en create_student: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/teacher/update-momento', methods=['POST'])
@require_auth
def update_momento_handler(user=None):
    """
    Endpoint para actualizar el momento de sesión (Diseño, Revisión, Implementación).
    
    Body:
      { "momento": "Diseño" | "Revisión" | "Implementación" }
    
    Retorna:
      { "status": "success", "message": "Momento actualizado correctamente" }
    """
    try:
        data = request.json
        momento = data.get("momento")
        
        # Validar que el momento sea uno de los valores permitidos
        valores_permitidos = ["Diseño inicial", "Revisión y ajuste", "Socialización y retroalimentación"]
        if not momento or momento not in valores_permitidos:
            return jsonify({
                "status": "error",
                "message": f"Momento debe ser uno de: {', '.join(valores_permitidos)}"
            }), 400
        
        # Llamar la función de Supabase
        response = supabase.rpc("update_default_sesiones_momento", {
            "p_nuevo_momento": momento
        }).execute()
        
        return jsonify({
            "status": "success",
            "message": f"Momento actualizado a '{momento}' correctamente"
        }), 200
    
    except Exception as e:
        print(f"Error en update_momento_handler: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/export/download', methods=['GET'])
@require_auth
def export_download(user=None):
    """
    Endpoint para descargar ZIP con todos los CSVs de datos.
    Query params (opcionales):
      - codigo_grupo: string (ej: "ECO-2026-A") - Si no se proporciona, exporta todos
    
    Retorna:
      ZIP con 5 CSVs:
        - grupos.csv
        - usuarios.csv
        - sesiones.csv
        - interacciones.csv
        - resumen.csv
    """
    try:
        # Obtener código del grupo (opcional)
        codigo_grupo = request.args.get('codigo_grupo')
        
        # Si el usuario es maestro sin código_grupo específico, usar su grupo
        if codigo_grupo is None and 'groupCode' in user:
            codigo_grupo = user['groupCode']
        
        # Generar ZIP
        zip_buffer = export_data_to_zip(supabase, codigo_grupo=codigo_grupo)
        
        # Retornar ZIP como descarga
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"data_ecodialoga_{timestamp}.zip"
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        print(f"Error en export_download: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────

@app.route('/', methods=['GET'])
def root():
    """Endpoint raíz."""
    return jsonify({"status": "ok", "message": "EcoDialoga Backend está activo"}), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check para verificar que el servidor está activo."""
    return jsonify({"status": "ok", "message": "EcoDialoga Backend está activo"}), 200

# Requerido para Vercel
def handler(request):
    return app(request)

if __name__ == '__main__':
    # Railway asigna el puerto en la variable PORT, si no está usa 5000
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)