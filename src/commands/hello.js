module.exports = {
	name: 'hello',
	description: 'Reply to !hey with text',
	execute(message) {
		message.reply('hey :)!');
	},
};