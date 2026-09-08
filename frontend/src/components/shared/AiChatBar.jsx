import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat.api';
import useAuthStore from '../../store/authStore';

const SUGGESTED = {
  super_admin: [
    'How many employees do we have by role?',
    'How many are present today?',
    'How many leave approvals are pending?',
    'How many open job positions do we have?',
  ],
  manager: [
    'Who is present in my team today?',
    'How many leave requests are pending from my team?',
    'What is my team project status?',
    'List all my team members',
  ],
  hr: [
    'What is the total headcount by role?',
    'How many candidates are shortlisted?',
    'How many employees have pending onboarding?',
    'What are the open positions right now?',
  ],
  default: [
    'How many leave days do I have left?',
    'What are the current open job positions?',
    'When is the next holiday?',
    'Show my latest payslip details',
  ],
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  );
}

export default function AiChatBar() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const suggestions = SUGGESTED[user?.role] || SUGGESTED.default;

  const [expanded, setExpanded] = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState([]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (expanded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded, loading]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [expanded]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  };

  const sendMessage = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    if (!expanded) setExpanded(true);

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    resetTextareaHeight();
    setLoading(true);

    try {
      const res = await chatApi.ask(q);
      const { answer, navigateTo } = res.data.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: answer,
        navigateTo: navigateTo || null,
      }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${msg}`, error: true }]);
    } finally {
      setLoading(false);
      // Don't force-focus input — user may be clicking the navigate arrow
    }
  }, [input, loading, expanded]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      setExpanded(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setExpanded(false);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white">

      {/* ── Message history ─────────────────────────────────────────────────── */}
      {expanded && hasMessages && (
        <div className="px-6 py-3 overflow-y-auto bg-[#F5F6FA]"
          style={{ maxHeight: '320px', scrollbarWidth: 'thin' }}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                }`}>
                  {msg.role === 'user' ? (user?.firstName?.[0] || 'U').toUpperCase() : '✦'}
                </div>

                {/* Bubble + navigate arrow */}
                <div className="flex items-end gap-2 max-w-[75%]">
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : msg.error
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Navigate arrow — only on AI responses with a page link */}
                  {msg.role === 'assistant' && msg.navigateTo && !msg.error && (
                    <button
                      onMouseDown={(e) => {
                        // Use onMouseDown instead of onClick to fire BEFORE blur/focus events
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(msg.navigateTo);
                      }}
                      title="Go to related page →"
                      className="shrink-0 w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 flex items-center justify-center transition-all mb-0.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">✦</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── Suggested questions — ALWAYS shown when expanded ──────────────── */}
      {expanded && !loading && (
        <div className="px-6 pt-2.5 pb-1 bg-[#F5F6FA] border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Quick questions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-xs bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium shadow-sm disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom input bar ────────────────────────────────────────────────── */}
      <div className="px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-2.5 transition-all ${
            expanded
              ? 'border-blue-400 shadow-md ring-1 ring-blue-200'
              : 'border-gray-300 shadow-sm hover:border-blue-300'
          }`}>
            {/* AI icon */}
            <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">✦</span>
            </div>

            {/* Input */}
            <textarea
              ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (!expanded && e.target.value.length > 0) setExpanded(true);
                // Auto-resize
                e.target.style.height = '24px';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
              onFocus={() => setExpanded(true)}
              onKeyDown={handleKey}
              placeholder="Ask Saven AI anything about your HR data..."
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: '96px', minHeight: '24px', height: '24px' }}
            />

            {/* Right side actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {hasMessages && (
                <button onClick={clearChat} title="Clear conversation"
                  className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {expanded && (
                <button onClick={() => setExpanded(false)} title="Collapse"
                  className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-300 text-center mt-1.5">
            Saven AI · Answers from your real HR data · {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
}
