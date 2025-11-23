import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircleIcon, WarningIcon, FootIcon, ClipboardIcon, VideoCameraIcon, InformationCircleIcon, ShoeIcon } from './IconComponents';

interface AnalysisDashboardProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onOpenTelemedicine: () => void;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500 mb-4"></div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Analyzing Image...</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Our AI is examining your foot. This may take a moment.</p>
    </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
    <div className="flex flex-col items-center justify-center h-full text-center bg-red-50 dark:bg-red-900/20 rounded-2xl p-6">
        <WarningIcon className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Analysis Failed</h3>
        <p className="text-red-600 dark:text-red-400 mt-1 max-w-md">{error}</p>
    </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <FootIcon className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Awaiting Analysis</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Upload an image and click "Analyze" to see the results here.</p>
    </div>
);

const SeverityBadge: React.FC<{ severity: 'Mild' | 'Moderate' | 'Severe' | 'Unknown' }> = ({ severity }) => {
    const severityStyles = {
        'Mild': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'Moderate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'Severe': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'Unknown': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${severityStyles[severity]}`}>
            {severity}
        </span>
    );
};

const ResultDisplay: React.FC<{ result: AnalysisResult; onOpenTelemedicine: () => void; }> = ({ result, onOpenTelemedicine }) => {
    const archTypeColor = {
        'Normal': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'Flat': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        'High': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'Unknown': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    }[result.archType];

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analysis Results</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Confidence:</span>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-sky-500 h-2 rounded-full" 
                                style={{ width: `${result.confidenceScore}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{result.confidenceScore}%</span>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Arch Type</p>
                        <p className={`text-lg font-bold px-3 py-1 mt-1 rounded-full inline-block ${archTypeColor}`}>{result.archType}</p>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-700" />

                    <div>
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                            <InformationCircleIcon className="w-5 h-5 mr-2 text-sky-500" />
                            Potential Issues
                        </h3>
                        {result.potentialIssues.length > 0 ? (
                            <ul className="space-y-3">
                                {result.potentialIssues.map((issue, index) => (
                                    <li key={index} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">{issue.issue}</span>
                                            <SeverityBadge severity={issue.severity} />
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{issue.description}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center">
                               <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                               <p className="text-slate-600 dark:text-slate-300">No major issues detected.</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">AI Summary</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                            {result.summary}
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                            <ShoeIcon className="w-5 h-5 mr-2" />
                            Footwear Suggestions
                        </h3>
                         <ul className="space-y-2">
                            {result.footwearSuggestions.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 text-sm">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-sky-50 dark:bg-sky-900/30 p-4 rounded-lg border border-sky-200 dark:border-sky-800">
                        <h3 className="text-md font-semibold text-sky-800 dark:text-sky-200 mb-3 flex items-center">
                            <ClipboardIcon className="w-5 h-5 mr-2" />
                            AI Clinical Insights
                        </h3>
                         <ul className="space-y-2">
                            {result.clinicalRecommendations.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 text-sm">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-4">
                    Disclaimer: This AI analysis is not a substitute for professional medical advice.
                </p>
                <button
                    onClick={onOpenTelemedicine}
                    className="flex items-center justify-center w-full px-5 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
                >
                    <VideoCameraIcon className="w-6 h-6 mr-2" />
                    Connect with a Specialist
                </button>
            </div>
        </div>
    );
};


const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result, isLoading, error, onOpenTelemedicine }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-full h-full flex flex-col">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : result ? (
        <ResultDisplay result={result} onOpenTelemedicine={onOpenTelemedicine} />
      ) : (
        <InitialState />
      )}
    </div>
  );
};

export default AnalysisDashboard;
