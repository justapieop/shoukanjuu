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
  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#1f1f1f]">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-5 py-12 sm:px-8 lg:px-10">
        <div className="max-w-2xl space-y-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#6f6f6f]">
            Exam practice app
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose a mode.
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#5f5f5f]">
            Pick practise tests for learning or mock tests for a more exam-like
            run.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#e6e2da] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Practise tests</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#666666]">
                  Open the live practise exam and choose from the question sets
                  in data.json.
                </p>
              </div>
              <span className="rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#346538]">
                {practiseTests.length} sets
              </span>
            </div>

            <div className="mt-5">
              <Link
                href="/practise"
                className="inline-flex items-center rounded-md bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333333] active:scale-[0.98]"
              >
                Start practise
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-[#e6e2da] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Mock tests</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#666666]">
                  Same app, different mode. Mock tests stay on the home page for
                  now.
                </p>
              </div>
              <span className="rounded-full bg-[#fbf3db] px-3 py-1 text-xs font-medium uppercase tracking-wider text-[#956400]">
                {mockTests.length} sets
              </span>
            </div>

            <div className="mt-5">
              <Link
                href="/practise"
                className="inline-flex items-center rounded-md border border-[#e6e2da] bg-[#fbfbfa] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-white active:scale-[0.98]"
              >
                Open practise mode
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
