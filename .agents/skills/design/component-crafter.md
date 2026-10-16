# Skill: React Component Crafter

## Objetivo
Transformar especificaciones funcionales o wireframes en componentes React 19 accesibles, limpios y responsivos.

## Pautas Obligatorias
1. **Estructura del Componente:**
   - Usar componentes funcionales en TypeScript con tipado explícito de `props`.
   - Evitar inline styles; utilizar clases semánticas de Tailwind 4.
2. **Estados Obligatorios:**
   - Todo componente interactivo debe contemplar: estado normal, hover, active, focus-visible y disabled.
   - En componentes de datos (listas de entregas, paradas, vehículos): contemplar siempre estado de carga (`skeleton`), estado vacío (`empty state` con icono y mensaje claro) y estado de error.
3. **Consistencia de Botones y Tarjetas:**
   - Tarjetas (`cards`): fondo blanco / slate-900, esquinas redondeadas estándar (`rounded-xl` o `rounded-2xl`), borde fino `border border-slate-200/60 dark:border-slate-800`.
   - Transiciones suaves (`transition-colors duration-150`).