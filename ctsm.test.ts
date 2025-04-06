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
