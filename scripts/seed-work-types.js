const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Update if your backend runs on a different port

const workTypes = [
    {
        name: 'Fulltime: 1st Shift',
        start_time: '06:30:00',
        end_time: '15:00:00',
        break_start_time: '12:00:00',
        break_end_time: '12:30:00',
        is_active: true,
    },
    {
        name: 'Fulltime: 2nd Shift',
        start_time: '15:00:00',
        end_time: '22:00:00',
        break_start_time: '18:00:00',
        break_end_time: '18:30:00',
        is_active: true,
    },
    {
        name: 'General Fulltime',
        start_time: '09:00:00',
        end_time: '17:30:00',
        break_start_time: '13:00:00',
        break_end_time: '14:00:00',
        is_active: true,
    },
    {
        name: 'Partime: 5.30pm to 10.00pm',
        start_time: '17:30:00',
        end_time: '22:00:00',
        break_start_time: null,
        break_end_time: null,
        is_active: true,
    },
    {
        name: 'Partime: 6.00pm to 10.00pm',
        start_time: '18:00:00',
        end_time: '22:00:00',
        break_start_time: null,
        break_end_time: null,
        is_active: true,
    },
    {
        name: 'Weekend Fulltime',
        start_time: '06:30:00',
        end_time: '22:00:00',
        break_start_time: '12:00:00',
        break_end_time: '13:00:00',
        is_active: true,
    },
];

async function seedWorkTypes() {
    console.log('🌱 Starting work types seeding...\n');

    for (const workType of workTypes) {
        try {
            const response = await axios.post(`${BASE_URL}/work-types`, workType);
            console.log(`✅ Created: ${workType.name}`);
            console.log(`   UID: ${response.data.work_type_uid}`);
            console.log(`   Time: ${workType.start_time} - ${workType.end_time}\n`);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                console.log(`⚠️  Skipped (already exists): ${workType.name}\n`);
            } else {
                console.error(`❌ Failed to create: ${workType.name}`);
                console.error(`   Error: ${error.response?.data?.message || error.message}\n`);
            }
        }
    }

    console.log('✨ Work types seeding completed!');
}

// Run the seeder
seedWorkTypes().catch((error) => {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
});
