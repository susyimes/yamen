const crypto = require("crypto");

function toAsciiToken(value, max = 24) {
  const base = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base.slice(0, max);

  const hash = crypto.createHash("sha1").update(String(value || "")).digest("hex");
  return hash.slice(0, Math.min(max, 12));
}

function buildBridgeBaseName(caseId, action, role) {
  const hash = crypto.createHash("sha1").update(`${caseId}__${action}__${role}`).digest("hex").slice(0, 10);
  return `${toAsciiToken(action, 20)}__${toAsciiToken(role, 12)}__${hash}`;
}

module.exports = {
  toAsciiToken,
  buildBridgeBaseName,
};
