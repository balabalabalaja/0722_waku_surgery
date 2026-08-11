import {strict as assert} from 'node:assert';
import test from 'node:test';
import {
  angleDelta,
  angleForSlot,
  selectedIndex,
  slotAngle,
  snapTarget,
  stepDial,
} from '../src/engine/dialmath.ts';

test('selection tracks the front-arc focus point across rotation', () => {
  assert.equal(slotAngle(0, 8), -Math.PI / 2);
  for (const n of [8, 10]) {
    for (let i = 0; i < n; i++) {
      assert.equal(selectedIndex(angleForSlot(i, n), n), i, `slot ${i}/${n} on focus`);
    }
  }
  // Rotating one step backwards advances the selection by one, wrapping.
  const step = (Math.PI * 2) / 8;
  assert.equal(selectedIndex(angleForSlot(0, 8) - step, 8), 1);
  assert.equal(selectedIndex(angleForSlot(0, 8) + step, 8), 7);
  assert.equal(selectedIndex(angleForSlot(0, 8) - step * 8, 8), 0, 'full turn wraps');
});

test('angleDelta wraps across the seam', () => {
  assert.ok(Math.abs(angleDelta(Math.PI - 0.1, -Math.PI + 0.1) - 0.2) < 1e-9);
  assert.ok(Math.abs(angleDelta(-Math.PI + 0.1, Math.PI - 0.1) + 0.2) < 1e-9);
});

test('momentum decays and settles exactly on a snap point', () => {
  let sim = {angle: 0.3, velocity: 4};
  for (let i = 0; i < 600; i++) sim = stepDial(sim, 1 / 60, 8);
  assert.equal(sim.velocity, 0);
  assert.ok(Math.abs(sim.angle - snapTarget(sim.angle, 8)) < 1e-9, 'landed on a slot');
  // A snap point puts an integer slot exactly on the focus.
  const idx = selectedIndex(sim.angle, 8);
  assert.ok(Math.abs(angleDelta(sim.angle, angleForSlot(idx, 8))) < 1e-9);
});
