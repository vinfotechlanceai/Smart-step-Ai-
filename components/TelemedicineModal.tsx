import React, { useState, useEffect, Fragment } from 'react';
import { AnalysisResult, PotentialIssue } from '../types';
import { VideoCameraIcon, XIcon, CheckCircleIcon } from './IconComponents';

interface TelemedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
}

const TelemedicineModal: React.FC<TelemedicineModalProps> = ({ isOpen, onClose, analysisResult }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setName('');
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In a real app, you would send the data to a server here.
    console.log({
      name,
      email,
      analysisSummary: analysisSummaryForEmail,
    });
    setTimeout(() => {
      onClose();
    }, 3000); // Close modal after 3 seconds
  };

  const formatPotentialIssues = (issues: PotentialIssue[] | undefined): string => {
    if (!issues || issues.length === 0) {
      return 'None detected';
    }
    return issues.map(issue => `• ${issue.issue} (${issue.severity}): ${issue.description}`).join('\n');
  };

  const analysisSummaryForEmail = `--- AI Analysis Summary ---

Arch Type:
${analysisResult?.archType || 'N/A'}

Potential Issues:
${formatPotentialIssues(analysisResult?.potentialIssues)}

AI Summary:
${analysisResult?.summary || 'N/A'}

Footwear Suggestions:
${analysisResult?.footwearSuggestions?.map(s => `• ${s}`).join('\n') || 'N/A'}

Clinical Recommendations:
${analysisResult?.clinicalRecommendations?.map(s => `• ${s}`).join('\n') || 'N/A'}

Confidence Score: ${analysisResult?.confidenceScore || 'N/A'}%
  `;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="telemedicine-modal-title">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full">
                <VideoCameraIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 id="telemedicine-modal-title" className="text-lg font-bold text-slate-800 dark:text-white">
                  Telemedicine Consultation Request
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">A summary will be sent to the specialist.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close modal"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {isSubmitted ? (
            <div className="text-center py-12 px-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse"/>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Request Sent!</h3>
              <p className="text-slate-600 dark:text-slate-300 mt-2">A specialist will review your information and contact you via email shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Message (AI Summary Included)
                </label>
                <textarea
                  id="message"
                  rows={8}
                  readOnly
                  value={analysisSummaryForEmail}
                  className="mt-1 block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                 <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Request Consultation
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TelemedicineModal;
