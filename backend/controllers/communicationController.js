const db = require('../models');
const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a message (Email or SMS stub)
 */
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, type, title, message } = req.body;
        const churchId = req.user.churchId;

        if (!recipientId || !type || !message) {
            return res.status(400).json({ message: "Paramètres manquants (recipientId, type, message)." });
        }

        // Fetch recipient to log details
        const recipient = await db.User.findByPk(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: "Destinataire introuvable." });
        }

        // 1. Real Sending if type is email
        if (type === 'email') {
            if (!recipient.email) {
                return res.status(400).json({ message: "Le membre n'a pas d'adresse email." });
            }

            const mailOptions = {
                from: process.env.FROM_EMAIL || `"ElyonSys 360" <${process.env.SMTP_USER}>`,
                to: recipient.email,
                subject: title || 'Joyeux Anniversaire !',
                text: message,
                html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #4318FF;">${title || 'Joyeux Anniversaire !'}</h2>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #777;">Cet email a été envoyé par ElyonSys 360 au nom de votre église.</p>
                      </div>`
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SENT] To: ${recipient.email}`);
        } else {
            // SMS Stub (simulated for now)
            console.log(`\n--- [SMS STUB] ---`);
            console.log(`TO: ${recipient.phone}`);
            console.log(`CONTENT: ${message}`);
            console.log(`------------------\n`);
        }

        // 2. Create a notification for the recipient
        await db.Notification.create({
            userId: recipientId,
            title: title || 'Message reçu',
            message: message,
            type: 'system',
            isRead: false
        });

        res.json({ success: true, message: `Message (${type}) envoyé avec succès.` });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: "Erreur lors de l'envoi du message. Vérifiez la configuration SMTP." });
    }
};

/**
 * Get message history for a specific user
 */
exports.getMessageHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await db.Notification.findAll({
            where: { userId, type: 'system' },
            order: [['createdAt', 'DESC']]
        });
        res.json(messages);
    } catch (error) {
        console.error("Get Message History Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de l'historique." });
    }
};
