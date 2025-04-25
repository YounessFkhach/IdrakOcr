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
    // For Gemini Vision
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro-exp-03-25",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const prompt = `Extract all text from this image. Format the extracted text as markdown with appropriate headers, lists, tables, etc. Preserve the layout and structure of the document as much as possible.

Respond with a JSON object that follows this exact structure:
{
  "text": "the extracted text in markdown format",
  "confidence": 0.0-1.0,
  "metadata": {
    "image_quality": "description of image quality",
    "content_type": "document type detected"
  }
}`;
    
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
    const responseText = response.text() || JSON.stringify({ 
      text: "No text extracted", 
      confidence: 0, 
      metadata: { 
        image_quality: "unknown", 
        content_type: "unknown" 
      } 
    });
    
    // Validate that the response is in JSON format
    try {
      JSON.parse(responseText);
      return responseText;
    } catch (e) {
      // If not valid JSON, wrap the text in a valid JSON format
      return JSON.stringify({ 
        text: responseText, 
        confidence: 0.5, 
        metadata: { 
          image_quality: "unknown", 
          content_type: "extracted text not in JSON format" 
        } 
      });
    }
  } catch (error: any) {
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
    // Parse the JSON responses if they are in JSON format
    let geminiText = geminiData;
    let gptText = gptData;
    
    try {
      const geminiJson = JSON.parse(geminiData);
      if (geminiJson && geminiJson.text) {
        geminiText = geminiJson.text;
      }
    } catch (e) {
      // Not JSON format, use as is
    }
    
    try {
      const gptJson = JSON.parse(gptData);
      if (gptJson && gptJson.text) {
        gptText = gptJson.text;
      }
    } catch (e) {
      // Not JSON format, use as is
    }
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro-exp-03-25",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const promptPrefix = customPrompt 
      ? `${customPrompt}\n\nHere are two extractions of the same document:\n\n`
      : `Here are two AI-extracted versions of the same document:\n\n`;
    
    const prompt = `${promptPrefix}Extraction 1 (Gemini):\n${geminiText}\n\nExtraction 2 (GPT):\n${gptText}\n\nAnalyze both extractions and create a merged, improved version that takes the most accurate parts from each.

Respond with a JSON object that follows this exact structure:
{
  "mergedText": "the merged text in markdown format",
  "analysis": {
    "geminiScore": 0.0-1.0,
    "gptScore": 0.0-1.0,
    "reasoning": "explanation of merge decisions"
  }
}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text() || JSON.stringify({ 
      mergedText: "Failed to merge results", 
      analysis: { 
        geminiScore: 0, 
        gptScore: 0, 
        reasoning: "No content returned from AI" 
      } 
    });
    
    // Validate that the response is in JSON format
    try {
      JSON.parse(responseText);
      return responseText;
    } catch (e) {
      // If not valid JSON, wrap the text in a valid JSON format
      return JSON.stringify({ 
        mergedText: responseText, 
        analysis: { 
          geminiScore: 0.5, 
          gptScore: 0.5, 
          reasoning: "Result was not in proper JSON format" 
        } 
      });
    }
  } catch (error: any) {
    console.error("Gemini comparison error:", error);
    throw new Error(`Failed to compare and merge results with Gemini: ${error.message}`);
  }
}
