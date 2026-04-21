import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildLottieSticker, listPacks } from 'walottie-sticker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(listPacks());

if (condicion) {
	const salida = await buildLottieSticker({
		pack: 'Pompom',
		id: 2,
		buffer: dfileBuffer,
		mime: 'image/jpeg',
		salida: path.resolve(__dirname, 'sticker.was'),
	});

	await client.sendMessage(from, {
		sticker: fs.readFileSync(salida),
		mimetype: 'application/was',
	});
}

if (otraCondicion) {
	const salida = await buildLottieSticker({
		pack: 'Chomp',
		id: 1,
		buffer: dfileBuffer,
		mime: 'image/jpeg',
		salida: path.resolve(__dirname, 'sticker.was'),
	});

	await client.sendMessage(from, {
		sticker: fs.readFileSync(salida),
		mimetype: 'application/was',
	});
}
