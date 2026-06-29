import confetti from 'canvas-confetti'

export function fireImportConfetti() {
  const defaults = {
    origin: { y: 0.62 },
    zIndex: 9999,
    ticks: 120,
    gravity: 1.1,
    scalar: 0.75,
  }

  confetti({
    ...defaults,
    particleCount: 70,
    spread: 60,
    startVelocity: 32,
  })

  window.setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 35,
      spread: 80,
      startVelocity: 24,
    })
  }, 140)
}
