-- ============================================================
-- Script para actualizar el esquema de la tabla 'interacciones'
-- Agrega las columnas necesarias para que los gráficos del 
-- dashboard funcionen correctamente
-- ============================================================

-- 1. Agregar columna 'calidad_respuesta' a la tabla interacciones
-- Valores permitidos: 0 (baja), 1 (media), 2 (alta)
ALTER TABLE interacciones 
ADD COLUMN IF NOT EXISTS calidad_respuesta INT DEFAULT 1 
CHECK (calidad_respuesta IN (0, 1, 2));

-- 2. Agregar columna 'funcion_utilizada' a la tabla interacciones
-- Esta columna almacena el tipo de función o característica usada (ej: "Análisis", "Síntesis", "Generación", etc.)
ALTER TABLE interacciones 
ADD COLUMN IF NOT EXISTS funcion_utilizada VARCHAR(100) DEFAULT 'General';

-- ============================================================
-- Datos de ejemplo (OPCIONAL - ejecutar si quieres datos de prueba)
-- ============================================================
-- Actualizar algunas filas con datos de ejemplo para que el dashboard muestre datos

-- Asignar valores de calidad variados (algunas respuestas 0, 1, 2)
UPDATE interacciones 
SET calidad_respuesta = CASE 
  WHEN id % 3 = 0 THEN 0  -- 33% baja calidad
  WHEN id % 3 = 1 THEN 1  -- 33% calidad media
  ELSE 2                   -- 33% alta calidad
END
WHERE rol = 'assistant' AND calidad_respuesta = 1;

-- Asignar funciones variadas
UPDATE interacciones 
SET funcion_utilizada = CASE 
  WHEN id % 5 = 0 THEN 'Análisis'
  WHEN id % 5 = 1 THEN 'Síntesis'
  WHEN id % 5 = 2 THEN 'Generación'
  WHEN id % 5 = 3 THEN 'Evaluación'
  ELSE 'Otros'
END
WHERE rol = 'assistant' AND funcion_utilizada = 'General';

-- ============================================================
-- Verificación
-- ============================================================
-- Ejecuta esta consulta para verificar que las columnas fueron añadidas:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'interacciones' AND column_name IN ('calidad_respuesta', 'funcion_utilizada');

-- Ver ejemplo de datos:
-- SELECT id, calidad_respuesta, funcion_utilizada FROM interacciones LIMIT 10;
