// components/SwipeShell.tsx
import { type ReactNode, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router-dom";
import PullToRefresh from "react-simple-pull-to-refresh";
import { FiArrowDown } from "react-icons/fi";

type Props = {
  children: ReactNode;
  toLeft?: string; // navigate when user swipes LEFT (→ next screen)
  toRight?: string; // navigate when user swipes RIGHT (→ previous screen)
  disabled?: boolean;
  refresh: () => Promise<void>;
};

const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
  navigator.userAgent
);

export default function SwipeShell({
  children,
  toLeft,
  toRight,
  disabled,
  refresh,
}: Props) {
  const nav = useNavigate();
  const startXRef = useRef(0);
  const DELTA = 56; // px; minimum horizontal movement

  useEffect(() => {
    if (disabled) return;

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName.toLowerCase();
      const isTyping = ["input", "textarea", "select"].includes(tag);
      if (isTyping) return;

      if (e.key === "ArrowLeft") {
        if (!toLeft && !toRight) {
          nav(-1);
        } else if (toRight) {
          nav(toRight);
        }
      } else if (e.key === "ArrowRight" && toLeft) {
        nav(toLeft);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nav, toLeft, toRight, disabled]);

  const handlers = useSwipeable({
    trackTouch: true,
    trackMouse: false,
    preventScrollOnSwipe: false, // let vertical scroll work
    onTouchStartOrOnMouseDown: (e) => {
      const t =
        "touches" in e.event ? e.event.touches?.[0] : (e.event as MouseEvent);
      startXRef.current = t?.clientX ?? 0;
    },
    onSwiped: (e) => {
      if (disabled || !isMobile) return;

      const target = e.event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']"))
        return;

      const absX = Math.abs(e.deltaX);
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      if (!isHorizontal || absX < DELTA) return;

      if (e.dir === "Left" && toLeft) {
        nav(toLeft);
      } else if (e.dir === "Right" && toRight) {
        nav(toRight);
      } else if (e.dir === "Right") {
        nav(-1);
      }
    },
  });

  return (
    <div {...handlers}>
      <PullToRefresh
        onRefresh={refresh}
        pullingContent={
          <div className="pt-3 pb-1 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100/90 dark:bg-gray-800/80 px-3 py-1 text-xs text-gray-600 dark:text-gray-200 shadow-sm">
              <FiArrowDown className="animate-bounce" />
              <span className="font-medium">Pull to refresh</span>
            </div>
          </div>
        }
        refreshingContent={
          <div className="pt-3 pb-1 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100/90 dark:bg-gray-800/80 px-3 py-1 text-xs text-gray-600 dark:text-gray-200 shadow-sm">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Refreshing…</span>
            </div>
          </div>
        }
        resistance={2.2}
        pullDownThreshold={64}
        maxPullDownDistance={96}
        isPullable={!isMobile}
      >
        {children}
      </PullToRefresh>
    </div>
  );
}
