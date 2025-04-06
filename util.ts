import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as rl from 'node:readline/promises';

const ansi = {
	red: Bun.color({r: 255, g: 0, b: 0}, 'ansi-16m'),
};

export function getBinName() {
	return process.argv[1]!;
}

export function die(messages?: undefined | string | string[], code = 1): never {
	if (messages) {
		const string = Array.isArray(messages) ? messages.join('\n') : messages;

		console.error(ansi.red + string);
	}

	process.exit(code);
}

export async function confirm(message: string, options: {acceptDefault: boolean}) {
	const i = rl.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await i.question(message);

	i.close();

	if (options.acceptDefault && answer === '') return true;

	return answer.toLowerCase().startsWith('y');
}

export async function confirmOrDie(...args: Parameters<typeof confirm>) {
	const result = await confirm(...args);
	if (!result) die();
}

export async function isDirectoryEmpty(path: string) {
	const files = await fs.readdir(path);
	return files.length === 0;
}

export async function writeFiles(dir: string, files: Record<string, string>) {
	await Promise.all(
		Object.entries(files).map(([name, content]) => Bun.write(path.join(dir, name), content)),
	);
}

export function json<T>(value: T) {
	return JSON.stringify(value, null, '\t');
}

function getTemplateStrings(strings: TemplateStringsArray | string) {
	if (typeof strings === 'string') {
		const arr = [strings] as ReadonlyArray<string> & {raw?: string[]};
		arr.raw = [strings];

		return arr as TemplateStringsArray;
	}

	return strings;
}

function taggedTemplateFunction<T = any>(
	cb: (strings: TemplateStringsArray, ...values: T[]) => string,
) {
	return (strings: TemplateStringsArray | string, ...values: T[]) => {
		return cb(getTemplateStrings(strings), ...values);
	};
}

export const code = taggedTemplateFunction(strings => {
	const allLines = strings.join('').trimEnd().split('\n');

	const indexOfFirstNonEmptyLine = allLines.findIndex(line => line.trim() !== '');

	const lines = allLines.slice(indexOfFirstNonEmptyLine);

	const indent = lines[0]!.match(/^\s*/)?.[0];

	return lines.map(line => line.slice(indent!.length)).join('\n');
});

export function flagIsElse<const T, Else>(
	value: string | boolean | undefined,
	options: T[],
	elseValue: Else,
) {
	if (typeof value === 'string') {
		if (options.includes(value as T)) return value as T;
	}

	return elseValue;
}
