import AnimatedContent from "@/components/animation/animate";

export default function Hero() {
  return (
    <section className="bg-white px-8 pt-16 pb-8">
      <div className="max-w-5xl">
        <AnimatedContent distance={60} direction="vertical" delay={0.15}>
          <h1 className="font-serif text-6xl leading-tight text-gray-900">
            Your shared board
            <br />
            to find and choose
            <br />
            what to <span className="italic">buy.</span>
          </h1>
        </AnimatedContent>

        <AnimatedContent distance={50} direction="vertical" delay={0.3}>
          <p className="text-gray-600 mt-6 flex items-center gap-3 flex-wrap">
            <span className="text-md">
              Search stores, share rooms, vote, and track price drops.
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-md text-gray-800">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Deals
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-md text-gray-800">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Price drops
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-md    text-gray-800">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              Launches
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-md text-gray-800">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Rooms
            </span>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-md text-gray-800">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              Votes
            </span>
          </p>
        </AnimatedContent>
      </div>

      <AnimatedContent
        distance={80}
        direction="vertical"
        delay={0.4}
        threshold={0.05}
      >
        <div className="mt-10 w-full h-[80vh] rounded-2xl overflow-hidden bg-black">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/zSatDgjE-wk?autoplay=1&mute=1&controls=0&cc_load_policy=0&cc_lang_pref=off&fs=1&playsinline=1&rel=0"
            title="Get a niche defining product video | Zelios"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
      </AnimatedContent>
    </section>
  );
}
