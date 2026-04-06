import React, { useState, useEffect } from 'react';
import { assignmentAPI } from '../../api';
import { 
  ClipboardCheck, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Target, 
  Lightbulb, 
  MessageSquare,
  TrendingUp,
  User,
  GraduationCap
} from 'lucide-react';
import './EvaluatorSection.css';

const EvaluatorSection = ({ classroomId, isTeacher, classroom }) => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!isTeacher) {
      fetchMySubmissions();
    } else {
      setLoading(false);
    }
  }, [classroomId, isTeacher]);

  const fetchMySubmissions = async () => {
    try {
      const data = await assignmentAPI.getMySubmissions(classroomId);
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load personal submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSubmissions = async (assignmentId) => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const data = await assignmentAPI.getSubmissions(classroomId, assignmentId);
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load class submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (e) => {
    const id = e.target.value;
    setSelectedAssignmentId(id);
    fetchClassSubmissions(id);
  };

  const renderFeedback = (feedback) => {
    if (!feedback) return null;
    
    return (
      <div className="feedback-details">
        <div className="overall-summary">
          <MessageSquare size={16} />
          <span>{feedback.overall || feedback.detailed_explanation || "No overall feedback provided."}</span>
        </div>
        
        <div className="feedback-grid">
          <div className="feedback-column">
            <h4><Star size={14} color="#facc15" /> Key Strengths</h4>
            <ul>
              {(feedback.strengths && Array.isArray(feedback.strengths)) ? 
                feedback.strengths.map((s, i) => <li key={i}>{s}</li>) : 
                <li>Excellent effort shown in completion.</li>
              }
            </ul>
          </div>
          
          <div className="feedback-column">
            <h4><Target size={14} color="#ef4444" /> Areas for Improvement</h4>
            <ul>
              {(feedback.improvements && Array.isArray(feedback.improvements)) ? 
                feedback.improvements.map((im, i) => <li key={i}>{im}</li>) : 
                <li>Maintain consistency in future submissions.</li>
              }
            </ul>
          </div>
          
          <div className="feedback-column">
            <h4><Lightbulb size={14} color="#22c55e" /> Suggestions</h4>
            <ul>
              {(feedback.suggestions && Array.isArray(feedback.suggestions)) ? 
                feedback.suggestions.map((su, i) => <li key={i}>{su}</li>) : 
                <li>Review the core concepts for better clarity.</li>
              }
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (isTeacher) {
    return (
      <div className="evaluator-section teacher-view animate-fade-in">
        <div className="section-header">
          <div className="header-info">
            <h2>AI Evaluation Hub</h2>
            <p>Review and analyze detailed feedback for all submissions.</p>
          </div>
          <div className="assignment-selector">
             <Search size={18} />
             <select value={selectedAssignmentId} onChange={handleAssignmentChange}>
                <option value="">Select Assignment</option>
                {classroom.assignments?.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
             </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Analyzing submissions...</div>
        ) : !selectedAssignmentId ? (
          <div className="empty-state">Choose an assignment to see class-wide feedback.</div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">No submissions found for this assignment.</div>
        ) : (
          <div className="submissions-vertical-list">
            {submissions.map((sub, idx) => (
              <div key={idx} className="sub-expansion-card">
                <div 
                  className="sub-main-row"
                  onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                >
                  <div className="sub-user-cell">
                    <div className="user-icon"><User size={18} /></div>
                    <span>{sub.student_name}</span>
                  </div>
                  <div className="sub-score-cell">
                    <TrendingUp size={16} />
                    <span>{sub.score}%</span>
                  </div>
                  {expandedId === idx ? <ChevronUp /> : <ChevronDown />}
                </div>
                {expandedId === idx && renderFeedback(sub.feedback)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student View
  return (
    <div className="evaluator-section student-view animate-fade-in">
      <div className="section-header">
        <div className="header-info">
          <h2>My Growth Logs</h2>
          <p>Review comprehensive feedback and personalized suggestions.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Fetching your feedback history...</div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">You haven't submitted any assignments yet.</div>
      ) : (
        <div className="feedback-stack">
          {submissions.map((sub, idx) => (
            <div key={idx} className="personal-feedback-card">
              <div className="card-top">
                <div className="assignment-meta">
                  <ClipboardCheck size={20} color="#4facfe" />
                  <h3>{sub.assignment_title}</h3>
                </div>
                <div className="radial-score">
                  <span className="score-val">{sub.score}%</span>
                </div>
              </div>
              <div className="card-body">
                {renderFeedback(sub.feedback)}
              </div>
              <div className="card-footer">
                 <span>Evaluated: {new Date(sub.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvaluatorSection;
