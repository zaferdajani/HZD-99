/**
 * lifecycle.ts — app background/foreground pause handling for web/mobile games.
 *
 * Ported from the iOS lifecycle watcher in the GeneralsX iOS port. That code
 * learned two things the hard way:
 *
 *  1. There are TWO independent "stop everything" states, not one:
 *     - BACKGROUNDED: user went home / switched app. Process may be frozen.
 *     - INACTIVE: app switcher open, Control Center, notification banner,
 *       incoming call. The app is still "visible" but the OS owns the screen.
 *     Rendering or simulating during EITHER state causes stalls, input hangs
 *     after resume, and (on native) eventual crashes. Pause when either is set.
 *
 *  2. Lifecycle events arrive outside your normal frame loop. Capture them
 *     immediately into flags; let the frame loop read the flags.
 *
 * Browser mapping:
 *   BACKGROUNDED  <- document.visibilityState === 'hidden', pagehide
 *   INACTIVE      <- window blur (iOS Safari fires this for the switcher,
 *                    Control Center, and incoming calls)
 *
 * What this module does while paused:
 *   - tells your game loop to skip simulation + rendering (shouldRun())
 *   - suspends the AudioContext (iOS otherwise keeps it in a broken state)
 *   - resets touch gesture state so no finger is "stuck down" on resume
 *   - clamps the first frame's dt on resume so physics doesn't explode
 */

export interface LifecycleOptions {
  /** Called when entering any paused state. Pause music, stop timers. */
  onPause?: () => void;
  /** Called when fully active again. Resume music, re-arm timers. */
  onResume?: () => void;
  /** AudioContext to suspend/resume automatically (optional). */
  audioContext?: AudioContext;
  /** Anything with reset() — e.g. a TouchGestures instance. */
  inputToReset?: { reset(): void };
  /** Max dt (seconds) allowed on the first frame after resume. Default 1/30. */
  maxResumeDt?: number;
}

export class Lifecycle {
  private backgrounded = false;
  private inactive = false;
  private wasPaused = false;
  private justResumed = false;
  private readonly opts: LifecycleOptions;
  private readonly abort = new AbortController();

  constructor(opts: LifecycleOptions = {}) {
    this.opts = opts;
    const s = { signal: this.abort.signal };

    document.addEventListener(
      "visibilitychange",
      () => this.set("bg", document.visibilityState === "hidden"),
      s
    );
    window.addEventListener("pagehide", () => this.set("bg", true), s);
    window.addEventListener("pageshow", () => this.set("bg", false), s);
    window.addEventListener("blur", () => this.set("inactive", true), s);
    window.addEventListener("focus", () => this.set("inactive", false), s);

    // Initial state (page may load hidden, e.g. restored tab).
    this.backgrounded = document.visibilityState === "hidden";
    this.inactive = !document.hasFocus();
    this.wasPaused = this.isPaused;
    // A PAGE CAN BE BORN PAUSED — a restored tab, a background prerender, a
    // window that opened without focus. Recording that as `wasPaused` without
    // ever running enterPause() made the pair asymmetric: the AudioContext was
    // never suspended, onPause never fired, and the first focus fired onResume
    // on its own. Measured: pauses 0, resumes 1, and music.play() on a game
    // that had not started. Enter the pause we are already in.
    if (this.wasPaused) this.enterPause();
  }

  /** True while the game must not simulate or render. */
  get isPaused(): boolean {
    return this.backgrounded || this.inactive;
  }

  /**
   * Call at the top of every frame. Returns false if the frame should be
   * skipped entirely. Pass dt in seconds; the returned dt is clamped on the
   * first frame after a resume.
   */
  frame(dt: number): { run: boolean; dt: number } {
    if (this.isPaused) return { run: false, dt: 0 };
    if (this.justResumed) {
      this.justResumed = false;
      return { run: true, dt: Math.min(dt, this.opts.maxResumeDt ?? 1 / 30) };
    }
    return { run: true, dt };
  }

  destroy(): void {
    this.abort.abort();
  }

  private set(which: "bg" | "inactive", value: boolean): void {
    if (which === "bg") this.backgrounded = value;
    else this.inactive = value;

    const paused = this.isPaused;
    if (paused && !this.wasPaused) this.enterPause();
    else if (!paused && this.wasPaused) this.exitPause();
    this.wasPaused = paused;
  }

  private enterPause(): void {
    this.opts.inputToReset?.reset();
    this.opts.audioContext?.suspend().catch(() => {});
    this.opts.onPause?.();
  }

  private exitPause(): void {
    this.justResumed = true;
    // iOS requires resume() to be called from a user gesture in some cases;
    // if it rejects, the next tap handler should call resume() again.
    this.opts.audioContext?.resume().catch(() => {});
    this.opts.onResume?.();
  }
}
