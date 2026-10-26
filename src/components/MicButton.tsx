import { Icon } from './Icon';

export function MicButton({
  onClick, label, size = 'lg', active = false,
}: { onClick: () => void; label: string; size?: 'lg' | 'md'; active?: boolean }) {
  const dim = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';
  return (
    <span className="relative inline-grid place-items-center">
      {/* soft halo rings */}
      <span aria-hidden="true" className={`absolute rounded-full bg-saffron/20 ${size === 'lg' ? 'h-36 w-36' : 'h-24 w-24'} ${active ? 'animate-ping' : 'float-slow'} motion-reduce:animate-none`} />
      <span aria-hidden="true" className={`absolute rounded-full border border-saffron/40 ${size === 'lg' ? 'h-32 w-32' : 'h-[5.25rem] w-[5.25rem]'}`} />
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={`relative grid ${dim} place-items-center rounded-full text-[#2A1A08] shadow-glow transition active:scale-95`}
        style={{ background: 'radial-gradient(circle at 35% 28%, #FFE2A0, #FFB347 55%, #F28C28)' }}
      >
        <Icon name={active ? 'stop' : 'mic'} size={size === 'lg' ? 40 : 28} />
      </button>
    </span>
  );
}
