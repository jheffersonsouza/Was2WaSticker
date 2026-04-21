> **Disclaimer:** This project was "vibe coded" using **Gemini 3.1 Pro** and **Claude 4.6** (via **Antigravity**). While the code has been successfully tested and is functional, it has **not been manually audited**. Proceed with CAUTION!

# 🚀 .WAS to WhatsApp Sticker

> **WhatsApp Lottie Sticker Builder (.was) and sender.** Convert static images into professional-grade animated stickers (`.was`) and send them directly to your connected device via Baileys.

---

## 🤝 Credits & Acknowledgments

This project is built upon the pioneering research and implementations in the WhatsApp Lottie ecosystem (upstream forks):

- [walottie-sticker](https://github.com/thisAdo/walottie-sticker) by **thisAdo**
- [Lottie-Whatsapp](https://github.com/Pedrozz13755/Lottie-Whatsapp) by **Pedrozz13755**

---

## 📦 Installation

This project requires **[Bun](https://bun.sh)**. You can also use **Mise** to manage your environment if preferred.

```bash
# Install dependencies
bun install
```

---

## 📁 Template Installation

> **This repository does not provide pre-built `.was` templates.**
> To avoid potential copyright infringement (as templates often contain proprietary WhatsApp assets and animations), you must provide your own.

### How to install a template:

1.  Download a `.was` sticker file from a trusted source or extract one from your own WhatsApp device.
2.  Unzip the `.was` file.
3.  Place the contents in `res/template/` (so that `res/template/STICKER_NAME/animation/` contains the JSON files).

---

## 🚀 Usage

### 1. Send an Image as a Sticker

The fastest way to test is to convert an image and send it to yourself in one go:

```bash
bun run send --image res/input_test.png --name "My Cool Sticker"
```

### 2. Just Build the .was File

If you only want to generate the file without sending it:

```bash
bun run convert --image res/input_test.png --output my_sticker.was
```

### 3. Send an Existing .was File

```bash
bun run send --was res/output/your_sticker.was
```

---

## ⚙️ Arguments (CLI)

| Option     | Short | Commands          | Requirement                  | Description                             | Default                  |
| :--------- | :---- | :---------------- | :--------------------------- | :-------------------------------------- | :----------------------- |
| `--image`  | `-i`  | `convert`, `send` | **Required** (for convert)   | Path to source image (PNG, JPG, WebP)   | -                        |
| `--was`    | `-w`  | `send`            | **Required** (if no --image) | Path to an existing `.was` file to send | -                        |
| `--name`   |       | `convert`, `send` | Optional                     | Custom sticker pack name                | Image filename           |
| `--pack`   | `-p`  | `convert`, `send` | Optional                     | Sticker pack template                   | `Chomp`                  |
| `--id`     | `-n`  | `convert`, `send` | Optional                     | Template ID within the pack             | `1`                      |
| `--output` | `-o`  | `convert`         | Optional                     | Output destination file path            | `res/output/sticker.was` |

---

## 🛠️ Project Architecture

- **`bun run convert` (`src/img2was.js`)**:
  - The **Engine**. Handles Lottie template manipulation, asset injection, and packaging.
  - Offline-first: No WhatsApp connection required.

- **`bun run send` (`src/send.js`)**:
  - The **Courier**. Connects via Baileys, handles QR auth, and manages the delivery protocol.
  - Automates the "Quoted-Reply" pattern needed for Lottie stickers.

---

## 🤝 Contributing

Feel free to open issues or submit pull requests to add new templates or improve the delivery mechanism!

---

## ⚖️ Legal & Fair Use

### 🛑 Disclaimer

This project is an **unofficial, open-source research tool** developed for educational and experimental purposes. It is **not** affiliated with, authorized, maintained, or endorsed by **WhatsApp**, **Meta Platforms, Inc.**, or any of their affiliates or subsidiaries. Note that the techniques used for asset overriding and delivery rely on specific protocol behaviors that are subject to change and will likely be patched by WhatsApp in the near future.

### 🛡️ Use at Your Own Risk

The use of unofficial libraries (like Baileys) to interact with the WhatsApp protocol may violate their Terms of Service. By using this software, you acknowledge that you are doing so at your own risk. The developers of this project are not responsible for any account bans, data loss, or other damages resulting from the use of this tool.

### 📬 Notice and Takedown (DMCA)

If you are a copyright owner or an agent thereof and believe that any content in this repository infringes upon your copyrights, you may submit a notification. Please open an Issue in this repository with the relevant details, and the content will be removed promptly upon verification. **If you want this down, just ask nicely!**
