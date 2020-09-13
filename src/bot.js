'use strict';
const fs = require('fs');
const { prefix, token } = require('../config.json');
const Discord = require('discord.js');

/**
 * Main file for organizing client event and message handling
 */
class Bot {
	constructor() {
		this.client = new Discord.Client();
		this.client.commands = new Discord.Collection();
		this.cooldowns = new Discord.Collection();

		this._init();
	}

	/**
	 * Initalize client with commands, error handling, and message handling
	 * Then logs in with token
	 *
	 * @private
	 */
	_init() {
		this._initCommands();
		this._initOnce();
		this._initErrorHandling();
		this._initMessageHandling();
		this.client.login(token);
	}

	/**
	 * Import command modules dynamically and add to data structure
	 * for message handling
	 *
	 * @private
	 */
	_initCommands() {
		// Array of all the file names in that directory; eg. ['ping.js', 'beep.js']
		const commandFiles = fs.readdirSync('./src/commands')
			.filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			// Set a new item in the Collection {command name -> exported module}
			this.client.commands.set(command.name, command);
		}
	}

	/**
	 * Actions that run once at deployment
	 *
	 * @private
	 */
	_initOnce() {
		this.client.once('ready', () => {
			console.log('>> pod-bot deployed -- beep bop');
		});
	}

	/**
	 * Error handling
	 *
	 * @private
	 */
	_initErrorHandling() {
		this.client.on('shardError', error => {
			console.error('A websocket connection encountered an error:', error);
		});

		process.on('unhandledRejection', error => {
			console.error('Unhandled promise rejection:', error);
		});
	}

	/**
	 * Initalize message handling
	 * 1. Find matching command/aliases with prefix saved as exported module
	 * 2. Verify correct arguments
	 * 3. Set cooldown for user to minimize spam
	 * 4. Execute command
	 *
	 * @copyright 2020 Discord.js Guide
	 * @private
	 */
	_initMessageHandling() {
		this.client.on('message', message => {
			// Get command module from message if exists
			if (!message.content.startsWith(prefix) || message.author.bot) return;
			const args = message.content.slice(prefix.length).trim().split(/ +/);
			const commandName = args.shift().toLowerCase();
			const command = this.client.commands.get(commandName)
				|| this.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
			if (!command) return;

			// Parse command and check for correct arguments
			if (command.guildOnly && message.channel.type === 'dm') {
				return message.reply('I can\'t execute that command inside DMs!');
			}
			if (command.args && !args.length) {
				let reply = `You didn't provide any arguments, ${message.author}!`;
				if (command.usage) {
					// eg: '<user> <role>'
					reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
				}
				return message.channel.send(reply);
			}

			// Set cooldown per user. Calculate cooldown time in milliseconds
			if (!this.cooldowns.has(command.name)) {
				this.cooldowns.set(command.name, new Discord.Collection());
			}
			const now = Date.now();
			const timestamps = this.cooldowns.get(command.name);
			const cooldownAmount = (command.cooldown || 3) * 1000;
			if (timestamps.has(message.author.id)) {
				const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
				if (now < expirationTime) {
					const timeLeft = (expirationTime - now) / 1000;
					return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
				}
			}
			timestamps.set(message.author.id, now);
			setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

			// Execute command
			try {
				command.execute(message, args);
			}
			catch (error) {
				console.error(error);
				message.reply('there was an error trying to execute that command!');
			}
		});
	}
}

module.exports = Bot;