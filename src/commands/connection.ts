import { SongQueue } from '@/utils/song-queue';
import {
  createAudioPlayer,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';
import Container from 'typedi';

const queue = Container.get(SongQueue);

export function executeLeave(interaction: CommandInteraction) {
  try {
    getVoiceConnection(interaction.guildId).disconnect();
    interaction.reply({
      content: `Disconnected`,
      ephemeral: true,
    });
  } catch (err) {
    interaction.reply({
      content: `I'm not connected`,
      ephemeral: true,
    });
  }
}

export function executeJoin(interaction: CommandInteraction) {
  const guild = interaction.guild;
  const member = guild.members.cache.get(interaction.member.user.id);
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    return interaction.channel.send(
      'You must be in a voice channel to play music!'
    );
  }

  if (!queue.getQueue(guild.id)) {
    const queueObject = {
      textChannel: interaction.channel,
      voiceChannel,
      connection: null,
      player: createAudioPlayer(),
      songs: [],
      playing: true,
    };
    queue.setQueue(guild.id, queueObject);
  }

  queue.getQueue(guild.id).connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  queue
    .getQueue(guild.id)
    .connection.on(VoiceConnectionStatus.Disconnected, () => {
      console.log('Bot disconnected');
      queue.getQueue(guild.id).connection.destroy();
    });

  interaction.reply({
    content: `Connected`,
    ephemeral: true,
  });
}