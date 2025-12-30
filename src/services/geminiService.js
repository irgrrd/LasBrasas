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
            ? `The protagonist of the story is ${characterName}.`
            : "Create a protagonist suitable for the scene.";

        const prompt = `
            Analyze this image and write a short, atmospheric story opening set in this world.
            ${characterContext}
            The tone should be immersive. Keep it under 200 words.
            Output ONLY the story text.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        return result.response.text();
    }

    async generateSpeech(text, voice = "en-US-Journey-F") {
        /*
            Implements Text-to-Speech using Google Cloud TTS API.
            This allows us to get a real AudioBuffer to convert to MP3 client-side,
            fulfilling the requirement for "Expressive AI Voice" and the "Audio Pipeline".

            Note: This endpoint shares the same API Key space as Gemini in Google AI Studio
            for many users, or requires a Cloud Key. We assume the user provides a key
            with 'cloud-text-to-speech' or generic AI Studio permissions.
        */

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

        const payload = {
            input: { text: text },
            voice: { languageCode: "en-US", name: voice },
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
