import {
  getVoiceConnection,
  joinVoiceChannel,
} from '@discordjs/voice';

import Container from 'typedi';
import { InteractiveInteraction } from '@/model/interaction';
import { QueueManager } from '@/utils/queue-manager';
import { QueueObject } from '@/utils/queue-object';

const queueManager = Container.get(QueueManager);

export async function executeLeave(interaction: InteractiveInteraction) {
  const queue = queueManager.getQueue(interaction.guild.id);
  await interaction.deferReply();
  if (queue) {
    queue.voiceConnection.destroy();
    await interaction.editReply("Disconnected");
  } else {
    queueManager.deleteQueue(interaction.guild.id);
  }
}

export async function executeJoin(interaction: InteractiveInteraction) {
  const guild = interaction.guild;
  const member = guild.members.cache.get(interaction.member.user.id);
  const userVoiceChannel = member.voice.channel;
  const queue = queueManager.getQueue(guild.id);

  if (!userVoiceChannel) {
    return interaction.channel.send(
      'You must be in a voice channel to play music!'
    );
  }

  if (!queue) {
    queueManager.setQueue(guild.id, new QueueObject(
      joinVoiceChannel({
        channelId: userVoiceChannel.id,
        guildId: userVoiceChannel.guild.id,
        adapterCreator: userVoiceChannel.guild.voiceAdapterCreator,
      }),
      userVoiceChannel
    ));
  } else {
    const oldSongs = queue.songs;
    queueManager.setQueue(guild.id, new QueueObject(
      joinVoiceChannel({
        channelId: userVoiceChannel.id,
        guildId: userVoiceChannel.guild.id,
        adapterCreator: userVoiceChannel.guild.voiceAdapterCreator,
      }),
      userVoiceChannel
    ));
    queueManager.getQueue(guild.id).songs = oldSongs;
  }

  await interaction.editReply({
    content: `Connected`
  });
}
