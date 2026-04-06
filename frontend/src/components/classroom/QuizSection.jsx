import React, { useState } from 'react';
import { quizAPI } from '../../api';
import { 
  Play, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  RotateCcw, 
  BrainCircuit,
  Settings2,
  ChevronRight,
  TrendingUp,
  FileQuestion
} from 'lucide-react';
import './QuizSection.css';

const QuizSection = ({ classroomId }) => {
  const [config, setConfig] = useState({
    topic: '',
    difficulty: 'medium',
    num_questions: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [result, setResult] = useState(null);

  const startQuiz = async (e) => {
    e.preventDefault();
    if (!config.topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await quizAPI.generate(
        config.topic, 
        classroomId, 
        config.difficulty, 
        config.num_questions
      );
      
      if (data.error === 'TOPIC_NOT_FOUND') {
        setError("❌ No content found for this topic in the classroom notes. Try a topic from the uploaded materials.");
      } else {
        setQuizData(data.quiz);
        setCurrentAnswers({});
      }
    } catch (err) {
      setError("Failed to reach the AI Mentor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, option) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const submitQuiz = async () => {
    if (Object.keys(currentAnswers).length < quizData.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    try {
      const submission = quizData.map((q, idx) => ({
        answer: currentAnswers[idx]
      }));
      
      const res = await quizAPI.submit(
        config.topic,
        classroomId,
        config.difficulty,
        submission,
        quizData
      );
      setResult(res);
    } catch (err) {
      setError("Failed to submit quiz results.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuizData(null);
    setResult(null);
    setError(null);
    setCurrentAnswers({});
  };

  if (result) {
    return (
      <div className="quiz-container result-view animate-fade-in">
        <div className="result-header">
          <div className="score-circle">
            <span className="score-num">{Math.round(result.score)}%</span>
            <span className="score-label">Final Score</span>
          </div>
          <h2>Great effort!</h2>
          <p>You completed the <strong>{config.topic}</strong> challenge.</p>
        </div>

        <div className="result-stats">
          <div className="stat-card">
            <CheckCircle2 color="#22c55e" />
            <div>
              <div className="val">{result.correct_count} / {result.total}</div>
              <div className="lab">Correct</div>
            </div>
          </div>
          <div className="stat-card">
            <AlertCircle color="#4facfe" />
            <div>
              <div className="val">{config.difficulty}</div>
              <div className="lab">Level</div>
            </div>
          </div>
        </div>

        <div className="review-section">
          {result.results.map((r, i) => (
            <div key={i} className={`review-item ${r.is_correct ? 'correct' : 'incorrect'}`}>
              <p className="q-text">{i + 1}. {r.question}</p>
              <div className="q-details">
                <span className="ans-label">Your Answer: <span className="ans-val">{r.submitted}</span></span>
                {!r.is_correct && <span className="ans-label">Correct: <span className="ans-val">{r.correct}</span></span>}
              </div>
              <div className="explanation">
                <BrainCircuit size={16} />
                <span>{r.explanation}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="primary-btn wide-btn" onClick={reset}>
          <RotateCcw size={18} />
          <span>Try Another Topic</span>
        </button>
      </div>
    );
  }

  if (quizData) {
    return (
      <div className="quiz-container animate-fade-in">
        <div className="quiz-progress-header">
           <div className="topic-badge">{config.topic}</div>
           <div className="progress-text">Question {Object.keys(currentAnswers).length} of {quizData.length}</div>
        </div>

        <div className="questions-stack">
          {quizData.map((q, qIdx) => (
            <div key={qIdx} className="quiz-item-card">
              <div className="q-num">{qIdx + 1}</div>
              <div className="q-body">
                <h3>{q.question}</h3>
                <div className="options-grid">
                  {q.options.map((opt, oIdx) => (
                    <div 
                      key={oIdx}
                      className={`option-btn ${currentAnswers[qIdx] === opt ? 'selected' : ''}`}
                      onClick={() => handleAnswer(qIdx, opt)}
                    >
                      <span className="bullet">{String.fromCharCode(65 + oIdx)}</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="primary-btn wide-btn submit-trigger" 
          onClick={submitQuiz}
          disabled={loading}
        >
          {loading ? <RotateCcw className="spin" /> : <TrendingUp size={18} />}
          <span>Finalize Submission</span>
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-config-view animate-fade-in">
      <div className="config-card">
        <div className="config-header">
          <div className="icon-box">
            <FileQuestion size={24} color="#4facfe" />
          </div>
          <h2>AI Challenge Generator</h2>
          <p>Master your curriculum through generated tests.</p>
        </div>

        <form onSubmit={startQuiz} className="config-form">
          <div className="form-group">
            <label>Specific Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Photosynthesis, Binary Search..."
              value={config.topic}
              onChange={(e) => setConfig({...config, topic: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Difficulty</label>
              <select 
                value={config.difficulty}
                onChange={(e) => setConfig({...config, difficulty: e.target.value})}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group half">
              <label>Questions</label>
              <select 
                value={config.num_questions}
                onChange={(e) => setConfig({...config, num_questions: parseInt(e.target.value)})}
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
          </div>

          {error && <div className="error-pill"><AlertCircle size={16} /> {error}</div>}

          <button type="submit" className="primary-btn wide-btn" disabled={loading}>
            {loading ? <RotateCcw className="spin" /> : <Play size={18} />}
            <span>Generate Quiz</span>
          </button>
        </form>
      </div>

      <div className="config-hints">
        <div className="hint">
          <HelpCircle size={16} />
          <span>The AI uses classroom materials to ensure accuracy.</span>
        </div>
        <div className="hint">
          <Settings2 size={16} />
          <span>Higher difficulty adds complex reasoning questions.</span>
        </div>
      </div>
    </div>
  );
};

export default QuizSection;
