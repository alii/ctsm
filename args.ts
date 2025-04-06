export class Flags {
	private map = new Map<string, string | boolean>();

	public set(key: string, value: string | boolean) {
		this.map.set(key, value);
	}

	public get size() {
		return this.map.size;
	}

	public toJSON() {
		return Object.fromEntries(this.map);
	}

	public getBooleanOrThrow(key: string) {
		const value = this.map.get(key);

		if (value === undefined) {
			throw new Error(`Missing required flag: ${key}`);
		}

		if (typeof value !== 'boolean') {
			throw new Error(`Flag ${key} is not a boolean`);
		}

		return value;
	}

	public getStringOrThrow(key: string) {
		const value = this.map.get(key);

		if (value === undefined) {
			throw new Error(`Missing required flag: ${key}`);
		}

		if (typeof value !== 'string') {
			throw new Error(`Flag ${key} is not a string`);
		}

		return value;
	}

	public getBooleanOrDefault(key: string, defaultValue: boolean) {
		const value = this.map.get(key);

		if (value === undefined) {
			return defaultValue;
		}

		if (typeof value !== 'boolean') {
			throw new Error(`Flag ${key} is not a boolean`);
		}

		return value;
	}

	public getStringOrDefault(key: string, defaultValue: string) {
		const value = this.map.get(key);

		if (value === undefined) {
			return defaultValue;
		}

		if (typeof value !== 'string') {
			throw new Error(`Flag ${key} is not a string`);
		}

		return value;
	}

	public getStringAsOptionOrThrow<const T extends string>(key: string, options: T[]): T {
		const value = this.getStringOrThrow(key);

		if (!options.includes(value as T)) {
			throw new Error(`Flag ${key} is not a valid option`);
		}

		return value as T;
	}

	public getStringAsOptionOrDefault<const T extends string>(
		key: string,
		options: T[],
		defaultValue: T,
	): T {
		const value = this.getStringOrDefault(key, defaultValue);

		if (!options.includes(value as T)) {
			return defaultValue;
		}

		return value as T;
	}
}

export function parse(argv: string[] = process.argv.slice(2)): [flags: Flags, args: string[]] {
	const flags = new Flags();
	const args: string[] = [];

	for (const arg of argv) {
		if (arg.startsWith('--')) {
			const [key, value] = arg.slice(2).split('=');
			if (!key) continue;
			flags.set(key, value ?? true);
		} else if (arg.startsWith('-')) {
			const key = arg.slice(1);
			flags.set(key, true);
		} else {
			args.push(arg);
		}
	}

	return [flags, args] as const;
}
