const fs = require('fs');

// 1. Update server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
  /copytrade:\s*\{\s*masterAccount:\s*"5100154135"/g,
  `copytrade: {\n    name: "The Mighty Duck",\n    avatar: "img/themightyduck.png",\n    masterAccount: "5100154135"`
);
serverJs = serverJs.replace(
  /db\.copytrade\s*=\s*\{\s*masterAccount:\s*"5100154135"/g,
  `db.copytrade = {\n            name: "The Mighty Duck",\n            avatar: "img/themightyduck.png",\n            masterAccount: "5100154135"`
);
fs.writeFileSync('server.js', serverJs, 'utf8');
console.log('server.js updated with The Mighty Duck branding');
