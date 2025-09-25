import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { MessageStatus } from '@/utils/messageUtils';

interface MessageStatusIconProps {
  status: MessageStatus;
  className?: string;
}

export function MessageStatusIcon({ status, className = "w-4 h-4" }: MessageStatusIconProps) {
  const { sent, delivered, read } = status;

  if (!sent) {
    return null; // Message not sent yet
  }

  if (read) {
    return (
      <CheckCheck 
        className={`${className} text-blue-500`} 
        title="Read"
      />
    );
  } else if (delivered) {
    return (
      <CheckCheck 
        className={`${className} text-gray-400`} 
        title="Delivered"
      />
    );
  } else {
    return (
      <Check 
        className={`${className} text-gray-400`} 
        title="Sent"
      />
    );
  }
}
