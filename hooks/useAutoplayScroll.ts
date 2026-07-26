import { useCallback, useEffect, useRef } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

type ScrollableRef = {
  scrollTo: (opts: { x?: number; y?: number; animated?: boolean }) => void;
};

type LoopMode = 'clone' | 'sweep';

interface Options {
  itemCount: number;
  pitch: number;
  enabled?: boolean;
  intervalMs?: number;
  /**
   * How to wrap after the last item:
   * - 'clone' (default): consumer renders `itemCount + 1` items with a
   *   duplicate of item 0 at the tail; wraparound is invisible. Requires the
   *   ScrollView to be wide enough to actually scroll to `itemCount * pitch`.
   * - 'sweep': no clone rendered; wraparound is an animated `scrollTo(0)`.
   *   Use this when items are much smaller than the viewport and the clone
   *   position would be unreachable (contentSize clamps the scroll).
   */
  loopMode?: LoopMode;
}

/**
 * Autoplay for a horizontal ScrollView that stays in sync with manual scroll.
 *
 * Uses a recursive setTimeout (not setInterval) so every tick is exactly
 * `intervalMs` after the previous scroll settled — dragging the list resets
 * the clock instead of firing a stale tick mid-momentum.
 *
 * In `sweep` mode the hook needs to know the effective max scroll offset to
 * decide when to wrap; wire the returned `onContentSizeChange` and `onLayout`
 * to the ScrollView so it can measure that on its own.
 */
export function useAutoplayScroll(
  ref: React.RefObject<ScrollableRef | null>,
  {
    itemCount,
    pitch,
    enabled = true,
    intervalMs = 3500,
    loopMode = 'clone',
  }: Options,
) {
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentWidthRef = useRef(0);
  const viewportWidthRef = useRef(0);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const maxScrollX = () =>
    Math.max(0, contentWidthRef.current - viewportWidthRef.current);

  const scheduleNext = useCallback(() => {
    cancel();
    if (!enabled || itemCount < 2 || pitch <= 0) return;
    timeoutRef.current = setTimeout(() => {
      if (loopMode === 'clone') {
        if (indexRef.current >= itemCount) {
          // Sitting on the clone (visually equal to item 0). Snap invisibly
          // to real 0, then animate forward to 1 — user perceives one slide.
          ref.current?.scrollTo({ x: 0, animated: false });
          indexRef.current = 1;
          ref.current?.scrollTo({ x: pitch, animated: true });
        } else {
          indexRef.current = indexRef.current + 1;
          ref.current?.scrollTo({
            x: indexRef.current * pitch,
            animated: true,
          });
        }
      } else {
        // sweep mode
        const nextIndex = indexRef.current + 1;
        const nextTarget = nextIndex * pitch;
        const max = maxScrollX();
        // Wrap either because we've walked past the last logical item or the
        // next position is beyond what the ScrollView can actually reach —
        // both mean "we're visually at the end; time to restart".
        const outOfRange = max > 0 && nextTarget > max + 4;
        if (nextIndex >= itemCount || outOfRange) {
          ref.current?.scrollTo({ x: 0, animated: true });
          indexRef.current = 0;
        } else {
          indexRef.current = nextIndex;
          ref.current?.scrollTo({ x: nextTarget, animated: true });
        }
      }
      scheduleNext();
    }, intervalMs);
  }, [cancel, enabled, itemCount, pitch, intervalMs, ref, loopMode]);

  useEffect(() => {
    if (indexRef.current > itemCount) {
      // List shrank after a refresh; reset to a safe position.
      indexRef.current = 0;
    }
    scheduleNext();
    return cancel;
  }, [scheduleNext, cancel, itemCount]);

  const syncIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pitch <= 0 || itemCount === 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / pitch);
    if (loopMode === 'clone' && i >= itemCount) {
      indexRef.current = 0;
      ref.current?.scrollTo({ x: 0, animated: false });
    } else {
      indexRef.current = Math.max(0, Math.min(itemCount - 1, i));
    }
  };

  const onScrollBeginDrag = () => cancel();
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncIndex(e);
    scheduleNext();
  };
  // Covers the case where a short tap releases without generating momentum —
  // otherwise onMomentumScrollEnd never fires and autoplay would hang.
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncIndex(e);
    scheduleNext();
  };
  const onContentSizeChange = (w: number) => {
    contentWidthRef.current = w;
  };
  const onLayout = (e: LayoutChangeEvent) => {
    viewportWidthRef.current = e.nativeEvent.layout.width;
  };

  return {
    indexRef,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    onContentSizeChange,
    onLayout,
  };
}
