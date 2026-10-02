# Reglas del Sistema - Orquestación de Skills de Antigravity

## Inicialización Obligatoria
Antes de procesar cualquier prompt o tarea del usuario, el agente debe considerar las habilidades disponibles en `.agents/skills/`.

## Habilidades Core Permanentes
Es estrictamente obligatorio aplicar SIEMPRE, de forma transversal y en cada respuesta o refactorización, los principios de las siguientes habilidades:
- **ponytail** (`.agents/skills/ponytail/SKILL.md`): Mantener soluciones super limpias, minimalistas, aplicando YAGNI rigurosamente y evitando sobre-ingeniería.
- **caveman** (`.agents/skills/caveman/SKILL.md`): Respuestas concisas y directas sin relleno innecesario.
- **gsd** (`.agents/skills/gsd-fast/SKILL.md` / `.agents/skills/gsd-execute-phase/SKILL.md`): Get Shit Done. Enfoque directo en entregar resultados funcionales y probados rápidamente.

## Silenciar Notificaciones de Carga
Operar bajo estas filosofías automáticamente en cada pensamiento o plan de ejecución sin requerir avisos informativos.
