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
  Type,
  AlignLeft
} from 'lucide-react';
import './NotesSection.css';

const NotesSection = ({ classroomId, isTeacher }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

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
      <div className="section-header">
        <div className="header-info">
          <h2>Classroom Study Material</h2>
          <p>Curated notes and summaries from your instructor.</p>
        </div>
        {isTeacher && (
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>New Note</span>
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} color="#334155" />
          <p>No notes have been posted yet.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note.id} className="note-card">
              <div className="note-icon">
                <FileText size={20} color="#4facfe" />
              </div>
              <h3 className="note-title">{note.title}</h3>
              <p className="note-excerpt">{note.content}</p>
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
    </div>
  );
};

export default NotesSection;
