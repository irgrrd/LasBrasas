import { GoogleGenerativeAI } from "@google/generative-ai";

export class GuerreroService {
    constructor(apiKey) {
        if (!apiKey) throw new Error("Se requiere Clave API Gemini");
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // --- 1. Análisis de Imagen ---
    async analyzeImage(imageBase64) {
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast for analysis
        const base64Data = imageBase64.split(',')[1];

        const prompt = `
            Analiza esta imagen bajo la lente de "Realismo Guerrerense" (México).
            Identifica:
            1. Atmósfera (ej. Tensión, Melancolía, Esperanza, Caos).
            2. Iluminación (ej. Luz dura tropical, Atardecer dorado, Neón nocturno).
            3. Personas (Lista breve: Persona A, B...).
            4. Elementos culturales visibles (ej. Puestos de comida, vegetación tropical, arquitectura local).

            Salida JSON estricta:
            {
                "atmosfera": "...",
                "iluminacion": "...",
                "personas": ["..."],
                "contexto": "..."
            }
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        // Simple cleanup to extract JSON if markdown is present
        try {
            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("Error parseando análisis:", e);
            return { atmosfera: "Indefinida", iluminacion: "Natural", personas: [], contexto: text.slice(0, 100) };
        }
    }

    // --- 2. Generación Narrativa ---
    async generateNarratives(imageBase64, config, analysis) {
        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Pro for creative writing
        const base64Data = imageBase64.split(',')[1];

        const prompt = `
            ACTÚA COMO: "Voces de Guerrero", un cronista omnisciente de la realidad en Guerrero, México.

            CONTEXTO:
            - Ubicación: ${config.culturalElements || "Iguala, Guerrero"}.
            - Análisis Visual: ${JSON.stringify(analysis)}.
            - Modo Discursivo: ${config.mode} (Suspense/Social/Romance/etc).
            - Protagonistas: ${config.protagonists || "Gente común"}.
            - Duración: ${config.duration} (Gancho vs Completa).

            REGLAS:
            1. Realismo físico absoluto. Sin magia.
            2. Español Mexicano (Guerrero). Palabras como "plebe", "compa", "chamba" si aplica, pero tono literario.
            3. Incluye referencias sensoriales (calor húmedo, olor a maíz, sonido de grillos).
            4. NO menciones que eres una IA. Eres el narrador.

            TAREA: Genera 4 salidas separadas por "|||".
            1. NARRATIVA PRINCIPAL (Historia inmersiva).
            2. GUION REDES (Formato vertical, gancho visual, hashtags).
            3. ARTÍCULO PERIODÍSTICO (Estilo crónica o nota roja/social, titular + cuerpo).
            4. PROMPT VISUAL (Descripción técnica para regenerar la escena en otra IA).

            FORMATO DE SALIDA:
            [NARRATIVA] ... [FIN_NARRATIVA]
            |||
            [GUION] ... [FIN_GUION]
            |||
            [ARTICULO] ... [FIN_ARTICULO]
            |||
            [PROMPT] ... [FIN_PROMPT]
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const raw = result.response.text();
        const sections = raw.split('|||');

        return {
            narrative: sections[0]?.replace(/\[.*?\]/g, '').trim(),
            script: sections[1]?.replace(/\[.*?\]/g, '').trim(),
            article: sections[2]?.replace(/\[.*?\]/g, '').trim(),
            prompt: sections[3]?.replace(/\[.*?\]/g, '').trim()
        };
    }

    // --- 3. Generación de Audio (Mapeo a Google Cloud TTS) ---
    async generateAudio(text, voiceFlavor) {
        // Mapping "Voces de Guerrero" flavors to Google Cloud TTS models
        const voiceMap = {
            "fenrir": { name: "es-US-Polyglot-1", gender: "MALE", pitch: -2.0, speed: 0.95 }, // Deep/Intense
            "kore": { name: "es-US-Neural2-A", gender: "FEMALE", pitch: 0.0, speed: 1.0 }, // Warm
            "neutral": { name: "es-MX-Standard-A", gender: "FEMALE", pitch: -1.0, speed: 1.05 } // Documentary
        };

        const config = voiceMap[voiceFlavor] || voiceMap["neutral"];

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

        const payload = {
            input: { text: text },
            voice: { languageCode: config.name.startsWith("es-MX") ? "es-MX" : "es-US", name: config.name },
            audioConfig: {
                audioEncoding: "LINEAR16",
                pitch: config.pitch,
                speakingRate: config.speed
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Error TTS");
        }

        const data = await response.json();

        // Convert Base64 -> AudioBuffer
        const binaryString = window.atob(data.audioContent);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return await audioContext.decodeAudioData(bytes.buffer);
    }
}
