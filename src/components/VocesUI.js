import React, { useState, useRef, useEffect } from 'react';
import h from 'react-hyperscript';
import { Settings, Play, Download, Mic, Image as ImageIcon, Video, ShieldAlert, Lock, Unlock, FileText, Smartphone, Newspaper } from 'lucide-react';
import { GuerreroService } from '../services/guerreroGemini.js';
import { encodeToMp3 } from '../utils/audioEncoder.js';

// Configuration Constants
const MODES = ["Suspense", "Social", "Psicológico", "Romance", "Documental", "Sátira Picante"];
const VOICES = [
    { id: "fenrir", label: "Fenrir (Intensa/Suspense)", desc: "Profunda y tensa" },
    { id: "kore", label: "Kore (Cálida/Romance)", desc: "Suave y esperanzadora" },
    { id: "neutral", label: "Neutral Mexicana (Documental)", desc: "Periodística y clara" }
];

export default function VocesUI() {
    // State: Configuration
    const [apiKey, setApiKey] = useState("");
    const [isPremium, setIsPremium] = useState(false);

    // State: Workflow
    const [step, setStep] = useState(1); // 1:Upload, 2:Config, 3:Results
    const [image, setImage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // State: Narrative Config
    const [config, setConfig] = useState({
        mode: "Suspense",
        voice: "fenrir",
        protagonists: "",
        culturalElements: "",
        duration: "Completa (90s)"
    });

    // State: Results
    const [results, setResults] = useState(null); // { narrative, script, article, prompt }
    const [isGenerating, setIsGenerating] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [status, setStatus] = useState("Esperando...");
    const [activeTab, setActiveTab] = useState("narrative");

    const fileInputRef = useRef(null);

    // Load Key
    useEffect(() => {
        const k = localStorage.getItem("GUERRERO_KEY");
        if (k) setApiKey(k);
    }, []);

    // Handlers
    const saveKey = (val) => {
        setApiKey(val);
        localStorage.setItem("GUERRERO_KEY", val);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!apiKey) {
            alert("Primero ingresa tu Clave API Gemini (Modo Gratuito)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            setImage(reader.result);
            setIsAnalyzing(true);
            setStatus("Analizando Imagen con Visión Guerrerense...");

            try {
                const service = new GuerreroService(apiKey);
                const analysisData = await service.analyzeImage(reader.result);
                setAnalysis(analysisData);
                setStep(2); // Move to config
                setStatus("Análisis completo. Configura tu narrativa.");
            } catch (err) {
                console.error(err);
                setStatus("Error en análisis: " + err.message);
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setStatus("Escribiendo Crónicas de Guerrero...");
        setResults(null);
        setAudioUrl(null);

        try {
            const service = new GuerreroService(apiKey);

            // 1. Generate Text
            const narrativeData = await service.generateNarratives(image, config, analysis);
            setResults(narrativeData);

            // 2. Generate Audio (Auto for Free Mode)
            setStatus(`Sintetizando Voz (${config.voice})...`);
            // Only generate audio for the main narrative to save time/bandwidth
            const audioBuffer = await service.generateAudio(narrativeData.narrative.slice(0, 1000), config.voice); // Limit char count for safety

            setStatus("Codificando MP3...");
            await new Promise(r => setTimeout(r, 100)); // UI yield
            const mp3Blob = encodeToMp3(audioBuffer);
            setAudioUrl(URL.createObjectURL(mp3Blob));

            setStatus("Generación Completa.");
            setStep(3);
        } catch (err) {
            console.error(err);
            setStatus("Error Generando: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // Components
    const ModeBadge = () => h('div', {
        className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isPremium ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`
    }, isPremium ? "Modo Premium" : "Modo Gratuito");

    // --- RENDER ---
    return h('div', { className: 'min-h-screen bg-slate-900 text-slate-100 font-sans' }, [

        // Header
        h('header', { className: 'border-b border-slate-800 bg-slate-950 p-6 sticky top-0 z-50 shadow-xl' }, [
            h('div', { className: 'max-w-6xl mx-auto flex justify-between items-center' }, [
                h('div', null, [
                    h('h1', { className: 'text-2xl md:text-3xl font-serif font-bold text-amber-500 tracking-tight' }, "VOCES DE GUERRERO"),
                    h('p', { className: 'text-xs text-slate-400 mt-1 uppercase tracking-widest' }, "Motor Narrativo Visual v3.2.1")
                ]),
                h('div', { className: 'flex items-center gap-4' }, [
                    h(ModeBadge),
                    h('button', {
                        onClick: () => setIsPremium(!isPremium),
                        className: 'p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400',
                        title: "Cambiar Modo"
                    }, isPremium ? h(Lock, {size:18}) : h(Unlock, {size:18}))
                ])
            ])
        ]),

        // Main Content
        h('main', { className: 'max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8' }, [

            // Sidebar / Config Panel
            h('aside', { className: 'lg:col-span-4 space-y-6' }, [

                // 1. API Key Input
                h('div', { className: 'bg-slate-800 p-5 rounded-xl border border-slate-700' }, [
                    h('div', { className: 'flex items-center gap-2 mb-3 text-amber-500' }, [
                        h(ShieldAlert, { size: 18 }),
                        h('h3', { className: 'font-bold text-sm' }, "Llave Maestra (Gemini)")
                    ]),
                    h('input', {
                        type: 'password',
                        value: apiKey,
                        onChange: (e) => saveKey(e.target.value),
                        placeholder: 'Pega tu API Key aquí...',
                        className: 'w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-amber-100 focus:border-amber-500 outline-none'
                    })
                ]),

                // 2. Upload Area (Only if Step 1)
                step === 1 && h('div', {
                    onClick: () => fileInputRef.current?.click(),
                    className: 'border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-800/50 rounded-xl p-8 text-center cursor-pointer transition-all group'
                }, [
                    h('input', { type: 'file', ref: fileInputRef, onChange: handleFileUpload, accept: 'image/*', className: 'hidden' }),
                    h(ImageIcon, { size: 48, className: 'mx-auto text-slate-500 group-hover:text-amber-500 mb-4 transition-colors' }),
                    h('p', { className: 'font-serif text-lg text-slate-300' }, "Sube tu Imagen"),
                    h('p', { className: 'text-xs text-slate-500 mt-2' }, "Analizaremos atmósfera, luz y cultura automáticamente.")
                ]),

                // 3. Analysis & Config (Step 2+)
                step >= 2 && h('div', { className: 'space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500' }, [
                    // Image Thumbnail
                    image && h('div', { className: 'relative h-48 rounded-xl overflow-hidden shadow-lg border border-slate-700' }, [
                        h('img', { src: image, className: 'w-full h-full object-cover' }),
                        h('div', { className: 'absolute bottom-0 inset-x-0 bg-black/70 p-2 text-xs text-white backdrop-blur-sm' },
                            analysis ? `Detectado: ${analysis.atmosfera} | ${analysis.iluminacion}` : "Analizando..."
                        )
                    ]),

                    // Configuration Form
                    h('div', { className: 'bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4' }, [
                        h('h3', { className: 'font-serif font-bold text-amber-500 border-b border-slate-700 pb-2' }, "Configuración Narrativa"),

                        // Voice Select
                        h('div', null, [
                            h('label', { className: 'text-xs text-slate-400 uppercase font-bold' }, "Voz Discursiva"),
                            h('select', {
                                value: config.voice,
                                onChange: e => setConfig({...config, voice: e.target.value}),
                                className: 'w-full mt-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm'
                            }, VOICES.map(v => h('option', { value: v.id, key: v.id }, v.label)))
                        ]),

                        // Mode Select
                        h('div', null, [
                            h('label', { className: 'text-xs text-slate-400 uppercase font-bold' }, "Modo Discursivo"),
                            h('div', { className: 'grid grid-cols-2 gap-2 mt-1' },
                                MODES.map(m => h('button', {
                                    key: m,
                                    onClick: () => setConfig({...config, mode: m}),
                                    className: `text-xs py-1 px-2 rounded border transition-colors ${config.mode === m ? 'bg-amber-500 text-black border-amber-500' : 'border-slate-600 hover:border-slate-500'}`
                                }, m))
                            )
                        ]),

                        // Protagonists
                        h('div', null, [
                            h('label', { className: 'text-xs text-slate-400 uppercase font-bold' }, "Protagonistas"),
                            h('input', {
                                value: config.protagonists,
                                onChange: e => setConfig({...config, protagonists: e.target.value}),
                                placeholder: "Ej. Doña Mari, El Chaneque...",
                                className: 'w-full mt-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm'
                            })
                        ]),

                        // Generate Button
                        h('button', {
                            onClick: handleGenerate,
                            disabled: isGenerating,
                            className: 'w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4 transition-all'
                        }, isGenerating ? [h('span', {className:'animate-spin'}, "↻"), " Generando..."] : [h(Play, {size:18}), " GENERAR NARRATIVAS"])
                    ])
                ])

            ]),

            // Results Panel
            h('div', { className: 'lg:col-span-8 bg-slate-900 min-h-[500px] flex flex-col' }, [

                // Status Bar
                h('div', { className: 'mb-6 flex items-center gap-3 text-sm font-mono text-slate-400' }, [
                    h('span', { className: 'w-2 h-2 rounded-full bg-amber-500 animate-pulse' }),
                    status
                ]),

                // Content Area
                !results ? h('div', { className: 'flex-grow flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl' }, [
                    h('div', { className: 'text-center text-slate-600' }, [
                        h(FileText, { size: 64, className: 'mx-auto mb-4 opacity-50' }),
                        h('p', "Los resultados aparecerán aquí")
                    ])
                ]) : h('div', { className: 'space-y-6 animate-in fade-in zoom-in-95 duration-500' }, [

                    // Audio Player (Top Feature)
                    audioUrl && h('div', { className: 'bg-slate-800 p-4 rounded-xl border border-amber-500/30 shadow-lg flex flex-col md:flex-row items-center gap-4' }, [
                        h('div', { className: 'bg-amber-500 p-3 rounded-full text-black' }, h(Mic, {size:24})),
                        h('div', { className: 'flex-grow w-full' }, [
                            h('h4', { className: 'text-sm font-bold text-amber-500 mb-1' }, `Narración Generada: ${VOICES.find(v=>v.id===config.voice)?.label}`),
                            h('audio', { src: audioUrl, controls: true, className: 'w-full h-8' })
                        ]),
                        h('a', {
                            href: audioUrl,
                            download: `voces-guerrero-${Date.now()}.mp3`,
                            className: 'flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors'
                        }, [h(Download, {size:16}), "MP3"])
                    ]),

                    // Tabs
                    h('div', { className: 'flex border-b border-slate-700' }, [
                        {id: 'narrative', label: 'Narrativa', icon: FileText},
                        {id: 'script', label: 'Guion Redes', icon: Smartphone},
                        {id: 'article', label: 'Artículo', icon: Newspaper},
                        {id: 'prompt', label: 'Prompt Visual', icon: ImageIcon}
                    ].map(tab => h('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`
                    }, [h(tab.icon, {size:16}), tab.label]))),

                    // Text Content
                    h('div', { className: 'bg-slate-800 p-6 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-700 min-h-[400px]' }, [
                        h('div', { className: 'prose prose-invert prose-amber max-w-none font-serif leading-relaxed whitespace-pre-wrap' },
                            results[activeTab] || "Contenido no disponible."
                        ),
                        h('div', { className: 'mt-8 pt-4 border-t border-slate-700 text-xs text-slate-500 italic' },
                            "*(satira - contenido generado por IA) - Voces de Guerrero v3.2.1"
                        )
                    ])

                ])

            ])

        ])

    ]);
}
