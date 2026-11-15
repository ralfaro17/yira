/** Deep-space backdrop used by every frame: #000f15 + star field with overlay blend. */
export function SpaceBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-space">
      <img
        src="/yira/common/space-background.png"
        alt=""
        className="size-full object-cover mix-blend-overlay"
      />
    </div>
  )
}
