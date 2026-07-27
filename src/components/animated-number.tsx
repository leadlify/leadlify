import { useEffect, useRef, useState } from "react";

/** Animates a number from 0 to `value` once it is known. */
export function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return display;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const display = useCountUp(value);
  return (
    <span>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
