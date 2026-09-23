/**
 * ClockInWidget — Camera punch-in / punch-out widget.
 * Opens camera, takes selfie, uploads with timestamp to mark attendance.
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../../api/attendance.api';
import { queryClient } from '../../config/queryClient';
import { getFileUrl } from '../../utils/fileUrl';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ClockInWidget() {
  const user = useAppSelector(selectUser);

  const [showCamera, setShowCamera]     = useState(false);
  const [punchType, setPunchType]       = useState(null); // 'in' | 'out'
  const [stream, setStream]             = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // data URL for preview
  const [capturedBlob, setCapturedBlob]   = useState(null); // blob to upload
  const [cameraError, setCameraError]   = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { data: todayAtt, isLoading } = useQuery({
    queryKey: ['att', 'today'],
    staleTime: 0,
    queryFn: async () => { const r = await attendanceApi.getToday(); return r.data.data; },
  });

  const punchMutation = useMutation({
    mutationFn: ({ type, blob }) =>
      type === 'in' ? attendanceApi.clockIn(blob) : attendanceApi.clockOut(blob),
    onSuccess: (_, { type }) => {
      toast.success(type === 'in' ? '✅ Punched in successfully!' : '✅ Punched out successfully!');
      closeCamera();
      queryClient.invalidateQueries({ queryKey: ['att'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Punch failed'),
  });

  // ── Open camera ─────────────────────────────────────────────────────────────
  const openCamera = useCallback(async (type) => {
    setPunchType(type);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCameraError('');
    setShowCamera(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera: ' + err.message);
      }
    }
  }, []);

  // ── Capture photo ────────────────────────────────────────────────────────────
  function capturePhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // Mirror horizontally (selfie style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);

    // Convert to blob
    canvas.toBlob((blob) => setCapturedBlob(blob), 'image/jpeg', 0.85);
  }

  // ── Retake ───────────────────────────────────────────────────────────────────
  function retake() {
    setCapturedPhoto(null);
    setCapturedBlob(null);
  }

  // ── Close camera ─────────────────────────────────────────────────────────────
  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setShowCamera(false);
    setPunchType(null);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCameraError('');
  }

  // ── Submit punch ─────────────────────────────────────────────────────────────
  function submitPunch() {
    if (!capturedBlob || !punchType) return;
    punchMutation.mutate({ type: punchType, blob: capturedBlob });
  }

  const today = format(new Date(), 'EEEE, dd MMM yyyy');

  return (
    <>
      {/* ── Main widget ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Today's Attendance</p>
            <p className="text-xs text-gray-400 mt-0.5">{today}</p>
            {!isLoading && todayAtt && (
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="text-xs text-gray-600">
                  In: <strong className="text-green-600">{todayAtt.clock_in}</strong>
                </span>
                {todayAtt.punch_in_photo && (
                  <a href={getFileUrl(todayAtt.punch_in_photo)} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline">📷 In-photo</a>
                )}
                {todayAtt.clock_out && (
                  <>
                    <span className="text-xs text-gray-600">
                      Out: <strong className="text-red-500">{todayAtt.clock_out}</strong>
                    </span>
                    {todayAtt.punch_out_photo && (
                      <a href={getFileUrl(todayAtt.punch_out_photo)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline">📷 Out-photo</a>
                    )}
                    {todayAtt.duration_mins && (
                      <span className="text-xs text-gray-400">
                        {Math.floor(todayAtt.duration_mins/60)}h {todayAtt.duration_mins%60}m
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            {!isLoading && !todayAtt && (
              <p className="text-xs text-gray-400 mt-1">Not punched in yet</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {isLoading ? (
              <div className="w-28 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : !todayAtt ? (
              <Button size="sm" onClick={() => openCamera('in')}
                className="bg-green-600 hover:bg-green-700 text-white border-0">
                📷 Punch In
              </Button>
            ) : !todayAtt.clock_out ? (
              <Button size="sm" variant="danger" onClick={() => openCamera('out')}>
                📷 Punch Out
              </Button>
            ) : (
              <span className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                ✓ Done for today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Camera overlay ───────────────────────────────────────────────────── */}
      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${punchType==='in'?'bg-green-600':'bg-red-500'}`}>
              <p className="text-white font-semibold text-sm">
                {punchType==='in' ? '📷 Punch In — Take Selfie' : '📷 Punch Out — Take Selfie'}
              </p>
              <button onClick={closeCamera} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>

            <div className="p-4 space-y-3">
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-2">📷</p>
                  <p className="text-sm text-red-700 font-medium">Camera Access Denied</p>
                  <p className="text-xs text-red-600 mt-1">{cameraError}</p>
                  <p className="text-xs text-gray-400 mt-2">Allow camera access in browser settings and try again.</p>
                </div>
              ) : (
                <>
                  {/* Live camera or captured preview */}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio:'4/3' }}>
                    {!capturedPhoto ? (
                      <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }} />
                    ) : (
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    )}
                    {/* Timestamp overlay */}
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono">
                      {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                  </div>

                  {/* Hidden canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Action buttons */}
                  {!capturedPhoto ? (
                    <button onClick={capturePhoto}
                      className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${punchType==='in'?'bg-green-600 hover:bg-green-700':'bg-red-500 hover:bg-red-600'}`}>
                      📸 Capture Photo
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={retake}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                        🔄 Retake
                      </button>
                      <button onClick={submitPunch} disabled={punchMutation.isPending}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${punchType==='in'?'bg-green-600 hover:bg-green-700':'bg-red-500 hover:bg-red-600'}`}>
                        {punchMutation.isPending
                          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Uploading...</span>
                          : punchType==='in' ? '✅ Confirm Punch In' : '✅ Confirm Punch Out'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
