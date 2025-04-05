import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as rl from 'readline/promises';
// confirmOrDie, die, getBinName, isDirectoryEmpty, json, writeFiles

const ansi = {
  red: Bun.color({ r: 255, g: 0, b: 0 }, 'ansi-16m'),
};

export function getBinName() {
  return Bun.argv[1]!;
}

export function die(messages: string | string[], code = 1): never {
  const string = Array.isArray(messages) ? messages.join('\n') : messages;

  console.error(ansi.red + string);
  process.exit(code);
}

export async function confirm(message: string, options: { acceptDefault: boolean }) {
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
  if (!result) die(args[0]);
}

export async function isDirectoryEmpty(path: string) {
  const files = await fs.readdir(path);
  return files.length === 0;
}

export async function writeFiles(dir: string, files: Record<string, string>) {
  for (const [name, content] of Object.entries(files)) {
    await Bun.write(path.join(dir, name), content);
  }
}

export function json<T>(value: T) {
  return JSON.stringify(value, null, '\t');
}
