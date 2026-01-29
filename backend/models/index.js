const Sequelize = require("sequelize");
const dotenv = require('dotenv');
const path = require('path');

// Fallback in case server.js didn't load it or if running standalone
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Church = require("./Church.js")(sequelize, Sequelize);
db.User = require("./User.js")(sequelize, Sequelize);
db.Event = require("./Event.js")(sequelize, Sequelize);
db.Group = require("./Group.js")(sequelize, Sequelize);
db.Visitor = require("./Visitor.js")(sequelize, Sequelize);
db.Donation = require("./Donation.js")(sequelize, Sequelize);
db.SundaySchool = require("./SundaySchool.js")(sequelize, Sequelize);
db.SundaySchoolAttendance = require("./SundaySchoolAttendance.js")(sequelize, Sequelize);
db.InventoryItem = require("./InventoryItem.js")(sequelize, Sequelize);
db.Ceremony = require("./Ceremony.js")(sequelize, Sequelize);
db.Notification = require("./Notification.js")(sequelize, Sequelize);
db.Currency = require("./Currency.js")(sequelize, Sequelize);
db.DonationType = require("./DonationType.js")(sequelize, Sequelize);
db.Role = require("./Role.js")(sequelize, Sequelize);
db.Budget = require("./Budget.js")(sequelize, Sequelize);
db.StatusHistory = require("./StatusHistory.js")(sequelize, Sequelize);
db.CategoryHistory = require("./CategoryHistory.js")(sequelize, Sequelize);
db.Attachment = require("./Attachment.js")(sequelize, Sequelize);
db.MemberCategory = require("./MemberCategory.js")(sequelize, Sequelize);

db.Expense = require("./Expense.js")(sequelize, Sequelize);
db.BankAccount = require("./BankAccount.js")(sequelize, Sequelize);
db.Organization = require("./Organization.js")(sequelize, Sequelize);
db.ContactType = require("./ContactType.js")(sequelize, Sequelize);
db.ContactSubtype = require("./ContactSubtype.js")(sequelize, Sequelize);
db.GroupMember = require("./GroupMember.js")(sequelize, Sequelize);
db.EventParticipant = require("./EventParticipant.js")(sequelize, Sequelize);
db.CeremonyParticipant = require("./CeremonyParticipant.js")(sequelize, Sequelize);
db.GroupActivity = require("./GroupActivity.js")(sequelize, Sequelize);
db.ActivityParticipant = require("./ActivityParticipant.js")(sequelize, Sequelize);
db.SundaySchoolMonitor = require("./SundaySchoolMonitor.js")(sequelize, Sequelize);
db.SundaySchoolMember = require("./SundaySchoolMember.js")(sequelize, Sequelize);
db.SundaySchoolReport = require("./SundaySchoolReport.js")(sequelize, Sequelize);

// Associations
db.Church.hasMany(db.User, { foreignKey: "churchId", as: "users" });
db.User.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Visitor, { foreignKey: "churchId", as: "visitors" });
db.Visitor.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Organization, { foreignKey: "churchId", as: "organizations" });
db.Organization.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.ContactType, { foreignKey: "churchId", as: "contactTypes" });
db.ContactType.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.ContactSubtype, { foreignKey: "churchId", as: "contactSubtypes" });
db.ContactSubtype.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.ContactType.hasMany(db.ContactSubtype, { foreignKey: "contactTypeId", as: "subtypes" });
db.ContactSubtype.belongsTo(db.ContactType, { foreignKey: "contactTypeId", as: "type" });

db.ContactSubtype.hasMany(db.Organization, { foreignKey: "subtypeId", as: "organizations" });
db.Organization.belongsTo(db.ContactSubtype, { foreignKey: "subtypeId", as: "subtype" });

db.ContactSubtype.hasMany(db.User, { foreignKey: "subtypeId", as: "users" });
db.User.belongsTo(db.ContactSubtype, { foreignKey: "subtypeId", as: "contactSubtype" });

// History Associations
db.User.hasMany(db.StatusHistory, { foreignKey: "userId", as: "statusHistories" });
db.StatusHistory.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.StatusHistory.belongsTo(db.User, { foreignKey: "changedById", as: "changedBy" });

db.User.hasMany(db.CategoryHistory, { foreignKey: "userId", as: "categoryHistories" });
db.CategoryHistory.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.CategoryHistory.belongsTo(db.User, { foreignKey: "changedById", as: "changedBy" });
db.CategoryHistory.belongsTo(db.ContactSubtype, { foreignKey: "subtypeId", as: "contactSubtype" });
db.CategoryHistory.belongsTo(db.MemberCategory, { foreignKey: "memberCategoryId", as: "memberCategory" });

db.Church.hasMany(db.Event, { foreignKey: "churchId", as: "events" });
db.Event.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Group, { foreignKey: "churchId", as: "groups" });
db.Group.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

// Finance Associations (Income, Budget, Expenses)
db.Church.hasMany(db.Donation, { foreignKey: "churchId", as: "donations" });
db.Donation.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Budget, { foreignKey: "churchId", as: "budgets" });
db.Budget.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Expense, { foreignKey: "churchId", as: "expenses" });
db.Expense.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Budget.hasMany(db.Expense, { foreignKey: "budgetId", as: "expenses" });

db.Expense.belongsTo(db.Budget, { foreignKey: "budgetId", as: "budget" });

// Bank Account Associations
db.Church.hasMany(db.BankAccount, { foreignKey: "churchId", as: "bankAccounts" });
db.BankAccount.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.BankAccount.hasMany(db.Budget, { foreignKey: "bankAccountId", as: "budgets" });
db.Budget.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "bankAccount" });

db.BankAccount.hasMany(db.Donation, { foreignKey: "bankAccountId", as: "deposits" });
db.Donation.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "bankAccount" });

db.BankAccount.hasMany(db.Expense, { foreignKey: "bankAccountId", as: "expenses" });
db.Expense.belongsTo(db.BankAccount, { foreignKey: "bankAccountId", as: "bankAccount" });

db.User.hasMany(db.Donation, { foreignKey: "userId", as: "donations" });
db.Donation.belongsTo(db.User, { foreignKey: "userId", as: "member" });

// Audit Trail: Who created and who deposited
db.Donation.belongsTo(db.User, { foreignKey: "createdById", as: "createdBy" });
db.Donation.belongsTo(db.User, { foreignKey: "depositedById", as: "depositedBy" });

db.Organization.hasMany(db.Donation, { foreignKey: "organizationId", as: "donations" });
db.Donation.belongsTo(db.Organization, { foreignKey: "organizationId", as: "org" });

// Activity Participation Associations (Many-to-Many)
db.User.belongsToMany(db.Group, { through: db.GroupMember, foreignKey: 'userId', as: 'memberGroups' });
db.Group.belongsToMany(db.User, { through: db.GroupMember, foreignKey: 'groupId', as: 'groupMembers' });

db.Organization.belongsToMany(db.Group, { through: db.GroupMember, foreignKey: 'organizationId', as: 'partnerGroups' });
db.Group.belongsToMany(db.Organization, { through: db.GroupMember, foreignKey: 'groupId', as: 'groupPartners' });

// Group Activity Associations
db.Group.hasMany(db.GroupActivity, { foreignKey: 'groupId', as: 'activities' });
db.GroupActivity.belongsTo(db.Group, { foreignKey: 'groupId', as: 'group' });
db.GroupActivity.belongsTo(db.User, { foreignKey: 'coordinatorId', as: 'coordinator' });

db.GroupActivity.hasMany(db.ActivityParticipant, { foreignKey: 'activityId', as: 'participants' });
db.ActivityParticipant.belongsTo(db.GroupActivity, { foreignKey: 'activityId', as: 'activity' });

db.User.hasMany(db.ActivityParticipant, { foreignKey: 'userId', as: 'activityParticipations' });
db.ActivityParticipant.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });


db.Event.hasMany(db.EventParticipant, { foreignKey: 'eventId', as: 'eventParticipants' });
db.EventParticipant.belongsTo(db.Event, { foreignKey: 'eventId', as: 'event' });

db.User.hasMany(db.EventParticipant, { foreignKey: 'userId', as: 'eventParticipants' });
db.EventParticipant.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.belongsToMany(db.Event, { through: db.EventParticipant, foreignKey: 'userId', as: 'attendedEvents' });
db.Event.belongsToMany(db.User, { through: db.EventParticipant, foreignKey: 'eventId', as: 'eventAttendees' });

db.Organization.belongsToMany(db.Event, { through: db.EventParticipant, foreignKey: 'organizationId', as: 'attendedEvents' });
db.Event.belongsToMany(db.Organization, { through: db.EventParticipant, foreignKey: 'eventId', as: 'eventOrgs' });

db.User.belongsToMany(db.Ceremony, { through: db.CeremonyParticipant, foreignKey: 'userId', as: 'attendedCeremonies' });
db.Ceremony.belongsToMany(db.User, { through: db.CeremonyParticipant, foreignKey: 'ceremonyId', as: 'ceremonyAttendees' });

db.Organization.belongsToMany(db.Ceremony, { through: db.CeremonyParticipant, foreignKey: 'organizationId', as: 'attendedCeremonies' });
db.Ceremony.belongsToMany(db.Organization, { through: db.CeremonyParticipant, foreignKey: 'ceremonyId', as: 'ceremonyOrgs' });

// Sunday School Associations
db.Church.hasMany(db.SundaySchool, { foreignKey: "churchId", as: "sundaySchoolClasses" });
db.SundaySchool.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.SundaySchool.hasMany(db.SundaySchoolAttendance, { foreignKey: "classId", as: "attendances" });
db.SundaySchoolAttendance.belongsTo(db.SundaySchool, { foreignKey: "classId", as: "class" });

db.SundaySchoolAttendance.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.SundaySchoolAttendance.belongsTo(db.User, { foreignKey: "monitorId", as: "monitor" });

db.User.belongsToMany(db.SundaySchool, { through: db.SundaySchoolMember, foreignKey: 'userId', as: 'sundaySchoolClasses' });
db.SundaySchool.belongsToMany(db.User, { through: db.SundaySchoolMember, foreignKey: 'sundaySchoolId', as: 'classMembers' });

db.Church.hasMany(db.SundaySchoolMonitor, { foreignKey: "churchId", as: "sundaySchoolMonitors" });
db.SundaySchoolMonitor.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });
db.SundaySchoolMonitor.belongsTo(db.User, { foreignKey: "userId", as: "user" });
db.SundaySchoolMonitor.belongsTo(db.SundaySchool, { foreignKey: "classId", as: "class" });
db.SundaySchool.hasMany(db.SundaySchoolMonitor, { foreignKey: "classId", as: "monitors" });

db.Church.hasMany(db.SundaySchoolReport, { foreignKey: "churchId", as: "sundaySchoolReports" });
db.SundaySchoolReport.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });
db.SundaySchoolReport.belongsTo(db.SundaySchool, { foreignKey: "classId", as: "class" });
db.SundaySchoolReport.belongsTo(db.User, { foreignKey: "submittedById", as: "submittedBy" });

// Inventory Associations
db.Church.hasMany(db.InventoryItem, { foreignKey: "churchId", as: "inventory" });
db.InventoryItem.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

// Ceremony Associations
db.Church.hasMany(db.Ceremony, { foreignKey: "churchId", as: "ceremonies" });
db.Ceremony.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

// Notification Associations
db.User.hasMany(db.Notification, { foreignKey: "userId", as: "notifications" });
db.Notification.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// Currency Associations
db.Church.hasMany(db.Currency, { foreignKey: "churchId", as: "currencies" });
db.Currency.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.DonationType, { foreignKey: "churchId", as: "donationTypes" });
db.DonationType.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.Church.hasMany(db.Role, { foreignKey: "churchId", as: "roles" });
db.Role.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.PaymentMethod = require("./PaymentMethod.js")(sequelize, Sequelize);
db.Church.hasMany(db.PaymentMethod, { foreignKey: "churchId", as: "paymentMethods" });
db.PaymentMethod.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.EventType = require("./EventType.js")(sequelize, Sequelize);
db.Church.hasMany(db.EventType, { foreignKey: "churchId", as: "eventTypes" });
db.EventType.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

// If we want to link event/activity to EventType (optional but good for data integrity)
// For now, the user requested that they be available in select buttons.
// We can use the name as the value for compatibility or the ID.
// Given the user said "autre : preciser", maybe they want to keep the current ENUM but extend it?
// Actually, it's better to allow dynamic selection.

db.Plan = require("./Plan.js")(sequelize, Sequelize);
// Church has one Plan (or belongs to one Plan)
db.Church.belongsTo(db.Plan, { foreignKey: "planId", as: "subscriptionPlan" });
db.Plan.hasMany(db.Church, { foreignKey: "planId", as: "subscribedChurches" });

// ==========================================
// RELATIONSHIPS & ORGANIZATION MEMBERSHIPS
// ==========================================
db.Relationship = require("./Relationship.js")(sequelize, Sequelize);
db.OrganizationMember = require("./OrganizationMember.js")(sequelize, Sequelize);

// Member-to-Member Relationships (Family, etc.)
db.User.hasMany(db.Relationship, { foreignKey: "personAId", as: "relationships" });
db.Relationship.belongsTo(db.User, { foreignKey: "personAId", as: "personA" });
db.Relationship.belongsTo(db.User, { foreignKey: "personBId", as: "personB" });

// Member-to-Organization Relationships (Startups, Employment, etc.)
db.User.belongsToMany(db.Organization, { through: db.OrganizationMember, foreignKey: 'userId', as: 'affiliatedOrganizations' });
db.Organization.belongsToMany(db.User, { through: db.OrganizationMember, foreignKey: 'organizationId', as: 'members' });

// Direct access to OrganizationMember for managing roles/status
db.User.hasMany(db.OrganizationMember, { foreignKey: 'userId', as: 'organizationRoles' });
db.OrganizationMember.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Organization.hasMany(db.OrganizationMember, { foreignKey: 'organizationId', as: 'organizationMemberships' });
db.OrganizationMember.belongsTo(db.Organization, { foreignKey: 'organizationId', as: 'organization' });

// Attachment Associations
db.User.hasMany(db.Attachment, { foreignKey: "userId", as: "attachments" });
db.Attachment.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// MemberCategory Associations
db.Church.hasMany(db.MemberCategory, { foreignKey: "churchId", as: "memberCategories" });
db.MemberCategory.belongsTo(db.Church, { foreignKey: "churchId", as: "church" });

db.MemberCategory.hasMany(db.User, { foreignKey: "memberCategoryId", as: "users" });
db.User.belongsTo(db.MemberCategory, { foreignKey: "memberCategoryId", as: "category" });

db.MemberCategory.hasMany(db.SundaySchool, { foreignKey: "memberCategoryId", as: "sundaySchoolClasses" });
db.SundaySchool.belongsTo(db.MemberCategory, { foreignKey: "memberCategoryId", as: "admissionCategory" });


module.exports = db;
