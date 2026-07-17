"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import data from "../../../data.json";

type PractiseAnswer = {
  prompt: string;
  correct: boolean;
  explanation?: string;
};

type PractiseQuestion = {
  problem: string;
  answers: PractiseAnswer[];
};

type PractiseSet = {
  title: string;
  questions: PractiseQuestion[];
};

const practiseTests = (data.practise_tests ?? []) as PractiseSet[];
const STORAGE_KEY = "shoukanjuu.practise-test-state";

export default function PractisePage() {
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(
    practiseTests.length > 0 ? 0 : null,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {},
  );
  const [revealedByQuestion, setRevealedByQuestion] = useState<
    Record<number, boolean>
  >({});
  const [isFinalized, setIsFinalized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as {
          selectedSetIndex?: number | null;
          questionIndex?: number;
          selectedAnswers?: Record<number, number>;
          revealedByQuestion?: Record<number, boolean>;
          isFinalized?: boolean;
        };
        const savedSetIndex = parsedState.selectedSetIndex;
        const hasValidSetIndex =
          typeof savedSetIndex === "number" &&
          savedSetIndex >= 0 &&
          savedSetIndex < practiseTests.length;
        const restoredSetIndex = hasValidSetIndex
          ? savedSetIndex
          : practiseTests.length > 0
            ? 0
            : null;
        const restoredSet =
          restoredSetIndex === null ? null : practiseTests[restoredSetIndex];
        const savedQuestionIndex = parsedState.questionIndex ?? 0;
        const restoredQuestionIndex = restoredSet
          ? Math.min(
              Math.max(0, savedQuestionIndex),
              Math.max(0, restoredSet.questions.length - 1),
            )
          : 0;

        setSelectedSetIndex(restoredSetIndex);
        setQuestionIndex(restoredQuestionIndex);
        setSelectedAnswers(parsedState.selectedAnswers ?? {});
        setRevealedByQuestion(parsedState.revealedByQuestion ?? {});
        setIsFinalized(Boolean(parsedState.isFinalized));
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
        selectedSetIndex,
        questionIndex,
        selectedAnswers,
        revealedByQuestion,
        isFinalized,
      }),
    );
  }, [
    isFinalized,
    isHydrated,
    questionIndex,
    revealedByQuestion,
    selectedAnswers,
    selectedSetIndex,
  ]);

  const currentSet =
    selectedSetIndex === null ? null : practiseTests[selectedSetIndex];
  const currentQuestion = currentSet?.questions[questionIndex] ?? null;
  const currentSelectedAnswerIndex = selectedAnswers[questionIndex];
  const currentSelectedAnswer =
    currentQuestion && currentSelectedAnswerIndex !== undefined
      ? currentQuestion.answers[currentSelectedAnswerIndex]
      : undefined;
  const isCurrentRevealed = Boolean(revealedByQuestion[questionIndex]);
  const currentCorrectAnswer = currentQuestion?.answers.find((answer) => answer.correct);
  const hasCurrentAnswer = currentSelectedAnswerIndex !== undefined;
  const totalQuestions = currentSet?.questions.length ?? 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const hasProgress =
    answeredCount > 0 ||
    Object.keys(revealedByQuestion).length > 0 ||
    isFinalized ||
    questionIndex > 0;

  const score = useMemo(() => {
    if (!currentSet) return 0;

    return currentSet.questions.reduce((total, question, index) => {
      const selectedIndex = selectedAnswers[index];
      const selectedAnswer = question.answers[selectedIndex];

      return total + (selectedAnswer?.correct ? 1 : 0);
    }, 0);
  }, [currentSet, selectedAnswers]);

  const chooseSet = (index: number) => {
    setSelectedSetIndex(index);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedByQuestion({});
    setIsFinalized(false);
  };

  const clearCurrentProgress = () => {
    setQuestionIndex(0);
    setSelectedAnswers({});
    setRevealedByQuestion({});
    setIsFinalized(false);
  };

  const resetCurrentProgress = () => {
    const shouldReset = window.confirm(
      "Reset all progress for this practise set?",
    );

    if (shouldReset) {
      clearCurrentProgress();
    }
  };

  const chooseAnswer = (answerIndex: number) => {
    if (!currentQuestion || isFinalized || isCurrentRevealed) return;

    setSelectedAnswers((previous) => ({
      ...previous,
      [questionIndex]: answerIndex,
    }));
  };

  const finalizeTest = () => {
    setIsFinalized(true);
  };

  const revealCurrentAnswer = () => {
    if (!hasCurrentAnswer || isCurrentRevealed) {
      return;
    }

    setRevealedByQuestion((previous) => ({
      ...previous,
      [questionIndex]: true,
    }));
  };

  const goToNextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((current) => Math.min(totalQuestions - 1, current + 1));
      return;
    }

    finalizeTest();
  };

  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#1f1f1f]">
      <div className="mx-auto min-h-dvh w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
              Practise exam
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Choose a practise set</h1>
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
              Practise sets
            </p>

            <div className="mt-4 space-y-3">
              {practiseTests.length > 0 ? (
                practiseTests.map((test, index) => {
                  const isSelected = selectedSetIndex === index;

                  return (
                    <button
                      key={test.title}
                      type="button"
                      onClick={() => chooseSet(index)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition active:scale-[0.99] ${isSelected
                        ? "border-[#1f1f1f] bg-[#f3f1ec]"
                        : "border-[#e6e2da] bg-[#fbfbfa] hover:bg-white"
                        }`}
                    >
                      <p className="text-sm font-medium text-[#1f1f1f]">{test.title}</p>
                      <p className="mt-1 text-sm text-[#6f6f6f]">
                        {test.questions.length} questions
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-4 text-sm text-[#6f6f6f]">
                  No practise tests loaded.
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-[#e6e2da] bg-white p-6">
            {currentSet ? (
              <div className="flex min-h-[560px] flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e2da] pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                      Current set
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#1f1f1f]">
                      {currentSet.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3 text-right text-sm text-[#6f6f6f]">
                      <p>{answeredCount} answered</p>
                      <p>{totalQuestions} total</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetCurrentProgress}
                      disabled={!hasProgress}
                      className="rounded-md border border-[#f1d4d5] bg-[#fdebec] px-4 py-2 text-sm font-medium text-[#9f2f2d] transition hover:bg-[#f9dfe1] disabled:cursor-not-allowed disabled:border-[#e6e2da] disabled:bg-[#fbfbfa] disabled:text-[#aaa49a] active:scale-[0.98]"
                    >
                      Reset progress
                    </button>
                  </div>
                </div>

                {!isFinalized ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {currentSet.questions.map((question, index) => {
                        const isCurrent = questionIndex === index;
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
                            const isSelected = currentSelectedAnswerIndex === answerIndex;
                            const showResult = hasCurrentAnswer && isCurrentRevealed;

                            let optionClassName =
                              "w-full rounded-lg border px-4 py-3 text-left transition active:scale-[0.99]";

                            if (showResult) {
                              if (answer.correct) {
                                optionClassName +=
                                  " border-[#a9d3a3] bg-[#e3f0dd] text-[#2f6b34] ring-1 ring-[#cfe5c9]";
                              } else if (isSelected) {
                                optionClassName +=
                                  " border-[#ea8f84] bg-[#f9d8d4] text-[#8e231f] ring-1 ring-[#f1b5ae]";
                              } else {
                                optionClassName +=
                                  " border-[#e6e2da] bg-[#fbfbfa] text-[#6f6f6f]";
                              }
                            } else {
                              optionClassName += isSelected
                                ? " border-[#1f1f1f] bg-[#efe4cf] text-[#1f1f1f] ring-2 ring-[#1f1f1f]/15 shadow-sm"
                                : " border-[#e6e2da] bg-[#fbfbfa] hover:bg-white";
                            }

                            return (
                              <button
                                key={answer.prompt}
                                type="button"
                                onClick={() => chooseAnswer(answerIndex)}
                                disabled={isCurrentRevealed}
                                className={optionClassName}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 text-sm font-medium ${showResult && isSelected ? "text-[#8e231f]" : showResult && answer.correct ? "text-[#2f6b34]" : "text-[#1f1f1f]"}`}>
                                    {String.fromCharCode(65 + answerIndex)}.
                                  </span>
                                  <span className={`flex-1 text-sm leading-6 ${showResult && isSelected ? "text-[#8e231f]" : showResult && answer.correct ? "text-[#2f6b34]" : "text-[#1f1f1f]"}`}>
                                    {answer.prompt}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {hasCurrentAnswer && isCurrentRevealed ? (
                          <div className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] p-4">
                            <p className="text-sm font-medium text-[#1f1f1f]">
                              {currentSelectedAnswer?.correct ? "Correct" : "Wrong"}
                            </p>
                            <p className="mt-2 text-sm text-[#666666]">
                              Your answer: {currentSelectedAnswer?.prompt ?? "Not answered"}
                            </p>
                            <p className="mt-1 text-sm text-[#666666]">
                              Correct answer: {currentCorrectAnswer?.prompt ?? "N/A"}
                            </p>

                            <div className="mt-3 space-y-2">
                              {currentSelectedAnswer?.explanation ? (
                                <div className="rounded-md border border-[#e6e2da] bg-white px-3 py-2 text-sm text-[#1f1f1f]">
                                  <p className="font-medium">Explanation</p>
                                  <p className="mt-1 text-[#666666]">
                                    {currentSelectedAnswer.explanation}
                                  </p>
                                </div>
                              ) : null}

                              {!currentSelectedAnswer?.correct && currentCorrectAnswer?.explanation ? (
                                <div className="rounded-md border border-[#cfd8cf] bg-[#edf3ec] px-3 py-2 text-sm text-[#1f1f1f]">
                                  <p className="font-medium">Why the correct answer is right</p>
                                  <p className="mt-1 text-[#346538]">
                                    {currentCorrectAnswer.explanation}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6e2da] pt-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
                              disabled={questionIndex === 0}
                              className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white disabled:cursor-not-allowed disabled:text-[#b8b2a7] active:scale-[0.98]"
                            >
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={goToNextQuestion}
                              className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white disabled:cursor-not-allowed disabled:text-[#b8b2a7] active:scale-[0.98]"
                            >
                              {questionIndex < totalQuestions - 1 ? "Next question" : "Finalize test"}
                            </button>
                            <button
                              type="button"
                              onClick={revealCurrentAnswer}
                              disabled={!hasCurrentAnswer || isCurrentRevealed}
                              className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:bg-[#b8b2a7] active:scale-[0.98]"
                            >
                              {isCurrentRevealed ? "Answer locked" : "Check answer"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                        This set has no questions.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-1 flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                          Final review
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">
                          Results ready
                        </h3>
                        <p className="mt-2 text-sm text-[#666666]">
                          Score: {score} / {totalQuestions}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentSet.questions.map((question, index) => {
                        const selectedIndex = selectedAnswers[index];
                        const selectedAnswer = question.answers[selectedIndex];
                        const correctAnswer = question.answers.find((answer) => answer.correct);
                        const isCorrect = Boolean(selectedAnswer?.correct);

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

                    <div className="flex flex-wrap gap-3 border-t border-[#e6e2da] pt-4">
                      <button
                        type="button"
                        onClick={clearCurrentProgress}
                        className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                      >
                        Retake set
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                No practise tests loaded.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
