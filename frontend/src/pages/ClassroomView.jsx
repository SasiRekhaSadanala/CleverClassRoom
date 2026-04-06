import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { classroomAPI } from '../api';
import { 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Trophy, 
  ArrowLeft,
  User,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Users,
  Search,
  ClipboardCheck
} from 'lucide-react';
import './ClassroomView.css';

import AIChatSection from '../components/classroom/AIChatSection';
import AssignmentSection from '../components/classroom/AssignmentSection';
import TopperSection from '../components/classroom/TopperSection';
import QuizSection from '../components/classroom/QuizSection';
import EvaluatorSection from '../components/classroom/EvaluatorSection';
import NotesSection from '../components/classroom/NotesSection';
import MembersSection from '../components/classroom/MembersSection';

const ClassroomView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [classroom, setClassroom] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const details = await classroomAPI.getDetails(id);
      setClassroom(details);
      setIsTeacher(details.is_teacher);
    } catch (err) {
      console.error("Failed to load classroom details", err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'quiz', label: 'Quiz', icon: <Search size={18} /> },
    { id: 'tutor', label: 'Tutor', icon: <MessageSquare size={18} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={18} /> },
    { id: 'evaluator', label: 'Evaluator', icon: <ClipboardCheck size={18} /> },
    { id: 'notes', label: 'Notes', icon: <BookOpen size={18} /> },
    { id: 'members', label: 'Members', icon: <Users size={18} /> },
  ];

  if (loading) {
    return (
      <div className="classroom-view loading-screen">
        <Loader2 className="spin" size={48} color="#4facfe" />
        <p>Gearing up your learning workspace...</p>
      </div>
    );
  }

  if (!classroom) return <div className="error-state">Classroom not found.</div>;

  return (
    <div className="classroom-view">
      <nav className="classroom-nav">
        <div className="nav-left">
          <Link to="/classrooms" className="back-link">
            <ArrowLeft size={20} />
            <span>All Classes</span>
          </Link>
          <div className="classroom-title">{classroom.name}</div>
        </div>
        
        <div className="nav-tabs">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        <div className="nav-right">
          <div className={`meta-pill ${isTeacher ? 'teacher-badge' : 'student-badge'}`}>
            {isTeacher ? <GraduationCap size={16} /> : <User size={16} />}
            <span>{isTeacher ? 'Classroom Host' : 'Enrolled Student'}</span>
          </div>
        </div>
      </nav>

      <main className="classroom-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-content animate-fade-in">
            <header className="classroom-hero">
              <div className="hero-content">
                <h1>{classroom.name}</h1>
                <div className="hero-meta">
                  <div className="meta-pill">
                    <User size={18} color="#4facfe" />
                    <span>Participants: {classroom.students?.length || 0}</span>
                  </div>
                  <div className="meta-pill">
                    <Trophy size={18} color="#facc15" />
                    <span>Rankings Live</span>
                  </div>
                </div>
              </div>
            </header>
            <TopperSection classroomId={id} isTeacher={isTeacher} classroom={classroom} />
          </div>
        )}

        {activeTab === 'quiz' && <QuizSection classroomId={id} />}
        {activeTab === 'tutor' && <AIChatSection classroomId={id} />}
        {activeTab === 'assignments' && <AssignmentSection classroomId={id} isTeacher={isTeacher} />}
        {activeTab === 'evaluator' && <EvaluatorSection classroomId={id} isTeacher={isTeacher} classroom={classroom} />}
        {activeTab === 'notes' && <NotesSection classroomId={id} isTeacher={isTeacher} />}
        {activeTab === 'members' && <MembersSection classroomId={id} classroom={classroom} />}
      </main>
    </div>
  );
};

export default ClassroomView;
