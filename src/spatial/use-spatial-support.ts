import { useEffect, useState, type RefObject } from "react";
import type { SpatialSupport } from "./types";

const DESKTOP_QUERY = "(min-width: 768px)";

let webglCache: boolean | null = null;

function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglCache = !!gl;
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/**
 * Decides between the 3D scene and the 2D fallback on the client only.
 * `hostRef` must point to the element that will hold the canvas: a host hidden
 * with `display: none` reports zero width and never mounts WebGL.
 */
export function useSpatialSupport(hostRef: RefObject<HTMLElement | null>): {
  support: SpatialSupport;
  visible: boolean;
} {
  const [support, setSupport] = useState<SpatialSupport>({ mode: "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const evaluate = () => {
      if (!mq.matches) setSupport({ mode: "2d", reason: "viewport" });
      else if (!hasWebGL()) setSupport({ mode: "2d", reason: "webgl" });
      else setSupport({ mode: "3d" });
    };
    evaluate();
    mq.addEventListener("change", evaluate);
    return () => mq.removeEventListener("change", evaluate);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setVisible(width > 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hostRef]);

  return { support, visible };
}
