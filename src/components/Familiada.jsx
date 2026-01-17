import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questions } from '../data';
import clsx from 'clsx';
import { RotateCw, AlertTriangle, Eye, Shield, Trophy } from 'lucide-react';

// Icons mapping 
const XIcon = () => (
    <div className="relative w-full h-full">
         <div className="absolute top-1/2 left-0 w-full h-2 bg-red-600 -translate-y-1/2 rotate-45 transform origin-center shadow-sm"></div>
         <div className="absolute top-1/2 left-0 w-full h-2 bg-red-600 -translate-y-1/2 -rotate-45 transform origin-center shadow-sm"></div>
    </div>
);

const Familiada = ({ scores, setScores, teamNames }) => {
  const navigate = useNavigate();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [revealed, setRevealed] = useState([]); // Array of answer IDs
  const [errors, setErrors] = useState({ left: 0, right: 0 }); // 'left' team, 'right' team errors
  const [activeTeam, setActiveTeam] = useState('left'); // 'left' or 'right'
  
  // Advanced Scoring State
  const [roundPoints, setRoundPoints] = useState(0); // Points in the pot
  const [isStealMode, setIsStealMode] = useState(false);
  const [controllingTeam, setControllingTeam] = useState(null); // Who had control before steal
  const [roundFinished, setRoundFinished] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);

  const currentQuestion = questions[currentQIndex];

  // Logic: Switch question
  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setRevealed([]);
      setErrors({ left: 0, right: 0 });
      setRoundPoints(0);
      setIsStealMode(false);
      setControllingTeam(null);
      setRoundFinished(false);
    } else {
      // End of questions
      setShowFinalModal(true);
    }
  };

  // Logic: Award points and finish round
  const awardPoints = (teamKey, points) => {
      setScores(prev => ({
          ...prev,
          [teamKey]: prev[teamKey] + points
      }));
      setRoundFinished(true);
      setRoundPoints(0); // Empty pot visually (moved to score)
  };

    const handleReveal = (answer) => {
    if (revealed.includes(answer.id)) return;

    // Reveal
    const newRevealed = [...revealed, answer.id];
    setRevealed(newRevealed);

    // GUARD: If round finished, DO NOT ADD POINTS
    if (roundFinished) return;

    // Logic: Add to POT
    const newPot = roundPoints + answer.points;
    setRoundPoints(newPot);

    // Check if ALL revealed
    const allRevealed = newRevealed.length === currentQuestion.answers.length;

    if (isStealMode) {
        // STEAL SUCCESS!
        // Stealing team gets the POT (points just revealed + existing pot)
        awardPoints(activeTeam, newPot);
        setIsStealMode(false);
    } else {
        // Normal Mode
        if (allRevealed) {
             // Round Finished naturally
             awardPoints(activeTeam, newPot);
        }
    }
  };

  const handleError = () => {
    if (roundFinished) return;

    const currentErrors = errors[activeTeam];
    
    // Logic: Steal Mode Fail
    if (isStealMode) {
        // Steal FAILED!
        // Original controlling team gets the points
        awardPoints(controllingTeam, roundPoints);
        setIsStealMode(false);
        // Visual Update for the error? Yes, display X then finish
        setErrors(prev => ({ ...prev, [activeTeam]: prev[activeTeam] + 1 }));
        return;
    }

    // Logic: Normal Mode -> Check for 3rd Error
    if (currentErrors + 1 === 3) {
        // 3 Errors! Switch to Opponent for STEAL
        setErrors(prev => ({ ...prev, [activeTeam]: 3 }));
        
        // Setup Steal
        setControllingTeam(activeTeam);
        setIsStealMode(true);
        setActiveTeam(activeTeam === 'left' ? 'right' : 'left'); // Switch!
    } else {
        // Just an error
        setErrors(prev => ({ ...prev, [activeTeam]: prev[activeTeam] + 1 }));
    }
  };

  const handleRevealRemaining = () => {
      // Reveal all answers for 0 points (visual only)
      const allIds = currentQuestion.answers.map(a => a.id);
      setRevealed(allIds);
      setRoundFinished(true); // Ensure locked
  };

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e) => {
       const key = parseInt(e.key);
       
       // Dynamic: 1 to N (answers length)
       if (!isNaN(key) && key >= 1 && key <= currentQuestion.answers.length) {
           const idx = key - 1;
           if (currentQuestion.answers[idx]) {
               handleReveal(currentQuestion.answers[idx]);
           }
       }
       
       // 'x': Trigger Error (Block if round finished)
       if (e.key.toLowerCase() === 'x' && !roundFinished) {
           handleError();
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, revealed, roundPoints, isStealMode, activeTeam, errors, controllingTeam, roundFinished]);


  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden relative">
      
      {/* Header / Top Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 shrink-0 h-20">
        <h1 className="text-3xl font-black tracking-tighter text-blue-900 uppercase">
            Familiada <span className="text-yellow-500">ZS3</span>
        </h1>

        <div className="flex items-center gap-4">
             {/* Pot Display */}
             <div className="flex-1"></div>

             <div className="h-8 w-[2px] bg-gray-300 mx-2"></div>

             <button 
                  onClick={nextQuestion}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                  <span>Następne</span> <RotateCw size={20} />
              </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col relative">
          
          {/* Question Banner */}
          <div className="bg-blue-900 py-8 shadow-xl relative z-0">
               <div className="max-w-5xl mx-auto px-4 text-center">
                   <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-md">
                       {currentQuestion.question}
                   </h2>
               </div>
          </div>

          {/* Steal Mode Banner */}
          {isStealMode && (
              <div className="bg-red-600 text-white text-center py-2 font-black uppercase tracking-widest text-xl animate-pulse shadow-inner">
                  🚨 Szansa na przejęcie! 🚨
              </div>
          )}

          {/* Game Board Container */}
          <div className="flex-1 flex items-start justify-center pt-8 md:pt-12 px-4 gap-8 md:gap-16 max-w-7xl mx-auto w-full">
               
               {/* Left Team (Students) */}
               <div className={clsx(
                   "flex flex-col items-center gap-4 transition-all duration-300 rounded-3xl p-6 border-4 w-64 md:w-80 shrink-0",
                   activeTeam === 'left' ? "bg-white border-blue-500 shadow-2xl scale-105" : "bg-gray-200 border-transparent opacity-80"
               )}>
                    <div className="text-center">
                        <div className="text-6xl font-black text-blue-900 mb-2 font-mono">{scores.left}</div>
                        <h3 className="text-xl font-bold text-gray-500 uppercase tracking-wide">{teamNames.left}</h3>
                    </div>
                    
                    {/* Error Xs */}
                    <div className="flex gap-2 min-h-[60px]">
                        {[...Array(errors.left)].map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-800 rounded shadow-inner p-2 border-2 border-gray-600 animate-bounce-short">
                                <XIcon />
                            </div>
                        ))}
                    </div>

                     {/* Active Indicator & Controls */}
                     <div className="mt-4 flex flex-col gap-2 w-full">
                        {activeTeam === 'left' && !roundFinished && (
                            <button 
                                onClick={handleError}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={20} /> BŁĄD
                            </button>
                        )}
                        <button 
                             onClick={() => setActiveTeam('left')}
                             className={clsx("text-xs font-bold uppercase tracking-wider py-2 rounded border-2", activeTeam === 'left' ? "bg-blue-100 text-blue-800 border-blue-200 cursor-default" : "bg-white text-gray-400 border-gray-200 hover:border-blue-400")}
                        >
                            {activeTeam === 'left' ? "Aktywni" : "Ustaw jako Aktywni"}
                        </button>
                     </div>
               </div>


               {/* Answers Board */}
               <div className="flex-1 max-w-3xl perspective-1000">
                    <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.answers.map((ans, idx) => {
                            const isRevealed = revealed.includes(ans.id);
                            
                            return (
                                <div 
                                    key={ans.id} 
                                    className="relative w-full h-20 cursor-pointer group perspective-1000"
                                    onClick={() => handleReveal(ans)}
                                >
                                    <div className={clsx(
                                        "w-full h-full transition-all duration-700 preserve-3d shadow-md rounded-lg group-hover:scale-[1.01] relative"
                                    )}>
                                        {/* FRONT (Hidden) - Visible when NOT revealed */}
                                        <div className={clsx(
                                            "absolute inset-0 backface-hidden bg-gradient-to-b from-blue-700 to-blue-900 rounded-lg flex items-center justify-center border-2 border-blue-600/50 transition-opacity duration-300",
                                            isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
                                        )}>
                                            <div className="w-[96%] h-[86%] border-2 border-blue-400/30 rounded-md flex items-center justify-center bg-blue-800/50">
                                                <span className="text-3xl font-black text-blue-200/20 drop-shadow-sm font-mono">{idx + 1}</span>
                                            </div>
                                        </div>

                                        {/* BACK (Revealed) - Visible when REVEALED */}
                                        <div className={clsx(
                                            "absolute inset-0 bg-white rounded-lg flex items-center justify-between px-6 border-2 border-blue-200 text-blue-900 overflow-hidden transition-opacity duration-300",
                                            isRevealed ? "opacity-100" : "opacity-0"
                                        )}>
                                            <span className="text-2xl font-bold uppercase truncate pr-4">{ans.text}</span>
                                            <div className="h-full w-20 flex items-center justify-center bg-blue-100 border-l border-blue-200 -mr-6">
                                                <span className="text-3xl font-black">{ans.points}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pot Display (Moved here) */}
                    <div className="flex justify-center mt-8 mb-4">
                         <div className="bg-yellow-400 text-black px-8 py-3 rounded-2xl font-black text-4xl shadow-xl border-4 border-yellow-500/50 flex items-center gap-4 transform rotate-1 hover:rotate-0 transition-transform cursor-default">
                            <span className="text-lg uppercase tracking-widest opacity-80 font-bold mb-1 self-end">Pula</span>
                            <span className="text-5xl">{roundPoints}</span>
                         </div>
                    </div>

                    {/* Reveal Remaining Button */}
                    <div className="flex justify-center mt-2">
                         {revealed.length < currentQuestion.answers.length && (
                             <button onClick={handleRevealRemaining} className="text-gray-400 hover:text-blue-600 text-sm font-semibold flex items-center gap-1 transition-colors px-4 py-2 rounded hover:bg-white/50">
                                 <Eye size={16} /> Odsłoń pozostałe
                             </button>
                         )}
                         
                         {roundFinished && revealed.length === currentQuestion.answers.length && (
                             <div className="text-green-600 font-bold bg-green-100 px-4 py-2 rounded-lg animate-pulse flex items-center gap-2">
                                 <Trophy size={20} /> Runda Zakończona
                             </div>
                         )}
                    </div>
               </div>


               {/* Right Team (Teachers) */}
               <div className={clsx(
                   "flex flex-col items-center gap-4 transition-all duration-300 rounded-3xl p-6 border-4 w-64 md:w-80 shrink-0",
                   activeTeam === 'right' ? "bg-white border-red-500 shadow-2xl scale-105" : "bg-gray-200 border-transparent opacity-80"
               )}>
                    <div className="text-center">
                        <div className="text-6xl font-black text-red-900 mb-2 font-mono">{scores.right}</div>
                        <h3 className="text-xl font-bold text-gray-500 uppercase tracking-wide">{teamNames.right}</h3>
                    </div>
                    
                    {/* Error Xs */}
                    <div className="flex gap-2 min-h-[60px]">
                        {[...Array(errors.right)].map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-800 rounded shadow-inner p-2 border-2 border-gray-600 animate-bounce-short">
                                <XIcon />
                            </div>
                        ))}
                    </div>

                    {/* Active Indicator & Controls */}
                    <div className="mt-4 flex flex-col gap-2 w-full">
                        {activeTeam === 'right' && !roundFinished && (
                            <button 
                                onClick={handleError}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle size={20} /> BŁĄD
                            </button>
                        )}
                        <button 
                             onClick={() => setActiveTeam('right')}
                             className={clsx("text-xs font-bold uppercase tracking-wider py-2 rounded border-2", activeTeam === 'right' ? "bg-red-100 text-red-800 border-red-200 cursor-default" : "bg-white text-gray-400 border-gray-200 hover:border-red-400")}
                        >
                            {activeTeam === 'right' ? "Aktywni" : "Ustaw jako Aktywni"}
                        </button>
                     </div>
               </div>

          </div>
      </main>

      {/* Final Round Trigger Modal */}
      {showFinalModal && (
          <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-white p-12 rounded-[3rem] text-center shadow-2xl max-w-2xl w-full border-4 border-blue-500/20 transform animate-pop-in">
                  <h3 className="text-4xl text-blue-900 font-black mb-6 uppercase tracking-widest leading-tight">
                      To już wszystkie pytania!
                  </h3>
                  <p className="text-gray-500 text-xl font-medium mb-10">
                      Czas na decydujące starcie w rundzie finałowej.
                  </p>

                  <button 
                    onClick={() => navigate('/final')} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black py-6 rounded-2xl shadow-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                      <Shield size={32} /> PRZEJDŹ DO FINAŁU
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Familiada;
