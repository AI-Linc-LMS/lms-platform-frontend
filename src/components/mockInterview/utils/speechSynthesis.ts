// Text-to-Speech utility for AI Interviewer
export class AIInterviewerVoice {
  private synthesis: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoice();
  }

  private async initializeVoice(): Promise<void> {
    return new Promise((resolve) => {
      const setVoice = () => {
        const voices = this.synthesis.getVoices();
        
        // Prefer specific voices for AI interviewer (professional, clear voices)
        const preferredVoiceNames = [
          'Microsoft Zira - English (United States)',
          'Microsoft David - English (United States)',
          'Google UK English Male',
          'Google US English',
          'Alex',
          'Samantha'
        ];

        // Find the best available voice
        for (const voiceName of preferredVoiceNames) {
          const foundVoice = voices.find(v => v.name.includes(voiceName) || v.name === voiceName);
          if (foundVoice) {
            this.voice = foundVoice;
            break;
          }
        }

        // Fallback to any English voice
        if (!this.voice) {
          this.voice = voices.find(v => 
            v.lang.startsWith('en') && 
            (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('alex'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
        }

        this.isInitialized = true;
        resolve();
      };

      if (this.synthesis.getVoices().length > 0) {
        setVoice();
      } else {
        this.synthesis.onvoiceschanged = setVoice;
      }
    });
  }

  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  } = {}): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.isInitialized) {
        await this.initializeVoice();
      }

      // Stop any current speech
      this.stop();

      if (!this.voice) {
        // No suitable voice found for AI interviewer
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for professional AI interviewer
      utterance.voice = this.voice;
      utterance.rate = options.rate || 0.9; // Slightly slower for clarity
      utterance.pitch = options.pitch || 1.0; // Normal pitch
      utterance.volume = options.volume || 0.8; // Slightly quieter

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (error) => {
        options.onError?.(error);
        reject(error);
      };

      this.synthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }
  }

  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }

  // Get available voices for debugging
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  // Get current voice info
  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.voice;
  }
}

// Predefined AI interviewer speech templates
export const AI_INTERVIEWER_SCRIPTS = {
  introduction: [
    "Hello! Welcome to your interview. I'm your AI interviewer, and I'll be guiding you through today's assessment. This interview will consist of multiple questions. Please answer clearly and confidently. Let's begin!"
  ],
  transitionToQuestion: [
    "Let's move to the next question.",
    "Here's your next question.",
    "Moving forward to the next one."
  ],
  encouragement: [
    "You're doing great! Keep going.",
    "Excellent answer. Let's continue.",
    "Good work. Next question coming up."
  ],
  completion: [
    "Thank you for completing the interview. We'll review your responses and get back to you soon. Have a great day!"
  ]
};

// Create a singleton instance
export const aiInterviewerVoice = new AIInterviewerVoice();

