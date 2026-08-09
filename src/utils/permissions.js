function hasPermission(member, permission) {
  return Boolean(member?.permissions?.has(permission));
}

function canManageTarget(actor, target) {
  if (!actor || !target || actor.id === target.id) return false;
  return actor.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

module.exports = { hasPermission, canManageTarget };
