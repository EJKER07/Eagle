const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");
const playdl = require("play-dl");
const { embed } = require("../../utils/embeds");
const { requireVoice } = require("../../utils/music");
const { emoji } = require("../../utils/emojis");

async function playDirectStream(channel, query) {
  const existingConnection = getVoiceConnection(channel.guild.id);
  const connection = existingConnection || joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 15000);

  const resolvedQuery = query.trim();
  const source = resolvedQuery.startsWith("http")
    ? await playdl.stream(resolvedQuery, { quality: 0 })
    : (await playdl.search(resolvedQuery, { limit: 1 }))[0];

  const info = source?.url ? source : await playdl.stream(source.url, { quality: 0 });
  const resource = createAudioResource(info.stream, {
    inputType: info.type,
    inlineVolume: true,
  });

  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  player.on("error", (error) => {
    console.error("Direct stream player error:", error);
  });

  connection.subscribe(player);
  player.play(resource);

  return { connection, player, title: source?.title || "track" };
}

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Play a song or playlist.").addStringOption((o) => o.setName("query").setDescription("URL or search").setRequired(true)),
  async execute(interaction, client) {
    try {
      const channel = requireVoice(interaction);
      const botMember = interaction.guild.members.me;
      const permissions = botMember.permissionsIn(channel);
      if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
        throw new Error("I need `CONNECT` and `SPEAK` permissions in this voice channel.");
      }

      await interaction.deferReply();

      const query = interaction.options.getString("query");
      console.log(`🎵 [PLAY] Requested: ${query} in guild: ${interaction.guild.name}`);

      try {
        await playDirectStream(channel, query);
        console.log(`✅ [PLAY] Direct voice stream started`);
      } catch (streamError) {
        console.error("❌ [PLAY] Direct stream failed, falling back to Distube:", streamError);
        if (!client.distube) throw new Error("Music is not available because the player failed to initialize.");
        await client.distube.play(channel, query, {
          member: interaction.member,
          textChannel: interaction.channel,
          skip: 0,
        });
      }

      await interaction.editReply({
        embeds: [embed("success", "Added to queue", `${emoji("music")} Your request was added to the music queue.`)]
      });
    } catch (error) {
      console.error("❌ [PLAY] Error:", error);
      const payload = { embeds: [embed("error", "Music error", error.message || "Failed to play music.")] };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
