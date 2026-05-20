-- Initialize Elyon360 Database for PostgreSQL
-- This script runs automatically when the PostgreSQL container starts

-- Create the main database if it doesn't exist
-- Note: The POSTGRES_DB environment variable will handle this automatically,
-- so we just need to ensure tables are created in the connected database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSON extensions (often useful)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create fallback database for multi-tenancy or compatibility
-- Some parts of the application may reference this as a default tenant
CREATE DATABASE IF NOT EXISTS elyon_user;

-- You can add initial table creation here if needed
-- Tables will be created by Sequelize ORM on first run
