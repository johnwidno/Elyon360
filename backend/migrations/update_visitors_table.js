const { Sequelize } = require('sequelize');

module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Step 1: Add new columns
            await queryInterface.addColumn('visitors', 'firstName', {
                type: Sequelize.STRING,
                allowNull: true // Temporarily nullable for migration
            }, { transaction });

            await queryInterface.addColumn('visitors', 'lastName', {
                type: Sequelize.STRING,
                allowNull: true // Temporarily nullable for migration
            }, { transaction });

            await queryInterface.addColumn('visitors', 'description', {
                type: Sequelize.TEXT,
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('visitors', 'wantsMembership', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            }, { transaction });

            await queryInterface.addColumn('visitors', 'viewStatus', {
                type: Sequelize.ENUM('not_viewed', 'viewed'),
                defaultValue: 'not_viewed',
                allowNull: false
            }, { transaction });

            await queryInterface.addColumn('visitors', 'convertedToMemberId', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            // Step 2: Migrate existing fullName data to firstName and lastName
            // This splits "John Doe" into firstName="John" and lastName="Doe"
            const [visitors] = await queryInterface.sequelize.query(
                'SELECT id, fullName FROM visitors WHERE fullName IS NOT NULL',
                { transaction }
            );

            for (const visitor of visitors) {
                const nameParts = visitor.fullName.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'Unknown';

                await queryInterface.sequelize.query(
                    'UPDATE visitors SET firstName = ?, lastName = ? WHERE id = ?',
                    {
                        replacements: [firstName, lastName, visitor.id],
                        transaction
                    }
                );
            }

            // Step 3: Make firstName and lastName NOT NULL
            await queryInterface.changeColumn('visitors', 'firstName', {
                type: Sequelize.STRING,
                allowNull: false
            }, { transaction });

            await queryInterface.changeColumn('visitors', 'lastName', {
                type: Sequelize.STRING,
                allowNull: false
            }, { transaction });

            // Step 4: Remove fullName column
            await queryInterface.removeColumn('visitors', 'fullName', { transaction });

            // Step 5: Add indexes for performance
            await queryInterface.addIndex('visitors', ['firstName'], { transaction });
            await queryInterface.addIndex('visitors', ['lastName'], { transaction });
            await queryInterface.addIndex('visitors', ['viewStatus'], { transaction });
            await queryInterface.addIndex('visitors', ['wantsMembership'], { transaction });

            await transaction.commit();
            console.log('✅ Visitor table migration completed successfully');
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Reverse migration: restore fullName from firstName + lastName
            await queryInterface.addColumn('visitors', 'fullName', {
                type: Sequelize.STRING,
                allowNull: true
            }, { transaction });

            const [visitors] = await queryInterface.sequelize.query(
                'SELECT id, firstName, lastName FROM visitors',
                { transaction }
            );

            for (const visitor of visitors) {
                const fullName = `${visitor.firstName} ${visitor.lastName}`.trim();
                await queryInterface.sequelize.query(
                    'UPDATE visitors SET fullName = ? WHERE id = ?',
                    {
                        replacements: [fullName, visitor.id],
                        transaction
                    }
                );
            }

            await queryInterface.changeColumn('visitors', 'fullName', {
                type: Sequelize.STRING,
                allowNull: false
            }, { transaction });

            // Remove new columns
            await queryInterface.removeColumn('visitors', 'firstName', { transaction });
            await queryInterface.removeColumn('visitors', 'lastName', { transaction });
            await queryInterface.removeColumn('visitors', 'description', { transaction });
            await queryInterface.removeColumn('visitors', 'wantsMembership', { transaction });
            await queryInterface.removeColumn('visitors', 'viewStatus', { transaction });
            await queryInterface.removeColumn('visitors', 'convertedToMemberId', { transaction });

            await transaction.commit();
            console.log('✅ Visitor table rollback completed');
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Rollback failed:', error);
            throw error;
        }
    }
};
