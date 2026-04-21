import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TIPOS_MIME = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
};

const PACKS_DISPONIBLES = {
	Chomp: [1],
	Pompom: Array.from({ length: 15 }, (_, i) => i + 1),
};

class ConstructorSticker {
	#resolverPack(pack, id) {
		const clave = Object.keys(PACKS_DISPONIBLES).find(
			k => k.toLowerCase() === String(pack ?? '').toLowerCase()
		);

		if (!clave) {
			throw new Error(
				`Pack "${pack}" no encontrado. Disponibles: ${Object.keys(PACKS_DISPONIBLES).join(', ')}`
			);
		}

		const ids = PACKS_DISPONIBLES[clave];

		if (!ids.includes(Number(id))) {
			throw new Error(
				`${clave} #${id} no existe. IDs disponibles: ${ids.join(', ')}`
			);
		}

		return path.join(__dirname, clave, String(id));
	}

	#copiarDirectorio(origen, destino) {
		fs.mkdirSync(destino, { recursive: true });
		for (const elemento of fs.readdirSync(origen, { withFileTypes: true })) {
			const desde = path.join(origen, elemento.name);
			const hasta = path.join(destino, elemento.name);
			elemento.isDirectory()
				? this.#copiarDirectorio(desde, hasta)
				: fs.copyFileSync(desde, hasta);
		}
	}

	#obtenerMime(rutaImagen, mime) {
		if (mime) return mime;
		return TIPOS_MIME[path.extname(rutaImagen ?? '').toLowerCase()] ?? null;
	}

	#aDataUri(buffer, mime) {
		if (!buffer || !Buffer.isBuffer(buffer)) {
			throw new Error('Buffer inválido.');
		}
		if (!mime) {
			throw new Error('Tipo MIME no detectado. Envía rutaImagen o mime.');
		}
		return `data:${mime};base64,${buffer.toString('base64')}`;
	}

	#reemplazarImagenBase64(rutaJson, dataUri) {
		const json = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

		if (!Array.isArray(json.assets)) {
			throw new Error('JSON sin assets.');
		}

		const asset = json.assets.find(
			a => typeof a?.p === 'string' && a.p.startsWith('data:image/')
		);

		if (!asset) {
			throw new Error('No se encontró ninguna imagen en base64 en el Lottie.');
		}

		asset.p = dataUri;
		fs.writeFileSync(rutaJson, JSON.stringify(json));
	}

	#comprimirAWas(carpeta, salida) {
		fs.mkdirSync(path.dirname(salida), { recursive: true });

		const rutaZip = salida.replace(/\.was$/i, '.zip');
		if (fs.existsSync(rutaZip)) fs.unlinkSync(rutaZip);
		if (fs.existsSync(salida)) fs.unlinkSync(salida);

		execSync(`zip -r "${rutaZip}" .`, { cwd: carpeta, stdio: 'ignore' });
		fs.renameSync(rutaZip, salida);
	}

	async construir({
		pack,
		id,
		buffer,
		rutaImagen,
		mime,
		salida = path.resolve('sticker.was'),
		rutaJson = 'animation/animation_secondary.json',
	}) {
		if (!pack || id === undefined) {
			throw new Error('Los parámetros pack e id son obligatorios.');
		}
		if (!buffer && !rutaImagen) {
			throw new Error('Envía rutaImagen o buffer.');
		}

		const carpetaBase = this.#resolverPack(pack, id);

		if (!buffer && rutaImagen) {
			if (!fs.existsSync(rutaImagen)) throw new Error('Imagen no encontrada.');
			buffer = fs.readFileSync(rutaImagen);
		}

		mime = this.#obtenerMime(rutaImagen, mime);
		if (!mime) {
			throw new Error('Formato no soportado. Usa PNG, JPG, JPEG o WEBP.');
		}

		const temporal = path.join(
			os.tmpdir(),
			`walottie-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
		);

		try {
			this.#copiarDirectorio(carpetaBase, temporal);
			this.#reemplazarImagenBase64(
				path.join(temporal, rutaJson),
				this.#aDataUri(buffer, mime)
			);
			this.#comprimirAWas(temporal, salida);
			return salida;
		} finally {
			fs.rmSync(temporal, { recursive: true, force: true });
		}
	}

	listarPacks() {
		return structuredClone(PACKS_DISPONIBLES);
	}
}

const instancia = new ConstructorSticker();

export const buildLottieSticker = opciones => instancia.construir(opciones);
export const listPacks = () => instancia.listarPacks();
