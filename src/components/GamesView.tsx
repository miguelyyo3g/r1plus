// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// 1. MOTOR DE TETRIS (Con Meta de Puntuación para ganar el nivel)
// ============================================================================
const TETROMINOES = [
  { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400' },
  { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' }
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

function TetrisGame({ level, onBack, onWin }: { level: number, onBack: () => void, onWin: (score: number) => void }) {
  const [piece, setPiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const targetScore = level * 50; // Fórmula de dificultad: 50 pts en lvl 1, 5000 en lvl 100

  useEffect(() => {
    if (!piece) spawnPiece();
  }, [piece]);

  const spawnPiece = () => {
    const randomTetromino = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    setPiece(randomTetromino);
    setPos({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomTetromino.shape[0].length / 2), y: 0 });
  };

  const moveDown = useCallback(() => {
    if (!piece) return;
    setPos(prev => ({ ...prev, y: prev.y + 1 }));
    
    // Prototipo: Cuando toca el suelo, sumamos puntos y sacamos otra pieza
    if (pos.y > BOARD_HEIGHT - 3) {
      const newScore = score + 10;
      setScore(newScore);
      if (newScore >= targetScore) {
        onWin(newScore); // ¡Ganamos el nivel!
      } else {
        spawnPiece();
      }
    }
  }, [piece, pos, score, targetScore, onWin]);

  useEffect(() => {
    const speed = Math.max(80, 500 - (level * 4)); // Fórmula de velocidad: Más nivel = más rápido
    const timer = setInterval(moveDown, speed);
    return () => clearInterval(timer);
  }, [moveDown, level]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 rounded-2xl p-4 relative overflow-hidden animate-in fade-in zoom-in-95">
      <div className="absolute top-4 left-4 flex justify-between w-full pr-8">
        <button onClick={onBack} className="w-10 h-10 bg-slate-800 text-white rounded-full font-black text-xl hover:bg-rose-500 transition">←</button>
        <div className="text-center">
          <div className="text-white font-black text-xl">NIVEL {level}</div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Meta: {targetScore} pts</div>
        </div>
        <div className="text-amber-400 font-black text-xl">{score}</div>
      </div>

      <div className="bg-slate-950 p-2 rounded-lg border-4 border-slate-700 mt-12 shadow-2xl relative">
        {/* Barra de progreso visual */}
        <div className="absolute -right-6 bottom-0 w-2 bg-slate-800 rounded-full h-full overflow-hidden border border-slate-700">
          <div className="bg-amber-400 w-full absolute bottom-0 transition-all duration-300" style={{ height: `${Math.min(100, (score/targetScore)*100)}%` }}></div>
        </div>

        <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] gap-[1px] bg-slate-800" style={{ width: '200px', height: '400px' }}>
          {Array.from({ length: 200 }).map((_, i) => {
            const x = i % BOARD_WIDTH;
            const y = Math.floor(i / BOARD_WIDTH);
            let isPiece = false; let pColor = '';
            if (piece && y >= pos.y && y < pos.y + piece.shape.length && x >= pos.x && x < pos.x + piece.shape[0].length) {
              if (piece.shape[y - pos.y][x - pos.x]) { isPiece = true; pColor = piece.color; }
            }
            return <div key={i} className={`w-full h-full ${isPiece ? pColor : 'bg-slate-900'} rounded-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`} />;
          })}
        </div>
      </div>

      {/* Botones táctiles */}
      <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-[250px]">
        <div />
        <button onClick={() => setPiece({...piece, shape: piece.shape[0].map((val, index) => piece.shape.map(row => row[index]).reverse())})} className="bg-slate-700 active:bg-slate-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">↻</button>
        <div />
        <button onClick={() => setPos(p => ({...p, x: Math.max(0, p.x - 1)}))} className="bg-slate-700 active:bg-slate-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">←</button>
        <button onClick={moveDown} className="bg-indigo-600 active:bg-indigo-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">↓</button>
        <button onClick={() => setPos(p => ({...p, x: Math.min(BOARD_WIDTH - piece.shape[0].length, p.x + 1)}))} className="bg-slate-700 active:bg-slate-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">→</button>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MOTOR DE SUDOKU (Prototipo visual generado por Nivel)
// ============================================================================
function SudokuGame({ level, onBack, onWin }: { level: number, onBack: () => void, onWin: (score: number) => void }) {
  // Fórmula: El nivel 1 quita 20 números, el nivel 100 quita 60 números
  const cellsToHide = Math.min(60, 20 + Math.floor(level * 0.4)); 
  
  return (
    <div className="flex flex-col items-center justify-start w-full h-full bg-slate-50 rounded-2xl p-4 relative overflow-y-auto animate-in slide-in-from-right-8">
      <div className="flex justify-between items-center w-full mb-6">
        <button onClick={onBack} className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full font-black text-xl hover:bg-slate-300 transition">←</button>
        <div className="text-center">
          <div className="text-slate-800 font-black text-xl">SUDOKU PRO</div>
          <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Nivel {level}</div>
        </div>
        <button onClick={() => onWin(level * 100)} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-300">Ganar (Dev)</button>
      </div>

      <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
        <div className="grid grid-cols-9 gap-[1px] bg-slate-800 border-4 border-slate-800">
          {Array.from({ length: 81 }).map((_, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const isRightBorder = col === 2 || col === 5;
            const isBottomBorder = row === 2 || row === 5;
            
            // Simulamos celdas vacías según la dificultad del nivel
            const isHidden = Math.random() * 81 < cellsToHide;
            const number = isHidden ? '' : Math.floor(Math.random() * 9) + 1;

            return (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center text-lg sm:text-xl font-bold bg-white
                  ${isRightBorder ? 'border-r-2 border-r-slate-800' : ''} 
                  ${isBottomBorder ? 'border-b-2 border-b-slate-800' : ''}
                  ${isHidden ? 'text-indigo-600 cursor-pointer hover:bg-indigo-50' : 'text-slate-800'}
                `}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="mt-6 text-sm text-slate-500 font-medium text-center px-4">
        Dificultad adaptativa: Este nivel tiene {cellsToHide} celdas ocultas basándose en el nivel {level}.
      </p>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL (HUB DE JUEGOS Y GESTOR DE PROGRESO)
// ============================================================================
export default function GamesView() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [coins, setCoins] = useState<number>(0);
  
  // Guardamos el progreso real
  const [progress, setProgress] = useState({
    sudoku: 1,
    sopa: 1,
    tetris: 1,
    candy: 1
  });

  // Modal de Victoria
  const [winModal, setWinModal] = useState<{ show: boolean, gameId: string, level: number, coins: number } | null>(null);

  // Cargar progreso del dispositivo (MVP antes de subir a Supabase)
  useEffect(() => {
    const savedProgress = localStorage.getItem('r1plus_games_progress');
    const savedCoins = localStorage.getItem('r1plus_coins');
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    if (savedCoins) setCoins(parseInt(savedCoins, 10));
  }, []);

  const games = [
    { id: 'sudoku', name: 'Sudoku Pro', icon: '🔢', color: 'bg-blue-500', hover: 'hover:bg-blue-600', desc: 'Entrena tu lógica', totalLevels: 100 },
    { id: 'sopa', name: 'Sopa de Letras', icon: '🔠', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', desc: 'Encuentra las palabras', totalLevels: 100 },
    { id: 'tetris', name: 'Tetris Clásico', icon: '🧱', color: 'bg-indigo-500', hover: 'hover:bg-indigo-600', desc: 'Encaja las piezas', totalLevels: 100 },
    { id: 'candy', name: 'Candy Match', icon: '🍬', color: 'bg-rose-500', hover: 'hover:bg-rose-600', desc: 'Une 3 iguales', totalLevels: 100 },
  ];

  // Lógica de ganar un nivel
  const handleWinLevel = (score: number) => {
    if (!activeGame || !selectedLevel) return;
    
    // Fórmula de recompensa: El nivel 1 da 10 monedas, el 100 da 1000 monedas
    const coinsWon = selectedLevel * 10; 
    
    const newProgress = { ...progress };
    // Si acaba de ganar su nivel más alto, desbloquea el siguiente
    if (selectedLevel === progress[activeGame as keyof typeof progress]) {
      newProgress[activeGame as keyof typeof progress] = Math.min(100, selectedLevel + 1);
    }

    const newCoins = coins + coinsWon;

    // Guardar estado y localStorage
    setProgress(newProgress);
    setCoins(newCoins);
    localStorage.setItem('r1plus_games_progress', JSON.stringify(newProgress));
    localStorage.setItem('r1plus_coins', newCoins.toString());

    // Mostrar modal de celebración
    setWinModal({ show: true, gameId: activeGame, level: selectedLevel, coins: coinsWon });
  };

  const closeWinModal = () => {
    setWinModal(null);
    setSelectedLevel(null); // Volvemos a la pantalla de niveles
  };

  // ---------------------------------------------------------
  // RENDERIZADO DEL JUEGO ACTIVO
  // ---------------------------------------------------------
  if (selectedLevel !== null && activeGame) {
    if (activeGame === 'tetris') return <TetrisGame level={selectedLevel} onBack={() => setSelectedLevel(null)} onWin={handleWinLevel} />;
    if (activeGame === 'sudoku') return <SudokuGame level={selectedLevel} onBack={() => setSelectedLevel(null)} onWin={handleWinLevel} />;
    
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center rounded-2xl border border-slate-200">
        <span className="text-6xl mb-4">🚧</span>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Juego en Desarrollo</h2>
        <p className="text-slate-500 font-medium mb-6 max-w-sm">Estamos programando el motor para el nivel {selectedLevel} de {games.find(g => g.id === activeGame)?.name}. ¡Estará disponible pronto!</p>
        <div className="flex gap-3">
          <button onClick={() => setSelectedLevel(null)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold transition">Volver</button>
          <button onClick={() => handleWinLevel(100)} className="px-6 py-3 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl font-bold transition">Forzar Victoria (Dev)</button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDERIZADO DEL SELECTOR DE 100 NIVELES
  // ---------------------------------------------------------
  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    const maxUnlocked = progress[activeGame as keyof typeof progress];

    return (
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-right-4">
        
        {/* MODAL DE VICTORIA SOBREPUESTO */}
        {winModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-3xl font-black text-slate-800 mb-1">¡Nivel Superado!</h2>
              <p className="text-slate-500 font-bold mb-6">Has completado el Nivel {winModal.level}</p>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-8 transform scale-110">
                <span className="block text-xs uppercase font-black text-amber-600 mb-1">Recompensa</span>
                <span className="text-4xl font-black text-amber-500">+ {winModal.coins} 🪙</span>
              </div>

              <button onClick={closeWinModal} className={`w-full py-4 ${game?.color} text-white rounded-xl font-black text-lg shadow-lg hover:opacity-90 transition`}>
                Continuar
              </button>
            </div>
          </div>
        )}

        <div className={`p-6 ${game?.color} text-white shrink-0 flex justify-between items-center shadow-md relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-10 text-9xl -mt-4 -mr-4 pointer-events-none">{game?.icon}</div>
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => setActiveGame(null)} className="w-10 h-10 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center font-bold text-xl transition">
              ←
            </button>
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">{game?.name}</h2>
              <p className="text-white/80 text-sm font-medium">100 Niveles de dificultad</p>
            </div>
          </div>
          <div className="bg-black/20 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5 relative z-10">
            {coins} 🪙
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
            {Array.from({ length: game?.totalLevels || 100 }).map((_, i) => {
              const level = i + 1;
              const isUnlocked = level <= maxUnlocked;
              const isCurrent = level === maxUnlocked;
              
              return (
                <button
                  key={level}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedLevel(level)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-2xl font-black text-lg sm:text-xl shadow-sm transition-all duration-300
                    ${!isUnlocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60' : ''}
                    ${isUnlocked && !isCurrent ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 cursor-pointer' : ''}
                    ${isCurrent ? `${game?.color} text-white shadow-md transform hover:scale-105 cursor-pointer ring-4 ring-indigo-200 ring-offset-2` : ''}
                  `}
                >
                  {isUnlocked ? level : '🔒'}
                  {isUnlocked && !isCurrent && level % 10 === 0 && <span className="absolute -top-1.5 -right-1.5 text-sm sm:text-base drop-shadow-md">🎁</span>}
                  {isCurrent && <span className="absolute -bottom-2 text-[10px] uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-full shadow-md">Jugar</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // VISTA PRINCIPAL: HUB DE JUEGOS
  // ---------------------------------------------------------
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm h-full flex flex-col overflow-hidden relative">
      <div className="shrink-0 flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">🎮 Sala Recreativa</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Supera niveles y gana monedas para tu cuenta.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl shadow-sm text-right flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Saldo Actual</span>
          <span className="font-black text-amber-500 text-xl flex items-center gap-1.5">{coins} 🪙</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full max-h-[600px]">
          {games.map(game => {
            const pctComplete = (progress[game.id as keyof typeof progress] / game.totalLevels) * 100;
            
            return (
              <button
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className={`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl text-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 ${game.color} ${game.hover} group`}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-300"></div>
                <span className="text-6xl sm:text-7xl mb-4 filter drop-shadow-md group-hover:scale-110 transition duration-300">{game.icon}</span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight z-10">{game.name}</h3>
                <p className="text-white/90 font-medium mt-1 text-sm sm:text-base z-10">{game.desc}</p>
                
                <div className="mt-6 w-full max-w-[200px] z-10">
                  <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                    <span>Nivel {progress[game.id as keyof typeof progress]}</span>
                    <span>100</span>
                  </div>
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
                    <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${pctComplete}%` }}></div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}