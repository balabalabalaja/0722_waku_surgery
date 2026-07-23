import {strict as assert} from 'node:assert';
import test from 'node:test';
import {initialMachine, reduce, type MachineEvent, type MachineState} from '../src/engine/machine.ts';

const run = (s: MachineState, events: MachineEvent['type'][]) =>
  events.reduce((acc, type) => reduce(acc, {type} as MachineEvent), s);

test('happy path: boot → ready → active → resolve → result → active', () => {
  let s = run(initialMachine, ['CAMERA_OK', 'MODELS_OK']);
  assert.equal(s.stage, 'ready');
  s = reduce(s, {type: 'FACE_FOUND'});
  assert.equal(s.stage, 'active');
  assert.equal(s.dressed, true, 'first face auto-dresses');
  s = reduce(s, {type: 'SHUTTER'});
  assert.equal(s.stage, 'resolve');
  s = reduce(s, {type: 'CARD_READY'});
  assert.equal(s.stage, 'result');
  s = reduce(s, {type: 'AGAIN'});
  assert.equal(s.stage, 'active');
});

test('camera denied falls back and is immediately dressed + playable to result', () => {
  let s = run(initialMachine, ['CAMERA_FAIL', 'MODELS_OK']);
  assert.equal(s.stage, 'fallback');
  assert.equal(s.dressed, true);
  s = run(s, ['SHUTTER', 'CARD_READY', 'AGAIN']);
  assert.equal(s.stage, 'fallback', 'result returns to fallback');
});

test('models failing with a live camera still lands in fallback with cameraOk', () => {
  const s = run(initialMachine, ['CAMERA_OK', 'MODELS_FAIL']);
  assert.equal(s.stage, 'fallback');
  assert.equal(s.cameraOk, true, 'backdrop can stay live video');
});

test('boot does not settle until both probes report', () => {
  const s = reduce(initialMachine, {type: 'CAMERA_OK'});
  assert.equal(s.stage, 'boot');
});

test('face loss keeps active (toy pace, no failure state)', () => {
  let s = run(initialMachine, ['CAMERA_OK', 'MODELS_OK', 'FACE_FOUND']);
  s = reduce(s, {type: 'FACE_LOST'});
  assert.equal(s.stage, 'active');
  assert.equal(s.faceVisible, false);
});

test('shutter works from ready (no face yet) and resolve failure exits back', () => {
  let s = run(initialMachine, ['CAMERA_OK', 'MODELS_OK']);
  s = reduce(s, {type: 'SHUTTER'});
  assert.equal(s.stage, 'resolve');
  s = reduce(s, {type: 'RESOLVE_FAIL'});
  assert.equal(s.stage, 'ready', 'resolve failure is not a dead end');
});

test('ready dress timeout dresses without a face, once', () => {
  let s = run(initialMachine, ['CAMERA_OK', 'MODELS_OK']);
  s = reduce(s, {type: 'DRESS_TIMEOUT'});
  assert.equal(s.dressed, true);
  assert.equal(s.stage, 'ready');
});

test('liveness: the loop can be walked repeatedly without dead ends', () => {
  let s = run(initialMachine, ['CAMERA_OK', 'MODELS_OK', 'FACE_FOUND']);
  s = run(s, ['SHUTTER', 'CARD_READY', 'AGAIN', 'SHUTTER', 'RESOLVE_FAIL']);
  assert.equal(s.stage, 'active');
  s = run(s, ['SHUTTER', 'CARD_READY', 'AGAIN']);
  assert.equal(s.stage, 'active');
});
