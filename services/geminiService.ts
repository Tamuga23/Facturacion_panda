
import { GoogleGenAI, Type } from "@google/genai";
import { ClientData } from "../types";

export const parseClientInfo = async (rawText: string): Promise<ClientData> => {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (!apiKey) {
        console.warn("API Key is missing in environment variables.");
        throw new Error("API Key is missing");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extrae la información del cliente del siguiente texto en español. 
      Busca: Nombre completo, Teléfono, Dirección y Proveedor de Transporte (ej: CargoTrans, TransNica).
      
      Si un campo no existe, deja el string vacío.
      Normaliza el teléfono si es posible.
      
      Texto: "${rawText}"`,
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
    if (!text) throw new Error("No response text from AI");
    
    return JSON.parse(text) as ClientData;
  } catch (error) {
    console.error("Error parsing client info with Gemini:", error);
    return {
      fullName: "",
      address: "",
      phone: "",
      transportProvider: "",
    };
  }
};
