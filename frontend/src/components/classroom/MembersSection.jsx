import React from 'react';
import { 
  Users, 
  User as UserIcon, 
  ShieldCheck, 
  GraduationCap,
  MessageSquare,
  MoreVertical,
  Mail
} from 'lucide-react';
import './MembersSection.css';

const MembersSection = ({ classroomId, classroom }) => {
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const getAvatarStyle = (name) => {
    const color = stringToColor(name || 'Classroom');
    return {
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: '0.9rem'
    };
  };

  const teacher = {
    id: classroom.teacher_id,
    name: classroom.teacher_name || 'Classroom Instructor',
    is_teacher: true
  };

  const students = classroom.students || [];

  return (
    <div className="members-section animate-fade-in">
      <div className="section-header">
        <div className="header-info">
          <h2>Room Participants</h2>
          <p>You are learning alongside {students.length} other students.</p>
        </div>
        <div className="stats-pill">
          <Users size={16} />
          <span>{students.length + 1} Total</span>
        </div>
      </div>

      <div className="members-list">
        {/* Host Section */}
        <div className="members-category">
          <h3 className="cat-title">Classroom Host</h3>
          <div className="member-card host-card">
            <div className="avatar host-avatar" style={getAvatarStyle(teacher.name)}>
              {getInitials(teacher.name)}
            </div>
            <div className="member-info">
              <div className="name-row">
                <span className="member-name">{teacher.name}</span>
                <div className="badge host-badge">
                  <GraduationCap size={12} />
                  <span>Host</span>
                </div>
              </div>
              <span className="member-role">Creator & Instructor</span>
            </div>
            <div className="member-actions">
              <a href={`mailto:${classroom.teacher_email || 'instructor@edu.com'}`} className="action-btn" title="Send Message">
                <MessageSquare size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="members-category">
          <h3 className="cat-title">Students ({students.length})</h3>
          <div className="students-grid">
            {students.length === 0 ? (
              <div className="empty-substate">No students have joined this classroom yet.</div>
            ) : (
              students.map(student => (
                <div key={student.id} className="member-card">
                  <div className="avatar" style={getAvatarStyle(student.name)}>
                    {getInitials(student.name)}
                  </div>
                  <div className="member-info">
                    <div className="name-row">
                      <span className="member-name">{student.name}</span>
                      <div className="badge student-badge">
                        <UserIcon size={12} />
                        <span>Student</span>
                      </div>
                    </div>
                    <span className="member-role">Peer Learner</span>
                  </div>
                  <div className="member-actions">
                    <button className="action-btn ghost" title="Student Profile">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersSection;
