import { AspectRatio } from '../types';

const RATIOS: { ratio: AspectRatio; value: number }[] = [
  { ratio: '9:16', value: 9 / 16 },
  { ratio: '4:5', value: 4 / 5 },
  { ratio: '1:1', value: 1 },
  { ratio: '3:2', value: 3 / 2 },
  { ratio: '16:9', value: 16 / 9 },
];

/** Picks the supported aspect ratio closest to an image's shape (compared on a log scale). */
export function closestAspectRatio(width: number, height: number): AspectRatio {
  if (!(width > 0) || !(height > 0)) return '4:5';
  const target = Math.log(width / height);
  let best = RATIOS[0];
  for (const candidate of RATIOS) {
    if (Math.abs(Math.log(candidate.value) - target) < Math.abs(Math.log(best.value) - target)) best = candidate;
  }
  return best.ratio;
}

export function isAspectRatio(value: unknown): value is AspectRatio {
  return RATIOS.some((r) => r.ratio === value);
}
