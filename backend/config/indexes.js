const mongoose = require('mongoose');

/**
 * Create indexes for optimizing common queries.
 * Called once on server startup after DB connection.
 */
const createIndexes = async () => {
  try {
    const db = mongoose.connection;

    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ name: 'text', email: 'text' });

    // Team indexes
    await db.collection('teams').createIndex({ leader: 1 });
    await db.collection('teams').createIndex({ name: 'text', description: 'text' });

    // TeamMember indexes (compound unique already in schema)
    await db.collection('teammembers').createIndex({ user: 1 });
    await db.collection('teammembers').createIndex({ team: 1 });

    // Task indexes
    await db.collection('tasks').createIndex({ team: 1, status: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1, status: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1, deadline: 1 });
    await db.collection('tasks').createIndex({ createdBy: 1 });
    await db.collection('tasks').createIndex({ priority: 1 });
    await db.collection('tasks').createIndex({ deadline: 1 });
    await db.collection('tasks').createIndex({ title: 'text', description: 'text' });

    // Comment indexes
    await db.collection('comments').createIndex({ task: 1, createdAt: -1 });
    await db.collection('comments').createIndex({ user: 1 });

    // ActivityLog indexes
    await db.collection('activitylogs').createIndex({ user: 1, createdAt: -1 });
    await db.collection('activitylogs').createIndex({ team: 1, createdAt: -1 });
    await db.collection('activitylogs').createIndex({ task: 1 });
    await db.collection('activitylogs').createIndex({ createdAt: -1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Index creation error:', error.message);
  }
};

module.exports = createIndexes;
