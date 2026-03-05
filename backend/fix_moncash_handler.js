const fs = require('fs');

// Read the file
let content = fs.readFileSync('./controllers/saasController.js', 'utf8');

// Find and replace the problematic section
const searchPattern = /} catch \(pError\) \{[^}]*return res\.status\(400\)\.json\(\{[^}]*\}\);[^}]*\}/s;

const replacement = `} catch (pError) {
                console.error("[MonCash] Error generating payment link:", pError);
                // L'église est déjà créée, on continue sans redirection
                // Elle restera inactive jusqu'au paiement manuel
                console.log(\`[MonCash] Church created but payment link failed. Church will remain inactive.\`);
            }`;

if (searchPattern.test(content)) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync('./controllers/saasController.js', content, 'utf8');
    console.log("✅ Successfully removed the problematic return statement");
} else {
    console.log("❌ Pattern not found in file");
}
