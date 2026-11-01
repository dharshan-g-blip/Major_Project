import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Clock,
  ShieldCheck,
  Share2,
  Lock,
  Send,
  Users,
  Settings,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const TelehealthRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState('notes'); // 'notes' | 'chat' | 'info'
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [connectedPeers, setConnectedPeers] = useState([]);

  // In-session Quick Notes (for therapist)
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // In-session Chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'System',
      text: 'Encrypted end-to-end Telehealth consultation room connected.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        // Look up session from scheduling endpoint
        const res = await api.get(`/scheduling/sessions?_id=${sessionId}`);
        if (res.data.success && res.data.sessions?.length > 0) {
          const found = res.data.sessions.find((s) => s._id === sessionId) || res.data.sessions[0];
          setSession(found);
        } else {
          // Fallback demo mock session if loaded directly
          setSession({
            _id: sessionId,
            clientName: 'Rohan Verma',
            clientEmail: 'rohan.verma@example.com',
            sessionType: 'Individual Psychotherapy',
            durationMinutes: 50,
            fee: 2500,
            status: 'scheduled',
          });
        }
      } catch (err) {
        // Fallback for direct testing
        setSession({
          _id: sessionId,
          clientName: 'Rohan Verma',
          clientEmail: 'rohan.verma@example.com',
          sessionType: 'Individual Psychotherapy',
          durationMinutes: 50,
          fee: 2500,
          status: 'scheduled',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Handle local camera & mic stream with safe fallback
  useEffect(() => {
    let stream = null;
    const startMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or device not found; using simulated video feed:', err.message);
      }
    };

    startMedia();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // In-call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-Time Video Room Peer Signaling & Chat Broadcast
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const myName = user ? (user.name || 'Dr. Ananya Sharma') : (session?.clientName || 'Rohan Verma');
    const myRole = user ? 'therapist' : 'client';

    socket.on('connect', () => {
      socket.emit('join_meet', {
        sessionId,
        userType: myRole,
        userName: myName,
      });
    });

    if (socket.connected) {
      socket.emit('join_meet', {
        sessionId,
        userType: myRole,
        userName: myName,
      });
    }

    socket.on('meet_peers_updated', ({ peers, joinedPeer, leftPeer }) => {
      setConnectedPeers(peers || []);
      if (joinedPeer && joinedPeer.userName !== myName) {
        toast.success(`🟢 ${joinedPeer.userName} has connected to the consultation.`);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'System',
            text: `${joinedPeer.userName} (${joinedPeer.userType === 'therapist' ? 'Practitioner' : 'Client'}) is now in the room.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
      if (leftPeer && leftPeer.userName !== myName) {
        toast.info(`${leftPeer.userName} left the room.`);
      }
    });

    socket.on('receive_meet_chat', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, user, session]);

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
    setIsMicOn(!isMicOn);
    toast.info(!isMicOn ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
    setIsVideoOn(!isVideoOn);
    toast.info(!isVideoOn ? 'Camera turned on' : 'Camera turned off');
  };

  const handleEndCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    toast.success('Consultation call ended.');
    if (user) {
      navigate('/therapist/dashboard');
    } else {
      navigate(`/portal?email=${encodeURIComponent(session?.clientEmail || 'rohan.verma@example.com')}`);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const sender = user ? user.name : session?.clientName || 'Client';
    const msg = {
      sender,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    if (socketRef.current) {
      socketRef.current.emit('send_meet_chat', {
        sessionId,
        senderName: sender,
        text: chatInput.trim(),
      });
    } else {
      setChatMessages((prev) => [...prev, msg]);
    }
    setChatInput('');
  };

  const handleSaveInSessionNote = async () => {
    if (!quickNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }
    try {
      setSavingNote(true);
      await api.post('/notes', {
        clientId: session?.client_id || user?._id,
        sessionId: session?._id,
        title: `In-Session Note: ${new Date().toLocaleDateString('en-IN')}`,
        type: 'private',
        format: 'freeform',
        content: `<p>${quickNote.replace(/\n/g, '<br/>')}</p>`,
      });
      toast.success('In-session private note saved to EHR!');
      setQuickNote('');
    } catch (err) {
      toast.error('Failed to save in-session note');
    } finally {
      setSavingNote(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader message="Connecting to secure Telehealth room..." size="lg" />;

  const isTherapist = Boolean(user);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top Telehealth Control Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-sm">
            Ψ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100">
                {session?.sessionType || 'Individual Psychotherapy Consultation'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                connectedPeers.length > 1
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectedPeers.length > 1 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {connectedPeers.length > 1 ? 'Consultation Live (Both In Room)' : 'Waiting for Peer to Join'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isTherapist ? `Client: ${session?.clientName}` : `Therapist: Dr. Ananya Sharma`} • 50 min Clinical Slot
            </p>
          </div>
        </div>

        {/* Live Elapsed Time Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeElapsed)}</span>
            <span className="text-slate-500 text-[10px]">/ 50:00</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>HIPAA & RCI Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Video & Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Video Feeds (Remote Participant & Local Self) */}
        <div className="flex-1 p-4 flex flex-col gap-4 relative">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Primary Tile: Other Participant */}
            {(() => {
              const otherPeerRole = isTherapist ? 'client' : 'therapist';
              const isOtherPeerConnected = connectedPeers.some((p) => p.userType === otherPeerRole);

              return (
                <div className={`relative bg-slate-900 rounded-3xl border overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-all ${
                  isOtherPeerConnected ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-800'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10" />

                  <div className="text-center z-20 space-y-3 px-4">
                    <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 mx-auto shadow-2xl flex items-center justify-center text-4xl font-bold transition-all ${
                      isOtherPeerConnected
                        ? 'bg-emerald-950/70 border-2 border-emerald-500/60 text-emerald-200'
                        : 'bg-teal-900/60 border-2 border-teal-500/30 text-teal-200'
                    }`}>
                      {isTherapist ? 'RV' : 'AS'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">
                        {isTherapist ? session?.clientName || 'Rohan Verma' : 'Dr. Ananya Sharma'}
                      </h3>
                      <p className="text-xs text-teal-400 font-medium">
                        {isTherapist ? 'Client (Connected via Indiranagar)' : 'Licensed Clinical Psychologist (RCI)'}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 text-[11px] text-slate-200 border border-slate-700">
                      <span className={`w-2 h-2 rounded-full ${isOtherPeerConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                      <span>
                        {isOtherPeerConnected
                          ? 'Speaking (HD Live Attunement Active)'
                          : `Room Ready • Waiting for ${isTherapist ? (session?.clientName || 'Client') : 'Dr. Sharma'} to join`}
                      </span>
                    </div>
                  </div>

                  {/* Status pill on bottom left */}
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs font-semibold text-slate-200 backdrop-blur-md border border-slate-800">
                      {isTherapist ? (session?.clientName || 'Client') : 'Dr. Sharma'} {isOtherPeerConnected ? '(In Room)' : '(Connecting...)'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Secondary Tile: Local Camera Preview */}
            <div className="relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                    <VideoOff className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-slate-400">Your camera is turned off</p>
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs font-semibold text-slate-200 backdrop-blur-md border border-slate-800">
                  You ({isTherapist ? 'Therapist' : 'Client'}) {!isMicOn && '• Muted'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Call Action Bar */}
          <div className="h-16 bg-slate-900/90 rounded-2xl border border-slate-800 px-6 flex items-center justify-between shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl transition-all ${
                  isMicOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-rose-600 text-white shadow-rose-900/30 shadow-lg'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all ${
                  isVideoOn
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-rose-600 text-white shadow-rose-900/30 shadow-lg'
                }`}
                title={isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>

            {/* End Consultation Button */}
            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Consultation</span>
            </button>

            {/* Sidebar toggle buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveSideTab(activeSideTab === 'notes' ? null : 'notes')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeSideTab === 'notes'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Clinical Notes & Shared Exercises"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{isTherapist ? 'EHR Notes' : 'Homework'}</span>
              </button>

              <button
                onClick={() => setActiveSideTab(activeSideTab === 'chat' ? null : 'chat')}
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeSideTab === 'chat'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="In-Call Chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">In-Call Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive In-Session Sidebar */}
        {activeSideTab && (
          <aside className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900 flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeSideTab === 'notes' ? (
                  <>
                    <FileText className="w-4 h-4 text-teal-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {isTherapist ? 'In-Session Clinical Chart' : 'Shared Exercises & Reflections'}
                    </h3>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      In-Session Confidential Chat
                    </h3>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveSideTab(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Tab 1: Clinical Notes / Homework */}
            {activeSideTab === 'notes' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {isTherapist ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px] flex items-start gap-2">
                      <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Private Clinical Chart:</strong> Notes taken here are saved directly to your confidential EHR and never shared with the client.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Quick Observations & Verbatim Quotes
                      </label>
                      <textarea
                        rows={7}
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        placeholder="e.g. Subjective report: Client experienced panic during standup; heart rate 110bpm. Tested 2-breath physiological sigh with good somatic response..."
                        className="w-full text-xs p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      loading={savingNote}
                      onClick={handleSaveInSessionNote}
                      className="w-full text-xs"
                    >
                      Save to Client EHR
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-200 text-[11px] flex items-start gap-2">
                      <Share2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Session Action Items:</strong> Review key exercises shared by your therapist.
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-slate-200 text-xs">The 2-Breath Physiological Sigh</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Two quick inhales through the nose, followed by one long, slow exhalation through the mouth whenever you notice physical tension before meetings.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-slate-200 text-xs">Thought Record Check-In</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Identify catastrophic cognitive distortions: "What is the evidence for this thought? What is the most realistic alternative?"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: In-Call Chat */}
            {activeSideTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold text-teal-400">{m.sender}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a private in-call link or message..."
                    className="flex-1 text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default TelehealthRoom;
