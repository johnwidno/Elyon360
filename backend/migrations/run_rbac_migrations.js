/**
 * RBAC Database Migration Runner
 * Executes Phase 1 RBAC migrations sequentially using Sequelize
 * 
 * Usage: node backend/migrations/run_rbac_migrations.js
 * 
 * Migrations to run:
 * 1. 001_create_church_networks_table
 * 2. 002_create_roles_table
 * 3. 003_create_permissions_table
 * 4. 004_create_user_roles_table
 * 5. 005_create_church_network_affiliations_table
 * 6. 006_create_church_data_consent_table
 * 7. 007_alter_churches_add_network_billing_columns
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  '001_create_church_networks_table.js',
  '002_create_roles_table.js',
  '003_create_permissions_table.js',
  '004_create_user_roles_table.js',
  '005_create_church_network_affiliations_table.js',
  '006_create_church_data_consent_table.js',
  '007_alter_churches_add_network_billing_columns.js',
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
    console.log('✅ Connected to database');
    console.log('');
    console.log('Starting RBAC Phase 1 Migration Runner...');
    console.log('================================================');
    console.log('');

    const queryInterface = sequelize.getQueryInterface();

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Run each migration sequentially
    for (const migrationFile of MIGRATIONS) {
      try {
        console.log(`▶️  Running migration: ${migrationFile}`);

        // Require the migration
        const migrationPath = path.join(__dirname, migrationFile);
        const migration = require(migrationPath);

        // Execute up() function with Sequelize and queryInterface
        if (typeof migration.up === 'function') {
          await migration.up(queryInterface, Sequelize);
          console.log(`✅ Completed: ${migrationFile}`);
          successCount++;
        } else {
          console.warn(`⚠️  Skipped: ${migrationFile} (no up() function)`);
        }

        console.log('');
      } catch (error) {
        console.error(`❌ Failed: ${migrationFile}`);
        console.error(`   Error: ${error.message}`);
        if (error.original?.detail) {
          console.error(`   Details: ${error.original.detail}`);
        }
        errorCount++;
        errors.push({
          file: migrationFile,
          error: error.message,
        });
        console.log('');
      }
    }

    // Summary
    console.log('================================================');
    console.log('Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log('');

    if (errors.length > 0) {
      console.log('Errors encountered:');
      errors.forEach((err) => {
        console.log(`  • ${err.file}: ${err.error}`);
      });
      console.log('');
      console.error('⚠️  Some migrations failed. Please review and fix before proceeding.');
      process.exit(1);
    } else {
      console.log('✅ All RBAC migrations completed successfully!');
      console.log('');
      console.log('New database tables created:');
      console.log('  • church_networks (diocese/district groupings)');
      console.log('  • roles (RBAC role definitions with domain separation)');
      console.log('  • permissions (permission definitions with resource/action mapping)');
      console.log('  • user_roles (multi-role assignment junction table)');
      console.log('  • church_network_affiliations (church-network relationships)');
      console.log('  • church_data_consent (granular data sharing consent)');
      console.log('');
      console.log('Churches table columns added:');
      console.log('  • networkId (foreign key to church_networks)');
      console.log('  • planId (billing plan reference)');
      console.log('  • subscriptionStatus (trial/trial_expired/active/suspended/cancelled)');
      console.log('  • trialStartedAt (trial start timestamp)');
      console.log('  • nextBillingDate (next billing date)');
      console.log('');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration runner failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run migrations
runMigrations();
