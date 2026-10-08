/**
 * platformer-bindings.ts — example adapter mapping semantic gestures to a
 * side-scrolling platformer's actions (CLAWBYTE-style). Swap this file for
 * your genre; touch-gestures.ts and lifecycle.ts stay unchanged.
 *
 * Layout (landscape phone):
 *   ┌───────────────────────┬───────────────────────┐
 *   │  LEFT ZONE            │  RIGHT ZONE           │
 *   │  drag  → virtual stick│  tap        → jump    │
 *   │  (floating, appears   │  longPress  → charge  │
 *   │   where finger lands) │  drag ←/→   → attack  │
 *   │                       │  drag ↓     → dash    │
 *   └───────────────────────┴───────────────────────┘
 *   two-finger pan / pinch → ignored in gameplay, reserved for map/menu.
 *
 * The left-zone stick is "floating": it anchors wherever the finger first
 * lands (drag `from`), so the player never has to look at the screen.
 */

import type { GestureEvent, Vec2 } from "./touch-gestures";

export interface PlayerInput {
  /** -1..1 horizontal axis from the virtual stick. */
  moveX: number;
  /** -1..1 vertical axis (for ladders / crouch). */
  moveY: number;
  /** One-frame edge triggers. Consumer must clear after reading. */
  jumpPressed: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  chargeHeld: boolean;
}

export interface PlatformerBindingOptions {
  /** Width of the game viewport in game-space units. */
  viewportWidth: number;
  /** Stick radius in game-space units at which the axis saturates. Default 48. */
  stickRadius?: number;
  /** Min swipe distance (game units) in the right zone to count as a directional swipe. Default 32. */
  swipeThreshold?: number;
}

export class PlatformerBindings {
  readonly input: PlayerInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    attackPressed: false,
    dashPressed: false,
    chargeHeld: false,
  };

  private stickActive = false;
  private rightSwipeConsumed = false;
  private readonly stickRadius: number;
  private readonly swipeThreshold: number;
  private readonly midX: number;

  constructor(opts: PlatformerBindingOptions) {
    this.stickRadius = opts.stickRadius ?? 48;
    this.swipeThreshold = opts.swipeThreshold ?? 32;
    this.midX = opts.viewportWidth / 2;
  }

  /** Feed every gesture from TouchGestures here. */
  handle(g: GestureEvent): void {
    switch (g.type) {
      case "tap":
        if (this.isRight(g.at)) this.input.jumpPressed = true;
        break;

      case "longPress":
        if (this.isRight(g.at)) this.input.chargeHeld = true;
        break;

      case "dragStart":
        if (this.isLeft(g.from)) {
          this.stickActive = true;
        } else {
          this.rightSwipeConsumed = false;
        }
        break;

      case "dragMove":
        if (this.stickActive) {
          const dx = g.at.x - g.from.x;
          const dy = g.at.y - g.from.y;
          this.input.moveX = clamp(dx / this.stickRadius, -1, 1);
          this.input.moveY = clamp(dy / this.stickRadius, -1, 1);
        } else if (!this.rightSwipeConsumed && this.isRight(g.from)) {
          const dx = g.at.x - g.from.x;
          const dy = g.at.y - g.from.y;
          if (Math.abs(dx) >= this.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
            this.input.attackPressed = true;
            this.rightSwipeConsumed = true;
          } else if (dy >= this.swipeThreshold) {
            this.input.dashPressed = true;
            this.rightSwipeConsumed = true;
          }
        }
        break;

      case "longPressEnd":
        // The charge is released by the gesture that held it, not by whatever
        // gesture happens to end next. Clearing it in dragEnd meant a hold that
        // ended with a plain lift never cleared at all, and a left-thumb stick
        // release would have cleared somebody else's charge.
        this.input.chargeHeld = false;
        break;

      case "dragEnd":
        if (this.stickActive) {
          this.stickActive = false;
          this.input.moveX = 0;
          this.input.moveY = 0;
        }
        break;

      case "cancel":
        this.releaseAll();
        break;

      // Reserved for non-gameplay use (map, menu zoom). Ignored here.
      case "panStart":
      case "panMove":
      case "panEnd":
      case "pinchStep":
        break;
    }
  }

  /** Call at end of each frame to clear one-frame triggers. */
  endFrame(): void {
    this.input.jumpPressed = false;
    this.input.attackPressed = false;
    this.input.dashPressed = false;
  }

  releaseAll(): void {
    this.stickActive = false;
    this.input.moveX = 0;
    this.input.moveY = 0;
    this.input.chargeHeld = false;
    this.endFrame();
  }

  private isLeft(p: Vec2): boolean {
    return p.x < this.midX;
  }
  private isRight(p: Vec2): boolean {
    return p.x >= this.midX;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
