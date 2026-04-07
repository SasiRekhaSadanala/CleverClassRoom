import React, { useState, useEffect, useRef } from 'react';
import { assignmentAPI, classroomAPI } from '../../api';
import { 
  FilePlus, 
  Send, 
  ClipboardCheck, 
  AlertCircle, 
  Award, 
  Plus, 
  FileText, 
  HelpCircle,
  BarChart2,
  X,
  CheckCircle,
  Loader2
} from 'lucide-react';
import './AssignmentSection.css';

const AssignmentSection = ({ classroomId, isTeacher }) => {
  const [assignments, setAssignments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitFile, setSubmitFile] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    rubric: { content: 50, structure: 30, creativity: 20 }
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAssignments();
  }, [classroomId]);

  const fetchAssignments = async () => {
    try {
      const data = await classroomAPI.getDetails(classroomId);
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await assignmentAPI.createAssignment({ 
        ...newAssignment, 
        classroom_id: parseInt(classroomId) 
      });
      setShowCreate(false);
      setNewAssignment({
        title: '',
        description: '',
        rubric: { content: 50, structure: 30, creativity: 20 }
      });
      fetchAssignments();
    } catch (err) {
      alert('Failed to create assignment');
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!submitFile) return;
    setSubmittingId(assignmentId);
    try {
      const data = await assignmentAPI.submitAssignment(assignmentId, submitFile);
      setSubmissionResult({ ...data, assignment_id: assignmentId });
      setSubmitFile(null);
    } catch (err) {
      alert('Submission failed');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div className="loading-state"><Loader2 className="spin" /> Fetching classroom tasks...</div>;

  return (
    <div className="assignment-section">
      <div className="section-header">
        <h2>Learning Tasks</h2>
        {isTeacher && !showCreate && (
          <button onClick={() => setShowCreate(true)} className="auth-button" style={{ width: 'auto' }}>
            <Plus size={18} /> Publish Task
          </button>
        )}
      </div>

      {isTeacher && showCreate && (
        <div className="create-assignment-overlay mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
             <h3>New AI-Graded Assignment</h3>
             <button onClick={() => setShowCreate(false)} className="icon-btn" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <form onSubmit={handleCreate}>
            <input 
              type="text" 
              placeholder="Task Title (e.g., Final Physics Essay)" 
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              className="text-input"
              required
            />
            <textarea 
              placeholder="Describe the task and provide instructions for the students..." 
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
              className="text-input"
              style={{ height: '100px', resize: 'vertical' }}
              required
            />
            
            <div className="rubric-config mb-4">
               <p style={{ fontWeight: 600, marginBottom: '15px' }}>AI Grading Rubric (%)</p>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                 <div className="form-group" style={{ marginBottom: 0 }}>
                   <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Content</label>
                   <input type="number" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }} value={newAssignment.rubric.content} onChange={(e) => setNewAssignment({...newAssignment, rubric: {...newAssignment.rubric, content: parseInt(e.target.value)}})} />
                 </div>
                 <div className="form-group" style={{ marginBottom: 0 }}>
                   <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Structure</label>
                   <input type="number" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }} value={newAssignment.rubric.structure} onChange={(e) => setNewAssignment({...newAssignment, rubric: {...newAssignment.rubric, structure: parseInt(e.target.value)}})} />
                 </div>
                 <div className="form-group" style={{ marginBottom: 0 }}>
                   <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Creativity</label>
                   <input type="number" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }} value={newAssignment.rubric.creativity} onChange={(e) => setNewAssignment({...newAssignment, rubric: {...newAssignment.rubric, creativity: parseInt(e.target.value)}})} />
                 </div>
               </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="auth-button">Initialize Task</button>
            </div>
          </form>
        </div>
      )}

      <div className="assignments-list">
        {assignments.length === 0 ? (
          <div className="empty-state">
             <ClipboardCheck size={48} color="#64748b" />
             <p>No assignments have been published yet.</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <div className="assignment-header">
                <h3>{assignment.title}</h3>
                <div className="rubric-badges" style={{ display: 'flex', gap: '8px' }}>
                   {Object.entries(assignment.rubric).map(([key, val]) => (
                     <span key={key} className="rubric-pill">{key}: {val}%</span>
                   ))}
                </div>
              </div>

              <p className="assignment-desc">{assignment.description}</p>
              
              <div className="assignment-meta">
                 <div className="meta-item"><Plus size={14} /> Created {new Date(assignment.created_at).toLocaleDateString()}</div>
                 {isTeacher && <div className="submissions-count"><ClipboardCheck size={14} /> {assignment.submissions?.length || 0} Responses</div>}
              </div>
              
              <div className="assignment-actions">
                {!isTeacher && (
                  <div className="submission-zone">
                     <div 
                       className="submit-placeholder"
                       style={{ cursor: 'pointer' }}
                       onClick={() => fileInputRef.current.click()}
                     >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={(e) => setSubmitFile(e.target.files[0])} 
                          style={{ display: 'none' }}
                        />
                        <FilePlus size={20} color={submitFile ? "#22c55e" : "#4facfe"} />
                        <span>{submitFile ? submitFile.name : 'Choose submission file (PDF/PPTX)'}</span>
                     </div>
                     <button 
                       onClick={() => handleSubmit(assignment.id)} 
                       disabled={submittingId === assignment.id || !submitFile}
                       className="auth-button"
                       style={{ width: '180px', marginTop: 0 }}
                     >
                       {submittingId === assignment.id ? 'Awaiting AI Grading...' : 'Submit Work'}
                     </button>
                  </div>
                )}
              </div>

              {submissionResult && submissionResult.assignment_id === assignment.id && (
                <div className="feedback-layer mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                  <div className="score-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div className="score-badge">Final Grade: {submissionResult.score}/100</div>
                    <div style={{ color: '#22c55e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} /> Verified by AI Instructor</div>
                  </div>
                  <div className="mistake-analysis">
                    <div className="feedback-summary mb-4">
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <MessageSquare size={16} color="#4facfe" /> 
                        <strong>Instructor's Overall Feedback:</strong>
                      </p>
                      <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {submissionResult.feedback.overall || "Great work on this assignment!"}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                      <div className="feedback-group">
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#facc15', fontSize: '0.9rem' }}>
                          <Star size={14} /> <strong>Key Strengths</strong>
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(submissionResult.feedback.strengths || ["Well-structured content"]).map((s, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', paddingLeft: '20px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#facc15' }}>•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="feedback-group">
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#ef4444', fontSize: '0.9rem' }}>
                          <Target size={14} /> <strong>Areas for Improvement</strong>
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(submissionResult.feedback.improvements || ["None identified"]).map((im, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', paddingLeft: '20px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ef4444' }}>•</span> {im}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="feedback-group">
                        <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#22c55e', fontSize: '0.9rem' }}>
                          <Lightbulb size={14} /> <strong>Future Suggestions</strong>
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(submissionResult.feedback.suggestions || ["Keep up the great work!"]).map((su, i) => (
                            <li key={i} style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', paddingLeft: '20px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#22c55e' }}>•</span> {su}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSubmissionResult(null)} style={{ background: 'transparent', border: 'none', color: '#4facfe', marginTop: '15px', cursor: 'pointer', fontWeight: 600 }}>Dismiss Feedback</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentSection;
