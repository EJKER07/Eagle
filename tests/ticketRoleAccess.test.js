const test = require('node:test');
const assert = require('node:assert/strict');
const { runPrefixCommand } = require('../src/services/prefixCommandService');

function buildMessage(command) {
  const userMention = { id: '100000000000000001' };
  const roleMention = { id: '200000000000000001' };
  const edits = [];

  return {
    guild: { id: 'guild-1' },
    channel: {
      topic: 'ticket-owner:900000000000000001',
      permissionOverwrites: {
        edit: async (id, permissions) => {
          edits.push({ id, permissions });
        },
      },
    },
    member: {
      permissions: { has: () => true },
      roles: { cache: { has: () => true } },
    },
    author: { id: '900000000000000001' },
    mentions: {
      users: { values: () => [userMention] },
      members: { values: () => [userMention] },
      roles: { values: () => [roleMention] },
    },
    reply: async (payload) => ({
      payload,
      delete: async () => undefined,
    }),
    content: command,
    toString: () => command,
    delete: async () => undefined,
    edits,
  };
}

test('ticket add command accepts both user and role mentions', async () => {
  const message = buildMessage('add @user-1 @role-1');
  const edits = [];
  message.channel.permissionOverwrites.edit = async (id, permissions) => {
    edits.push({ id, permissions });
  };

  const client = {
    db: {
      getGuildSettings: () => ({ tickets: { staffRoleIds: ['staff-role'] } }),
    },
    config: { prefix: '$' },
  };

  const result = await runPrefixCommand(client, message, 'add @user-1 @role-1');
  assert.equal(result.payload.embeds[0].data.title, 'Member added');
  assert.deepEqual(edits.map((entry) => entry.id), ['100000000000000001', '200000000000000001']);
});
