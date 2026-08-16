const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { requireVoice } = require("../../utils/music");
const { emoji } = require("../../utils/emojis");

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Play a song or playlist.").addStringOption((o) => o.setName("query").setDescription("URL or search").setRequired(true)),
  async execute(interaction, client) {
    try {
      if (!client.distube) throw new Error("Music is not available because the player failed to initialize.");
      
      const channel = requireVoice(interaction);
      
      // Check bot permissions
      const botMember = interaction.guild.members.me;
      if (!botMember.permissionsIn(channel).has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
        throw new Error("I need `CONNECT` and `SPEAK` permissions in this voice channel.");
      }
      
      await interaction.deferReply();
      
      const query = interaction.options.getString("query");
      console.log(`🎵 [PLAY] Requested: ${query} in guild: ${interaction.guild.name}`);
      
      // Ensure voice connection is ready before playing
      if (client.voiceManager) {
        console.log(`   Verifying voice connection...`);
        const connectionCheck = await client.voiceManager.ensureConnectionReady(interaction.guildId);
        if (!connectionCheck.ready) {
          console.warn(`   Voice connection not ready: ${connectionCheck.error}`);
          // Continue anyway - DisTube will handle connection
        } else {
          console.log(`   Voice connection verified READY`);
        }
      }
      
      console.log(`   Adding to queue...`);
      await client.distube.play(channel, query, { 
        member: interaction.member, 
        textChannel: interaction.channel,
        skip: 0
      });
      
      console.log(`   ✅ Successfully added to queue`);
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
