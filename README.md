# Cartitas

App en Angular con una pantalla de clave, las cartas y un reproductor de música.

## Desarrollo

Requiere Node 22.22.3+ o 24.

```bash
npm install
npm start        # http://localhost:4200
npm test
npm run build    # sale en dist/letters-app/browser
```

## Estructura

```
src/app/
├── app.ts               # muestra el bloqueo o el interior
├── data.ts              # cartas, canciones y hash de la clave (aquí se edita el contenido)
├── player.service.ts    # audio, canción actual y favoritas
├── lock/                # pantalla de la clave de 8 dígitos
├── home/                # selector de color y la carta
└── player/              # mini-reproductor, panel y lista de canciones
```

Las canciones e imágenes van en `public/assets/`. Netlify usa `netlify.toml` para compilar y publicar.
