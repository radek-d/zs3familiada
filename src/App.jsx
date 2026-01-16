import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import clsx from 'clsx';
import Familiada from './components/Familiada';
import Final from './components/Final';

function App() {
  const [scores, setScores] = useState({ left: 0, right: 0 }); // Maps to teamNames keys
  const [teamNames, setTeamNames] = useState({ left: '', right: '' });
  const [isGameStarted, setIsGameStarted] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  if (!isGameStarted) {
      return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
              <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center border-4 border-blue-900/10">
                  <h1 className="text-5xl font-black text-blue-900 mb-2 tracking-widest uppercase">Familiada ZS3</h1>
                  <p className="text-gray-500 mb-10 text-lg font-medium">Konfiguracja Gry</p>

                  <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="flex flex-col text-left gap-2">
                          <label className="text-sm font-bold text-gray-400 uppercase tracking-wide">Drużyna Lewa</label>
                          <input 
                              type="text" 
                              value={teamNames.left} 
                              onChange={(e) => setTeamNames(prev => ({...prev, left: e.target.value}))}
                              className="border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl font-bold text-gray-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                              placeholder="np. Uczniowie"
                          />
                      </div>
                      <div className="flex flex-col text-left gap-2">
                          <label className="text-sm font-bold text-gray-400 uppercase tracking-wide">Drużyna Prawa</label>
                          <input 
                              type="text" 
                              value={teamNames.right} 
                              onChange={(e) => setTeamNames(prev => ({...prev, right: e.target.value}))}
                              className="border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl font-bold text-gray-800 focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                              placeholder="np. Nauczyciele"
                          />
                      </div>
                  </div>

                  <div className="flex flex-col gap-4">
                      <button 
                          onClick={toggleFullscreen}
                          className="w-full py-4 rounded-xl font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors uppercase tracking-wider"
                      >
                          ⛶ Pełny Ekran
                      </button>
                      <button 
                          onClick={() => {
                              if (!teamNames.left.trim() || !teamNames.right.trim()) {
                                  alert("⚠️ Proszę wpisać nazwy obu drużyn!");
                                  return;
                              }
                              setIsGameStarted(true);
                          }}
                          className={clsx(
                              "w-full py-5 rounded-xl font-black text-2xl text-white shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2",
                              (!teamNames.left.trim() || !teamNames.right.trim()) 
                                ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400 transform-none shadow-none" 
                                : "bg-blue-900 hover:bg-blue-800 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                          )}
                      >
                          Rozpocznij Grę 🚀
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <Router>
      <div className="font-sans antialiased text-gray-900 bg-gray-100 min-h-screen selection:bg-blue-200 selection:text-blue-900">
        <Routes>
          <Route path="/" element={<Familiada scores={scores} setScores={setScores} teamNames={teamNames} />} />
          <Route path="/final" element={<Final scores={scores} setScores={setScores} teamNames={teamNames} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
