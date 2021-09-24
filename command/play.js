const { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const ytdl = require("ytdl-core");

const player = createAudioPlayer();

let connection = null;

const play = async (guild, queue) => {
    console.log(queue.showQueue(guild.id));
    const song = queue.getSong(guild.id);
    if (!song) {
        queue.getQueue(guild.id).voiceChannel.leave();
        queue.destroyQueue(guild.id);
        return;
    }

    if (connection.subscribe(player)) {
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1<<25
        });
        const resource = createAudioResource(stream);
        player.play(resource);
        queue.getQueue(guild.id).textChannel.send(`Now playing: **${song.title}**`);

        try {
            await entersState(player, AudioPlayerStatus.Idle);
            play(guild, queue);
        } catch (err) {
            console.error(err);
        }
    }

}

const executePlay = async (interaction, queue, songRequest) => {
    const guild = interaction.guild;
	const member = guild.members.cache.get(interaction.member.user.id);
	const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return interaction.channel.send("You must be in a voice channel to play music!");
    }
    
    if (!queue.getQueue(guild.id)) {
        const queueObject = {
            textChannel: interaction.channel,
            voiceChannel: voiceChannel,
            songs: [],
            playing: true
        }
        queue.setQueue(guild.id, queueObject);
        queue.addSong(guild.id, songRequest);
    } else {
        queue.addSong(guild.id, songRequest);
    }

    await interaction.channel.send(`Track **${songRequest.title}** added to the queue!`);

    connectAndPlay(guild, queue);
}

const connectAndPlay = (guild, queue) => {
    let voiceChannel = queue.getQueue(guild.id).voiceChannel;
    connection = getVoiceConnection(voiceChannel.guild.id);
    console.log("Connection " + connection);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator
        });
        play(guild, queue);
        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log("Bot disconnected");
            if (connection) {
                connection.destroy();
            }
        });
    }
}

exports.executePlay = executePlay;