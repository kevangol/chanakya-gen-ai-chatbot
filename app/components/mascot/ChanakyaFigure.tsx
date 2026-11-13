/**
 * @module components/mascot/ChanakyaFigure
 */

import type { CSSProperties } from "react";
import { cn } from "@/app/lib/utils";

/** What the chat is doing. `ChanakyaMascot` turns this into a {@link MascotPose}. */
export type MascotMood = "idle" | "thinking" | "speaking";

/**
 * Every pose the figure can strike.
 * - `rest`     stands holding his staff
 * - `blessing` abhaya mudra: open palm raised (fearlessness / blessing)
 * - `hip`      hand on hip, stern authority
 * - `namaste`  both palms joined at the chest, eyes closed; the staff leans on his shoulder
 * - `thinking` hand on chin, eyebrow raised
 * - `point`    teaching: index finger raised
 * - `palm`     explaining: open palm held out
 */
export type MascotPose = "rest" | "blessing" | "hip" | "namaste" | "thinking" | "point" | "palm";

/** Props for {@link ChanakyaFigure}. */
export type ChanakyaFigureProps = {
  /** Pose to show. Changing it animates every joint smoothly to the new pose. */
  pose: MascotPose;
  /** Size classes, e.g. `h-48 w-auto`. */
  className?: string;
};

/* -------------------------------------------------------------------------- */
/* Palette. Fixed so the character reads the same in light and dark mode;     */
/* the shawl and dhoti border use the theme accent.                           */
/* -------------------------------------------------------------------------- */
const SKIN = "#c98d62";
const SKIN_SHADE = "#a9714b";
const HAIR = "#211a16";
const ASH = "#f5f1e6";
const KUMKUM = "#c0392b";
const BEAD = "#5b3320";
const THREAD = "#f3ead6";
const DHOTI = "#f1e9d8";
const DHOTI_LINE = "#d3c4a4";
const WOOD = "#7a4a2a";
const WOOD_DARK = "#5a3419";

/* -------------------------------------------------------------------------- */
/* Skeleton (viewBox units; viewBox is 140 × 228)                             */
/* "left"/"right" are the VIEWER's left/right.                                */
/*  - left arm  = his right hand: the expressive arm                          */
/*  - right arm = his left hand: normally holds the staff                     */
/* -------------------------------------------------------------------------- */
const SHOULDER = { left: { x: 52, y: 88 }, right: { x: 88, y: 88 } } as const;
const UPPER_ARM = 30;
const FOREARM = 28;
const NECK = { x: 70, y: 76 };
const STAFF = { x: 103, top: 54, bottom: 218 };

/** Hand shapes, drawn pointing along the forearm (local +y) and then turned by the wrist. */
type HandShape = "fist" | "point" | "palm" | "namaste";
/** Facial expression. */
type Face = "calm" | "smile" | "stern" | "serene" | "thinking" | "speaking";

/**
 * One arm's joint angles in degrees (SVG `rotate`, positive = clockwise).
 * 0° everywhere = arm hanging straight down. `elbow` is relative to the upper
 * arm, `wrist` relative to the forearm.
 */
type ArmPose = { shoulder: number; elbow: number; wrist: number; hand: HandShape };

/** The staff hand gripping the staff at (103, 140). */
const GRIP: ArmPose = { shoulder: -36.5, elbow: 42, wrist: 0, hand: "fist" };

/**
 * Pose table. Arm angles come from two-link inverse kinematics (solve for the
 * shoulder and elbow angles that put the hand on a target point, with the
 * elbow bent down/outward), and the wrist angle turns the palm/fingers upright.
 *
 * Hand targets: blessing (33,78) · hip (53,126) · namaste (66.5,99) + (73.5,99)
 * · chin (66,74) · teaching finger (38,52) · explaining palm (27,104).
 */
const POSES: Record<
  MascotPose,
  { left: ArmPose; right: ArmPose; head: number; staffLean: number; face: Face }
> = {
  rest: { left: { shoulder: 7, elbow: -10, wrist: 0, hand: "fist" }, right: GRIP, head: 0, staffLean: 0, face: "calm" },
  blessing: { left: { shoulder: 54.4, elbow: 136.7, wrist: -11.1, hand: "palm" }, right: GRIP, head: 2, staffLean: 0, face: "smile" },
  hip: { left: { shoulder: 45.3, elbow: -98.2, wrist: 0, hand: "fist" }, right: GRIP, head: -2, staffLean: 0, face: "stern" },
  namaste: {
    left: { shoulder: 13, elbow: -143.6, wrist: -49.4, hand: "namaste" },
    right: { shoulder: -13, elbow: 143.6, wrist: 49.4, hand: "namaste" },
    head: 0,
    staffLean: -4, // staff tips over to rest against his shoulder
    face: "serene",
  },
  thinking: { left: { shoulder: -70.3, elbow: -140.2, wrist: 0, hand: "fist" }, right: GRIP, head: -6, staffLean: 0, face: "thinking" },
  point: { left: { shoulder: 112.6, elbow: 96.7, wrist: -29.3, hand: "point" }, right: GRIP, head: 3, staffLean: 0, face: "speaking" },
  palm: { left: { shoulder: 1.4, elbow: 118.6, wrist: 25, hand: "palm" }, right: GRIP, head: 2, staffLean: 0, face: "speaking" },
};

/** Springy easing so pose changes feel lively rather than mechanical. */
const POSE_TRANSITION = "transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1)";

/**
 * Style that rotates an SVG group around a fixed point in viewBox coordinates.
 * `transform-box: view-box` makes `transform-origin` use the drawing's own units.
 */
function pivot(x: number, y: number, deg: number): CSSProperties {
  return {
    transformBox: "view-box",
    transformOrigin: `${x}px ${y}px`,
    transform: `rotate(${deg}deg)`,
    transition: POSE_TRANSITION,
  };
}

/** Origin-only style, for groups whose transform comes from a CSS keyframe animation. */
function origin(x: number, y: number): CSSProperties {
  return { transformBox: "view-box", transformOrigin: `${x}px ${y}px` };
}

/** Long rudraksha mala: beads along a narrow U hanging from the neck to mid-chest. */
const MALA_BEADS = Array.from({ length: 15 }, (_, i) => {
  const angle = ((8 + (i * 164) / 14) * Math.PI) / 180;
  return { cx: 70 + 9.5 * Math.cos(angle), cy: 79 + 28 * Math.sin(angle) };
});

/**
 * An original, full-body SVG illustration of Chanakya in his traditional look:
 * a lean, bare-chested ascetic with an ochre *uttariya* (shawl), a *janeu*
 * (sacred thread), a long rudraksha mala, an ankle-length bordered dhoti,
 * wooden *paduka*, a *danda* (staff), the *tripundra* tilak and his famous
 * long, untied *shikha*.
 *
 * Arms are three-joint skeletons (shoulder → elbow → wrist). Each pose sets the
 * joint angles from {@link POSES}; CSS transitions animate between poses.
 *
 * Looping animations (keyframes in `globals.css`, `.mascot-*` classes): body
 * float, blink and shikha sway always; foot tap + thought dots while thinking;
 * head nod + mouth while speaking; finger wag on `point`.
 *
 * Decorative only (`aria-hidden`); the surrounding button carries the label.
 */
export function ChanakyaFigure({ pose: poseName, className }: ChanakyaFigureProps) {
  const pose = POSES[poseName];
  const speaking = pose.face === "speaking";

  return (
    <svg viewBox="0 0 140 228" aria-hidden className={cn("mascot overflow-visible", className)}>
      {/* Ground shadow stays put while the body floats */}
      <ellipse cx="72" cy="221" rx="38" ry="3.5" fill="#000" opacity="0.18" />

      <g className="mascot-float">
        {poseName === "thinking" && <ThoughtDots />}

        {/* ---------------- Staff: pivots at its foot to lean on the shoulder ---------------- */}
        <g style={pivot(STAFF.x, STAFF.bottom, pose.staffLean)}>
          <line x1={STAFF.x} y1={STAFF.top} x2={STAFF.x} y2={STAFF.bottom} stroke={WOOD} strokeWidth="3.6" strokeLinecap="round" />
          <circle cx={STAFF.x} cy={STAFF.top - 1} r="3.6" fill={WOOD_DARK} />
        </g>

        {/* ---------------- Shawl end hanging down the back ---------------- */}
        <path d="M86 84 Q99 88 100 108 L102 156 L92 158 L90 110 Z" fill="var(--accent-hover)" />

        <Feet tapping={poseName === "thinking"} />

        {/* ---------------- Dhoti (ankle length, pleated, bordered) ---------------- */}
        <path d="M53 126 L87 126 L93 209 Q70 213 47 209 Z" fill={DHOTI} stroke={DHOTI_LINE} strokeWidth="1" strokeLinejoin="round" />
        <path d="M70 132 L69 209 M62 134 L58 208 M78 134 L82 208" stroke={DHOTI_LINE} strokeWidth="1" fill="none" />
        <path d="M47.6 203 Q70 207 92.4 203" stroke="var(--accent)" strokeWidth="2.4" fill="none" />

        {/* ---------------- Torso: lean bare chest ---------------- */}
        <path d="M51 84 Q70 78 89 84 Q94 90 91 104 L86 130 L54 130 L49 104 Q46 90 51 84 Z" fill={SKIN} />
        <g stroke={SKIN_SHADE} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M57 99 Q63 103 69 100" />
          <path d="M71 100 Q77 103 83 99" />
          <path d="M62 112 Q66 113 68 112 M72 112 Q75 113 79 112" />
        </g>

        {/* Janeu (sacred thread): his left shoulder → right hip */}
        <path d="M80 82 Q68 108 55 128" stroke={THREAD} strokeWidth="1.4" fill="none" />

        {/* Long rudraksha mala */}
        <g fill={BEAD}>
          {MALA_BEADS.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r="1.7" />
          ))}
        </g>

        {/* Uttariya (shawl) across the chest from his left shoulder */}
        <path d="M80 80 Q92 80 95 89 L80 134 L66 134 Z" fill="var(--accent)" />
        <path d="M84 84 L72 132" stroke="var(--accent-hover)" strokeWidth="1.2" fill="none" />

        {/* Kamarbandh (waist sash) */}
        <rect x="52" y="124" width="36" height="7" rx="3" fill="var(--accent-hover)" />

        {/* ---------------- Head ---------------- */}
        <g style={pivot(NECK.x, NECK.y, pose.head)}>
          <g className={cn(speaking && "mascot-nod")} style={origin(NECK.x, NECK.y)}>
            <Head face={pose.face} />
          </g>
        </g>

        {/* ---------------- Arms (last, so hands sit in front of body and staff) ---------------- */}
        <Arm side="right" pose={pose.right} />
        <Arm side="left" pose={pose.left} />
      </g>
    </svg>
  );
}

/**
 * A three-joint arm: upper arm rotates at the shoulder, forearm at the elbow,
 * and the hand at the wrist.
 *
 * @param props.side - Viewer's left (expressive hand) or right (staff hand).
 * @param props.pose - Joint angles and hand shape.
 */
function Arm({ side, pose }: { side: "left" | "right"; pose: ArmPose }) {
  const s = SHOULDER[side];
  const elbow = { x: s.x, y: s.y + UPPER_ARM };
  const wrist = { x: s.x, y: elbow.y + FOREARM };
  // Thumb sits on the side facing the body's centre line.
  const thumbSide = side === "left" ? 1 : -1;

  return (
    <g style={pivot(s.x, s.y, pose.shoulder)}>
      {/* Upper arm, tapering toward the elbow, with a rudraksha armband */}
      <path
        d={`M${s.x - 4} ${s.y} L${s.x + 4} ${s.y} L${elbow.x + 3} ${elbow.y} L${elbow.x - 3} ${elbow.y} Z`}
        fill={SKIN}
        stroke={SKIN}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx={s.x} cy={s.y} r="4.6" fill={SKIN} />
      <line x1={s.x - 3.6} y1={s.y + 11} x2={s.x + 3.6} y2={s.y + 11} stroke={BEAD} strokeWidth="2.2" strokeLinecap="round" />

      <g style={pivot(elbow.x, elbow.y, pose.elbow)}>
        <g className={cn(pose.hand === "point" && "mascot-wag")} style={origin(elbow.x, elbow.y)}>
          <circle cx={elbow.x} cy={elbow.y} r="3.2" fill={SKIN} />
          {/* Forearm */}
          <path
            d={`M${elbow.x - 3} ${elbow.y} L${elbow.x + 3} ${elbow.y} L${wrist.x + 2.4} ${wrist.y} L${wrist.x - 2.4} ${wrist.y} Z`}
            fill={SKIN}
            stroke={SKIN}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <g style={pivot(wrist.x, wrist.y, pose.wrist)}>
            <Hand shape={pose.hand} x={wrist.x} y={wrist.y} thumbSide={thumbSide} />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * Hand shapes, drawn with the fingers pointing along local +y from the wrist.
 * All shapes are rendered and cross-faded, so switching shape is smooth.
 */
function Hand({ shape, x, y, thumbSide }: { shape: HandShape; x: number; y: number; thumbSide: number }) {
  const show = (on: boolean): CSSProperties => ({ opacity: on ? 1 : 0, transition: "opacity 0.25s" });
  return (
    <>
      {/* Fist (also the base of the pointing hand) */}
      <g style={show(shape === "fist" || shape === "point")}>
        <ellipse cx={x} cy={y + 1.5} rx="4.4" ry="5" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.7" />
        <line x1={x + 0.6} y1={y + 2} x2={x + 0.6} y2={y + 11} stroke={SKIN} strokeWidth="2.4" strokeLinecap="round" style={show(shape === "point")} />
      </g>

      {/* Open palm: palm + four fingers + thumb */}
      <g style={show(shape === "palm")} stroke={SKIN} strokeLinecap="round">
        <ellipse cx={x} cy={y + 3} rx="4.8" ry="4.5" fill={SKIN} stroke={SKIN_SHADE} strokeWidth="0.7" />
        <g strokeWidth="2">
          <line x1={x - 3.3} y1={y + 5} x2={x - 3.6} y2={y + 10} />
          <line x1={x - 1.1} y1={y + 5} x2={x - 1.1} y2={y + 11.5} />
          <line x1={x + 1.1} y1={y + 5} x2={x + 1.1} y2={y + 11.5} />
          <line x1={x + 3.3} y1={y + 5} x2={x + 3.6} y2={y + 10} />
        </g>
        <line x1={x + thumbSide * 4} y1={y + 1.5} x2={x + thumbSide * 7.5} y2={y + 5} strokeWidth="2.2" />
      </g>

      {/* Namaste: flat palm, fingers together */}
      <ellipse
        cx={x}
        cy={y + 4.5}
        rx="3.1"
        ry="6.6"
        fill={SKIN}
        stroke={SKIN_SHADE}
        strokeWidth="0.7"
        style={show(shape === "namaste")}
      />
    </>
  );
}

/**
 * Feet in wooden paduka peeking out under the dhoti. The viewer-right foot
 * taps (pivoting on the heel) while thinking.
 */
function Feet({ tapping }: { tapping: boolean }) {
  return (
    <>
      <g>
        <ellipse cx="60" cy="213" rx="8" ry="3.6" fill={SKIN} />
        <rect x="51" y="215.5" width="18" height="3.4" rx="1.7" fill={WOOD} />
      </g>
      <g className={cn(tapping && "mascot-tap")} style={origin(76, 217)}>
        <ellipse cx="81" cy="213" rx="8" ry="3.6" fill={SKIN} />
        <rect x="72" y="215.5" width="18" height="3.4" rx="1.7" fill={WOOD} />
      </g>
    </>
  );
}

/** Eyebrow paths per face (viewer-left brow, viewer-right brow). */
const BROWS: Record<Face, [string, string]> = {
  calm: ["M42 58 Q48 57.5 54 61", "M78 58 Q72 57.5 66 61"],
  smile: ["M42 57.5 Q48 56 54 59", "M78 57.5 Q72 56 66 59"],
  stern: ["M42 56.5 L54 62", "M78 56.5 L66 62"],
  serene: ["M42 58.5 Q48 57 54 59.5", "M78 58.5 Q72 57 66 59.5"],
  thinking: ["M42 56.5 Q48 54 54 57.5", "M78 58 Q72 57.5 66 61"],
  speaking: ["M42 57.5 Q48 56.5 54 60", "M78 57.5 Q72 56.5 66 60"],
};

/** Mouth path per face (speaking uses an animated oval instead). */
const MOUTHS: Record<Exclude<Face, "speaking">, string> = {
  calm: "M53 83 Q60 84.5 67 83",
  smile: "M53 82 Q60 87 67 82",
  stern: "M53 84.5 Q60 82.5 67 84.5",
  serene: "M54 82.5 Q60 86 66 82.5",
  thinking: "M55 83 Q59 82 66 84.5",
};

/**
 * The head, drawn in the original 120×150 head coordinates and scaled into
 * place: head centre (60,62) maps to (70,46) at 80%.
 */
function Head({ face }: { face: Face }) {
  const lookUp = face === "thinking" ? -2.5 : 0;
  const [browL, browR] = BROWS[face];

  return (
    <g transform="translate(70 46) scale(0.8) translate(-60 -62)">
      {/* Long untied shikha flowing down behind the head (sways from the crown) */}
      <path
        className="mascot-sway"
        d="M58 33 C66 15 92 18 95 42 C97 58 91 74 98 94 C88 84 84 64 86 47 C87 34 76 27 63 36 Z"
        fill={HAIR}
      />

      <rect x="53" y="82" width="14" height="22" rx="4" fill={SKIN_SHADE} />
      <ellipse cx="34" cy="64" rx="4.5" ry="7" fill={SKIN_SHADE} />
      <ellipse cx="86" cy="64" rx="4.5" ry="7" fill={SKIN_SHADE} />
      <ellipse cx="60" cy="62" rx="26" ry="30" fill={SKIN} />
      <ellipse cx="60" cy="33.5" rx="5" ry="3.6" fill={HAIR} />

      {/* Tripundra + kumkum */}
      <g stroke={ASH} strokeWidth="2.2" strokeLinecap="round">
        <line x1="45" y1="44" x2="75" y2="44" />
        <line x1="44" y1="48.5" x2="76" y2="48.5" />
        <line x1="45" y1="53" x2="75" y2="53" />
      </g>
      <ellipse cx="60" cy="48.5" rx="2" ry="3" fill={KUMKUM} />

      {/* Brows */}
      <g stroke={HAIR} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d={browL} />
        <path d={browR} />
      </g>

      {/* Eyes: closed arcs in namaste, otherwise open with gaze shift + blink */}
      {face === "serene" ? (
        <g stroke={HAIR} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M46.5 66 Q49.5 68.5 52.5 66" />
          <path d="M67.5 66 Q70.5 68.5 73.5 66" />
        </g>
      ) : (
        <g transform={`translate(0 ${lookUp})`}>
          <g className="mascot-blink" fill={HAIR}>
            <ellipse cx="49.5" cy="66" rx="2.9" ry="3.2" />
            <ellipse cx="70.5" cy="66" rx="2.9" ry="3.2" />
          </g>
        </g>
      )}
      <g stroke={SKIN_SHADE} strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M45.5 71 Q49.5 72.5 53.5 71" />
        <path d="M66.5 71 Q70.5 72.5 74.5 71" />
      </g>

      {/* Nose */}
      <path d="M60 64 Q56.5 73 60 76 Q62.5 76 64 74.5" fill="none" stroke={SKIN_SHADE} strokeWidth="2" strokeLinecap="round" />

      {/* Mouth */}
      {face === "speaking" ? (
        <ellipse className="mascot-talk" cx="60" cy="83" rx="4.5" ry="3" fill={HAIR} />
      ) : (
        <path d={MOUTHS[face]} fill="none" stroke={HAIR} strokeWidth="2.2" strokeLinecap="round" />
      )}
    </g>
  );
}

/** Three dots rising beside the head while the answer is being retrieved. */
function ThoughtDots() {
  return (
    <g fill="var(--muted)">
      <circle className="mascot-think-dot" cx="94" cy="20" r="2.5" />
      <circle className="mascot-think-dot" cx="103" cy="11" r="3.5" style={{ animationDelay: "0.3s" }} />
      <circle className="mascot-think-dot" cx="114" cy="2" r="4.5" style={{ animationDelay: "0.6s" }} />
    </g>
  );
}
