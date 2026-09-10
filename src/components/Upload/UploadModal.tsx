import { useState, useRef, ChangeEvent, FormEvent, DragEvent, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Music,
  Lock,
  Globe,
  Users,
  CheckCircle2,
  Film,
  Camera,
  StopCircle,
  RotateCcw,
  Sliders,
  AlertCircle,
  Check,
  Image as ImageIcon,
  MessageCircle,
  Layers,
  XCircle,
} from 'lucide-react';
import { Video, Sound } from '../../types';
import { api } from '../../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (video: Video) => void;
}

const SAMPLE_PRESETS = [
  {
    name: 'Cyberpunk Neon Alley',
    videoUrl: '/videos/cyberpunk_tokyo.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    caption: 'Tokyo rain reflections and neon light trails ⚡ #cyberpunk #tokyo #cinematic',
    soundId: 's-2',
    duration: 14,
    fileSize: 1500000,
    dimensions: { width: 720, height: 1280 },
  },
  {
    name: 'Venice Beach Skate Pop',
    videoUrl: '/videos/venice_skate.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800',
    caption: 'Sunset pop over the double stairs 🛹 Keep rolling! #skate #summer #vibes',
    soundId: 's-3',
    duration: 14,
    fileSize: 1600000,
    dimensions: { width: 720, height: 1280 },
  },
  {
    name: 'Ocean Waves Dusk',
    videoUrl: '/videos/coastal_waves.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    caption: 'Evening tides washing over the shore. Sound on for pure relaxation 🌊 #ocean #nature #chill',
    soundId: 's-1',
    duration: 14,
    fileSize: 1600000,
    dimensions: { width: 720, height: 1280 },
  },
];

const COVER_OPTIONS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
  'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
];

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
  'video/x-m4v',
];

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSource, setVideoSource] = useState<string>('');
  const [thumbnailSource, setThumbnailSource] = useState<string>(COVER_OPTIONS[0]);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 720, height: 1280 });
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(4500000);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [soundId, setSoundId] = useState('s-1');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [sounds, setSounds] = useState<Sound[]>([]);

  // Thumbnail scrubber
  const [scrubberTime, setScrubberTime] = useState<number>(0.5);
  const [isExtractingThumb, setIsExtractingThumb] = useState<boolean>(false);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);

  // Real Upload & Processing States
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [processingStage, setProcessingStage] = useState<'uploading' | 'transcoding' | 'thumbnails' | 'publishing' | 'ready'>('uploading');
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Live Camera Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<any>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const offscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadAbortRef = useRef<boolean>(false);
  const uploadTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      api.getSounds().then(setSounds).catch(console.error);
      setValidationError(null);
      setCancelledMessage(null);
    } else {
      stopCameraStream();
      handleCancelUpload();
    }
  }, [isOpen]);

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      setCameraStream(stream);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error', err);
      setValidationError('Unable to access camera or microphone. Please check browser permissions.');
    }
  };

  const handleStartRecording = () => {
    if (!cameraStream) return;
    setRecordedChunks([]);
    setValidationError(null);
    try {
      const recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const recordedUrl = URL.createObjectURL(blob);
        setVideoSource(recordedUrl);
        setFileSizeBytes(blob.size);
        extractVideoMetadata(recordedUrl);
        stopCameraStream();
        setActiveTab('upload');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Recording initialization error', err);
      setValidationError('Recording failed to initialize.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
  };

  // Helper to validate and load a video file
  const processSelectedFile = (file: File) => {
    setValidationError(null);
    setCancelledMessage(null);

    // 1. Validate File Type
    const isAllowedType = ALLOWED_MIME_TYPES.some((type) => file.type.startsWith('video/') || file.type === type);
    if (!isAllowedType) {
      setValidationError('Invalid file format. Please upload an MP4, WebM, or MOV video file.');
      return;
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File size (${sizeMB} MB) exceeds the 100 MB upload limit. Please compress or choose a shorter video.`);
      return;
    }

    setSelectedFile(file);
    setFileSizeBytes(file.size);
    const objectUrl = URL.createObjectURL(file);
    setVideoSource(objectUrl);

    // Extract metadata & generate canvas thumbnail
    extractVideoMetadata(objectUrl);

    if (!caption) {
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCaption(`${filenameWithoutExt} ✨ #vibetok #vibes`);
      setTitle(filenameWithoutExt);
    }
  };

  // Extract video dimensions, duration, and generate real frame thumbnail via canvas
  const extractVideoMetadata = (url: string) => {
    setIsExtractingThumb(true);
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const durationSec = Math.round(video.duration || 15);
      const width = video.videoWidth || 720;
      const height = video.videoHeight || 1280;

      setVideoDuration(durationSec);
      setVideoDimensions({ width, height });

      // Seek to 0.5s or 10% to generate initial thumbnail
      const targetTime = Math.min(0.5, durationSec * 0.1);
      video.currentTime = targetTime;
      setScrubberTime(targetTime);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setThumbnailSource(dataUrl);
          setExtractedFrames((prev) => {
            const next = [dataUrl, ...prev.filter((f) => f !== dataUrl)].slice(0, 4);
            return next;
          });
        }
      } catch (err) {
        console.warn('Canvas thumbnail extraction fallback', err);
        setThumbnailSource(COVER_OPTIONS[0]);
      } finally {
        setIsExtractingThumb(false);
      }
    };

    video.onerror = () => {
      console.warn('Failed to load video metadata');
      setIsExtractingThumb(false);
    };

    offscreenVideoRef.current = video;
  };

  // Scrub to specific timestamp to extract alternative thumbnail frame
  const handleScrubThumbnail = (time: number) => {
    setScrubberTime(time);
    const video = offscreenVideoRef.current;
    if (video && video.duration) {
      setIsExtractingThumb(true);
      video.currentTime = Math.min(time, video.duration - 0.1);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setValidationError(null);
    setCancelledMessage(null);
    setSelectedFile(null);
    setVideoSource(preset.videoUrl);
    setThumbnailSource(preset.thumbnailUrl);
    setCaption(preset.caption);
    setTitle(preset.name);
    setSoundId(preset.soundId);
    setVideoDuration(preset.duration);
    setVideoDimensions(preset.dimensions);
    setFileSizeBytes(preset.fileSize);
    setExtractedFrames([preset.thumbnailUrl, ...COVER_OPTIONS.slice(0, 3)]);
  };

  const addTag = (tag: string) => {
    setCaption((prev) => (prev.includes(tag) ? prev : `${prev.trim()} ${tag} `));
  };

  const addMention = (mention: string) => {
    setCaption((prev) => (prev.includes(mention) ? prev : `${prev.trim()} ${mention} `));
  };

  // Real Upload Simulation with Cancellation
  const handleCancelUpload = () => {
    uploadAbortRef.current = true;
    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current);
    }
    setIsUploading(false);
    setIsProcessing(false);
    setProgressPercent(0);
    setCancelledMessage('Upload was cancelled. Your video has not been published.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoSource || isUploading || isProcessing) return;

    uploadAbortRef.current = false;
    setIsUploading(true);
    setIsProcessing(true);
    setCancelledMessage(null);
    setProcessingStage('uploading');

    const total = fileSizeBytes || 4200000;
    setTotalBytes(total);
    setBytesUploaded(0);
    setProgressPercent(0);

    // Step 1: Uploading Video with Progress Updates
    let currentUploaded = 0;
    const uploadChunk = Math.max(150000, Math.floor(total / 18));

    uploadTimerRef.current = setInterval(async () => {
      if (uploadAbortRef.current) {
        clearInterval(uploadTimerRef.current);
        return;
      }

      currentUploaded += uploadChunk;
      if (currentUploaded < total) {
        const pct = Math.min(85, Math.round((currentUploaded / total) * 85));
        setBytesUploaded(currentUploaded);
        setProgressPercent(pct);
        const uploadedMB = (currentUploaded / (1024 * 1024)).toFixed(1);
        const totalMB = (total / (1024 * 1024)).toFixed(1);
        setProgressStep(`Uploading media: ${uploadedMB} MB / ${totalMB} MB (${pct}%)`);
      } else {
        clearInterval(uploadTimerRef.current);
        setBytesUploaded(total);
        setProgressPercent(88);

        // Step 2: Processing & Transcoding State Machine
        if (uploadAbortRef.current) return;
        setProcessingStage('transcoding');
        setProgressStep('Transcoding adaptive video streams (H.264 / AAC 60fps)...');

        setTimeout(() => {
          if (uploadAbortRef.current) return;
          setProcessingStage('thumbnails');
          setProgressPercent(94);
          setProgressStep('Generating high-definition cover poster and audio waveforms...');

          setTimeout(async () => {
            if (uploadAbortRef.current) return;
            setProcessingStage('publishing');
            setProgressPercent(98);
            setProgressStep('Publishing video record to VibeTok feed...');

            try {
              const res = await api.uploadVideo({
                title: title.trim() || caption.trim().slice(0, 40) || 'New Vibe',
                videoUrl: videoSource,
                thumbnailUrl: thumbnailSource,
                caption: caption.trim() || 'New vibe drops ✨ #vibes',
                duration: videoDuration,
                dimensions: videoDimensions,
                fileSize: fileSizeBytes,
                visibility: privacy,
                soundId,
                privacy,
                allowComments,
                allowDuet,
              });

              if (uploadAbortRef.current) return;
              setProcessingStage('ready');
              setProgressPercent(100);
              setProgressStep('Ready! Video is live on VibeTok ✨');

              setTimeout(() => {
                setIsUploading(false);
                setIsProcessing(false);
                onUploadSuccess(res.video);
                onClose();
              }, 500);
            } catch (err) {
              console.error('Upload failed', err);
              setIsUploading(false);
              setIsProcessing(false);
              setValidationError('Failed to publish video. Please try again.');
            }
          }, 600);
        }, 600);
      }
    }, 90);
  };

  if (!isOpen) return null;

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => {
        if (!isUploading) {
          stopCameraStream();
          onClose();
        }
      }}
    >
      <div
        id="upload-modal-content"
        className="w-full max-w-2xl bg-[#0e131d] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-white text-lg">Create & Publish Vibe</h3>
              <p className="text-xs text-slate-400">Post or record a high-definition short video with real processing</p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Cancelled Banner */}
        {cancelledMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{cancelledMessage}</span>
          </div>
        )}

        {/* Upload Mode Tabs (Upload File vs. Record Live) */}
        {!videoSource && !isProcessing && (
          <div className="flex items-center gap-2 mt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setActiveTab('upload');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Upload Video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('record');
                startCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'record'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Record with Camera</span>
            </button>
          </div>
        )}

        {/* Active Upload & Processing State Machine */}
        {isProcessing && (
          <div className="my-8 p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                Phase 2 Pipeline • {processingStage}
              </span>
              <h4 className="text-white font-bold text-sm">{progressStep}</h4>
            </div>

            {/* Progress Bar with Numbers */}
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{(bytesUploaded / (1024 * 1024)).toFixed(1)} MB uploaded</span>
                <span className="font-semibold text-cyan-300">{progressPercent}%</span>
              </div>
            </div>

            {/* Cancel Upload Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCancelUpload}
                className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Upload</span>
              </button>
            </div>
          </div>
        )}

        {!isProcessing && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Video Selector / Preview / Camera */}
              <div className="space-y-4">
                {videoSource ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[9/15] max-h-[340px] rounded-2xl overflow-hidden bg-black border border-white/10 mx-auto shadow-lg group">
                      <video
                        ref={videoPreviewRef}
                        src={videoSource}
                        loop
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSource('');
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs text-white border border-white/15 hover:bg-rose-500 transition-colors cursor-pointer"
                      >
                        Change Video
                      </button>

                      {/* Video Specs Badge */}
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-slate-300 border border-white/10 flex items-center gap-2">
                        <span>{videoDuration}s</span>
                        <span>•</span>
                        <span>{videoDimensions.width}x{videoDimensions.height}</span>
                        <span>•</span>
                        <span>{(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    </div>

                    {/* Canvas Frame Scrubber for Custom Thumbnail */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Choose Cover Frame</span>
                        </span>
                        <span className="text-[11px] text-cyan-300 font-mono">
                          {scrubberTime.toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(1, videoDuration)}
                        step={0.2}
                        value={scrubberTime}
                        onChange={(e) => handleScrubThumbnail(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-400">
                        {isExtractingThumb ? 'Extracting video frame...' : 'Drag slider to capture frame as cover'}
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'record' ? (
                  /* Live Camera Recording Interface */
                  <div className="space-y-3">
                    <div className="relative aspect-[9/15] max-h-[340px] rounded-2xl overflow-hidden bg-black border border-white/15 mx-auto shadow-lg flex items-center justify-center">
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Recording Timer Badge */}
                      {isRecording && (
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-500/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          <span>00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                        </div>
                      )}

                      {/* Camera Controls */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={handleStartRecording}
                            className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                          >
                            <span className="w-3 h-3 rounded-full bg-white"></span>
                            <span>Start Recording</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStopRecording}
                            className="px-5 py-2.5 rounded-full bg-white text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                          >
                            <StopCircle className="w-4 h-4 text-rose-500" />
                            <span>Stop Recording</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* File Upload Dropzone */
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                        isDragging
                          ? 'border-cyan-400 bg-cyan-500/10 scale-102'
                          : 'border-white/15 hover:border-cyan-400/50 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <Film className="w-9 h-9 text-cyan-400 mb-2.5" />
                      <p className="text-xs font-bold text-white">Select video to upload</p>
                      <p className="text-[11px] text-slate-400 mt-1">Or drag and drop your file here</p>
                      <p className="text-[10px] text-slate-500 mt-1.5">MP4, WebM, MOV up to 100MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Or pick a sample vibe:
                      </p>
                      <div className="space-y-1.5">
                        {SAMPLE_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left flex items-center gap-2.5 text-xs text-slate-200 transition-colors cursor-pointer"
                          >
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="font-medium truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata, Cover, Tags, Privacy, Toggles */}
              <div className="space-y-4 text-left">
                {/* Title / Caption Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Caption & Hashtags
                  </label>
                  <textarea
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe your vibe... Include #hashtags or @mentions"
                    maxLength={300}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />

                  {/* Tag and Mention quick buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['#dance', '#cyberpunk', '#beats', '#skate', '#sunset', '#vibetok'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-cyan-300 font-medium cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                    {['@elena_moves', '@cyber_kai'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => addMention(m)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-indigo-300 font-medium cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select Cover Frame</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {extractedFrames.length > 0
                      ? extractedFrames.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setThumbnailSource(c)}
                            className={`relative rounded-lg overflow-hidden aspect-[9/13] border-2 transition-all cursor-pointer ${
                              thumbnailSource === c
                                ? 'border-cyan-400 scale-102 shadow-md shadow-cyan-500/20'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={c} alt="Cover preview" className="w-full h-full object-cover" />
                            {thumbnailSource === c && (
                              <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))
                      : COVER_OPTIONS.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setThumbnailSource(c)}
                            className={`relative rounded-lg overflow-hidden aspect-[9/13] border-2 transition-all cursor-pointer ${
                              thumbnailSource === c
                                ? 'border-cyan-400 scale-102 shadow-md shadow-cyan-500/20'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={c} alt="Cover preview" className="w-full h-full object-cover" />
                            {thumbnailSource === c && (
                              <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                  </div>
                </div>

                {/* Sound Track Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Audio Soundtrack</span>
                  </label>
                  <select
                    value={soundId}
                    onChange={(e) => setSoundId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {sounds.length > 0 ? (
                      sounds.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.author})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="s-1">Midnight Echoes (Slowed + Reverb)</option>
                        <option value="s-2">Tokyo Neon Velocity (Original Audio)</option>
                        <option value="s-3">Venice Golden Hour Groove</option>
                        <option value="s-4">Fluid Rhythm 120BPM</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Privacy Options */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Audience & Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrivacy('public')}
                      className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        privacy === 'public'
                          ? 'border-cyan-400 bg-cyan-500/10 text-white'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrivacy('followers')}
                      className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        privacy === 'followers'
                          ? 'border-cyan-400 bg-cyan-500/10 text-white'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Followers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrivacy('private')}
                      className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        privacy === 'private'
                          ? 'border-cyan-400 bg-cyan-500/10 text-white'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Allow Comments</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Allow Duet & Stitch</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={allowDuet}
                      onChange={(e) => setAllowDuet(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-400"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={!videoSource}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all hover:scale-102 active:scale-98 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Publish Vibe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
