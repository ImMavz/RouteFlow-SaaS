# Reglas del Sistema - Orquestación de Skills de Antigravity

## Inicialización Obligatoria
Antes de procesar cualquier prompt o tarea del usuario, el agente debe leer el catálogo en `.agents/skills/`.

## Habilidades Core Permanentes
Es estrictamente obligatorio que apliques SIEMPRE, de forma transversal y en cada mensaje o refactorización, los principios y lineamientos de las siguientes habilidades:
- **ponytail** (`.agents/skills/ponytail/SKILL.md`): Mantén soluciones súper limpias, minimalistas, aplicando YAGNI rigurosamente y evitando sobre-ingeniería.
- **caveman** (`.agents/skills/caveman/SKILL.md`): Simplicidad extrema, soluciones directas, rústicas y robustas que funcionen sin rodeos.
- **gsd** (`.agents/skills/gsd/SKILL.md`): Get Sh*t Done. Enfoque absoluto en entregar resultados funcionales, prácticos y ejecutables rápidamente.

## Carga Dinámica de Otras Skills
Para el resto de las habilidades secundarias en el directorio (como `senior-frontend`, `ui-design-system`, etc.), mantén el comportamiento por defecto de evaluación según el contexto de la solicitud.

## Silenciar Notificaciones de Carga
No es necesario notificar al usuario de forma explícita que has activado estas habilidades core; simplemente opera bajo sus filosofías desde tu primer pensamiento o plan de ejecución.
