# Foundathyon Deploy Action

Acción de GitHub reutilizable que construye la imagen Docker de tu repositorio y la sube al registry de Foundathyon. Esa subida es lo que dispara el deploy: el registry avisa a la plataforma y tu app queda en la URL que muestra el panel (`https://<subdominio>.foundathyon.dev`).

> English version below: [English](#english).

## Uso en tres pasos

1. **Crea el servicio en el panel de Foundathyon.** Anota el slug de la organización y el slug del servicio, y fija el puerto en el que escucha tu app. Genera el token del registry (`fdr_...`): se muestra una sola vez.
2. **Guarda el token como secret** del repositorio con el nombre `FOUNDATHYON_REGISTRY_TOKEN` (Settings > Secrets and variables > Actions).
3. **Añade el workflow** `.github/workflows/foundathyon.yml` (copia de [`examples/foundathyon.yml`](examples/foundathyon.yml)) y un `Dockerfile` en tu repo (hay plantillas en [`templates/`](templates)):

```yaml
name: Foundathyon Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: foundathyon-deploy
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: fundathyon/deploy-action@v1
        with:
          organization: tu-org
          service: tu-servicio
          token: ${{ secrets.FOUNDATHYON_REGISTRY_TOKEN }}
```

Cada push a `main` construye y sube `registry.foundathyon.dev/<organization>/<service>:<sha del commit>`. Solo se despliega por push a rama (sin tags ni previews por PR).

## Inputs

| Input | Obligatorio | Por defecto | Descripción |
|---|---|---|---|
| `organization` | sí | | Slug de la organización. Es el usuario del registry y la primera parte de la ruta de la imagen. |
| `service` | sí | | Nombre de la imagen en el registry (segunda parte de la ruta). Cópialo del workflow que da el panel: no siempre es el subdominio de la app. |
| `token` | sí | | Token `fdr_...`. Pásalo con `${{ secrets.FOUNDATHYON_REGISTRY_TOKEN }}`. |
| `registry` | no | `registry.foundathyon.dev` | Host del registry, sin esquema ni barras. |
| `context` | no | `.` | Contexto de build, relativo a la raíz del repo. |
| `dockerfile` | no | `Dockerfile` | Ruta del Dockerfile **relativa al `context`**. |
| `build-args` | no | vacío | `CLAVE=valor`, uno por línea. |
| `target` | no | vacío | Stage de un Dockerfile multi-stage. |
| `url` | no | vacío | URL de la app, como la muestra el panel. Solo se usa en el resumen del job; sin ella, el resumen remite al panel. |
| `domain` | no | `foundathyon.dev` | Obsoleto, no se usa: la URL no se puede deducir del nombre de la imagen (el subdominio lleva un sufijo aleatorio). Usa `url`. |
| `setup-buildx` | no | `true` | Pon `"false"` si tu job ya configuró Buildx (lo usa la prueba con registry local sin TLS). |

Los slugs deben cumplir `^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$` (3 a 32 caracteres: minúsculas, dígitos y guiones; empiezan y terminan en letra o dígito).

## Outputs

| Output | Descripción |
|---|---|
| `image` | Referencia completa con digest: `registry.foundathyon.dev/<org>/<servicio>@sha256:...`. |
| `digest` | Digest del manifiesto subido (`sha256:...`). |

Al terminar, la acción escribe en el resumen del job la imagen, el digest y la URL de la app (la del input `url`, o un aviso de que está en el panel).

## Qué hace exactamente

- Valida los inputs con mensajes claros y comprueba que existe el Dockerfile.
- Configura Buildx, hace login (usuario = slug de la organización, contraseña = token) y construye con `linux/amd64`.
- Sube **un solo manifiesto**: `provenance: false` y `sbom: false`. Los índices multi-arch y las attestations llegan al registry como manifiestos sueltos y confunden el disparo del deploy.
- El tag es **solo el SHA del commit** (`github.sha`). `github.ref_name` puede contener `/` y daría un tag inválido. El SHA también va en la label OCI `org.opencontainers.image.revision`.
- Usa caché de GitHub Actions (`type=gha`).

## Plantillas de Dockerfile

En [`templates/`](templates), cada una con una app mínima en `example/` para probarla:

| Plantilla | Puerto en el panel | Notas |
|---|---|---|
| `nextjs` | `3000` | Requiere `output: "standalone"` en `next.config`. Necesita `package-lock.json`. |
| `express` | `3000` | La app debe leer `PORT` y escuchar en `0.0.0.0`. Necesita `package-lock.json`. |
| `static` | `8080` | nginx sin privilegios; el sitio va en `public/`. |

Cópiala a la raíz de tu repo como `Dockerfile` junto con el `.dockerignore`.

## Errores comunes

| Síntoma | Causa y arreglo |
|---|---|
| El deploy falla o el servicio no responde aunque el build es verde | La app escucha en `localhost` / `127.0.0.1`. Dentro de un contenedor debe escuchar en `0.0.0.0` (Next.js: `HOSTNAME=0.0.0.0`; Express: `app.listen(port, "0.0.0.0")`). |
| El contenedor arranca pero el panel dice que no responde | El puerto del panel no coincide con el que escucha la app. Revisa el comentario `PORT TO SET IN THE PANEL` de tu Dockerfile y el campo de puerto del servicio. |
| `denied`, `unauthorized` o `insufficient_scope` al subir | El token no tiene permiso: debe ser `read_write` y estar limitado al repo de ese servicio. `organization` y `service` deben coincidir con los del token. Genera otro en el panel. |
| `Input 'token' is empty` | Falta el secret `FOUNDATHYON_REGISTRY_TOKEN`, o el workflow corre desde un fork (los forks no reciben secrets). |
| `Dockerfile not found at ...` | No hay Dockerfile en esa ruta. Recuerda que `dockerfile` es relativo a `context`, y que `actions/checkout` debe ir antes de la acción. |
| `Input 'organization' ... is not a valid slug` | Usa el slug que muestra el panel, no el nombre visible. |

## Versionado

La acción se versiona con tags semver (`v1.0.0`, `v1.1.0`, ...) y un tag móvil por versión mayor, `v1`, que apunta a la última `v1.x.y`. Usa `@v1` para recibir correcciones sin cambios de contrato. Un cambio incompatible de inputs/outputs sube a `v2`.

---

## English

Reusable GitHub Action that builds your repository's Docker image and pushes it to the Foundathyon registry. The push is what triggers the deploy: the registry notifies the platform and your app goes live at the URL the panel shows (`https://<subdomain>.foundathyon.dev`).

### Quick start

1. Create the service in the Foundathyon panel; note the organization slug, the service slug and set the port your app listens on. Generate the registry token (`fdr_...`), shown once.
2. Save it as the repository secret `FOUNDATHYON_REGISTRY_TOKEN`.
3. Add the workflow from [`examples/foundathyon.yml`](examples/foundathyon.yml) and a `Dockerfile` (starters in [`templates/`](templates)). Each push to `main` pushes `registry.foundathyon.dev/<organization>/<service>:<commit sha>`.

### Inputs and outputs

Inputs: `organization`, `service`, `token` (required); `registry` (default `registry.foundathyon.dev`), `context` (`.`), `dockerfile` (`Dockerfile`, relative to `context`), `build-args` (one `KEY=value` per line), `target`, `url` (the app's URL as the panel shows it; only used in the job summary), `domain` (deprecated, unused), `setup-buildx` (`true`).

Outputs: `image` (reference with digest) and `digest`.

### Design notes

One manifest per push (`linux/amd64`, no provenance, no SBOM) so the platform trigger sees exactly one image. The tag is the commit SHA only, since branch names can contain `/`.

### Common errors

- App listens on `localhost`: bind to `0.0.0.0`.
- Port mismatch: the panel port must match the port your app listens on.
- Token without permission: it must be `read_write` for this service's repository, and the registry username is the organization slug.
- Missing Dockerfile: `dockerfile` is relative to `context`; run `actions/checkout` first.

### Versioning

Semver tags (`v1.0.0`, ...) plus a moving major tag `v1`. Pin `@v1` to get fixes; breaking changes ship as `v2`.
