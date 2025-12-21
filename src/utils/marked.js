export function marked(text) {
	// const regexBalise = new RegExp('<(\w*)>(.*?)<\/\1>');
	const output = [...text.matchAll(/<(\w*)>(.*?)<\/\1>/g)];
	console.log(output);
	return output;
}
