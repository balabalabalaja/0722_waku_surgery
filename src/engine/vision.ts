// Camera + MediaPipe (FaceLandmarker + selfie segmentation). Camera and models
// settle independently and are reported separately so the machine can pick
// ready vs fallback.
//
// HandLandmarker is GONE (2026-08-10). Palm steering shared the sitter's
// transform, so once the sitter shrank the hand could only ever appear in the
// bottom 58% of the stage while the eye dial sits entirely above it — the
// gesture could not reach one of the three dials by construction, and mapping
// hands through a wider transform would put the spin somewhere the player is
// not pointing. Touch drag covers all three dials (verified), so the
// half-working channel and its model went rather than staying as a trap.

export interface VisionResult {
  face: {x: number; y: number}[] | null; // normalized landmarks
}

export class Vision {
  video: HTMLVideoElement;
  cameraOk: boolean | null = null;
  modelsOk: boolean | null = null;
  segReady = false;
  // Person-confidence mask aligned with the (unmirrored) video frame; alpha =
  // person. Drawn with the same cover+mirror transform as the video.
  maskCanvas: HTMLCanvasElement | null = null;
  private face: any = null;
  private segmenter: any = null;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private maskImage: ImageData | null = null;
  private frameCounter = 0;
  private lastFacePt: {x: number; y: number} | null = null;
  private lastTs = 0;
  trackFps = 0; // measured face-inference rate (fix-05 #2 evidence)
  private trackCount = 0;
  private trackAt = 0;

  constructor() {
    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.setAttribute('playsinline', '');
  }

  async startCamera(): Promise<boolean> {
    try {
      // 720p, not the old 640x480 — the single biggest cause of the soft
      // cutout the player called cheap. On a 3x phone the sitter used to be
      // magnified ~5x from source, and the segmentation mask comes back at
      // CAMERA resolution, so the low-res frame blurred the person AND the
      // edge that cuts them out. The landmarker downsamples internally, so
      // the extra cost is the frame upload, not inference. `ideal` degrades
      // on its own wherever 720p is not offered.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {width: {ideal: 1280}, height: {ideal: 720}, facingMode: 'user'},
        audio: false,
      });
      this.video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve).catch(reject);
        };
        setTimeout(() => reject(new Error('camera timeout')), 12000);
      });
      this.cameraOk = true;
      return true;
    } catch (err) {
      console.warn('camera unavailable', err);
      this.cameraOk = false;
      return false;
    }
  }

  async loadModels(): Promise<boolean> {
    // CDN fetches can abort transiently (parallel duplicate fetch, network
    // blips) — one retry before conceding to the fallback path.
    for (let attempt = 0; attempt < 2; attempt++) {
      const ok = await this.loadModelsOnce();
      if (ok) return true;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
    this.modelsOk = false;
    return false;
  }

  private async loadModelsOnce(): Promise<boolean> {
    try {
      const {FilesetResolver, FaceLandmarker} = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm',
      );
      this.face = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      // Person segmentation is optional: rings sit behind the person; if it
      // fails we degrade to a feathered head/torso cutout in the stage.
      try {
        const {ImageSegmenter} = await import('@mediapipe/tasks-vision');
        this.segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
        this.segReady = true;
      } catch (err) {
        console.warn('selfie segmenter unavailable — degraded person cutout', err);
        this.segReady = false;
      }
      this.modelsOk = true;
      return true;
    } catch (err) {
      console.error('mediapipe load failed', err);
      this.modelsOk = false;
      return false;
    }
  }

  // Convert the confidence mask into an alpha canvas, auto-orienting so the
  // known face point samples as "person" (guards against fg/bg inversion).
  private updateMask(result: any) {
    const mask = result?.confidenceMasks?.[0];
    if (!mask) return;
    const w = mask.width;
    const h = mask.height;
    const data: Float32Array = mask.getAsFloat32Array();
    if (!this.maskCanvas || this.maskCanvas.width !== w || this.maskCanvas.height !== h) {
      this.maskCanvas = document.createElement('canvas');
      this.maskCanvas.width = w;
      this.maskCanvas.height = h;
      this.maskCtx = this.maskCanvas.getContext('2d');
      this.maskImage = this.maskCtx!.createImageData(w, h);
    }
    let invert = false;
    if (this.lastFacePt) {
      const fx = Math.min(w - 1, Math.max(0, Math.round(this.lastFacePt.x * w)));
      const fy = Math.min(h - 1, Math.max(0, Math.round(this.lastFacePt.y * h)));
      invert = data[fy * w + fx] < 0.5;
    }
    const px = this.maskImage!.data;
    for (let i = 0; i < w * h; i++) {
      const v = invert ? 1 - data[i] : data[i];
      // Tighter ramp (fix-06): bias the edge inward so the cutout carries
      // less of the real camera background as fringe on the orange field.
      const a = v < 0.45 ? 0 : v > 0.75 ? 255 : Math.round(((v - 0.45) / 0.3) * 255);
      const o = i * 4;
      px[o] = 255;
      px[o + 1] = 255;
      px[o + 2] = 255;
      px[o + 3] = a;
    }
    this.maskCtx!.putImageData(this.maskImage!, 0, 0);
    mask.close?.();
  }

  get videoReady(): boolean {
    return this.cameraOk === true && this.video.readyState >= 2 && this.video.videoWidth > 0;
  }

  detect(ts: number): VisionResult {
    if (!this.videoReady || !this.modelsOk) return {face: null};
    // detectForVideo demands strictly increasing timestamps.
    if (ts <= this.lastTs) ts = this.lastTs + 1;
    this.lastTs = ts;
    let face: VisionResult['face'] = null;
    const nowMs = performance.now();
    this.trackCount++;
    if (nowMs - this.trackAt >= 1000) {
      this.trackFps = Math.round((this.trackCount * 1000) / (nowMs - this.trackAt));
      this.trackCount = 0;
      this.trackAt = nowMs;
    }
    try {
      const fr = this.face.detectForVideo(this.video, ts);
      if (fr?.faceLandmarks?.length) {
        face = fr.faceLandmarks[0];
        this.lastFacePt = {x: face![1].x, y: face![1].y}; // nose tip, mask-orientation probe
      }
      // Segmentation runs every other frame; it tolerates 2-frame latency and
      // this keeps the per-frame inference budget where the face needs it.
      this.frameCounter++;
      if (this.frameCounter % 2 === 0 && this.segmenter) {
        const sr = this.segmenter.segmentForVideo(this.video, ts + 0.5);
        this.updateMask(sr);
      }
    } catch (err) {
      console.error('inference error', err);
    }
    return {face};
  }

  stop() {
    const stream = this.video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
  }
}
