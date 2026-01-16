import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finalQuestions } from '../finalQuestions';
import clsx from 'clsx';
import { Trophy, Clock, AlertTriangle } from 'lucide-react';

const Final = ({ scores, setScores, teamNames }) => {
  const navigate = useNavigate();
  
  // Game Flow States
  // roundPhase: 0 (Setup), 1 (Player 1 Active), 2 (Intermission), 3 (Player 2 Active), 4 (Finished)
  const [roundPhase, setRoundPhase] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(30);
  const [qIndex, setQIndex] = useState(0);
  
  // Results: { [qIdx]: { p1: { answer, isError }, p2: { answer, isError, isDuplicate } } }
  const [results, setResults] = useState({});
  
  // UI States
  const [currentError, setCurrentError] = useState(false); // Visual Red X
  const [duplicateMessage, setDuplicateMessage] = useState(false); // "To samo!" feedback
  const [showWinner, setShowWinner] = useState(false);

  // Teams: Derived from "Who Starts?"
  const [startingTeam, setStartingTeam] = useState('left'); // 'left' or 'right'
  const p1Team = startingTeam;
  const p2Team = startingTeam === 'left' ? 'right' : 'left';

  // Timer Logic
  useEffect(() => {
    let timer;
    const isRunning = (roundPhase === 1 || roundPhase === 3) && timeLeft > 0 && !currentError && !duplicateMessage;
    
    if (isRunning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && (roundPhase === 1 || roundPhase === 3)) {
       handleTimeOut();
    }
    return () => clearInterval(timer);
  }, [roundPhase, timeLeft, currentError, duplicateMessage]);

  const handleTimeOut = () => {
     if (roundPhase === 1) {
         setRoundPhase(2); // End R1, go to intermission
     } else {
         setRoundPhase(4); // End R2, finished
     }
  };

  // Input Logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Must be in active phase
      if ((roundPhase !== 1 && roundPhase !== 3) || currentError || duplicateMessage) return;
      if (qIndex >= finalQuestions.length) return;

      const key = parseInt(e.key);
      if (isNaN(key)) return;

      // Prevent spam/multiple answers for same Q
      const playerKey = roundPhase === 1 ? 'p1' : 'p2';
      if (results[qIndex]?.[playerKey]) return;

      // 1-5: Reveal answer
      if (key >= 1 && key <= 5) {
        const currentQ = finalQuestions[qIndex];
        const answerIdx = key - 1;
        
        if (currentQ.answers[answerIdx]) {
           const ans = currentQ.answers[answerIdx];
           
           // If Round 2, Check Duplicate
           if (roundPhase === 3) {
               const p1Ans = results[qIndex]?.p1?.answer;
               // Check ID match
               // Note: If p1Ans was id:-1 (dash), it won't match any real answer.id
               if (p1Ans && p1Ans.id === ans.id) {
                   // DUPLICATE!
                   handleDuplicate();
                   return;
               }
           }

           // Valid Answer
           submitAnswer(ans, false);
        }
      }

      // 6: Error / No Answer
      if (key === 6) {
        // Immediate "No Answer" submission
        submitAnswer({ text: "---", points: 0, id: -1 }, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roundPhase, qIndex, results, currentError, duplicateMessage]);

  const handleDuplicate = () => {
      setDuplicateMessage(true);
      setTimeout(() => {
          setDuplicateMessage(false);
      }, 1500);
  };

  const submitAnswer = (ans, isErr) => {
      const playerKey = roundPhase === 1 ? 'p1' : 'p2';
      const activeTeam = roundPhase === 1 ? p1Team : p2Team;

      setResults(prev => ({
          ...prev,
          [qIndex]: { ...prev[qIndex], [playerKey]: { answer: ans, isError: isErr } }
      }));

      if (ans && !isErr) {
          setScores(prev => ({
              ...prev,
              [activeTeam]: prev[activeTeam] + (ans.points * 2)
          }));
      }

      setTimeout(() => {
         if (qIndex < finalQuestions.length - 1) {
             setQIndex(prev => prev + 1);
         } else {
             handleTimeOut(); 
         }
      }, 1000); 
  };


  // Controls
  const startRound1 = () => {
      setRoundPhase(1);
      setTimeLeft(30);
      setQIndex(0);
      setResults({});
  };

  const startRound2 = () => {
      setRoundPhase(3);
      setTimeLeft(35); 
      setQIndex(0);
  };

  const getWinner = () => {
      if (scores.left > scores.right) return { name: teamNames.left, color: "text-blue-600" };
      if (scores.right > scores.left) return { name: teamNames.right, color: "text-red-600" };
      return { name: "REMIS!", color: "text-gray-800" };
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center pt-4 relative overflow-y-auto">
      {/* Top Nav */}
      <div className="w-full flex justify-between px-8 mb-4 absolute top-4 z-10">
        <button onClick={() => navigate('/')} className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg text-sm text-gray-600 font-bold hover:bg-white border border-gray-200 shadow-sm">
             ⬅ Powrót do Gry
        </button>
      </div>

      <h1 className="text-4xl font-black text-blue-900 mb-8 uppercase tracking-widest border-b-4 border-yellow-400 pb-2 mt-4">
        Runda Finałowa
      </h1>

      {/* 3-Column Layout: Left (P1) | Center | Right (P2) */}
      <div className="w-full max-w-[1600px] px-4 grid grid-cols-[1fr_400px_1fr] gap-6 items-start h-[calc(100vh-150px)]">
            
            {/* LEFT COLUMN: Team Left (Students/Start) */}
            <div className="bg-white rounded-3xl border-4 border-blue-500/20 p-4 h-full flex flex-col shadow-xl">
                 <h2 className="text-3xl font-black text-blue-700 text-center mb-6 uppercase tracking-wider bg-blue-50 py-3 rounded-2xl border border-blue-100 flex items-center justify-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-blue-600 shadow-sm border-2 border-white ring-2 ring-blue-200"></div>
                     {teamNames.left}
                 </h2>
                 {/* Answers List */}
                 <div className="flex-1 flex flex-col gap-3">
                     {finalQuestions.map((q, idx) => {
                         const r = results[idx]?.p1;
                         const isActive = roundPhase === 1 && idx === qIndex;
                         return (
                            <div key={idx} className={clsx(
                                "flex items-center gap-3 h-16 px-4 rounded-xl transition-all border-b-2",
                                r ? "bg-blue-50/50 text-blue-900 border-blue-200" : "bg-gray-50 text-gray-300 border-dashed border-gray-200",
                                isActive ? "ring-4 ring-yellow-300 bg-yellow-50 border-yellow-400 shadow-lg scale-[1.02]" : ""
                            )}>
                                <span className={clsx("font-mono font-bold w-6", r ? "text-blue-400" : "text-gray-300")}>{idx+1}.</span>
                                <span className="flex-1 font-bold text-lg uppercase truncate">
                                    {r?.answer?.text || (isActive ? "..." : "")}
                                </span>
                                
                                <div className={clsx(
                                    "w-20 h-full flex flex-col items-center justify-center font-black border-l-2 leading-none",
                                    r ? "border-blue-100 text-blue-900" : "border-gray-100 text-transparent"
                                )}>
                                    {r?.answer && (
                                        <>
                                            <span className="text-2xl">{r.answer.points}</span>
                                            <span className="text-[10px] bg-yellow-400 text-blue-900 font-bold px-1.5 rounded-full mt-0.5 shadow-sm">x2</span>
                                        </>
                                    )}
                                    {!r?.answer && <span className="text-xl">--</span>}
                                </div>
                            </div>
                         );
                     })}
                 </div>
            </div>


            {/* CENTER COLUMN: Timer & Controls & Active Question */}
            <div className="flex flex-col items-center gap-4 h-full">
                
                {/* Timer Display */}
                <div className={clsx(
                    "text-8xl font-black font-mono p-6 bg-white rounded-[2rem] border-4 shadow-2xl w-full text-center shrink-0 mb-4 transition-colors duration-300 flex items-center justify-center gap-4",
                    (timeLeft <= 5 && (roundPhase===1 || roundPhase===3)) ? "text-red-500 border-red-500 bg-red-50 animate-pulse" : "text-gray-800 border-gray-100"
                )}>
                    <Clock size={48} className="opacity-20" />
                    {timeLeft}
                </div>

                {/* Active Question Panel (Or Setup Controls) */}
                <div className="flex-1 w-full bg-white rounded-3xl border border-gray-200 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
                    
                    {/* Setup Phase */}
                    {roundPhase === 0 && (
                        <div className="text-center w-full flex flex-col gap-6">
                            <h3 className="text-2xl text-gray-400 font-bold uppercase">Kto zaczyna finał?</h3>
                            
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => setStartingTeam('left')}
                                    className={clsx(
                                        "flex-1 py-8 rounded-2xl font-black text-xl border-4 transition-all uppercase flex flex-col items-center gap-2",
                                        startingTeam === 'left' 
                                            ? "bg-blue-600 text-white border-blue-700 shadow-xl scale-105" 
                                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-blue-200"
                                    )}
                                >
                                    <span>{teamNames.left}</span>
                                    {startingTeam === 'left' && <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">WYBRANO</span>}
                                </button>
                                <button 
                                    onClick={() => setStartingTeam('right')}
                                    className={clsx(
                                        "flex-1 py-8 rounded-2xl font-black text-xl border-4 transition-all uppercase flex flex-col items-center gap-2",
                                        startingTeam === 'right' 
                                            ? "bg-red-600 text-white border-red-700 shadow-xl scale-105" 
                                            : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-red-200"
                                    )}
                                >
                                    <span>{teamNames.right}</span>
                                    {startingTeam === 'right' && <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">WYBRANO</span>}
                                </button>
                            </div>

                            <button onClick={startRound1} className="w-full bg-green-500 hover:bg-green-600 text-white text-3xl font-black py-6 rounded-2xl shadow-xl border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all mt-8">
                                START
                            </button>
                        </div>
                    )}

                    {/* Intermission Phase */}
                    {roundPhase === 2 && (
                         <div className="text-center w-full animate-fade-in">
                            <h3 className="text-xl text-yellow-500 font-bold mb-4 uppercase">Koniec Rundy 1</h3>
                            <button onClick={startRound2} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black py-6 rounded-2xl shadow-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all">
                                START CZĘŚĆ 2 (+5s)
                            </button>
                            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-400 uppercase font-bold mb-1">Teraz odpowiada:</p>
                                <p className="text-2xl font-black text-gray-800">{p2Team === 'left' ? teamNames.left : teamNames.right}</p>
                            </div>
                         </div>
                    )}

                    {/* Finished Phase */}
                    {roundPhase === 4 && (
                        <button onClick={() => setShowWinner(true)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-2xl font-black py-8 rounded-3xl shadow-xl border-b-8 border-yellow-600 active:border-b-0 active:translate-y-2 transition-all animate-bounce-slow">
                           <Trophy size={40} className="inline-block mr-2" /> WYNIKI
                        </button>
                    )}

                    {/* Active Question Display */}
                    {(roundPhase === 1 || roundPhase === 3) && (
                        <>
                            <h4 className="text-blue-300 font-bold mb-4 uppercase tracking-wide bg-blue-50 px-4 py-1 rounded-full text-sm">Pytanie {qIndex + 1}</h4>
                            <p className="text-3xl font-black text-center leading-snug z-10 text-gray-800">
                                {finalQuestions[qIndex].question}
                            </p>
                        </>
                    )}

                    {/* Feedback Overlays */}
                    {duplicateMessage && (
                        <div className="absolute inset-0 bg-red-500/95 flex flex-col items-center justify-center z-50 animate-shake rounded-3xl">
                             <AlertTriangle size={80} className="text-white mb-4" />
                            <span className="text-5xl font-black uppercase text-white drop-shadow-md">TO SAMO!</span>
                        </div>
                    )}
                    {currentError && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none rounded-3xl bg-white/50 backdrop-blur-sm">
                            <span className="text-[12rem] animate-ping drop-shadow-xl text-red-600">❌</span>
                        </div>
                    )}

                </div>
            </div>


            {/* RIGHT COLUMN: Team Right (Teachers/2nd) */}
            <div className="bg-white rounded-3xl border-4 border-red-500/20 p-4 h-full flex flex-col shadow-xl">
                 <h2 className="text-3xl font-black text-red-700 text-center mb-6 uppercase tracking-wider bg-red-50 py-3 rounded-2xl border border-red-100 flex items-center justify-center gap-3">
                     <div className="w-6 h-6 rounded-full bg-red-600 shadow-sm border-2 border-white ring-2 ring-red-200"></div>
                     {teamNames.right}
                 </h2>
                 {/* Answers List */}
                 <div className="flex-1 flex flex-col gap-3">
                     {finalQuestions.map((q, idx) => {
                         const r = results[idx]?.p2;
                         const isActive = roundPhase === 3 && idx === qIndex;
                         
                         return (
                            <div key={idx} className={clsx(
                                "flex items-center gap-3 h-16 px-4 rounded-xl transition-all border-b-2",
                                r ? "bg-red-50/50 text-red-900 border-red-200" : "bg-gray-50 text-gray-300 border-dashed border-gray-200",
                                isActive ? "ring-4 ring-yellow-300 bg-yellow-50 border-yellow-400 shadow-lg scale-[1.02]" : ""
                            )}>
                                <span className={clsx("font-mono font-bold w-6", r ? "text-red-400" : "text-gray-300")}>{idx+1}.</span>
                                <div className="flex-1 font-bold text-lg uppercase truncate relative">
                                    {r?.answer?.text || (isActive ? "..." : "")}
                                </div>
                                
                                <div className={clsx(
                                    "w-20 h-full flex flex-col items-center justify-center font-black border-l-2 leading-none",
                                    r ? "border-red-100 text-red-900" : "border-gray-100 text-transparent"
                                )}>
                                    {r?.answer && (
                                        <>
                                            <span className="text-2xl">{r.answer.points}</span>
                                            <span className="text-[10px] bg-yellow-400 text-red-900 font-bold px-1.5 rounded-full mt-0.5 shadow-sm">x2</span>
                                        </>
                                    )}
                                    {!r?.answer && <span className="text-xl">--</span>}
                                </div>
                            </div>
                         );
                     })}
                 </div>
            </div>

      </div>

      {/* Winner Modal */}
      {showWinner && (
          <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setShowWinner(false)}>
              <div className="bg-white p-12 rounded-[3rem] text-center shadow-2xl max-w-4xl w-full relative overflow-hidden transform animate-pop-in" onClick={e => e.stopPropagation()}>
                  
                  <div className="mb-4 inline-block bg-yellow-100 text-yellow-600 p-4 rounded-full">
                      <Trophy size={64} />
                  </div>

                  <h3 className="text-3xl text-gray-400 mb-4 font-bold uppercase tracking-widest">Zwycięża drużyna</h3>
                  <div className={clsx("text-8xl font-black mb-12 drop-shadow-sm", getWinner().color)}>
                      {getWinner().name}
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-100">
                          <p className="text-blue-400 text-xl font-bold mb-2 uppercase">{teamNames.left}</p>
                          <p className="text-7xl font-black text-blue-900">{scores.left}</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-3xl border-4 border-red-100">
                          <p className="text-red-400 text-xl font-bold mb-2 uppercase">{teamNames.right}</p>
                          <p className="text-7xl font-black text-red-900">{scores.right}</p>
                      </div>
                  </div>

                  <button onClick={() => setShowWinner(false)} className="text-gray-400 hover:text-gray-900 mt-4 font-bold uppercase tracking-widest hover:underline transition-all">
                      Zamknij
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Final;
