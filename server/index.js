// Bridge entry point redirecting to root server.js
const path = require('path');
process.chdir(path.join(__dirname, '..'));
require('../server.js');
