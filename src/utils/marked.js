export function marked(text) {
	// console.log(text);
	// const regexBalise = new RegExp('<(\w*)>(.*?)<\/\1>');
	// const output = [...text.matchAll(/<(\w*)>(.*?)<\/\1>/g)];
	// Pour plus tard si je veux ajouté des balises custom avec des <span> avec ID spécifique ou classe spécifique.
	const markedText = '<p>' + text + '</p>';
	// console.log(markedText);
	return markedText;
}
