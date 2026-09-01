export type VisibleSplit<T> = {
  item: T;
  index: number;
};

export function getVisibleSplits<T>(
  items: T[],
  currentIndex: number,
  visibleCount: number | null,
): VisibleSplit<T>[] {
  if (
    visibleCount === null ||
    visibleCount >= items.length
  ) {
    return items.map((item, index) => ({
      item,
      index,
    }));
  }

  if (visibleCount <= 0) {
    return [];
  }

  const clampedCurrentIndex = Math.min(
    Math.max(currentIndex, 0),
    Math.max(items.length - 1, 0),
  );

  const halfWindow = Math.floor(
    visibleCount / 2,
  );

  let startIndex =
    clampedCurrentIndex - halfWindow;

  const maxStartIndex =
    items.length - visibleCount;

  startIndex = Math.max(
    0,
    Math.min(startIndex, maxStartIndex),
  );

  return items
    .slice(
      startIndex,
      startIndex + visibleCount,
    )
    .map((item, offset) => ({
      item,
      index: startIndex + offset,
    }));
}