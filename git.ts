import {$} from 'bun';

export async function getGitUser(): Promise<
	{
		name?: string;
		email?: string;
	} & Record<string, string | undefined>
> {
	const text = await $`git config --get-regexp user.`.text();

	const map = text
		.trim()
		.split('\n')
		.map(line => {
			const [key, value] = line.split(' ');
			return [key!.replace('user.', ''), value];
		});

	return Object.fromEntries(map);
}
