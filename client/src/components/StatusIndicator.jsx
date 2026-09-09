import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';

export default function StatusIndicator({ status, size = 15 }) {
  if (status === 'read') {
    return <CheckCheck size={size} className="tick-read" style={{ color: 'var(--tick-read)' }} />;
  }

  if (status === 'delivered') {
    return <CheckCheck size={size} className="tick-sent" style={{ color: 'var(--tick-sent)' }} />;
  }

  if (status === 'sent') {
    return <Check size={size} className="tick-sent" style={{ color: 'var(--tick-sent)' }} />;
  }

  return <Clock size={size} style={{ color: 'var(--text-muted)' }} />;
}
