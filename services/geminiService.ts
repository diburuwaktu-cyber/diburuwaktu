// FIX: Create the content for the empty geminiService.ts file.
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { GeolocationState } from "../types";

// Initialize the GoogleGenAI client
// FIX: Ensure API_KEY is accessed from process.env as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Generates an image based on a text prompt.
 * @param prompt The text prompt to generate an image from.
 * @returns A base64 encoded image string.
 */
export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // FIX: Use ai.models.generateImages as per the new API guidelines.
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      // FIX: Correctly access the image bytes from the response.
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image due to an API error.");
  }
};


/**
 * Gets a response from the chatbot, potentially using grounding.
 * @param history The conversation history.
 * @param message The user's new message.
 * @param location The user's geolocation.
 * @returns The GenerateContentResponse from the API.
 */
export const getChatbotResponse = async (
  history: Content[],
  message: string,
  location: GeolocationState
): Promise<GenerateContentResponse> => {
  try {
    const model = 'gemini-2.5-flash';

    // FIX: Correctly configure tools for grounding with Google Search and Maps.
    const config: any = {
      tools: [{ googleSearch: {} }],
    };
    
    if (location.latitude && location.longitude) {
      config.tools.push({ googleMaps: {} });
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }
      };
    }

    const contents = [...history, { role: 'user', parts: [{ text: message }] }];
    
    // FIX: Use ai.models.generateContent for stateless chat requests.
    const response = await ai.models.generateContent({
      model: model,
      contents: contents, // Pass the full conversation history
      config: config,
    });

    return response;
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    throw new Error("Failed to get response from the chatbot.");
  }
};


/**
 * Analyzes a complex prompt using a more powerful model with thinking enabled.
 * @param prompt The complex prompt to analyze.
 * @returns The text result from the analysis.
 */
export const analyzeWithThinking = async (prompt: string): Promise<string> => {
  try {
    // FIX: Use gemini-2.5-pro and enable thinking config for complex tasks.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 } // max budget for 2.5-pro
      }
    });
    // FIX: Correctly extract text from the response.
    return response.text;
  } catch (error) {
    console.error("Error analyzing prompt with thinking:", error);
    throw new Error("Failed to analyze the prompt with enhanced thinking.");
  }
};
