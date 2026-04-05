"use client";

import { useState } from "react";

export function SkeletonImage({
  className = "",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse rounded-[inherit]" />
      )}
      <img
        {...props}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
      />
    </div>
  );
}
