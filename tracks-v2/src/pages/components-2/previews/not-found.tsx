import { NotFoundGlitch } from "@/components/motion/not-found/glitch";
import { NotFoundMagnetic } from "@/components/motion/not-found/magnetic";
import { NotFoundSpotlight } from "@/components/motion/not-found/spotlight";
import { NotFoundStacked } from "@/components/motion/not-found/stacked";
import { NotFoundTerminal } from "@/components/motion/not-found/terminal";
export function NotFoundGlitchPreview() {
  return (
    <div className="w-full">
      <NotFoundGlitch />
    </div>
  );
}

export function NotFoundMagneticPreview() {
  return (
    <div className="w-full">
      <NotFoundMagnetic />
    </div>
  );
}

export function NotFoundSpotlightPreview() {
  return (
    <div className="w-full">
      <NotFoundSpotlight />
    </div>
  );
}

export function NotFoundStackedPreview() {
  return (
    <div className="w-full">
      <NotFoundStacked />
    </div>
  );
}

export function NotFoundTerminalPreview() {
  return (
    <div className="w-full">
      <NotFoundTerminal />
    </div>
  );
}

