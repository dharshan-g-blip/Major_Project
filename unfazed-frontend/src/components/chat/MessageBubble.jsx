import React from 'react';
import { CheckCheck, Check } from 'lucide-react';

export const MessageBubble = ({ message, isMe }) => {
  const rawDate = message.timestamp || message.createdAt;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const timeFormatted = !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <div className={`flex flex-col mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <span className="text-[10px] font-semibold text-slate-500">
          {message.senderName || (isMe ? 'You' : 'Participant')}
        </span>
        <span className="text-[10px] text-slate-400">{timeFormatted}</span>
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
          isMe
            ? 'bg-teal-800 text-white rounded-tr-none'
            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>

      {isMe && (
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 px-1">
          {message.read ? (
            <CheckCheck className="w-3 h-3 text-emerald-600" />
          ) : (
            <Check className="w-3 h-3 text-slate-400" />
          )}
          <span className="text-[9px]">{message.read ? 'Read' : 'Delivered'}</span>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
