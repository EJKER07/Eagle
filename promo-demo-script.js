const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const STAFF_ROLE_ID = '1534099901976416257';
const PREFIX = '$';
const targetMessages = 100;
const targetTickets = 10;

const staffData = new Map();
const claimedTickets = new Map();

function getStaffEntry(userId) {
  if (!staffData.has(userId)) {
    staffData.set(userId, { messages: 0, tickets: 0 });
  }
  return staffData.get(userId);
}

function hasStaffRole(member) {
  if (!member) return false;
  return member.roles.cache.has(STAFF_ROLE_ID) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function parseDate(dateStr) {
  const [day, month, yearRaw] = String(dateStr).trim().split('/');
  const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
  const date = new Date(year, Number(month) - 1, Number(day));

  if (
    Number(date.getFullYear()) !== year ||
    Number(date.getMonth()) + 1 !== Number(month) ||
    Number(date.getDate()) !== Number(day)
  ) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return date;
}

function parseRange(input) {
  const match = String(input || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+to\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/i);
  if (!match) throw new Error('Invalid format. Use: $promodemo 17/8/26 to 24/8/26');

  const start = parseDate(`${match[1]}/${match[2]}/${match[3]}`);
  const end = parseDate(`${match[4]}/${match[5]}/${match[6]}`);

  return { start, end };
}

function getDaysDifference(start, end) {
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

function evaluateStaff(memberId) {
  const entry = getStaffEntry(memberId);
  const messagesPercent = (entry.messages / targetMessages) * 100;
  const ticketsPercent = (entry.tickets / targetTickets) * 100;

  const promo = messagesPercent >= 50 && ticketsPercent >= 50;
  return {
    ...entry,
    messagesPercent,
    ticketsPercent,
    status: promo ? 'PROMO' : 'DEMO / STAY',
  };
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const member = message.member;
  if (!member || !hasStaffRole(member)) return;

  const staff = getStaffEntry(message.author.id);
  staff.messages += 1;

  const channelName = message.channel.name.toLowerCase();
  if (channelName.includes('ticket')) {
    const ticketKey = message.channel.id;
    if (!claimedTickets.has(ticketKey)) {
      claimedTickets.set(ticketKey, message.author.id);
      staff.tickets += 1;

      const confirmation = await message.channel.send(`✅ <@${message.author.id}>, you got check-in!`);
      setTimeout(() => {
        confirmation.delete().catch(() => {});
      }, 1000);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const content = message.content.slice(PREFIX.length).trim();
  const [command, ...args] = content.split(/\s+/);

  if (command.toLowerCase() === 'promodemo') {
    try {
      const dateText = args.join(' ');
      const { start, end } = parseRange(dateText);
      const diffDays = getDaysDifference(start, end);

      if (diffDays > 7) {
        return message.reply('❌ Evaluations can only be done under a 7-day range.');
      }

      const rows = [...staffData.entries()].map(([userId, data]) => ({
        userId,
        ...data,
        ...evaluateStaff(userId),
      }));

      if (!rows.length) {
        return message.reply('No staff data found yet.');
      }

      const lines = rows.map((row) => {
        const status = row.status;
        return `• <@${row.userId}> | Messages: ${row.messages} | Tickets: ${row.tickets} | Status: ${status}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xf4df1b)
        .setTitle('Promotion / Demotion Report')
        .setDescription(`Range: ${start.toLocaleDateString('en-GB')} to ${end.toLocaleDateString('en-GB')}`)
        .addFields({ name: 'Results', value: lines || 'No results found.' });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      return message.reply(`❌ ${error.message}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN');
