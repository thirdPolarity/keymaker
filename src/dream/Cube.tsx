import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

export function Cube() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const cube = useRef<HTMLSpanElement>(null);

  function reset() {
    setRotation({ x: 0, y: 0 });
    cube.current?.getAnimations().forEach(animation => { animation.currentTime = 0; });
  }
  function release(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <div className={`cube-scene interactive-cube ${dragging ? "is-paused" : ""}`}>
      <button className={`cube-control ${dragging ? "is-dragging" : ""}`} type="button"
        aria-label="Rotate cube" aria-describedby="cube-instructions"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          setDragging(true);
        }}
        onPointerMove={event => {
          const previous = drag.current;
          if (!previous || previous.id !== event.pointerId) return;
          const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
          setRotation(value => ({ x: value.x - dy * .7, y: value.y + dx * .7 }));
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
        onClick={event => { if (event.detail === 0) setRotation(value => ({ ...value, y: value.y + 15 })); }}
        onKeyDown={event => {
          const direction = { ArrowLeft: [0, -15], ArrowRight: [0, 15], ArrowUp: [-15, 0], ArrowDown: [15, 0] }[event.key];
          if (event.key === "Home") { event.preventDefault(); reset(); }
          else if (direction) {
            event.preventDefault();
            setRotation(value => ({ x: value.x + direction[0], y: value.y + direction[1] }));
          }
        }}>
        <span className="cube-space" aria-hidden="true">
          <span className="cube-orientation" style={{ "--rotate-x": `${rotation.x}deg`, "--rotate-y": `${rotation.y}deg` } as CSSProperties}>
            <span className="cube" ref={cube}>{[0,1,2,3,4,5].map(i => <span key={i} className={`cube-face face-${i}`} />)}</span>
          </span>
        </span>
      </button>
      <span className="sr-only" id="cube-instructions">Drag to rotate, or use the arrow keys. Home resets the view. Rotation continues when you release the cube.</span>
    </div>
  );
}
