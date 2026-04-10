"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ds";

export function SkeletonImage({
  className = "",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <Skeleton variant="rect" className="absolute inset-0 rounded-[inherit] aspect-auto" />
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
