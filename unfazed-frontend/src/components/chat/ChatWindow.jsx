import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, MessageSquare, Shield, Smile } from 'lucide-react';
import MessageBubble from './MessageBubble';

export const ChatWindow = ({ roomId, userType, userName, userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Single-Port Architecture: Connect Socket.io to the exact current origin!
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const join = () => {
      socket.emit('join_room', {
        roomId,
        userType,
        userName,
      });
    };

    socket.on('connect', () => {
      setSocketConnected(true);
      join();
    });

    if (socket.connected) {
      setSocketConnected(true);
      join();
    }

    socket.on('load_history', (history) => {
      setMessages(history || []);
    });

    socket.on('receive_message', (msg) => {
      if (msg.roomId && msg.roomId !== roomId) return;
      setMessages((prev) => {
        const idToCheck = msg._id || msg.id;
        if (idToCheck && prev.some((m) => (m._id || m.id) === idToCheck)) {
          return prev;
        }
        return [...prev, msg];
      });

      // Mark read if it's from the other person
      if (msg.senderType !== userType) {
        socket.emit('mark_read', { roomId, readerType: userType });
      }
    });

    socket.on('user_typing', ({ senderName }) => {
      setTypingUser(senderName);
    });

    socket.on('user_stop_typing', () => {
      setTypingUser('');
    });

    socket.on('messages_read', ({ readerType }) => {
      setMessages((prev) =>
        prev.map((m) => (m.senderType !== readerType ? { ...m, read: true } : m))
      );
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, userType, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    if (socketRef.current && socketConnected) {
      socketRef.current.emit('typing_start', { roomId, senderName: userName });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing_stop', { roomId });
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      roomId,
      senderId: userId || 'user_1',
      senderName: userName,
      senderType: userType, // 'therapist' | 'client'
      text: inputVal.trim(),
    });

    socketRef.current.emit('typing_stop', { roomId });
    setInputVal('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs">Secure Practice Messaging</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{socketConnected ? 'Encrypted Channel Live' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 font-medium">
          <Shield className="w-3 h-3 text-teal-700" />
          <span>Confidential</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No messages yet in this conversation</p>
            <p className="text-[11px] max-w-xs mt-1">
              Share session logistics, homework questions, or scheduling updates in real time.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.senderType === userType}
            />
          ))
        )}

        {typingUser && (
          <div className="text-[11px] text-slate-500 italic px-2 animate-pulse flex items-center gap-1">
            <span>{typingUser} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          placeholder="Type a confidential message..."
          className="flex-1 text-xs py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || !socketConnected}
          className="p-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
