import React from 'react';
import { createRoot } from 'react-dom/client';
import h from 'react-hyperscript';
import VocesUI from './components/VocesUI.js';

console.log("Iniciando Voces de Guerrero v3.2.1...");

try {
    const App = () => {
        return h(VocesUI);
    };

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
} catch (e) {
    console.error("Error Crítico de Inicialización:", e);
}
