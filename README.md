# CARIBE SCIENCE

Plataforma regional de publicación científica de acceso abierto. Publicación
abierta, revisión por pares y datos (open access publishing, peer review and
open data) desde el Caribe hacia el mundo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI · SQLAlchemy 2 · Pydantic v2 · SQLite (PostgreSQL-ready) |
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript |
| Visual | React Three Fiber (globo 3D) · MapLibre GL (mapa sin tiles) |
| i18n | EN / ES (cookie `caribe_locale`) · dark mode (next-themes) |

## Requisitos

- Python 3.11+ (venv de `apps/backend`)
- Node.js 20+ (npm en `apps/web`)
- Docker opcional — sin él el sistema corre en **modo degradado** local
  (SQLite + storage local + caché en memoria).

## Arranque rápido

```powershell
# 1) Backend (puerto 8000)
cd apps/backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m app.seed --force   # datos demo (idempotente)
.\.venv\Scripts\python -m uvicorn app.main:app --port 8000

# 2) Frontend (puerto 3000) — en otra terminal
cd apps/web
npm install
npm run dev
```

O, en Windows, los scripts de una tecla:

- `start-backend.bat` — venv + seed + uvicorn
- `start-web.bat` — npm run dev

Abre `http://localhost:3000`. API docs en `http://localhost:8000/docs`.

## Cuentas demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@example.com | Admin123! |
| Editor | editor@example.com | Editor123! |
| Revisor | reviewer@example.com | Reviewer123! |
| Autor | author@example.com | Author123! |

## Verificación

```powershell
cd apps/web
npm run build      # build de producción (16 rutas)
```

## Documentación

Ver `docs/`:

- [architecture](docs/architecture.md) · [api](docs/api.md) ·
  [database](docs/database.md) · [editorial-workflow](docs/editorial-workflow.md)
- [security](docs/security.md) · [integrations](docs/integrations.md) ·
  [performance](docs/performance.md) · [3d-experience](docs/3d-experience.md)
- [i18n](docs/i18n.md) · [roadmap](docs/roadmap.md)

## Estado

Backend verificado end-to-end (auth, RBAC, flujo editorial completo, búsqueda).
Frontend: build OK y todas las páginas renderizadas contra la API viva.
Próximos pasos en [roadmap](docs/roadmap.md).