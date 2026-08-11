const fs = require('fs');
try {
  const data = fs.readFileSync('/Users/admin/game-logic/data/hay-la.json', 'utf8');
  JSON.parse(data);
  console.log('JSON is valid');
} catch (e) {
  console.error(e.message);
  // Print context around the error position if available
  if (e.message.includes('position')) {
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const data = fs.readFileSync('/Users/admin/game-logic/data/hay-la.json', 'utf8');
      const start = Math.max(0, pos - 50);
      const end = Math.min(data.length, pos + 50);
      console.log('Context:');
      console.log(data.substring(start, end));
    }
  }
}
