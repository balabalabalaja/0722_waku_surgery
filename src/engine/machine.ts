// Pure top-level state machine. Side effects (camera, audio, canvas) live
// outside; this module only decides transitions so it is unit-testable.

export type Stage = 'boot' | 'ready' | 'active' | 'fallback' | 'resolve' | 'result';

export type PlayStage = 'ready' | 'active' | 'fallback';

export interface MachineState {
  stage: Stage;
  cameraOk: boolean | null; // null = still unknown
  modelsOk: boolean | null;
  faceVisible: boolean;
  dressed: boolean; // the auto random full-set has been applied at least once
  prevPlay: PlayStage; // where resolve/result returns to
}

export type MachineEvent =
  | {type: 'CAMERA_OK'}
  | {type: 'CAMERA_FAIL'}
  | {type: 'MODELS_OK'}
  | {type: 'MODELS_FAIL'}
  | {type: 'FACE_FOUND'}
  | {type: 'FACE_LOST'}
  | {type: 'DRESS_TIMEOUT'} // ready >Ns with no face: dress the default anchors anyway
  | {type: 'SHUTTER'}
  | {type: 'CARD_READY'}
  | {type: 'RESOLVE_FAIL'}
  | {type: 'AGAIN'};

export const initialMachine: MachineState = {
  stage: 'boot',
  cameraOk: null,
  modelsOk: null,
  faceVisible: false,
  dressed: false,
  prevPlay: 'ready',
};

// boot leaves as soon as both probes settle. Models are required for face
// tracking, so any failure lands in fallback (camera may still be live there —
// the backdrop is decided by cameraOk, not by the stage).
function settleBoot(s: MachineState): MachineState {
  if (s.cameraOk === null || s.modelsOk === null) return s;
  if (s.cameraOk && s.modelsOk) return {...s, stage: 'ready', prevPlay: 'ready'};
  return {...s, stage: 'fallback', prevPlay: 'fallback', dressed: true};
}

export function reduce(s: MachineState, e: MachineEvent): MachineState {
  switch (e.type) {
    case 'CAMERA_OK':
      return s.stage === 'boot' ? settleBoot({...s, cameraOk: true}) : {...s, cameraOk: true};
    case 'CAMERA_FAIL':
      return s.stage === 'boot' ? settleBoot({...s, cameraOk: false}) : {...s, cameraOk: false};
    case 'MODELS_OK':
      return s.stage === 'boot' ? settleBoot({...s, modelsOk: true}) : {...s, modelsOk: true};
    case 'MODELS_FAIL':
      return s.stage === 'boot' ? settleBoot({...s, modelsOk: false}) : {...s, modelsOk: false};

    case 'FACE_FOUND': {
      if (s.stage === 'ready') {
        return {...s, stage: 'active', prevPlay: 'active', faceVisible: true, dressed: true};
      }
      if (s.stage === 'active') return {...s, faceVisible: true};
      // In resolve/result the face may come and go; only track visibility.
      if (s.stage === 'resolve' || s.stage === 'result') return {...s, faceVisible: true};
      return s;
    }
    case 'FACE_LOST':
      return {...s, faceVisible: false};

    case 'DRESS_TIMEOUT':
      return s.stage === 'ready' && !s.dressed ? {...s, dressed: true} : s;

    case 'SHUTTER': {
      if (s.stage === 'ready' || s.stage === 'active' || s.stage === 'fallback') {
        return {...s, stage: 'resolve', prevPlay: s.stage};
      }
      return s;
    }
    case 'CARD_READY':
      return s.stage === 'resolve' ? {...s, stage: 'result'} : s;
    case 'RESOLVE_FAIL':
      return s.stage === 'resolve' ? {...s, stage: s.prevPlay} : s;
    case 'AGAIN':
      return s.stage === 'result' ? {...s, stage: s.prevPlay} : s;
    default:
      return s;
  }
}
