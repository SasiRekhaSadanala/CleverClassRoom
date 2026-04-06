import React, { useState, useEffect } from 'react';
import { classroomAPI, assignmentAPI } from '../../api';
import { Award, User, Trophy, Crown, Medal, Star, Loader2, Search, Filter } from 'lucide-react';
import './TopperSection.css';

const TopperSection = ({ classroomId, isTeacher, classroom }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [assignmentSubmissions, setAssignmentSubmissions] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [classroomId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await classroomAPI.getLeaderboard(classroomId);
      setLeaderboard(data.leaderboard || []);
      setAssignmentSubmissions(null);
      setSelectedAssignmentId('');
    } catch (err) {
      console.error('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = async (e) => {
    const aid = e.target.value;
    setSelectedAssignmentId(aid);
    if (!aid) {
      setAssignmentSubmissions(null);
      return;
    }

    setLoading(true);
    try {
      const data = await assignmentAPI.getSubmissions(classroomId, aid);
      setAssignmentSubmissions(data);
    } catch (err) {
      console.error("Failed to fetch assignment submissions");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !assignmentSubmissions && leaderboard.length === 0) {
    return <div className="loading-state"><Loader2 className="spin" /> Calculating rankings...</div>;
  }

  const dataToShow = assignmentSubmissions || leaderboard;
  const isGlobal = !assignmentSubmissions;

  const topThree = isGlobal ? leaderboard.slice(0, 3) : assignmentSubmissions.slice(0, 3);
  
  const podiumOrder = [
    topThree[1] || null,
    topThree[0] || null,
    topThree[2] || null
  ];

  return (
    <div className="topper-section">
      <div className="section-header">
        <div className="header-left">
          <h2>{isGlobal ? "Classroom Pioneers" : "Assignment Standing"}</h2>
          <p>{isGlobal ? "Overall performance across all activities" : "Top performers for the selected task"}</p>
        </div>
        
        {isTeacher && (
          <div className="dashboard-controls">
             <button className={`toggle-btn ${isGlobal ? 'active' : ''}`} onClick={fetchLeaderboard}>
               <Trophy size={16} />
               <span>Global</span>
             </button>
             <div className="assignment-filter">
               <Filter size={16} />
               <select value={selectedAssignmentId} onChange={handleAssignmentChange}>
                 <option value="">Specific Assignment</option>
                 {classroom?.assignments?.map(a => (
                   <option key={a.id} value={a.id}>{a.title}</option>
                 ))}
               </select>
             </div>
          </div>
        )}
      </div>

      <div className="podium-container">
        {podiumOrder.map((student, idx) => {
          if (!student && idx !== 1) return <div key={idx} className="podium-placeholder" style={{ width: '120px' }} />;
          if (!student) return <div key={idx} className="podium-placeholder" style={{ width: '120px' }}>No Data</div>;
          
          const rankClass = idx === 1 ? 'first' : idx === 0 ? 'second' : 'third';
          const Icon = idx === 1 ? Crown : idx === 0 ? Medal : Star;
          const iconColor = idx === 1 ? "#facc15" : idx === 0 ? "#e2e8f0" : "#fb923c";
          const name = isGlobal ? student.user_name : student.student_name;
          const score = isGlobal ? student.total_score : student.score;
          
          return (
            <div key={idx} className={`podium-item ${rankClass}`}>
              <div className="podium-avatar">
                {idx === 1 && <Crown size={32} className="rank-crown" color="#facc15" />}
                <User size={idx === 1 ? 40 : 32} color={iconColor} />
              </div>
              <div className="podium-block">
                <Icon size={24} color="#fff" />
                <span className="podium-name">{name.split(' ')[0]}</span>
                <span className="podium-score">{score} {isGlobal ? 'pts' : '%'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-cell">Rank</th>
              <th>Student Participant</th>
              <th>{isGlobal ? "Learning Progress" : "Submission Tone"}</th>
              <th>{isGlobal ? "Total Points" : "Score"}</th>
            </tr>
          </thead>
          <tbody>
            {dataToShow.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                  No activity recorded for this view yet.
                </td>
              </tr>
            ) : (
              dataToShow.map((student, index) => {
                const name = isGlobal ? student.user_name : student.student_name;
                const score = isGlobal ? student.total_score : student.score;
                
                return (
                  <tr key={index}>
                    <td className="rank-cell">#{index + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-mini">
                           <User size={16} />
                        </div>
                        <span>{name}</span>
                      </div>
                    </td>
                    <td className="mastery-cell">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${Math.min(100, score)}%` }} 
                        />
                      </div>
                    </td>
                    <td className="score-cell">
                      {score} {isGlobal ? 'pts' : '%'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopperSection;
