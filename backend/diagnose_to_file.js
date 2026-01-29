const db = require('./models');
const fs = require('fs');

async function diagnose() {
    let output = "";
    try {
        output += "--- Diagnosing churches table indexes ---\n";
        const [results] = await db.sequelize.query("SHOW INDEX FROM churches");
        output += `Found ${results.length} indexes.\n`;

        results.forEach(r => {
            output += `INDEX_NAME: ${r.Key_name} | COLUMN: ${r.Column_name} | UNIQUE: ${r.Non_unique === 0}\n`;
        });

        output += "\n--- Columns ---\n";
        const [columns] = await db.sequelize.query("DESCRIBE churches");
        columns.forEach(c => {
            output += `COLUMN: ${c.Field} | TYPE: ${c.Type} | KEY: ${c.Key}\n`;
        });

        fs.writeFileSync('diagnosis_output.txt', output);
        console.log("Diagnosis saved to diagnosis_output.txt");
    } catch (error) {
        console.error("Diagnosis failed:", error);
    } finally {
        await db.sequelize.close();
    }
}

diagnose();
