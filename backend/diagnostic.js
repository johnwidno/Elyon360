const db = require('./models');
const fs = require('fs');

async function runDiagnostic() {
    const report = {
        timestamp: new Date().toISOString(),
        pendingCount: 0,
        pendingDetails: [],
        recentChurches: [],
        errors: []
    };

    try {
        console.log("Starting Diagnostic...");

        // 1. Check Pending Registrations
        const pending = await db.PendingRegistration.findAll();
        report.pendingCount = pending.length;
        report.pendingDetails = pending.map(p => ({
            id: p.id,
            orderId: p.orderId,
            status: p.status,
            paymentMethod: p.paymentMethod,
            amount: p.amount,
            churchName: p.churchData?.churchName || p.churchData?.name,
            createdAt: p.createdAt
        }));

        // 2. Check Recent Churches
        const churches = await db.Church.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'subdomain', 'moncashOrderId', 'createdAt']
        });
        report.recentChurches = churches;

        fs.writeFileSync('diagnostic_report.json', JSON.stringify(report, null, 2));
        console.log("Diagnostic report saved to diagnostic_report.json");
        process.exit(0);
    } catch (error) {
        console.error("Diagnostic failed:", error);
        fs.writeFileSync('diagnostic_error.txt', error.stack);
        process.exit(1);
    }
}

runDiagnostic();
