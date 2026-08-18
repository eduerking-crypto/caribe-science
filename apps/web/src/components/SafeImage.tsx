"use client";

import { useState } from "react";

export default function SafeImage({
  src,
  alt,
  className,
  ariaHidden,
}: {
  src: string;
  alt: string;
  className?: string;
  ariaHidden?: boolean;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={ariaHidden}
      className={className}
      onError={() => setOk(false)}
    />
  );
}