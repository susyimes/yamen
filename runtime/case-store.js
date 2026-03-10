const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getActiveDir(repoRoot) {
  return path.join(repoRoot, "cases", "active");
}

function getArchiveDir(repoRoot) {
  return path.join(repoRoot, "cases", "archive");
}

function ensureCaseDirs(repoRoot) {
  ensureDir(getActiveDir(repoRoot));
  ensureDir(getArchiveDir(repoRoot));
}

function getActiveCasePath(repoRoot, caseId) {
  return path.join(getActiveDir(repoRoot), `${caseId}.json`);
}

function getArchiveCasePath(repoRoot, caseId) {
  return path.join(getArchiveDir(repoRoot), `${caseId}.json`);
}

function saveActiveCase(repoRoot, currentCase) {
  ensureCaseDirs(repoRoot);
  writeJson(getActiveCasePath(repoRoot, currentCase.case_id), currentCase);
}

function loadCase(repoRoot, caseId) {
  const activePath = getActiveCasePath(repoRoot, caseId);
  const archivePath = getArchiveCasePath(repoRoot, caseId);

  if (fs.existsSync(activePath)) return readJson(activePath);
  if (fs.existsSync(archivePath)) return readJson(archivePath);
  throw new Error(`Case not found: ${caseId}`);
}

function archiveCase(repoRoot, currentCase) {
  ensureCaseDirs(repoRoot);
  const activePath = getActiveCasePath(repoRoot, currentCase.case_id);
  const archivePath = getArchiveCasePath(repoRoot, currentCase.case_id);
  writeJson(archivePath, currentCase);
  if (fs.existsSync(activePath)) fs.unlinkSync(activePath);
}

function listActiveCases(repoRoot) {
  ensureCaseDirs(repoRoot);
  return fs
    .readdirSync(getActiveDir(repoRoot))
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJson(path.join(getActiveDir(repoRoot), name)));
}

module.exports = {
  ensureCaseDirs,
  saveActiveCase,
  loadCase,
  archiveCase,
  listActiveCases,
};
