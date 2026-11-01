const fs = require('fs');
const s = fs.readFileSync('server.js', 'utf8');

const lines = s.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((line, i) => {
  if (/(hour|session|market.*open|weekend|schedule|activehours|timecheck|tradinghour)/i.test(line)) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
