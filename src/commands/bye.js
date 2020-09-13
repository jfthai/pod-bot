module.exports = {
	name: 'bye',
	description: 'Responds to !bye',
	execute(message) {
		message.channel.send(`peace out ${message.author.username} ;)`);
	},
};