class WorkoutAudioSynth {
  private ctx: AudioContext | null = null;
  private audioPool: HTMLAudioElement[] = [];
  private currentPoolIndex: number = 0;
  private sharedAudio: HTMLAudioElement | null = null;
  private isSpeakingLocal: boolean = false;
  private voiceMode: 'cloud' | 'native' = 'native';
  
  // Rate limits and state tracking to prevent "dutdutdut" buffer overflows
  private lastSpeechText: string = "";
  private lastSpeechStartTime: number = 0;

  // High-performance cache of decodes directly into AudioBuffers for 0ms latency countdowns on mobile Safari/Chrome
  private audioBufferCache: Record<string, AudioBuffer> = {};

  // Keep active SpeechSynthesisUtterance references to avoid garbage collection drop-outs (iOS Safari / Android Chrome issue)
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Pre-initialize a pool of 3 Audio channels for overlapping/seamless coaching voice streams
      for (let i = 0; i < 3; i++) {
        const audio = new Audio();
        audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        this.audioPool.push(audio);
      }
      this.sharedAudio = this.audioPool[0];

      // Auto-detect best voice engine choice under browser / mobile constraints:
      // Mobile and iframe containers block raw streaming assets frequently, so we default to the Native system voice synthesis.
      const savedMode = localStorage.getItem('workout_voice_mode');
      if (savedMode === 'cloud' || savedMode === 'native') {
        this.voiceMode = savedMode;
      } else {
        this.voiceMode = (this.isMobileDevice() || this.isInIframe()) ? 'native' : 'cloud';
      }
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Warm up voice list
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  getVoiceMode(): 'cloud' | 'native' {
    return this.voiceMode;
  }

  setVoiceMode(mode: 'cloud' | 'native') {
    this.voiceMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout_voice_mode', mode);
    }
  }

  getSharedAudio(): HTMLAudioElement | null {
    return this.sharedAudio;
  }

  init() {
    if (typeof window !== 'undefined' && this.audioPool.length === 0) {
      for (let i = 0; i < 3; i++) {
        const audio = new Audio();
        audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        this.audioPool.push(audio);
      }
      this.sharedAudio = this.audioPool[0];
    }
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  // Preloads countdown assets directly as AudioBuffers inside Web Audio API for 100% gapless offline mobile response
  preloadCountdown() {
    this.init();
    
    const items = ["Get ready", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
    console.log("[AudioSynth] Pre-fetching zero-lag audio buffers for workout countdown...");
    
    // Stagger fetches to respect device bandwidth constraints
    items.forEach((text, index) => {
      setTimeout(() => {
        if (this.audioBufferCache[text]) return;
        try {
          const url = this.getTtsUrl(text);
          fetch(url)
            .then(res => {
              if (res.ok) return res.arrayBuffer();
              throw new Error("Failed to load stream");
            })
            .then(arrayBuffer => {
              if (this.ctx) {
                this.ctx.decodeAudioData(arrayBuffer, (decoded) => {
                  this.audioBufferCache[text] = decoded;
                  console.log(`[AudioSynth] Pre-decoded buffer for countdown: "${text}"`);
                }, (err) => {
                  console.warn(`[AudioSynth] Decode error for "${text}":`, err);
                });
              }
            })
            .catch(e => {
              console.warn(`[AudioSynth] Background pre-fetch fail for "${text}":`, e);
            });
        } catch (e) {
          console.warn(`[AudioSynth] Error launching prefetch for "${text}":`, e);
        }
      }, index * 120);
    });
  }

  private playAudioBuffer(buffer: AudioBuffer, rate: number = 1.0) {
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(rate, this.ctx.currentTime);
      source.connect(this.ctx.destination);
      source.start(0);
    } catch (e) {
      console.warn("[AudioSynth] Failed to play AudioBuffer:", e);
    }
  }

  isSpeaking(): boolean {
    const isAudioPlaying = this.audioPool.some(audio => !audio.paused && !audio.ended);
    const isSynthSpeaking = typeof window !== 'undefined' && window.speechSynthesis 
      ? window.speechSynthesis.speaking 
      : false;
    return isAudioPlaying || isSynthSpeaking || this.isSpeakingLocal;
  }

  private getNextPoolAudio(): HTMLAudioElement {
    if (this.audioPool.length === 0) {
      this.init();
    }
    const audio = this.audioPool[this.currentPoolIndex];
    this.currentPoolIndex = (this.currentPoolIndex + 1) % this.audioPool.length;
    return audio;
  }

  stopTts() {
    this.audioPool.forEach(audio => {
      try {
        if (!audio.paused) {
          // Instantly mute to prevent popping crackle clicks, then halt audio stream
          audio.volume = 0;
          audio.pause();
        }
      } catch (err) {}
    });
    
    this.isSpeakingLocal = false;

    // Zero out any Web Speech Synthesis speech to prevent sound engine overlaps
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        if (window.speechSynthesis.speaking) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.cancel();
        }
      } catch (err) {}
    }
  }

  // Detect sandbox iframes (e.g. preview environment) to select local native TTS bypass
  isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  // Generate highly reliable StreamElements Kappa speech URL (free, CORS-enabled, no recaptchas)
  private getTtsUrl(text: string): string {
    const clean = text.trim();
    // Default to a clear, professional English female athletic speech coach (Emma)
    return `https://api.streamelements.com/kappa/v2/speech?voice=Emma&text=${encodeURIComponent(clean)}`;
  }

  speakTts(text: string, rate: number = 1.05, interrupt: boolean = true) {
    this.init();
    
    // Fire-and-forget resume to keep speech action execution purely synchronous (prevents iOS user context drop)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const textToCompare = text.trim();
    if (!textToCompare) return;

    // Anti-spam guardian: If the exact same phrasing is fired within 600ms
    // ignore to completely prevent audio driver loops and "dutdutdut" crackles
    const now = Date.now();
    if (now - this.lastSpeechStartTime < 650 && textToCompare === this.lastSpeechText) {
      return;
    }

    this.lastSpeechText = textToCompare;
    this.lastSpeechStartTime = now;

    // Direct local/native voice routing bypasses network loading entirely to prevent any lag, driver pops, or CORS blocking
    if (this.voiceMode === 'native') {
      if (interrupt) {
        this.stopTts();
      }
      this.speakNative(textToCompare, rate);
      return;
    }

    // 1. Web Audio Decoded Cache first (0ms latency, handles countdowns perfectly offline on iOS inside frames!)
    const cachedBuffer = this.audioBufferCache[textToCompare];
    if (cachedBuffer) {
      if (interrupt) {
        this.stopTts();
      }
      this.playAudioBuffer(cachedBuffer, rate);
      return;
    }

    if (interrupt) {
      this.stopTts();
    }

    // 2. Play over one of our pooled, user-gesture blessed HTML5 Audio channels (Cloud mode)
    try {
      const audio = this.getNextPoolAudio();
      audio.volume = 1.0;
      audio.playbackRate = rate;

      const playUrl = this.getTtsUrl(textToCompare);
      audio.src = playUrl;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        this.isSpeakingLocal = true;
        playPromise.then(() => {
          audio.onended = () => {
            if (!this.audioPool.some(a => !a.paused && !a.ended)) {
              this.isSpeakingLocal = false;
            }
          };
        }).catch((err) => {
          console.warn(`[AudioSynth] HTML5 Play failed for "${textToCompare}", trying native fallback:`, err);
          this.speakNative(textToCompare, rate);
        });
      }
    } catch (e) {
      console.warn("[AudioSynth] HTML play stream throw error, using native fallback", e);
      this.speakNative(textToCompare, rate);
    }
  }

  isMobileDevice(): boolean {
    if (typeof window === 'undefined' || !window.navigator) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Warm up Web Audio context
    try {
      if (this.ctx) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      }
    } catch (e) {}

    // Unlock our pooled HTML5 Audio elements on mobile Safari/Chrome by playing a silent WAV base64
    this.audioPool.forEach((audio, idx) => {
      try {
        audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`[AudioSynth] HTML5 Audio pool element ${idx} successfully unlocked on mobile!`);
          }).catch((err) => {
            console.warn(`[AudioSynth] HTML Audio pool ${idx} activation warning:`, err);
          });
        }
      } catch (e) {
        console.warn(`[AudioSynth] Silent unlock pool ${idx} caught:`, e);
      }
    });

    // Warm up native speech synthesis engine with blank female utterance
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0.01;
        u.rate = 1.0;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  private speakNative(text: string, rate: number) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      // 1. Force SpeechSynthesis resumption to prevent deadlock stalls of the queue
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // 2. Safe cancel if speaking to prevent speech engine overlap
      if (window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (err) {
          console.warn("[AudioSynth] Synthesis cancel error:", err);
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate * 0.95;
      utterance.pitch = 1.05; // Friendly, high-energy coaching tone
      utterance.volume = 1.0;

      // 3. Keep strong references of the SpeechSynthesisUtterance object inside activeUtterances
      // to completely prevent garbage collection from silently stopping speech on iOS/Android
      this.activeUtterances.add(utterance);
      
      const cleanUp = () => {
        this.activeUtterances.delete(utterance);
      };

      utterance.onend = cleanUp;
      utterance.onerror = (evt) => {
        console.warn("[AudioSynth] Native TTS utterance error event:", evt);
        cleanUp();
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Standard female athletic coach selection (prefers Samantha on iOS, Emma/Salli/Joanna on PC/Android)
        const femaleVoice = voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Zira') || 
          v.name.includes('Karen') || 
          v.name.includes('Emma') || 
          v.name.includes('Salli') || 
          v.name.includes('Joanna') || 
          v.name.toLowerCase().includes('female') ||
          (v.lang.startsWith('en') && v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('male'))
        );
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
      }

      // 4. Force synthesis resume right before speaking to ensure native queue state is unblocked
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("[AudioSynth] Native speech synthesis fallback error:", e);
    }
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
    this.init();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration - 0.02);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Failed to play tone", e);
    }
  }

  playRepComplete() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Pleasant C major chime)
    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'triangle'; // Mellow tone
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      } catch (err) {}
    });
  }

  playPostureWarning() {
    this.playTone(330, 0.1, 'sine', 0.1); // Mi
    setTimeout(() => {
      this.playTone(220, 0.15, 'sine', 0.1); // La (descending warning)
    }, 120);
  }

  playCountdown() {
    this.playTone(400, 0.08, 'sine', 0.08);
  }

  playStartWorkout() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25]; // G4, C5, E5
    notes.forEach((freq, idx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0.08, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.4);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      } catch (err) {}
    });
  }
}

export const audioSynth = new WorkoutAudioSynth();
