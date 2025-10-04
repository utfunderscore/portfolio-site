import type { CSSProperties } from "react";

type IslandControlsProps = {
  cardOpacity: number;
  cardBlur: number;
  onOpacityChange: (opacity: number) => void;
  onBlurChange: (blur: number) => void;
  cardSurfaceStyle?: CSSProperties;
};

export function IslandControls({
  cardOpacity,
  cardBlur,
  onOpacityChange,
  onBlurChange,
  cardSurfaceStyle,
}: IslandControlsProps) {
  return (
    <section
      className="card-surface mb-8 rounded-md p-4 shadow-lg"
      style={cardSurfaceStyle}
      aria-label="Island transparency control"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Island Transparency (alpha)
          </span>
          <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
            <span>Opacity: {cardOpacity.toFixed(2)}</span>
            <span className="hidden sm:inline">Transparency: {(1 - cardOpacity).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="island-opacity"
            type="range"
            min={0.1}
            max={0.9}
            step={0.01}
            value={cardOpacity}
            onChange={(event) => onOpacityChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#a97bff]"
          />
          <label htmlFor="island-opacity" className="text-xs text-gray-400">
            {Math.round(cardOpacity * 100)}%
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
            Island Blur
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="island-blur"
            type="range"
            min={0}
            max={50}
            step={1}
            value={cardBlur}
            onChange={(event) => onBlurChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#a97bff]"
          />
          <label htmlFor="island-blur" className="text-xs text-gray-400">
            {cardBlur}px
          </label>
        </div>
      </div>
    </section>
  );
}
