const { sequelize } = require('../config/database');
const { User, Category, Thread, Post } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Performance Test Data Seeder
 * Creates large dataset for performance testing
 */

async function seedLargeDataset() {
  console.log('🌱 Starting large dataset seeding for performance testing...\n');

  try {
    // Start transaction
    await sequelize.transaction(async (t) => {
      
      // 1. Create test users (100 users)
      console.log('Creating 100 test users...');
      const users = [];
      const hashedPassword = await bcrypt.hash('Test123!', 10);
      
      for (let i = 1; i <= 100; i++) {
        users.push({
          username: `testuser${i}`,
          email: `testuser${i}@test.com`,
          password: hashedPassword,
          displayName: `Test User ${i}`,
          role: 'user',
          isActive: true,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
          updatedAt: new Date()
        });
      }
      
      await User.bulkCreate(users, { transaction: t });
      console.log('✓ Created 100 test users\n');

      // Get all categories
      const categories = await Category.findAll({ transaction: t });
      if (categories.length === 0) {
        throw new Error('No categories found. Please seed categories first.');
      }
      console.log(`Found ${categories.length} categories\n`);

      // Get all users
      const allUsers = await User.findAll({ transaction: t });
      console.log(`Found ${allUsers.length} total users\n`);

      // 2. Create threads (500 threads)
      console.log('Creating 500 test threads...');
      const threads = [];
      
      for (let i = 1; i <= 500; i++) {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Random date in last 60 days
        
        threads.push({
          categoryId: randomCategory.id,
          userId: randomUser.id,
          title: `Performance Test Thread ${i}: ${generateRandomTitle()}`,
          slug: `perf-test-thread-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: generateRandomContent(),
          viewCount: Math.floor(Math.random() * 1000),
          isPinned: false,
          isLocked: false,
          createdAt: createdAt,
          updatedAt: createdAt
        });
      }
      
      await Thread.bulkCreate(threads, { transaction: t });
      console.log('✓ Created 500 test threads\n');

      // Get all threads
      const allThreads = await Thread.findAll({ transaction: t });

      // 3. Create posts (2000 posts - 4 posts per thread on average)
      console.log('Creating 2000 test posts...');
      const posts = [];
      
      for (let i = 1; i <= 2000; i++) {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomThread = allThreads[Math.floor(Math.random() * allThreads.length)];
        const createdAt = new Date(randomThread.createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        posts.push({
          threadId: randomThread.id,
          userId: randomUser.id,
          content: generateRandomPostContent(),
          isFirstPost: false,
          createdAt: createdAt,
          updatedAt: createdAt
        });
      }
      
      await Post.bulkCreate(posts, { transaction: t });
      console.log('✓ Created 2000 test posts\n');

      // Update thread post counts and updated times
      console.log('Updating thread statistics...');
      
      for (const thread of allThreads) {
        const postCount = await Post.count({
          where: { threadId: thread.id },
          transaction: t
        });
        
        const latestPost = await Post.findOne({
          where: { threadId: thread.id },
          order: [['createdAt', 'DESC']],
          transaction: t
        });
        
        await thread.update({
          postCount: postCount,
          updatedAt: latestPost ? latestPost.createdAt : thread.createdAt
        }, { transaction: t });
      }
      
      console.log('✓ Updated thread statistics\n');
    });

    // Summary
    const totalUsers = await User.count();
    const totalThreads = await Thread.count();
    const totalPosts = await Post.count();

    console.log('========================================');
    console.log('✅ Seeding completed successfully!');
    console.log('========================================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Threads: ${totalThreads}`);
    console.log(`Total Posts: ${totalPosts}`);
    console.log('========================================\n');

    console.log('Performance testing dataset is ready!');
    console.log('You can now run performance tests with:');
    console.log('  ./tests/performance/performance-test.sh\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Helper function to generate random titles
function generateRandomTitle() {
  const topics = [
    'Discussion about modern web development',
    'Best practices for database optimization',
    'How to improve application performance',
    'Understanding microservices architecture',
    'Tips for writing clean code',
    'Exploring new JavaScript frameworks',
    'Database indexing strategies',
    'Caching techniques for web applications',
    'Security best practices',
    'DevOps automation tools',
    'Container orchestration with Kubernetes',
    'API design principles',
    'Frontend optimization techniques',
    'Backend scalability patterns',
    'Testing strategies for large applications'
  ];
  
  return topics[Math.floor(Math.random() * topics.length)];
}

// Helper function to generate random content
function generateRandomContent() {
  const paragraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.'
  ];
  
  const numParagraphs = 2 + Math.floor(Math.random() * 4);
  let content = '';
  
  for (let i = 0; i < numParagraphs; i++) {
    content += paragraphs[Math.floor(Math.random() * paragraphs.length)] + '\n\n';
  }
  
  return content.trim();
}

// Helper function to generate random post content
function generateRandomPostContent() {
  const responses = [
    'Great point! I completely agree with your perspective on this.',
    'Thanks for sharing this information. Very helpful!',
    'I have a different opinion on this matter. Here\'s why...',
    'Can you provide more details about this approach?',
    'This is exactly what I was looking for. Thank you!',
    'Interesting discussion. I would like to add that...',
    'I experienced something similar. Here\'s my take...',
    'Could you elaborate more on this specific point?',
    'This helped me solve my problem. Appreciate it!',
    'I think there might be a better way to approach this.'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Run if called directly
if (require.main === module) {
  seedLargeDataset()
    .then(() => {
      console.log('Seeding complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedLargeDataset };
