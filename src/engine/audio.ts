let audioContext: AudioContext | null = null;

export function primeAudio() {
  if (typeof AudioContext !== 'function') return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume().catch(() => {});
  } catch {
    // Audio cues are optional, including in browser previews.
  }
}

export function playSecurityCue(kind: 'incident' | 'arrival' | 'flashlight' | 'cctv' | 'clue') {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  if (kind === 'flashlight') {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
    return;
  }

  if (kind === 'cctv') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
    return;
  }

  if (kind === 'clue') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(659.25, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.36);
    return;
  }

  oscillator.type = kind === 'incident' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(kind === 'incident' ? 440 : 660, now);
  if (kind === 'incident') oscillator.frequency.setValueAtTime(590, now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.44);
}
