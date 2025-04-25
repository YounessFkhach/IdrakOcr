import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable must be set");
}

const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function extractTextWithGemini(base64Image: string): Promise<string> {
  try {
    // For Gemini Pro Vision
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
    
    const prompt = "Extract all text from this image. Format the result as markdown with appropriate headers, lists, tables, etc. Preserve the layout and structure of the document as much as possible.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);
    
    const response = await result.response;
    return response.text() || "No text extracted";
  } catch (error) {
    console.error("Gemini text extraction error:", error);
    throw new Error(`Failed to extract text with Gemini: ${error.message}`);
  }
}

export async function compareAndMergeResults(
  geminiData: string,
  gptData: string,
  customPrompt?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = customPrompt 
      ? `${customPrompt}\n\nHere are two extractions of the same document:\n\nExtraction 1 (Gemini):\n${geminiData}\n\nExtraction 2 (GPT):\n${gptData}\n\nPlease analyze both extractions and create a merged, improved version that takes the most accurate parts from each.`
      : `You are an expert OCR analyst. Here are two AI-extracted versions of the same document:\n\nExtraction 1 (Gemini):\n${geminiData}\n\nExtraction 2 (GPT):\n${gptData}\n\nPlease analyze both extractions and create a merged, improved version that takes the most accurate parts from each. Your goal is to produce the most complete and accurate representation of the original document. Format your response in markdown with appropriate headers, lists, tables, etc. to preserve the structure.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Failed to merge results";
  } catch (error) {
    console.error("Gemini comparison error:", error);
    throw new Error(`Failed to compare and merge results with Gemini: ${error.message}`);
  }
}
