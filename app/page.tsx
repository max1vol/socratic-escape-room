"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Gavel,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

type Stage = 0 | 1 | 2 | 3 | 4 | 5;

type GuideReply = {
  passed: boolean;
  title: string;
  message: string;
  counterargument?: string;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const INITIAL_COUNTER =
  "The heavier probe and the lighter probe land together because the Moon pulls on both with exactly the same gravitational force. With no air resistance, equal forces create equal acceleration.";

const STAGE_LABELS = ["Spot", "Explain", "Challenge", "Defend"];

function Seal() {
  return (
    <div className="seal" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 43h24M23 39h18M25 35V24h14v11M22 24h20l-10-8-10 8Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M18 49h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Progress({ stage }: { stage: Stage }) {
  if (stage === 0 || stage === 5) return null;
  return (
    <ol className="progress" aria-label={`Stage ${stage} of 4`}>
      {STAGE_LABELS.map((label, index) => {
        const number = index + 1;
        const done = number < stage;
        const active = number === stage;
        return (
          <li key={label} className={done ? "done" : active ? "active" : ""}>
            <span>{done ? <Check size={14} strokeWidth={3} /> : number}</span>
            <em>{label}</em>
          </li>
        );
      })}
    </ol>
  );
}

function PrimaryButton({ children, disabled, onClick, type = "button" }: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button className="primary" disabled={disabled} onClick={onClick} type={type}>
      <span>{children}</span><ArrowRight size={19} aria-hidden="true" />
    </button>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>(0);
  const [answer, setAnswer] = useState("");
  const [guide, setGuide] = useState<GuideReply | null>(null);
  const [counterargument, setCounterargument] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [defenceStarted, setDefenceStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!defenceStarted || seconds <= 0 || stage !== 4) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [defenceStarted, seconds, stage]);

  useEffect(() => {
    if (seconds === 0 && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [seconds]);

  const askGuide = useCallback(async (action: string, response: string) => {
    setLoading(true);
    setGuide(null);
    try {
      const request = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, response }),
      });
      const data = (await request.json()) as GuideReply & { error?: string };
      if (!request.ok) throw new Error(data.error || "The guide is unavailable.");
      setGuide(data);
      return data;
    } catch {
      setGuide({
        passed: false,
        title: "The guide is offline",
        message: "The Clerk cannot reach the chamber. Check the connection and try again.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  async function submitStage() {
    const clean = answer.trim();
    if (clean.length < 12) return;

    if (stage === 1) {
      await askGuide("identify", clean);
    } else if (stage === 2) {
      const result = await askGuide("explain", clean);
      if (result?.passed && result.counterargument) setCounterargument(result.counterargument);
    } else if (stage === 3) {
      await askGuide("challenge", clean);
    } else if (stage === 4) {
      await askGuide("defend", clean);
    }
  }

  function continueStage() {
    if (!guide?.passed) {
      setGuide(null);
      return;
    }
    setAnswer("");
    setGuide(null);
    setStage((value) => (Math.min(value + 1, 5) as Stage));
  }

  function startDefence() {
    setDefenceStarted(true);
    setSeconds(45);
    if (!speechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    let finalText = answer;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      setAnswer(`${finalText}${interim}`.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function reset() {
    recognitionRef.current?.stop();
    setStage(0);
    setAnswer("");
    setGuide(null);
    setCounterargument("");
    setDefenceStarted(false);
    setListening(false);
    setSeconds(45);
  }

  return (
    <main>
      <header className="masthead">
        <div className="brand"><Seal /><span>Socratic<br />Escape Room</span></div>
        {stage > 0 && stage < 5 && <span className="stage-count">{stage} / 4</span>}
      </header>

      <div className="rule" />
      <Progress stage={stage} />

      {stage === 0 && (
        <section className="screen intro">
          <div className="kicker"><Gavel size={17} /> The inquiry is called</div>
          <h1>Can your team<br /><i>out-reason</i> the AI?</h1>
          <p className="lead">One scientific claim. Four tests. Your evidence must survive the chamber.</p>
          <div className="brief-grid">
            <div><Users size={20} /><strong>Work as one team</strong><span>Say your reasoning aloud.</span></div>
            <div><Clock3 size={20} /><strong>12 minutes</strong><span>Finish all four stages.</span></div>
          </div>
          <PrimaryButton onClick={() => setStage(1)}>Open the case</PrimaryButton>
        </section>
      )}

      {stage === 1 && (
        <StageShell number="01" eyebrow="Find the flaw" title="The Lunar Evidence">
          <div className="evidence">
            <span>Evidence submitted</span>
            <p>On the Moon, a 200 kg probe and a 2 kg probe are released from the same height. They hit the ground together.</p>
          </div>
          <blockquote>
            <Sparkles size={19} />
            <div><span>AI scientific adviser</span><p>“{INITIAL_COUNTER}”</p></div>
          </blockquote>
          <ResponseBox
            label="What exactly has the adviser got wrong?"
            value={answer}
            onChange={setAnswer}
            placeholder="The mistake is…"
            disabled={loading}
          />
          {guide ? <GuideCard guide={guide} onContinue={continueStage} /> : (
            <PrimaryButton disabled={answer.trim().length < 12 || loading} onClick={submitStage}>
              {loading ? "The Clerk is reading…" : "Challenge the claim"}
            </PrimaryButton>
          )}
        </StageShell>
      )}

      {stage === 2 && (
        <StageShell number="02" eyebrow="Build the case" title="Explain it to the bench">
          <p className="prompt">Agree on the correct chain of reasoning. Explain why the forces are different, yet the accelerations match.</p>
          <div className="equation" aria-label="Force equals mass times acceleration">
            <span>F</span><i>=</i><span>m</span><i>×</i><span>a</span>
          </div>
          <ResponseBox
            label="Write your team’s explanation"
            value={answer}
            onChange={setAnswer}
            placeholder="Gravity pulls harder on the heavier probe, but…"
            disabled={loading}
            roomy
          />
          {guide ? <GuideCard guide={guide} onContinue={continueStage} /> : (
            <PrimaryButton disabled={answer.trim().length < 24 || loading} onClick={submitStage}>
              {loading ? "Testing the reasoning…" : "Submit the reasoning"}
            </PrimaryButton>
          )}
        </StageShell>
      )}

      {stage === 3 && (
        <StageShell number="03" eyebrow="Hold your ground" title="The adviser objects">
          <blockquote className="counter">
            <Sparkles size={19} />
            <div><span>AI counterargument</span><p>“{counterargument || "If the heavier probe feels one hundred times more gravitational force, surely it must accelerate one hundred times faster. More force means more acceleration."}”</p></div>
          </blockquote>
          <p className="prompt compact">Answer the strongest part of the objection. Do not just repeat your earlier claim.</p>
          <ResponseBox
            label="Your rebuttal"
            value={answer}
            onChange={setAnswer}
            placeholder="That would only follow if…"
            disabled={loading}
            roomy
          />
          {guide ? <GuideCard guide={guide} onContinue={continueStage} /> : (
            <PrimaryButton disabled={answer.trim().length < 24 || loading} onClick={submitStage}>
              {loading ? "Weighing the rebuttal…" : "Answer the objection"}
            </PrimaryButton>
          )}
        </StageShell>
      )}

      {stage === 4 && (
        <StageShell number="04" eyebrow="Final reading" title="Defend it in the House">
          {!defenceStarted ? (
            <div className="defence-ready">
              <div className="timer-face"><span>45</span><small>seconds</small></div>
              <p>Choose one speaker. Address the Chair, state the error, give the physics, and answer the objection.</p>
              <PrimaryButton onClick={startDefence}><Mic size={18} /> Begin the defence</PrimaryButton>
            </div>
          ) : (
            <>
              <div className={`live-timer ${seconds <= 10 ? "urgent" : ""}`}>
                <span>{String(seconds).padStart(2, "0")}</span>
                <div><strong>{seconds === 0 ? "Time" : listening ? "Listening" : "Your floor"}</strong><small>{speechSupported ? "Speak clearly to the chamber" : "Speak aloud, then type key points"}</small></div>
              </div>
              <ResponseBox
                label={speechSupported ? "Live transcript" : "Defence notes"}
                value={answer}
                onChange={setAnswer}
                placeholder="Madam Deputy Speaker, the adviser’s mistake is…"
                disabled={loading}
                roomy
              />
              {guide ? <GuideCard guide={guide} onContinue={continueStage} final /> : (
                <PrimaryButton disabled={answer.trim().length < 30 || loading} onClick={submitStage}>
                  {loading ? "The House is deciding…" : "Conclude the case"}
                </PrimaryButton>
              )}
            </>
          )}
        </StageShell>
      )}

      {stage === 5 && (
        <section className="screen victory">
          <div className="victory-mark"><ShieldCheck size={44} /></div>
          <p className="kicker">The motion carries</p>
          <h1>Case<br /><i>unlocked.</i></h1>
          <p className="lead">You did more than find the right answer. You questioned, explained, resisted, and defended it together.</p>
          <div className="verdict">
            <span>Scientific verdict</span>
            <p>The heavier probe feels more gravitational force, but has proportionally more inertia. Both therefore accelerate at the same rate.</p>
          </div>
          <button className="secondary" onClick={reset}><RotateCcw size={17} /> Play again</button>
        </section>
      )}
    </main>
  );
}

function StageShell({ number, eyebrow, title, children }: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="screen stage-screen">
      <div className="stage-heading"><span>{number}</span><div><p>{eyebrow}</p><h1>{title}</h1></div></div>
      {children}
    </section>
  );
}

function ResponseBox({ label, value, onChange, placeholder, disabled, roomy = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  roomy?: boolean;
}) {
  return (
    <label className="response-box">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={roomy ? 5 : 4}
        maxLength={900}
      />
      <small>{value.length} / 900</small>
    </label>
  );
}

function GuideCard({ guide, onContinue, final = false }: {
  guide: GuideReply;
  onContinue: () => void;
  final?: boolean;
}) {
  return (
    <div className={`guide-card ${guide.passed ? "pass" : "retry"}`} role="status">
      <div className="guide-title">{guide.passed ? <Check size={17} /> : <Sparkles size={17} />}<strong>{guide.title}</strong></div>
      <p>{guide.message}</p>
      <button onClick={onContinue}>
        {guide.passed ? (final ? "See the verdict" : "Enter the next stage") : "Revise the answer"}
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
