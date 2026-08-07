# Kraymer — Brand Book

Guía de identidad de marca interactiva de Kraymer Art. Sitio estático (HTML/CSS/JS, sin build step) pensado para desplegarse directo en Cloudflare Pages.

## Estructura

```
index.html         página única con navegación lateral por secciones
css/style.css       tokens de diseño (color, tipografía, grid) + estilos
js/main.js          nav móvil + resaltado de sección activa
assets/fonts/       Nantes (Light/Regular/Bold + itálicas), woff2
assets/logo/        wordmark Kraymer, SVG
assets/downloads/   zip de fuentes + logo, para la sección de descargas
```

Bricolage Grotesque se carga desde Google Fonts (variable, pesos 200–800). Nantes es autohosted.

## Estado — MVP v0.1

Contenido basado en el framework de dirección creativa (`kraymer_brandIdentityStrategy.pdf`), omitiendo el bloque inicial de auditoría de marca. Pendiente de una siguiente pasada:

- Valores de color exactos (los swatches del PDF son gráficos, no texto — hay que tomarlos visualmente de las páginas 22–24 o pedirlos al equipo de diseño)
- Tokens de tipografía en px/rem con la escala real
- Plantilla descargable de "Collection World"
- Ejemplos de aplicación reales por colección

## Desarrollo local

No hay build step. Abrir `index.html` directamente o servir con cualquier servidor estático:

```bash
npx serve .
```

## Despliegue

Desplegado en Cloudflare Pages conectado a este repo de GitHub. Framework preset: **None** — output directory: `/` (raíz del repo).
