export function usePointerDrag(
  onMove: (dx: number, dy: number, ev: PointerEvent) => void,
  onEnd?: () => void,
) {
  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    let lastX = e.clientX;
    let lastY = e.clientY;

    function move(ev: PointerEvent) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      onMove(dx, dy, ev);
    }

    function up() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (onEnd) onEnd();
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return { onPointerDown };
}
