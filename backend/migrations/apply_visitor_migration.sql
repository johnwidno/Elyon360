-- Migration script to update visitors table
-- Run this SQL script directly in your MySQL database

-- Step 1: Add new columns (temporarily nullable)
ALTER TABLE `visitors` 
ADD COLUMN `firstName` VARCHAR(255) NULL AFTER `churchId`,
ADD COLUMN `lastName` VARCHAR(255) NULL AFTER `firstName`,
ADD COLUMN `description` TEXT NULL AFTER `phone`,
ADD COLUMN `wantsMembership` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
ADD COLUMN `viewStatus` ENUM('not_viewed', 'viewed') NOT NULL DEFAULT 'not_viewed' AFTER `wantsMembership`,
ADD COLUMN `convertedToMemberId` INT NULL AFTER `viewStatus`;

-- Step 2: Migrate existing fullName data to firstName and lastName
-- This will split "John Doe" into firstName="John" and lastName="Doe"
UPDATE `visitors` 
SET 
    `firstName` = SUBSTRING_INDEX(`fullName`, ' ', 1),
    `lastName` = CASE 
        WHEN LOCATE(' ', `fullName`) > 0 
        THEN SUBSTRING(`fullName`, LOCATE(' ', `fullName`) + 1)
        ELSE SUBSTRING_INDEX(`fullName`, ' ', 1)
    END
WHERE `fullName` IS NOT NULL;

-- Step 3: Make firstName and lastName NOT NULL
ALTER TABLE `visitors`
MODIFY COLUMN `firstName` VARCHAR(255) NOT NULL,
MODIFY COLUMN `lastName` VARCHAR(255) NOT NULL;

-- Step 4: Drop the old fullName column
ALTER TABLE `visitors` DROP COLUMN `fullName`;

-- Step 5: Add foreign key constraint for convertedToMemberId
ALTER TABLE `visitors`
ADD CONSTRAINT `fk_visitor_converted_member`
FOREIGN KEY (`convertedToMemberId`) REFERENCES `users`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Add indexes for better search performance
CREATE INDEX `idx_firstName` ON `visitors`(`firstName`);
CREATE INDEX `idx_lastName` ON `visitors`(`lastName`);
CREATE INDEX `idx_viewStatus` ON `visitors`(`viewStatus`);
CREATE INDEX `idx_wantsMembership` ON `visitors`(`wantsMembership`);

-- Verification query - check the new structure
-- SELECT * FROM `visitors` LIMIT 5;
