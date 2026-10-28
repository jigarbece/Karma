/** Shared emblem used by the welcome header and signed-in navigation. */
export function KarmaMark({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/karma-emblem.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="block shrink-0 object-contain drop-shadow-sm"
    />
  );
}
