export function parse(
  argv: string[] = Bun.argv.slice(2)
): [flags: Record<string, string | boolean>, args: string[]] {
  const flags: Record<string, string | boolean> = {};
  const args: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (!key) continue;
      flags[key] = value ?? true;
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      flags[key] = true;
    } else {
      args.push(arg);
    }
  }

  return [flags, args] as const;
}
