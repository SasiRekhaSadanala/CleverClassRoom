import React, { useState } from 'react';
import { uploadDocument } from '../api';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

const KnowledgeBase = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file, description);
      setSuccess(true);
      setFile(null);
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="heading-1">Knowledge Base</h1>
      <p className="text-soft mb-8">Upload course materials, lecture notes, or textbooks (PDF only). MentorAI will learn from them immediately.</p>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="heading-2" style={{ textAlign: 'center', marginBottom: '24px' }}>Upload New Material</h2>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div 
            style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '40px', 
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              transition: 'border-color 0.3s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <FileText size={48} color="var(--accent-primary)" />
                <span style={{ fontWeight: 500 }}>{file.name}</span>
                <span className="text-soft">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <UploadCloud size={48} color="var(--text-secondary)" />
                <span style={{ fontWeight: 500 }}>Click to browse or drag and drop</span>
                <span className="text-soft">PDF file format only, max 50MB</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-soft" style={{ display: 'block', marginBottom: '8px' }}>Topic / Subject</label>
            <input 
              type="text" 
              className="input-base" 
              placeholder="e.g., Computer Networks, Intro to Economics" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={!file || uploading}
            style={{ padding: '14px' }}
          >
            {uploading ? 'Processing Document...' : 'Upload & Train Mentor'}
          </button>

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <CheckCircle size={20} />
              <span>Document indexed successfully! You can now chat or take quizzes on it.</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-error)', borderRadius: '8px' }}>
              {error}
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default KnowledgeBase;
