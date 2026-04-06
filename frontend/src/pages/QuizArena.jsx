import React, { useState } from 'react';
import { generateQuiz, submitQuiz } from '../api';
import { BrainCircuit, Check, X, RefreshCw } from 'lucide-react';

const QuizArena = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setQuizData(null);
    setResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const res = await generateQuiz(topic, difficulty);
      setQuizData(res.quiz);
    } catch (err) {
      alert("Failed to generate quiz. Check if your API Key is valid and backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, option) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleSubmit = async () => {
    // Format submitted answers
    const submittedArr = quizData.map((q, i) => ({
      answer: answers[i] || ""
    }));

    setLoading(true);
    try {
      const res = await submitQuiz(topic, difficulty, submittedArr, quizData);
      setResult(res);
    } catch (err) {
      alert("Failed to submit quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 className="heading-1" style={{ textAlign: 'center' }}>Quiz Results</h2>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: result.score >= 70 ? 'var(--accent-success)' : 'var(--accent-error)' }}>
            {Math.round(result.score)}%
          </div>
          <p className="text-soft">You got {result.correct_count} out of {result.total} correct.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {result.results.map((r, i) => (
            <div key={i} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: `1px solid ${r.is_correct ? 'var(--accent-success)' : 'var(--accent-error)'}` }}>
              <p style={{ fontWeight: 600, marginBottom: '12px' }}>{i + 1}. {r.question}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: r.is_correct ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                  Your answer: {r.submitted || "No answer"} {r.is_correct ? <Check size={16}/> : <X size={16} color="var(--accent-error)"/>}
                </div>
                {!r.is_correct && (
                  <div style={{ color: 'var(--accent-success)' }}>
                    Correct answer: {r.correct}
                  </div>
                )}
                <div className="text-soft" style={{ marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                  <strong>Explanation:</strong> {r.explanation}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn" onClick={() => {
          setResult(null);
          setQuizData(null);
          setAnswers({});
          setCurrentQuestionIndex(0);
        }} style={{ width: '100%', marginTop: '24px' }}>
          Take Another Quiz
        </button>
      </div>
    );
  }

  if (quizData) {
    const q = quizData[currentQuestionIndex];
    const i = currentQuestionIndex;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="heading-2">Topic: {topic}</h1>
          <span className="text-soft">Question {currentQuestionIndex + 1} of {quizData.length}</span>
        </div>

        <div className="glass-panel">
          <p style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1.1rem' }}>
            {i + 1}. {q.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {q.options.map((opt, optIdx) => (
              <div 
                key={optIdx} 
                onClick={() => handleOptionSelect(i, opt)}
                style={{ 
                  padding: '16px', 
                  background: answers[i] === opt ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${answers[i] === opt ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          {currentQuestionIndex === quizData.length - 1 ? (
             <button 
              className="btn" 
              onClick={handleSubmit} 
              disabled={loading || Object.keys(answers).length !== quizData.length}
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
             <button 
              className="btn" 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="heading-1">Quiz Arena</h1>
      <p className="text-soft mb-8">Generate an adaptive, intelligent quiz on any topic to test your knowledge.</p>

      <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="text-soft" style={{ display: 'block', marginBottom: '8px' }}>Topic to test</label>
            <input 
              type="text" 
              className="input-base" 
              placeholder="e.g., Photosynthesis, Newton's Laws" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-soft" style={{ display: 'block', marginBottom: '8px' }}>Difficulty</label>
            <select 
              className="input-base" 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={!topic.trim() || loading}
            style={{ padding: '14px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw className="animate-spin" size={18} /> Generating...
              </span>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizArena;
