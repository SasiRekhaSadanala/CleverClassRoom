import React, { useState, useEffect, useRef } from 'react';
import { contentAPI, classroomAPI } from '../../api';
import { Upload, FileText, Info, CheckCircle, Clock, Plus, BarChart2 } from 'lucide-react';
import './MaterialSection.css';

const MaterialSection = ({ classroomId, isTeacher }) => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [materials, setMaterials] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMaterials();
  }, [classroomId]);

  const fetchMaterials = async () => {
    try {
      const data = await classroomAPI.getDetails(classroomId);
      setMaterials(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch materials');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      await contentAPI.uploadDocument(classroomId, file, description);
      setMessage('Subject material uploaded and AI analysis started!');
      setFile(null);
      setDescription('');
      fetchMaterials();
    } catch (err) {
      setMessage('Unauthorized access. Only teachers can update materials.');
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="material-section">
      <div className="section-header">
        <h2>Curriculum & Materials</h2>
      </div>

      {isTeacher && (
        <div className="upload-card">
          <h3><Upload size={22} color="#4facfe" /> Manage Study Materials</h3>
          <form onSubmit={handleUpload}>
            <div 
              className="file-upload-zone"
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])} 
                accept=".pdf,.pptx,.ppt"
                style={{ display: 'none' }}
              />
              <div className="upload-placeholder">
                <Plus size={32} color={file ? "#22c55e" : "#4facfe"} />
                <p>{file ? `Selected: ${file.name}` : 'Click to upload PPTX or PDF materials'}</p>
                <div className="file-hint">The AI will automatically index these for student mentoring.</div>
              </div>
            </div>
            
            <input 
              type="text" 
              placeholder="Chapter Name or Description (e.g. Unit 1: Thermodynamics)" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-input"
            />
            
            <button type="submit" disabled={uploading || !file} className="auth-button">
              {uploading ? 'Analyzing Documents...' : 'Publish to Students'}
            </button>
          </form>
          {message && <div className="status-message"><CheckCircle size={14} /> {message}</div>}
        </div>
      )}

      <div className="materials-list">
        {materials.length === 0 ? (
          <div className="empty-state">
            <Info size={48} color="#64748b" />
            <p>No study materials have been published yet.</p>
            <span className="file-hint">{isTeacher ? 'Start by uploading your first lecture slides.' : 'Your teacher will provide PPTs and PDFs here soon.'}</span>
          </div>
        ) : (
          <div className="materials-grid">
            {materials.map((doc, idx) => (
              <div key={idx} className="material-card">
                <div className="doc-icon"><FileText size={28} /></div>
                <div className="doc-info">
                  <h4>{doc.filename}</h4>
                  <p>{doc.description || 'General Subject Material'}</p>
                  <span className="doc-date"><Clock size={14} /> Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialSection;
