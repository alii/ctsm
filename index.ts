#!/usr/bin/env bun

import type { JSONSchemaForNPMPackageJsonFiles2 as PackageJSON } from '@schemastore/package';
import type { SchemaForPrettierrc as PrettierRC } from '@schemastore/prettierrc';
import { $ } from 'bun';
import * as path from 'node:path';
import { parse } from './args.ts';
import { mit } from './mit.ts';
import {
  code,
  confirmOrDie,
  die,
  flagIsElse,
  getBinName,
  isDirectoryEmpty,
  json,
  writeFiles,
} from './util.ts';

const cwd = process.cwd();

const probablyIsThisProject = await isDirectoryEmpty(cwd);

const [flags, args] = parse();
const [directoryName = probablyIsThisProject ? cwd : null] = args;

const SKIP_CONFIRMATION = flags.y === true;
const PACKAGE_MANAGER = flagIsElse(flags.p, ['bun', 'npm', 'yarn', 'pnpm'], 'bun');

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
    { acceptDefault: true }
  );
}

console.log(`Writing package ${moduleName} at ${realPackageDirectory}`);

await writeFiles(realPackageDirectory, {
  'package.json': json<PackageJSON>({
    name: moduleName,
    version: '0.0.1',
    description: 'powered_by_ctsm',
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
      format: ['esm','cjs'],
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
  'LICENSE': await mit(),
  '.gitignore': code(`
    node_modules
    dist
    bun.lockb
    .DS_Store
    .idea
    .vscode
  `),
});

await $`${PACKAGE_MANAGER} install prettier typescript tsup --save-dev`.cwd(realPackageDirectory);
