let audioContext: AudioContext | null = null;

function getAudioContext() {
  audioContext ??= new AudioContext();
  return audioContext;
}

export async function primeTimerFeedback() {
  const notificationPermission =
    "Notification" in window && Notification.permission === "default"
      ? Notification.requestPermission().catch(() => "denied" as const)
      : null;

  try {
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.01);
  } catch {
    // El navegador puede bloquear audio hasta recibir una interacción válida.
  }

  await notificationPermission;
}

export async function playTimerTone(kind: "warning" | "complete") {
  try {
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    const frequencies = kind === "complete" ? [784, 988, 1_176] : [660, 784];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime + index * 0.16;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.18, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.24);
    });
  } catch {
    // Si el navegador bloquea audio, el aviso visual permanece disponible.
  }
}

export function showBackgroundNotification(
  title: string,
  body: string,
  tag: string,
) {
  if (
    document.hidden &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(title, { body, tag });
    } catch {
      // Algunos navegadores móviles exigen un service worker.
    }
  }
}
