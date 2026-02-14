import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    constructor(apiKey) {
        if (!apiKey) throw new Error("API Key is required");
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateStory(imageBase64, characterName) {
        // Remove header if present (data:image/png;base64,)
        const base64Data = imageBase64.split(',')[1];

        // Use the standard Gemini 1.5 Pro model for multimodal
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const characterContext = characterName
            ? `El protagonista de la historia es ${characterName}.`
            : "Crea un protagonista adecuado para la escena.";

        // Prompt translated to request Mexican Spanish
        const prompt = `
            Analiza esta imagen y escribe el inicio de una historia corta y atmosférica ambientada en este mundo.
            ${characterContext}
            El tono debe ser inmersivo. Mantenlo en menos de 200 palabras.
            Escribe en Español de México (Latinoamérica).
            Salida SOLO el texto de la historia.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        return result.response.text();
    }

    async generateSpeech(text, voice = "es-MX-Standard-A") {
        /*
            Implements Text-to-Speech using Google Cloud TTS API.
            Defaults to Spanish (Mexico) voices.
        */

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

        const payload = {
            input: { text: text },
            voice: { languageCode: "es-MX", name: voice },
            audioConfig: { audioEncoding: "LINEAR16" } // Request PCM-like (WAV container) for easier decoding
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`TTS API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const audioContent = data.audioContent; // Base64 string

        // Decode Base64 to ArrayBuffer
        const binaryString = window.atob(audioContent);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Decode Audio Data (WAV/Linear16) to AudioBuffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

        return audioBuffer;
    }
}
