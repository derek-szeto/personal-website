// The site stays inert until the outgoing overlay has finished its exit.
// Storage, focus, scroll locking, and animation timing belong to App.
export function isGatewayHomeHash(hash = '') {
  return hash === '' || hash === '#home';
}

export function initialIntroPhase({ hash = '', reduced = false, introSeen = false } = {}) {
  if (!isGatewayHomeHash(hash)) return 'site';
  return !reduced && !introSeen ? 'intro' : 'gateway';
}

export function createIntroFlow(options = {}) {
  const phase = initialIntroPhase(options);
  return { phase, pendingPhase: null, cycle: 0, exitId: 0, target: phase === 'site' ? 'route' : null };
}

export function isIntroFlowReady(state) {
  return state.phase === 'site' && state.pendingPhase === null;
}

export function getIntroOverlay(state) {
  return state.phase !== 'site' && state.pendingPhase === null ? state.phase : null;
}

function requestExit(state, pendingPhase, target) {
  // A changed route can replace the destination of an exit already in flight.
  // Keep that exit's ID so its completion commits the latest destination.
  return {
    ...state,
    pendingPhase,
    exitId: state.pendingPhase === null ? state.exitId + 1 : state.exitId,
    target,
  };
}

export function introFlowReducer(state, action) {
  switch (action.type) {
    case 'INTRO_FINISHED':
      if (action.cycle !== state.cycle || state.phase !== 'intro' || state.pendingPhase !== null) return state;
      return requestExit(state, 'gateway', null);
    case 'GATEWAY_ENTERED':
      if (action.cycle !== state.cycle || state.phase !== 'gateway' || state.pendingPhase !== null) return state;
      return requestExit(state, 'site', 'directory');
    case 'EXIT_COMPLETE':
      if (state.pendingPhase === null || action.exitId !== state.exitId) return state;
      return { ...state, phase: state.pendingPhase, pendingPhase: null, cycle: state.cycle + 1 };
    case 'NAVIGATE':
      if (isIntroFlowReady(state)) return { ...state, target: 'route' };
      if (isGatewayHomeHash(action.hash)) return state;
      return requestExit(state, 'site', 'route');
    case 'REPLAY': {
      const phase = action.reduced ? 'gateway' : 'intro';
      if (!isIntroFlowReady(state)) return requestExit(state, phase, null);
      return { ...state, phase, pendingPhase: null, cycle: state.cycle + 1, target: null };
    }
    case 'TARGET_HANDLED':
      if (action.cycle !== state.cycle || !isIntroFlowReady(state) || state.target === null) return state;
      return { ...state, target: null };
    default:
      return state;
  }
}
