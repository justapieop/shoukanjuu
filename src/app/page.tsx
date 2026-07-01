import Link from "next/link";
import data from "../../data.json";

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
const mockTests = (data.mock_tests ?? []) as TestSet[];

export default function Home() {
  const practisePreview = practiseTests.slice(0, 3);
  const mockPreview = mockTests.slice(0, 3);
  const totalSets = practiseTests.length + mockTests.length;

  return (
    <main className="min-h-[100dvh] bg-[#faf8f4] text-[#1f1f1f]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <section
            id="practise-tests"
            className="rounded-xl border border-[#e6e2da] bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Practise tests</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#666666]">
                  Go through the question bank, review answers, and move at your
                  own pace.
                </p>
              </div>
              <span className="rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-medium uppercase tracking-[0.05em] text-[#346538]">
                {practiseTests.length} sets
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#practise-preview"
                className="inline-flex items-center rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
              >
                Open practise
              </Link>
            </div>

            <div id="practise-preview" className="mt-6 space-y-3">
              {practisePreview.length > 0 ? (
                practisePreview.map((test) => (
                  <div
                    key={test.title}
                    className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3"
                  >
                    <p className="text-sm font-medium">{test.title}</p>
                    <p className="mt-1 text-sm text-[#6f6f6f]">
                      {test.questions.length} questions
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-4 text-sm text-[#6f6f6f]">
                  No practise tests loaded.
                </div>
              )}
            </div>
          </section>

          <section
            id="mock-tests"
            className="rounded-xl border border-[#e6e2da] bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Mock tests</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#666666]">
                  Same idea, just treated like a mock run when you want a more
                  focused session.
                </p>
              </div>
              <span className="rounded-full bg-[#fbf3db] px-3 py-1 text-xs font-medium uppercase tracking-[0.05em] text-[#956400]">
                {mockTests.length} sets
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#mock-preview"
                className="inline-flex items-center rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
              >
                Open mock
              </Link>
            </div>

            <div id="mock-preview" className="mt-6 space-y-3">
              {mockPreview.length > 0 ? (
                mockPreview.map((test) => (
                  <div
                    key={test.title}
                    className="rounded-lg border border-[#e6e2da] bg-[#fbfbfa] px-4 py-3"
                  >
                    <p className="text-sm font-medium">{test.title}</p>
                    <p className="mt-1 text-sm text-[#6f6f6f]">
                      {test.questions.length} questions
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#e6e2da] bg-[#fbfbfa] px-4 py-4 text-sm text-[#6f6f6f]">
                  No mock tests loaded yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-[#e6e2da] bg-white p-5 text-sm text-[#666666]">
          {totalSets} total sets loaded from data.json.
        </div>
      </div>
    </main>
  );
}
