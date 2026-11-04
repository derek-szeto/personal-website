// Shared pacing: quick feedback, a gentle arrival, and no spring overshoot.
export const easeOut = [.22, 1, .36, 1];
export const easeInOut = [.65, 0, .35, 1];
export const revealTransition = { duration: .46, ease: easeOut };
export const quickTransition = { duration: .2, ease: easeOut };
