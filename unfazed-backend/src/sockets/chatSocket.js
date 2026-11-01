/**
 * Real-Time Socket.io Chat & Telehealth Handlers
 * Supports persistent therapist-client messaging, typing indicators, read receipts,
 * and live video room peer signaling.
 */
const ChatMessage = require('../models/ChatMessage');

const activePeersByRoom = new Map();

const initChatSocket = (io) => {
  io.on('connection', (socket) => {
    // -------------------------------------------------------------
    // 1. PRACTICE CHAT MESSAGING (DOCTOR <-> CLIENT)
    // -------------------------------------------------------------
    socket.on('join_room', async ({ roomId, userType, userName }) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`[Socket.io Chat] ${userName} (${userType}) joined room: ${roomId}`);

      try {
        // Load persistent chat history from MongoDB
        const history = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(100);
        socket.emit('load_history', history);
      } catch (err) {
        console.error('[Socket.io Chat] Error loading history:', err.message);
      }
    });

    socket.on('send_message', async (data) => {
      const { roomId, senderId, senderName, senderType, text } = data;
      if (!roomId || !text) return;

      try {
        // Persist message in database
        const messageObj = await ChatMessage.create({
          roomId,
          senderId: senderId || (senderType === 'therapist' ? 'therapist' : 'client'),
          senderName: senderName || (senderType === 'therapist' ? 'Dr. Sharma' : 'Client'),
          senderType, // 'therapist' | 'client'
          text: text.trim(),
          read: false,
        });

        // Broadcast to all sockets in the room (both doctor and client)
        io.to(roomId).emit('receive_message', messageObj);
        console.log(`[Socket.io Chat] Message in ${roomId} from ${senderName}: ${text}`);
      } catch (err) {
        console.error('[Socket.io Chat] Error saving message:', err.message);
      }
    });

    socket.on('typing_start', ({ roomId, senderName }) => {
      if (roomId) socket.to(roomId).emit('user_typing', { senderName });
    });

    socket.on('typing_stop', ({ roomId }) => {
      if (roomId) socket.to(roomId).emit('user_stop_typing');
    });

    socket.on('mark_read', async ({ roomId, readerType }) => {
      if (!roomId) return;
      try {
        await ChatMessage.updateMany(
          { roomId, senderType: { $ne: readerType }, read: false },
          { $set: { read: true } }
        );
        io.to(roomId).emit('messages_read', { readerType, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('[Socket.io Chat] Error marking read:', err.message);
      }
    });

    // -------------------------------------------------------------
    // 2. LIVE TELEHEALTH VIDEO ROOM SIGNALING (DOCTOR <-> CLIENT)
    // -------------------------------------------------------------
    socket.on('join_meet', ({ sessionId, userType, userName }) => {
      if (!sessionId) return;
      const roomKey = `meet_${sessionId}`;
      socket.join(roomKey);

      if (!activePeersByRoom.has(roomKey)) {
        activePeersByRoom.set(roomKey, new Map());
      }
      activePeersByRoom.get(roomKey).set(socket.id, { userType, userName });

      const peersList = Array.from(activePeersByRoom.get(roomKey).values());
      console.log(`[Socket.io Meet] ${userName} (${userType}) joined ${roomKey}. Active peers: ${peersList.length}`);

      // Notify all participants in this meeting room with updated participant list
      io.to(roomKey).emit('meet_peers_updated', {
        peers: peersList,
        joinedPeer: { userType, userName },
      });
    });

    socket.on('send_meet_chat', ({ sessionId, senderName, text }) => {
      if (!sessionId || !text) return;
      const roomKey = `meet_${sessionId}`;
      const chatItem = {
        sender: senderName,
        text: text.trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      io.to(roomKey).emit('receive_meet_chat', chatItem);
    });

    socket.on('disconnect', () => {
      // Clean up any meet rooms
      for (const [roomKey, peersMap] of activePeersByRoom.entries()) {
        if (peersMap.has(socket.id)) {
          const departing = peersMap.get(socket.id);
          peersMap.delete(socket.id);
          const peersList = Array.from(peersMap.values());
          io.to(roomKey).emit('meet_peers_updated', {
            peers: peersList,
            leftPeer: departing,
          });
        }
      }
    });
  });
};

module.exports = initChatSocket;
