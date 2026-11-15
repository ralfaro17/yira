/** Deep-space backdrop used by every frame: #000f15 + star field with overlay blend. */
export function SpaceBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-space">
      <img
        src="/yira/common/space-background.png"
        alt=""
        className="size-full object-cover mix-blend-overlay motion-safe-only animate-stars-twinkle"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,99,248,0.15),transparent_70%)]" />
    </div>
  )
}
