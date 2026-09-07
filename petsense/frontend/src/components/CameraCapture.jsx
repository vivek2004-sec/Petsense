import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, Mic, MicOff, Circle, Square, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CameraCapture({ onImageCapture, onAudioCapture, showAudio = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [micActive, setMicActive]       = useState(false)
  const [recording, setRecording]       = useState(false)
  const [snapshot, setSnapshot]         = useState(null)
  const [error, setError]               = useState(null)
  const [countdown, setCountdown]       = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: showAudio,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
      if (showAudio) setMicActive(true)
    } catch (err) {
      setError(`Camera access denied: ${err.message}. Please allow camera access in your browser.`)
    }
  }, [showAudio])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setMicActive(false)
    setSnapshot(null)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return
    let count = 3
    setCountdown(count)
    const interval = setInterval(() => {
      count--
      if (count === 0) {
        clearInterval(interval)
        setCountdown(null)
        const canvas = canvasRef.current
        const video  = videoRef.current
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          const file = new File([blob], 'snapshot.jpg', { type: 'image/jpeg' })
          const url  = URL.createObjectURL(blob)
          setSnapshot(url)
          onImageCapture?.(file)
        }, 'image/jpeg', 0.92)
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  const startRecording = () => {
    if (!streamRef.current) return
    audioChunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' })
    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      onAudioCapture?.(file)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const resetSnapshot = () => {
    setSnapshot(null)
    onImageCapture?.(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl p-4 bg-rose/10 border border-rose/30 text-rose text-sm flex items-center gap-2">
          <CameraOff size={16} />
          {error}
        </div>
      )}

      {/* Video preview */}
      <div className="relative rounded-2xl overflow-hidden bg-navy-50 aspect-video">
        {cameraActive && !snapshot ? (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {/* Scanning overlay */}
            <div className="scan-overlay" />
            {/* Corner guides */}
            <div className="absolute inset-4 pointer-events-none">
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <div
                  key={pos}
                  className={`absolute w-8 h-8 border-2 border-teal rounded-sm
                    ${pos.includes('top') ? 'top-0' : 'bottom-0'}
                    ${pos.includes('left') ? 'left-0' : 'right-0'}
                    ${pos.includes('top-right') ? 'border-l-0 border-b-0' : ''}
                    ${pos.includes('bottom-left') ? 'border-r-0 border-t-0' : ''}
                    ${pos.includes('bottom-right') ? 'border-l-0 border-t-0' : ''}
                    ${pos === 'top-left' ? 'border-r-0 border-b-0' : ''}
                  `}
                />
              ))}
            </div>
            {countdown != null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <motion.span
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-8xl font-black text-teal"
                >
                  {countdown}
                </motion.span>
              </div>
            )}
          </>
        ) : snapshot ? (
          <img src={snapshot} alt="Captured pet" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/30">
            <Camera size={48} className="opacity-40" />
            <p className="text-sm">Camera not started</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!cameraActive ? (
          <button id="start-camera-btn" onClick={startCamera} className="btn-primary">
            <Camera size={16} />
            Start Camera
          </button>
        ) : (
          <>
            {!snapshot ? (
              <button id="capture-btn" onClick={takeSnapshot} disabled={countdown != null} className="btn-primary">
                <Circle size={16} />
                Capture Photo
              </button>
            ) : (
              <button id="retake-btn" onClick={resetSnapshot} className="btn-secondary">
                <RotateCcw size={16} />
                Retake
              </button>
            )}

            {showAudio && (
              !recording ? (
                <button id="start-recording-btn" onClick={startRecording} className="btn-secondary">
                  <Mic size={16} />
                  Record Audio
                </button>
              ) : (
                <button id="stop-recording-btn" onClick={stopRecording} className="btn-danger">
                  <Square size={14} />
                  Stop ({recordingTime}s)
                </button>
              )
            )}

            <button id="stop-camera-btn" onClick={stopCamera} className="btn-secondary">
              <CameraOff size={16} />
              Stop Camera
            </button>
          </>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4 justify-center text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-teal animate-pulse' : 'bg-white/20'}`} />
          Camera {cameraActive ? 'active' : 'off'}
        </span>
        {showAudio && (
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${recording ? 'bg-rose animate-pulse' : micActive ? 'bg-teal' : 'bg-white/20'}`} />
            Mic {recording ? 'recording' : micActive ? 'ready' : 'off'}
          </span>
        )}
      </div>
    </div>
  )
}
