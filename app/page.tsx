"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Gavel,
  Minus,
  Mic,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

type Level = "ks2" | "ks3";
type Subject = "science" | "maths" | "history" | "geography" | "computing" | "parliament";
type SubjectChoice = Subject | "mix";
type Round = "spot" | "explain" | "challenge" | "defend";
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

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

type Vote = "sound" | "flawed" | "unsure";
type SpotPhase = "handoff" | "vote" | "discuss" | "answer";
type ExplainPhase = "brief" | "relay" | "answer";
type ChallengePhase = "reader" | "huddle" | "answer";
type DefencePhase = "roles" | "prepare" | "speech" | "intervention" | "conclude";

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  resultIndex: number;
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

const ROUND_ORDER: Round[] = ["spot", "explain", "challenge", "defend"];
const ROUND_LABELS = ["Spot", "Explain", "Challenge", "Defend"];
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
const RELAY_ROLES = [
  "State what the question is really asking.",
  "Give the first logical step.",
  "Add the next link in the chain.",
  "Try to break the reasoning.",
  "Check the numbers, evidence or units.",
  "Summarise the explanation in one sentence.",
];
const DEFENCE_ROLES = ["Claim", "Evidence", "Opposition", "Speaker", "Fact-check", "Closer"];
const SEEN_KEY = "socratic-seen-v2";

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
    const pool = bank.filter((q) => q.level === level && q.round === round && (subject === "mix" || q.subject === subject));
    const fresh = pool.filter((q) => !seenSet.has(q.id));
    const notYetFeatured = fresh.filter((q) => !usedSubjects.has(q.subject));
    const candidates = notYetFeatured.length ? notYetFeatured : fresh.length ? fresh : pool.filter((q) => !usedSubjects.has(q.subject));
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
  const [level, setLevel] = useState<Level>("ks3");
  const [subject, setSubject] = useState<SubjectChoice>("mix");
  const [teamSize, setTeamSize] = useState(4);
  const [stage, setStage] = useState<Stage>(0);
  const [session, setSession] = useState<PublicQuestion[]>([]);
  const [answer, setAnswer] = useState("");
  const [guide, setGuide] = useState<GuideReply | null>(null);
  const [loading, setLoading] = useState(false);

  const [spotPhase, setSpotPhase] = useState<SpotPhase>("handoff");
  const [playerIndex, setPlayerIndex] = useState(0);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [explainPhase, setExplainPhase] = useState<ExplainPhase>("brief");
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>("reader");
  const [defencePhase, setDefencePhase] = useState<DefencePhase>("roles");
  const [seconds, setSeconds] = useState(45);
  const [interventionAnswer, setInterventionAnswer] = useState("");
  const [interrupted, setInterrupted] = useState(false);
  const [speechSupported] = useState(() => typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef("");

  useEffect(() => {
    fetch("/api/questions")
      .then(async (response) => {
        if (!response.ok) throw new Error("Question bank unavailable");
        return response.json() as Promise<PublicQuestion[]>;
      })
      .then(setBank)
      .catch(() => setBankError(true));
  }, []);

  const question = useMemo(() => {
    const round = stage > 0 && stage < 5 ? ROUND_ORDER[stage - 1] : null;
    return round ? session.find((item) => item.round === round) : undefined;
  }, [session, stage]);

  const stopRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startRecognition = useCallback(() => {
    if (!speechSupported) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";
    speechBaseRef.current = answer ? `${answer.trim()} ` : "";
    recognition.onresult = (event) => {
      let finalText = speechBaseRef.current;
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interimText += result[0].transcript;
      }
      speechBaseRef.current = finalText;
      setAnswer(`${finalText}${interimText}`.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [answer, speechSupported]);

  useEffect(() => {
    if (stage !== 4 || defencePhase !== "speech" || seconds <= 0) return;
    const timer = window.setTimeout(() => {
      const next = Math.max(0, seconds - 1);
      setSeconds(next);
      if (next === 22 && !interrupted) {
        stopRecognition();
        setDefencePhase("intervention");
      } else if (next === 0) {
        stopRecognition();
        setDefencePhase("conclude");
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [defencePhase, interrupted, seconds, stage, stopRecognition]);

  const askGuide = useCallback(async (questionId: string, response: string) => {
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
    } catch (error) {
      setGuide({
        passed: false,
        title: "The Clerk is offline",
        message: error instanceof Error ? error.message : "Check the connection and try again.",
        missing: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function openRoom() {
    const selected = chooseQuestions(bank, level, subject);
    if (selected.length !== 4) {
      setBankError(true);
      return;
    }
    setSession(selected);
    setStage(1);
    setSpotPhase("handoff");
    setPlayerIndex(0);
    setVotes([]);
  }

  function recordVote(vote: Vote) {
    const nextVotes = [...votes, vote];
    setVotes(nextVotes);
    if (playerIndex + 1 >= teamSize) {
      setSpotPhase("discuss");
    } else {
      setPlayerIndex((index) => index + 1);
      setSpotPhase("handoff");
    }
  }

  function nextRound() {
    if (!guide?.passed) {
      setGuide(null);
      return;
    }
    setGuide(null);
    setAnswer("");
    setPlayerIndex(0);
    if (stage === 1) {
      setStage(2);
      setExplainPhase("brief");
    } else if (stage === 2) {
      setStage(3);
      setChallengePhase("reader");
    } else if (stage === 3) {
      setStage(4);
      setDefencePhase("roles");
    } else if (stage === 4) {
      setStage(5);
    }
  }

  function reset() {
    stopRecognition();
    setStage(0);
    setSession([]);
    setAnswer("");
    setGuide(null);
    setVotes([]);
    setPlayerIndex(0);
    setSeconds(45);
    setInterrupted(false);
    setInterventionAnswer("");
  }

  function beginDefence() {
    setSeconds(45);
    setInterrupted(false);
    setAnswer("");
    setDefencePhase("speech");
    window.setTimeout(startRecognition, 120);
  }

  function resumeDefence() {
    setInterrupted(true);
    setDefencePhase("speech");
    window.setTimeout(startRecognition, 120);
  }

  function submitCurrent() {
    if (!question || answer.trim().length < 12) return;
    const response = stage === 4
      ? `Defence: ${answer.trim()}\nResponse to intervention: ${interventionAnswer.trim()}`
      : answer.trim();
    void askGuide(question.id, response);
  }

  return (
    <main>
      <header className="masthead">
        <div className="brand"><Seal /><span>Socratic<br />Escape Room</span></div>
        {stage > 0 && stage < 5 && <span className="team-mark"><Users size={15} /> {teamSize}</span>}
      </header>
      <div className="rule" />
      <Progress stage={stage} />

      {stage === 0 && (
        <section className="screen intro">
          <div className="kicker"><Gavel size={17} /> The inquiry is called</div>
          <h1>Can your team<br /><i>out-reason</i> the AI?</h1>
          <p className="lead">Four questions. Four different tests. One shared device.</p>

          <div className="setup-card">
            <div className="segmented" aria-label="Difficulty level">
              <button className={level === "ks2" ? "selected" : ""} onClick={() => setLevel("ks2")}>KS2</button>
              <button className={level === "ks3" ? "selected" : ""} onClick={() => setLevel("ks3")}>KS3</button>
            </div>
            <div className="subject-grid" aria-label="Subject">
              {SUBJECTS.map((item) => (
                <button key={item.id} className={subject === item.id ? "selected" : ""} onClick={() => setSubject(item.id)}>{item.label}</button>
              ))}
            </div>
            <div className="team-picker">
              <div><Users size={19} /><span><strong>{teamSize} players</strong><small>around this device</small></span></div>
              <div>
                <button aria-label="Remove a player" disabled={teamSize === 2} onClick={() => setTeamSize((size) => Math.max(2, size - 1))}><Minus size={17} /></button>
                <button aria-label="Add a player" disabled={teamSize === 6} onClick={() => setTeamSize((size) => Math.min(6, size + 1))}><Plus size={17} /></button>
              </div>
            </div>
          </div>

          {bankError && <p className="inline-error">The cases could not be loaded. Refresh and try again.</p>}
          <PrimaryButton disabled={!bank.length || bankError} onClick={openRoom}>
            {!bank.length && !bankError ? "Preparing the chamber…" : "Seat the team"}
          </PrimaryButton>
        </section>
      )}

      {stage === 1 && question && (
        <StageShell eyebrow="Round one · private judgement" title="Spot the flaw" subject={question.subject}>
          {spotPhase === "handoff" && (
            <Handoff number={playerIndex + 1} text="Take the device. Everyone else, look away." action="I have the device" onClick={() => setSpotPhase("vote")} />
          )}
          {spotPhase === "vote" && (
            <>
              <QuestionCard question={question} />
              <p className="prompt">Before the team talks: how sound is the adviser&apos;s reasoning?</p>
              <div className="vote-actions">
                <button onClick={() => recordVote("sound")}>Sound</button>
                <button onClick={() => recordVote("flawed")}>Flawed</button>
                <button onClick={() => recordVote("unsure")}>Not sure</button>
              </div>
            </>
          )}
          {spotPhase === "discuss" && (
            <>
              <QuestionCard question={question} />
              <div className="vote-tally" aria-label="Private vote results">
                <span><strong>{votes.filter((v) => v === "sound").length}</strong> sound</span>
                <span><strong>{votes.filter((v) => v === "flawed").length}</strong> flawed</span>
                <span><strong>{votes.filter((v) => v === "unsure").length}</strong> unsure</span>
              </div>
              <p className="prompt">Compare reasons—not just votes. Agree on the exact mistake.</p>
              <PrimaryButton onClick={() => setSpotPhase("answer")}>We have a challenge</PrimaryButton>
            </>
          )}
          {spotPhase === "answer" && (
            <AnswerPanel
              prompt={question.prompt}
              placeholder="The adviser has confused…"
              answer={answer}
              setAnswer={setAnswer}
              guide={guide}
              loading={loading}
              submit={submitCurrent}
              next={nextRound}
              action="Challenge the claim"
            />
          )}
        </StageShell>
      )}

      {stage === 2 && question && (
        <StageShell eyebrow="Round two · reasoning relay" title="Explain it together" subject={question.subject}>
          {explainPhase === "brief" && (
            <>
              <QuestionCard question={question} hideAdviser />
              <p className="prompt">Each player must add one link. No one gives the whole solution.</p>
              <PrimaryButton onClick={() => { setPlayerIndex(0); setExplainPhase("relay"); }}>Begin the relay</PrimaryButton>
            </>
          )}
          {explainPhase === "relay" && (
            <>
              <QuestionCard question={question} hideAdviser />
              <div className="role-card">
                <span>Player {playerIndex + 1}</span>
                <p>{RELAY_ROLES[playerIndex % RELAY_ROLES.length]}</p>
                <small>Say it aloud. The next player may question it.</small>
              </div>
              <PrimaryButton onClick={() => {
                if (playerIndex + 1 >= teamSize) setExplainPhase("answer");
                else setPlayerIndex((index) => index + 1);
              }}>{playerIndex + 1 >= teamSize ? "Write the team's chain" : "Pass to the next player"}</PrimaryButton>
            </>
          )}
          {explainPhase === "answer" && (
            <AnswerPanel
              prompt={question.prompt}
              placeholder="Our reasoning is…"
              answer={answer}
              setAnswer={setAnswer}
              guide={guide}
              loading={loading}
              submit={submitCurrent}
              next={nextRound}
              action="Test the explanation"
              roomy
            />
          )}
        </StageShell>
      )}

      {stage === 3 && question && (
        <StageShell eyebrow="Round three · pressure test" title="Face the objection" subject={question.subject}>
          {challengePhase === "reader" && (
            <>
              <Handoff number={(stage + 1) % teamSize + 1} text="You are the AI adviser. Read the objection with conviction." />
              <QuestionCard question={question} />
              <PrimaryButton onClick={() => setChallengePhase("huddle")}>Objection delivered</PrimaryButton>
            </>
          )}
          {challengePhase === "huddle" && (
            <>
              <div className="huddle-mark"><Users size={36} /></div>
              <p className="prompt centre">The adviser keeps the device. Everyone else has 40 seconds to build the rebuttal aloud.</p>
              <PrimaryButton onClick={() => setChallengePhase("answer")}>We can answer it</PrimaryButton>
            </>
          )}
          {challengePhase === "answer" && (
            <AnswerPanel
              prompt={question.prompt}
              placeholder="That does not follow because…"
              answer={answer}
              setAnswer={setAnswer}
              guide={guide}
              loading={loading}
              submit={submitCurrent}
              next={nextRound}
              action="Answer the objection"
              roomy
            />
          )}
        </StageShell>
      )}

      {stage === 4 && question && (
        <StageShell eyebrow="Round four · final reading" title="Defend it in the House" subject={question.subject}>
          {defencePhase === "roles" && (
            <>
              <QuestionCard question={question} hideAdviser />
              <div className="role-grid">
                {Array.from({ length: teamSize }, (_, index) => (
                  <div key={index}><span>{index + 1}</span><strong>{DEFENCE_ROLES[index]}</strong></div>
                ))}
              </div>
              <PrimaryButton onClick={() => setDefencePhase("prepare")}>Prepare the case</PrimaryButton>
            </>
          )}
          {defencePhase === "prepare" && (
            <>
              <QuestionCard question={question} hideAdviser />
              <p className="prompt">Build one claim, choose the best evidence, and predict the opposition. Player {Math.min(4, teamSize)} will speak.</p>
              <PrimaryButton onClick={beginDefence}><Mic size={18} /> Begin 45-second defence</PrimaryButton>
            </>
          )}
          {defencePhase === "speech" && (
            <>
              <Timer seconds={seconds} listening={listening} speechSupported={speechSupported} />
              <ResponseBox
                label={speechSupported ? "Live transcript" : "Defence notes"}
                value={answer}
                onChange={setAnswer}
                placeholder="Madam Deputy Speaker, our case is…"
                roomy
              />
              <p className="quiet">The Clerk will interrupt once. Keep speaking until then.</p>
            </>
          )}
          {defencePhase === "intervention" && (
            <>
              <blockquote className="counter">
                <Sparkles size={19} />
                <div><span>AI intervention</span><p>“{question.intervention}”</p></div>
              </blockquote>
              <div className="role-card">
                <span>Player {(Math.min(4, teamSize) % teamSize) + 1}</span>
                <p>Answer in one sentence. The speaker may not help.</p>
              </div>
              <ResponseBox label="Your answer" value={interventionAnswer} onChange={setInterventionAnswer} placeholder="That concern matters, but…" />
              <PrimaryButton disabled={interventionAnswer.trim().length < 8} onClick={resumeDefence}>Answer and resume</PrimaryButton>
            </>
          )}
          {defencePhase === "conclude" && (
            <>
              <div className="time-called"><Gavel size={28} /><span>Time</span></div>
              <ResponseBox
                label={speechSupported ? "Your recorded defence" : "Write the case you delivered"}
                value={answer}
                onChange={setAnswer}
                placeholder="Our case is…"
                roomy
              />
              <div className="intervention-recap"><span>Intervention answered</span><p>{interventionAnswer}</p></div>
              {guide ? <GuideCard guide={guide} onContinue={nextRound} final /> : (
                <PrimaryButton disabled={answer.trim().length < 20 || loading} onClick={submitCurrent}>
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
          <h1>Room<br /><i>unlocked.</i></h1>
          <p className="lead">Four different cases survived four different tests—because every player had a job.</p>
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

function Handoff({ number, text, action, onClick }: {
  number: number;
  text: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`handoff ${action ? "" : "compact"}`}>
      <div className="player-number">{number}</div>
      <h2>Player {number}</h2>
      <p>{text}</p>
      {action && onClick && <PrimaryButton onClick={onClick}>{action}</PrimaryButton>}
    </div>
  );
}

function AnswerPanel({ prompt, placeholder, answer, setAnswer, guide, loading, submit, next, action, roomy = false }: {
  prompt: string;
  placeholder: string;
  answer: string;
  setAnswer: (value: string) => void;
  guide: GuideReply | null;
  loading: boolean;
  submit: () => void;
  next: () => void;
  action: string;
  roomy?: boolean;
}) {
  return (
    <>
      <p className="prompt">{prompt}</p>
      <ResponseBox label="Team answer" value={answer} onChange={setAnswer} placeholder={placeholder} roomy={roomy} disabled={loading} />
      {guide ? <GuideCard guide={guide} onContinue={next} /> : (
        <PrimaryButton disabled={answer.trim().length < 12 || loading} onClick={submit}>
          {loading ? "The Clerk is reading…" : action}
        </PrimaryButton>
      )}
    </>
  );
}

function ResponseBox({ label, value, onChange, placeholder, disabled = false, roomy = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  roomy?: boolean;
}) {
  return (
    <label className={`response-box ${roomy ? "roomy" : ""}`}>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} maxLength={1600} />
      <small>{value.length}/1600</small>
    </label>
  );
}

function GuideCard({ guide, onContinue, final = false }: { guide: GuideReply; onContinue: () => void; final?: boolean }) {
  return (
    <div className={`guide-card ${guide.passed ? "pass" : "retry"}`} aria-live="polite">
      <div className="guide-title">{guide.passed ? <Check size={19} /> : <Sparkles size={19} />}<strong>{guide.title}</strong></div>
      <p>{guide.message}</p>
      <button onClick={onContinue}><span>{guide.passed ? final ? "Unlock the room" : "Enter the next round" : "Revise the answer"}</span><ChevronRight size={18} /></button>
    </div>
  );
}

function Timer({ seconds, listening, speechSupported }: { seconds: number; listening: boolean; speechSupported: boolean }) {
  return (
    <div className={`live-timer ${seconds <= 10 ? "urgent" : ""}`}>
      <span>{String(seconds).padStart(2, "0")}</span>
      <div><strong>{listening ? "Listening" : "The floor is yours"}</strong><small>{speechSupported ? "Address the Chair" : "Speak aloud and note the key points"}</small></div>
      <Clock3 size={18} />
    </div>
  );
}
