// Pure dial math: slot angles, selection, drag torque, momentum + snap.

export const TAU = Math.PI * 2;

export const slotStep = (n: number) => TAU / n;

// Part i sits at slotAngle(i, n) + dialAngle; slot 0 starts at the top.
export const slotAngle = (i: number, n: number) => -Math.PI / 2 + i * slotStep(n);

export const mod = (a: number, m: number) => ((a % m) + m) % m;

// Local angle of the ring's selection point. Default is the front centre
// (bottom of the tilted ellipse, nearest the viewer); rings whose bottom arc
// hides behind the person (portrait mouth dial) use a side focus instead.
export const FOCUS = Math.PI / 2;

export function selectedIndex(dialAngle: number, n: number, focus = FOCUS): number {
  return mod(Math.round((focus + Math.PI / 2 - dialAngle) / slotStep(n)), n);
}

// Dial angle that puts slot i exactly on the focus point.
export function angleForSlot(i: number, n: number, focus = FOCUS): number {
  return focus + Math.PI / 2 - i * slotStep(n);
}

// Wrapped angular difference in (-PI, PI].
export function angleDelta(from: number, to: number): number {
  let d = to - from;
  while (d <= -Math.PI) d += TAU;
  while (d > Math.PI) d -= TAU;
  return d;
}

export function pointerAngle(cx: number, cy: number, px: number, py: number): number {
  return Math.atan2(py - cy, px - cx);
}

// Nearest dial angle at which some slot sits exactly on the focus point.
export function snapTarget(dialAngle: number, n: number, focus = FOCUS): number {
  const step = slotStep(n);
  const base = focus + Math.PI / 2; // angle of slot 0 alignment
  return base + Math.round((dialAngle - base) / step) * step;
}

export interface DialSim {
  angle: number;
  velocity: number; // rad/s
}

// One integration step of free-spin momentum with exponential decay plus a
// soft spring pulling onto the nearest snap point once slow.
export function stepDial(sim: DialSim, dt: number, n: number, focus = FOCUS): DialSim {
  let {angle, velocity} = sim;
  const SPIN = 1.1; // rad/s — above this, free spin
  if (Math.abs(velocity) > SPIN) {
    angle += velocity * dt;
    velocity *= Math.exp(-2.2 * dt);
  } else {
    const target = snapTarget(angle, n, focus);
    const spring = (target - angle) * 20 - velocity * 8;
    velocity += spring * dt;
    angle += velocity * dt;
    if (Math.abs(target - angle) < 0.002 && Math.abs(velocity) < 0.02) {
      angle = target;
      velocity = 0;
    }
  }
  return {angle, velocity};
}
