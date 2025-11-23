import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

// FIX: Removed `as string` to align with coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type FootImages = Partial<{
  top: File;
  side: File;
  back: File;
}>

// Utility function to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeFootImage = async (imageFiles: FootImages): Promise<AnalysisResult> => {
  try {
    const providedViews = Object.keys(imageFiles).filter(key => imageFiles[key as keyof FootImages]);
    
    if (providedViews.length === 0) {
        throw new Error("No images were provided for analysis.");
    }

    const initialPrompt = `You are a world-class AI podiatry assistant called SmartStep. Your task is to perform a detailed analysis of a human foot from a set of images. These images were taken while the user was standing to capture the foot's shape under natural weight-bearing conditions.

You have been provided with the following views: ${providedViews.join(', ')}. Your analysis will be limited by any missing views. Perform the most thorough analysis possible with the available images and clearly state any limitations in your summary. If a specific view required for a task (e.g., side view for arch type) is missing, state the result as 'Unknown' and explain why.

- Use the **Side View** (if available) to primarily determine the foot arch type.
- Use the **Top View** (if available) to identify issues like bunions, hammertoes, or toe alignment.
- Use the **Back View** (if available) to assess heel alignment (e.g., pronation or supination).

Provide a comprehensive analysis covering the following points:
1.  **Foot Arch Type**: Determine if the arch is normal, flat (pes planus), or high (pes cavus).
2.  **Potential Deformities/Issues**: Identify any visible signs of common foot conditions. For each issue, provide:
    a. The name of the issue.
    b. An estimated severity level (Mild, Moderate, Severe, or Unknown).
    c. A brief description of the finding and which view it was most apparent in.
3.  **Overall Summary**: A concise summary of your findings, written in clear, easy-to-understand language.
4.  **Clinical Recommendations**: A list of 2-3 potential clinical recommendations for a healthcare professional.
5.  **Footwear Suggestions**: A list of 2-3 specific types of footwear or shoe features that would be beneficial.
6.  **Confidence Score**: An overall confidence score (0-100) for this analysis. Base this score on the quality of the images AND the number of views provided (more views should generally lead to higher confidence).

IMPORTANT: Your response must be in a clean JSON format. Do not include any markdown formatting or explanations outside of the JSON structure.`;

    const imageParts = [];
    if (imageFiles.top) {
        imageParts.push({ text: "Top View of the foot:" }, await fileToGenerativePart(imageFiles.top));
    }
    if (imageFiles.side) {
        imageParts.push({ text: "Side View (Arch) of the foot:" }, await fileToGenerativePart(imageFiles.side));
    }
    if (imageFiles.back) {
        imageParts.push({ text: "Back View (Heel) of the foot:" }, await fileToGenerativePart(imageFiles.back));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Changed `contents` to be an object for a single-turn request, as per guidelines.
      contents: {
        parts: [
          { text: initialPrompt },
          ...imageParts,
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            archType: {
              type: Type.STRING,
              description: "The estimated type of the foot arch (Normal, Flat, High, Unknown).",
              enum: ["Normal", "Flat", "High", "Unknown"],
            },
            potentialIssues: {
              type: Type.ARRAY,
              description: "A list of potential issues or deformities observed.",
              items: {
                type: Type.OBJECT,
                properties: {
                  issue: { type: Type.STRING, description: "The name of the potential issue." },
                  severity: {
                    type: Type.STRING,
                    description: "The estimated severity of the issue.",
                    enum: ["Mild", "Moderate", "Severe", "Unknown"],
                  },
                  description: { type: Type.STRING, description: "A brief description of the finding and which view it was most apparent in (e.g., Top View, Side View, Back View)." },
                },
                required: ["issue", "severity", "description"],
              },
            },
            summary: {
              type: Type.STRING,
              description: "A detailed summary of the analysis.",
            },
            clinicalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of potential clinical recommendations for a healthcare professional.",
            },
            footwearSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of suggested footwear types or features.",
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "An overall confidence score (0-100) for the analysis.",
            },
          },
          required: ["archType", "potentialIssues", "summary", "clinicalRecommendations", "footwearSuggestions", "confidenceScore"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to analyze the image. The AI model may be unavailable or the image could not be processed.");
  }
};