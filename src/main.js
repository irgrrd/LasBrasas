import React from 'react';
import { createRoot } from 'react-dom/client';
import h from 'react-hyperscript';
import StoryWriter from './components/StoryWriter.js';

console.log("Main.js is executing...");

try {
    const App = () => {
        return h('div', { className: 'container mx-auto py-8' }, [
            h('header', { className: 'text-center mb-10' }, [
                h('h1', { className: 'text-5xl text-cyan-500 mb-2 tracking-tighter' }, [
                    'MUSE',
                    h('span', { className: 'text-purple-500' }, 'AI')
                ]),
                h('p', { className: 'text-slate-400 text-lg' }, 'Motor de Narrativa Visual y Síntesis de Audio'),
                h('div', { className: 'mt-2 text-xs text-slate-600 font-mono' }, 'Versión: REACT-18-ESM | GEMINI-PREVIEW')
            ]),
            h(StoryWriter)
        ]);
    };

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
} catch (e) {
    console.error("React Error:", e);
}
