import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../.env') });

async function activateAllMenus() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // For AWS RDS
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Update all menu items to be active
    const result = await dataSource.query(`
      UPDATE restaurant_menus 
      SET "isActive" = true, "status" = true 
      WHERE "isActive" = false OR "status" = false
    `);

    console.log(`✅ Updated ${result[1]} menu items to active status`);

    // Show summary
    const summary = await dataSource.query(`
      SELECT 
        COUNT(*) as total_menus,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_menus,
        SUM(CASE WHEN "isActive" = false THEN 1 ELSE 0 END) as inactive_menus
      FROM restaurant_menus
    `);

    console.log('\n📊 Menu Status Summary:');
    console.log(`   Total Menus: ${summary[0].total_menus}`);
    console.log(`   Active Menus: ${summary[0].active_menus}`);
    console.log(`   Inactive Menus: ${summary[0].inactive_menus}`);

    await dataSource.destroy();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

activateAllMenus();
