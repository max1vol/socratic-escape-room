"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Gavel,
  LoaderCircle,
  Minus,
  Mic,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useDictation, type DictationState } from "../hooks/use-dictation";
import { useFeedback } from "../hooks/use-feedback";

type Level = "ks2" | "ks3";
type Subject = "science" | "maths" | "history" | "geography" | "computing" | "parliament";
type SubjectChoice = Subject | "mix";
type Round = "spot" | "explain" | "challenge" | "defend";
type Stage = 0 | 1 | 2 | 3 | 4 | 5;
type Mode = "solo" | "team";
type DefencePhase = "brief" | "speech" | "conclude";

type PublicQuestion = {
  id: string;
  level: Level;
  subject: Subject;
  round: Round;
  title: string;
  brief: string;
  prompt: string;
  aiClaim?: string;
  evidence?: string[];
  intervention?: string;
};

type GuideReply = {
  passed: boolean;
  title: string;
  message: string;
  missing: string[];
};

type RoundSave = {
  answer: string;
  guide: GuideReply | null;
};

type DictationControls = ReturnType<typeof useDictation>;

const ROUND_ORDER: Round[] = ["spot", "explain", "challenge", "defend"];
const ROUND_LABELS = ["Spot", "Explain", "Challenge", "Defend"];
const SEEN_KEY = "socratic-seen-v2";

const SUBJECTS: { id: SubjectChoice; label: string }[] = [
  { id: "mix", label: "Mix" },
  { id: "science", label: "Science" },
  { id: "maths", label: "Maths & logic" },
  { id: "history", label: "History" },
  { id: "geography", label: "Geography" },
  { id: "computing", label: "Computing" },
  { id: "parliament", label: "Parliament" },
];

const SUBJECT_LABEL: Record<Subject, string> = {
  science: "Science",
  maths: "Maths & logic",
  history: "History",
  geography: "Geography",
  computing: "Computing",
  parliament: "Parliament & society",
};

const ROUND_COPY: Record<Exclude<Round, "defend">, {
  eyebrow: string;
  title: string;
  placeholder: string;
  action: string;
  soloCue: string;
  teamCue: string;
}> = {
  spot: {
    eyebrow: "Round one · spot",
    title: "Find the flaw",
    placeholder: "The adviser has confused…",
    action: "Challenge the claim",
    soloCue: "Pinpoint one exact mistake, then show why it changes the conclusion.",
    teamCue: "Think alone for 20 seconds. Then agree on one exact mistake.",
  },
  explain: {
    eyebrow: "Round two · explain",
    title: "Build the reasoning",
    placeholder: "The reasoning works because…",
    action: "Test the explanation",
    soloCue: "Write the chain so another person could follow every step.",
    teamCue: "Take turns adding one link. Write the chain you all accept.",
  },
  challenge: {
    eyebrow: "Round three · challenge",
    title: "Answer the objection",
    placeholder: "That does not follow because…",
    action: "Face the adviser",
    soloCue: "Give the strongest answer, not every answer you can think of.",
    teamCue: "One person reads the objection. Everyone else builds the rebuttal.",
  },
};

function Seal() {
  return (
    <div className="seal" aria-hidden="true">
      <svg viewBox="0 0 64 64">
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
    <ol className="progress" aria-label={`Round ${stage} of 4`}>
      {ROUND_LABELS.map((label, index) => {
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

function chooseQuestions(bank: PublicQuestion[], level: Level, subject: SubjectChoice): PublicQuestion[] {
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as string[]; } catch { seen = []; }
  const seenSet = new Set(seen);
  const chosen: PublicQuestion[] = [];
  const usedSubjects = new Set<Subject>();

  for (const round of ROUND_ORDER) {
    const pool = bank.filter((question) => question.level === level && question.round === round && (subject === "mix" || question.subject === subject));
    const fresh = pool.filter((question) => !seenSet.has(question.id));
    const newSubject = fresh.filter((question) => !usedSubjects.has(question.subject));
    const candidates = newSubject.length ? newSubject : fresh.length ? fresh : pool.filter((question) => !usedSubjects.has(question.subject));
    const finalPool = candidates.length ? candidates : pool;
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
    if (pick) {
      chosen.push(pick);
      usedSubjects.add(pick.subject);
      seenSet.add(pick.id);
    }
  }

  localStorage.setItem(SEEN_KEY, JSON.stringify([...seenSet].slice(-160)));
  return chosen;
}

export default function Home() {
  const [bank, setBank] = useState<PublicQuestion[]>([]);
  const [bankError, setBankError] = useState(false);
  const [mode, setMode] = useState<Mode>("solo");
  const [level, setLevel] = useState<Level>("ks3");
  const [subject, setSubject] = useState<SubjectChoice>("mix");
  const [teamSize, setTeamSize] = useState(4);
  const [stage, setStage] = useState<Stage>(0);
  const [pausedStage, setPausedStage] = useState<Stage>(1);
  const [session, setSession] = useState<PublicQuestion[]>([]);
  const [roundSaves, setRoundSaves] = useState<Partial<Record<Round, RoundSave>>>({});
  const [answer, setAnswer] = useState("");
  const [guide, setGuide] = useState<GuideReply | null>(null);
  const [loading, setLoading] = useState(false);
  const [defencePhase, setDefencePhase] = useState<DefencePhase>("brief");
  const [seconds, setSeconds] = useState(45);
  const unlockedRef = useRef(false);
  const { soundEnabled, tap, toggleSound, unlock, verdict, warning } = useFeedback();
  const appendTranscript = useCallback((transcript: string) => {
    setAnswer((current) => {
      const existing = current.trimEnd();
      return `${existing}${existing ? " " : ""}${transcript}`.slice(0, 1_600);
    });
  }, []);
  const dictation = useDictation(appendTranscript);
  const stopDictation = dictation.stop;
  const dictationBusy = dictation.state === "requesting" || dictation.state === "recording" || dictation.state === "transcribing";

  useEffect(() => {
    fetch("/api/questions")
      .then(async (response) => {
        if (!response.ok) throw new Error("Question bank unavailable");
        return response.json() as Promise<PublicQuestion[]>;
      })
      .then(setBank)
      .catch(() => setBankError(true));
  }, []);

  const round = stage > 0 && stage < 5 ? ROUND_ORDER[stage - 1] : null;
  const question = useMemo(
    () => round ? session.find((item) => item.round === round) : undefined,
    [round, session],
  );

  useEffect(() => {
    if (stage !== 4 || defencePhase !== "speech" || seconds <= 0) return;
    const timer = window.setTimeout(() => {
      const next = Math.max(0, seconds - 1);
      setSeconds(next);
      if (next === 10) warning();
      if (next === 0) {
        stopDictation();
        setDefencePhase("conclude");
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [defencePhase, seconds, stage, stopDictation, warning]);

  useEffect(() => {
    if (stage !== 5 || unlockedRef.current) return;
    unlockedRef.current = true;
    unlock();
  }, [stage, unlock]);

  const saveCurrentRound = useCallback(() => {
    if (!round) return;
    setRoundSaves((current) => ({ ...current, [round]: { answer, guide } }));
  }, [answer, guide, round]);

  const restoreRound = useCallback((targetStage: Stage) => {
    if (targetStage < 1 || targetStage > 4) return;
    const saved = roundSaves[ROUND_ORDER[targetStage - 1]];
    setAnswer(saved?.answer ?? "");
    setGuide(saved?.guide ?? null);
    setDefencePhase("brief");
    setSeconds(45);
  }, [roundSaves]);

  const askGuide = useCallback(async (questionId: string, response: string, currentRound: Round) => {
    setLoading(true);
    setGuide(null);
    try {
      const request = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, response }),
      });
      const data = (await request.json()) as GuideReply & { error?: string };
      if (!request.ok) throw new Error(data.error || "The guide is unavailable.");
      setGuide(data);
      setRoundSaves((current) => ({ ...current, [currentRound]: { answer: response, guide: data } }));
      verdict(data.passed);
    } catch (error) {
      const offline = {
        passed: false,
        title: "The Clerk is offline",
        message: error instanceof Error ? error.message : "Check the connection and try again.",
        missing: [],
      };
      setGuide(offline);
      setRoundSaves((current) => ({ ...current, [currentRound]: { answer: response, guide: offline } }));
      verdict(false);
    } finally {
      setLoading(false);
    }
  }, [verdict]);

  function openRoom() {
    if (session.length === 4) {
      setStage(pausedStage);
      restoreRound(pausedStage);
      return;
    }

    const selected = chooseQuestions(bank, level, subject);
    if (selected.length !== 4) {
      setBankError(true);
      return;
    }
    setSession(selected);
    setRoundSaves({});
    setAnswer("");
    setGuide(null);
    setStage(1);
    setPausedStage(1);
    unlockedRef.current = false;
  }

  function nextRound() {
    if (!guide?.passed) {
      setGuide(null);
      return;
    }
    saveCurrentRound();
    if (stage === 4) {
      dictation.cancel();
      setStage(5);
      return;
    }
    if (stage < 1 || stage > 3) return;
    const target = (stage + 1) as Stage;
    setStage(target);
    restoreRound(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    dictation.cancel();
    if (stage === 4 && defencePhase !== "brief") {
      saveCurrentRound();
      setDefencePhase("brief");
      setSeconds(45);
      return;
    }
    saveCurrentRound();
    if (stage === 1) {
      setPausedStage(1);
      setStage(0);
      return;
    }
    if (stage > 1 && stage < 5) {
      const target = (stage - 1) as Stage;
      setStage(target);
      restoreRound(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function startFresh() {
    dictation.cancel();
    setSession([]);
    setRoundSaves({});
    setAnswer("");
    setGuide(null);
    setDefencePhase("brief");
    setSeconds(45);
    unlockedRef.current = false;
  }

  function reset() {
    setStage(0);
    startFresh();
  }

  function beginDefence() {
    dictation.cancel();
    setSeconds(45);
    setGuide(null);
    setDefencePhase("speech");
  }

  function finishDefence() {
    dictation.stop();
    setDefencePhase("conclude");
  }

  function submitCurrent() {
    if (!question || !round || answer.trim().length < 12 || dictationBusy) return;
    void askGuide(question.id, answer.trim(), round);
  }

  function handleButtonFeedback(event: React.MouseEvent<HTMLElement>) {
    if (event.target instanceof Element && event.target.closest("button:not(:disabled)")) tap();
  }

  const isPaused = stage === 0 && session.length === 4;
  const playerLabel = mode === "solo" ? "Solo" : `${teamSize}`;

  return (
    <main onClickCapture={handleButtonFeedback}>
      <header className="masthead">
        <div className="mast-left">
          {stage > 0 && stage < 5 && (
            <button className="icon-button back-button" aria-label="Go back" onClick={goBack}><ArrowLeft size={20} /></button>
          )}
          <div className="brand"><Seal /><span>Socratic<br />Escape Room</span></div>
        </div>
        <div className="header-actions">
          {stage > 0 && stage < 5 && (
            <span className="team-mark">
              {mode === "solo" ? <UserRound size={15} /> : <Users size={15} />}{playerLabel}
            </span>
          )}
          <button
            className="icon-button sound-button"
            aria-label={soundEnabled ? "Mute sounds" : "Turn sounds on"}
            aria-pressed={!soundEnabled}
            onClick={toggleSound}
          >
            {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </header>
      <div className="rule" />
      <Progress stage={stage} />

      {stage === 0 && isPaused && (
        <section className="screen intro paused">
          <div className="kicker"><Gavel size={17} /> The chamber is waiting</div>
          <h1>Room<br /><i>paused.</i></h1>
          <p className="lead">Your question and answer are exactly where you left them.</p>
          <div className="paused-card">
            <span>{level.toUpperCase()}</span>
            <strong>{subject === "mix" ? "Mixed subjects" : SUBJECT_LABEL[subject]}</strong>
            <small>{mode === "solo" ? "Solo session" : `${teamSize}-player team`}</small>
          </div>
          <PrimaryButton onClick={openRoom}>Resume round one</PrimaryButton>
          <button className="secondary" onClick={startFresh}><RotateCcw size={17} /> Start a new room</button>
        </section>
      )}

      {stage === 0 && !isPaused && (
        <section className="screen intro">
          <div className="kicker"><Gavel size={17} /> The inquiry is called</div>
          <h1>Can you<br /><i>out-reason</i> AI?</h1>
          <p className="lead">Four questions. Four ways to think. Play alone or share one device.</p>

          <div className="setup-card">
            <div className="segmented" aria-label="Players">
              <button className={mode === "solo" ? "selected" : ""} onClick={() => setMode("solo")}><UserRound size={16} /> Just me</button>
              <button className={mode === "team" ? "selected" : ""} onClick={() => setMode("team")}><Users size={16} /> Team</button>
            </div>
            <div className="segmented compact" aria-label="Difficulty level">
              <button className={level === "ks2" ? "selected" : ""} onClick={() => setLevel("ks2")}>KS2</button>
              <button className={level === "ks3" ? "selected" : ""} onClick={() => setLevel("ks3")}>KS3</button>
            </div>
            <div className="subject-grid" aria-label="Subject">
              {SUBJECTS.map((item) => (
                <button key={item.id} className={subject === item.id ? "selected" : ""} onClick={() => setSubject(item.id)}>{item.label}</button>
              ))}
            </div>
            {mode === "team" && (
              <div className="team-picker">
                <div><Users size={19} /><span><strong>{teamSize} players</strong><small>sharing this device</small></span></div>
                <div>
                  <button aria-label="Remove a player" disabled={teamSize === 2} onClick={() => setTeamSize((size) => Math.max(2, size - 1))}><Minus size={17} /></button>
                  <button aria-label="Add a player" disabled={teamSize === 6} onClick={() => setTeamSize((size) => Math.min(6, size + 1))}><Plus size={17} /></button>
                </div>
              </div>
            )}
          </div>

          {bankError && <p className="inline-error">The cases could not be loaded. Refresh and try again.</p>}
          <PrimaryButton disabled={!bank.length || bankError} onClick={openRoom}>
            {!bank.length && !bankError ? "Preparing the chamber…" : "Enter the room"}
          </PrimaryButton>
        </section>
      )}

      {stage > 0 && stage < 4 && question && round && round !== "defend" && (
        <StageShell eyebrow={ROUND_COPY[round].eyebrow} title={ROUND_COPY[round].title} subject={question.subject}>
          <QuestionCard question={question} hideAdviser={round === "explain"} />
          <div className="mode-cue">
            {mode === "solo" ? <UserRound size={18} /> : <Users size={18} />}
            <p>{mode === "solo" ? ROUND_COPY[round].soloCue : ROUND_COPY[round].teamCue}</p>
          </div>
          <AnswerPanel
            prompt={question.prompt}
            placeholder={ROUND_COPY[round].placeholder}
            label={mode === "solo" ? "Your answer" : "Shared answer"}
            answer={answer}
            setAnswer={setAnswer}
            guide={guide}
            loading={loading}
            submit={submitCurrent}
            next={nextRound}
            action={ROUND_COPY[round].action}
            roomy={round !== "spot"}
            dictation={dictation}
          />
        </StageShell>
      )}

      {stage === 4 && question && (
        <StageShell eyebrow="Round four · defend" title="Make the case" subject={question.subject}>
          {defencePhase === "brief" && (
            <>
              <QuestionCard question={question} hideAdviser />
              <p className="prompt">{question.prompt}</p>
              {question.intervention && (
                <blockquote className="counter">
                  <Gavel size={19} />
                  <div><span>Opposition asks</span><p>“{question.intervention}”</p></div>
                </blockquote>
              )}
              <div className="mode-cue">
                {mode === "solo" ? <UserRound size={18} /> : <Users size={18} />}
                <p>{mode === "solo" ? "Address the Chair. Make one claim, use the best evidence, and finish clearly." : "Choose one speaker. The others may pass one short note during the speech."}</p>
              </div>
              <PrimaryButton onClick={beginDefence}><Mic size={18} /> Begin 45-second defence</PrimaryButton>
            </>
          )}
          {defencePhase === "speech" && (
            <>
              <Timer seconds={seconds} dictationState={dictation.state} />
              <ResponseBox
                label="Your defence"
                value={answer}
                onChange={setAnswer}
                placeholder="Madam Deputy Speaker, my case is…"
                roomy
                dictation={dictation}
              />
              <PrimaryButton disabled={answer.trim().length < 20 && dictation.state !== "recording"} onClick={finishDefence}>Finish the defence</PrimaryButton>
            </>
          )}
          {defencePhase === "conclude" && (
            <>
              <div className="time-called"><Gavel size={28} /><span>Order</span></div>
              <ResponseBox
                label="Your defence"
                value={answer}
                onChange={setAnswer}
                placeholder="My case is…"
                roomy
                disabled={loading || Boolean(guide)}
                dictation={dictation}
              />
              {guide ? <GuideCard guide={guide} onContinue={nextRound} final /> : (
                <PrimaryButton disabled={answer.trim().length < 20 || loading || dictationBusy} onClick={submitCurrent}>
                  {loading ? "The House is deciding…" : "Put it to the House"}
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
          <h1>Room<br /><i>unlocked.</i></h1>
          <p className="lead">Four different cases survived four different tests{mode === "team" ? "—with everyone contributing." : "."}</p>
          <div className="case-list">
            {session.map((item, index) => (
              <div key={item.id}><span><Check size={14} /></span><p><strong>{ROUND_LABELS[index]}</strong>{item.title}</p></div>
            ))}
          </div>
          <button className="secondary" onClick={reset}><RotateCcw size={17} /> Open another room</button>
        </section>
      )}
    </main>
  );
}

function StageShell({ eyebrow, title, subject, children }: {
  eyebrow: string;
  title: string;
  subject: Subject;
  children: React.ReactNode;
}) {
  return (
    <section className="screen stage-screen">
      <div className="stage-heading">
        <div><p>{eyebrow}</p><em>{SUBJECT_LABEL[subject]}</em></div>
        <h1>{title}</h1><span />
      </div>
      {children}
    </section>
  );
}

function QuestionCard({ question, hideAdviser = false }: { question: PublicQuestion; hideAdviser?: boolean }) {
  return (
    <>
      <div className="evidence">
        <span>{question.title}</span>
        <p>{question.brief}</p>
        {question.evidence && <ul>{question.evidence.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
      </div>
      {!hideAdviser && question.aiClaim && (
        <blockquote>
          <Sparkles size={19} />
          <div><span>AI adviser</span><p>“{question.aiClaim}”</p></div>
        </blockquote>
      )}
    </>
  );
}

function AnswerPanel({ prompt, placeholder, label, answer, setAnswer, guide, loading, submit, next, action, dictation, roomy = false }: {
  prompt: string;
  placeholder: string;
  label: string;
  answer: string;
  setAnswer: (value: string) => void;
  guide: GuideReply | null;
  loading: boolean;
  submit: () => void;
  next: () => void;
  action: string;
  dictation: DictationControls;
  roomy?: boolean;
}) {
  const dictationBusy = dictation.state === "requesting" || dictation.state === "recording" || dictation.state === "transcribing";
  return (
    <>
      <p className="prompt">{prompt}</p>
      <ResponseBox label={label} value={answer} onChange={setAnswer} placeholder={placeholder} roomy={roomy} disabled={loading || Boolean(guide)} dictation={dictation} />
      {guide ? <GuideCard guide={guide} onContinue={next} /> : (
        <PrimaryButton disabled={answer.trim().length < 12 || loading || dictationBusy} onClick={submit}>
          {loading ? "The Clerk is reading…" : action}
        </PrimaryButton>
      )}
    </>
  );
}

function ResponseBox({ label, value, onChange, placeholder, dictation, disabled = false, roomy = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dictation: DictationControls;
  disabled?: boolean;
  roomy?: boolean;
}) {
  const inputId = useId();
  const statusId = `${inputId}-dictation`;
  const recording = dictation.state === "recording";
  const waiting = dictation.state === "requesting" || dictation.state === "transcribing";
  const status = dictation.state === "requesting"
    ? "Opening microphone…"
    : recording
      ? "Listening… tap the mic when finished"
      : dictation.state === "transcribing"
        ? "Adding your words…"
        : dictation.state === "error"
          ? dictation.error
          : "";
  const micLabel = recording ? "Stop and transcribe" : dictation.state === "transcribing" ? "Transcribing answer" : "Dictate answer";

  return (
    <div className={`response-box ${roomy ? "roomy" : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className="textarea-shell">
        <textarea id={inputId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} maxLength={1600} aria-describedby={statusId} />
        {dictation.supported && (
          <button
            className={`dictation-button ${recording ? "recording" : ""}`}
            type="button"
            aria-label={micLabel}
            aria-pressed={recording}
            title={micLabel}
            disabled={disabled || waiting}
            onClick={dictation.toggle}
          >
            {waiting ? <LoaderCircle className="spin" size={20} /> : recording ? <Square size={17} fill="currentColor" /> : <Mic size={21} />}
          </button>
        )}
      </div>
      <div className="response-meta" id={statusId} aria-live="polite">
        <span className={dictation.state === "error" ? "error" : ""}>{status}</span>
        <small>{value.length}/1600</small>
      </div>
    </div>
  );
}

function GuideCard({ guide, onContinue, final = false }: { guide: GuideReply; onContinue: () => void; final?: boolean }) {
  return (
    <div className={`guide-card ${guide.passed ? "pass" : "retry"}`} aria-live="polite">
      <div className="guide-title">{guide.passed ? <Check size={19} /> : <Sparkles size={19} />}<strong>{guide.title}</strong></div>
      <p>{guide.message}</p>
      <button onClick={onContinue}><span>{guide.passed ? final ? "Unlock the room" : "Next round" : "Revise the answer"}</span><ChevronRight size={18} /></button>
    </div>
  );
}

function Timer({ seconds, dictationState }: { seconds: number; dictationState: DictationState }) {
  return (
    <div className={`live-timer ${seconds <= 10 ? "urgent" : ""}`}>
      <span>{String(seconds).padStart(2, "0")}</span>
      <div>
        <strong>{dictationState === "recording" ? "Listening" : dictationState === "transcribing" ? "Transcribing" : "The floor is yours"}</strong>
        <small>Tap the mic to dictate</small>
      </div>
      <Clock3 size={18} />
    </div>
  );
}
