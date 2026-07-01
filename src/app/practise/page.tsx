"use client";

import { useState } from "react";
import Link from "next/link";
import data from "../../../data.json";

type TestQuestion = {
  problem: string;
  answers: {
    prompt: string;
    correct: boolean;
  }[];
};

type TestSet = {
  title: string;
  questions: TestQuestion[];
};

const practiseTests = (data.practise_tests ?? []) as TestSet[];

export default function PractisePage() {
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(
    practiseTests.length > 0 ? 0 : null,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answersByQuestion, setAnswersByQuestion] = useState<
    Record<number, number>
  >({});
  const [finished, setFinished] = useState(false);

  const currentSet =
    selectedSetIndex === null ? null : practiseTests[selectedSetIndex];
  const currentQuestion = currentSet?.questions[questionIndex] ?? null;

  const score = currentSet
    ? Object.entries(answersByQuestion).reduce((total, [question, answer]) => {
      const questionData = currentSet.questions[Number(question)];
      const answerData = questionData?.answers[answer];

      return total + (answerData?.correct ? 1 : 0);
    }, 0)
    : 0;

  const totalQuestions = currentSet?.questions.length ?? 0;
  const answeredCount = Object.keys(answersByQuestion).length;

  const chooseSet = (index: number) => {
    setSelectedSetIndex(index);
    setQuestionIndex(0);
    setAnswersByQuestion({});
    setFinished(false);
  };

  const chooseAnswer = (answerIndex: number) => {
    if (!currentQuestion || answersByQuestion[questionIndex] !== undefined) {
      return;
    }

    setAnswersByQuestion((previous) => ({
      ...previous,
      [questionIndex]: answerIndex,
    }));
  };

  const goNext = () => {
    if (!currentSet) return;

    if (questionIndex < currentSet.questions.length - 1) {
      setQuestionIndex((previous) => previous + 1);
      return;
    }

    setFinished(true);
  };

  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#1f1f1f]">
      <div className="mx-auto min-h-dvh w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
              Practise exam
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Pick a question set</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-[#e6e2da] bg-white px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#fbfbfa] active:scale-[0.98]"
          >
            Back home
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-[#e6e2da] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
              Practise sets
            </p>

            <div className="mt-4 space-y-3">
              {practiseTests.length > 0 ? (
                practiseTests.map((test, index) => {
                  const isSelected = index === selectedSetIndex;

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
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#1f1f1f]">
                            {test.title}
                          </p>
                          <p className="mt-1 text-sm text-[#6f6f6f]">
                            {test.questions.length} questions
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="text-xs uppercase tracking-[0.12em] text-[#1f1f1f]">
                            Selected
                          </span>
                        ) : null}
                      </div>
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
              finished ? (
                <div className="flex min-h-[360px] flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                      Finished
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[#1f1f1f]">
                      {currentSet.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[#666666]">
                      Score: {score} / {totalQuestions}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionIndex(0);
                        setAnswersByQuestion({});
                        setFinished(false);
                      }}
                      className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSetIndex !== null) {
                          chooseSet(selectedSetIndex);
                        }
                      }}
                      className="rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white active:scale-[0.98]"
                    >
                      Restart this set
                    </button>
                  </div>
                </div>
              ) : currentQuestion ? (
                <div className="flex min-h-[360px] flex-col justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
                          Practise test
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#1f1f1f]">
                          {currentSet.title}
                        </h2>
                      </div>
                      <p className="text-sm text-[#6f6f6f]">
                        Question {questionIndex + 1} of {totalQuestions}
                      </p>
                    </div>

                    <p className="mt-5 max-w-3xl text-base leading-7 text-[#1f1f1f]">
                      {currentQuestion.problem}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer, answerIndex) => {
                      const chosenAnswer = answersByQuestion[questionIndex];
                      const answered = chosenAnswer !== undefined;
                      const isSelected = chosenAnswer === answerIndex;
                      const isCorrect = answer.correct;

                      let optionClassName =
                        "w-full rounded-lg border px-4 py-3 text-left transition active:scale-[0.99]";

                      if (answered) {
                        if (isCorrect) {
                          optionClassName +=
                            " border-[#c9e2c3] bg-[#edf3ec] text-[#346538]";
                        } else if (isSelected) {
                          optionClassName +=
                            " border-[#f1c9c4] bg-[#fdebec] text-[#9f2f2d]";
                        } else {
                          optionClassName += " border-[#e6e2da] bg-[#fbfbfa] text-[#6f6f6f]";
                        }
                      } else {
                        optionClassName += " border-[#e6e2da] bg-[#fbfbfa] hover:bg-white";
                      }

                      return (
                        <button
                          key={answer.prompt}
                          type="button"
                          onClick={() => chooseAnswer(answerIndex)}
                          className={optionClassName}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-sm font-medium text-[#1f1f1f]">
                              {String.fromCharCode(65 + answerIndex)}.
                            </span>
                            <span className="flex-1 text-sm leading-6">
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
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={answersByQuestion[questionIndex] === undefined}
                      className="rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:bg-[#b8b2a7] active:scale-[0.98]"
                    >
                      {questionIndex < totalQuestions - 1 ? "Next question" : "Finish set"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                  This set has no questions.
                </div>
              )
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-10 text-sm text-[#6f6f6f]">
                No practise tests loaded.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}