import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomAPI } from '../api';
import { Plus, Users, ArrowRight, User as UserIcon, LogOut, Copy, Check, X, Shield, GraduationCap } from 'lucide-react';
import './ClassroomList.css';

const ClassroomList = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [userName] = useState(localStorage.getItem('user_name') || 'Scholar');
  const [currentUserId] = useState(parseInt(localStorage.getItem('user_id')));
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const data = await classroomAPI.getClassrooms();
      setClassrooms(data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      setError('Session expired or failed to load classrooms');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await classroomAPI.createClassroom(roomName);
      setRoomName('');
      setShowCreateModal(false);
      fetchClassrooms();
    } catch (err) {
      setError('Creation failed. Ensure you are logged in.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await classroomAPI.joinClassroom(joinCode);
      setJoinCode('');
      setShowJoinModal(false);
      fetchClassrooms();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid join code');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const copyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="classrooms-page">
      <header className="classrooms-header">
        <div className="header-left">
          <h1>Universal Classroom</h1>
          <p>Welcome back, {userName}. Ready to learn today?</p>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> 
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="classrooms-content">
        <div className="actions-bar">
          <button onClick={() => setShowCreateModal(true)} className="primary-btn">
            <Plus size={20} /> Create New Space
          </button>
          <button onClick={() => setShowJoinModal(true)} className="secondary-btn">
            <Users size={20} /> Join Existing Space
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="classrooms-grid">
          {classrooms.map((room) => (
            <div key={room.id} className="classroom-card" onClick={() => navigate(`/classroom/${room.id}`)}>
              <div className="card-top">
                <div className="room-icon">
                   {room.teacher_id === currentUserId ? <GraduationCap size={28} /> : <Users size={28} />}
                </div>
                <h3>{room.name}</h3>
              </div>
              <div className="card-bottom">
                <div className="card-roles">
                  <Shield size={14} color={room.teacher_id === currentUserId ? "#4facfe" : "#94a3b8"} /> 
                  <span className="role-text">{room.teacher_id === currentUserId ? 'Host' : 'Member'}</span>
                </div>
                
                {room.teacher_id === currentUserId && (
                  <div className={`join-code-pill ${copiedCode === room.join_code ? 'copied' : ''}`} onClick={(e) => copyCode(room.join_code, e)}>
                    <span>{room.join_code}</span>
                    {copiedCode === room.join_code ? <Check size={14} /> : <Copy size={14} />}
                  </div>
                )}
                
                <div className="card-arrow"><ArrowRight size={20} /></div>
              </div>
            </div>
          ))}
          
          {classrooms.length === 0 && (
            <div className="empty-state-container">
              <div className="empty-icon"><Plus size={48} /></div>
              <h3>No Spaces Found</h3>
              <p>Your educational journey starts here. Create a classroom or enter a code to join one.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>New Classroom</h2>
              <button className="close-x" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Space Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Advanced Quantum Mechanics" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn w-full">Initialize Space</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Join Learning Space</h2>
              <button className="close-x" onClick={() => setShowJoinModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invitation Code</label>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary-btn w-full">Join Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomList;
