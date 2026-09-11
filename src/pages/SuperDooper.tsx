const SuperDooper = () => {
  const archivo = { fontFamily: "'Archivo Black', sans-serif" };

  return (
    <div className="relative min-h-[100vh] w-full flex items-center justify-center bg-[#F5F2ED] overflow-hidden select-none">
      {/* Corner metadata */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 text-[10px] font-mono font-bold text-[#1A1A1A]/30 uppercase tracking-widest">
        Expression 002
      </div>
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 text-[10px] font-mono font-bold text-[#1A1A1A]/30 uppercase tracking-widest rotate-180">
        Expression 002
      </div>

      <div className="relative flex flex-col items-center px-6">
        {/* Decorative ring */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full border-4 border-[#1A1A1A]/10" />

        <div className="relative z-10 flex flex-col items-start gap-0">
          <h1
            style={archivo}
            className="text-[18vw] md:text-[16vw] leading-[0.8] tracking-[-0.05em] uppercase text-[#1A1A1A] transition-transform duration-500 hover:scale-[1.02] animate-fade-in"
          >
            super
          </h1>

          <div className="relative">
            {/* Offset ghost outline */}
            <h1
              aria-hidden="true"
              style={archivo}
              className="absolute top-1 left-1 text-[18vw] md:text-[16vw] leading-[0.8] tracking-[-0.05em] uppercase text-transparent border-t border-l border-[#1A1A1A]/20 pointer-events-none"
            >
              dooper
            </h1>

            <h1
              style={archivo}
              className="text-[18vw] md:text-[16vw] leading-[0.8] tracking-[-0.05em] uppercase text-[#1A1A1A] transition-transform duration-500 hover:scale-[1.02] animate-fade-in"
            >
              dooper
            </h1>
          </div>
        </div>

        {/* Caption rule */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-[2px] w-12 bg-[#1A1A1A]" />
          <span className="text-xs font-bold tracking-[0.4em] uppercase text-[#1A1A1A]/40">
            Est. 2024
          </span>
          <div className="h-[2px] w-12 bg-[#1A1A1A]" />
        </div>
      </div>
    </div>
  );
};

export default SuperDooper;
