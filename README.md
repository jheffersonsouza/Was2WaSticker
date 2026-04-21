# 🐢 walottie-sticker

Constructor de stickers Lottie animados en formato `.was` para WhatsApp.

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square) ![GitHub](https://img.shields.io/badge/github-thisAdo%2Fwalottie--sticker-181717?style=flat-square&logo=github)

> Fork de [Pedrozz13755/Lottie-Whatsapp](https://github.com/Pedrozz13755/Lottie-Whatsapp) 

---

## Instalación

```bash
npm install github:thisAdo/walottie-sticker
```

En package.json 
```bash
"walottie-sticker": "github:thisAdo/walottie-sticker"
```

> **Requisito del sistema:** el comando `zip` debe estar disponible.
>
> ```bash
> apt install zip   # Ubuntu / Debian
> pkg install zip   # Termux
> ```

---

## Packs disponibles

| Pack | IDs |
|------|-----|
| `Chomp` | 1 (Incompleto) |
| `Pompom` | 1 – 15 (Completo) |

---

## Uso

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildLottieSticker, listPacks } from 'walottie-sticker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Aquí construye el sticker animado a partir de un buffer de imagen...
const salida = await buildLottieSticker({
    pack: 'Pompom',   // Nombre del pack a usar
    id: 3,            // ID del sticker dentro del pack (Pompom tiene del 1 al 15)
    buffer: imagenBuffer, // Buffer de la imagen que se incrustará en la animación
    mime: 'image/jpeg', // Tipo MIME de la imagen (png, jpg/jpeg, webp etc..)
    salida: path.resolve(__dirname, 'sticker.was'), // Ruta de salida del archivo generado
});

await client.sendMessage(from, {
    sticker: fs.readFileSync(salida), 
    mimetype: 'application/was', // Tipo requerido por WhatsApp para stickers tipo Lottie
});
```

---

## API

### `buildLottieSticker(opciones)` → `Promise<string>`

Construye el sticker animado y devuelve la ruta del archivo `.was` generado.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `pack` | `string` | ✓ | Nombre del pack: `"Chomp"` o `"Pompom"` |
| `id` | `number` | ✓ | ID del sticker dentro del pack |
| `buffer` | `Buffer` | ✓\* | Imagen en memoria |
| `rutaImagen` | `string` | ✓\* | Ruta a un archivo de imagen |
| `mime` | `string` | — | Tipo MIME (se detecta automáticamente si se usa `rutaImagen`) |
| `salida` | `string` | — | Ruta del `.was` generado (default: `./sticker.was`) |
| `rutaJson` | `string` | — | Ruta relativa al JSON de Lottie dentro del pack (raramente necesario) |

\* Se requiere uno: `buffer` o `rutaImagen`.

**Formatos soportados:** `png` · `jpg` / `jpeg` · `webp`

---

### `listPacks()` → `Object`

Devuelve los packs disponibles y sus IDs.

```js
import { listPacks } from 'walottie-sticker';

// Retorna un objeto con cada pack y el arreglo de IDs disponibles en él
listPacks();
// { Chomp: [1], Pompom: [1, 2, 3, ..., 15] }
```

---

## Estructura interna

```
src/
├── index.js
├── Chomp/
│   └── 1/
│       └── animation/
└── Pompom/
    ├── 1/
    │   └── animation/
    ├── 2/
    └── ···
```

---

## Notas

- El JSON del Lottie debe tener una imagen embebida en base64 — el constructor la reemplaza con tu imagen.
- La carpeta original del pack nunca se modifica; se trabaja sobre una copia temporal por build.
- Los errores son descriptivos y en español.

---

<sub>Editado por [thisAdo](https://github.com/thisAdo)</sub>
