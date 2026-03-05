// DEBUG: Check exact lines in saasController.js
const fs = require('fs');
const content = fs.readFileSync('./controllers/saasController.js', 'utf8');
const lines = content.split('\n');

console.log("Lines 230-237:");
for (let i = 229; i < 237; i++) {
    console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
