"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import data from "../../../data.json";

type MockAnswer = {
  prompt: string;
  correct: boolean;
  explanation?: string;
};

type MockQuestion = {
  problem: string;
  answers: MockAnswer[];
};

type MockSession = {
  title: string;
  questions: MockQuestion[];
};

type MockTest = {
  title: string;
  sessions: MockSession[];
};

const mockTests = (data.mock_tests ?? []) as MockTest[];
const TOTAL_DURATION_SECONDS = 2.5 * 60 * 60;

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${remainingSeconds}`;
}

export default function MockPage() {
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(
    mockTests.length > 0 ? 0 : null,
  );
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(
    mockTests[0]?.sessions.length ? 0 : null,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {},
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_DURATION_SECONDS);

  const currentTest =
    selectedTestIndex === null ? null : mockTests[selectedTestIndex];
  const currentSession =
    currentTest && selectedSessionIndex !== null
      ? currentTest.sessions[selectedSessionIndex]
      : null;
  const currentQuestion = currentSession?.questions[questionIndex] ?? null;
  const isTimeUp = remainingSeconds <= 0;

  const isComplete = isReviewing || isTimeUp;

  useEffect(() => {
    if (!currentSession || isComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsReviewing(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentSession, isComplete]);

  useEffect(() => {
    if (remainingSeconds > 0 || !currentSession) {
      return;
    }

    setIsReviewing(true);
  }, [remainingSeconds, currentSession]);

  const score = useMemo(() => {
    if (!currentSession) return 0;

    return currentSession.questions.reduce((total, question, index) => {
      const selectedAnswer = selectedAnswers[index];
      const answer = question.answers[selectedAnswer];

      return total + (answer?.correct ? 1 : 0);
    }, 0);
  }, [currentSession, selectedAnswers]);

  const totalQuestions = currentSession?.questions.length ?? 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  const startSession = (testIndex: number, sessionIndex: number) => {
    setSelectedTestIndex(testIndex);
    setSelectedSessionIndex(sessionIndex);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setIsReviewing(false);
    setRemainingSeconds(TOTAL_DURATION_SECONDS);
  };

  const chooseAnswer = (answerIndex: number) => {
    if (!currentQuestion || isComplete) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,
      [questionIndex]: answerIndex,
    }));
  };

  const finishTest = () => {
    setIsReviewing(true);
  };

  const currentSelection = selectedAnswers[questionIndex];

  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#1f1f1f]">
      <div className="mx-auto min-h-dvh w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
              Mock exam
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Choose a test session</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-[#e6e2da] bg-white px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#fbfbfa] active:scale-[0.98]"
          >
            Back home
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-xl border border-[#e6e2da] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
              Mock tests
            </p>

            <div className="mt-4 space-y-4">
              {mockTests.length > 0 ? (
                mockTests.map((test, testIndex) => {
                  const isTestSelected = testIndex === selectedTestIndex;

                  return (
                    <div
                      key={test.title}
                      className={`rounded-lg border p-4 ${isTestSelected
                          ? "border-[#1f1f1f] bg-[#f3f1ec]"
                          : "border-[#e6e2da] bg-[#fbfbfa]"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const fallbackSessionIndex = test.sessions.length > 0 ? 0 : null;
                          startSession(testIndex, fallbackSessionIndex ?? 0);
                          setSelectedSessionIndex(fallbackSessionIndex);
                        }}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-medium text-[#1f1f1f]">
                          {test.title}
                        </p>
                        <p className="mt-1 text-sm text-[#6f6f6f]">
                          {test.sessions.length} sessions
                        </p>
                      </button>

                      {isTestSelected ? (
                        <div className="mt-3 space-y-2">
                          {test.sessions.map((session, sessionIndex) => {
                            const isSessionSelected =
                              sessionIndex === selectedSessionIndex;

                            return (
                              <button
                                key={session.title}
                                type="button"
                                onClick={() => startSession(testIndex, sessionIndex)}
                                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${isSessionSelected
                                    ? "border-[#1f1f1f] bg-white"
                                    : "border-[#e6e2da] bg-white/70 hover:bg-white"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span>{session.title}</span>
                                  <span className="text-xs text-[#6f6f6f]">
                                    {session.questions.length} questions
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-4 text-sm text-[#6f6f6f]">
                  No mock tests loaded.
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-[#e6e2da] bg-white p-6">
            {currentSession ? (
              <div className="flex min-h-[560px] flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2da] pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                      Current session
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#1f1f1f]">
                      {currentSession.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#6f6f6f]">
                      {currentTest?.title}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                      Time left
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#1f1f1f]">
                      {formatTime(remainingSeconds)}
                    </p>
                    <p className="mt-1 text-xs text-[#6f6f6f]">2h 30m total</p>
                  </div>
                </div>

                {!isComplete ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {currentSession.questions.map((question, index) => {
                        const isCurrent = index === questionIndex;
                        const hasAnswer = selectedAnswers[index] !== undefined;

                        return (
                          <button
                            key={question.problem}
                            type="button"
                            onClick={() => setQuestionIndex(index)}
                            className={`min-w-10 rounded-md border px-3 py-2 text-sm transition active:scale-[0.98] ${isCurrent
                                ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
                                : hasAnswer
                                  ? "border-[#cfd8cf] bg-[#edf3ec] text-[#346538]"
                                  : "border-[#e6e2da] bg-[#fbfbfa] text-[#1f1f1f] hover:bg-white"
                              }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>

                    {currentQuestion ? (
                      <div className="flex flex-1 flex-col justify-between gap-6">
                        <div>
                          <p className="text-sm text-[#6f6f6f]">
                            Question {questionIndex + 1} of {totalQuestions}
                          </p>
                          <p className="mt-4 text-base leading-7 text-[#1f1f1f]">
                            {currentQuestion.problem}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {currentQuestion.answers.map((answer, answerIndex) => {
                            const isSelected = currentSelection === answerIndex;

                            return (
                              <button
                                key={answer.prompt}
                                type="button"
                                onClick={() => chooseAnswer(answerIndex)}
                                className={`w-full rounded-lg border px-4 py-3 text-left transition active:scale-[0.99] ${isSelected
                                    ? "border-[#1f1f1f] bg-[#f3f1ec]"
                                    : "border-[#e6e2da] bg-[#fbfbfa] hover:bg-white"
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 text-sm font-medium text-[#1f1f1f]">
                                    {String.fromCharCode(65 + answerIndex)}.
                                  </span>
                                  <span className="flex-1 text-sm leading-6 text-[#1f1f1f]">
                                    {answer.prompt}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e2da] pt-4">
                          <p className="text-sm text-[#6f6f6f]">
                            Answered {answeredCount} of {totalQuestions}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setQuestionIndex((current) => Math.max(0, current - 1))
                              }
                              disabled={questionIndex === 0}
                              className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white disabled:cursor-not-allowed disabled:text-[#b8b2a7] active:scale-[0.98]"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (questionIndex < totalQuestions - 1) {
                                  setQuestionIndex((current) => current + 1);
                                  return;
                                }

                                finishTest();
                              }}
                              className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                            >
                              {questionIndex < totalQuestions - 1 ? "Next question" : "Finish test"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                        This session has no questions.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                          Review
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">
                          {remainingSeconds <= 0 ? "Time is up" : "Test complete"}
                        </h3>
                        <p className="mt-2 text-sm text-[#666666]">
                          Score: {score} / {totalQuestions}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3 text-right text-sm text-[#1f1f1f]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                          Final state
                        </p>
                        <p className="mt-1">{answeredCount} answered</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentSession.questions.map((question, index) => {
                        const selectedAnswerIndex = selectedAnswers[index];
                        const selectedAnswer = question.answers[selectedAnswerIndex];
                        const correctAnswer = question.answers.find((answer) => answer.correct);
                        const isRight = Boolean(selectedAnswer?.correct);

                        return (
                          <div
                            key={question.problem}
                            className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-medium text-[#1f1f1f]">
                                Question {index + 1}
                              </p>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${isRight
                                    ? "bg-[#edf3ec] text-[#346538]"
                                    : "bg-[#fdebec] text-[#9f2f2d]"
                                  }`}
                              >
                                {isRight ? "Correct" : "Wrong"}
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-[#1f1f1f]">
                              {question.problem}
                            </p>

                            <div className="mt-4 space-y-2">
                              {question.answers.map((answer, answerIndex) => {
                                const isSelected = selectedAnswerIndex === answerIndex;
                                const isCorrect = answer.correct;

                                let answerClassName =
                                  "rounded-md border px-3 py-2 text-sm transition";

                                if (isCorrect) {
                                  answerClassName +=
                                    " border-[#c9e2c3] bg-[#edf3ec] text-[#346538]";
                                } else if (isSelected) {
                                  answerClassName +=
                                    " border-[#f1c9c4] bg-[#fdebec] text-[#9f2f2d]";
                                } else {
                                  answerClassName +=
                                    " border-[#e6e2da] bg-white text-[#6f6f6f]";
                                }

                                return (
                                  <div key={answer.prompt} className={answerClassName}>
                                    <div className="flex items-start gap-3">
                                      <span className="mt-0.5 font-medium">
                                        {String.fromCharCode(65 + answerIndex)}.
                                      </span>
                                      <div className="flex-1">
                                        <p>{answer.prompt}</p>
                                        {answer.explanation ? (
                                          <p className="mt-2 text-xs leading-5 opacity-80">
                                            {answer.explanation}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <p className="mt-3 text-sm text-[#666666]">
                              Your answer: {selectedAnswer ? selectedAnswer.prompt : "Not answered"}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-[#e6e2da] pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionIndex(0);
                          setSelectedAnswers({});
                          setIsReviewing(false);
                          setRemainingSeconds(TOTAL_DURATION_SECONDS);
                        }}
                        className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                      >
                        Retake session
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentTest && currentTest.sessions.length > 0) {
                            startSession(selectedTestIndex ?? 0, 0);
                          }
                        }}
                        className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white active:scale-[0.98]"
                      >
                        Choose another session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                No mock tests loaded.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}