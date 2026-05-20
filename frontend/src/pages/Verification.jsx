import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FileText, Image as ImageIcon, CheckCircle, AlertCircle, Shield, Upload } from 'lucide-react';

export default function Verification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState({ identityProof: null, addressProof: null, workProofs: [] });
  const [loading, setLoading] = useState(false);

  const status = user?.verificationStatus || 'not_submitted';
  const remark = user?.verificationRemark;

  const handleFileChange = (e, field) => {
    if (field === 'workProofs') {
      const selected = Array.from(e.target.files);
      if (selected.length > 5) { toast.error('Maximum 5 work proofs allowed'); return; }
      setFiles(prev => ({ ...prev, workProofs: selected }));
    } else {
      setFiles(prev => ({ ...prev, [field]: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.avatar) { toast.error('Profile photo is mandatory. Please upload one in Edit Profile.'); return; }
    if (!files.identityProof || !files.addressProof || files.workProofs.length === 0) {
      toast.error('All documents are mandatory'); return;
    }
    const formData = new FormData();
    formData.append('identityProof', files.identityProof);
    formData.append('addressProof', files.addressProof);
    files.workProofs.forEach(file => formData.append('workProofs', file));
    setLoading(true);
    try {
      const { data } = await api.post('/uploads/verification', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(data.message);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  // Status screens
  if (status === 'pending' || status === 'in_review') {
    return (
      <div style={{ maxWidth: 600 }}>
        <h1 className="page-title" style={{ marginBottom: 20 }}>Professional Verification</h1>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle size={32} color="#d97706" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Verification {status === 'pending' ? 'Pending' : 'In Review'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
            Your documents have been submitted and are currently being reviewed by our compliance team. You will be notified once complete.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ margin: '0 auto' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div style={{ maxWidth: 600 }}>
        <h1 className="page-title" style={{ marginBottom: 20 }}>Professional Verification</h1>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Verification Approved</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
            Congratulations! Your profile is fully verified. You are now visible to clients and can submit bids on projects.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-green" style={{ margin: '0 auto' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Steps for progress
  const steps = [
    { label: 'Personal Identity', desc: 'Verified on Oct 12', done: !!user?.avatar },
    { label: 'Work Credentials', desc: 'Current Step', active: true },
    { label: 'Tax Information', desc: 'Locked', locked: true },
  ];

  const completionPct = Math.round(((files.identityProof ? 1 : 0) + (files.addressProof ? 1 : 0) + (files.workProofs.length > 0 ? 1 : 0)) / 3 * 65) + (user?.avatar ? 10 : 0);

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Professional Verification</h1>
        <p className="page-subtitle">Complete your document verification to unlock premium projects and build trust with top-tier clients.</p>
      </div>

      {/* Rejection banner */}
      {status === 'rejected' && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Verification Rejected</p>
            <p style={{ fontSize: 12, marginTop: 2 }}>Admin remark: {remark}. Please re-upload corrected documents.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Left: Progress panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Progress card */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completion Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{completionPct}%</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map(({ label, desc, done, active, locked }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: locked ? 0.4 : 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: done ? '#dcfce7' : active ? '#dbeafe' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done ? <CheckCircle size={14} color="#16a34a" /> : locked ? '🔒' : <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>●</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{label}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust guarantee card */}
          <div style={{ background: '#1e2a3b', borderRadius: 12, padding: 18, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Shield size={16} color="#22c55e" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Trust Guarantee</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 12 }}>
              Verified workers earn 40% more on average and get access to exclusive corporate contracts.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} color="#22c55e" />
              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 500 }}>Secure 256-bit Encryption</span>
            </div>
          </div>
        </div>

        {/* Right: Upload form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile photo check */}
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={22} color="#94a3b8" />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Profile Photo</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Clear face image is mandatory</p>
            </div>
            {user?.avatar ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#16a34a', fontSize: 13, fontWeight: 500 }}>
                <CheckCircle size={14} /> Uploaded
              </span>
            ) : (
              <button type="button" onClick={() => navigate('/profile/edit')} className="btn btn-primary btn-sm">
                Upload Now
              </button>
            )}
          </div>

          {/* Document upload form */}
          <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Document sections */}
            {[
              { field: 'identityProof', label: 'Identity Proof', icon: FileText, desc: 'Aadhaar Card, PAN Card, or Driving License', accept: 'image/*,.pdf' },
              { field: 'addressProof', label: 'Address Proof', icon: FileText, desc: 'Aadhaar Card, Utility Bill, or Rent Agreement', accept: 'image/*,.pdf' },
            ].map(({ field, label, icon: Icon, desc, accept }) => (
              <div key={field}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Icon size={15} color="#3b82f6" />
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label} <span style={{ color: '#ef4444' }}>*</span></label>
                  {files[field] && <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Selected</span>}
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{desc}</p>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: files[field] ? '#f0fdf4' : '#f8fafc',
                  borderColor: files[field] ? '#86efac' : '#cbd5e1',
                  transition: 'all 0.15s',
                }}>
                  <Upload size={16} color={files[field] ? '#16a34a' : '#94a3b8'} />
                  <span style={{ fontSize: 13, color: files[field] ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                    {files[field] ? files[field].name : `Click to upload ${label}`}
                  </span>
                  <input type="file" accept={accept} onChange={(e) => handleFileChange(e, field)} style={{ display: 'none' }} />
                </label>
              </div>
            ))}

            {/* Work proofs */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ImageIcon size={15} color="#3b82f6" />
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  Work Proofs <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {files.workProofs.length > 0 && <span className="badge badge-green" style={{ fontSize: 10 }}>{files.workProofs.length} selected</span>}
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Upload at least 1 image of previous work (max 5)</p>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                border: '1.5px dashed #cbd5e1', borderRadius: 10, padding: '12px 16px',
                cursor: 'pointer', background: files.workProofs.length > 0 ? '#f0fdf4' : '#f8fafc',
                borderColor: files.workProofs.length > 0 ? '#86efac' : '#cbd5e1',
                transition: 'all 0.15s',
              }}>
                <Upload size={16} color={files.workProofs.length > 0 ? '#16a34a' : '#94a3b8'} />
                <span style={{ fontSize: 13, color: files.workProofs.length > 0 ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                  {files.workProofs.length > 0 ? `${files.workProofs.length} file(s) selected` : 'Click to upload work samples'}
                </span>
                <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'workProofs')} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Upload requirements */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Upload Requirements</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'High Resolution', desc: 'All text clearly visible' },
                  { label: 'Valid Dates', desc: 'Not expired (within 3 months)' },
                  { label: 'Full Frame', desc: 'All 4 corners visible' },
                ].map(({ label, desc }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <CheckCircle size={12} color="#22c55e" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-green btn-lg" style={{ justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Uploading Documents...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
