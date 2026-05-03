const pool = require('../config/db');

/**
 * Creates a notification for a list of users or roles.
 * @param {Object} notification - { title, message, type, related_id }
 * @param {Array} roles - Roles to notify (e.g., ['ADMIN', 'HR_OFFICER'])
 */
const createNotificationForRoles = async (notification, roles) => {
  try {
    const { title, message, type, related_id } = notification;
    
    // Get all users with the specified roles
    const [users] = await pool.query(
      'SELECT id FROM users WHERE role IN (?) AND is_active = TRUE',
      [roles]
    );

    if (users.length === 0) return;

    // Insert notifications into DB
    const insertValues = users.map(user => [user.id, title, message, type, related_id]);
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES ?',
      [insertValues]
    );

    // Emit socket event to all connected admins/HRs
    const { io, connectedAdmins } = require('../index');
    if (io) {
      users.forEach(user => {
        const socketId = connectedAdmins.get(user.id.toString());
        if (socketId) {
          io.to(socketId).emit('notification_received', {
            title,
            message,
            type,
            related_id,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to create notifications:', err);
  }
};

module.exports = {
  createNotificationForRoles
};
