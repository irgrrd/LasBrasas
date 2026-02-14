import lamejs from "lamejs";

export const encodeToMp3 = (audioBuffer) => {
    // Check if stereo or mono
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128kbps

    const samplesLeft = audioBuffer.getChannelData(0);
    const samplesRight = channels > 1 ? audioBuffer.getChannelData(1) : samplesLeft;

    // Convert Float32 to Int16
    // Lamejs requires Int16 (values between -32768 and 32767)
    const length = samplesLeft.length;
    const sampleBlockSize = 1152; // multiple of 576
    const mp3Data = [];

    const left = new Int16Array(length);
    const right = new Int16Array(length);

    for (let i = 0; i < length; i++) {
        // Clamp and scale
        const sL = Math.max(-1, Math.min(1, samplesLeft[i]));
        left[i] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;

        if (channels > 1) {
            const sR = Math.max(-1, Math.min(1, samplesRight[i]));
            right[i] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
        } else {
            right[i] = left[i];
        }
    }

    let remaining = length;
    let i = 0;

    while (remaining >= sampleBlockSize) {
        const leftChunk = left.subarray(i, i + sampleBlockSize);
        const rightChunk = right.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        remaining -= sampleBlockSize;
        i += sampleBlockSize;
    }

    // Flush
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
};
