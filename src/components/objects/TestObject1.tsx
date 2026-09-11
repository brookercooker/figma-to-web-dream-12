export default function TestObject1() {
  return (
    <section className="min-h-[60vh] w-full flex items-center justify-center bg-cream py-16 px-6">
      <div className="relative flex flex-col items-center">
        {/* Post */}
        <div className="absolute top-full w-3 h-40 bg-gradient-to-b from-stone/80 to-stone/40 rounded-b-sm" aria-hidden />
        {/* Sign */}
        <div
          className="relative rounded-md border-4 border-ink bg-cream shadow-xl px-16 py-10"
          style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.15), inset 0 0 0 6px hsl(var(--cream))" }}
        >
          <span className="block font-serif text-6xl md:text-7xl tracking-widest text-ink uppercase">
            Test
          </span>
        </div>
      </div>
    </section>
  );
}
