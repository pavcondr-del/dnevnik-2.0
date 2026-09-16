"use client";
import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    )
      return;

    const onLoad = () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        /* офлайн-кэширование недоступно — не критично */
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
