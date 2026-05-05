const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// LOAD ENV BEFORE DB INITIALIZATION
dotenv.config({ path: path.join(__dirname, '.env') });

const db = require('./models');

const app = express();
const tenantMiddleware = require('./middleware/tenant'); // IMPORT

// Middleware
app.use(cors({
    origin: '*', // Nan production, mete URL frontend la
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(require('./middleware/sanitize')); // CONVERT "" TO NULL GLOBALLY
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger for Debugging
app.use((req, res, next) => {
    console.log(`\n>>> [${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`    Host: ${req.headers.host}`);
    console.log(`    X-Tenant-ID: ${req.headers['x-tenant-id']}`);
    console.log(`    Authorization: ${req.headers.authorization ? 'Present' : 'MISSING'}`);
    next();
});

app.use(tenantMiddleware); // APPLY GLOBALLY

// Routes
const authRoutes = require('./routes/authRoutes');
const saasRoutes = require('./routes/saasRoutes');
const memberRoutes = require('./routes/memberRoutes');
const eventRoutes = require('./routes/eventRoutes');
const groupRoutes = require('./routes/groupRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const churchRoutes = require('./routes/churchRoutes');
const donationRoutes = require('./routes/donationRoutes');
const sundaySchoolRoutes = require('./routes/sundaySchoolRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const ceremonyRoutes = require('./routes/ceremonyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const roleRoutes = require('./routes/roleRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const contactClassificationRoutes = require('./routes/contactClassificationRoutes');
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const userRoutes = require('./routes/userRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const eventTypeRoutes = require('./routes/eventTypeRoutes');
const communityPostRoutes = require('./routes/communityPostRoutes');
const memberCategoryRoutes = require('./routes/memberCategoryRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const memberAlertRoutes = require('./routes/memberAlertRoutes');
const memberRequestRoutes = require('./routes/memberRequestRoutes');
const memberCardRoutes = require('./routes/memberCardRoutes');
const cardTemplateRoutes = require('./routes/cardTemplateRoutes');
const searchBuilderRoutes = require('./routes/searchBuilderRoutes');
const worshipRoutes = require('./routes/worshipRoutes');
const memberStatusRoutes = require('./routes/memberStatusRoutes');

app.use('/api/statuses', memberStatusRoutes);
app.post('/api/statuses/upload_test', (req, res) => res.json({ message: 'Direct route works' }));
app.use('/api/public', publicRoutes); // NEW PUBLIC ROUTE
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // NEW ROUTE
app.use('/api/relationships', relationshipRoutes); // NEW ROUTE
app.use('/api/communication', communicationRoutes); // NEW ROUTE
app.use('/api/attachments', attachmentRoutes); // NEW ROUTE
app.use('/api/saas', saasRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/members', memberAlertRoutes);
app.use('/api/member-requests', memberRequestRoutes);
app.use('/api/member-cards', memberCardRoutes);
app.use('/api/card-templates', cardTemplateRoutes);
app.use('/api/search-builder', searchBuilderRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/churches', churchRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/sunday-school', sundaySchoolRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ceremonies', ceremonyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);

app.use('/api/contacts/classification', contactClassificationRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/member-categories', memberCategoryRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/community-posts', communityPostRoutes);
app.use('/api/worship', worshipRoutes);
// app.use('/api/members', memberAlertRoutes); // MOVED UP

// Test Route
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenue sur l\'API ElyonSys 360',
        tenant: req.church ? req.church.name : 'Global / SaaS'
    });
});

// Sync Database & Start Server
const PORT = process.env.PORT || 5000;
const seedDB = require('./maintenance/scripts/seed_db');

db.sequelize.sync({ alter: false })
    .then(async () => {
        console.log('Base de données synchronisée.');
        
        // Auto-seed if database is empty
        try {
            const userCount = await db.User.count();
            if (userCount === 0) {
                console.log('⚠️ Base de données vide détectée. Lancement du seeding automatique...');
                await seedDB();
            }
        } catch (seedErr) {
            console.error('Erreur lors du seeding automatique:', seedErr);
        }

        const server = app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
        });

        // Keep process alive explicitly
        setInterval(() => {
            console.log('Heartbeat...');
        }, 30000);
    })
    .catch((err) => {
        console.error('Erreur de connexion à la DB:', err);
    });
