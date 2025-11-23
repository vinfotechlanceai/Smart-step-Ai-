import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, PhotoIcon, RefreshIcon, WarningIcon, FootTopIcon, FootSideIcon, FootBackIcon } from './IconComponents';

type ViewKey = 'top' | 'side' | 'back';
type Step = 'idle' | ViewKey | 'done' | 'error';

interface LiveScannerProps {
  onImagesChange: (files: { top: File | null; side: File | null; back: File | null; }) => void;
  isAnalyzing: boolean;
}

const blobToFile = (theBlob: Blob, fileName: string): File => {
  return new File([theBlob], fileName, {
    lastModified: new Date().getTime(),
    type: theBlob.type,
  });
};

const STEPS_CONFIG: Record<ViewKey, { title: string; description: string; }> = {
    top: { title: 'Top View', description: 'Position your foot to match the outline from above.' },
    side: { title: 'Side View (Arch)', description: 'Show the inside arch of your foot.' },
    back: { title: 'Back View (Heel)', description: 'Show the back of your heel.' },
};

const SCAN_GUIDES: Record<ViewKey, { title: string; Icon: React.FC<{ className?: string }> }> = {
  top: { title: 'Top View', Icon: FootTopIcon },
  side: { title: 'Side View (Arch)', Icon: FootSideIcon },
  back: { title: 'Back View (Heel)', Icon: FootBackIcon },
};

const ScanAnimation: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewKey>('top');
    const [isFading, setIsFading] = useState(false);
    const views: ViewKey[] = ['top', 'side', 'back'];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentView(prevView => {
                    const nextIndex = (views.indexOf(prevView) + 1) % views.length;
                    return views[nextIndex];
                });
                setIsFading(false);
            }, 300); // fade out duration
        }, 2500); // time each view is shown + fade time

        return () => clearInterval(interval);
    }, []);

    const { title, Icon } = SCAN_GUIDES[currentView];

    return (
        <div className="flex flex-col items-center justify-center h-48 w-48 rounded-full bg-slate-100 dark:bg-slate-700/50 transition-colors duration-300">
            <div className={`text-center transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                <Icon className="w-20 h-20 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="mt-2 font-semibold text-sm text-slate-600 dark:text-slate-300">{title}</p>
            </div>
        </div>
    );
};

const PreviewThumbnail: React.FC<{ view: ViewKey; src: string | null }> = ({ view, src }) => (
    <div className="flex-1 text-center">
        <div className="aspect-square bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
            {src ? <img src={src} alt={`${view} preview`} className="w-full h-full object-contain rounded-lg" /> : <PhotoIcon className="w-8 h-8 text-slate-400" />}
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{STEPS_CONFIG[view].title}</p>
    </div>
);

const LiveScanner: React.FC<LiveScannerProps> = ({ onImagesChange, isAnalyzing }) => {
    const [step, setStep] = useState<Step>('idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [previews, setPreviews] = useState<Record<ViewKey, string | null>>({ top: null, side: null, back: null });
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const filesRef = useRef<Record<ViewKey, File | null>>({ top: null, side: null, back: null });

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const startScan = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            setStream(mediaStream);
            setStep('top');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setStep('error');
        }
    };

    // Attach stream to video element
    useEffect(() => {
        if (stream && videoRef.current) {
            // Only assign if it's different to avoid interrupting the stream
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
                // Ensure video plays (some browsers might pause on srcObject change)
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
        }
    }, [stream, step]);

    // Cleanup stream on component unmount
    useEffect(() => {
        return () => {
             // Note: we can't call stopStream here easily because it depends on `stream`
             // which might have changed. Rely on the direct stream check below if needed,
             // or the fact that setStep('idle') calls stopStream in handleReset.
             // For safety on unmount:
             if (stream) {
                stream.getTracks().forEach(t => t.stop());
             }
        };
    }, []);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || step === 'idle' || step === 'done' || step === 'error') return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Safety check to ensure video is ready
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob(blob => {
            if (blob) {
                const currentStep = step as ViewKey;
                const file = blobToFile(blob, `${currentStep}_capture.jpg`);
                
                // Update previews
                setPreviews(prev => ({ ...prev, [currentStep]: URL.createObjectURL(blob) }));
                
                // Update files ref and notify parent
                filesRef.current[currentStep] = file;
                onImagesChange({ ...filesRef.current });
                
                // Advance step
                const nextStepOrder: ViewKey[] = ['top', 'side', 'back'];
                const currentIndex = nextStepOrder.indexOf(currentStep);
                
                if (currentIndex < nextStepOrder.length - 1) {
                    setStep(nextStepOrder[currentIndex + 1]);
                } else {
                    setStep('done');
                    stopStream();
                }
            }
        }, 'image/jpeg', 0.9);
    }, [step, onImagesChange, stopStream]);

    const handleReset = () => {
        stopStream();
        setStep('idle');
        setPreviews({ top: null, side: null, back: null });
        filesRef.current = { top: null, side: null, back: null };
        onImagesChange({ top: null, side: null, back: null });
    };

    const isScanning = ['top', 'side', 'back'].includes(step);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-b-2xl shadow-lg w-full h-full flex flex-col min-h-[450px]">
            {step === 'idle' && (
                <div className="flex flex-col items-center justify-center text-center h-full p-6">
                    <ScanAnimation />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-6">Live Foot Scan</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-xs">
                        Follow the animated guide to capture three views of your foot using your camera.
                    </p>
                    <button
                        onClick={startScan}
                        disabled={isAnalyzing}
                        className="flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 transition-all"
                    >
                        <CameraIcon className="w-5 h-5 mr-2" />
                        Start Scan
                    </button>
                </div>
            )}

            {step === 'error' && (
                <div className="flex flex-col items-center justify-center h-full text-center bg-red-50 dark:bg-red-900/20 rounded-b-2xl p-6">
                    <WarningIcon className="w-16 h-16 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Camera Error</h3>
                    <p className="text-red-600 dark:text-red-400 mt-1 max-w-md">Could not access camera. Please check your browser permissions and try again.</p>
                    <button onClick={handleReset} className="mt-4 text-sm font-semibold text-sky-600 hover:underline">Try Again</button>
                </div>
            )}

            {isScanning && (
                <div className="p-4 flex flex-col h-full">
                    <div className="flex-grow relative flex items-center justify-center bg-black rounded-lg overflow-hidden">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover" 
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                            <div className="border-2 border-white/40 w-3/4 h-3/4 rounded-2xl opacity-70"></div>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                            {STEPS_CONFIG[step as ViewKey].title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {STEPS_CONFIG[step as ViewKey].description}
                        </p>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={handleReset}
                            disabled={isAnalyzing}
                            className="flex-shrink-0 flex items-center justify-center p-3 text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                            aria-label="Reset Scan"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleCapture}
                            disabled={isAnalyzing}
                            className="flex-grow flex items-center justify-center px-6 py-3 font-semibold text-white bg-sky-600 rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 transition"
                        >
                            <CameraIcon className="w-5 h-5 mr-2" />
                            Capture
                        </button>
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className="p-6 flex flex-col justify-center items-center h-full">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Captures Complete!</h3>
                    <div className="w-full flex gap-4 mb-6">
                        <PreviewThumbnail view="top" src={previews.top} />
                        <PreviewThumbnail view="side" src={previews.side} />
                        <PreviewThumbnail view="back" src={previews.back} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">Click "Analyze Foot" below to process the images, or retake them.</p>
                    <button
                        onClick={handleReset}
                        disabled={isAnalyzing}
                        className="flex items-center justify-center px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 disabled:bg-slate-400 transition"
                    >
                        <RefreshIcon className="w-5 h-5 mr-2" />
                        Retake Scans
                    </button>
                </div>
            )}
        </div>
    );
};

export default LiveScanner;