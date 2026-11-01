import React, { useState } from 'react';
import { Lock, Share2, Sparkles, Save, Shield, Zap, FileText } from 'lucide-react';
import Button from '../common/Button';
import SoapTemplate from './SoapTemplate';
import RichTextEditor from './RichTextEditor';
import useEntitlement from '../../hooks/useEntitlement';
import UpgradeModal from '../common/UpgradeModal';

export const NoteEditor = ({ client, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState('private'); // 'private' vs 'shared'
  const [format, setFormat] = useState('soap'); // 'freeform' | 'soap' | 'dap'
  const [content, setContent] = useState('');
  const [soap, setSoap] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [dap, setDap] = useState({ data: '', assessment: '', plan: '' });
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const { checkNoteTemplateAccess, blockedModalState, closeUpgradePrompt } = useEntitlement();

  const handleFormatChange = (newFormat) => {
    if (newFormat !== 'freeform') {
      const allowed = checkNoteTemplateAccess(newFormat);
      if (!allowed) return;
    }
    setFormat(newFormat);
  };

  // Demo Autofill for Clinical Notes
  const autofillDemoNote = () => {
    if (noteType === 'private') {
      setTitle('Cognitive Restructuring & Behavioral Activation — Session 4');
      setTagsInput('CBT, Anxiety, Exposure, Grounding');
      if (format === 'soap') {
        setSoap({
          subjective: 'Client reports noticeable reduction in morning dread and anticipatory palpitations. Practiced 5-4-3-2-1 sensory grounding twice this week before team retrospectives.',
          objective: 'Alert, oriented x3. Euthymic mood, coherent speech with congruent affect. Mild psychomotor agitation when discussing boundary conflicts with supervisor.',
          assessment: 'Moderate Generalized Anxiety Disorder (GAD) symptoms in clinical remission. Responding positively to cognitive reframing of catastrophizing distortions.',
          plan: 'Continue weekly CBT sessions. Introduce behavioral experiment targeting workload delegation. Assign daily automatic thought record.',
        });
      } else if (format === 'dap') {
        setDap({
          data: 'Client described anxiety response to executive sprint presentation. Panic self-rated at 4/10 compared to baseline 9/10. Engaged collaboratively in roleplaying assertiveness.',
          assessment: 'Improved emotional regulation and distress tolerance. Cognitive distortions (all-or-nothing thinking) successfully challenged in session.',
          plan: 'Maintain weekly psychotherapy consultations. Client to complete thought diary between sessions.',
        });
      } else {
        setContent('<h3>Clinical Session Observations</h3><p>Client arrived punctually for their telehealth consultation. We evaluated the thought record assigned last week. Client reported that recognizing cognitive distortions (catastrophizing) reduced their heart rate and panic significantly.</p><h3>Interventions Delivered</h3><ul><li>Cognitive reframing of worst-case scenarios</li><li>5-4-3-2-1 sensory grounding in-session practice</li><li>Assertive communication roleplay for workplace boundary setting</li></ul><h3>Next Steps</h3><p>Continue behavioral activation exercises and check in next Wednesday at 4:00 PM IST.</p>');
      }
    } else {
      setTitle('Weekly Psychoeducation & Sensory Grounding Action Plan');
      setTagsInput('Homework, Grounding, Psychoeducation, ClientPlan');
      setContent('<h3>Weekly Homework & Reflections</h3><p>Hello! Here are the core practice tools we practiced together in our session today:</p><ul><li><strong>5-4-3-2-1 Sensory Grounding:</strong> Whenever you feel panic or anxiety rising, pause and identify: 5 things you see, 4 things you can physically touch, 3 sounds you hear, 2 scents you notice, and 1 kind self-affirmation.</li><li><strong>Daily Thought Record:</strong> When you feel overwhelmed before sprint reviews, note down: <em>(1) Situation, (2) Automatic negative thought, (3) Evidence against the thought, (4) Balanced perspective.</em></li></ul><p><em>Remember: Anxiety is an uncomfortable physiological alarm, not an objective truth. Be gentle with yourself this week!</em></p>');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for this clinical note');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: client._id,
        title,
        type: noteType,
        format,
        content,
        soap,
        dap,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      };

      await onSave(payload);
    } catch (err) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      <UpgradeModal
        isOpen={blockedModalState.isOpen}
        onClose={closeUpgradePrompt}
        state={blockedModalState}
      />

      {/* Header & Access Control Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-800" />
            <h3 className="text-base font-extrabold text-slate-900">
              Clinical Documentation for <span className="text-teal-800">{client.name}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Clinical Confidentiality: Private diagnostic impressions are isolated in your practitioner vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Demo Autofill Button */}
          <button
            type="button"
            onClick={autofillDemoNote}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-teal-700 fill-teal-700" />
            <span>⚡ Demo Autofill Note</span>
          </button>

          {/* Private vs Shared Pill Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setNoteType('private')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                noteType === 'private'
                  ? 'bg-amber-100 text-amber-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Private Note</span>
            </button>
            <button
              type="button"
              onClick={() => setNoteType('shared')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                noteType === 'shared'
                  ? 'bg-teal-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Shared with Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Note Type Explainer Alert */}
      {noteType === 'private' ? (
        <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Confidential Practitioner EHR:</strong> Diagnostic impressions, transferences, and internal case analysis.
            Guaranteed zero leakage to client portal.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs flex items-center gap-2">
          <Share2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
          <span>
            <strong>Client Portal Viewable:</strong> Psychoeducation worksheets, coping skills, and homework action items.
            The client can review this in their secure sanctuary.
          </span>
        </div>
      )}

      {/* Title & Format Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
            Note Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              noteType === 'private'
                ? 'e.g. Session 4: CBT Schema Analysis'
                : 'e.g. Weekly Reflections & Thought Record'
            }
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
            Clinical Template
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['freeform', 'soap', 'dap'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFormatChange(fmt)}
                className={`flex-1 py-1.5 rounded-lg uppercase tracking-wider text-[11px] font-bold transition-all ${
                  format === fmt
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {format === 'freeform' ? (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
            Clinical Documentation (TipTap WYSIWYG Editor)
          </label>
          <RichTextEditor
            content={content}
            onChange={(html) => setContent(html)}
            placeholder="Write clinical observations, interventions, behavioral experiments, client verbatim quotes..."
          />
        </div>
      ) : (
        <SoapTemplate
          format={format}
          soap={soap}
          setSoap={setSoap}
          dap={dap}
          setDap={setDap}
        />
      )}

      {/* Tags */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
          Clinical Tags (Comma-separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="CBT, Homework, Anxiety, Telehealth"
          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 font-medium"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          variant="primary"
          icon={Save}
          loading={saving}
          onClick={handleSave}
          className="shadow-sm"
        >
          Save Clinical Note
        </Button>
      </div>
    </div>
  );
};

export default NoteEditor;
