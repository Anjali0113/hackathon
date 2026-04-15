import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function resolveLocation(query: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a location expert for India. The user provided a partial or ambiguous location: "${query}". 
      Resolve this to a precise, geocodable address or landmark name in India. 
      Return ONLY the resolved string. No explanation.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    return response.text?.trim() || query;
  } catch (error) {
    console.error("Gemini resolve error:", error);
    return query;
  }
}

export async function getSuggestions(partial: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 real, popular locations or landmarks in India that start with or are related to: "${partial}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        tools: [{ googleMaps: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    const suggestions = JSON.parse(response.text || "[]");
    return suggestions;
  } catch (error) {
    console.error("Gemini suggestions error:", error);
    return [];
  }
}
