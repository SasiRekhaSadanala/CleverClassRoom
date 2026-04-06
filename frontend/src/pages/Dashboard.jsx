import React, { useEffect, useState } from 'react';
import { getDashboard } from '../api';
import { Target, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const averageScore = data?.recent_quizzes.length 
    ? (data.recent_quizzes.reduce((acc, q) => acc + q.score, 0) / data.recent_quizzes.length).toFixed(1)
    : 0;

  return (
    <div>
      <h1 className="heading-1">Welcome back, {data?.user_name}!</h1>
      <p className="text-soft mb-8">Here's your learning progress based on recent activities.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <h3 className="text-soft">Avg Score (Last 5)</h3>
            <p className="heading-2" style={{ margin: 0 }}>{averageScore}%</p>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--accent-success)' }}>
            <BookOpen size={32} />
          </div>
          <div>
            <h3 className="text-soft">Topics Mastered</h3>
            <p className="heading-2" style={{ margin: 0 }}>{data?.topic_mastery.filter(t => t.mastery >= 80).length || 0}</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--accent-error)' }}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-soft">Weak Topics</h3>
            <p className="heading-2" style={{ margin: 0 }}>{data?.weak_topics.length || 0}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div className="glass-panel">
          <h2 className="heading-2" style={{ marginBottom: '24px' }}>Topic Mastery</h2>
          {data?.topic_mastery.length === 0 ? (
            <p className="text-soft">No topics mastered yet. Take some quizzes!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data?.topic_mastery.map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{item.topic}</span>
                    <span className="text-soft">{item.mastery.toFixed(0)}%</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-fill" style={{ width: `${item.mastery}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2 className="heading-2" style={{ marginBottom: '24px' }}>Recommended Review</h2>
          {data?.weak_topics.length === 0 ? (
            <p className="text-soft">Great job! No specific weak topics right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.weak_topics.map((topic, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent-error)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color="var(--accent-error)"/>
                    <span style={{ fontWeight: 500 }}>{topic}</span>
                  </div>
                  <p className="text-soft" style={{ fontSize: '0.85rem', marginTop: '4px' }}>Your mastery is below 60%. Try re-reading materials and taking another quiz.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
