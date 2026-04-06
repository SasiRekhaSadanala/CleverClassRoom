import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BookOpen, BrainCircuit, Trophy } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="heading-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
          <BrainCircuit size={28} />
          MentorAI
        </h2>
        <p className="text-soft" style={{ fontSize: '0.8rem' }}>Personalized Learning</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/chat" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={20} />
          Mentor Chat
        </NavLink>

        <NavLink 
          to="/knowledge" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          Knowledge Base
        </NavLink>

        <NavLink 
          to="/quiz" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <BrainCircuit size={20} />
          Quiz Arena
        </NavLink>

        <NavLink 
          to="/leaderboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Trophy size={20} />
          Leaderboard
        </NavLink>
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <p className="text-soft" style={{ fontSize: '0.8rem', textAlign: 'center' }}>Student A</p>
      </div>
    </aside>
  );
};

export default Sidebar;
