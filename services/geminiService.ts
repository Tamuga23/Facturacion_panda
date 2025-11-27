import { GoogleGenAI, Type } from "@google/genai";
import { ClientData } from "../types";

export const parseClientInfo = async (rawText: string): Promise<ClientData> => {
  try {
    // Initialize AI client here to avoid top-level crashes if process.env is undefined during module load
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key is missing");
        throw new Error("API Key is missing in process.env");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract the client information from the following text. 
      The text typically contains a Name, Phone Number, Address, and a Transport/Delivery Provider (e.g., CargoTrans, TransNica, etc).
      
      If a field is missing, leave it as an empty string. 
      Normalize the phone number to include country code if possible.
      
      Text to parse: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            address: { type: Type.STRING },
            phone: { type: Type.STRING },
            transportProvider: { type: Type.STRING },
          },
          required: ["fullName", "address", "phone", "transportProvider"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ClientData;
  } catch (error) {
    console.error("Error parsing client info:", error);
    // Return empty structure on failure but do not crash the app
    return {
      fullName: "",
      address: "",
      phone: "",
      transportProvider: "",
    };
  }
};