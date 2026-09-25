import { useState } from 'preact/hooks';

import StateCurve from './StateCurve.jsx';

const STATES = [
  { key: 'hidden', label: 'Non tracée', drawn: false, showAfter: false },
  { key: 'before', label: 'Avant', drawn: true, showAfter: false },
  { key: 'after', label: 'Après', drawn: true, showAfter: true },
];

/** Demo-only wrapper: lets /components switch StateCurve between its states. */
export default function StateCurvePreview({ steps, ui }) {
  const [stateKey, setStateKey] = useState('after');
  const current = STATES.find((state) => state.key === stateKey);

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2">
        {STATES.map((state) => (
          <button
            type="button"
            onClick={() => setStateKey(state.key)}
            class={`rounded-full border px-3 py-1 text-sm transition-colors ${
              state.key === stateKey
                ? 'border-on-surface-default bg-on-surface-default text-background'
                : 'border-surface-raise text-on-surface-default hover:border-on-surface-subdue'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>
      <StateCurve
        steps={steps}
        ui={ui}
        drawn={current.drawn}
        showAfter={current.showAfter}
      />
    </div>
  );
}
