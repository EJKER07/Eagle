const mongoose = require("mongoose");

const memberMetricsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  invites: { type: Number, default: 0, min: 0 },
  messages: { type: Number, default: 0, min: 0 },
  voiceSeconds: { type: Number, default: 0, min: 0 },
  dailyMessages: { type: Map, of: Number, default: {} },
}, { _id: false });

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, default: "!", maxlength: 5 },
  invites: {
    joinChannelId: String, leaveChannelId: String,
    joinMessage: String, leaveMessage: String,
    tracked: { type: Map, of: new mongoose.Schema({ inviterId: String, code: String, joinedAt: Date }, { _id: false }) },
  },
  metrics: { blacklistedChannelIds: { type: [String], default: [] } },
  members: { type: [memberMetricsSchema], default: [] },
  giveaways: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true, minimize: false });

const Guild = mongoose.models.Guild || mongoose.model("Guild", guildSchema);

async function connectMongo(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error("MONGODB_URI is required for MongoDB persistence.");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

module.exports = { Guild, guildSchema, memberMetricsSchema, connectMongo };