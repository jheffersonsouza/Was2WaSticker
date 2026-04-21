import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_PATH = path.join(__dirname, '..', 'res', 'template');

const MIME_TYPES = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
};

const AVAILABLE_PACKS = {
	Chomp: [1],
};

class StickerBuilder {
	#resolvePack(pack, id) {
		const key = Object.keys(AVAILABLE_PACKS).find(
			k => k.toLowerCase() === String(pack ?? '').toLowerCase()
		);

		if (!key) {
			throw new Error(
				`Pack "${pack}" not found. Available: ${Object.keys(AVAILABLE_PACKS).join(', ')}`
			);
		}

		const ids = AVAILABLE_PACKS[key];

		if (!ids.includes(Number(id))) {
			throw new Error(
				`${key} #${id} does not exist. Available IDs: ${ids.join(', ')}`
			);
		}

		return path.join(TEMPLATES_PATH, key, String(id));
	}

	#copyDirectory(source, destination) {
		fs.mkdirSync(destination, { recursive: true });
		for (const element of fs.readdirSync(source, { withFileTypes: true })) {
			const from = path.join(source, element.name);
			const to = path.join(destination, element.name);
			element.isDirectory()
				? this.#copyDirectory(from, to)
				: fs.copyFileSync(from, to);
		}
	}

	#getMime(imagePath, mime) {
		if (mime) return mime;
		return MIME_TYPES[path.extname(imagePath ?? '').toLowerCase()] ?? null;
	}

	#toDataUri(buffer, mime) {
		if (!buffer || !Buffer.isBuffer(buffer)) {
			throw new Error('Invalid buffer.');
		}
		if (!mime) {
			throw new Error('MIME type not detected. Provide imagePath or mime.');
		}
		return `data:${mime};base64,${buffer.toString('base64')}`;
	}

	#replaceBase64Image(jsonPath, dataUri) {
		const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

		if (!Array.isArray(json.assets)) {
			throw new Error('JSON without assets.');
		}

		const asset = json.assets.find(
			a => typeof a?.p === 'string' && a.p.startsWith('data:image/')
		);

		if (!asset) {
			throw new Error(`No base64 image found in Lottie asset. Pack "${this.currentPack}" might not support image injection.`);
		}

		asset.p = dataUri;
		fs.writeFileSync(jsonPath, JSON.stringify(json));
	}

	#compressToWas(folder, output) {
		fs.mkdirSync(path.dirname(output), { recursive: true });

		const absoluteOutput = path.resolve(output);
		const zipPath = absoluteOutput.replace(/\.was$/i, '.zip');

		if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
		if (fs.existsSync(absoluteOutput)) fs.unlinkSync(absoluteOutput);

		execSync(`zip -r "${zipPath}" .`, { cwd: folder, stdio: 'ignore' });
		fs.renameSync(zipPath, absoluteOutput);
	}

	async build({
		pack,
		id,
		buffer,
		imagePath,
		mime,
		output = path.resolve('sticker.was'),
		jsonPath = 'animation/animation_secondary.json',
		packName,
	}) {
		if (!pack || id === undefined) {
			throw new Error("Parameters 'pack' and 'id' are required.");
		}
		if (!buffer && !imagePath) {
			throw new Error("Provide 'imagePath' or 'buffer'.");
		}

		const baseFolder = this.#resolvePack(pack, id);

		if (!buffer && imagePath) {
			if (!fs.existsSync(imagePath)) throw new Error('Image not found.');
			buffer = fs.readFileSync(imagePath);
		}

		mime = this.#getMime(imagePath, mime);
		if (!mime) {
			throw new Error('Format not supported. Use PNG, JPG, JPEG or WEBP.');
		}

		const temp = path.join(
			os.tmpdir(),
			`walottie-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
		);

		try {
			this.currentPack = pack;
			this.#copyDirectory(baseFolder, temp);
			
			// Replace in the specified JSON
			// Replace image in the specified JSON
			this.#replaceBase64Image(
				path.join(temp, jsonPath),
				this.#toDataUri(buffer, mime)
			);

			// NEW: Update sticker-pack-name in overridden_metadata to match image name
			const metadataPath = path.join(temp, 'animation', 'animation.json.overridden_metadata');
			if (fs.existsSync(metadataPath)) {
				try {
					const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
					// Use custom packName if provided, otherwise use image name (no extension)
					const finalPackName = packName || (imagePath ? path.parse(imagePath).name : 'Custom');
					metadata['sticker-pack-name'] = finalPackName;
					fs.writeFileSync(metadataPath, JSON.stringify(metadata));
					console.log(`🏷️  Sticker pack name set to: ${finalPackName}`);
				} catch (err) {
					console.warn(`⚠️  Could not update metadata: ${err.message}`);
				}
			}
			
			// The working sticker (STK-...) confirmed that the 'animation/' folder 
			// IS required inside the .was zip.
			this.#compressToWas(temp, output);
			return output;
		} finally {
			fs.rmSync(temp, { recursive: true, force: true });
		}
	}

	listPacks() {
		return structuredClone(AVAILABLE_PACKS);
	}
}

const instance = new StickerBuilder();

export const buildLottieSticker = options => instance.build(options);
export const listPacks = () => instance.listPacks();

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		const { values } = parseArgs({
			options: {
				image: { type: 'string', short: 'i' },
				pack: { type: 'string', short: 'p', default: 'Chomp' },
				id: { type: 'string', short: 'n', default: '1' },
				name: { type: 'string' },
				output: { type: 'string', short: 'o' },
				help: { type: 'boolean', short: 'h' },
			},
		});

		if (values.help || !values.image) {
			console.log(`
Usage: bun convert --image <path> [options]

Options:
  -i, --image <path>    Path to the source image (Required)
  -p, --pack <name>     Sticker pack name (Default: Chomp)
  -n, --id <number>     Sticker ID within the pack (Default: 1)
  -o, --output <path>   Output .was file path (Default: res/output/sticker.was)
  -h, --help            Show this help message
			`);
			process.exit(values.help ? 0 : 1);
		}

		const defaultOutput = path.join(process.cwd(), 'res', 'output', 'sticker.was');
		const outputPath = values.output ? path.resolve(values.output) : defaultOutput;

		console.log(`Building sticker from ${values.image}...`);
		const result = await buildLottieSticker({
			pack: values.pack,
			id: parseInt(values.id),
			imagePath: values.image,
			packName: values.name,
			output: outputPath,
		});

		console.log(`✅ Sticker created successfully at: ${result}`);
	} catch (error) {
		console.error(`❌ Error: ${error.message}`);
		process.exit(1);
	}
}
