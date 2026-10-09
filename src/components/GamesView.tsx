// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// MOTOR BÁSICO DE TETRIS (Para demostrar funcionalidad)
// ============================================================================
const TETROMINOES = [
  { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400' }, // I
  { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' }, // T
  { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' }, // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' }, // L
  { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' }  // Z
];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

function TetrisGame({ level, onBack }: { level: number, onBack: () => void }) {
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill(Array(BOARD_WIDTH).fill(null)));
  const [piece, setPiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Inicializar pieza
  useEffect(() => {
    if (!piece && !gameOver) spawnPiece();
  }, [piece, gameOver]);

  const spawnPiece = () => {
    const randomTetromino = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    setPiece(randomTetromino);
    setPos({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(randomTetromino.shape[0].length / 2), y: 0 });
  };

  const moveDown = useCallback(() => {
    if (gameOver || !piece) return;
    setPos(prev => ({ ...prev, y: prev.y + 1 }));
    // NOTA: Para un Tetris real aquí iría la lógica de colisiones y fijar piezas.
    // Esto es un prototipo visual funcional para el framework.
    if (pos.y > BOARD_HEIGHT - 3) {
      setScore(s => s + 10);
      spawnPiece();
    }
  }, [piece, pos, gameOver]);

  useEffect(() => {
    const speed = Math.max(100, 1000 - (level * 50)); // Más nivel = más rápido
    const timer = setInterval(moveDown, speed);
    return () => clearInterval(timer);
  }, [moveDown, level]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute top-4 left-4 flex gap-4 w-full">
        <button onClick={onBack} className="w-10 h-10 bg-slate-800 text-white rounded-full font-black text-xl hover:bg-rose-500 transition">←</button>
        <div className="text-white font-black text-xl">NIVEL {level}</div>
        <div className="text-amber-400 font-black text-xl ml-auto pr-8">PUNTOS: {score}</div>
      </div>

      {/* Tablero de Tetris visual */}
      <div className="bg-slate-950 p-2 rounded-lg border-4 border-slate-700 mt-12 shadow-2xl">
        <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] gap-[1px] bg-slate-800" style={{ width: '200px', height: '400px' }}>
          {Array.from({ length: 200 }).map((_, i) => {
            const x = i % BOARD_WIDTH;
            const y = Math.floor(i / BOARD_WIDTH);
            let isPiece = false;
            let pColor = '';
            
            if (piece && y >= pos.y && y < pos.y + piece.shape.length && x >= pos.x && x < pos.x + piece.shape[0].length) {
              if (piece.shape[y - pos.y][x - pos.x]) {
                isPiece = true;
                pColor = piece.color;
              }
            }
            return <div key={i} className={`w-full h-full ${isPiece ? pColor : 'bg-slate-900'} rounded-sm`} />;
          })}
        </div>
      </div>

      {/* Controles para Móvil */}
      <div className="grid grid-cols-3 gap-2 mt-6 w-full max-w-[250px]">
        <div />
        <button onClick={() => setPiece({...piece, shape: piece.shape[0].map((val, index) => piece.shape.map(row => row[index]).reverse())})} className="bg-slate-700 active:bg-slate-600 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">↻</button>
        <div />
        <button onClick={() => setPos(p => ({...p, x: Math.max(0, p.x - 1)}))} className="bg-slate-700 active:bg-slate-600 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">←</button>
        <button onClick={moveDown} className="bg-indigo-600 active:bg-indigo-500 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">↓</button>
        <button onClick={() => setPos(p => ({...p, x: Math.min(BOARD_WIDTH - piece.shape[0].length, p.x + 1)}))} className="bg-slate-700 active:bg-slate-600 text-white p-4 rounded-xl font-bold text-2xl shadow-lg">→</button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL DEL MÓDULO DE JUEGOS
// ============================================================================
export default function GamesView() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // Niveles simulados (En el futuro esto vendrá de Supabase para saber cuáles ha superado el usuario)
  const userProgress = {
    sudoku: 5,
    sopa: 12,
    tetris: 1,
    candy: 1
  };

  const games = [
    { id: 'sudoku', name: 'Sudoku Pro', icon: '🔢', color: 'bg-blue-500', desc: 'Entrena tu lógica', totalLevels: 100 },
    { id: 'sopa', name: 'Sopa de Letras', icon: '🔠', color: 'bg-emerald-500', desc: 'Encuentra las palabras', totalLevels: 100 },
    { id: 'tetris', name: 'Tetris Clásico', icon: '🧱', color: 'bg-indigo-500', desc: 'Encaja las piezas', totalLevels: 100 },
    { id: 'candy', name: 'Candy Match', icon: '🍬', color: 'bg-rose-500', desc: 'Une 3 iguales', totalLevels: 100 },
  ];

  // Si hay un nivel seleccionado, mostramos el juego
  if (selectedLevel !== null && activeGame) {
    if (activeGame === 'tetris') return <TetrisGame level={selectedLevel} onBack={() => setSelectedLevel(null)} />;
    
    // Placeholder para el resto de juegos por ahora
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center rounded-2xl border border-slate-200">
        <span className="text-6xl mb-4">🚧</span>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Juego en Desarrollo</h2>
        <p className="text-slate-500 font-medium mb-6 max-w-sm">Estamos programando el nivel {selectedLevel} de {games.find(g => g.id === activeGame)?.name}. ¡Estará disponible muy pronto!</p>
        <button onClick={() => setSelectedLevel(null)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition">
          Volver a Niveles
        </button>
      </div>
    );
  }

  // Si hay un juego seleccionado, mostramos la selección de 100 niveles
  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    const maxUnlocked = userProgress[activeGame as keyof typeof userProgress];

    return (
      <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className={`p-6 ${game?.color} text-white shrink-0 flex items-center gap-4 shadow-md`}>
          <button onClick={() => setActiveGame(null)} className="w-10 h-10 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center font-bold text-xl transition">
            ←
          </button>
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">{game?.icon} {game?.name}</h2>
            <p className="text-white/80 text-sm font-medium">Selecciona un nivel para jugar</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
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
                    relative aspect-square flex flex-col items-center justify-center rounded-2xl font-black text-lg shadow-sm transition-all duration-300
                    ${!isUnlocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60' : ''}
                    ${isUnlocked && !isCurrent ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer' : ''}
                    ${isCurrent ? `${game?.color} text-white shadow-lg transform hover:scale-105 cursor-pointer ring-4 ring-indigo-200 ring-offset-2` : ''}
                  `}
                >
                  {isUnlocked ? level : '🔒'}
                  {isUnlocked && !isCurrent && level % 10 === 0 && <span className="absolute -top-2 -right-2 text-sm">🎁</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vista principal: Selector de los 4 Juegos
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="shrink-0 text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800">🎮 Sala de Juegos</h2>
        <p className="text-slate-500 font-medium">Juega, supera niveles y gana monedas para tu cuenta.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full max-h-[600px]">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-3xl text-white shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1 ${game.color} group`}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-300"></div>
              <span className="text-7xl mb-4 filter drop-shadow-md group-hover:scale-110 transition duration-300">{game.icon}</span>
              <h3 className="text-2xl font-black tracking-tight">{game.name}</h3>
              <p className="text-white/90 font-medium mt-1">{game.desc}</p>
              
              <div className="mt-6 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30 text-sm font-bold">
                {userProgress[game.id as keyof typeof userProgress]} / {game.totalLevels} Niveles
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}