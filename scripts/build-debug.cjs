const fs = require('fs');
const path = require('path');

console.log('cwd:', process.cwd());
console.log('node:', process.version);

function walk(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((it) => {
    const p = path.join(dir, it);
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (e) {
      console.log('??', p);
      return;
    }
    console.log((stat.isDirectory() ? 'd ' : 'f ') + path.relative(process.cwd(), p));
    if (stat.isDirectory()) walk(p);
  });
}

walk(process.cwd());

process.exit(0);
