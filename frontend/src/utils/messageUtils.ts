/**
 * Message utility functions for timestamps, status, and formatting
 */

export interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: Date | string): string {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else {
    // For older messages, show actual date
    return messageTime.toLocaleDateString();
  }
}

/**
 * Format timestamp for message display (shows time for today, date for older)
 */
export function formatMessageTime(timestamp: Date | string): string {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInDays = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    // Today - show time only
    return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // This week - show day name
    return messageTime.toLocaleDateString([], { weekday: 'short' });
  } else {
    // Older - show date
    return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Get message status based on timestamp and read status
 */
export function getMessageStatus(message: any, isOwnMessage: boolean): MessageStatus {
  if (!isOwnMessage) {
    return { sent: true, delivered: true, read: message.read || false };
  }

  const now = new Date();
  const messageTime = new Date(message.timestamp);
  const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

  return {
    sent: true,
    delivered: diffInSeconds > 5, // Assume delivered after 5 seconds
    read: message.read || false
  };
}

/**
 * Generate a unique ID for temporary messages
 */
export function generateTempMessageId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a message is a temporary message (not yet saved to database)
 */
export function isTempMessage(messageId: string): boolean {
  return messageId.startsWith('temp_');
}

/**
 * Format unread count for display
 */
export function formatUnreadCount(count: number): string {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}
