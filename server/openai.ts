import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractTextWithOpenAI(base64Image: string, customPrompt?: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR specialist that extracts text from images. Always respond with a JSON object that follows this structure: { \"text\": \"the extracted text in markdown format\", \"confidence\": 0.0-1.0, \"metadata\": { \"image_quality\": \"description of image quality\", \"content_type\": \"document type detected\" } }. IMPORTANT: When extracting data for specific fields, ONLY extract values for the requested fields - do NOT create or add any fields that aren't explicitly requested."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: customPrompt || "Extract all text from this image. Format the extracted text as markdown with appropriate headers, lists, tables, etc. Preserve the layout and structure of the document as much as possible. Return the result in JSON format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return JSON.stringify({ text: "No text extracted", confidence: 0, metadata: { error: "No content returned" } });
    
    // Return the JSON as a string
    return content;
  } catch (error: any) {
    console.error("OpenAI text extraction error:", error);
    throw new Error(`Failed to extract text with OpenAI: ${error.message}`);
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
    
    const prompt = customPrompt 
      ? `${customPrompt}\n\nHere are two extractions of the same document:\n\nExtraction 1 (Gemini):\n${geminiText}\n\nExtraction 2 (GPT):\n${gptText}\n\nPlease analyze both extractions and create a merged, improved version that takes the most accurate parts from each.`
      : `Here are two AI-extracted versions of the same document:\n\nExtraction 1 (Gemini):\n${geminiText}\n\nExtraction 2 (GPT):\n${gptText}\n\nAnalyze both extractions and create a merged, improved version that takes the most accurate parts from each. Your goal is to produce the most complete and accurate representation of the original document.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR expert that compares multiple text extractions and creates the most accurate version. Always respond with a JSON object that follows this structure: { \"mergedText\": \"the merged text in JSON format\", \"analysis\": { \"geminiScore\": 0.0-1.0, \"gptScore\": 0.0-1.0, \"reasoning\": \"explanation of merge decisions\" } }. VERY IMPORTANT: When merging field data, include ONLY the fields that were specifically requested in the original prompt. NEVER add extra fields that weren't in the original field list. Only extract data for the form fields specified in the original request."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return JSON.stringify({ 
      mergedText: "Failed to merge results", 
      analysis: { 
        geminiScore: 0, 
        gptScore: 0, 
        reasoning: "No content returned from AI" 
      } 
    });
    
    return content;
  } catch (error: any) {
    console.error("OpenAI comparison error:", error);
    throw new Error(`Failed to compare and merge results with OpenAI: ${error.message}`);
  }
}
