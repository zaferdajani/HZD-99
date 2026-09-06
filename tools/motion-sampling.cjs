// Content sampling is a retime, never a way to invent missing animation.
// Keep chronological order and cover the entire authored action window.
function selectMotionFrames(candidates, ceiling, distance, minChange = 4) {
  if (!Number.isInteger(ceiling) || ceiling < 3 || candidates.length < 3)
    throw new Error('Motion sampling needs at least three candidates and cells');
  const keep = [0];
  for (let i = 1; i < candidates.length; i++) {
    if (distance(candidates[keep[keep.length - 1]].sig, candidates[i].sig) >= minChange)
      keep.push(i);
  }
  // Alternating two copied poses also changes on every frame. Count actual
  // distinct pictures as well, without removing legitimate returns in time.
  const unique = [];
  for (const i of keep) {
    if (unique.every(j => distance(candidates[j].sig, candidates[i].sig) >= minChange)) unique.push(i);
  }
  // Do not lower the threshold until a static take appears to pass.
  if (unique.length < Math.min(6, ceiling))
    throw new Error('Source has too few distinct motion samples; inspect or replace the take');
  // Retain the final source moment: a late recoil/return must not be lost
  // just because the first part of the take filled the requested cell count.
  const end = candidates.length - 1;
  if (keep[keep.length - 1] !== end) {
    if (distance(candidates[keep[keep.length - 2]].sig, candidates[end].sig) >= minChange)
      keep[keep.length - 1] = end;
    else keep.push(end);
  }
  const count = Math.min(ceiling, keep.length);
  const indices = Array.from({ length: count }, (_, i) => keep[Math.round(i * (keep.length - 1) / (count - 1))]);
  return { indices, distinct: unique.length, threshold: minChange };
}
module.exports = { selectMotionFrames };
