// src/core/AudioManager.ts
export class AudioManager {
    private audioContext: AudioContext;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private masterGain: GainNode;

    constructor() {
        this.audioContext =
            new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        console.log("AudioContext initialized.");
    }

    async loadSound(name: string, url: string): Promise<void> {
        // Resume context on user gesture if needed
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        if (this.soundBuffers.has(name)) {
            console.log(`Sound "${name}" already loaded.`);
            return;
        }

        try {
            console.log(`Loading sound: ${name} from ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `HTTP error! status: ${response.status} for ${url}`,
                );
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(
                arrayBuffer,
            );
            this.soundBuffers.set(name, audioBuffer);
            console.log(`Sound "${name}" loaded and decoded successfully.`);
        } catch (error) {
            console.error(`Error loading sound "${name}" from ${url}:`, error);
        }
    }

    playSound(name: string, volume: number = 1.0): void {
        // Resume context on user gesture if needed
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume().then(() => {
                this._playSoundInternal(name, volume);
            });
        } else {
            this._playSoundInternal(name, volume);
        }
    }

    private _playSoundInternal(name: string, volume: number = 1.0): void {
        const buffer = this.soundBuffers.get(name);
        if (!buffer) {
            console.warn(`Sound "${name}" not found or not loaded yet.`);
            return;
        }

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Create a gain node for this specific sound instance
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(
                Math.max(0, Math.min(1, volume)),
                this.audioContext.currentTime,
            ); // Clamp volume between 0 and 1

            // Connect source -> gainNode -> masterGain -> destination
            source.connect(gainNode);
            gainNode.connect(this.masterGain);

            source.start(0);
            console.log(`Playing sound: ${name} with volume: ${volume}`);
        } catch (error) {
            console.error(`Error playing sound "${name}":`, error);
        }
    }

    // Optional: Method to set master volume
    setMasterVolume(volume: number): void {
        this.masterGain.gain.setValueAtTime(
            Math.max(0, Math.min(1, volume)),
            this.audioContext.currentTime,
        );
    }
}
