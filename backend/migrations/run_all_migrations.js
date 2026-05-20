/**
 * Phase 1 + Phase 2 Database Migration Runner
 * Executes all RBAC + Security migrations sequentially using Sequelize
 * 
 * Usage: node backend/migrations/run_all_migrations.js
 * 
 * Phase 1 Migrations (RBAC):
 * 1. 001_create_church_networks_table
 * 2. 002_create_roles_table
 * 3. 003_create_permissions_table
 * 4. 004_create_user_roles_table
 * 5. 005_create_church_network_affiliations_table
 * 6. 006_create_church_data_consent_table
 * 7. 007_alter_churches_add_network_billing_columns
 * 
 * Phase 2 Migrations (Security):
 * 8. 008_create_audit_logs_table
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  // Phase 1: RBAC
  '001_create_church_networks_table.js',
  '002_create_roles_table.js',
  '003_create_permissions_table.js',
  '004_create_user_roles_table.js',
  '005_create_church_network_affiliations_table.js',
  '006_create_church_data_consent_table.js',
  '007_alter_churches_add_network_billing_columns.js',
  // Phase 2: Security
  '008_create_audit_logs_table.js',
];

async function runMigrations() {
  let sequelize;

  try {
    // Create Sequelize connection
    console.log('Connecting to PostgreSQL database...');

    sequelize = new Sequelize(
      process.env.DB_NAME || 'elyon360',
      process.env.DB_USER || 'elyon_user',
      process.env.DB_PASSWORD || 'elyon_pass',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Get query interface
    const queryInterface = sequelize.getQueryInterface();

    // Execute migrations
    console.log('🔄 Running migrations...\n');

    const results = {
      successful: [],
      failed: [],
      skipped: [],
    };

    for (const migration of MIGRATIONS) {
      const migrationPath = path.join(__dirname, migration);

      console.log(`⏳ Executing: ${migration}`);

      try {
        // Check if migration file exists
        if (!fs.existsSync(migrationPath)) {
          console.log(`   ⏭️  Skipped: File not found\n`);
          results.skipped.push(migration);
          continue;
        }

        // Load and execute migration
        const migrationModule = require(migrationPath);

        // Execute up() function
        await migrationModule.up(queryInterface, Sequelize);

        console.log(`   ✅ Success\n`);
        results.successful.push(migration);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        results.failed.push({
          migration,
          error: error.message,
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.successful.length}`);
    if (results.successful.length > 0) {
      results.successful.forEach((m) => console.log(`   - ${m}`));
    }

    console.log(`\n⏭️  Skipped: ${results.skipped.length}`);
    if (results.skipped.length > 0) {
      results.skipped.forEach((m) => console.log(`   - ${m}`));
    }

    console.log(`\n❌ Failed: ${results.failed.length}`);
    if (results.failed.length > 0) {
      results.failed.forEach((item) => {
        console.log(`   - ${item.migration}: ${item.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed.length === 0) {
      console.log('✅ All migrations completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Some migrations failed. Please review errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run migrations
runMigrations();
