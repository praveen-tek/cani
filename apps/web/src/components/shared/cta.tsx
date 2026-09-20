import { Cursor } from "../animation/cursor-animated";
import AnimatedContent from "@/components/animation/animate";

export function CTA() {
  return (
    <section className="flex flex-col items-center text-center px-8 py-24 bg-white relative overflow-hidden">

      <AnimatedContent distance={50} direction="vertical" delay={0.15}>
        <h2 className="font-serif text-8xl leading-none text-gray-900 flex flex-col items-center justify-center gap-2">
          <span className="flex items-center justify-center flex-wrap gap-4">
            Shop
            <span className="relative w-64 h-64 inline-block">
              <Cursor
                attachToParent
                variants={{
                  initial: { scale: 0, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  exit: { scale: 0, opacity: 0 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                springConfig={{ stiffness: 300, damping: 30 }}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black text-white text-xs">
                  Decide Together
                </div>
              </Cursor>
              <img
                src="/cta.png"
                alt=""
                width={256}
                height={256}
                className="w-64 h-64 rounded-lg object-cover"
              />
            </span>
            Together
          </span>
          <span className="block mt-2">Not Alone.</span>
        </h2>
      </AnimatedContent>

      <AnimatedContent distance={40} direction="vertical" delay={0.35}>
        <p className="text-gray-600 mt-8">
          Search stores, share rooms, and vote with friends.
          <br />
          Create your first shared shopping room today.
        </p>
      </AnimatedContent>

      <AnimatedContent distance={30} direction="vertical" delay={0.45}>
        <div className="flex items-center gap-3 mt-8">
          <a
            href="/sign-in"
            className="rounded-full px-6 py-3 bg-black text-white text-sm"
          >
            Let's begin
          </a>
          <a
            href="#how-it-works"
            className="rounded-full px-6 py-3 border border-gray-300 text-sm text-gray-800"
          >
            Demo
          </a>
        </div>
      </AnimatedContent>
    </section>
  );
}
