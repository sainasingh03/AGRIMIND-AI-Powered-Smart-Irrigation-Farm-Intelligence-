const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(
  __dirname,
  "../data"
);

const POLICY_FILE = path.join(
  DATA_DIR,
  "qTable.json"
);

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }
}

function loadPolicy() {
  try {
    ensureDataDirectory();

    if (!fs.existsSync(POLICY_FILE)) {
      return {};
    }

    const raw = fs.readFileSync(
      POLICY_FILE,
      "utf8"
    );

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      "Failed to load Q-table:",
      error
    );

    return {};
  }
}

function savePolicy(qTable) {
  try {
    ensureDataDirectory();

    fs.writeFileSync(
      POLICY_FILE,
      JSON.stringify(
        qTable,
        null,
        2
      ),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to save Q-table:",
      error
    );

    return false;
  }
}

function resetPolicy() {
  ensureDataDirectory();

  fs.writeFileSync(
    POLICY_FILE,
    JSON.stringify(
      {},
      null,
      2
    ),
    "utf8"
  );

  return true;
}

module.exports = {
  loadPolicy,
  savePolicy,
  resetPolicy
};