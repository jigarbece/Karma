import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { shareImage } from '../lib/shareCard';
import { Icon } from './Icon';

/** Builds a share card image on tap and hands it to the phone's share sheet (or downloads it). */
export function ShareButton({
  build, filename, text, url, label, className = 'btn-ghost',
}: { build: () => Promise<Blob>; filename: string; text: string; url: string; label?: string; className?: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'working' | 'shared' | 'downloaded' | 'failed'>('idle');

  const go = async () => {
    setState('working');
    try {
      const blob = await build();
      const r = await shareImage(blob, filename, text, url);
      setState(r === 'cancelled' ? 'idle' : r);
    } catch {
      setState('failed');
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} onClick={go} disabled={state === 'working'}>
        <Icon name="download" size={18} />
        {state === 'working' ? t('share.working') : label ?? t('share.button')}
      </button>
      <span role="status" className="text-xs text-muted">
        {state === 'shared' ? t('share.done') : state === 'downloaded' ? t('share.saved') : state === 'failed' ? t('share.failed') : ''}
      </span>
    </span>
  );
}
