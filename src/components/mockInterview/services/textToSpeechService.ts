import { useCallback, useRef, useState, useEffect } from "react";

interface TextToSpeechOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

interface UseTextToSpeechReturn extends TTSState {
  speak: (text: string, options?: TextToSpeechOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  getVoiceByName: (name: string) => SpeechSynthesisVoice | null;
}

const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    currentText: null,
    availableVoices: [],
    selectedVoice: null,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  const loadVoices = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    setState((prev) => ({
      ...prev,
      availableVoices: voices,
      selectedVoice:
        prev.selectedVoice ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") && voice.name.includes("Female")
        ) ||
        voices[0] ||
        null,
    }));
  }, []);

  // Initialize voices on mount and when voices change
  useEffect(() => {
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [loadVoices]);

  // Speak text with options
  const speak = useCallback(
    (text: string, options: TextToSpeechOptions = {}) => {
      // Stop any current speech
      speechSynthesis.cancel();

      if (!text.trim()) {
        console.warn("No text provided for speech synthesis");
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Set voice options
        if (state.selectedVoice) {
          utterance.voice = state.selectedVoice;
        }

        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;
        utterance.lang = options.language ?? "en-US";

        // Event handlers
        utterance.onstart = () => {
          setState((prev) => ({
            ...prev,
            isSpeaking: true,
            isPaused: false,
            currentText: text,
          }));
        };

        utterance.onend = () => {
          setState((prev) => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: null,
          }));
          utteranceRef.current = null;
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setState((prev) => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
            currentText: null,
          }));
          utteranceRef.current = null;
        };

        utterance.onpause = () => {
          setState((prev) => ({
            ...prev,
            isPaused: true,
          }));
        };

        utterance.onresume = () => {
          setState((prev) => ({
            ...prev,
            isPaused: false,
          }));
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error creating speech utterance:", error);
      }
    },
    [state.selectedVoice]
  );

  // Pause speech
  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }, []);

  // Resume speech
  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }, []);

  // Stop speech
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setState((prev) => ({
      ...prev,
      isSpeaking: false,
      isPaused: false,
      currentText: null,
    }));
    utteranceRef.current = null;
  }, []);

  // Set selected voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setState((prev) => ({
      ...prev,
      selectedVoice: voice,
    }));
  }, []);

  // Get voice by name
  const getVoiceByName = useCallback(
    (name: string): SpeechSynthesisVoice | null => {
      return state.availableVoices.find((voice) => voice.name === name) || null;
    },
    [state.availableVoices]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
    setVoice,
    getVoiceByName,
  };
};

// TTS Service class for more advanced features
export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private queue: Array<{
    text: string;
    options?: TextToSpeechOptions;
    callback?: () => void;
  }> = [];
  private isProcessing = false;

  static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  // Add text to speech queue
  queueSpeech(
    text: string,
    options?: TextToSpeechOptions,
    callback?: () => void
  ): void {
    this.queue.push({ text, options, callback });
    this.processQueue();
  }

  // Process speech queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        await this.speakPromise(item.text, item.options);
        if (item.callback) {
          item.callback();
        }
      }
    }

    this.isProcessing = false;
  }

  // Promise-based speech synthesis
  private speakPromise(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.language ?? "en-US";

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);

      speechSynthesis.speak(utterance);
    });
  }

  // Clear speech queue
  clearQueue(): void {
    this.queue = [];
    speechSynthesis.cancel();
    this.isProcessing = false;
  }

  // Generate SSML for more natural speech
  generateSSML(
    text: string,
    emphasis?: "strong" | "moderate",
    pauseDuration?: string
  ): string {
    let ssml = text;

    if (emphasis) {
      ssml = `<emphasis level="${emphasis}">${ssml}</emphasis>`;
    }

    if (pauseDuration) {
      ssml = `${ssml}<break time="${pauseDuration}"/>`;
    }

    return `<speak>${ssml}</speak>`;
  }
}

export default useTextToSpeech;
