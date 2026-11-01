import React from 'react';

export const SoapTemplate = ({ format = 'soap', soap, setSoap, dap, setDap }) => {
  if (format === 'dap') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Data (D) — Objective observations, client statements & behaviors
          </label>
          <textarea
            rows={3}
            value={dap?.data || ''}
            onChange={(e) => setDap({ ...dap, data: e.target.value })}
            placeholder="Client presented on time, reported elevated work pressure..."
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Assessment (A) — Clinical interpretation, diagnosis & response
          </label>
          <textarea
            rows={3}
            value={dap?.assessment || ''}
            onChange={(e) => setDap({ ...dap, assessment: e.target.value })}
            placeholder="Affect constricted, demonstrates cognitive distortion of mind reading..."
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Plan (P) — Therapeutic interventions, homework & next session focus
          </label>
          <textarea
            rows={3}
            value={dap?.plan || ''}
            onChange={(e) => setDap({ ...dap, plan: e.target.value })}
            placeholder="Assign thought record exercise. Follow up next Monday."
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Subjective (S) — Client's reported feelings, symptoms & experiences
        </label>
        <textarea
          rows={2}
          value={soap?.subjective || ''}
          onChange={(e) => setSoap({ ...soap, subjective: e.target.value })}
          placeholder="Client states: 'I feel exhausted whenever my manager calls me'..."
          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Objective (O) — Clinician observations, affect, psychomotor signs
        </label>
        <textarea
          rows={2}
          value={soap?.objective || ''}
          onChange={(e) => setSoap({ ...soap, objective: e.target.value })}
          placeholder="Speech rapid, eye contact intermittent, pleasant demeanor..."
          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Assessment (A) — Clinical synthesis, progress toward goals, schema triggers
        </label>
        <textarea
          rows={2}
          value={soap?.assessment || ''}
          onChange={(e) => setSoap({ ...soap, assessment: e.target.value })}
          placeholder="Demonstrating improved awareness of automatic thoughts..."
          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Plan (P) — Action steps, homework, next scheduled appointment
        </label>
        <textarea
          rows={2}
          value={soap?.plan || ''}
          onChange={(e) => setSoap({ ...soap, plan: e.target.value })}
          placeholder="Behavioral activation: 20 min walk daily. Next session scheduled for..."
          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
        />
      </div>
    </div>
  );
};

export default SoapTemplate;
