"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  timestamp: number;
}

/** Formats a timestamp in the browser after hydration to avoid locale mismatches. */
export function LocalTime({ timestamp }: LocalTimeProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(
      new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [timestamp]);

  return <>{formatted || "\u00a0"}</>;
}
