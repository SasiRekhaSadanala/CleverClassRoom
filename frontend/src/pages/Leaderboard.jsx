import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../api';
import { Trophy, Medal, Target, BrainCircuit } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(res => {
        setLeaderboard(res.leaderboard);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leaderboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading rankings...</div>;

  const getRankAppearance = (rank) => {
    switch(rank) {
      case 1:
        return { icon: <Trophy size={24} color="#FBBF24" />, color: "rgba(251, 191, 36, 0.2)", textColor: "#FBBF24", label: "1st" };
      case 2:
        return { icon: <Medal size={24} color="#9CA3AF" />, color: "rgba(156, 163, 175, 0.2)", textColor: "#9CA3AF", label: "2nd" };
      case 3:
        return { icon: <Medal size={24} color="#D97706" />, color: "rgba(217, 119, 6, 0.2)", textColor: "#D97706", label: "3rd" };
      default:
        return { icon: <span style={{fontSize: '18px', fontWeight: 'bold'}}>{rank}</span>, color: "var(--bg-secondary)", textColor: "var(--text-soft)", label: `${rank}th` };
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <Trophy size={40} color="var(--accent-primary)" />
        <h1 className="heading-1" style={{ margin: 0 }}>Leaderboard</h1>
      </div>
      <p className="text-soft mb-8">Compare your mastery points against other students. Keep learning to climb the ranks!</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
        {leaderboard.map((user) => {
          const appearance = getRankAppearance(user.rank);
          const isTop3 = user.rank <= 3;
          
          return (
            <div 
              key={user.user_id} 
              className="glass-panel" 
              style={{
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                border: isTop3 ? `1px solid ${appearance.textColor}` : '1px solid var(--border-color)',
                transform: isTop3 ? 'scale(1.01)' : 'none',
                boxShadow: isTop3 ? `0 4px 20px ${appearance.color}` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: appearance.color,
                  color: appearance.textColor
                }}>
                  {appearance.icon}
                </div>
                
                <div>
                  <h3 className="heading-2" style={{ margin: '0 0 4px 0' }}>{user.user_name}</h3>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="text-soft" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <BrainCircuit size={14} />
                      {user.quizzes_taken} Quizzes
                    </div>
                    <div className="text-soft" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Target size={14} />
                      {user.topics_mastered} Mastered
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {user.total_score}
                </div>
                <div className="text-soft" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                  Mastery Pts
                </div>
              </div>
            </div>
          );
        })}
        {leaderboard.length === 0 && (
          <p className="text-soft text-center p-8">No leaderboard data available.</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
