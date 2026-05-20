import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Star, CheckCircle, MapPin, MessageCircle, AlertCircle, Upload, XCircle, RotateCcw } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [myBid, setMyBid] = useState({ amount: '', proposal: '' });
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReview, setShowReview] = useState(false);
  const [revisionForm, setRevisionForm] = useState({ newPrice: '', reason: '' });
  const [showRevision, setShowRevision] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState([]);

  const beforeRef = useRef(null);
  const afterRef = useRef(null);

  const fetchProject = async () => {
    try {
      const [projRes, bidsRes, revRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/bids/${id}`),
        api.get(`/projects/${id}/revisions`),
      ]);
      setProject(projRes.data);
      setBids(bidsRes.data.bids || []);
      setRevisionHistory(revRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join_project', id);

      const handleRefresh = () => fetchProject();
      const handleNotification = (data) => {
        fetchProject();
      };
      const handlePayment = (data) => {
        fetchProject();
      };

      socket.on('refresh_project', handleRefresh);
      socket.on('notification', handleNotification);
      socket.on('payment_notification', handlePayment);

      return () => {
        socket.off('refresh_project', handleRefresh);
        socket.off('notification', handleNotification);
        socket.off('payment_notification', handlePayment);
      };
    }
  }, [socket, id]);

  const isClient = project?.client?._id === user?._id;
  const isWorker = project?.selectedWorker?._id === user?._id;
  const revisionsLeft = project ? project.maxRevisions - project.revisionCount : 0;
  const canRequestRevision = isWorker &&
    project?.status === 'in_progress' &&
    !project?.workCompletedByWorker &&
    project?.revisionStatus !== 'pending' &&
    project?.revisionCount < project?.maxRevisions;

  const submitBid = async (e) => {
    e.preventDefault();
    setBidLoading(true);
    try {
      await api.post('/bids', { projectId: id, ...myBid });
      toast.success('Bid submitted!');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bid');
    } finally { setBidLoading(false); }
  };

  const acceptBid = async (bidId) => {
    try {
      await api.put(`/projects/${id}/accept-bid`, { bidId });
      toast.success('Bid accepted! Escrow payment simulated.');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const markComplete = async () => {
    try {
      await api.put(`/projects/${id}/complete`);
      toast.success('Marked as completed!');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const releasePayment = async () => {
    try {
      const { data } = await api.put(`/projects/${id}/release-payment`);
      toast.success(`Payment released! Worker gets ₹${data.breakdown.workerEarnings}`);
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
const submitReview = async (e) => {
  e.preventDefault();
  try {
    await api.post('/reviews', { projectId: id, ...reviewForm });
    toast.success('Review submitted!');
    setShowReview(false);
    // Emit socket to update worker dashboard
    if (socket) {
      socket.emit('project_updated', id);
    }
    fetchProject();
  } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
};

  const requestRevision = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/projects/${id}/price-revision`, revisionForm);
      toast.success(`Price revision requested! (${data.revisionCount}/${data.maxRevisions})`);
      setShowRevision(false);
      setRevisionForm({ newPrice: '', reason: '' });
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const respondRevision = async (accept) => {
    try {
      await api.put(`/projects/${id}/price-revision`, { accept });
      toast.success(accept ? 'Price revision accepted!' : 'Price revision rejected');
      fetchProject();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    setCancelLoading(true);
    try {
      const { data } = await api.put(`/projects/${id}/cancel`, { reason: cancelReason });
      toast.success(`Project cancelled. ${data.refundIssued ? `₹${data.refundAmount} refunded to client.` : ''}`);
      setShowCancel(false);
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setCancelLoading(false); }
  };

  const uploadBeforeAfter = async () => {
    if (!beforePhoto && !afterPhoto) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      if (beforePhoto) formData.append('before', beforePhoto);
      if (afterPhoto) formData.append('after', afterPhoto);
      await api.post(`/uploads/before-after/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photos uploaded successfully!');
      setBeforePhoto(null);
      setAfterPhoto(null);
      fetchProject();
    } catch (err) {
      toast.error('Failed to upload photos');
    } finally { setPhotoUploading(false); }
  };

  if (loading) return <div className="text-center py-20 text-zinc-400">Loading project...</div>;
  if (!project) return <div className="text-center py-20 text-zinc-400">Project not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <div className="bg-white p-8 rounded-lg border border-zinc-200 shadow-sm mb-8">

        {/* Project Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-900">{project.title}</h1>
            <p className="text-zinc-500 mt-2">{project.description}</p>
            <div className="flex gap-4 mt-4 text-sm text-zinc-500 flex-wrap">
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">{project.skill}</span>
              <span className="flex items-center gap-1"><MapPin size={14}/> {project.location}</span>
              <span>Budget: <strong className="text-indigo-600">₹{project.budget}</strong></span>
              {project.agreedPrice > 0 && (
                <span>Agreed: <strong className="text-green-600">₹{project.agreedPrice}</strong></span>
              )}
              {project.finalPrice !== project.agreedPrice && project.finalPrice > 0 && (
                <span>Final: <strong className="text-purple-600">₹{project.finalPrice}</strong></span>
              )}
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            project.status === 'open' ? 'bg-green-100 text-green-700' :
            project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
            project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-zinc-100 text-zinc-600'
          }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Cancelled Banner */}
        {project.status === 'cancelled' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={18} className="text-red-600" />
              <h3 className="font-bold text-red-800">Project Cancelled</h3>
            </div>
            <p className="text-red-700 text-sm">Cancelled by: <strong>{project.cancelledBy}</strong></p>
            <p className="text-red-600 text-sm mt-0.5">Reason: {project.cancellationReason}</p>
            {project.refundIssued && (
              <p className="text-green-700 font-medium mt-2">
                ✅ ₹{project.agreedPrice} refunded to client (simulated)
              </p>
            )}
          </div>
        )}

        {/* Escrow status */}
        {project.escrowPaid && project.status !== 'cancelled' && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">✅ Escrow paid — ₹{project.agreedPrice} held by platform</p>
          </div>
        )}

        {/* Price Revision — pending shown to client */}
        {project.revisionStatus === 'pending' && isClient && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-yellow-600" />
              <h3 className="font-bold text-yellow-800">
                Worker Requested Price Revision ({project.revisionCount}/{project.maxRevisions})
              </h3>
            </div>
            <p className="text-yellow-700 text-sm mb-1">
              Current price: <strong>₹{project.finalPrice || project.agreedPrice}</strong> →
              Requested: <strong>₹{project.revisedPrice}</strong>
            </p>
            <div className="flex gap-3 mt-3">
              <button onClick={() => respondRevision(true)}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                ✅ Accept New Price
              </button>
              <button onClick={() => respondRevision(false)}
                className="bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">
                ❌ Reject
              </button>
            </div>
          </div>
        )}

        {/* Revision pending — shown to worker */}
        {project.revisionStatus === 'pending' && isWorker && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-700 font-medium">
              ⏳ Revision {project.revisionCount}/{project.maxRevisions} — ₹{project.revisedPrice} pending client approval...
            </p>
          </div>
        )}

        {/* Revision accepted */}
        {project.revisionStatus === 'accepted' && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 font-medium">✅ Price revision accepted — Final price: ₹{project.finalPrice}</p>
          </div>
        )}

        {/* Revision rejected */}
        {project.revisionStatus === 'rejected' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <p className="text-red-700 font-medium">
                ❌ Revision rejected — Original price ₹{project.agreedPrice} applies
              </p>
              {isWorker && revisionsLeft > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  {revisionsLeft} revision(s) left
                </span>
              )}
              {isWorker && revisionsLeft === 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                  No revisions left
                </span>
              )}
            </div>
          </div>
        )}

        {/* Revision History */}
        {revisionHistory.length > 0 && (
          <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
            <h3 className="font-bold text-zinc-700 mb-3 text-sm flex items-center gap-2">
              <RotateCcw size={14} /> Price Revision History ({revisionHistory.length}/{project.maxRevisions})
            </h3>
            <div className="space-y-2">
              {revisionHistory.map((rev, i) => (
                <div key={i} className="flex justify-between items-center bg-white rounded-lg p-3 border border-zinc-100 text-sm">
                  <div>
                    <p className="text-zinc-700">
                      Revision {revisionHistory.length - i}: ₹{rev.oldPrice} → <strong>₹{rev.newPrice}</strong>
                    </p>
                    <p className="text-zinc-400 text-xs mt-0.5">{rev.reason}</p>
                    <p className="text-zinc-300 text-xs">{new Date(rev.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    rev.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    rev.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {rev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment breakdown */}
        {project.paymentReleased && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-bold text-indigo-800 mb-2">Payment Summary</h3>
            <div className="text-sm space-y-1">
              <p>Total Price: <strong>₹{project.finalPrice}</strong></p>
              <p>Platform Fee (5%): <strong className="text-red-600">-₹{project.platformFee}</strong></p>
              <p>Worker Earnings: <strong className="text-green-600">₹{project.workerEarnings}</strong></p>
            </div>
          </div>
        )}


        {/* Action Buttons */}
        {project.status !== 'cancelled' && (
          <div className="flex gap-3 mt-6 flex-wrap">
            {(isClient || isWorker) && project.status !== 'open' && (
              <Link to={`/chat/${project._id}`}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700">
                <MessageCircle size={18}/> Open Chat
              </Link>
            )}

            {/* Worker actions */}
            {isWorker && project.status === 'in_progress' && (
              <>
                {!project.workCompletedByWorker && (
                  <button onClick={markComplete}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700">
                    Mark Work as Completed
                  </button>
                )}
                {canRequestRevision && (
                  <button onClick={() => setShowRevision(!showRevision)}
                    className="bg-yellow-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-600">
                    Request Revision ({revisionsLeft} left)
                  </button>
                )}
                {/* Cancel option for worker */}
                {!project.workCompletedByWorker && (
                  <button onClick={() => setShowCancel(!showCancel)}
                    className="bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-600 flex items-center gap-2">
                    <XCircle size={16}/> Cancel Project
                  </button>
                )}
              </>
            )}

            {/* Client actions */}
            {isClient && project.status === 'in_progress' && !project.workCompletedByWorker && (
              <button onClick={() => setShowCancel(!showCancel)}
                className="bg-red-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-600 flex items-center gap-2">
                <XCircle size={16}/> Cancel Project
              </button>
            )}
            {isClient && project.workCompletedByWorker && !project.paymentReleased && (
              <button onClick={releasePayment}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700">
                Release Payment (₹{project.finalPrice})
              </button>
            )}
            {isClient && project.paymentReleased && !showReview && (
              <button onClick={() => setShowReview(true)}
                className="bg-yellow-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-600">
                Leave Review
              </button>
            )}
          </div>
        )}

        {/* Cancel Form */}
        {showCancel && (
          <form onSubmit={handleCancel} className="mt-6 bg-red-50 p-5 rounded-lg border border-red-200">
            <h3 className="font-bold text-red-800 mb-1">Cancel Project</h3>
            {project.escrowPaid && (
              <p className="text-green-700 text-sm mb-3 bg-green-50 px-3 py-2 rounded-lg">
                ✅ ₹{project.agreedPrice} will be refunded to client (simulated)
              </p>
            )}
            <div className="mb-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Reason for cancellation</label>
              <textarea rows={2} required value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="e.g. Price not agreed, unable to do the work at this price..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={cancelLoading}
                className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button type="button" onClick={() => setShowCancel(false)}
                className="bg-zinc-200 text-zinc-700 px-5 py-2 rounded-lg font-semibold hover:bg-zinc-300">
                Go Back
              </button>
            </div>
          </form>
        )}

        {/* Price Revision Form */}
        {showRevision && (
          <form onSubmit={requestRevision} className="mt-6 bg-yellow-50 p-5 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-zinc-800 mb-1">Request Price Revision</h3>
            <p className="text-sm text-zinc-500 mb-3">
              Current price: <strong>₹{project.finalPrice || project.agreedPrice}</strong> ·
              Revision {project.revisionCount + 1} of {project.maxRevisions}
            </p>
            <div className="mb-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">New Price (₹)</label>
              <input type="number" required value={revisionForm.newPrice}
                onChange={e => setRevisionForm({...revisionForm, newPrice: e.target.value})}
                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. 1100"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Reason</label>
              <textarea rows={2} required value={revisionForm.reason}
                onChange={e => setRevisionForm({...revisionForm, reason: e.target.value})}
                className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g. Found additional damage that needs repair"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit"
                className="bg-yellow-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-600">
                Send Request
              </button>
              <button type="button" onClick={() => setShowRevision(false)}
                className="bg-zinc-200 text-zinc-700 px-5 py-2 rounded-lg font-semibold hover:bg-zinc-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Before/After Photo Upload */}
        {isWorker && project.status === 'in_progress' && (
          <div className="mt-6 bg-zinc-50 p-5 rounded-lg border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-1">Upload Before/After Photos</h3>
            <p className="text-sm text-zinc-500 mb-4">Show your work quality to build trust</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">Before Photo</p>
                <div onClick={() => beforeRef.current.click()}
                  className="border-2 border-dashed border-zinc-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-all">
                  {beforePhoto ? (
                    <img src={URL.createObjectURL(beforePhoto)} alt="Before"
                      className="w-full h-28 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4">
                      <Upload size={24} className="text-zinc-300 mx-auto mb-1" />
                      <p className="text-xs text-zinc-400">Click to upload</p>
                    </div>
                  )}
                </div>
                <input ref={beforeRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setBeforePhoto(e.target.files[0])} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">After Photo</p>
                <div onClick={() => afterRef.current.click()}
                  className="border-2 border-dashed border-zinc-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-all">
                  {afterPhoto ? (
                    <img src={URL.createObjectURL(afterPhoto)} alt="After"
                      className="w-full h-28 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4">
                      <Upload size={24} className="text-zinc-300 mx-auto mb-1" />
                      <p className="text-xs text-zinc-400">Click to upload</p>
                    </div>
                  )}
                </div>
                <input ref={afterRef} type="file" accept="image/*" className="hidden"
                  onChange={e => setAfterPhoto(e.target.files[0])} />
              </div>
            </div>
            {(beforePhoto || afterPhoto) && (
              <button onClick={uploadBeforeAfter} disabled={photoUploading}
                className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {photoUploading ? 'Uploading...' : 'Upload Photos'}
              </button>
            )}
          </div>
        )}

        {/* Display Submitted Work (for both client and worker) */}
        {project.submittedWork?.length > 0 && (
          <div className="mt-6 bg-zinc-50 p-5 rounded-lg border border-zinc-200">
            <h3 className="font-bold text-zinc-800 mb-1">Submitted Work Photos</h3>
            <p className="text-sm text-zinc-500 mb-4">Photos uploaded by the worker as proof of work.</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {project.submittedWork.map((photoUrl, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-48 border border-zinc-200 rounded-lg overflow-hidden">
                  <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={photoUrl} alt={`Submitted Work ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review form */}
        {showReview && (
          <form onSubmit={submitReview} className="mt-6 bg-yellow-50 p-5 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-zinc-800 mb-3">Leave a Review</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Rating</label>
              <select value={reviewForm.rating}
                onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                className="border border-zinc-300 rounded-lg px-3 py-2">
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <textarea rows={3} required value={reviewForm.comment}
              onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
              placeholder="Share your experience..."
              className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button type="submit"
              className="bg-yellow-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-600">
              Submit Review
            </button>
          </form>
        )}
      </div>

      {/* Bids section */}
      {project.status === 'open' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {!isClient && (
            <div className="bg-white p-6 rounded-lg border border-zinc-100 shadow-sm">
              <h2 className="text-lg font-medium text-zinc-800 mb-4">Submit Your Bid</h2>
              <form onSubmit={submitBid} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Your Bid (₹)</label>
                  <input type="number" required value={myBid.amount}
                    onChange={e => setMyBid({...myBid, amount: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">Proposal</label>
                  <textarea rows={3} required value={myBid.proposal}
                    onChange={e => setMyBid({...myBid, proposal: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Why are you the best for this job?"
                  />
                </div>
                <button type="submit" disabled={bidLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {bidLoading ? 'Submitting...' : 'Submit Bid'}
                </button>
              </form>
            </div>
          )}

          {isClient && (
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-zinc-100 shadow-sm">
              <h2 className="text-lg font-medium text-zinc-800 mb-4">
                Bids Received ({bids.length} shown, ranked by algorithm)
              </h2>
              {bids.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No bids yet</p>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid, i) => (
                    <div key={bid._id} className="border border-zinc-100 rounded-lg p-5 hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                            {i + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link to={`/workers/${bid.worker._id}`}
                                className="font-bold text-zinc-800 hover:text-indigo-600">
                                {bid.worker.name}
                              </Link>
                              {bid.worker.isVerified && <CheckCircle size={14} className="text-green-500" />}
                            </div>
                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                              <Star size={12} fill="currentColor" />
                              <span className="text-zinc-600">{bid.worker.avgRating || 'New'}</span>
                              <span className="text-zinc-400 text-xs ml-2">{bid.worker.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-indigo-600">₹{bid.amount}</p>
                          <p className="text-xs text-zinc-400">Rank score: {bid.rankScore}</p>
                        </div>
                      </div>
                      <p className="text-zinc-600 text-sm mt-3">{bid.proposal}</p>
                      <div className="mt-3 bg-zinc-50 rounded-lg p-3 text-xs text-zinc-500">
                        <p className="font-medium text-zinc-700 mb-1">Why this ranking?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(bid.rankBreakdown || {}).map(([key, val]) => (
                            <span key={key} className="bg-white rounded px-2 py-1 border border-zinc-100">
                              {key.replace(/([A-Z])/g, ' $1')}: {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => acceptBid(bid._id)}
                        className="mt-3 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                        Accept This Bid
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}