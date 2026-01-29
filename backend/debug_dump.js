const db = require('./models');
const fs = require('fs');

async function debugDump() {
    try {
        let output = "";
        const churches = await db.Church.findAll();
        output += "=== CHURCHES ===\n";
        churches.forEach(c => {
            output += `[Church ID: ${c.id}] Subdomain: ${c.subdomain}, Acronym: ${c.acronym}, Name: ${c.name}\n`;
        });

        const orgs = await db.Organization.findAll();
        output += "\n=== ORGANIZATIONS ===\n";
        orgs.forEach(o => {
            output += `[Org ID: ${o.id}] ChurchID: ${o.churchId}, Name: ${o.name}, isSystem: ${o.isSystem}\n`;
        });

        const users = await db.User.findAll();
        output += "\n=== USERS ===\n";
        users.forEach(u => {
            output += `[User ID: ${u.id}] ChurchID: ${u.churchId}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}\n`;
        });

        fs.writeFileSync('debug_dump_log.txt', output, 'utf8');
        console.log("Dump written to debug_dump_log.txt");
        process.exit(0);
    } catch (error) {
        console.error("Dump failed:", error);
        process.exit(1);
    }
}

debugDump();
