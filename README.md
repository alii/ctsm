# 🚀 CTSM - Create TypeScript Module

[![Tests](https://github.com/alii/ctsm/actions/workflows/test.yml/badge.svg)](https://github.com/alii/ctsm/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/ctsm.svg)](https://www.npmjs.com/package/ctsm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<h3>Create a modern TypeScript library with a single command! ✨</h3>

## 💫 Features

- **Zero Config** - Get up and running in seconds
- **Modern Defaults** - ESM and CJS dual package setup
- **TypeScript Ready** - Full TypeScript support with declaration files
- **Multiple Package Managers** - Works with npm, yarn, pnpm, and bun
- **Git Integration** - Auto-initializes your repo and adds proper .gitignore
- **License Generation** - Automatically creates MIT license with your name
- **Optimized Builds** - Uses tsup for fast, efficient builds
- **Smart Defaults** - Sensible configs for prettier and TypeScript
- **Tree Shaking** - Built-in support for optimized bundles

## 🚀 Quick Start

```bash
# With bun (recommended)
bunx ctsm@latest my-awesome-library

# With npm
npx ctsm@latest my-awesome-library

# With yarn
yarn dlx ctsm@latest my-awesome-library

# With pnpm
pnpm dlx ctsm@latest my-awesome-library
```

## 🛠️ Command Line Options

```bash
ctsm [name] [options]
```

### Options:

- `-y` - Skip confirmation prompts
- `-p=<manager>` - Specify package manager to use for the package (options: `bun,npm,yarn,pnpm`)

## 📦 What You Get

CTSM scaffolds a complete TypeScript library project with:

- Modern `package.json` with ESM and CJS support
- TypeScript configuration
- Prettier formatting
- tsup build setup
- Git initialization
- MIT license
- Clean directory structure
- Development dependencies installed

## 📂 Project Structure

```
my-awesome-library/
├── src/
│   └── index.ts         # Your library entry point
├── .gitignore           # Git ignore file
├── .prettierrc          # Prettier configuration
├── LICENSE              # MIT license
├── package.json         # Package configuration
├── tsconfig.json        # TypeScript configuration
└── tsup.config.ts       # Build configuration
```

## 🧙‍♂️ Advanced Usage

CTSM detects your Git user info to automatically:

- Populate package.json author fields
- Generate license with your name
- Initialize Git repository

## 💖 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📜 License

MIT © [Alistair Smith](https://github.com/alii)

```bash
bunx ctsm [name]
```

Flags:

- `-y`: Skips confirmations
- `-p=bun|npm|yarn|pnpm`: Sets the package manager to install with
