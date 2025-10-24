# Pokédex en tiempo real (T3 + Next.js + tRPC)

Pequeño proyecto T3 que muestra información en tiempo real de la PokéAPI: listado completo de Pokémon (sin paginación), filtros por tipo y generación, buscador con evoluciones, y página de detalle con stats y cadena evolutiva. El estado de filtros y el scroll se conservan al navegar.

## Cómo levantar el proyecto en local

Requisitos:
- Node.js 18+ (recomendado 20+)
- pnpm (el repo usa pnpm@10)

Pasos:
1. Instala dependencias
   - `pnpm install`
2. Arranca en desarrollo
   - `pnpm dev`
   - Abre http://localhost:3000
3. Build + preview (opcional)
   - `pnpm preview` (hace `next build` y luego `next start`)

Scripts útiles:
- `pnpm dev`: desarrollo con Next.js
- `pnpm build`: compila la app
- `pnpm start`: arranca la app ya compilada
- `pnpm check`: lint + typecheck

No se requieren variables de entorno para probar en local.

## ¿Cómo funciona?

Arquitectura (T3):
- Next.js 15 (App Router, RSC) + Tailwind para estilos.
- tRPC para la API (carpeta `src/server/api`). En componentes de servidor se usa un “caller” directo y en cliente React Query.
- Zustand para estado global del listado (filtros y posición de scroll).
- pokedex-promise-v2 como cliente de la PokéAPI con llamadas en batch.

Flujo principal:
- Listado (`/`):
  - Los filtros (search, type, generation) viven en Zustand.
  - El buscador tiene debounce (400 ms) para no saturar la API.
  - La query `pokemon.list` ejecuta SIEMPRE en servidor y devuelve todo el conjunto ya ordenado por id de especie.
  - Optimizaciones en servidor:
    - Resolución por lotes de species → variedad por defecto → detalles de Pokémon.
    - Expansión de búsqueda por cadenas evolutivas en batch.
    - Filtro por tipo validado sobre la variedad por defecto (evita falsos positivos por megas/formas).
  - Al navegar al detalle se guarda el `scrollY` y, al volver, se restaura.

- Detalle (`/pokemon/[name]`):
  - Muestra nombre, imagen oficial, generación, tipos, stats, habilidades y cadena evolutiva completa (con resaltado del actual).
  - Botón “Back to list” prioriza `router.back()` para mantener scroll; hay fallback a `push('/', { scroll: false })`.
  - En caso de error al cargar, se muestra un aviso y se vuelve al listado.

Puntos de entrada clave:
- `src/server/api/routers/pokemon.ts`: lógica de listados, filtros, búsqueda y detalle (con llamadas batched a la PokéAPI).
- `src/app/_components/*`: filtros, tarjetas, listado, detalle y evolución.
- `src/store/pokemonStore.ts`: Zustand (filtros + scroll).
- `src/trpc/*`: configuración de tRPC en servidor y cliente.
