const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");

// Helper to fetch server-specific configs
function getGuildConfig(guildId) {
    const configPath = path.join(__dirname, "..", "data", "guildConfigs.json");
    if (!fs.existsSync(configPath)) return null;
    try {
        const configs = JSON.parse(fs.readFileSync(configPath));
        return configs[guildId] || null;
    } catch (e) {
        return null;
    }
}

async function createTicket(interaction, type) {
    // 🟡 Defer reply to prevent interaction timeout (3s limit)
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: 64 }).catch(() => {});
    }

    const guild = interaction.guild;
    const user = interaction.user;
    const member = guild.members.cache.get(user.id) || await guild.members.fetch(user.id).catch(() => null);

    // Fetch Dynamic Server Config
    const guildConfig = getGuildConfig(guild.id);

    const staffRoleId = guildConfig?.supportRoleId || null;
    const categoryId = guildConfig?.categoryId || null;
    const logChannelId = guildConfig?.logChannelId || null;
    const dqRoleId = guildConfig?.dqRoleId || null;

    // 🔴 1. CHECK IF USER IS DISQUALIFIED
    if (dqRoleId && member && member.roles.cache.has(dqRoleId)) {
        return interaction.editReply({
            content: "🚫 **You are disqualified from opening tickets!** Contact staff if you think this is a mistake."
        });
    }

    // Format category name
    let categoryName = "General";
    if (type === "nitro") categoryName = "Nitro rewards";
    if (type === "deco") categoryName = "Deco rewards";
    if (type === "ltc") categoryName = "Ltc rewards";
    if (type === "robux" || type === "rbx") categoryName = "Robux rewards";

    // Clean username format
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "");

    // 🔴 2. CHECK MAX 2 TICKETS LIMIT
    const userTickets = guild.channels.cache.filter(
        c => c.name.includes(cleanUsername)
    );

    if (userTickets.size >= 2) {
        return interaction.editReply({
            content: "❌ You cannot open more than **2 tickets** in this server! Please close your existing tickets first."
        });
    }

    // Channel Name Format: ticket-[type]-[username]
    const channelName = `ticket-${type}-${cleanUsername}`;

    // Overwrites array
    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory
            ]
        }
    ];

    if (staffRoleId) {
        permissionOverwrites.push({
            id: staffRoleId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    }

    try {
        // Create ticket channel
        const channelOptions = {
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: permissionOverwrites
        };

        if (categoryId && guild.channels.cache.has(categoryId)) {
            channelOptions.parent = categoryId;
        }

        const channel = await guild.channels.create(channelOptions);

        // Embed setup inside ticket channel
        const embed = new EmbedBuilder()
            .setColor("#2B2D31")
            .setTitle(`${categoryName} Ticket`)
            .setDescription(
                `**Welcome** <@${user.id}>\n` +
                `**Category:** ${categoryName}\n\n` +
                `Our support team will assist you shortly.`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setImage("https://images-ext-1.discordapp.net/external/5On_Wey0qcC2t3nAREysdkVGLBmf2Y9oWgh8JXDojX4/https/i.ibb.co/BVsB4CS4/382ad2dd02dd701a813c189ec01be1d3.jpg?format=webp");

        // Action Row Buttons (Claim, Rename Modal, Close Ticket)
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_claim")
                .setLabel("Claim Ticket")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("ticket_rename_modal")
                .setLabel("Rename")
                .setEmoji("🏷️")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("ticket_close")
                .setLabel("Close Ticket")
                .setStyle(ButtonStyle.Danger)
        );

        const pingContent = staffRoleId 
            ? `<@&${staffRoleId}> <@${user.id}>` 
            : `<@${user.id}>`;

        // Send message in new ticket channel
        await channel.send({
            content: pingContent,
            embeds: [embed],
            components: [buttons]
        });

        // Send Ticket Created Log
        if (logChannelId) {
            const logChannel = guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const createdLogEmbed = new EmbedBuilder()
                    .setColor("#2B2D31")
                    .setTitle("Ticket Created")
                    .addFields(
                        { name: "User", value: `<@${user.id}>`, inline: false },
                        { name: "Category", value: categoryName, inline: false },
                        { name: "Channel", value: `<#${channel.id}>`, inline: false },
                        { name: "Time", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    );

                await logChannel.send({ embeds: [createdLogEmbed] }).catch(() => {});
            }
        }

        // Reply to interaction
        await interaction.editReply({
            content: `✅ Ticket created: ${channel}`
        });

    } catch (error) {
        console.error("Error creating ticket:", error);
        await interaction.editReply({
            content: "❌ Failed to create ticket! Please check bot permissions (Manage Channels)."
        });
    }
}

module.exports = {
    createTicket
};