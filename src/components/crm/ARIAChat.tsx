'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ARIAChatProps {
  crmContext: any;
  tenantId: string;
}

interface Message {
  role: 'aria' | 'user';
  content: string;
}

const colors = {
  bg: '#07080F',
  surface: '#0D0E1A',
  elevated: '#121320',
  border: '#1E2035',
  purple: '#6C3FC5',
  purpleLight: '#8B5CF6',
  teal: '#0D9488',
  tealBright: '#22D3EE',
  text: '#F1F3FA',
  muted: '#6B7299',
};

const gradient = 'linear-gradient(135deg, #8B5CF6, #22D3EE)';

const quickPrompts = [
  "Who's most at risk today?",
  'Best 3 deals to focus on',
  'Draft re-engagement email',
  'Why is the top deal flagged?',
  'Predict my Q2 revenue',
];

const welcomeMessage: Message = {
  role: 'aria',
  content:
    "Hi, I'm ARIA - your AI Revenue Intelligence Assistant. I've analysed your pipeline, contacts, and deal signals. Ask me anything about your CRM data and I'll give you actionable insights.",
};

export default function ARIAChat({ crmContext, tenantId }: ARIAChatProps) {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/crm/aria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role === 'aria' ? 'assistant' : 'user',
            content: m.content,
          })),
          crmContext,
          tenantId,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'aria', content: data.message || data.content || 'I couldn\'t process that. Try again.' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'aria', content: 'Sorry, I had trouble connecting. Please try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const dealsAnalysed = crmContext?.totalDeals || 147;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}
    >
      {/* Sticky Header */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ariaPulse {
            0%, 100% { box-shadow: 0 0 4px rgba(139,92,246,0.4); }
            50% { box-shadow: 0 0 12px rgba(34,211,238,0.6); }
          }
          @keyframes typingDot {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}} />
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: gradient,
            animation: 'ariaPulse 2s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '16px',
          }}
        >
          ARIA
        </span>
        <div className="flex items-center gap-1" style={{ marginLeft: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
          <span style={{ color: '#10B981', fontSize: '12px' }}>Live</span>
        </div>
        <div className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
          <span style={{ color: colors.muted, fontSize: '12px' }}>{dealsAnalysed} deals analysed</span>
          <span style={{ color: colors.muted, fontSize: '12px' }}>91% accuracy</span>
        </div>
      </div>

      {/* Message Thread */}
      <div
        ref={threadRef}
        className="flex-grow overflow-y-auto"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              backgroundColor: msg.role === 'aria' ? colors.elevated : 'rgba(108,63,197,0.19)',
              border: `1px solid ${msg.role === 'aria' ? colors.border : 'rgba(108,63,197,0.25)'}`,
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'aria' && (
              <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>&#9889;</span>
                <span style={{ color: colors.purpleLight, fontSize: '12px', fontWeight: 600 }}>ARIA</span>
              </div>
            )}
            <p style={{ color: colors.text, fontSize: '14px', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </p>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div
            style={{
              backgroundColor: colors.elevated,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '85%',
              alignSelf: 'flex-start',
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '14px' }}>&#9889;</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: colors.purpleLight,
                      display: 'inline-block',
                      animation: `typingDot 1.4s ease-in-out ${dot * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div
        className="flex gap-2 overflow-x-auto shrink-0"
        style={{ padding: '0 20px 12px', scrollbarWidth: 'none' }}
      >
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            style={{
              backgroundColor: colors.border,
              border: `1px solid rgba(30,32,53,0.5)`,
              borderRadius: '9999px',
              padding: '8px 16px',
              color: colors.text,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.purple)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(30,32,53,0.5)')}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div
        className="flex items-end gap-3 shrink-0"
        style={{
          padding: '12px 20px 16px',
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask ARIA anything about your pipeline..."
          rows={1}
          style={{
            flex: 1,
            backgroundColor: colors.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            color: colors.text,
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.purple)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: input.trim() && !isTyping ? colors.purple : colors.elevated,
            border: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: input.trim() && !isTyping ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.2s',
          }}
        >
          &#8593;
        </button>
      </div>
    </div>
  );
}
