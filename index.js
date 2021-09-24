// Libraries

const dotenv = require("dotenv");
const { Client, Intents } = require("discord.js");
const { executeSearch } = require("./command/search");
const { executePlay } = require("./command/play");
const { SEARCH_COMMAND, PLAY_COMMAND, SKIP_COMMAND } = require("./utils/constants");
const LastCommand = require("./utils/last-command");
const SongQueue = require("./utils/song-queue");
const { executeSkip } = require("./command/skip");

// Configuration
dotenv.config();

// Declaration
const token = process.env.TOKEN;
const lastCommand = new LastCommand();
const queue = new SongQueue();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

// When the client is ready, run this code (only once)
client.once("ready", async () => {
	console.log("Ready!");
});

client.once("reconnecting", () => {
	console.log("Reconnecting!");
});
client.once("disconnect", () => {
	console.log("Disconnect!");
});

// Login to Discord with your client's token
client.login(token);

client.on('interactionCreate', async (interaction) => {
	if (interaction.isCommand()) {
		handleCommand(interaction);
		return;
	}
	if (interaction.isButton()) {
		handleButton(interaction);
		return;
	}
});

const handleCommand = async (interaction) => {
	const { commandName, options } = interaction;

	switch (commandName) {
		// Normal command
		case "ping":
			interaction.reply({
				content: "PONG!",
				ephemeral: true
			});
			break;
		case "add":
			const firstNumber = options.getNumber("number1") || 0;
			const secondNumber = options.getNumber("number2") || 0;
			res = firstNumber + secondNumber;

			interaction.reply({
				content: res.toString(),
				ephemeral: true
			});

			break;
		case SEARCH_COMMAND:
			lastCommand.set(interaction.guildId, interaction.userId, {
				command: SEARCH_COMMAND,
				results: await executeSearch(interaction)
			});
			break;
		case SKIP_COMMAND:
			lastCommand.set(interaction.guildId, interaction.userId, {
				command: SKIP_COMMAND,
				results: await executeSkip(interaction, queue)
			});
			break;
		default:
			break;
	}
};

const handleButton = async (interaction) => {
    const guildId = interaction.guildId;
    const userId = interaction.userId;

	const { command, results } = lastCommand.get(guildId, userId);
	
	await interaction.message.delete();
    // Need to check if the button clicked belongs to the same message as last command

    switch (command) {
		case SEARCH_COMMAND:
			handleSearchButton(interaction, queue, results);
			break;
		default:
			interaction.editReply({
				content: `What?`,
			});
			break;
	}
}

const handleSearchButton = async (interaction, queue, results) => {
	const songIndex = parseInt(interaction.customId);
	executePlay(interaction, queue, results[songIndex]);
};