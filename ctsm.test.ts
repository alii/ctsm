import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'bun:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {parse} from './args';
import {code, json} from './util';

const isCI = process.env.CI === 'true';

it('code() util function', () => {
	expect(
		code(`
            function add(a: number, b: number) {
                return a + b;
            }
        `),
	).toBe(`function add(a: number, b: number) {
    return a + b;
}`);

	expect(
		code(`



        function add(a: number, b: number) {
            return a + b;
        }



    `),
	).toBe(`function add(a: number, b: number) {
    return a + b;
}`);
});

it('json() util function', () => {
	expect(json({a: 1, b: 2})).toBe(`{\n\t"a": 1,\n\t"b": 2\n}`);
});

describe('args parser', () => {
	it('should parse empty args', () => {
		const [flags, args] = parse([]);
		expect(flags.size).toEqual(0);
		expect(args).toEqual([]);
	});

	it('should parse positional arguments', () => {
		const [flags, args] = parse(['file1.txt', 'file2.txt']);
		expect(flags.size).toEqual(0);
		expect(args).toEqual(['file1.txt', 'file2.txt']);
	});

	it('should parse boolean flags with --', () => {
		const [flags, args] = parse(['--verbose', '--debug']);
		expect(flags.getBooleanOrThrow('verbose')).toEqual(true);
		expect(flags.getBooleanOrThrow('debug')).toEqual(true);
		expect(args).toEqual([]);
	});

	it('should parse boolean flags with single -', () => {
		const [flags, args] = parse(['-v', '-d']);
		expect(flags.getBooleanOrThrow('v')).toEqual(true);
		expect(flags.getBooleanOrThrow('d')).toEqual(true);
		expect(args).toEqual([]);
	});

	it('should parse flags with values', () => {
		const [flags, args] = parse(['--port=3000', '--host=localhost']);
		expect(flags.getStringOrThrow('port')).toEqual('3000');
		expect(flags.getStringOrThrow('host')).toEqual('localhost');
		expect(args).toEqual([]);
	});

	it('should handle mixed flags and positional arguments', () => {
		const [flags, args] = parse(['--verbose', 'input.txt', '-o', '--format=json', 'output.txt']);
		expect(flags.getBooleanOrThrow('verbose')).toEqual(true);
		expect(flags.getBooleanOrThrow('o')).toEqual(true);
		expect(flags.getStringOrThrow('format')).toEqual('json');
		expect(args).toEqual(['input.txt', 'output.txt']);
	});

	it('should ignore empty flag names', () => {
		const [flags, args] = parse(['--', '--=value']);
		expect(flags.size).toEqual(0);
		expect(args).toEqual([]);
	});
});

describe('CTSM Integration Tests', () => {
	const tmpDir = path.join(os.tmpdir(), 'ctsm-integration-tests');
	const ctsmBin = path.resolve('./dist/index.js');

	async function runCTSM(
		args: string[] = [],
		cwd: string = tmpDir,
	): Promise<{
		exitCode: number;
		stdout: string;
		stderr: string;
	}> {
		let stdout = '';
		let stderr = '';

		const proc = Bun.spawn({
			cmd: ['bun', ctsmBin, ...args, '--y'],
			cwd,
			stdout: 'pipe',
			stderr: 'pipe',
			env: {...process.env, NODE_ENV: 'test'},
		});

		const stdoutReader = proc.stdout.getReader();
		const stderrReader = proc.stderr.getReader();

		while (true) {
			const {done, value} = await stdoutReader.read();
			if (done) break;
			stdout += new TextDecoder().decode(value);
		}

		while (true) {
			const {done, value} = await stderrReader.read();
			if (done) break;
			stderr += new TextDecoder().decode(value);
		}

		const exitCode = await proc.exited;

		console.log(`Command executed: bun ${ctsmBin} ${args.join(' ')} --y`);
		console.log(`Exit code: ${exitCode}`);
		console.log(`Stdout: ${stdout}`);
		console.log(`Stderr: ${stderr}`);

		return {exitCode, stdout, stderr};
	}

	async function verifyProject(projectPath: string, packageManager: string) {
		const files = await fs.readdir(projectPath);
		console.log(`Files in ${projectPath}:`, files);

		expect(files).toContain('package.json');
		expect(files).toContain('.prettierrc');
		expect(files).toContain('tsup.config.ts');
		expect(files).toContain('LICENSE');
		expect(files).toContain('.gitignore');
		expect(files).toContain('src');

		const srcFiles = await fs.readdir(path.join(projectPath, 'src'));
		expect(srcFiles).toContain('index.ts');

		const indexContent = await fs.readFile(path.join(projectPath, 'src', 'index.ts'), 'utf-8');
		expect(indexContent).toContain('export function add(a: number, b: number)');

		const packageJsonContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
		const packageJson = JSON.parse(packageJsonContent);

		expect(packageJson.name).toBe(path.basename(projectPath));
		expect(packageJson.scripts).toHaveProperty('build');
		expect(packageJson.scripts).toHaveProperty('release');

		const expectedBuildScript = packageManager === 'npm' ? 'npx tsup' : `${packageManager} tsup`;
		expect(packageJson.scripts.build).toBe(expectedBuildScript);
		expect(packageJson.scripts.release).toContain(packageManager);

		expect(await fs.stat(path.join(projectPath, '.git')).catch(() => false)).toBeTruthy();
	}

	beforeAll(async () => {
		await fs.mkdir(tmpDir, {recursive: true});

		const buildProc = Bun.spawn(['bun', 'run', 'build'], {
			cwd: '.',
			stdout: 'inherit',
			stderr: 'inherit',
		});

		const exitCode = await buildProc.exited;
		expect(exitCode).toBe(0);

		if (isCI) {
			console.log('Testing environment in CI...');
			try {
				const whoami = Bun.spawn({
					cmd: ['whoami'],
					stdout: 'pipe',
				});
				const reader = whoami.stdout.getReader();
				let output = '';
				while (true) {
					const {done, value} = await reader.read();
					if (done) break;
					output += new TextDecoder().decode(value);
				}
				console.log('Current user:', output.trim());

				const gitVersion = Bun.spawn({
					cmd: ['git', '--version'],
					stdout: 'pipe',
				});
				const gitReader = gitVersion.stdout.getReader();
				let gitOutput = '';
				while (true) {
					const {done, value} = await gitReader.read();
					if (done) break;
					gitOutput += new TextDecoder().decode(value);
				}
				console.log('Git version:', gitOutput.trim());

				console.log('Temp directory:', tmpDir);
				const tmpStat = await fs.stat(tmpDir);
				console.log('Temp directory exists:', tmpStat.isDirectory());
				console.log('Temp directory permissions:', tmpStat.mode.toString(8));

				const testFile = path.join(tmpDir, 'test-file.txt');
				await fs.writeFile(testFile, 'test');
				console.log('Successfully wrote to temp directory');
			} catch (error) {
				console.error('Error in smoke test:', error);
			}
		}
	});

	afterAll(async () => {
		await fs.rm(tmpDir, {recursive: true, force: true});
	});

	beforeEach(async () => {
		const files = await fs.readdir(tmpDir);
		for (const file of files) {
			await fs.rm(path.join(tmpDir, file), {recursive: true, force: true});
		}
	});

	async function isPackageManagerAvailable(packageManager: string): Promise<boolean> {
		try {
			const proc = Bun.spawn({
				cmd: ['which', packageManager],
				stdout: 'pipe',
				stderr: 'pipe',
			});
			const exitCode = await proc.exited;
			return exitCode === 0;
		} catch (error) {
			console.log(`Package manager ${packageManager} is not available`);
			return false;
		}
	}

	const packageManagers = ['bun', 'npm', 'yarn', 'pnpm'];

	for (const packageManager of packageManagers) {
		describe(`with ${packageManager}`, () => {
			it(`should create a new project with ${packageManager}`, async () => {
				if (!(await isPackageManagerAvailable(packageManager))) {
					console.log(
						`Skipping test for ${packageManager} as it's not available in this environment`,
					);
					return;
				}

				const projectName = `test-project-${packageManager}`;
				const projectPath = path.join(tmpDir, projectName);

				const {exitCode, stdout, stderr} = await runCTSM([projectName, `--p=${packageManager}`]);

				expect(exitCode).toBe(0);

				await fs.access(projectPath);
				await verifyProject(projectPath, packageManager);
			}, 120000);

			it(`should fail when creating project in non-empty directory with ${packageManager}`, async () => {
				if (!(await isPackageManagerAvailable(packageManager))) {
					console.log(
						`Skipping test for ${packageManager} as it's not available in this environment`,
					);
					return;
				}

				const projectName = `test-project-exists-${packageManager}`;
				const projectPath = path.join(tmpDir, projectName);

				await fs.mkdir(projectPath, {recursive: true});
				await fs.writeFile(path.join(projectPath, 'some-file.txt'), 'content');

				const {exitCode, stdout, stderr} = await runCTSM([], projectPath);

				expect(exitCode).not.toBe(0);
				expect(stdout.length + stderr.length).toBeGreaterThan(0);
			}, 30000);
		});
	}

	it('should use directory name as package name when no name provided in empty directory', async () => {
		const emptyDirName = 'default-project-name';
		const emptyDir = path.join(tmpDir, emptyDirName);
		await fs.mkdir(emptyDir, {recursive: true});

		const {exitCode, stdout, stderr} = await runCTSM([], emptyDir);

		expect(exitCode).toBe(0);

		await verifyProject(emptyDir, 'bun');
	}, 30000);

	it('should respect --y flag to skip confirmation', async () => {
		const projectName = 'test-project-y-flag';
		const {exitCode, stdout, stderr} = await runCTSM([projectName, '--y']);

		expect(exitCode).toBe(0);

		expect(stdout).not.toContain('Y/n');
	}, 30000);
});
