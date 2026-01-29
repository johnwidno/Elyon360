-- Check all indexes on churches table
SHOW INDEXES FROM churches;

-- Drop duplicate or unnecessary indexes (run this after reviewing the output above)
-- Keep only the essential indexes:
-- 1. PRIMARY KEY
-- 2. subdomain unique index
-- 3. customDomain unique index

-- Example commands to drop indexes (uncomment after reviewing SHOW INDEXES output):
-- ALTER TABLE churches DROP INDEX index_name_1;
-- ALTER TABLE churches DROP INDEX index_name_2;
-- etc.
