import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractTextWithOpenAI(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image. Format the result as markdown with appropriate headers, lists, tables, etc. Preserve the layout and structure of the document as much as possible."
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
    });

    return response.choices[0].message.content || "No text extracted";
  } catch (error) {
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
    const prompt = customPrompt 
      ? `${customPrompt}\n\nHere are two extractions of the same document:\n\nExtraction 1 (Gemini):\n${geminiData}\n\nExtraction 2 (GPT):\n${gptData}\n\nPlease analyze both extractions and create a merged, improved version that takes the most accurate parts from each.`
      : `You are an expert OCR analyst. Here are two AI-extracted versions of the same document:\n\nExtraction 1 (Gemini):\n${geminiData}\n\nExtraction 2 (GPT):\n${gptData}\n\nPlease analyze both extractions and create a merged, improved version that takes the most accurate parts from each. Your goal is to produce the most complete and accurate representation of the original document. Format your response in markdown with appropriate headers, lists, tables, etc. to preserve the structure.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an OCR expert that compares multiple text extractions and creates the most accurate version."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Failed to merge results";
  } catch (error) {
    console.error("OpenAI comparison error:", error);
    throw new Error(`Failed to compare and merge results with OpenAI: ${error.message}`);
  }
}
