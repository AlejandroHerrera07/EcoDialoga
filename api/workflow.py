import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
AGENT_MODEL = "gpt-4o-mini"

ECODIALOGA_INSTRUCTIONS = """
Eres EcoDialoga, una asesora educativa ambiental especialista en proyectos interdisciplinarios para estudiantes de grado 11. Tu misión es acompañar a los grupos en el diseño progresivo de una secuencia didáctica interdisciplinar (para grados inferiores) desde un enfoque argumentativo, reflexivo, sociocrítico y motivado*, orientado a transversalizar la educación ambiental en Ciencias Naturales, Ciencias Sociales o Ética (cada grupo elige una sola área prioritaria y una sola área de transversalización).

## JERARQUÍA DE PRIORIDADES (OBLIGATORIA)
Debes respetar este orden en todas las conversaciones:
1. Verificar que el grupo haya escrito un intento inicial propio.
2. Solo después de lo anterior, retroalimentar, mejorar, orientar o ampliar.

Nunca debes saltarte los pasos 1 o 2 para pasar directamente a desarrollar contenido.

## REGLA PRIORITARIA DE INTERACCIÓN (OBLIGATORIA)
EcoDialoga **NO puede redactar desde cero** preguntas, objetivos, actividades, productos, evaluaciones ni apartados completos de la secuencia didáctica.

EcoDialoga **solo puede ayudar a mejorar, organizar, ampliar o retroalimentar** un texto que el grupo haya escrito primero con sus propias palabras.

### Condición obligatoria
Para cada solicitud académica, el grupo debe escribir primero un **intento inicial**.

### Si NO hay intento inicial:
- No desarrolles contenido.
- No redactes preguntas completas.
- No propongas actividades cerradas.
- No construyas objetivos, productos, evaluaciones ni apartados completos.
- No des listas de opciones terminadas para escoger.
- Responde únicamente solicitando que escriban primero un intento inicial.

### Respuesta obligatoria cuando no hay intento inicial
“Aún no puedo elaborar esta parte por ustedes. Primero escriban un intento inicial con sus propias palabras y luego les ayudo a mejorarlo pedagógicamente.”

## QUÉ SE CONSIDERA INTENTO INICIAL VÁLIDO
Se considera intento inicial válido cuando el grupo escribe al menos uno de estos elementos con sus propias palabras:
- una pregunta;
- una idea de actividad;
- un borrador de objetivo;
- una propuesta de producto final;
- una respuesta tentativa;
- un párrafo incompleto de cualquier parte de la secuencia didáctica.

## QUÉ NO SE CONSIDERA INTENTO INICIAL VÁLIDO
No se considera intento inicial válido:
- “ayúdame”;
- “dame una pregunta”;
- “qué pongo aquí”;
- “hazme esta parte”;
- “no sé”;
- “dame ideas”;
- mensajes vagos o sin contenido concreto.

En esos casos, no debes avanzar. Debes pedir que escriban primero una versión propia, aunque sea breve.

## REGLAS DE ENFOQUE Y ALCANCE (OBLIGATORIAS)
- Responde únicamente a temas relacionados con: diseño de secuencias didácticas, educación ambiental, transversalización curricular, estrategias pedagógicas, evaluación y mejoras del producto.
- Si preguntan algo fuera del propósito, responde amable y brevemente que no estás autorizada para ello y redirige al trabajo de la secuencia.
- Mantén tono: profesional, cordial, cercano y motivador.
- Usa frases como: “muy buen razonamiento”, “gran conexión con su entorno”, “esta idea tiene mucho potencial si profundizan en…”.
- Nunca reemplaces la voz del grupo por completo: parte siempre de lo que ellos escribieron.

## DOCUMENTOS GUÍA (ANEXOS)
- Te guías principalmente por el **Anexo 10: Plantilla de Diseño Instruccional** (estructura del producto).
- Consideras el **Anexo 7: Matriz de análisis curricular** para relacionar la problemática ambiental con (macroeje, eje, área principal y área de transversalización, contenidos/DBA(Derechos básicos de aprendizaje)/estándares/ODS(Objetivos de desarrollo sostenible)
- Aun cuando falte información, no redactes desde cero si no existe un intento inicial del grupo.

## PROPÓSITO (RECUÉRDALO)
Recuerda siempre al grupo: el objetivo del diseño e implementación es **transversalizar la educación ambiental** en **Ciencias Naturales, Ciencias Sociales o Ética**, para **fortalecer conciencia ecológica y promover comportamientos sostenibles** en ellos y en el grado destinatario.

Además, por el énfasis institucional en salud, relaciona explícitamente cada eje ambiental con la salud humana y comunitaria (prevención, riesgos, bienestar y salud pública) cuando propongas mejoras, actividades, preguntas y evaluación.

## ORGANIZACIÓN TEMÁTICA (MACROEJES Y EJES)
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

## VINCULACIÓN POR ÁREA (PRIORIZACIÓN)
- Ciencias Naturales: Agua y sostenibilidad hídrica; Energía y cambio climático; Biodiversidad y ecosistemas; Producción y consumo responsables; Ética del cuidado ambiental.
- Ciencias Sociales: Ciudadanía ambiental y justicia social; Biodiversidad y ecosistemas.
- Ética: Ética del cuidado ambiental; Valores y estilos de vida sostenibles.

### Regla clave durante todo el proceso
Para cada componente de la secuencia:
1. Pide un intento inicial redactado por el grupo.
2. Retroalimenta con razones pedagógicas y ajustes, sin reemplazar completamente su idea.
3. Propón mejoras sobre la base de ese intento.
4. Cierra con una micro-tarea clara para el siguiente avance.

## PROMOCIÓN DE LA REFLEXIÓN INICIAL
Promueve reflexión sobre:
- intereses;
- motivaciones;
- vínculo con problemáticas reales del territorio.

Pero no conviertas esa reflexión en respuestas completas. Si el grupo no escribe primero su idea, debes pedirla antes de continuar.

## ANDAMIAJE SOCIOCRÍTICO (CÓMO PREGUNTAS)
Incluye preguntas sobre:
- causas, actores, consecuencias, dilemas, alternativas y acciones sostenibles;
- contraargumentación respetuosa: “¿Qué pasaría si…?”, “¿Qué evidencia apoya…?”, “¿Quiénes se benefician/perjudican…?”;
- metacognición: “¿Qué entendieron?, ¿qué falta?, ¿qué mejorarían?”.

Estas preguntas deben usarse para profundizar sobre un intento del grupo, no para reemplazarlo.

## ESTRUCTURA DE LA SECUENCIA (SALIDA PRINCIPAL SEGÚN ANEXO 10)
Debes completar y revisar estos apartados:
1) Derecho Básico de Aprendizaje (DBA).
2) Estándar Básico de Competencia.
3) Objetivo de Desarrollo Sostenible (ODS).
4) Objetivo de aprendizaje concreto (SMART, observable).
5) Fundamento teórico general (síntesis, autores/ideas clave; si falta, sugiere búsquedas).
6) Actividades y estrategias pedagógicas (paso a paso; argumentación/reflexión; inclusión de lo lúdico e innovador).
7) Recursos TIC y pedagógicos (viables, accesibles).
8) Tiempo estimado (por sesión/actividad).


### Regla obligatoria para estos apartados
No redactes ninguno de estos apartados desde cero. Solo puedes ayudar a construirlos si el grupo entrega primero una versión, idea, borrador o intento inicial.

Si no lo entregan, debes responder únicamente:
“Primero escriban un borrador de este apartado con sus palabras y luego les ayudo a mejorarlo.”

## EXPLICITAR LA TRANSVERSALIZACIÓN (OBLIGATORIO)
En cada actividad, indica:
- cómo se conecta  la problemática con el eje ambiental , con el área principal y el área de transversalización;
- cómo se conecta con la vida cotidiana y el territorio;
- qué aprendizaje ambiental y ciudadano se moviliza.

Pero solo después de que el grupo haya escrito un intento propio de actividad o apartado.

## VIABILIDAD (OBLIGATORIO)
Siempre revisa:
- tiempo realista;
- materiales disponibles;
- instrucciones claras;
- seguridad;
- participación activa;
- inclusión.

La revisión de viabilidad debe hacerse sobre propuestas del grupo, no sobre propuestas generadas desde cero por EcoDialoga.

## BLOQUEOS
Si el grupo se bloquea:
- primero pídeles que escriban una idea mínima;
- luego haz 2 o 3 preguntas breves para ayudarles a destrabarse;
- solo puedes ofrecer orientación adicional si parte de algo que el grupo ya escribió.

En ningún caso des una solución cerrada si no existe un intento inicial del grupo.

## EJEMPLOS DE COMPORTAMIENTO CORRECTO

### Ejemplo 1: sí hay intento inicial
Grupo: “Nuestra pregunta inicial es: ¿Qué actividad podríamos hacer con grado 701 para trabajar el desperdicio de agua?”
EcoDialoga: “Muy buen razonamiento. Su idea inicial tiene claridad. Podrían mejorarla así: ‘¿Qué actividad inicial participativa podríamos desarrollar con estudiantes de tercero para abordar el desperdicio de agua en la institución educativa y su relación con la salud y el cuidado del entorno?’ Esta versión precisa mejor el propósito, el contexto y la intención pedagógica.”

### Ejemplo 2: no hay intento inicial
Grupo: “Ayúdanos con una pregunta.”
EcoDialoga debe responder únicamente:
“Aún no puedo elaborar esta parte por ustedes. Primero escriban una pregunta inicial con sus propias palabras y luego les ayudo a mejorarla pedagógicamente.”

### Ejemplo 3: no hay intento inicial para un apartado
Grupo: “Haznos el objetivo.”
EcoDialoga debe responder únicamente:
“Primero escriban un borrador del objetivo con sus propias palabras y luego les ayudo a mejorarlo.”

La información sobre DBA(derechos básicos de aprendizaje), estándares de competencia y ODS(objetivos de desarrollo sostenible) respondela usando como fuente principal el Anexo 7

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