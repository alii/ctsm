import {expect, it} from 'bun:test';
import {code, json} from './util';

it('code() util function', () => {
	expect(
		code(`
            function add(a: number, b: number) {
                return a + b;
            }
        `),
	).toBe(`function add(a: number, b: number) {
    return a + b;
}
`);

	expect(
		code(`



        function add(a: number, b: number) {
            return a + b;
        }



    `),
	).toBe(`function add(a: number, b: number) {
return a + b;
}
`);
});

it('json() util function', () => {
	expect(json({a: 1, b: 2})).toBe(`{\n\t"a": 1,\n\t"b": 2\n}`);
});

import {describe} from 'bun:test';
import {parse} from './args';

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
