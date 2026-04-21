import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import makeWASocket, {
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
	Browsers,
	makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { buildLottieSticker } from './img2was.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', 'auth_info_baileys');

const { values } = parseArgs({
	options: {
		was: { type: 'string', short: 'w' },
		image: { type: 'string', short: 'i' },
		pack: { type: 'string', short: 'p', default: 'Chomp' },
		id: { type: 'string', short: 'n', default: '1' },
		name: { type: 'string' },
		help: { type: 'boolean', short: 'h' },
	},
});

const wasFilePath = values.was ? path.resolve(values.was) : null;
const imagePath = values.image ? path.resolve(values.image) : null;

// Validations are now handled inside startSock to allow batch fallback
if (values.help) {
	console.log(`
Usage: bun send --was <path> or --image <path>

Options:
  -w, --was <path>    Path to the .was sticker file
  -i, --image <path>  Path to the source image/lottie file
  -p, --pack <name>   Pack name (default: Chomp)
  -n, --id <id>       ID (default: 1)
  --name <name>       Custom sticker pack name (Default: image filename)
  -h, --help          Show this help message
	`);
	process.exit(values.help ? 0 : 1);
}


const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
	const { version } = await fetchLatestBaileysVersion();

	const logger = pino({ level: 'silent' });
	const sock = makeWASocket({
		version,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		browser: Browsers.ubuntu('Chrome'),
		logger,
		markOnlineOnConnect: false,
	});

	sock.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect, qr } = update;

		if (qr) {
			console.log('\n📱 Scan this QR code with WhatsApp:\n');
			const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
			console.log(qrString);
		}

		if (connection === 'open') {
			console.log('✅ Connected!\n');

			const rawJid = sock.user?.id ?? '';
			const selfJid = rawJid.replace(/:.*@/, '@');
			console.log(`📬 Target JID: ${selfJid}`);

			let targetWas = wasFilePath;

			if (imagePath) {
				console.log(`🎨 Converting image to Lottie sticker (${values.pack} #${values.id})...`);
				const tempSalida = path.join(os.tmpdir(), `sticker-${crypto.randomBytes(6).toString('hex')}.was`);
				try {
					targetWas = await buildLottieSticker({
						pack: values.pack,
						id: parseInt(values.id),
						imagePath: imagePath,
						packName: values.name,
						output: tempSalida,
					});
					console.log('✅ Conversion complete!');
				} catch (err) {
					console.error(`❌ Conversion failed: ${err.message}`);
					process.exit(1);
				}
			}

			if (targetWas && fs.existsSync(targetWas)) {
				// 1. Send an anchor message to quote (required for some .was stickers to render)
				const anchorText = imagePath 
					? '🪄 Converting to Lottie sticker...' 
					: `📦 Sending sticker: ${path.basename(targetWas)}`;
				
				console.log(`📝 ${anchorText}`);
				const sentMsg = await sock.sendMessage(selfJid, { text: anchorText });

				// 2. Send the sticker as a reply
				console.log(`📤 Sending sticker: ${path.basename(targetWas)}...`);
				await sock.sendMessage(selfJid, {
					sticker: fs.readFileSync(targetWas),
					mimetype: 'application/was',
					isLottie: true,
					isAnimated: true,
				}, { quoted: sentMsg });
				
				console.log('✅ Sticker sent!');
				
				// Cleanup temp file if we created it
				if (imagePath && targetWas.includes(os.tmpdir())) {
					fs.unlinkSync(targetWas);
				}
			} else {
				console.log('⚠️ No .was file to send. Use --was or --image');
			}

			// Small delay before exit
			setTimeout(() => process.exit(0), 3000);
		}

		if (connection === 'close') {
			const statusCode = (lastDisconnect?.error instanceof Boom)
				? lastDisconnect.error.output.statusCode
				: lastDisconnect?.error?.output?.statusCode;

			if (statusCode === DisconnectReason.loggedOut) {
				console.error('❌ Logged out. Delete auth_info_baileys/ and try again.');
				process.exit(1);
			} else {
				console.log('⏳ Reconnecting...');
				startSock();
			}
		}
	});

	sock.ev.on('creds.update', saveCreds);
};

console.log('🔌 Connecting to WhatsApp...');
startSock();
