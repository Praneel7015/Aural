"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const SCAM_PLAYBOOKS = [
  {
    id: "grandparent",
    title: "Grandparent Scam",
    description: "Caller impersonates a grandchild or family member in distress, claiming arrest or accident, demanding immediate money transfer.",
    signs: [
      "Claims to be a family member in trouble",
      "Urgently needs money (bail, hospital, legal fees)",
      "Asks you not to tell other family members",
      "Pressures you to act immediately",
      "Asks for wire transfer, gift cards, or crypto",
    ],
    defense: "Hang up and call the family member directly on their known number. Use a safe word that only real family would know.",
    example: '"Mom, it\'s me, I\'ve been arrested. I need $5,000 for bail right now. Please don\'t tell dad."',
  },
  {
    id: "irs",
    title: "IRS / Tax Authority Scam",
    description: "Automated or live calls claiming unpaid taxes with threats of arrest, deportation, or legal action.",
    signs: [
      "Claims to be from IRS, CRA, HMRC, or tax authority",
      "Threatens arrest or deportation",
      "Demands payment via gift cards or wire transfer",
      "Says you must pay immediately or face consequences",
      "Caller ID may be spoofed to look official",
    ],
    defense: "Tax agencies never call demanding immediate payment or threaten arrest. Hang up and contact the agency directly through their official website.",
    example: '"This is the IRS. You owe $12,000 in back taxes. Officers will arrest you within 2 hours unless you pay now."',
  },
  {
    id: "bank",
    title: "Bank Fraud Scam",
    description: 'Caller pretends to be from your bank\'s fraud department, claiming your account is compromised and asking you to "move money to safety."',
    signs: [
      "Claims suspicious activity on your account",
      'Asks you to transfer money to a "safe account"',
      "Requests your PIN, password, or OTP",
      "Creates urgency around account security",
      "May know some of your real account details",
    ],
    defense: "Banks never ask you to move money to another account. Hang up and call the number on the back of your bank card.",
    example: '"This is your bank\'s fraud department. Your account has been compromised. We need you to transfer your funds to this secure account immediately."',
  },
  {
    id: "tech",
    title: "Tech Support Scam",
    description: "Caller claims your computer has a virus or security breach, requests remote access or payment for fake fixes.",
    signs: [
      "Claims to be from Microsoft, Apple, or your ISP",
      "Says they detected a virus or security breach",
      "Asks for remote access to your computer",
      "Requests payment for unnecessary repairs",
      "Uses technical jargon to confuse you",
    ],
    defense: "Microsoft and Apple never make unsolicited calls. Never give remote access to unsolicited callers.",
    example: '"We\'ve detected a critical virus on your Windows computer. I need remote access right now to fix it before your files are encrypted."',
  },
  {
    id: "romance",
    title: "Romance / Emotional Scam",
    description: "Scammer builds emotional relationship over time, then asks for money citing emergencies, travel, or investment opportunities.",
    signs: [
      "Online relationship that progresses quickly",
      "Always has excuses for not meeting in person",
      "Eventually asks for money (emergency, travel, medical)",
      "Stories become increasingly dramatic",
      "Isolates you from friends and family",
    ],
    defense: "Never send money to someone you haven't met in person. Reverse image search their photos. Ask friends for a reality check.",
    example: '"I\'m stuck at the airport and my wallet was stolen. I just need $2,000 for a ticket to come see you. I\'ll pay you back, I promise."',
  },
];

const QUIZ_QUESTIONS = [
  {
    question: '"Your grandson has been arrested and needs bail money right now. Don\'t tell his parents." What should you do?',
    options: [
      "Send the money immediately -- he needs help",
      "Hang up and call your grandson directly on his known number",
      "Ask the caller for more details about the arrest",
      "Transfer half the amount to be safe",
    ],
    correct: 1,
    explanation: "Always verify by calling the person directly. Scammers pressure you to act without verifying.",
  },
  {
    question: "The IRS calls saying you owe back taxes and must pay with gift cards within 2 hours. This is:",
    options: [
      "A legitimate call -- the IRS does call about unpaid taxes",
      "Suspicious -- call the IRS back to verify",
      "Definitely a scam -- the IRS never demands gift card payment",
      "Probably real -- they had your correct name and address",
    ],
    correct: 2,
    explanation: "Tax agencies never demand payment via gift cards, wire transfers, or crypto. They always send written notices first.",
  },
  {
    question: "Your bank calls saying your account is compromised and asks you to transfer money to a \"safe account.\" You should:",
    options: [
      "Follow their instructions to protect your money",
      "Hang up and call the number on the back of your bank card",
      "Give them your account password so they can investigate",
      "Transfer a small amount first to test if it's legitimate",
    ],
    correct: 1,
    explanation: "Banks never ask you to move money to another account for safety. Always call your bank using the official number.",
  },
  {
    question: "What is the most reliable way to verify a caller claiming to be a family member?",
    options: [
      "Ask them personal questions",
      "Listen carefully to their voice",
      "Hang up and call them on their known number",
      "Ask them to send a photo",
    ],
    correct: 2,
    explanation: "AI can clone voices and answer personal questions from social media. The only reliable method is calling back on a known number.",
  },
];

export default function LearnPage() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function selectAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === QUIZ_QUESTIONS[qIdx].correct) {
      setScore((s) => s + 1);
    }
  }

  function nextQuestion() {
    if (qIdx + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
    } else {
      setQIdx((i) => i + 1);
      setSelected(null);
    }
  }

  function resetQuiz() {
    setQuizStarted(false);
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  const q = QUIZ_QUESTIONS[qIdx];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-foreground">
              Verity
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Scam Education</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scam Education Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Learn to recognize common scam patterns and protect yourself and your family.
          </p>
        </div>

        {/* Playbooks */}
        <div className="mb-12 flex flex-col gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Common Scam Playbooks</h2>
          {SCAM_PLAYBOOKS.map((playbook, i) => (
            <motion.details
              key={playbook.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-lg border border-border bg-card"
            >
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{playbook.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-border px-5 py-4">
                <p className="text-sm leading-relaxed text-foreground-secondary">{playbook.description}</p>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-trust-danger">Warning Signs</p>
                  <ul className="flex flex-col gap-1.5">
                    {playbook.signs.map((sign) => (
                      <li key={sign} className="flex items-start gap-2 text-sm text-foreground-secondary">
                        <span className="mt-1 text-trust-danger">--</span>
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example Script</p>
                  <p className="text-sm italic text-foreground-secondary">{playbook.example}</p>
                </div>

                <div className="mt-4 rounded-lg border border-trust-safe/20 bg-trust-safe/5 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-trust-safe">How to Defend</p>
                  <p className="text-sm text-foreground-secondary">{playbook.defense}</p>
                </div>
              </div>
            </motion.details>
          ))}
        </div>

        {/* Quiz */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">Test Your Knowledge</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Can you spot the scam? Take a quick quiz.
          </p>

          {!quizStarted && !finished && (
            <button
              type="button"
              onClick={() => setQuizStarted(true)}
              className="mt-4 cursor-pointer rounded-md bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Start Quiz ({QUIZ_QUESTIONS.length} questions)
            </button>
          )}

          <AnimatePresence mode="wait">
            {quizStarted && !finished && (
              <motion.div
                key={qIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mt-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Question {qIdx + 1} of {QUIZ_QUESTIONS.length}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-muted-foreground">
                    Score: {score}/{qIdx + (selected !== null ? 1 : 0)}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed text-foreground">{q.question}</p>

                <div className="mt-4 flex flex-col gap-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = idx === q.correct;
                    const showResult = selected !== null;
                    let cls = "border-border hover:bg-muted";
                    if (showResult && isCorrect) cls = "border-trust-safe/50 bg-trust-safe/5";
                    if (showResult && isSelected && !isCorrect) cls = "border-trust-danger/50 bg-trust-danger/5";

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectAnswer(idx)}
                        disabled={selected !== null}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {showResult && isCorrect && <CheckCircle className="h-4 w-4 text-trust-safe" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-trust-danger" />}
                          {!showResult && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] text-muted-foreground">
                              {String.fromCharCode(65 + idx)}
                            </span>
                          )}
                        </span>
                        <span className="text-foreground-secondary">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {selected !== null && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="mt-3 cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      {qIdx + 1 < QUIZ_QUESTIONS.length ? "Next Question" : "See Results"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {finished && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-center">
              <p className="text-4xl font-bold text-foreground">
                {score}/{QUIZ_QUESTIONS.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {score === QUIZ_QUESTIONS.length
                  ? "Perfect score! You can spot scams like a pro."
                  : score >= QUIZ_QUESTIONS.length / 2
                    ? "Good job! Review the playbooks above for the ones you missed."
                    : "Keep learning! Review the scam playbooks above and try again."}
              </p>
              <button
                type="button"
                onClick={resetQuiz}
                className="mt-4 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
