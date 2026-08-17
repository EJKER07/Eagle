const DEFAULT_STAFF_ROLE_ID = "1534099901976416257";

const ROLE_TARGETS = [
  { roleId: "1534099901976416257", name: "Trial Staff", role: "Trial Staff", messages: 350, tickets: 5, nextRoleId: "1534099902022549517" },
  { roleId: "1534099902022549517", name: "Staff", role: "Staff", messages: 500, tickets: 6, nextRoleId: "1534099902022549518" },
  { roleId: "1534099902022549518", name: "Junior Moderator", role: "Junior Moderator", messages: 750, tickets: 7, nextRoleId: "1534099902022549519" },
  { roleId: "1534099902022549519", name: "Senior Moderator", role: "Senior Moderator", messages: 1000, tickets: 8, nextRoleId: "1538763624158470164" },
  { roleId: "1538763624158470164", name: "Trial Admin", role: "Trial Admin", messages: 1250, tickets: 9, nextRoleId: "1538763818497478726" },
  { roleId: "1538763818497478726", name: "Admin", role: "Admin", messages: 1500, tickets: 10, nextRoleId: "1534099902051647616" },
  { roleId: "1534099902051647616", name: "Manager", role: "Manager", messages: 2000, tickets: 13, nextRoleId: "Max Level achieved!" },
];

function parseDateValue(raw) {
  const value = String(raw || "").trim();
  if (!value) throw new Error("Please provide a valid date like 17/8/26.");
  const match = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!match) throw new Error(`Invalid date: ${value}. Use DD/MM/YY or DD/MM/YYYY.`);
  const [, day, month, yearRaw] = match;
  const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
  const parsed = new Date(year, Number(month) - 1, Number(day));
  if (Number(parsed.getFullYear()) !== year || parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day)) {
    throw new Error(`Invalid date: ${value}.`);
  }
  return parsed;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateRange(input) {
  const text = String(input || "").trim();
  if (!text) throw new Error("Please provide a date range like 17/8/26 to 24/8/26.");
  const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(?:to|-)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (!match) throw new Error(`Invalid range: ${text}. Use format like 17/8/26 to 24/8/26.`);
  const start = parseDateValue(match[1]);
  const end = parseDateValue(match[2]);
  const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
  const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  const differenceInDays = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  if (differenceInDays > 7) {
    throw new Error("Evaluation range exceeded! The dates must be within a maximum of 7 days.");
  }
  return { start: rangeStart, end: rangeEnd, startText: formatDate(rangeStart), endText: formatDate(rangeEnd) };
}

function getRoleTarget(member) {
  if (!member || !member.roles || !member.roles.cache) return ROLE_TARGETS[0];

  const activeRoleIds = new Set(member.roles.cache.map((role) => String(role?.id || "")));
  const matches = ROLE_TARGETS.filter((entry) => {
    const hasRoleId = activeRoleIds.has(String(entry.roleId));
    const hasRoleName = member.roles.cache.some((role) => role && String(role.name || "").toLowerCase() === String(entry.name || entry.role || "").toLowerCase());
    return hasRoleId || hasRoleName;
  });

  if (!matches.length) return ROLE_TARGETS[0];

  return matches.reduce((best, current) => {
    const bestIndex = ROLE_TARGETS.findIndex((entry) => String(entry.roleId) === String(best.roleId));
    const currentIndex = ROLE_TARGETS.findIndex((entry) => String(entry.roleId) === String(current.roleId));
    return currentIndex > bestIndex ? current : best;
  }, matches[0]);
}

function evaluatePromoDemo(metrics, target = { requiredMessages: 1000, requiredTickets: 6 }) {
  const messages = Number(metrics.messages || 0);
  const tickets = Number(metrics.tickets || 0);
  const requiredMessages = Number(target.requiredMessages || 1000);
  const requiredTickets = Number(target.requiredTickets || 6);
  const messagesPercent = requiredMessages > 0 ? Math.min(200, Math.round((messages / requiredMessages) * 100)) : 0;
  const ticketsPercent = requiredTickets > 0 ? Math.min(200, Math.round((tickets / requiredTickets) * 100)) : 0;

  let status = "demote";
  if (messagesPercent >= 200 || ticketsPercent >= 200) status = "double-promo";
  else if (messagesPercent >= 100 || ticketsPercent >= 100 || (messagesPercent >= 50 && ticketsPercent >= 50)) status = "promo";
  else if (messagesPercent >= 50 || ticketsPercent >= 50) status = "stay";

  return {
    status,
    messages,
    tickets,
    requiredMessages,
    requiredTickets,
    messagesPercent,
    ticketsPercent,
  };
}

function evaluateRoleTarget(metrics, member) {
  const target = getRoleTarget(member);
  const result = evaluatePromoDemo(metrics, { requiredMessages: target.messages, requiredTickets: target.tickets });
  const statusMap = {
    "double-promo": "✨ DOUBLE PROMOTION (Skip Rank) 🎉",
    promo: "✅ PROMOTION",
    stay: "⚠️ STAY",
    demote: "❌ DEMOTION",
  };
  const canonicalStatus = {
    "double-promo": "double-promotion",
    promo: "promotion",
    stay: "stay",
    demote: "demotion",
  }[result.status] || "stay";

  const nextTarget = ROLE_TARGETS.find((entry) => String(entry.roleId) === String(target.nextRoleId)) || null;

  return {
    ...result,
    status: canonicalStatus,
    legacyStatus: result.status,
    targetMessages: target.messages,
    targetTickets: target.tickets,
    role: target.name || target.role,
    roleId: target.roleId,
    nextRoleId: target.nextRoleId || "Max Level achieved!",
    nextRoleName: nextTarget ? nextTarget.name : (target.nextRoleId || "Max Level achieved!"),
    verdict: statusMap[result.status] || "⚠️ STAY",
  };
}

function sortReportRows(rows, requiredMessages = 1000, requiredTickets = 6) {
  return [...rows].map((row) => ({ ...row, result: evaluatePromoDemo(row, { requiredMessages, requiredTickets }) })).sort((a, b) => {
    const aWeight = (a.result.messagesPercent * 1.5) + a.result.ticketsPercent;
    const bWeight = (b.result.messagesPercent * 1.5) + b.result.ticketsPercent;
    return bWeight - aWeight;
  });
}

function registerTicketCheckin(state = {}, actor, channelId) {
  const next = {
    ...state,
    staffMembers: new Set(state.staffMembers || []),
    ticketTotals: { ...(state.ticketTotals || {}) },
    checkins: { ...(state.checkins || {}) },
  };

  if (!actor || !channelId) return next;

  const roleId = String(actor.roleId || "");
  if (!roleId) return next;

  if (!next.checkins[channelId]) {
    next.checkins[channelId] = actor.userId;
    next.ticketTotals[actor.userId] = (next.ticketTotals[actor.userId] || 0) + 1;
    next.staffMembers.add(actor.userId);
  }

  return next;
}

function getCheckinState(state = {}, actor, channelId) {
  return registerTicketCheckin(state, actor, channelId);
}

function getCheckinLeaderboard(ticketTotals = {}, limit = 10) {
  return Object.entries(ticketTotals || {})
    .filter(([userId, count]) => userId && Number(count) > 0)
    .map(([userId, count]) => ({ userId, checkins: Number(count) || 0 }))
    .sort((a, b) => b.checkins - a.checkins || a.userId.localeCompare(b.userId))
    .slice(0, limit);
}

function sumMetricForRange(guildMembers = {}, metricName, startDate, endDate) {
  const startKey = dateKey(startDate);
  const endKey = dateKey(endDate);
  const totals = new Map();

  for (const [memberKey, member] of Object.entries(guildMembers)) {
    if (!member || typeof member !== "object") continue;
    const [userId, datePart] = String(memberKey).split(":");
    if (!userId || !datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) continue;
    if (datePart < startKey || datePart > endKey) continue;
    const value = Number(member.metrics?.[metricName] || 0);
    if (!value) continue;
    totals.set(userId, (totals.get(userId) || 0) + value);
  }

  return Object.fromEntries([...totals.entries()].map(([userId, value]) => [userId, value]));
}

function getPromotionReport(client, guildId, rangeText) {
  const guild = client.db.getGuildSettings(guildId);
  const { start, end, startText, endText } = parseDateRange(rangeText);
  const messages = sumMetricForRange(guild.members || {}, "messages", start, end);
  const ticketTotals = guild.promotion?.ticketTotals || {};

  const rows = Object.keys(new Set([...Object.keys(messages), ...Object.keys(ticketTotals)])).map((userId) => {
    const member = client.guilds?.cache?.get(guildId)?.members?.cache?.get(userId) || null;
    const row = {
      userId,
      messages: Number(messages[userId] || 0),
      tickets: Number(ticketTotals[userId] || 0),
    };
    const customTarget = member ? evaluateRoleTarget(row, member) : evaluatePromoDemo(row, { requiredMessages: 1000, requiredTickets: 6 });
    row.result = customTarget;
    row.role = customTarget.role;
    row.targetMessages = customTarget.targetMessages;
    row.targetTickets = customTarget.targetTickets;
    return row;
  }).filter((row) => row.messages > 0 || row.tickets > 0).sort((a, b) => {
    const aScore = a.messages + (a.tickets * 200);
    const bScore = b.messages + (b.tickets * 200);
    return bScore - aScore;
  });

  return {
    start,
    end,
    startText,
    endText,
    rows,
  };
}

function getUserMetricsUpToDate(guildMembers = {}, userId, endDate = new Date(), promotionTicketTotals = {}) {
  const totals = { messages: 0, tickets: 0 };
  if (!userId) return totals;
  const endKey = dateKey(endDate);

  const directMember = guildMembers[userId];
  if (directMember && typeof directMember === "object") {
    totals.messages += Number(directMember.metrics?.messages || 0);
  }

  for (const [memberKey, member] of Object.entries(guildMembers || {})) {
    if (!member || typeof member !== "object") continue;
    if (!String(memberKey).startsWith(`${userId}:`)) continue;
    const [storedUserId, datePart] = String(memberKey).split(":");
    if (storedUserId !== String(userId) || !datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) continue;
    if (datePart > endKey) continue;
    totals.messages += Number(member.metrics?.messages || 0);
  }

  totals.tickets = Number(promotionTicketTotals?.[userId] || 0);
  return totals;
}

module.exports = {
  DEFAULT_STAFF_ROLE_ID,
  ROLE_TARGETS,
  getRoleTarget,
  parseDateValue,
  parseDateRange,
  formatDate,
  dateKey,
  evaluatePromoDemo,
  evaluateRoleTarget,
  sortReportRows,
  getCheckinState,
  registerTicketCheckin,
  getCheckinLeaderboard,
  sumMetricForRange,
  getPromotionReport,
  getUserMetricsUpToDate,
};
