import React, { useState, useRef, useEffect } from 'react';
import { chatWithMentor } from '../api';
import { Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi there! I'm your AI Mentor. I can answer questions based on the materials you've uploaded. What would you like to learn today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'human', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithMentor(userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 0 20px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="heading-1" style={{ fontSize: '2rem' }}>Mentor Chat</h1>
        <p className="text-soft">Ask questions based on your uploaded knowledge base.</p>
      </div>

      <div className="chat-window">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ 
                minWidth: '36px', height: '36px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'ai' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'
              }}>
                {msg.role === 'ai' ? <Bot size={20} color="white" /> : <User size={20} color="white" />}
              </div>
              <div style={{ paddingTop: '8px' }}>
                {msg.content.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message ai" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-primary)'
              }}>
                <Bot size={20} color="white" />
              </div>
              <div className="text-soft">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <input
            type="text"
            className="input-base"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn" disabled={!input.trim() || loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
