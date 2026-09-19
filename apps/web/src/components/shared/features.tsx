import AnimatedContent from "@/components/animation/animate";

export function Features() {
  return (
    <section className="bg-white px-8 py-32">
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700&family=Caveat:wght@700&family=Space+Mono:wght@700&family=Fraunces:ital,wght@1,600&family=Bebas+Neue&family=Kalam:wght@700&family=Bungee&display=swap');
                .font-bricolage { font-family: 'Bricolage Grotesque', sans-serif; }
                .font-caveat { font-family: 'Caveat', cursive; }
                .font-mono2 { font-family: 'Space Mono', monospace; }
                .font-fraunces { font-family: 'Fraunces', serif; }
                .font-bebas { font-family: 'Bebas Neue', sans-serif; }
                .font-kalam { font-family: 'Kalam', cursive; }
                .font-bungee { font-family: 'Bungee', cursive; }
            `}</style>

      <AnimatedContent distance={50} direction="vertical" delay={0.1}>
        <div className="max-w-2xl mb-24">
          <h2 className="font-serif text-5xl leading-tight text-gray-900">
            Built to watch
            <br />
            what you'd rather not.
          </h2>
          <p className="text-gray-600 mt-4">
            Cani handles the tabs, the refreshing, and the waiting — so you only
            show up when it matters.
          </p>
        </div>
      </AnimatedContent>

      <div className="relative flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.05}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-[#3d0f0a] p-8 flex flex-col justify-between -rotate-6 shadow-xl">
            <p className="font-bricolage text-indigo-300 text-2xl leading-snug">
              May cause you to stop refreshing tabs.
            </p>
            <p className="text-indigo-200/70 font-fraunces italic text-sm">
              Cani
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.1}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-yellow-300 p-8 flex flex-col justify-between rotate-3 shadow-xl mt-10">
            <p className="font-caveat text-gray-900 text-3xl leading-snug">
              Use responsibly. Restocks disappear fast.
            </p>
            <p className="text-gray-800/70 font-fraunces italic text-sm">
              Cani
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.15}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-blue-700 p-8 flex flex-col justify-between -rotate-2 shadow-xl">
            <p className="font-bebas text-white text-3xl leading-snug tracking-wide">
              Warning: notifications may feel oddly satisfying.
            </p>
            <p className="text-white/70 font-fraunces italic text-sm">Cani</p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.2}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-purple-900 p-8 flex flex-col justify-between rotate-6 shadow-xl mt-6">
            <p className="font-mono2 text-pink-400 text-lg leading-snug">
              Warning: may cause strong attachment to good deals.
            </p>
            <p className="text-pink-300/70 font-fraunces italic text-sm">
              Cani
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.25}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-gray-100 p-8 flex flex-col justify-between -rotate-3 shadow-xl">
            <p className="font-fraunces italic text-green-700 text-2xl leading-snug">
              The shortcut to never missing a drop.
            </p>
            <p className="text-green-700/70 font-fraunces italic text-sm">
              Cani
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.3}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-orange-500 p-8 flex flex-col justify-between rotate-2 shadow-xl mt-8">
            <p className="font-bungee text-white text-xl leading-snug">
              Side effects include fewer regrets.
            </p>
            <p className="text-white/70 font-fraunces italic text-sm">Cani</p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.35}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-teal-600 p-8 flex flex-col justify-between -rotate-5 shadow-xl">
            <p className="font-kalam text-white text-2xl leading-snug">
              Caution: watching may become addictive.
            </p>
            <p className="text-white/70 font-fraunces italic text-sm">Cani</p>
          </div>
        </AnimatedContent>

        <AnimatedContent
          distance={40}
          direction="vertical"
          delay={0.4}
          threshold={0.1}
        >
          <div className="w-72 h-56 rounded-2xl bg-rose-200 p-8 flex flex-col justify-between rotate-4 shadow-xl mt-4">
            <p className="font-bricolage text-rose-900 text-2xl leading-snug">
              Not responsible for sudden restock joy.
            </p>
            <p className="text-rose-900/70 font-fraunces italic text-sm">
              Cani
            </p>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
