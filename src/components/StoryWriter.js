import React, { useState, useRef, useEffect } from 'react';
import h from 'react-hyperscript';
import { GeminiService } from '../services/geminiService.js';
import { encodeToMp3 } from '../utils/audioEncoder.js';

// Google Cloud TTS Voices
const VOICES = [
    { name: "Journey (F)", id: "en-US-Journey-F" },
    { name: "Journey (M)", id: "en-US-Journey-D" },
    { name: "Standard (F)", id: "en-US-Standard-C" },
    { name: "Standard (M)", id: "en-US-Standard-D" },
    { name: "Studio (M)", id: "en-US-Studio-M" },
    { name: "Studio (O)", id: "en-US-Studio-O" }
];

export default function StoryWriter() {
    const [apiKey, setApiKey] = useState("");
    const [image, setImage] = useState(null);
    const [characterName, setCharacterName] = useState("");
    const [story, setStory] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState("en-US-Journey-F");
    const [status, setStatus] = useState("Ready");

    const fileInputRef = useRef(null);

    useEffect(() => {
        const storedKey = localStorage.getItem("MUSEAI_API_KEY");
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setStory("");
                setAudioBlob(null);
                setAudioUrl(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleKeyChange = (e) => {
        setApiKey(e.target.value);
        localStorage.setItem("MUSEAI_API_KEY", e.target.value);
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            alert("Please enter a Google Gemini API Key.");
            return;
        }
        if (!image) {
            alert("Please upload an image first.");
            return;
        }

        setIsGenerating(true);
        setStatus("Analyzing Image & Writing Story...");

        try {
            const service = new GeminiService(apiKey);
            const text = await service.generateStory(image, characterName);
            setStory(text);
            setStatus("Story Generated. Ready for Speech.");
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!story) return;
        setIsGenerating(true);
        setStatus("Synthesizing Speech (Google Cloud TTS)...");

        try {
            const service = new GeminiService(apiKey);

            // 1. Fetch real AI audio from Google Cloud TTS
            const audioBuffer = await service.generateSpeech(story, selectedVoice);

            setStatus("Encoding to MP3 (LameJS)...");
            // 2. Encode to MP3 client-side as per requirements
            await new Promise(r => setTimeout(r, 100)); // Yield to UI

            const mp3 = encodeToMp3(audioBuffer);
            const url = URL.createObjectURL(mp3);

            setAudioBlob(mp3);
            setAudioUrl(url);
            setStatus("Audio Ready.");

        } catch (error) {
            console.error(error);
            setStatus(`Audio Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return h('div', { className: 'max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8' }, [

        // Left Panel
        h('div', { className: 'space-y-6' }, [
            h('div', { className: 'bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700' }, [
                h('h2', { className: 'text-xl font-bold mb-4 text-cyan-400' }, '1. Setup Context'),

                h('div', { className: 'mb-4' }, [
                    h('label', { className: 'block text-sm font-medium mb-1 text-slate-400' }, 'Google API Key (Gemini + TTS)'),
                    h('input', {
                        type: 'password',
                        value: apiKey,
                        onChange: handleKeyChange,
                        placeholder: 'Paste your API key here',
                        className: 'w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-white'
                    })
                ]),

                h('div', { className: 'mb-4' }, [
                    h('label', { className: 'block text-sm font-medium mb-1 text-slate-400' }, 'Protagonist Name (Optional)'),
                    h('input', {
                        type: 'text',
                        value: characterName,
                        onChange: (e) => setCharacterName(e.target.value),
                        placeholder: 'e.g. Elara, Kael...',
                        className: 'w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none'
                    })
                ]),

                h('div', {
                    onClick: () => fileInputRef.current.click(),
                    className: 'border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-lg p-8 text-center cursor-pointer transition-colors'
                }, [
                    h('input', {
                        type: 'file',
                        ref: fileInputRef,
                        onChange: handleFileChange,
                        accept: 'image/*',
                        className: 'hidden'
                    }),
                    image ? h('img', { src: image, alt: 'Preview', className: 'max-h-48 mx-auto rounded shadow-lg' })
                          : h('div', { className: 'text-slate-400' }, [
                                h('p', { className: 'text-2xl mb-2' }, '+'),
                                h('p', null, 'Upload Scene Image')
                            ])
                ])
            ]),

            h('button', {
                onClick: handleGenerate,
                disabled: isGenerating || !image,
                className: 'w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]'
            }, isGenerating && !story ? "Dreaming..." : "Generate Story")
        ]),

        // Right Panel
        h('div', { className: 'space-y-6 flex flex-col h-full' }, [
            h('div', { className: 'bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex-grow flex flex-col' }, [
                h('h2', { className: 'text-xl font-bold mb-4 text-purple-400' }, '2. The Narrative'),

                h('div', { className: 'flex-grow bg-slate-900 rounded-lg p-4 font-serif text-lg leading-relaxed text-slate-300 overflow-y-auto min-h-[200px] whitespace-pre-wrap' }, [
                    story || h('span', { className: 'text-slate-600 italic' }, 'The page is blank. Waiting for inspiration...')
                ]),

                story && h('div', { className: 'mt-6 border-t border-slate-700 pt-4' }, [
                    h('div', { className: 'flex items-center justify-between mb-4' }, [
                        h('div', null, [
                            h('label', { className: 'text-xs text-slate-500 uppercase tracking-wider font-bold' }, 'Voice'),
                            h('select', {
                                value: selectedVoice,
                                onChange: (e) => setSelectedVoice(e.target.value),
                                className: 'block bg-slate-900 text-sm mt-1 px-2 py-1 rounded border border-slate-600 text-white'
                            }, VOICES.map(v => h('option', { key: v.id, value: v.id }, v.name)))
                        ]),
                        h('span', { className: 'text-xs text-cyan-500 font-mono' }, status)
                    ]),

                    !audioUrl ? h('button', {
                        onClick: handleGenerateAudio,
                        disabled: isGenerating,
                        className: 'w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2'
                    }, 'Synthesize Speech (TTS)')
                    : h('div', { className: 'space-y-3 animate-fade-in' }, [
                        h('audio', {
                            id: 'story-audio',
                            src: audioUrl,
                            controls: true,
                            className: 'w-full',
                            onPlay: () => setIsPlaying(true),
                            onPause: () => setIsPlaying(false)
                        }),
                        h('a', {
                            href: audioUrl,
                            download: `museai-story-${Date.now()}.mp3`,
                            className: 'block w-full text-center bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold'
                        }, 'Download MP3')
                    ])
                ])
            ])
        ])
    ]);
}
