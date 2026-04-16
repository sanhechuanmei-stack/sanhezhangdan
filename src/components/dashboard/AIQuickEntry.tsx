import { Sparkles, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAppData } from '@/hooks/useAppData';
import { parseEntryWithAI } from '@/lib/doubaoApi';
import { parseEntry } from '@/lib/parseEntry';
import { FormDialog } from '@/components/shared/FormDialog';
import { DatePicker } from '@/components/shared/DatePicker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ParsedEntry } from '@/types';

const ARK_API_KEY = import.meta.env.VITE_ARK_API_KEY as string | undefined;

// 项目名谐音/别名映射
const PROJECT_ALIASES: Record<string, string> = {
  '延禧社': '研习社',
  '延禧射': '研习社',
  '延禧色': '研习社',
  '延禧舍': '研习社',
  '研习射': '研习社',
  '研习色': '研习社',
  '燕习社': '研习社',
  '研习': '研习社',
  '小剪刀': '三和·小剪刀',
  '三和小剪刀': '三和·小剪刀',
  '线下': '线下课',
};

function fixProjectNames(text: string, projectNames: string[]): string {
  let result = text;
  for (const [alias, correct] of Object.entries(PROJECT_ALIASES)) {
    if (projectNames.includes(correct) && result.includes(alias) && !result.includes(correct)) {
      result = result.replace(alias, correct);
    }
  }
  return result;
}

// 浏览器语音识别类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance;
declare const SpeechRecognition: new () => SpeechRecognitionInstance;

export function AIQuickEntry() {
  const { state, addBill } = useAppData();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Editable confirm fields
  const [cDate, setCDate] = useState('');
  const [cType, setCType] = useState<'income' | 'expense'>('income');
  const [cProjectId, setCProjectId] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cIncomeNote, setCIncomeNote] = useState('');
  const [cExpCat, setCExpCat] = useState('');
  const [cExpNote, setCExpNote] = useState('');
  const [cPeriod, setCPeriod] = useState('');

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('当前浏览器不支持语音输入'); return; }

    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      text = fixProjectNames(text, state.projects.map(p => p.name));
      setInput(text);
    };
    recognition.onerror = () => {
      toast.error('语音识别失败，请重试');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function applyParsed(result: ParsedEntry) {
    setCDate(result.date);
    setCType(result.type);
    setCProjectId(result.projectId ?? '');
    setCAmount(result.amount !== undefined ? String(result.amount) : '');
    setCIncomeNote(result.incomeNote ?? '');
    setCExpCat(result.expenseCategory ?? '');
    setCExpNote(result.expenseNote ?? '');
    setCPeriod('');
    setConfirmOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    if (ARK_API_KEY) {
      setLoading(true);
      try {
        const result = await parseEntryWithAI(
          input.trim(),
          state.projects,
          state.expenseCategories,
          ARK_API_KEY
        );
        applyParsed(result);
      } catch (err) {
        console.error(err);
        toast.error('AI 解析失败，已切换为本地解析');
        const result = parseEntry(input.trim(), state.projects, state.expenseCategories);
        applyParsed(result);
      } finally {
        setLoading(false);
      }
    } else {
      const result = parseEntry(input.trim(), state.projects, state.expenseCategories);
      applyParsed(result);
    }
  }

  function handleConfirm() {
    if (!cDate) { toast.error('请选择日期'); return; }
    if (!cProjectId) { toast.error('请选择业务'); return; }
    if (!cAmount || parseFloat(cAmount) <= 0) { toast.error('请填写有效金额'); return; }

    addBill({
      id: crypto.randomUUID(),
      projectId: cProjectId,
      date: cDate,
      ...(cType === 'income' ? {
        income: parseFloat(cAmount),
        incomeNote: cIncomeNote.trim() || undefined,
      } : {
        expenseCategory: cExpCat || undefined,
        expense: parseFloat(cAmount),
        expenseNote: cExpNote.trim() || undefined,
      }),
      period: cPeriod || undefined,
    });

    toast.success('已保存到账单');
    setInput('');
    setConfirmOpen(false);
  }

  return (
    <>
      {/* 录音全屏遮罩 */}
      {listening && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-lg flex flex-col items-center justify-end pb-24 animate-fade-up"
          onClick={stopVoice}
        >
          <p className="text-white/60 text-sm mb-6 tracking-wide">正在聆听，点击停止</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); stopVoice(); }}
            className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-elevated"
            style={{ animation: 'pulse-ring 1.2s ease-in-out infinite' }}
          >
            <MicOff className="h-10 w-10 text-white" />
          </button>
          {input && (
            <p className="text-white/90 mt-6 text-base px-8 text-center max-w-sm">{input}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 sm:gap-3 card-solid rounded-2xl p-2 pl-3 sm:pl-4">
          {loading
            ? <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
            : <Sparkles className="h-5 w-5 text-primary shrink-0" />
          }
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="一句话记账：研习社收入999..."
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 font-body py-2 min-w-0 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={startVoice}
            disabled={loading || listening}
            className="text-muted-foreground hover:text-primary rounded-xl px-3 py-2.5 transition-all duration-200 shrink-0 disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground rounded-xl px-3 sm:px-4 py-2.5 hover:opacity-90 transition-opacity duration-200 shrink-0 disabled:opacity-50 font-medium text-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      <FormDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认记账信息"
        onSubmit={handleConfirm}
        submitText="确认保存"
      >
        <div className="space-y-2">
          <Label>业务</Label>
          <select
            value={cProjectId}
            onChange={(e) => setCProjectId(e.target.value)}
            className="field-apple text-sm"
          >
            <option value="">请选择业务</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>类型</Label>
          <div className="flex gap-2">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cType === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'income' ? '收入' : '支出'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>金额</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={cAmount}
            onChange={(e) => setCAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>日期</Label>
          <DatePicker value={cDate} onChange={setCDate} placeholder="选择日期" />
        </div>

        {cType === 'income' ? (
          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Input value={cIncomeNote} onChange={(e) => setCIncomeNote(e.target.value)} placeholder="收入说明" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>支出项目</Label>
              <select
                value={cExpCat}
                onChange={(e) => setCExpCat(e.target.value)}
                className="field-apple text-sm"
              >
                <option value="">请选择支出项目</option>
                {state.expenseCategories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>支出备注（可选）</Label>
              <Input value={cExpNote} onChange={(e) => setCExpNote(e.target.value)} placeholder="支出说明" />
            </div>
          </>
        )}

        {(() => {
          const proj = state.projects.find((p) => p.id === cProjectId);
          if (!proj?.periods?.length) return null;
          return (
            <div className="space-y-2">
              <Label>期次（可选）</Label>
              <select
                value={cPeriod}
                onChange={(e) => setCPeriod(e.target.value)}
                className="field-apple text-sm"
              >
                <option value="">请选择期次</option>
                {proj.periods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          );
        })()}
      </FormDialog>
    </>
  );
}
