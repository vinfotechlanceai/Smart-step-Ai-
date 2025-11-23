export interface PotentialIssue {
  issue: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
  description: string;
}

export interface AnalysisResult {
  archType: 'Normal' | 'Flat' | 'High' | 'Unknown';
  potentialIssues: PotentialIssue[];
  summary: string;
  clinicalRecommendations: string[];
  footwearSuggestions: string[];
  confidenceScore: number;
}
