// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// 1. MOTOR TETRIS REAL
// ============================================================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' }
};

const createEmptyBoard = () => Array.from(Array(BOARD_HEIGHT), () => Array(BOARD_WIDTH).fill(null));

function TetrisGame({ level, onBack, onWin }: { level: number, onBack: () => void, onWin: (score: number) => void }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [piece, setPiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const targetScore = level * 150; // Meta: Nivel 1 = 150pts, Nivel 10 = 1500pts

  const spawnPiece = useCallback(() => {
    const tetrominos = 'IJLOSTZ';
    const randTetromino = TETROMINOES[tetrominos[Math.floor(Math.random() * tetrominos.length)] as keyof typeof TETROMINOES];
    setPiece(randTetromino);
    setPos({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randTetromino.shape[0].length / 2), y: 0 });
  }, []);

  useEffect(() => { if (!piece && !gameOver) spawnPiece(); }, [piece, gameOver, spawnPiece]);

  // Detector de colisiones reales
  const checkCollision = (shape: any[][], x: number, y: number, currentBoard: any[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newY = y + r;
          const newX = x + c;
          if (newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH || (newY >= 0 && currentBoard[newY][newX] !== null)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockPiece = useCallback(() => {
    if (!piece) return;
    const newBoard = board.map(row => [...row]);
    let gameIsOver = false;

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          if (pos.y + r < 0) { gameIsOver = true; } // Tocó el techo
          else { newBoard[pos.y + r][pos.x + c] = piece.color; }
        }
      }
    }

    if (gameIsOver) {
      setGameOver(true);
      return;
    }

    // Borrar líneas completas
    let linesCleared = 0;
    const filteredBoard = newBoard.filter(row => row.some(cell => cell === null));
    linesCleared = BOARD_HEIGHT - filteredBoard.length;
    const newEmptyRows = Array.from(Array(linesCleared), () => Array(BOARD_WIDTH).fill(null));
    const finalBoard = [...newEmptyRows, ...filteredBoard];

    setBoard(finalBoard);
    
    // Puntuación: 10pts por pieza + 100pts por línea
    const newScore = score + 10 + (linesCleared * 100);
    setScore(newScore);
    setPiece(null);

    if (newScore >= targetScore) onWin(newScore);

  }, [piece, pos, board, score, targetScore, onWin]);

  const moveDown = useCallback(() => {
    if (gameOver || !piece) return;
    if (!checkCollision(piece.shape, pos.x, pos.y + 1, board)) {
      setPos(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      lockPiece();
    }
  }, [piece, pos, board, gameOver, lockPiece]);

  // Controles
  const moveLeft = () => { if (piece && !gameOver && !checkCollision(piece.shape, pos.x - 1, pos.y, board)) setPos(p => ({...p, x: p.x - 1})); };
  const moveRight = () => { if (piece && !gameOver && !checkCollision(piece.shape, pos.x + 1, pos.y, board)) setPos(p => ({...p, x: p.x + 1})); };
  const rotatePiece = () => {
    if (!piece || gameOver) return;
    const rotatedShape = piece.shape[0].map((_: any, index: number) => piece.shape.map((row: any[]) => row[index]).reverse());
    if (!checkCollision(rotatedShape, pos.x, pos.y, board)) setPiece({ ...piece, shape: rotatedShape });
  };
  const dropPiece = () => {
    if (!piece || gameOver) return;
    let newY = pos.y;
    while (!checkCollision(piece.shape, pos.x, newY + 1, board)) { newY++; }
    setPos({ ...pos, y: newY });
  };

  useEffect(() => {
    const speed = Math.max(100, 800 - (level * 20)); 
    const timer = setInterval(moveDown, speed);
    return () => clearInterval(timer);
  }, [moveDown, level]);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full bg-slate-900 rounded-2xl p-4 relative overflow-hidden animate-in fade-in">
      {/* Cabecera Info */}
      <div className="flex justify-between w-full">
        <button onClick={onBack} className="w-10 h-10 bg-slate-800 text-white rounded-full font-black hover:bg-rose-500 transition shrink-0">←</button>
        <div className="text-center">
          <div className="text-white font-black text-lg">TETRIS LVL {level}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Meta: {targetScore}</div>
        </div>
        <div className="text-amber-400 font-black text-xl w-10 text-right">{score}</div>
      </div>

      {/* Tablero de Juego Real */}
      <div className="bg-slate-950 p-2 rounded-lg border-4 border-slate-700 shadow-2xl relative mt-4">
        {/* Barra progreso vertical */}
        <div className="absolute -right-5 bottom-0 w-1.5 bg-slate-800 rounded-full h-full border border-slate-700 overflow-hidden">
          <div className="bg-amber-400 w-full absolute bottom-0 transition-all duration-300" style={{ height: `${Math.min(100, (score/targetScore)*100)}%` }}></div>
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 z-10 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
            <span className="text-white font-black text-2xl mb-4">GAME OVER</span>
            <button onClick={() => { setBoard(createEmptyBoard()); setScore(0); setGameOver(false); setPiece(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Reintentar</button>
          </div>
        )}

        <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] gap-[1px] bg-slate-800" style={{ width: '200px', height: '400px' }}>
          {board.map((row, y) => row.map((cell, x) => {
            let color = cell ? cell : 'bg-slate-900';
            if (piece && y >= pos.y && y < pos.y + piece.shape.length && x >= pos.x && x < pos.x + piece.shape[0].length) {
              if (piece.shape[y - pos.y][x - pos.x] !== 0) { color = piece.color; }
            }
            return <div key={`${y}-${x}`} className={`w-full h-full ${color} rounded-[1px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`} />;
          }))}
        </div>
      </div>

      {/* Mando Táctil */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 mt-4 pb-2">
        <button onClick={rotatePiece} className="col-span-3 bg-slate-700 active:bg-slate-600 text-white p-3 rounded-xl font-bold text-xl shadow-lg mb-2">↻ Girar</button>
        <button onClick={moveLeft} className="bg-slate-700 active:bg-slate-600 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">←</button>
        <button onClick={dropPiece} className="bg-rose-600 active:bg-rose-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">⏬</button>
        <button onClick={moveRight} className="bg-slate-700 active:bg-slate-600 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">→</button>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MOTOR SUDOKU REAL
// ============================================================================
// Un sudoku base válido resuelto.
const BASE_SUDOKU = [
  4,3,5, 2,6,9, 7,8,1,
  6,8,2, 5,7,1, 4,9,3,
  1,9,7, 8,3,4, 5,6,2,
  8,2,6, 1,9,5, 3,4,7,
  3,7,4, 6,8,2, 9,1,5,
  9,5,1, 7,4,3, 6,2,8,
  5,1,9, 3,2,6, 8,7,4,
  2,4,8, 9,5,7, 1,3,6,
  7,6,3, 4,1,8, 2,5,9
];

function SudokuGame({ level, onBack, onWin }: { level: number, onBack: () => void, onWin: (score: number) => void }) {
  const [board, setBoard] = useState<number[]>([]);
  const [initialBoard, setInitialBoard] = useState<number[]>([]);
  const [solvedBoard, setSolvedBoard] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  
  // Generar tablero en base al nivel
  useEffect(() => {
    // Para que no sea siempre el mismo, barajamos la asignación de números (1->5, 2->9, etc)
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    const newSolved = BASE_SUDOKU.map(n => nums[n - 1]);
    
    // Dificultad: Nivel 1 quita 20 números, Nivel 100 quita 60 números
    const cellsToHide = Math.min(60, 20 + Math.floor(level * 0.4));
    const newInitial = [...newSolved];
    
    // Quitar números aleatoriamente
    let hidden = 0;
    while (hidden < cellsToHide) {
      const rIdx = Math.floor(Math.random() * 81);
      if (newInitial[rIdx] !== 0) {
        newInitial[rIdx] = 0;
        hidden++;
      }
    }
    
    setSolvedBoard(newSolved);
    setInitialBoard([...newInitial]);
    setBoard([...newInitial]);
  }, [level]);

  // Pulsar un número en el teclado
  const handleInput = (num: number) => {
    if (selectedCell === null || initialBoard[selectedCell] !== 0) return;
    const newBoard = [...board];
    newBoard[selectedCell] = num;
    setBoard(newBoard);
    
    // Comprobar si hemos ganado
    if (newBoard.every((cell, idx) => cell === solvedBoard[idx])) {
      onWin(level * 100);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full h-full bg-slate-50 rounded-2xl p-4 relative animate-in fade-in">
      <div className="flex justify-between items-center w-full mb-4">
        <button onClick={onBack} className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full font-black hover:bg-slate-300 transition">←</button>
        <div className="text-center">
          <div className="text-slate-800 font-black text-xl">SUDOKU</div>
          <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Nivel {level}</div>
        </div>
        <button onClick={() => onWin(level * 100)} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-300">Ganar (Dev)</button>
      </div>

      {/* Tablero Jugable */}
      <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-slate-800 w-full max-w-[320px]">
        <div className="grid grid-cols-9 bg-slate-800 gap-[1px]">
          {board.map((cell, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const isRightBorder = col === 2 || col === 5;
            const isBottomBorder = row === 2 || row === 5;
            const isInitial = initialBoard[i] !== 0;
            const isSelected = selectedCell === i;
            
            return (
              <div 
                key={i} 
                onClick={() => !isInitial && setSelectedCell(i)}
                className={`
                  aspect-square flex items-center justify-center text-lg sm:text-xl font-bold bg-white cursor-pointer select-none transition-colors
                  ${isRightBorder ? 'border-r-2 border-r-slate-800' : ''} 
                  ${isBottomBorder ? 'border-b-2 border-b-slate-800' : ''}
                  ${isSelected ? 'bg-indigo-200 text-indigo-900 ring-inset ring-2 ring-indigo-500' : ''}
                  ${isInitial ? 'text-slate-800 bg-slate-50' : 'text-indigo-600'}
                  ${!isInitial && !isSelected ? 'hover:bg-indigo-50' : ''}
                `}
              >
                {cell !== 0 ? cell : ''}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Teclado Numérico */}
      <div className="grid grid-cols-5 gap-2 mt-6 w-full max-w-[320px]">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button 
            key={num} 
            onClick={() => handleInput(num)}
            className="bg-white border border-slate-200 shadow-sm rounded-xl py-3 text-xl font-black text-slate-700 active:bg-indigo-100 active:text-indigo-700 active:scale-95 transition"
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => handleInput(0)}
          className="bg-slate-200 border border-slate-300 shadow-sm rounded-xl py-3 text-sm font-bold text-slate-700 active:bg-slate-300 active:scale-95 transition flex items-center justify-center"
        >
          Borrar
        </button>
      </div>
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
  
  const [progress, setProgress] = useState({
    sudoku: 1,
    sopa: 1,
    tetris: 1,
    candy: 1
  });

  const [winModal, setWinModal] = useState<{ show: boolean, gameId: string, level: number, coins: number } | null>(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem('r1plus_games_progress');
    const savedCoins = localStorage.getItem('r1plus_coins');
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    if (savedCoins) setCoins(parseInt(savedCoins, 10));
  }, []);

  const games = [
    { id: 'sudoku', name: 'Sudoku Pro', icon: '🔢', color: 'bg-blue-500', hover: 'hover:bg-blue-600', desc: 'Entrena tu lógica', totalLevels: 100 },
    { id: 'tetris', name: 'Tetris Clásico', icon: '🧱', color: 'bg-indigo-500', hover: 'hover:bg-indigo-600', desc: 'Encaja las piezas', totalLevels: 100 },
    { id: 'sopa', name: 'Sopa de Letras', icon: '🔠', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600', desc: 'Próximamente', totalLevels: 100 },
    { id: 'candy', name: 'Candy Match', icon: '🍬', color: 'bg-rose-500', hover: 'hover:bg-rose-600', desc: 'Próximamente', totalLevels: 100 },
  ];

  const handleWinLevel = (score: number) => {
    if (!activeGame || !selectedLevel) return;
    const coinsWon = selectedLevel * 10; 
    const newProgress = { ...progress };
    
    if (selectedLevel === progress[activeGame as keyof typeof progress]) {
      newProgress[activeGame as keyof typeof progress] = Math.min(100, selectedLevel + 1);
    }
    const newCoins = coins + coinsWon;

    setProgress(newProgress);
    setCoins(newCoins);
    localStorage.setItem('r1plus_games_progress', JSON.stringify(newProgress));
    localStorage.setItem('r1plus_coins', newCoins.toString());
    setWinModal({ show: true, gameId: activeGame, level: selectedLevel, coins: coinsWon });
  };

  const closeWinModal = () => {
    setWinModal(null);
    setSelectedLevel(null); 
  };

  // ---------------------------------------------------------
  // RENDER JUEGO ACTIVO
  // ---------------------------------------------------------
  if (selectedLevel !== null && activeGame) {
    if (activeGame === 'tetris') return <TetrisGame level={selectedLevel} onBack={() => setSelectedLevel(null)} onWin={handleWinLevel} />;
    if (activeGame === 'sudoku') return <SudokuGame level={selectedLevel} onBack={() => setSelectedLevel(null)} onWin={handleWinLevel} />;
    
    // Juegos en desarrollo (Sopa y Candy)
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center rounded-2xl border border-slate-200">
        <span className="text-6xl mb-4">🚧</span>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Juego en Desarrollo</h2>
        <p className="text-slate-500 font-medium mb-6 max-w-sm">Estamos programando la lógica para el nivel {selectedLevel} de {games.find(g => g.id === activeGame)?.name}. ¡Estará listo en la próxima actualización!</p>
        <button onClick={() => setSelectedLevel(null)} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold transition">Volver</button>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER SELECTOR NIVELES
  // ---------------------------------------------------------
  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    const maxUnlocked = progress[activeGame as keyof typeof progress];

    return (
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-right-4">
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
              <button onClick={closeWinModal} className={`w-full py-4 ${game?.color} text-white rounded-xl font-black text-lg shadow-lg hover:opacity-90 transition`}>Continuar</button>
            </div>
          </div>
        )}

        <div className={`p-4 sm:p-6 ${game?.color} text-white shrink-0 flex justify-between items-center shadow-md relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-10 text-9xl -mt-4 -mr-4 pointer-events-none">{game?.icon}</div>
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <button onClick={() => setActiveGame(null)} className="w-8 h-8 sm:w-10 sm:h-10 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center font-bold text-xl transition">←</button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">{game?.name}</h2>
              <p className="text-white/80 text-xs sm:text-sm font-medium">100 Niveles de dificultad</p>
            </div>
          </div>
          <div className="bg-black/20 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5 relative z-10">{coins} 🪙</div>
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