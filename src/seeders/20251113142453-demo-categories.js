'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Announcements',
        description: 'Important announcements and updates from the Educard team',
        slug: 'announcements',
        display_order: 0,
        created_at: new Date()
      },
      {
        name: 'General Discussion',
        description: 'General topics and conversations about education and learning',
        slug: 'general-discussion',
        display_order: 1,
        created_at: new Date()
      },
      {
        name: 'Questions & Answers',
        description: 'Ask questions and get help from the community',
        slug: 'questions-answers',
        display_order: 2,
        created_at: new Date()
      },
      {
        name: 'Study Groups',
        description: 'Find and organize study groups with other learners',
        slug: 'study-groups',
        display_order: 3,
        created_at: new Date()
      },
      {
        name: 'Resources',
        description: 'Share and discover educational resources and materials',
        slug: 'resources',
        display_order: 4,
        created_at: new Date()
      },
      {
        name: 'Off-Topic',
        description: 'Casual conversations and topics unrelated to education',
        slug: 'off-topic',
        display_order: 5,
        created_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
