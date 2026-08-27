import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-bold">if it meant to be let it be</h1>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-black px-6 py-2 text-white"
      >
        count is {count}
      </button>
    </section>
  );
}