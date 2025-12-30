document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('image-upload');
    const uploadContainer = document.getElementById('upload-container');
    const imagePreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const storyContainer = document.getElementById('story-container');
    const placeholderText = document.getElementById('placeholder-text');
    const storyText = document.getElementById('story-text');
    const readAloudBtn = document.getElementById('read-aloud-btn');
    const stopReadBtn = document.getElementById('stop-read-btn');
    const voiceSelect = document.getElementById('voice-select');

    // State
    let currentImage = null;
    let synth = window.speechSynthesis;
    let voices = [];
    let isSpeaking = false;

    // --- Image Upload Handling ---

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImage = e.target.result;
                imagePreview.src = currentImage;
                imagePreview.classList.remove('hidden');
                uploadPlaceholder.classList.add('hidden');
                generateBtn.disabled = false;

                // Reset story if new image
                resetStory();
            };
            reader.readAsDataURL(file);
        }
    }

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and Drop support
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.classList.add('bg-indigo-50');
    });

    uploadContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('bg-indigo-50');
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('bg-indigo-50');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });


    // --- AI Story Generation (Mock) ---

    // A list of mock prompts to simulate variety based on "analysis"
    const mockStories = [
        "The ancient forest whispered secrets to those who dared to listen. Sunlight filtered through the dense canopy in fractured beams, illuminating dust motes that danced like tiny spirits. In the center of the clearing stood a stone archway, its carvings worn smooth by centuries of rain and wind, waiting for the key that had been lost since the age of kings.",
        "Neon lights reflected off the wet pavement, painting the cyberpunk city in hues of electric blue and magenta. The drone of flying cars overhead created a constant hum, a mechanical lullaby for the restless souls below. Jax pulled his collar up against the acid rain, clutching the data drive that could bring down the entire corporation, if he could just make it to the rendezvous point alive.",
        "The tea shop was quiet, save for the gentle bubbling of the kettle and the turning of pages. Outside, the autumn leaves drifted lazily to the ground, covering the cobblestone street in a blanket of gold and crimson. Eliza sipped her Earl Grey, watching the world go by through the frosted windowpane, feeling a sense of peace she hadn't known in years.",
        "Dust storms rolled across the Martian horizon, swallowing the habitat domes in a cloud of rust-colored fury. Commander Lewis checked the seal on her airlock one last time, her heart pounding against her ribs. They said the artifact was just a myth, a geological anomaly, but the signal pulsing on her tracker told a different story—one that defied all logic.",
        "The ballroom was alive with the sound of violins and the rustle of silk gowns. Chandeliers dripped with crystals, casting a prism of light over the masked dancers who twirled in synchronized elegance. Beneath the facade of celebration, however, spies whispered in shadowed corners, and alliances were forged and broken with the tilt of a fan."
    ];

    function resetStory() {
        storyText.value = '';
        storyText.classList.add('hidden');
        placeholderText.classList.remove('hidden');
        readAloudBtn.disabled = true;
        stopReadBtn.classList.add('hidden');
        readAloudBtn.classList.remove('hidden');
        if (synth.speaking) {
            synth.cancel();
        }
    }

    generateBtn.addEventListener('click', async () => {
        if (!currentImage) return;

        // UI Loading State
        generateBtn.disabled = true;
        btnText.textContent = "Analyzing & Writing...";
        loadingSpinner.classList.remove('hidden');
        resetStory();

        try {
            // Simulate API Call delay (2-4 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

            // Select a random story for the mock
            // In a real app, we would send `currentImage` to an API endpoint.
            const randomStory = mockStories[Math.floor(Math.random() * mockStories.length)];

            // Typewriter effect
            placeholderText.classList.add('hidden');
            storyText.classList.remove('hidden');
            storyText.value = "";

            let i = 0;
            const typingSpeed = 30; // ms per char

            function typeWriter() {
                if (i < randomStory.length) {
                    storyText.value += randomStory.charAt(i);
                    i++;
                    setTimeout(typeWriter, typingSpeed);
                } else {
                    // Finished typing
                    generateBtn.disabled = false;
                    btnText.textContent = "Ghostwrite Story";
                    loadingSpinner.classList.add('hidden');
                    readAloudBtn.disabled = false;
                }
            }
            typeWriter();

        } catch (error) {
            console.error("Error generating story:", error);
            placeholderText.textContent = "Error generating story. Please try again.";
            generateBtn.disabled = false;
            btnText.textContent = "Ghostwrite Story";
            loadingSpinner.classList.add('hidden');
        }
    });


    // --- Text to Speech ---

    function populateVoices() {
        voices = synth.getVoices();
        voiceSelect.innerHTML = '<option value="">Default Voice</option>';

        voices.forEach((voice, index) => {
            // Filter for English voices for better demo quality, or list all
            if (voice.lang.includes('en')) {
                const option = document.createElement('option');
                option.textContent = `${voice.name} (${voice.lang})`;
                option.value = index;
                voiceSelect.appendChild(option);
            }
        });
    }

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    readAloudBtn.addEventListener('click', () => {
        const text = storyText.value;
        if (!text) return;

        if (synth.speaking) {
            console.error('speechSynthesis.speaking');
            return;
        }

        const utterThis = new SpeechSynthesisUtterance(text);

        const selectedVoiceIndex = voiceSelect.value;
        if (selectedVoiceIndex) {
            utterThis.voice = voices[selectedVoiceIndex];
        }

        // Add some expressiveness (pitch/rate) - subtle tweaks
        utterThis.pitch = 1;
        utterThis.rate = 0.9; // Slightly slower for storytelling

        utterThis.onend = function (event) {
            isSpeaking = false;
            stopReadBtn.classList.add('hidden');
            readAloudBtn.classList.remove('hidden');
        };

        utterThis.onerror = function (event) {
            console.error('SpeechSynthesisUtterance.onerror');
            isSpeaking = false;
            stopReadBtn.classList.add('hidden');
            readAloudBtn.classList.remove('hidden');
        };

        synth.speak(utterThis);
        isSpeaking = true;
        readAloudBtn.classList.add('hidden');
        stopReadBtn.classList.remove('hidden');
    });

    stopReadBtn.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel();
            isSpeaking = false;
            stopReadBtn.classList.add('hidden');
            readAloudBtn.classList.remove('hidden');
        }
    });

});
