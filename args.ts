export class Flags {
	private map = new Map<string, string | boolean>();

	/**
	 * Sets a key-value pair in the flags map
	 * @param key - The flag key to set
	 * @param value - The value to associate with the key (can be string or boolean)
	 */
	public set(key: string, value: string | boolean) {
		this.map.set(key, value);
	}

	/**
	 * Gets the number of flags stored in the map
	 * @returns The size of the flags map
	 */
	public get size() {
		return this.map.size;
	}

	/**
	 * Converts the flags map to a plain JavaScript object
	 * @returns An object containing all flag key-value pairs
	 */
	public toJSON() {
		return Object.fromEntries(this.map);
	}

	/**
	 * Gets a boolean flag value, throwing an error if it doesn't exist or isn't boolean
	 * @param key - The flag key to retrieve
	 * @returns The boolean value associated with the key
	 * @throws {Error} If the flag is missing or not a boolean
	 */
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

	/**
	 * Gets a string flag value, throwing an error if it doesn't exist or isn't a string
	 * @param key - The flag key to retrieve
	 * @returns The string value associated with the key
	 * @throws {Error} If the flag is missing or not a string
	 */
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

	/**
	 * Gets a boolean flag value with a fallback default
	 * @param key - The flag key to retrieve
	 * @param defaultValue - The default value to return if the key doesn't exist
	 * @returns The boolean value associated with the key or the default value
	 * @throws {Error} If the flag exists but is not a boolean
	 */
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

	/**
	 * Gets a string flag value with a fallback default
	 * @param key - The flag key to retrieve
	 * @param defaultValue - The default value to return if the key doesn't exist
	 * @returns The string value associated with the key or the default value
	 * @throws {Error} If the flag exists but is not a string
	 */
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

	/**
	 * Gets a string flag value that must be one of the provided options
	 * @param key - The flag key to retrieve
	 * @param options - Array of valid string options
	 * @returns The string value if it matches one of the options
	 * @throws {Error} If the flag is missing, not a string, or not in the options array
	 */
	public getStringAsOptionOrThrow<const T extends string>(key: string, options: T[]): T {
		const value = this.getStringOrThrow(key);

		if (!options.includes(value as T)) {
			throw new Error(`Flag ${key} is not a valid option`);
		}

		return value as T;
	}

	/**
	 * Gets a string flag value that must be one of the provided options, with a fallback default
	 * @param key - The flag key to retrieve
	 * @param options - Array of valid string options
	 * @param defaultValue - The default value to return if the key doesn't exist or value is invalid
	 * @returns The string value if it matches one of the options, otherwise the default value
	 */
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
