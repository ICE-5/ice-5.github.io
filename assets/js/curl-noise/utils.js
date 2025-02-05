export function toScreenPosition(position, camera) {
    const vector = position.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;
    return { x, y };
}