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
const STORAGE_KEY = "shoukanjuu.mock-test-state";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${remainingSeconds}`;
}

function getQuestionKey(testIndex: number, sessionIndex: number, questionIndex: number) {
  return `${testIndex}:${sessionIndex}:${questionIndex}`;
}

export default function MockPage() {
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    {},
  );
  const [isFinalized, setIsFinalized] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_DURATION_SECONDS);
  const [isHydrated, setIsHydrated] = useState(false);

  const currentTest =
    selectedTestIndex === null ? null : mockTests[selectedTestIndex];
  const currentSession =
    currentTest && selectedSessionIndex !== null
      ? currentTest.sessions[selectedSessionIndex]
      : null;
  const currentQuestion = currentSession?.questions[questionIndex] ?? null;
  const isTimeUp = remainingSeconds <= 0;
  const isComplete = isFinalized || isTimeUp;

  useEffect(() => {
    const savedState = window.localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as {
          selectedTestIndex?: number | null;
          selectedSessionIndex?: number | null;
          questionIndex?: number;
          selectedAnswers?: Record<string, number>;
          isFinalized?: boolean;
          remainingSeconds?: number;
        };

        setSelectedTestIndex(parsedState.selectedTestIndex ?? null);
        setSelectedSessionIndex(parsedState.selectedSessionIndex ?? null);
        setQuestionIndex(parsedState.questionIndex ?? 0);
        setSelectedAnswers(parsedState.selectedAnswers ?? {});
        setIsFinalized(Boolean(parsedState.isFinalized));
        setRemainingSeconds(
          typeof parsedState.remainingSeconds === "number"
            ? parsedState.remainingSeconds
            : TOTAL_DURATION_SECONDS,
        );
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedTestIndex,
        selectedSessionIndex,
        questionIndex,
        selectedAnswers,
        isFinalized,
        remainingSeconds,
      }),
    );
  }, [
    isHydrated,
    questionIndex,
    isFinalized,
    remainingSeconds,
    selectedAnswers,
    selectedSessionIndex,
    selectedTestIndex,
  ]);

  useEffect(() => {
    if (!currentTest || isComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsFinalized(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentTest, isComplete]);

  useEffect(() => {
    if (remainingSeconds > 0 || !currentTest) {
      return;
    }

    setIsFinalized(true);
  }, [remainingSeconds, currentTest]);

  const score = useMemo(() => {
    if (!currentTest || selectedTestIndex === null) return 0;

    return currentTest.sessions.reduce((testTotal, session, sessionIndex) => {
      return (
        testTotal +
        session.questions.reduce((sessionTotal, question, questionIndex) => {
          const answerIndex = selectedAnswers[
            getQuestionKey(selectedTestIndex, sessionIndex, questionIndex)
          ];
          const answer = question.answers[answerIndex];

          return sessionTotal + (answer?.correct ? 1 : 0);
        }, 0)
      );
    }, 0);
  }, [currentTest, selectedAnswers, selectedTestIndex]);

  const totalQuestions = currentTest?.sessions.reduce(
    (count, session) => count + session.questions.length,
    0,
  ) ?? 0;

  const answeredCount = Object.keys(selectedAnswers).length;

  const scaledScore = useMemo(() => {
    if (totalQuestions === 0) {
      return 0;
    }

    return Math.round((score / totalQuestions) * 1900);
  }, [score, totalQuestions]);

  const startTest = (testIndex: number) => {
    if (!isComplete && selectedTestIndex !== null && testIndex !== selectedTestIndex) {
      return;
    }

    const test = mockTests[testIndex];

    setSelectedTestIndex(testIndex);
    setSelectedSessionIndex(test.sessions.length > 0 ? 0 : null);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setIsFinalized(false);
    setRemainingSeconds(TOTAL_DURATION_SECONDS);
  };

  const selectSession = (sessionIndex: number) => {
    setSelectedSessionIndex(sessionIndex);
    setQuestionIndex(0);
  };

  const sessionPickerLocked = Boolean(
    selectedTestIndex !== null && selectedSessionIndex !== null && !isComplete,
  );

  const testSelectionLocked = selectedTestIndex !== null && !isComplete;

  const selectedQuestionKey =
    selectedTestIndex !== null && selectedSessionIndex !== null
      ? getQuestionKey(selectedTestIndex, selectedSessionIndex, questionIndex)
      : null;
  const currentSelectedAnswerIndex =
    selectedQuestionKey !== null ? selectedAnswers[selectedQuestionKey] : undefined;

  const chooseAnswer = (answerIndex: number) => {
    if (!selectedQuestionKey || isComplete) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,
      [selectedQuestionKey]: answerIndex,
    }));
  };

  const goToPreviousQuestion = () => {
    if (!currentTest || selectedSessionIndex === null) return;

    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
      return;
    }

    if (selectedSessionIndex > 0) {
      const previousSessionIndex = selectedSessionIndex - 1;
      const previousSession = currentTest.sessions[previousSessionIndex];
      setSelectedSessionIndex(previousSessionIndex);
      setQuestionIndex(Math.max(0, previousSession.questions.length - 1));
    }
  };

  const goToNextQuestion = () => {
    if (!currentTest || selectedSessionIndex === null) return;

    if (currentSession && questionIndex < currentSession.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    if (selectedSessionIndex < currentTest.sessions.length - 1) {
      setSelectedSessionIndex((current) => (current ?? 0) + 1);
      setQuestionIndex(0);
      return;
    }

    setIsFinalized(true);
  };

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
                        onClick={() => startTest(testIndex)}
                        disabled={testSelectionLocked && !isTestSelected}
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
                                onClick={() => selectSession(sessionIndex)}
                                disabled={sessionPickerLocked}
                                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${sessionPickerLocked
                                  ? "cursor-not-allowed opacity-60"
                                  : isSessionSelected
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
            {currentTest ? (
              !isComplete ? (
                <div className="flex min-h-[560px] flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2da] pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                        Current session
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-[#1f1f1f]">
                        {currentSession?.title ?? "No session selected"}
                      </h2>
                      <p className="mt-1 text-sm text-[#6f6f6f]">
                        {currentTest.title}
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

                  {currentSession ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {currentSession.questions.map((question, index) => {
                          const isCurrent = index === questionIndex;
                          const hasAnswer =
                            selectedAnswers[
                            getQuestionKey(selectedTestIndex ?? 0, selectedSessionIndex ?? 0, index)
                            ] !== undefined;

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
                              Question {questionIndex + 1} of {currentSession.questions.length}
                            </p>
                            <p className="mt-4 text-base leading-7 text-[#1f1f1f]">
                              {currentQuestion.problem}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {currentQuestion.answers.map((answer, answerIndex) => {
                              const isSelected = currentSelectedAnswerIndex === answerIndex;

                              let answerClassName =
                                "w-full rounded-lg border px-4 py-3 text-left transition active:scale-[0.99]";

                              if (isSelected) {
                                answerClassName +=
                                  " border-[#1f1f1f] bg-[#efe4cf] text-[#1f1f1f] ring-2 ring-[#1f1f1f]/15 shadow-sm";
                              } else {
                                answerClassName +=
                                  " border-[#e6e2da] bg-[#fbfbfa] hover:bg-white";
                              }

                              return (
                                <button
                                  key={answer.prompt}
                                  type="button"
                                  onClick={() => chooseAnswer(answerIndex)}
                                  disabled={isComplete}
                                  className={answerClassName}
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
                                onClick={goToPreviousQuestion}
                                disabled={questionIndex === 0 && (selectedSessionIndex ?? 0) === 0}
                                className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white disabled:cursor-not-allowed disabled:text-[#b8b2a7] active:scale-[0.98]"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                onClick={goToNextQuestion}
                                className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                              >
                                {currentSession && selectedSessionIndex !== null && questionIndex < currentSession.questions.length - 1
                                  ? "Next question"
                                  : currentTest.sessions.length > 1 && selectedSessionIndex !== null && selectedSessionIndex < currentTest.sessions.length - 1
                                    ? "Next session"
                                    : "Finish test"}
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
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                      Select a session to start.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[560px] flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e6e2da] pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                        Review
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">
                        {remainingSeconds <= 0 ? "Time is up" : "Test complete"}
                      </h3>
                      <p className="mt-2 text-sm text-[#666666]">
                        Score: {scaledScore} / 1900
                      </p>
                      <p className="mt-1 text-xs text-[#8a8479]">
                        Raw score: {score} / {totalQuestions}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3 text-right text-sm text-[#1f1f1f]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                          Final state
                        </p>
                        <p className="mt-1">{answeredCount} answered</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setQuestionIndex(0);
                          setSelectedAnswers({});
                          setIsFinalized(false);
                          setRemainingSeconds(TOTAL_DURATION_SECONDS);
                        }}
                        className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                      >
                        Retake test
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {currentTest.sessions.map((session, sessionIndex) => {
                      const sessionQuestionOffset = currentTest.sessions
                        .slice(0, sessionIndex)
                        .reduce((count, previousSession) => count + previousSession.questions.length, 0);

                      return (
                        <div key={session.title} className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-lg font-semibold text-[#1f1f1f]">
                              {session.title}
                            </h4>
                            <p className="text-sm text-[#6f6f6f]">
                              {session.questions.length} questions
                            </p>
                          </div>

                          <div className="space-y-4">
                            {session.questions.map((question, questionIdx) => {
                              const answerKey = getQuestionKey(
                                selectedTestIndex ?? 0,
                                sessionIndex,
                                questionIdx,
                              );
                              const selectedAnswerIndex = selectedAnswers[answerKey];
                              const selectedAnswer = question.answers[selectedAnswerIndex];
                              const correctAnswer = question.answers.find((answer) => answer.correct);
                              const isCorrect = Boolean(selectedAnswer?.correct);

                              return (
                                <div
                                  key={question.problem}
                                  className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] p-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-[#1f1f1f]">
                                      Question {sessionQuestionOffset + questionIdx + 1}
                                    </p>
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${isCorrect
                                        ? "bg-[#edf3ec] text-[#346538]"
                                        : "bg-[#fdebec] text-[#9f2f2d]"
                                        }`}
                                    >
                                      {isCorrect ? "Correct" : "Wrong"}
                                    </span>
                                  </div>

                                  <p className="mt-3 text-sm leading-6 text-[#1f1f1f]">
                                    {question.problem}
                                  </p>

                                  <p className="mt-3 text-sm text-[#666666]">
                                    Your answer: {selectedAnswer ? selectedAnswer.prompt : "Not answered"}
                                  </p>
                                  <p className="mt-1 text-sm text-[#666666]">
                                    Correct answer: {correctAnswer ? correctAnswer.prompt : "N/A"}
                                  </p>

                                  <div className="mt-3 space-y-2">
                                    {selectedAnswer?.explanation ? (
                                      <div className="rounded-md border border-[#e6e2da] bg-white px-3 py-2 text-sm text-[#1f1f1f]">
                                        <p className="font-medium">Explanation (your answer)</p>
                                        <p className="mt-1 text-[#666666]">
                                          {selectedAnswer.explanation}
                                        </p>
                                      </div>
                                    ) : null}

                                    {!isCorrect && correctAnswer?.explanation ? (
                                      <div className="rounded-md border border-[#cfd8cf] bg-[#edf3ec] px-3 py-2 text-sm text-[#1f1f1f]">
                                        <p className="font-medium">Why the correct answer is right</p>
                                        <p className="mt-1 text-[#346538]">
                                          {correctAnswer.explanation}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
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
