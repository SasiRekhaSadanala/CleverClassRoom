import React, { useState, useEffect } from 'react';
import { notesAPI } from '../../api';
import { 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  ArrowRight,
  Loader2,
  X,
  AlignLeft,
  Search
} from 'lucide-react';
import './NotesSection.css';

const NotesSection = ({ classroomId, isTeacher }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, [classroomId]);

  const fetchNotes = async () => {
    try {
      const data = await notesAPI.getNotes(classroomId);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;

    setSubmitting(true);
    try {
      await notesAPI.addNote(classroomId, newNote);
      setNewNote({ title: '', content: '' });
      setShowModal(false);
      fetchNotes();
    } catch (err) {
      alert("Failed to add note. Check your permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotes = notes
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) {
    return (
      <div className="section-loading">
        <Loader2 className="spin" size={32} color="#4facfe" />
        <p>Retrieving classroom notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-section animate-fade-in">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div className="header-info">
          <h2>Classroom Study Material</h2>
          <p>Curated notes and summaries from your instructor.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '15px' }}>
          <div className="search-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#4facfe" style={{ position: 'absolute', left: '12px' }} />
            <input 
              type="text" 
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 10px 10px 35px', color: '#fff', fontSize: '0.85rem', width: '200px' }}
            />
          </div>
          {isTeacher && (
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              <span>New Note</span>
            </button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} color="#334155" />
          <p>No notes have been posted yet.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <div 
              key={note.id} 
              className="note-card animate-card" 
              onClick={() => setSelectedNote(note)}
              style={{ cursor: 'pointer' }}
            >
              <div className="note-icon">
                <FileText size={20} color="#4facfe" />
              </div>
              <h3 className="note-title">{note.title}</h3>
              <p className="note-excerpt">{note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
              <div className="note-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h3>Create New Note</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="note-form">
              <div className="form-group">
                <label><Type size={16} /> Title</label>
                <input 
                  type="text" 
                  placeholder="Note Title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label><AlignLeft size={16} /> Content</label>
                <textarea 
                  placeholder="Write your note details here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  required
                  rows={6}
                />
              </div>
              <button type="submit" className="primary-btn wide-btn" disabled={submitting}>
                {submitting ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
                <span>Publish Note</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} color="#4facfe" />
                <h3>{selectedNote.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedNote(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="note-full-content" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {new Date(selectedNote.created_at).toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={14} /> Instructor Material</span>
              </div>
              <div style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {selectedNote.content}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" onClick={() => setSelectedNote(null)}>Done Reading</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
