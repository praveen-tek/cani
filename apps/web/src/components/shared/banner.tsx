import TextLoop from "../shaders/text-loop";

export function TextLoopSection() {
  return (
    <section className="flex items-center justify-center overflow-hidden py-6">
      <TextLoop
        text="Agentic Way of Shopping ✦"
        shape="wave"
        speed={90}
        direction="forward"
        separator="✦"
        curviness={90}
        fontSize={46}
        fontWeight={800}
        letterSpacing={2}
        uppercase
        color="#ffffff"
        ribbon
        ribbonColor="#5227FF"
        ribbonWidth={86}
      />
    </section>
  );
}
