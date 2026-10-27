import { useState } from 'react';
import { useApp } from '../lib/app';
import { useI18n } from '../lib/i18n';

/** "I disagree" link: stores feedback for rubric review; the score itself stays as the AI graded it. */
export function Disagree({ actionId }: { actionId: string }) {
  const { t } = useI18n();
  const { repo } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) return <p role="status" className="mt-2 text-sm text-saffron-text">{t('talk.feedback_thanks')}</p>;
  if (!open) {
    return (
      <button type="button" className="mt-1 min-h-[44px] text-sm font-semibold text-muted underline" onClick={() => setOpen(true)}>
        {t('talk.disagree')}
      </button>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      <label className="block text-sm" htmlFor={`fb-${actionId}`}>{t('talk.disagree_prompt')}</label>
      <textarea id={`fb-${actionId}`} className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
      <button
        type="button" className="btn-ghost !min-h-[44px] text-sm" disabled={!text.trim()}
        onClick={async () => {
          await repo?.addFeedback(actionId, text.trim());
          setSent(true);
        }}
      >
        {t('talk.send_feedback')}
      </button>
    </div>
  );
}
