import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import LiveScanner from './components/LiveScanner';
import AnalysisDashboard from './components/AnalysisDashboard';
import TelemedicineModal from './components/TelemedicineModal';
import { analyzeFootImage } from './services/geminiService';
import { AnalysisResult } from './types';
import { FootIcon, SparklesIcon, UploadIcon, CameraIcon } from './components/IconComponents';

type InputMode = 'upload' | 'scan';

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('upload');
  const [imageFiles, setImageFiles] = useState<{
    top: File | null;
    side: File | null;
    back: File | null;
  }>({ top: null, side: null, back: null });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTelemedicineModalOpen, setIsTelemedicineModalOpen] = useState<boolean>(false);

  const handleImagesChange = useCallback((files: { top: File | null; side: File | null; back: File | null; }) => {
    setImageFiles(files);
    setAnalysisResult(null);
    setError(null);
  }, []);

  const handleAnalyzeClick = async () => {
    const imagesToAnalyze = Object.fromEntries(
      Object.entries(imageFiles).filter(([_, value]) => value !== null)
    );

    if (Object.keys(imagesToAnalyze).length === 0) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeFootImage(imagesToAnalyze);
      setAnalysisResult(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const openTelemedicineModal = () => setIsTelemedicineModalOpen(true);
  const closeTelemedicineModal = () => setIsTelemedicineModalOpen(false);

  const atLeastOneImageProvided = Object.values(imageFiles).some(f => f !== null);

  const ModeButton: React.FC<{
    active: boolean;
    onClick: () => void;
    Icon: React.ElementType;
    label: string;
  }> = ({ active, onClick, Icon, label }) => (
      <button
          onClick={onClick}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-sky-500 ${
              active 
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400' 
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-pressed={active}
      >
          <Icon className="w-5 h-5" />
          {label}
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto flex-grow w-full">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3">
             <FootIcon className="w-10 h-10 text-sky-500" />
             <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-white">SmartStep AI</h1>
          </div>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Get AI-powered insights into your foot health.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-0">
            <div className="flex">
                <ModeButton 
                    active={mode === 'upload'}
                    onClick={() => setMode('upload')}
                    Icon={UploadIcon}
                    label="Upload Photos"
                />
                <ModeButton 
                    active={mode === 'scan'}
                    onClick={() => setMode('scan')}
                    Icon={CameraIcon}
                    label="Live Scan"
                />
            </div>
            
            <div className="flex-grow">
              {mode === 'upload' ? (
                <ImageUploader onImagesChange={handleImagesChange} isAnalyzing={isLoading} />
              ) : (
                <LiveScanner onImagesChange={handleImagesChange} isAnalyzing={isLoading} />
              )}
            </div>

            <button
              onClick={handleAnalyzeClick}
              disabled={!atLeastOneImageProvided || isLoading}
              className="flex items-center justify-center w-full px-6 py-4 mt-8 text-lg font-semibold text-white bg-sky-600 rounded-xl shadow-md hover:bg-sky-700 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6 mr-2" />
                  Analyze Foot
                </>
              )}
            </button>
          </div>
          <div>
            <AnalysisDashboard 
              result={analysisResult} 
              isLoading={isLoading} 
              error={error} 
              onOpenTelemedicine={openTelemedicineModal} 
            />
          </div>
        </main>
      </div>
      
      <footer className="mt-12 py-6 text-center border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
              Innovated by <span className="font-semibold text-sky-600 dark:text-sky-400">Vishnu P</span>
          </p>
      </footer>

      <TelemedicineModal
        isOpen={isTelemedicineModalOpen}
        onClose={closeTelemedicineModal}
        analysisResult={analysisResult}
      />
    </div>
  );
};

export default App;