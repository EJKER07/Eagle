const DEFAULT_STAFF_ROLE_ID = "1534099901976416257";

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
  return { start: rangeStart, end: rangeEnd, startText: formatDate(rangeStart), endText: formatDate(rangeEnd) };
}

function evaluatePromoDemo(metrics, target = { requiredMessages: 1000, requiredTickets: 6 }) {
  const messages = Number(metrics.messages || 0);
  const tickets = Number(metrics.tickets || 0);
  const requiredMessages = Number(target.requiredMessages || 1000);
  const requiredTickets = Number(target.requiredTickets || 6);
  const messagesPercent = requiredMessages > 0 ? Math.min(200, Math.round((messages / requiredMessages) * 100)) : 0;
  const ticketsPercent = requiredTickets > 0 ? Math.min(200, Math.round((tickets / requiredTickets) * 100)) : 0;

  let status = "stay";
  if (messagesPercent >= 200 || ticketsPercent >= 200) status = "double-promo";
  else if (messagesPercent >= 100 || ticketsPercent >= 100 || (messagesPercent >= 50 && ticketsPercent >= 50)) status = "promo";
  else if (messagesPercent >= 50 || ticketsPercent >= 50) status = "stay";
  else status = "demote";

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

function sortReportRows(rows, requiredMessages = 1000, requiredTickets = 6) {
  return [...rows].map((row) => ({ ...row, result: evaluatePromoDemo(row, { requiredMessages, requiredTickets }) })).sort((a, b) => {
    const aWeight = (a.result.messagesPercent * 1.5) + a.result.ticketsPercent;
    const bWeight = (b.result.messagesPercent * 1.5) + b.result.ticketsPercent;
    return bWeight - aWeight;
  });
}

function getCheckinState(state = {}, actor, channelId) {
  const next = {
    ...state,
    staffMembers: new Set(state.staffMembers || []),
    ticketTotals: { ...(state.ticketTotals || {}) },
    checkins: { ...(state.checkins || {}) },
  };

  if (!actor || !channelId) return next;

  const roleId = String(actor.roleId || "");
  if (roleId !== DEFAULT_STAFF_ROLE_ID) return next;

  if (!next.checkins[channelId]) {
    next.checkins[channelId] = actor.userId;
    next.ticketTotals[actor.userId] = (next.ticketTotals[actor.userId] || 0) + 1;
    next.staffMembers.add(actor.userId);
  }

  return next;
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
  const tickets = sumMetricForRange(guild.members || {}, "tickets", start, end);

  const rows = Object.keys(new Set([...Object.keys(messages), ...Object.keys(tickets)])).map((userId) => {
    const row = {
      userId,
      messages: Number(messages[userId] || 0),
      tickets: Number(tickets[userId] || 0),
    };
    row.result = evaluatePromoDemo(row, { requiredMessages: 1000, requiredTickets: 6 });
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

module.exports = {
  DEFAULT_STAFF_ROLE_ID,
  parseDateValue,
  parseDateRange,
  formatDate,
  dateKey,
  evaluatePromoDemo,
  getCheckinState,
  sumMetricForRange,
  getPromotionReport,
};
