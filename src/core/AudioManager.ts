// src/core/AudioManager.ts
import { DebugControl } from "../components/DebugControl"; // Added

export class AudioManager {
    private audioContext: AudioContext;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private masterGain: GainNode;
    private debugControl?: DebugControl; // Ensure it's optional

    constructor() { // Removed parameter
        // this.debugControl = debugControl; // Removed assignment
        this.audioContext =
            new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        // Log will happen when debugControl is set
    }

    /**
     * Sets the DebugControl instance for logging.
     * @param debugControl - The DebugControl instance.
     */
    public setDebugControl(debugControl: DebugControl): void { // Added method
        this.debugControl = debugControl;
        // Log initial state now that we have the logger
        this.debugControl?.logEvent("AudioContextInit", {
            state: this.audioContext.state,
        });
    }

    async loadSound(name: string, url: string): Promise<void> {
        // Resume context on user gesture if needed
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        if (this.soundBuffers.has(name)) {
            this.debugControl?.logEvent("SoundLoadSkip", { // Added ?.
                name,
                reason: "Already loaded",
            });
            return;
        }

        try {
            if (import.meta.env.VITE_ROOT_URL_SUBFOLDER) {
                url = import.meta.env.VITE_ROOT_URL_SUBFOLDER + url;
            }

            this.debugControl?.logEvent("SoundLoadStart", {
                "import.meta.env.VITE_ROOT_URL_SUBFOLDER":
                    import.meta.env.VITE_ROOT_URL_SUBFOLDER,
                name,
                url,
            }); // Added ?.
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
            this.debugControl?.logEvent("SoundLoadSuccess", { name }); // Added ?.
        } catch (error) {
            console.error(`Error loading sound "${name}" from ${url}:`, error); // Keep console.error
            this.debugControl?.logEvent("SoundLoadError", { name, url, error }); // Added ?.
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
            console.warn(`Sound "${name}" not found or not loaded yet.`); // Keep console.warn
            this.debugControl?.logEvent("SoundPlayWarning", { // Added ?.
                name,
                reason: "Not found or not loaded",
            });
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
            this.debugControl?.logEvent("SoundPlay", { name, volume }); // Added ?.
        } catch (error) {
            console.error(`Error playing sound "${name}":`, error); // Keep console.error
            this.debugControl?.logEvent("SoundPlayError", { name, error }); // Added ?.
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
