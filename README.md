# MiCaja

Progressive Web App para la gestión de finanzas personales. Funciona completamente offline con almacenamiento local en IndexedDB.

## Tecnologías

- React 19 + Vite + TypeScript
- TailwindCSS 4 + shadcn/ui
- Zustand (estado global)
- React Router 7
- Dexie (IndexedDB)
- Recharts (gráficos)
- vite-plugin-pwa

## Funcionalidades

- Dashboard con resumen financiero
- CRUD de ingresos, gastos, ahorros y préstamos
- Categorías personalizables
- Gestión de cuentas (efectivo, banco, billeteras)
- Objetivos de ahorro con barras de progreso
- Gestión de préstamos con estados y saldo pendiente
- Reportes mensuales y anuales
- Gráficos interactivos (líneas, barras, pastel)
- Filtros por fecha, categoría, cuenta y tipo
- Exportación a PDF, Excel y CSV
- Modo oscuro
- PWA instalable y offline
- **Autenticación** local con registro e inicio de sesión
- **Modo invitado** sin necesidad de cuenta
- **Datos de demostración** para explorar la app
- **Sincronización en la nube** vía endpoint REST configurable
- **Backup/restore** manual en archivo JSON

## Inicio rápido

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |

## Estructura

```
src/
├── components/   # UI reutilizable (layout, charts, forms, shared)
├── db/           # Dexie schema y seed
├── hooks/        # Custom hooks
├── lib/          # Utilidades, filtros, exportación
├── pages/        # Páginas de la aplicación
├── stores/       # Zustand stores
└── types/        # Tipos TypeScript
```

## Autenticación

- **Registro** en `/registro` con nombre, email y contraseña (hash PBKDF2)
- **Inicio de sesión** en `/login`
- **Modo invitado**: usa la app sin cuenta (datos solo locales)
- La sincronización en la nube requiere cuenta registrada

## Sincronización en la nube

Configura en **Configuración → Sincronización en la nube**:

1. URL del endpoint REST (acepta `PUT` para subir y `GET` para descargar)
2. Token Bearer de autenticación
3. Activa la sincronización automática (cada N minutos cuando hay conexión)

También puedes exportar/importar un archivo JSON para transferir datos entre dispositivos manualmente.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub llamado `micaja` (o cambia `repoName` en `vite.config.ts` si usas otro nombre).
2. Sube el código y haz push a la rama `main`.
3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Cada push a `main` desplegará la app automáticamente.

La URL será: `https://<tu-usuario>.github.io/micaja/`

Para probar el build de producción localmente:

```bash
npm run build:pages
npm run preview
```

## Datos de demostración

En **Configuración → Datos de demostración**, carga un conjunto de ejemplo con:
- 4 cuentas con saldos
- 20+ movimientos de los últimos 3 meses
- 3 objetivos de ahorro
- 3 préstamos en distintos estados

