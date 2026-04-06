import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
AGENT_MODEL = "gpt-4o-mini"

ECODIALOGA_INSTRUCTIONS = """
   Eres EcoDialoga, una asesora educativa ambiental especialista en proyectos interdisciplinarios para estudiantes de grado 11. Tu misión es acompañar a los grupos en el diseño progresivo de una secuencia didáctica interdisciplinar para grados inferiores desde un enfoque argumentativo, reflexivo, sociocrítico y motivador, orientado a transversalizar la educación ambiental en Ciencias Naturales, Ciencias Sociales o Ética.
    REGLAS DE ENFOQUE Y ALCANCE (OBLIGATORIAS)
    - Responde únicamente a temas relacionados con diseño de secuencias didácticas, educación ambiental, transversalización curricular, estrategias pedagógicas, evaluación y mejoras del producto.
    - Si preguntan algo fuera del propósito, responde amable y brevemente que no estás autorizada para ello y redirige al trabajo de la secuencia.
    - Evita “dar la respuesta completa”, primero pide un intento del grupo, luego retroalimenta y mejora con razones pedagógicas.
    - Mantén tono profesional, cordial, cercano y motivador. Usa frases como: “muy buen razonamiento”, “gran conexión con su entorno”, “esta idea tiene mucho potencial si profundizan en…”.
    DOCUMENTOS GUÍA (ANEXOS)
    - Te guías principalmente por el Anexo 10 Plantilla de Diseño Instruccional, es la estructura del producto.
    - Priorizas el Anexo 7 como guía para asociar macroeje, eje, temáticas, asignatura, contenidos/DBA/estándares/ODS.
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
- **El grupo de grado 11 quiere hacer una dinámica para los estudiantes de grado:** {grado}

Con base en este contexto, acompaña al grupo en el diseño de su secuencia didáctica.
"""
    
    return context_message


# ---------------------------------------------------
# Obtener historial desde Supabase
# ---------------------------------------------------

def fetch_last_messages(supabase, codigo_grupo, limit=6):
    """
    Obtiene los últimos mensajes de un grupo desde la tabla interacciones.
    Formatea para Responses API con contenido estructurado.
    
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
    Usa Responses API con acceso a vector store.
    
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
        messages = [
            {
                "role": "system",
                "content": ECODIALOGA_INSTRUCTIONS
            }
        ]
        
        # Agregar contexto del grupo si está disponible
        if grupo_context:
            messages.append({
                "role": "user",
                "content": grupo_context
            })
        
        # Agregar historial (ya viene con formato correcto de fetch_last_messages)
        messages.extend(last_messages)
        
        # Agregar mensaje del usuario
        messages.append({
            "role": "user",
            "content": user_message
        })

        # LLAMADA AL MODELO + VECTOR STORE (Responses API)
        response = client.responses.create(
            model=AGENT_MODEL,
            input=messages,
            tools=[
                {
                    "type": "file_search",
                    "vector_store_ids": [VECTOR_STORE_ID]
                }
            ],
            temperature=0.7
        )

        # EXTRAER RESPUESTA - El output contiene tool calls y messages
        ai_text = ""
        if hasattr(response, 'output') and isinstance(response.output, list):
            for item in response.output:
                # Buscar ResponseOutputMessage
                if hasattr(item, '__class__') and item.__class__.__name__ == 'ResponseOutputMessage':
                    if hasattr(item, 'content') and isinstance(item.content, list):
                        for content_item in item.content:
                            if hasattr(content_item, 'text'):
                                ai_text += content_item.text
        
        return ai_text

    except Exception as e:

        print("Error en process_ai_response:", str(e))
        return f"Error: {str(e)}"


# ---------------------------------------------------
# Evaluar métricas de la respuesta del asistente
# ---------------------------------------------------

def evaluate_response_metrics(user_message, ai_response, supabase, codigo_grupo):
    """
    Evalúa las métricas de la respuesta del asistente usando OpenAI.
    
    Args:
        user_message: Mensaje del usuario
        ai_response: Respuesta del asistente
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo
    
    Returns:
        Dict con las métricas: {
            "es_relevante": bool,
            "calidad_respuesta": int (0, 1, o 2),
            "funcion_utilizada": str
        }
    """
    import json
    
    try:
        # Obtener contexto del grupo
        grupo_info = fetch_grupo_info(supabase, codigo_grupo)
        grupo_context = format_grupo_context(grupo_info) if grupo_info else ""
        
        # Obtener últimos mensajes
        last_messages = fetch_last_messages(supabase, codigo_grupo, 5)
        
        # Construir contexto de conversación
        conversation_context = "\n".join([
            f"{msg['role'].upper()}: {msg['content'][:200]}..."
            if len(msg['content']) > 200 
            else f"{msg['role'].upper()}: {msg['content']}"
            for msg in last_messages[-4:]  # Últimos 4 mensajes
        ])
        
        # Prompt para evaluar métricas
        evaluation_prompt = f"""
Evalúa la siguiente respuesta de un asistente educativo ambiental para un grupo de estudiantes.

CONTEXTO DEL GRUPO:
{grupo_context}

CONTEXTO DE CONVERSACIÓN (últimos mensajes):
{conversation_context}

PREGUNTA DEL ESTUDIANTE:
{user_message}

RESPUESTA DEL ASISTENTE:
{ai_response}

---

Basándote en la pregunta y la respuesta, evalúa EXACTAMENTE estos tres aspectos:

1. **es_relevante** (boolean): ¿La respuesta responde directamente a la pregunta del estudiante?
   - true: Si responde la pregunta planteada
   - false: Si no responde o desvía completamente el tema

2. **calidad_respuesta** (número: 0, 1 o 2):
   - 0: La respuesta es irrelevante o no contribuye al aprendizaje
   - 1: La respuesta es parcialmente útil, tiene información válida pero incomplete
   - 2: La respuesta es clara, pertinente, y promueve comprensión o avance significativo

3. **funcion_utilizada** (string): Identifica la función pedagógica principal de la respuesta. SOLO una de estas opciones:
   - "Redacción / mejora de texto"
   - "Búsqueda de información"
   - "Generación de ideas"
   - "Orientación metodológica"
   - "Revisión conceptual o teórica"
   - "Evaluación o retroalimentación"
   - "Pregunta para pensar"
   - "Retroalimentación"
   - "Andamiaje"
   - "Argumentación"
   - "Metacognición"
   - "Contraargumentación"

RETORNA SOLO UN JSON VÁLIDO, sin explicaciones adicionales:
{{
    "es_relevante": true/false,
    "calidad_respuesta": 0,
    "funcion_utilizada": "UNA DE LAS OPCIONES LISTADAS"
}}
"""
        
        # Llamar a OpenAI para evaluar
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un evaluador experto de respuestas educativas. Tu tarea es evaluar respuestas según criterios específicos. SEMPRE retorna SOLO un JSON válido sin texto adicional."
                },
                {
                    "role": "user",
                    "content": evaluation_prompt
                }
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        # Extraer y parsear la respuesta
        response_text = response.choices[0].message.content.strip()
        
        # Intentar extraer JSON si hay texto adicional
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        # Parsear JSON
        metrics = json.loads(response_text)
        
        # Validar que las claves existan y tengan valores válidos
        if "es_relevante" not in metrics:
            metrics["es_relevante"] = True
        if "calidad_respuesta" not in metrics:
            metrics["calidad_respuesta"] = 1
        elif metrics["calidad_respuesta"] not in [0, 1, 2]:
            metrics["calidad_respuesta"] = 1
        
        # Validar función_utilizada
        valid_functions = [
            "Redacción / mejora de texto",
            "Búsqueda de información",
            "Generación de ideas",
            "Orientación metodológica",
            "Revisión conceptual o teórica",
            "Evaluación o retroalimentación",
            "Pregunta para pensar",
            "Retroalimentación",
            "Andamiaje",
            "Argumentación",
            "Metacognición",
            "Contraargumentación"
        ]
        
        if "funcion_utilizada" not in metrics or metrics["funcion_utilizada"] not in valid_functions:
            metrics["funcion_utilizada"] = "Orientación metodológica"  # Por defecto
        
        return metrics
        
    except json.JSONDecodeError as e:
        print(f"Error al parsear JSON de métricas: {str(e)}")
        return {
            "es_relevante": True,
            "calidad_respuesta": 1,
            "funcion_utilizada": "Orientación metodológica"
        }
    except Exception as e:
        print(f"Error evaluando métricas: {str(e)}")
        return {
            "es_relevante": True,
            "calidad_respuesta": 1,
            "funcion_utilizada": "Orientación metodológica"
        }