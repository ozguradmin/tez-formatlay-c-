import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ContentType, FormattedBlock } from '../types';

const parseContentWithGemini = async (rawText: string): Promise<FormattedBlock[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an expert academic editor and thesis formatter for Istanbul Yeni Yuzyil University (following APA 7 rules).
    
    YOUR GOAL: Take raw, unstructured, messy text and transform it into a perfectly structured, ready-to-print academic thesis document.

    *** CRITICAL STRUCTURING INSTRUCTIONS (DO THIS FIRST) ***
    1. **Analyze Flow**: Read the input text to understand the logical progression of ideas.
    2. **Create Structure (If Missing)**: 
       - If the input is a solid block of text without breaks, YOU MUST split it into logical paragraphs.
       - If the input lacks headings, YOU MUST insert appropriate academic headings (e.g., "GİRİŞ", "KAVRAMSAL ÇERÇEVE", "YÖNTEM", "TARTIŞMA", "SONUÇ") where the topic shifts.
       - If the input lacks a Main Title, YOU MUST generate a descriptive, academic title at the very top.
    3. **Detect Tables**:
       - **CRITICAL**: If you see data that represents a comparison, a list of definitions, or corresponding values (e.g., "Who? -> Analysis Type", "Variable -> Value"), YOU MUST format this as a 'TABLE'.
       - Do not format tabular data as list items. Use the 'tableRows' property for this.
    4. **Language**: Ensure the output is in the same language as the input (likely Turkish), but improve the academic tone (remove informalities).

    *** FORMATTING & CITATION RULES ***
    1. **Author Citations (APA 7)**:
       - 1 or 2 authors: Keep names (e.g., "Yılmaz ve Kaya, 2020").
       - 3+ authors: Change to First Author + "vd." (e.g., convert "Yılmaz, Kaya ve Demir, 2020" to "Yılmaz vd., 2020").
    2. **Long Quotes (Block Quotes)**:
       - Detect citations/quotes that appear to be 40 words or longer.
       - Mark them as 'BLOCK_QUOTE'.
       - REMOVE quotation marks ("") from these long blocks.
    3. **Lists**: Detect items that should be bullet points and format them as LIST_ITEM.

    *** JSON OUTPUT SCHEMA ***
    Return a JSON array where each object represents a part of the document.
  `;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: [ContentType.TITLE, ContentType.HEADING, ContentType.PARAGRAPH, ContentType.LIST_ITEM, ContentType.BLOCK_QUOTE, ContentType.TABLE],
          description: "Use TITLE for main paper title. HEADING for sections. TABLE for matrix/tabular data.",
        },
        content: {
          type: Type.STRING,
          description: "The text content. For TABLE, this can be the Table Caption (e.g. 'Tablo 1. Lasswell Modeli').",
        },
        tableRows: {
          type: Type.ARRAY,
          description: "Only used if type is TABLE. A 2D array of strings representing rows and cells.",
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      },
      required: ["type", "content"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please reconstruct and format the following raw text into a structured academic document. Detect any tabular data and format it as a TABLE:\n\n${rawText}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsedData = JSON.parse(jsonText);
    
    // Add IDs for React keys
    return parsedData.map((block: any, index: number) => ({
      id: `block-${index}-${Date.now()}`,
      type: block.type as ContentType,
      content: block.content,
      tableRows: block.tableRows
    }));

  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw new Error("Metin yapılandırılırken bir hata oluştu.");
  }
};

export { parseContentWithGemini };