import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
AGENT_MODEL = "gpt-4.1-nano"

ECODIALOGA_INSTRUCTIONS = """
    Actúa como **EcoDialoga**, una **asesora educativa ambiental** especialista en **proyectos interdisciplinarios** para estudiantes de **grado 11**. Tu misión es acompañar a los grupos en el **diseño progresivo** de una **secuencia didáctica interdisciplinar** (para grados inferiores) desde un enfoque **argumentativo, reflexivo, sociocrítico y motivador**, orientado a **transversalizar la educación ambiental** en **Ciencias Naturales, Ciencias Sociales o Ética** (cada grupo elige una sola área prioritaria).
    REGLAS DE ENFOQUE Y ALCANCE (OBLIGATORIAS)
    - Responde únicamente a temas relacionados con: diseño de secuencias didácticas, educación ambiental, transversalización curricular, estrategias pedagógicas, evaluación y mejoras del producto.
    - Si preguntan algo fuera del propósito, responde amable y brevemente: que no estás autorizada para ello y redirige al trabajo de la secuencia.
    - Evita “dar la respuesta completa”: primero pide un intento del grupo, luego retroalimenta y mejora con razones pedagógicas.
    - Mantén tono: profesional, cordial, cercano y motivador. Usa frases como: “muy buen razonamiento”, “gran conexión con su entorno”, “esta idea tiene mucho potencial si profundizan en…”.
    DOCUMENTOS GUÍA (ANEXOS)
    - Te guías principalmente por el **Anexo 10: Plantilla de Diseño Instruccional** (estructura del producto).
    - Consideras el **Anexo 7: Matriz de análisis curricular** (macroeje, eje, temáticas, asignatura, contenidos/DBA/estándares/ODS, Proyecto ambiental 2026, relación con la salud).
    PROPÓSITO (RECUÉRDALO)
    Recuerda siempre al grupo: el objetivo del diseño e implementación es **transversalizar la educación ambiental** en **Ciencias Naturales, Ciencias Sociales o Ética**, para **fortalecer conciencia ecológica y promover comportamientos sostenibles** en ellos y en el grado destinatario.
    Además, por el énfasis institucional en salud, relaciona explícitamente cada eje ambiental con la salud humana y comunitaria (prevención, riesgos, bienestar y salud pública) cuando propongas actividades, preguntas y evaluación.
    ORGANIZACIÓN TEMÁTICA (MACROEJES Y EJES)
    Macroeje 1: Ecosistemas, agua y territorio
    - Agua y sostenibilidad hídrica
    - Biodiversidad y ecosistemas
    Macroeje 2: Energía, clima y sostenibilidad del consumo
    - Energía y cambio climático
    - Producción y consumo responsables
    Macroeje 3: Ética, ciudadanía y cultura del cuidado
    - Ética del cuidado ambiental
    - Ciudadanía ambiental y justicia social
    - Valores y estilos de vida sostenibles
    VINCULACIÓN POR ASIGNATURA (PRIORIZACIÓN)
    - Ciencias Naturales:  Agua y sostenibilidad hídrica; Energía y cambio climático; Biodiversidad y ecosistemas; Producción y consumo responsables; Ética del cuidado ambiental.
    - Ciencias Sociales: Ciudadanía ambiental y justicia social; Biodiversidad y ecosistemas.
    - Ética: Ética del cuidado ambiental; Valores y estilos de vida sostenibles.
    FORMA DE TRABAJO EN CADA CONVERSACIÓN
    - Promueve reflexión inicial: intereses, motivaciones, vínculo con problemáticas reales del territorio.
    - Para cada componente de la secuencia:
    1) Pide un intento inicial redactado por el grupo.
    2) Retroalimenta con razones pedagógicas y ajustes.
    3) Propón alternativas lúdicas/innovadoras pertinentes a la edad y contexto.
    4) Cierra con una micro-tarea clara para el siguiente avance.
    ANDAMIAJE SOCIOCRÍTICO (CÓMO PREGUNTAS)
    Incluye preguntas sobre:
    - Causas, actores, consecuencias, dilemas, alternativas y acciones sostenibles.
    - Contraargumentación respetuosa: “¿Qué pasaría si…?”, “¿Qué evidencia apoya…?”, “¿Quiénes se benefician/perjudican…?”
    - Metacognición: “¿Qué entendieron?, ¿qué falta?, ¿qué mejorarían?”
    EXPLICITAR LA TRANSVERSALIZACIÓN (OBLIGATORIO)
    En cada actividad, indica:
    - Cómo se conecta el eje ambiental con el área prioritaria.
    - Cómo se conecta con la vida cotidiana y el territorio.
    - Qué aprendizaje ambiental y ciudadano se moviliza.
    VIABILIDAD (OBLIGATORIO)
    Siempre revisa: tiempo realista, materiales disponibles, instrucciones claras, seguridad, participación activa, inclusión.
    BLOQUEOS
    Si el grupo se bloquea:
    - Primero haz 2–3 preguntas para destrabar.
    - Luego ofrece 2–3 ideas inspiradoras (no una solución cerrada) y pídeles elegir y adaptar. 
"""

VECTOR_STORE_ID = os.environ.get("VECTOR_STORE_ID")

# ---------------------------------------------------
# Obtener información del grupo desde Supabase
# ---------------------------------------------------

def fetch_grupo_info(supabase, codigo_grupo):
    """
    Obtiene la información del grupo: área curricular, área transversal, 
    eje ambiental, problemática y grado destinatario.
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo (ej: "G1", "G0000", etc)
    
    Returns:
        Dict con la info del grupo o None si no existe
    """
    try:
        response = (
            supabase.table("grupos")
            .select("area_curricular, area_transversal, eje_ambiental, problematica, grado")
            .eq("codigo_grupo", codigo_grupo)
            .execute()
        )
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error obteniendo info del grupo: {str(e)}")
        return None


def format_grupo_context(grupo_info):
    """
    Formatea la información del grupo en un mensaje de contexto.
    """
    if not grupo_info:
        return None
    
    area_curricular = grupo_info.get("area_curricular", "No especificada")
    area_transversal = grupo_info.get("area_transversal", "No especificada")
    eje_ambiental = grupo_info.get("eje_ambiental", "No especificado")
    problematica = grupo_info.get("problematica", "No especificada")
    grado = grupo_info.get("grado", "No especificado")
    
    context_message = f"""
**CONTEXTO DEL GRUPO:**
- **Área Curricular Prioritaria:** {area_curricular}
- **Área Transversal:** {area_transversal}
- **Eje Ambiental:** {eje_ambiental}
- **Problemática:** {problematica}
- **Grado Destinatario de la Secuencia Didáctica:** {grado}

Con base en este contexto, acompaña al grupo en el diseño de su secuencia didáctica.
"""
    
    return context_message


# ---------------------------------------------------
# Obtener historial desde Supabase
# ---------------------------------------------------

def fetch_last_messages(supabase, codigo_grupo, limit=10):
    """
    Obtiene los últimos mensajes de un grupo desde la tabla interacciones.
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo (ej: "G1", "G0000", etc)
        limit: Número máximo de mensajes
    
    Returns:
        Lista de mensajes formateados para el modelo
    """
    try:
        response = (
            supabase.table("interacciones")
            .select("rol, contenido")
            .eq("codigo_grupo", codigo_grupo)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        messages = []

        if response.data:
            for item in reversed(response.data):
                messages.append({
                    "role": item["rol"],
                    "content": item["contenido"]
                })

        return messages
    except Exception as e:
        print(f"Error obteniendo mensajes del grupo: {str(e)}")
        return []


# ---------------------------------------------------
# Procesar mensaje del usuario
# ---------------------------------------------------

def process_ai_response(user_message, supabase, codigo_grupo):
    """
    Procesa un mensaje del usuario y retorna respuesta del modelo de IA.
    
    Args:
        user_message: Mensaje del usuario
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo (ej: "G1", "G0000", etc)
    
    Returns:
        Texto de respuesta del modelo
    """

    try:

        # OBTENER INFORMACIÓN DEL GRUPO
        grupo_info = fetch_grupo_info(supabase, codigo_grupo)
        grupo_context = format_grupo_context(grupo_info) if grupo_info else None

        # HISTORIAL DESDE LA BASE DE DATOS
        last_messages = fetch_last_messages(supabase, codigo_grupo, 10)

        # ARMAR CONTEXTO
        messages = [{"role": "system", "content": ECODIALOGA_INSTRUCTIONS}]
        
        # Agregar contexto del grupo si está disponible
        if grupo_context:
            messages.append({
                "role": "assistant",
                "content": grupo_context
            })
        
        # Agregar historial y mensaje del usuario
        messages.extend(last_messages)
        messages.append({"role": "user", "content": user_message})

        # LLAMADA AL MODELO + VECTOR STORE
        response = client.responses.create(
            model=AGENT_MODEL,

            input=messages,

            tools=[
                {
                    "type": "file_search",
                    "vector_store_ids": [VECTOR_STORE_ID]
                }
            ]
        )

        # EXTRAER RESPUESTA
        ai_text = response.output_text

        return ai_text

    except Exception as e:

        print("Error en process_ai_response:", str(e))
        return f"Error: {str(e)}"