import React, { useState, useRef, useEffect } from 'react';
import { contentAPI, quizAPI } from '../../api';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react';
import './AIChatSection.css';

const AIChatSection = ({ classroomId }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your subject-specific AI Tutor. I've studied all the materials your professor uploaded for this classroom. What can I explain for you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await contentAPI.chat(input, classroomId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble retrieving that from the course materials." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuizMode(true);
    setQuizResult(null);
    setUserAnswers({});
    try {
      const data = await quizAPI.generate("Course Subject", classroomId, 'medium');
      setQuizData(data.quiz);
    } catch (err) {
      alert('Quiz generation failed.');
      setQuizMode(false);
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="ai-chat-section">
      <div className="chat-header">
        <Bot size={24} color="#4facfe" />
        <h3>AI Academic Tutor</h3>
      </div>

      <div className="chat-layout" style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <div className="chat-interface" style={{ flex: quizMode ? '1' : '1.5', display: 'flex', flexDirection: 'column' }}>
          <div className="messages-container">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <span>Curating response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input-area">
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="Ask your tutor anything about the course..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="chat-input"
                disabled={loading}
              />
              <button type="submit" disabled={!input.trim() || loading} className="send-btn">
                {loading ? <Loader2 className="spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
            {!quizMode && !loading && messages.length > 1 && (
              <div style={{ marginTop: '15px' }}>
                 <button onClick={handleGenerateQuiz} className="btn-text" style={{ fontSize: '0.85rem', color: '#4facfe', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} /> Knowledge Check: Generate Quiz
                 </button>
              </div>
            )}
          </form>
        </div>

        {quizMode && (
          <div className="quiz-interface" style={{ flex: '1', borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', overflowY: 'auto', padding: '20px' }}>
            <div className="quiz-header" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BrainCircuit size={18} color="#4facfe" /> Mastery Quiz</h4>
              <button onClick={() => setQuizMode(false)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Exit</button>
            </div>
            
            {quizLoading ? (
              <div className="empty-chat">
                <Loader2 size={32} className="spin" color="#4facfe" />
                <p>Generating questions...</p>
              </div>
            ) : quizData ? (
              <div className="quiz-content">
                 {!quizResult ? (
                   <>
                      {quizData.map((q, idx) => (
                         <div key={idx} style={{ marginBottom: '25px' }}>
                            <p style={{ fontWeight: 600, marginBottom: '15px' }}>{idx+1}. {q.question}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                               {q.options.map(opt => (
                                 <button 
                                   key={opt}
                                   onClick={() => setUserAnswers({...userAnswers, [idx]: opt})}
                                   className={`option-btn ${userAnswers[idx] === opt ? 'selected' : ''}`}
                                   style={{ padding: '12px', borderRadius: '10px', background: userAnswers[idx] === opt ? 'rgba(79, 172, 254, 0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: userAnswers[idx] === opt ? '#4facfe' : 'rgba(255,255,255,0.1)', color: userAnswers[idx] === opt ? '#fff' : '#94a3b8', textAlign: 'left', cursor: 'pointer' }}
                                 >
                                   {opt}
                                 </button>
                               ))}
                            </div>
                         </div>
                      ))}
                      <button 
                        onClick={() => {
                          const formatted = quizData.map((q, i) => ({ answer: userAnswers[i] || '' }));
                          quizAPI.submit("Subject Quiz", classroomId, "medium", formatted, quizData).then(setQuizResult);
                        }} 
                        className="auth-button"
                        disabled={Object.keys(userAnswers).length < quizData.length}
                      >
                        Submit Quiz
                      </button>
                   </>
                 ) : (
                   <div className="quiz-results">
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '15px', marginBottom: '25px', textAlign: 'center' }}>
                         <h4 style={{ fontSize: '2rem', color: '#22c55e' }}>{quizResult.score}%</h4>
                         <p style={{ color: '#94a3b8' }}>Mastery Updated</p>
                      </div>
                      <button onClick={() => setQuizMode(false)} className="auth-button">Finish Review</button>
                   </div>
                 )}
              </div>
            ) : (
              <div className="empty-chat">
                 <p>No quiz data available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatSection;
