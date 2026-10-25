const fs = require('fs');

function findResourcePath(filename) {
  const candidates = [
    path.join(__dirname, '../../../', filename), // monorepo root from server/src/config
    path.join(__dirname, '../../', filename),    // if server root is repository root
    path.join(process.cwd(), filename),          // current working directory
    path.join(process.cwd(), '..', filename)
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.join(__dirname, '../../../', filename);
}

const CASES_PATH = findResourcePath('cases.json');
const SCHEMA_PATH = findResourcePath('case_schema.json');
const LIBRARY_PATH = findResourcePath('platform_library.json');

module.exports = {
  PORT: process.env.PORT || 4000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interrogation_room',
  CASES_PATH,
  SCHEMA_PATH,
  LIBRARY_PATH,
  PHASES: ['briefing', 'investigation', 'interrogation', 'charging', 'trial', 'verdict', 'reveal'],
  DEFAULT_DECISION_WINDOW_SECONDS: 60,
  MAX_OUTPUT_TOKENS: 400,
  MAX_ACTIONS_PER_ROUND: 1,
  INVALID_STRIKES_BEFORE_REMOVAL: 3,
  INACTIVE_ROUNDS_BEFORE_REPLACEMENT: 3
};
