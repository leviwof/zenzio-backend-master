import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../.env') });

async function checkMenusByRestaurant() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Get menu count by restaurant
    const menusByRestaurant = await dataSource.query(`
      SELECT 
        restaurant_uid,
        COUNT(*) as menu_count,
        SUM(CASE WHEN "isActive" = true THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN "isActive" = false THEN 1 ELSE 0 END) as inactive_count
      FROM restaurant_menus
      GROUP BY restaurant_uid
      ORDER BY menu_count DESC
    `);

    console.log('📊 Menus by Restaurant:');
    console.log('─'.repeat(80));
    menusByRestaurant.forEach((row: any) => {
      console.log(`Restaurant UID: ${row.restaurant_uid || 'NULL'}`);
      console.log(`  Total Menus: ${row.menu_count}`);
      console.log(`  Active: ${row.active_count}`);
      console.log(`  Inactive: ${row.inactive_count}`);
      console.log('─'.repeat(80));
    });

    // Get the restaurant with UID 'gyepy6gRES' (from the JWT token in logs)
    const targetRestaurantUid = 'gyepy6gRES';
    console.log(`\n🔍 Checking menus for restaurant: ${targetRestaurantUid}`);

    const targetMenus = await dataSource.query(
      `
      SELECT 
        id,
        menu_uid,
        menu_name,
        category,
        price,
        "isActive",
        status,
        "createdAt"
      FROM restaurant_menus
      WHERE restaurant_uid = $1
      ORDER BY "createdAt" DESC
    `,
      [targetRestaurantUid],
    );

    if (targetMenus.length === 0) {
      console.log(`❌ No menus found for restaurant ${targetRestaurantUid}`);
    } else {
      console.log(`✅ Found ${targetMenus.length} menus for restaurant ${targetRestaurantUid}:\n`);
      targetMenus.forEach((menu: any, index: number) => {
        console.log(`${index + 1}. ${menu.menu_name}`);
        console.log(`   UID: ${menu.menu_uid}`);
        console.log(`   Category: ${menu.category || 'N/A'}`);
        console.log(`   Price: ₹${menu.price}`);
        console.log(`   Active: ${menu.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Status: ${menu.status ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${menu.createdAt}`);
        console.log('');
      });
    }

    await dataSource.destroy();
    console.log('✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

checkMenusByRestaurant();
