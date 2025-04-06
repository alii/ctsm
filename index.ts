#!/usr/bin/env bun

import type {JSONSchemaForNPMPackageJsonFiles2 as PackageJSON} from '@schemastore/package';
import type {SchemaForPrettierrc as PrettierRC} from '@schemastore/prettierrc';
import {$} from 'bun';
import * as path from 'node:path';
import {parse} from './args.ts';
import {getGitUser} from './git.ts';
import {mit} from './mit.ts';
import {code, confirmOrDie, die, getBinName, isDirectoryEmpty, json, writeFiles} from './util.ts';

const cwd = process.cwd();

const probablyIsThisProject = await isDirectoryEmpty(cwd);

const [flags, args] = parse();
const [directoryName = probablyIsThisProject ? cwd : null] = args;

const SKIP_CONFIRMATION = flags.getBooleanOrDefault('y', false);
const PACKAGE_MANAGER = flags.getStringAsOptionOrDefault(
	'p',
	['bun', 'npm', 'yarn', 'pnpm'],
	'bun',
);

function installCommand(packageManager: typeof PACKAGE_MANAGER, packages: string[], dev: boolean) {
	const p = {raw: packages.map(p => $.escape(p)).join(' ')};

	const lastTwo = (dev_string: string, normal_string: string = '') => {
		if (dev) return [dev_string, p];
		return [normal_string, p];
	};

	return {
		npm: () => $`npm install ${lastTwo(dev ? '--save-dev ' : '--save ')}`,
		yarn: () => $`yarn add ${lastTwo(dev ? '--dev ' : ' ')}`,
		pnpm: () => $`pnpm add ${lastTwo(dev ? '--save-dev ' : ' ')}`,
		bun: () => $`bun i ${lastTwo(dev ? '--bun ' : ' ')}`,
	}[packageManager]();
}

if (!directoryName) {
	if (probablyIsThisProject) {
		die('Error: Expected this folder to have a name');
	} else {
		die([
			'',
			'You ran CTSM in a folder that was not already empty!',
			'You must specify a name of the package to create it',
			'',
			`Example: \`${getBinName()} my-awesome-library\``,
			'',
		]);
	}
}

const realPackageDirectory = path.resolve(cwd, directoryName);
const moduleName = path.basename(realPackageDirectory);

if (!SKIP_CONFIRMATION) {
	await confirmOrDie(
		`Create '${moduleName}' with ${PACKAGE_MANAGER} at ${realPackageDirectory}? (Y/n) `,
		{acceptDefault: true},
	);
}

console.log(`Writing package ${moduleName} at ${realPackageDirectory}`);

const user = await getGitUser();

await writeFiles(realPackageDirectory, {
	'package.json': json<PackageJSON>({
		name: moduleName,
		version: '0.0.1',
		description: 'Description',
		keywords: [],
		author: user.name
			? {
					name: user.name,
					email: user.email,
				}
			: undefined,
		license: 'MIT',
		type: 'module',
		scripts: {
			build: 'tsup',
			release: `${PACKAGE_MANAGER} run build && ${PACKAGE_MANAGER} publish`,
		},
		exports: {
			'./package.json': './package.json',
			'.': {
				import: './dist/index.js',
				require: './dist/index.cjs',
			},
		},
		files: ['LICENSE', 'README.md', 'dist'],
	}),
	'tsup.config.ts': code(`
    	import {defineConfig} from 'tsup';
		
    	export default defineConfig({
    		entry: ['./src/index.ts'],
    		format: ['esm', 'cjs'],
    		clean: true,
    		dts: true,
    		splitting: true,
    		treeshake: true,
    	});
  	`),
	'.prettierrc': json<PrettierRC>({
		$schema: 'http://json.schemastore.org/prettierrc',
		singleQuote: true,
		semi: true,
		printWidth: 100,
		trailingComma: 'all',
		arrowParens: 'avoid',
		bracketSpacing: false,
		useTabs: true,
		quoteProps: 'consistent',
	}),
	'src/index.ts': code(`
    export function add(a: number, b: number) {
      return a + b;
    }
  `),
	'LICENSE': await mit(user.name),
	'.gitignore': code(`
    node_modules
    dist
    bun.lockb
    .DS_Store
    .idea
    .vscode
  `),
});

const install = installCommand(PACKAGE_MANAGER, ['prettier', 'typescript', 'tsup'], true);
await install.cwd(realPackageDirectory);

await $`git init`.cwd(realPackageDirectory);
