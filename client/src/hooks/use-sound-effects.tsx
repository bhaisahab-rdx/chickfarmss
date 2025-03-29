import { useState, useEffect, useCallback } from 'react';

// Interface for SoundEffect options
interface SoundEffectOptions {
  volume?: number;
  loop?: boolean;
}

// Interface for Sound Effect Controls
export interface SoundControls {
  play: () => Promise<void> | undefined;
  stop: () => void;
  setVolume: (volume: number) => void;
}

export function useSoundEffect(
  soundPath: string,
  options: SoundEffectOptions = {}
): [SoundControls, boolean] {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Check for stored mute preference in localStorage
    const storedPreference = localStorage.getItem('chickfarms-sound-muted');
    return storedPreference ? storedPreference === 'true' : false;
  });

  // Initialize audio
  useEffect(() => {
    const audioElement = new Audio(soundPath);
    audioElement.volume = options.volume ?? 0.7;
    audioElement.loop = options.loop ?? false;
    setAudio(audioElement);

    // Update playing status when audio ends
    const handleEnded = () => setIsPlaying(false);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.pause();
    };
  }, [soundPath, options.volume, options.loop]);

  // Track global mute state
  useEffect(() => {
    const updateMuteState = (e: StorageEvent) => {
      if (e.key === 'chickfarms-sound-muted') {
        setIsMuted(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', updateMuteState);
    return () => window.removeEventListener('storage', updateMuteState);
  }, []);

  // Apply mute state to audio
  useEffect(() => {
    if (audio) {
      audio.muted = isMuted;
    }
  }, [audio, isMuted]);

  // Play sound
  const play = useCallback(() => {
    if (audio) {
      // Reset to beginning if already playing
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      // Handle browsers that return a promise from audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((e: Error) => {
          console.error("Failed to play audio:", e);
        });
      }
      
      setIsPlaying(true);
      
      // Return the promise for chaining or error handling
      return playPromise;
    }
    // Return a resolved promise if no audio
    return Promise.resolve();
  }, [audio]);

  // Stop sound
  const stop = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audio]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, [audio]);

  return [{ play, stop, setVolume }, isPlaying];
}

// Global sound toggle
export function useSoundToggle(): [boolean, () => void] {
  const [isMuted, setIsMuted] = useState(() => {
    const storedPreference = localStorage.getItem('chickfarms-sound-muted');
    return storedPreference ? storedPreference === 'true' : false;
  });

  const toggleMute = useCallback(() => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('chickfarms-sound-muted', newMuteState.toString());
  }, [isMuted]);

  return [isMuted, toggleMute];
}