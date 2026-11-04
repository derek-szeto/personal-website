import test from 'node:test';
import assert from 'node:assert/strict';
import { createIntroFlow, getIntroOverlay, initialIntroPhase, introFlowReducer, isIntroFlowReady } from './introFlow.js';

const reduce = introFlowReducer;
const finishExit = state => reduce(state, { type: 'EXIT_COMPLETE', exitId: state.exitId });

test('only an empty hash or #home runs the intro and gateway', () => {
  for (const hash of ['', '#home']) {
    assert.equal(initialIntroPhase({ hash }), 'intro');
    assert.equal(initialIntroPhase({ hash, introSeen: true }), 'gateway');
    assert.equal(initialIntroPhase({ hash, reduced: true }), 'gateway');
  }
  for (const hash of ['#about', '#directory', '#photos', '#vacations', '#contact', '#main-content', '#/projects', '#interests', '#/interests', '#/interests/music', '#unknown']) {
    assert.equal(initialIntroPhase({ hash }), 'site', hash);
    assert.equal(initialIntroPhase({ hash, reduced: true, introSeen: true }), 'site', hash);
  }
});

test('intro exit completes before the gateway can mount', () => {
  const initial = createIntroFlow();
  assert.equal(getIntroOverlay(initial), 'intro');
  const exiting = reduce(initial, { type: 'INTRO_FINISHED', cycle: initial.cycle });
  assert.equal(getIntroOverlay(exiting), null);
  assert.equal(exiting.pendingPhase, 'gateway');
  assert.equal(isIntroFlowReady(exiting), false);
  const gateway = finishExit(exiting);
  assert.equal(getIntroOverlay(gateway), 'gateway');
  assert.equal(gateway.cycle, initial.cycle + 1);
  assert.equal(isIntroFlowReady(gateway), false);
});

test('entering the gateway defers Directory focus until its exit completes', () => {
  const gateway = createIntroFlow({ introSeen: true });
  const exiting = reduce(gateway, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle });
  assert.equal(exiting.target, 'directory');
  assert.equal(isIntroFlowReady(exiting), false);
  const site = finishExit(exiting);
  assert.equal(isIntroFlowReady(site), true);
  assert.equal(site.target, 'directory');
  assert.equal(getIntroOverlay(site), null);
  assert.equal(reduce(site, { type: 'TARGET_HANDLED', cycle: site.cycle }).target, null);
});

test('deep navigation bypasses either active overlay after its exit', () => {
  for (const initial of [createIntroFlow(), createIntroFlow({ reduced: true })]) {
    const exiting = reduce(initial, { type: 'NAVIGATE', hash: '#/interests/music' });
    assert.equal(getIntroOverlay(exiting), null);
    assert.equal(exiting.pendingPhase, 'site');
    assert.equal(isIntroFlowReady(exiting), false);
    const site = finishExit(exiting);
    assert.equal(isIntroFlowReady(site), true);
    assert.equal(site.target, 'route');
  }
});

test('a deep link during intro exit replaces gateway destination without losing the exit callback', () => {
  const intro = createIntroFlow();
  const introExit = reduce(intro, { type: 'INTRO_FINISHED', cycle: intro.cycle });
  const routed = reduce(introExit, { type: 'NAVIGATE', hash: '#/projects' });
  assert.equal(routed.exitId, introExit.exitId);
  assert.equal(routed.pendingPhase, 'site');
  const site = reduce(routed, { type: 'EXIT_COMPLETE', exitId: introExit.exitId });
  assert.equal(isIntroFlowReady(site), true);
  assert.equal(site.target, 'route');
});

test('navigation during gateway exit cancels the queued Directory target', () => {
  const gateway = createIntroFlow({ introSeen: true });
  const exit = reduce(gateway, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle });
  const routed = reduce(exit, { type: 'NAVIGATE', hash: '#photos' });
  assert.equal(routed.exitId, exit.exitId);
  assert.equal(finishExit(routed).target, 'route');
});

test('home navigation never reopens the gate within this mounted App', () => {
  const site = createIntroFlow({ hash: '#/projects' });
  const home = reduce(site, { type: 'NAVIGATE', hash: '#home' });
  assert.equal(isIntroFlowReady(home), true);
  assert.equal(getIntroOverlay(home), null);
  const gateway = createIntroFlow({ introSeen: true });
  assert.equal(reduce(gateway, { type: 'NAVIGATE', hash: '#home' }), gateway);
});

test('replay starts both stages, or a static gateway for reduced motion', () => {
  const site = createIntroFlow({ hash: '#about' });
  const replay = reduce(site, { type: 'REPLAY', reduced: false });
  assert.equal(getIntroOverlay(replay), 'intro');
  assert.equal(replay.target, null);
  const gateway = finishExit(reduce(replay, { type: 'INTRO_FINISHED', cycle: replay.cycle }));
  assert.equal(getIntroOverlay(gateway), 'gateway');
  const reduced = reduce(site, { type: 'REPLAY', reduced: true });
  assert.equal(getIntroOverlay(reduced), 'gateway');
});

test('duplicate and stale overlay callbacks cannot skip stages or complete a later exit', () => {
  const intro = createIntroFlow();
  const firstExit = reduce(intro, { type: 'INTRO_FINISHED', cycle: intro.cycle });
  assert.equal(reduce(firstExit, { type: 'INTRO_FINISHED', cycle: intro.cycle }), firstExit);
  const gateway = finishExit(firstExit);
  assert.equal(reduce(gateway, { type: 'INTRO_FINISHED', cycle: intro.cycle }), gateway);
  assert.equal(reduce(gateway, { type: 'EXIT_COMPLETE', exitId: firstExit.exitId }), gateway);
  const secondExit = reduce(gateway, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle });
  assert.equal(reduce(secondExit, { type: 'EXIT_COMPLETE', exitId: firstExit.exitId }), secondExit);
  const site = finishExit(secondExit);
  const replay = reduce(site, { type: 'REPLAY' });
  assert.equal(reduce(replay, { type: 'INTRO_FINISHED', cycle: intro.cycle }), replay);
  assert.equal(reduce(replay, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle }), replay);
});

test('replay requested during an exit commits the replay rather than the outdated destination', () => {
  const gateway = createIntroFlow({ introSeen: true });
  const exiting = reduce(gateway, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle });
  const replay = reduce(exiting, { type: 'REPLAY', reduced: true });
  assert.equal(replay.exitId, exiting.exitId);
  const next = finishExit(replay);
  assert.equal(getIntroOverlay(next), 'gateway');
  assert.equal(next.target, null);
});

test('stale target consumption does not discard focus for a newer flow cycle', () => {
  const gateway = createIntroFlow({ introSeen: true });
  const site = finishExit(reduce(gateway, { type: 'GATEWAY_ENTERED', cycle: gateway.cycle }));
  assert.equal(reduce(site, { type: 'TARGET_HANDLED', cycle: gateway.cycle }), site);
  assert.equal(reduce(site, { type: 'UNKNOWN' }), site);
});
