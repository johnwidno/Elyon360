const { sequelize } = require('./models');

async function fixColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const table = 'users';

  const columnsToAdd = [
    { name: 'coverPic', type: sequelize.Sequelize.TEXT },
    { name: 'education', type: sequelize.Sequelize.TEXT, defaultValue: '[]' },
    { name: 'bio', type: sequelize.Sequelize.TEXT },
    { name: 'spouseId', type: sequelize.Sequelize.INTEGER }
  ];

  for (const col of columnsToAdd) {
    try {
      await queryInterface.addColumn(table, col.name, {
        type: col.type,
        allowNull: true,
        defaultValue: col.defaultValue
      });
      console.log(`Column ${col.name} added successfully.`);
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding column ${col.name}:`, error.message);
      }
    }
  }

  process.exit();
}

fixColumns();
