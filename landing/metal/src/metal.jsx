// Puts the real metal-fx ring (WebGL "liquid metal") around the landing page copy buttons.
// The page has no React, so each button gets its own tiny React root. The original <button> node is moved
// into the MetalFx host, so its copy handler from main.js keeps working. Without WebGL2 the CSS ring stays.
// Settings come from the libraries.dev Studio "Copy prompt" the owner tuned.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { setGlowConfig, setBendConfig, MetalFx, isMetalFxSupported } from 'metal-fx';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

setGlowConfig({ haloOpMul: 1.84 }); // halo
setBendConfig({ strength: 0, reach: 0, maxDisp: 0 }); // no cursor bend

// The shader redraws every frame. Where the browser would draw WebGL on the CPU (hardware acceleration off, a
// blocklisted GPU, a remote desktop) that alone makes the whole page stutter, so those get the CSS ring instead.
function hasFastWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

function Ring({ button, slot }) {
  const host = useRef(null);
  // Only animate while the button is on screen; off screen the ring keeps its last frame.
  const [seen, setSeen] = useState(true);
  useEffect(() => { host.current.append(button); }, [button]);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(slot);
    return () => io.disconnect();
  }, [slot]);
  return (
    <MetalFx preset="chromatic" variant="circle" theme="dark" strength={0.81} shaderScale={1.35} innerShadow
      paused={still || !seen}>
      <span className="metal-host" ref={host} />
    </MetalFx>
  );
}

if (isMetalFxSupported() && hasFastWebGL()) {
  document.querySelectorAll('.copy.metal').forEach((button) => {
    const slot = document.createElement('span');
    slot.className = 'metal-slot';
    button.replaceWith(slot);
    button.classList.add('fx'); // turns off the CSS fallback ring
    createRoot(slot).render(<Ring button={button} slot={slot} />);
  });
}
