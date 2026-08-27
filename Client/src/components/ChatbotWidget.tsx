import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import type { ChatMessage } from '../types';
import { Bot, Send, X, Sparkles } from 'lucide-react';

interface ChatbotWidgetProps {
  onNavigateTab: (tab: string) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your AI Copilot ERP Assistant. How can I help you analyze sales, inventory, or orders today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: '📑 Check Sales Invoices', targetTab: 'invoices' },
        { label: '📦 Low Stock Alert', targetTab: 'inventory' }
      ]
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await apiService.askChatbot(userText);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: response.quickActions
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an issue fetching AI response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-trigger-btn"
        >
          <Sparkles size={20} />
          <span>Ask Copilot AI</span>
          <span className="pulse-ring"></span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>ERP Copilot AI</h4>
                <span style={{ fontSize: '0.7rem', color: '#10b981' }}>● Online & Ready</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="erp-icon-btn"><X size={18} /></button>
          </div>

          <div className="chatbot-body">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble-wrap ${msg.sender}`}>
                <div className={`chat-bubble ${msg.sender}`}>
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>{msg.text}</div>
                  <span className="chat-time">{msg.timestamp}</span>

                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="chat-quick-actions">
                      {msg.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => onNavigateTab(action.targetTab)}
                          className="chat-action-pill"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-wrap bot">
                <div className="chat-bubble bot">
                  <span className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="chatbot-footer">
            <input
              type="text"
              placeholder="Ask about invoices, stock, sales..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="erp-input"
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="erp-btn erp-btn-primary" disabled={loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
