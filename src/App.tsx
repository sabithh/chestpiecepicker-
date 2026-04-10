import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Info, Crown, Award, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Sound Engine ---
const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore if audio fails or is locked
  }
};

const playTick = () => playTone(400, 'sine', 0.1, 0.02);
const playDing = () => playTone(880, 'sine', 0.5, 0.05);
const playTada = () => {
  playTone(523.25, 'sine', 0.4, 0.08); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.4, 0.08), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.8, 0.08), 200); // G5
};
// --------------------

function App() {
  const [namesText, setNamesText] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [numPieces, setNumPieces] = useState<number>(1);
  const [phase, setPhase] = useState<'input' | 'shuffling' | 'revealing' | 'done'>('input');
  const [winners, setWinners] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState<number>(0);

  // Vanta Fog Effect setup
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(0);
  useEffect(() => {
    if (!vantaEffect && vantaRef.current && (window as any).VANTA) {
      setVantaEffect((window as any).VANTA.FOG({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0xfae251, // brandYellow
        midtoneColor: 0xd75656,   // brandOrange
        lowlightColor: 0xbd114a,  // brandMagenta
        baseColor: 0xeeeeee,      // background
        blurFactor: 0.6,
        speed: 1.5,
        zoom: 1.2
      }))
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  // Sync names array from text area
  useEffect(() => {
    const list = namesText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setNames(list);
    
    // Automatically adjust numPieces based on number of people (e.g. 4 people -> 2 pieces)
    if (list.length > 0) {
      setNumPieces(Math.max(1, Math.floor(list.length / 2)));
    } else {
      setNumPieces(1);
    }
  }, [namesText]);

  const handleStartDraw = () => {
    if (names.length === 0) return;
    const pieces = Math.min(Math.max(1, numPieces), names.length);
    
    // Fisher-Yates shuffle
    const shuffled = [...names];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setWinners(shuffled.slice(0, pieces));
    setPhase('shuffling');

    // Fake shuffling delay to build suspense
    setTimeout(() => {
      setPhase('revealing');
      setRevealedCount(0);
    }, 2000);
  };

  // Shuffling tick sound effect
  useEffect(() => {
    let tickInterval: any;
    if (phase === 'shuffling') {
      tickInterval = setInterval(playTick, 100);
    }
    return () => clearInterval(tickInterval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'revealing' && revealedCount < winners.length) {
      if (revealedCount > 0) playDing(); // Ding when a card is revealed
      const timer = setTimeout(() => {
        setRevealedCount((prev) => prev + 1);
      }, 1500); // 1.5s delay between reveals for suspense
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedCount === winners.length) {
      playDing(); // Ding for the last card
      setTimeout(() => {
        setPhase('done');
        playTada(); // Celebration sound
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FAE251', '#D75656', '#BD114A']
        });
      }, 500);
    }
  }, [phase, revealedCount, winners.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 md:px-10 overflow-hidden text-zinc-900 font-sans relative">
      {/* Vanta background placed behind everything with an opacity to make it more faded */}
      <div ref={vantaRef} className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

      <motion.header 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="w-full max-w-2xl text-center mb-10 z-10"
      >
        <h1 style={{ fontFamily: '"Centive", cursive' }} className="text-5xl md:text-7xl mb-4 text-brandMagenta drop-shadow-md">
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5, type: "spring" }} className="inline-block">Chest Piece Plucker</motion.span>
          {' '}
          <motion.span className="inline-block origin-bottom" initial={{ opacity: 0, scale: 0, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: [0, 15, -10, 0] }} transition={{ opacity: { delay: 0.5 }, scale: { delay: 0.5, type: "spring" }, rotate: { delay: 1.5, repeat: Infinity, duration: 2, ease: "easeInOut" } }}>🍗</motion.span>
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-zinc-600 text-lg font-semibold tracking-wide uppercase"
        >
          Who gets the holy grail of the chicken?
        </motion.p>
      </motion.header>

      <AnimatePresence mode="wait">
        {phase === 'input' && (
          <motion.div
            key="input-phase"
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.7 }}
            className="w-full max-w-xl bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-8 md:p-10 space-y-8 border border-white/50 z-10 relative overflow-hidden"
          >
            {/* Inner decorative accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brandYellow via-brandOrange to-brandMagenta" />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-brandMagenta uppercase tracking-widest bg-brandMagenta/10 w-fit px-3 py-1 rounded-lg">
                <span>1</span> The Contenders
              </label>
              <textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder="John&#10;Alice&#10;Bob&#10;(One name per line)"
                className="w-full min-h-[180px] p-5 bg-white/50 border-2 border-zinc-200/80 rounded-2xl focus:border-brandOrange focus:ring-4 focus:ring-brandOrange/20 focus:bg-white outline-none transition-all resize-none text-zinc-800 font-bold text-lg placeholder:text-zinc-400 placeholder:font-medium shadow-inner"
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-sm text-zinc-500 font-bold flex items-center gap-1.5">
                  <Info size={16} className="text-brandOrange" /> {names.length} participant{names.length !== 1 && 's'} ready
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-black text-brandMagenta uppercase tracking-widest bg-brandMagenta/10 w-fit px-3 py-1 rounded-lg">
                <span>2</span> The Chest Pieces
              </label>
              <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border-2 border-zinc-200/80 shadow-inner">
                <button 
                  onClick={() => setNumPieces(Math.max(1, numPieces - 1))}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-brandMagenta transition-all border border-zinc-100"
                >
                  <span className="text-2xl font-black">-</span>
                </button>
                <div className="flex-1 text-center font-black text-4xl text-zinc-800">
                  {numPieces}
                </div>
                <button 
                  onClick={() => setNumPieces(numPieces + 1)}
                  className="w-14 h-14 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 text-brandMagenta transition-all border border-zinc-100"
                >
                   <span className="text-2xl font-black">+</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400 font-medium px-1 text-center">Auto-calculated as half the participants</p>
            </div>

            <button
              onClick={handleStartDraw}
              disabled={names.length === 0}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-brandMagenta to-brandOrange text-white font-black text-xl flex items-center justify-center gap-3 transition-all hover:shadow-[0_10px_40px_-10px_rgba(189,17,74,0.6)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-1 active:translate-y-0 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
              <Shuffle size={24} className="relative z-10 group-hover:rotate-180 transition-transform duration-500" />
              <span className="relative z-10">Let Fate Decide</span>
            </button>
          </motion.div>
        )}

        {(phase === 'shuffling' || phase === 'revealing' || phase === 'done') && (
          <motion.div
            key="reveal-phase"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl space-y-6 relative"
          >
            {phase === 'shuffling' && (
              <div className="min-h-[300px] flex flex-col items-center justify-center gap-6 text-center">
                <motion.div 
                   animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                   transition={{ 
                     rotate: { repeat: Infinity, duration: 1.5, ease: "linear" },
                     scale: { repeat: Infinity, duration: 0.8 } 
                   }}
                   className="w-24 h-24 bg-brandYellow rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(250,226,81,0.5)]"
                >
                  <Shuffle size={48} className="text-brandMagenta" />
                </motion.div>
                <motion.h2 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-2xl font-black text-brandOrange"
                >
                  Checking the crispy alignments...
                </motion.h2>
              </div>
            )}

            {(phase === 'revealing' || phase === 'done') && (
              <div className="w-full flex flex-col gap-4">
                <h2 className="text-center font-bold text-zinc-500 mb-2 uppercase tracking-widest">The Chosen Ones</h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {winners.slice(0, revealedCount).map((winner, idx) => (
                      <WinnerCard 
                        key={idx} 
                        name={winner} 
                        rank={idx + 1} 
                        isFirst={idx === 0}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                
                {phase === 'revealing' && revealedCount < winners.length && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center p-8"
                  >
                    <div className="flex gap-2">
                      <motion.div className="w-4 h-4 rounded-full bg-brandYellow" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, delay: 0, duration: 0.6 }} />
                      <motion.div className="w-4 h-4 rounded-full bg-brandOrange" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, delay: 0.2, duration: 0.6 }} />
                      <motion.div className="w-4 h-4 rounded-full bg-brandMagenta" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, delay: 0.4, duration: 0.6 }} />
                    </div>
                  </motion.div>
                )}

                {phase === 'done' && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => {
                       setPhase('input');
                       setRevealedCount(0);
                    }}
                    className="mt-8 mx-auto w-full md:w-auto px-8 py-4 rounded-xl font-bold bg-white text-brandMagenta border-2 border-brandMagenta flex justify-center items-center gap-2 hover:bg-brandMagenta hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    <RotateCcw size={20} />
                    Start Over Again
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WinnerCard({ name, rank, isFirst }: { name: string, rank: number, isFirst: boolean }) {
  // Use tailwind config colors via mapping classes
  const bgClasses = isFirst 
    ? 'bg-gradient-to-r from-brandYellow to-[#e6cf3e]' 
    : rank === 2 
    ? 'bg-gradient-to-r from-brandOrange to-[#c24a4a]'
    : 'bg-gradient-to-r from-brandMagenta to-[#a00f3e]';
    
  const textColor = isFirst ? 'text-brandMagenta' : 'text-white';
  const rankBgColor = isFirst ? 'bg-white/90 text-brandMagenta' : 'bg-white/20 text-white';

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.8, rotateX: -30 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotateX: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 100 }}
      className={`w-full ${bgClasses} ${textColor} rounded-2xl p-6 shadow-xl flex items-center justify-between border-t border-white/20 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10">
        <Crown size={120} />
      </div>

      <div className="relative z-10 flex items-center gap-5">
        <div className={`w-14 h-14 ${rankBgColor} rounded-2xl flex flex-col items-center justify-center font-black shadow-inner`}>
          <span className="text-xl leading-none">#{rank}</span>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-black">{name}</h3>
          {isFirst ? (
             <p className="font-bold opacity-80 mt-1 flex items-center gap-1.5"><Crown size={16}/> 1st Priority Chest Piece</p>
          ) : (
             <p className="font-medium opacity-80 mt-1 flex items-center gap-1.5"><Award size={16}/> Priority #{rank}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default App;

