module.exports = {
	name: 'args',
	description: 'Returns number of arguments and list of arguments ',
	args: true,
	execute(message, args) {
		message.channel.send(`Arguments (${args.length}): ${args.join(', ')}`);
	},
};