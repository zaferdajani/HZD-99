/**
 * touch-gestures.ts — genre-neutral touch gesture state machine.
 *
 * Ported from the iOS touch layer of the GeneralsX / Generals-Mac-iOS-iPad
 * port (SDL3GameEngine.cpp), with the RTS-specific mouse synthesis removed.
 * Instead of faking mouse events it emits *semantic* gestures the game maps
 * to its own actions (see platformer-bindings.ts for a CLAWBYTE example).
 *
 * Design rules carried over (these are what fix the classic mobile bugs):
 *  1. DEFER. A finger landing is PENDING until we know what it is (tap, drag,
 *     long-press, or first finger of a pan). Nothing is emitted prematurely.
 *  2. ONE OWNER. Once a gesture commits, extra fingers are ignored and the
 *     recognizer swallows input until the owning finger lifts.
 *  3. CANCEL ≠ UP. A cancelled touch (incoming call, notification shade,
 *     palm rejection, app switcher) never becomes a committed tap.
 *  4. POLL THE TIMER. A stationary finger produces no events, so long-press
 *     must be checked from the frame loop via update().
 *  5. ANCHOR DRAGS. Drags start at the original touch point, not where the
 *     finger was when the dead-zone was exceeded.
 *
 * Zero dependencies. Uses Pointer Events (works on iOS Safari, Android
 * Chrome, desktop mouse for debugging). Attach to the canvas element.
 */

export type Vec2 = { x: number; y: number };

export type GestureEvent =
  | { type: "tap"; at: Vec2 }
  | { type: "longPress"; at: Vec2 }
  | { type: "longPressEnd"; at: Vec2; cancelled: boolean }
  | { type: "dragStart"; from: Vec2; at: Vec2 }
  | { type: "dragMove"; from: Vec2; at: Vec2; delta: Vec2 }
  | { type: "dragEnd"; from: Vec2; at: Vec2 }
  | { type: "panStart"; centroid: Vec2 }
  | { type: "panMove"; centroid: Vec2; delta: Vec2 }
  | { type: "panEnd"; centroid: Vec2 }
  | { type: "pinchStep"; centroid: Vec2; direction: 1 | -1 }
  | { type: "cancel" };

export interface TouchGestureOptions {
  /** ms a finger must stay still before longPress fires. Default 600. */
  longPressMs?: number;
  /** px of movement (|dx|+|dy|) below which a touch is still a tap. Default 8 (scale by devicePixelRatio if you work in device px). */
  tapDeadZonePx?: number;
  /** Fractional change in finger distance per pinchStep. Default 0.06 (6%). */
  pinchStepRatio?: number;
  /** Receive gestures. */
  onGesture: (g: GestureEvent) => void;
  /**
   * Convert client coordinates to your game's coordinate space.
   * Default: canvas-relative CSS pixels.
   */
  toGameSpace?: (clientX: number, clientY: number) => Vec2;
  /**
   * WHICH PART OF THE ELEMENT THIS RECOGNIZER OWNS. Asked once, at the moment a
   * finger lands, in game space. A finger that fails it is not tracked at all —
   * no phase, no capture, no gesture — so it is free to belong to something else
   * on the same element.
   *
   * Without this, ONE OWNER (rule 2) is the whole element: a thumb resting on a
   * virtual stick is the owning finger, and the other thumb's tap arrives mid-
   * DRAGGING and becomes a pan instead of a tap. In a twin-thumb game that is
   * every tap the player makes while moving. Scoping the recognizer to the area
   * it is actually for fixes that without swallowing events another handler on
   * the same element still needs to see — which is what moving the recognizer
   * onto its own overlay element would have done, and would have broken any
   * control the player had dragged into that area.
   *
   * Default: the whole element.
   */
  scope?: (at: Vec2) => boolean;
}

type Phase = "IDLE" | "PENDING" | "DRAGGING" | "LONGPRESSED" | "PAN";

export class TouchGestures {
  private phase: Phase = "IDLE";
  private finger1: number | null = null;
  private finger2: number | null = null;
  private down: Vec2 = { x: 0, y: 0 };
  private last: Vec2 = { x: 0, y: 0 };
  private f1: Vec2 = { x: 0, y: 0 };
  private f2: Vec2 = { x: 0, y: 0 };
  private pan: Vec2 = { x: 0, y: 0 };
  private pinchDist = 0;
  private downTime = 0;

  private readonly longPressMs: number;
  private readonly deadZone: number;
  private readonly pinchStep: number;
  private readonly emit: (g: GestureEvent) => void;
  private readonly toGame: (x: number, y: number) => Vec2;
  private readonly scope: (at: Vec2) => boolean;
  private readonly el: HTMLElement;
  private readonly abort = new AbortController();

  constructor(el: HTMLElement, opts: TouchGestureOptions) {
    this.el = el;
    this.longPressMs = opts.longPressMs ?? 600;
    this.deadZone = opts.tapDeadZonePx ?? 8;
    this.pinchStep = opts.pinchStepRatio ?? 0.06;
    this.emit = opts.onGesture;
    this.scope = opts.scope ?? (() => true);
    this.toGame =
      opts.toGameSpace ??
      ((cx, cy) => {
        const r = el.getBoundingClientRect();
        return { x: cx - r.left, y: cy - r.top };
      });

    // Stop the browser from scrolling/zooming/long-press-menu-ing the canvas.
    el.style.touchAction = "none";
    (el.style as any).webkitUserSelect = "none";
    el.style.userSelect = "none";

    const s = { signal: this.abort.signal, passive: false } as AddEventListenerOptions;
    el.addEventListener("pointerdown", this.onDown, s);
    el.addEventListener("pointermove", this.onMove, s);
    el.addEventListener("pointerup", this.onUp, s);
    el.addEventListener("pointercancel", this.onCancel, s);
    el.addEventListener("contextmenu", (e) => e.preventDefault(), s);
  }

  /** Call once per frame. Required for long-press (rule 4). */
  update(nowMs: number = performance.now()): void {
    if (this.phase === "PENDING" && nowMs - this.downTime >= this.longPressMs) {
      this.phase = "LONGPRESSED";
      this.emit({ type: "longPress", at: { ...this.down } });
    }
  }

  /** Force back to IDLE (call on app background / visibility loss). */
  reset(): void {
    // Backgrounding mid-hold is the same latch: release it before the cancel,
    // so a consumer that only listens for longPressEnd still hears it.
    if (this.phase === "LONGPRESSED") {
      this.emit({ type: "longPressEnd", at: { ...this.down }, cancelled: true });
    }
    if (this.phase !== "IDLE") this.emit({ type: "cancel" });
    this.phase = "IDLE";
    this.finger1 = this.finger2 = null;
  }

  destroy(): void {
    this.abort.abort();
  }

  get currentPhase(): Phase {
    return this.phase;
  }

  // ------------------------------------------------------------------ handlers

  private onDown = (e: PointerEvent): void => {
    e.preventDefault();
    // setPointerCapture THROWS (NotFoundError) when there is no active pointer
    // for that id — a stale id, a pointer the browser already released, a
    // detached element. `?.` guards the method being absent, not it throwing,
    // and an exception here aborts the handler BEFORE the phase is set: the
    // finger lands and the state machine never hears about it. Capture is an
    // optimisation (it keeps moves coming if the finger leaves the canvas), so
    // losing it is survivable and losing the touch is not.
    const p = this.toGame(e.clientX, e.clientY);
    // Asked BEFORE anything is claimed: an out-of-scope finger leaves no trace,
    // so a later finger inside the scope still starts cleanly from IDLE.
    if (!this.scope(p)) return;
    try { this.el.setPointerCapture?.(e.pointerId); } catch { /* capture is optional */ }

    if (this.phase === "IDLE") {
      this.finger1 = e.pointerId;
      this.phase = "PENDING";
      this.down = { ...p };
      this.last = { ...p };
      this.f1 = { ...p };
      this.downTime = performance.now();
      return;
    }

    if (this.phase === "PENDING") {
      // Second finger before first committed: pure pan, no tap ever happened.
      this.finger2 = e.pointerId;
      this.f2 = { ...p };
      this.beginPan();
      return;
    }

    if (this.phase === "DRAGGING") {
      // Second finger mid-drag: close the drag cleanly, then pan.
      this.finger2 = e.pointerId;
      this.f2 = { ...p };
      this.emit({ type: "dragEnd", from: { ...this.down }, at: { ...this.last } });
      this.beginPan();
      return;
    }
    // LONGPRESSED / PAN with extra fingers: ignored (rule 2).
  };

  private onMove = (e: PointerEvent): void => {
    const p = this.toGame(e.clientX, e.clientY);

    if (e.pointerId === this.finger1) {
      this.f1 = { ...p };
      const prev = this.last;
      this.last = { ...p };

      if (this.phase === "PENDING") {
        const moved = Math.abs(p.x - this.down.x) + Math.abs(p.y - this.down.y);
        if (moved >= this.deadZone) {
          this.phase = "DRAGGING";
          this.emit({ type: "dragStart", from: { ...this.down }, at: { ...this.down } });
          this.emit({
            type: "dragMove",
            from: { ...this.down },
            at: { ...p },
            delta: { x: p.x - this.down.x, y: p.y - this.down.y },
          });
        }
      } else if (this.phase === "DRAGGING") {
        this.emit({
          type: "dragMove",
          from: { ...this.down },
          at: { ...p },
          delta: { x: p.x - prev.x, y: p.y - prev.y },
        });
      } else if (this.phase === "PAN") {
        this.updatePan();
      }
      return;
    }

    if (this.phase === "PAN" && e.pointerId === this.finger2) {
      this.f2 = { ...p };
      this.updatePan();
    }
  };

  private onUp = (e: PointerEvent): void => {
    this.finish(e, false);
  };

  private onCancel = (e: PointerEvent): void => {
    this.finish(e, true);
  };

  private finish(e: PointerEvent, cancelled: boolean): void {
    const isF1 = e.pointerId === this.finger1;
    const isF2 = this.phase === "PAN" && e.pointerId === this.finger2;
    if (!isF1 && !isF2) return;

    const p = this.toGame(e.clientX, e.clientY);

    switch (this.phase) {
      case "PENDING":
        // Rule 3: a cancelled touch never becomes a tap.
        if (!cancelled) this.emit({ type: "tap", at: { ...this.down } });
        break;
      case "DRAGGING":
        this.emit({ type: "dragEnd", from: { ...this.down }, at: { ...p } });
        break;
      case "PAN":
        this.emit({ type: "panEnd", centroid: { ...this.pan } });
        break;
      case "LONGPRESSED":
        // A HELD FINGER HAS TO BE RELEASED. Without this the machine emitted
        // NOTHING when a long-press ended: longPress set `chargeHeld` and the
        // only code that cleared it was the dragEnd branch, which a hold-and-
        // release never reaches. Measured in a browser: charge stuck on for
        // the rest of the session. A recognizer that can latch an input and
        // never unlatch it is the bug this file exists to prevent.
        this.emit({ type: "longPressEnd", at: { ...p }, cancelled });
        break;
      case "IDLE":
        break;
    }
    if (cancelled && this.phase !== "PENDING") this.emit({ type: "cancel" });
    this.phase = "IDLE";
    this.finger1 = this.finger2 = null;
  }

  // ------------------------------------------------------------------ pan/pinch

  private beginPan(): void {
    this.pan = this.centroid();
    this.pinchDist = this.distance();
    this.phase = "PAN";
    this.emit({ type: "panStart", centroid: { ...this.pan } });
  }

  private updatePan(): void {
    const c = this.centroid();
    this.emit({
      type: "panMove",
      centroid: { ...c },
      delta: { x: c.x - this.pan.x, y: c.y - this.pan.y },
    });
    this.pan = c;

    const d = this.distance();
    if (this.pinchDist > 1) {
      const ratio = d / this.pinchDist;
      if (ratio > 1 + this.pinchStep) {
        this.emit({ type: "pinchStep", centroid: { ...c }, direction: 1 });
        this.pinchDist = d;
      } else if (ratio < 1 - this.pinchStep) {
        this.emit({ type: "pinchStep", centroid: { ...c }, direction: -1 });
        this.pinchDist = d;
      }
    }
  }

  private centroid(): Vec2 {
    return { x: (this.f1.x + this.f2.x) / 2, y: (this.f1.y + this.f2.y) / 2 };
  }

  private distance(): number {
    const dx = this.f1.x - this.f2.x;
    const dy = this.f1.y - this.f2.y;
    return Math.hypot(dx, dy);
  }
}
