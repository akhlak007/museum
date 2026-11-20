let audioContext: AudioContext | null = null;

export function primeAudio() {
  audioContext ??= new AudioContext();
  void audioContext.resume();
}

export function playSecurityCue(kind: 'incident' | 'arrival') {
  if (!audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
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
