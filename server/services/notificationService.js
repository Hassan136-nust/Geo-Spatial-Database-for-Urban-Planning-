import Notification from '../models/Notification.js';

/**
 * Create a notification for a user
 */
export async function notify(userId, title, message, options = {}) {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type: options.type || 'info',
      category: options.category || 'system_update',
      link: options.link || '',
      resource_id: options.resourceId || null,
    });
  } catch (err) {
    console.error('[NotificationService] Create error:', err.message);
  }
}

/**
 * Send a welcome notification to a new user
 */
export async function sendWelcome(userId) {
  await notify(userId, 'Welcome to UrbanPulse! 🌍', 'Start by searching for any city to analyze its urban infrastructure.', {
    type: 'success',
    category: 'welcome',
    link: '/dashboard',
  });
}

export default { notify, sendWelcome };
