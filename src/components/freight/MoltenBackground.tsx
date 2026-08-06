import MoltenMetal from "@/components/ui/MoltenMetal";

/**
 * Full-screen fixed background MoltenMetal effect.
 * Uses FreightVeil's ink-navy / brass / verdigris palette.
 * Low opacity so page content stays readable.
 */
export function MoltenBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <MoltenMetal
        color1="#0B121A"
        color2="#9C8552"
        color3="#55776D"
        speed={0.2}
        scale={3}
        detail={4}
        glow={1.2}
        coreSize={0.08}
        swirl={0.6}
        fold={-0.15}
        blackPoint={0.1}
        brightness={0.9}
        colorMode="molten"
        grain={true}
        grainIntensity={0.03}
        mouseInteraction={true}
        mouseStrength={0.15}
        opacity={0.35}
      />
    </div>
  );
}
