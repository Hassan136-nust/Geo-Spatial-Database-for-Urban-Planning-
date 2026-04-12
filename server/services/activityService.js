import ActivityLog from '../models/ActivityLog.js';

/**
 * Log a user activity
 */
export async function logActivity(userId, action, resourceType = 'area', resourceId = null, metadata = {}, req = null) {
  try {
    await ActivityLog.create({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: req?.ip || req?.connection?.remoteAddress || '',
      user_agent: req?.headers?.['user-agent']?.substring(0, 200) || '',
    });
  } catch (err) {
    // Non-critical — don't crash the request
    console.error('[ActivityService] Log error:', err.message);
  }
}

export default { logActivity };
