import React, { useState, useEffect } from 'react';
import './App.css';

// Color theme palette (matches requirements)
const PALETTE = {
  primary: '#1e88e5',
  secondary: '#42a5f5',
  accent: '#ff5252',
  background: '#1a1a1a',
  card: '#282c34',
  border: '#404040',
  text: '#fff',
  textSecondary: 'rgba(255,255,255,0.7)'
};

// BOARD HELPERS
const emptyBoard = () => Array(9).fill(null);

/**
 * PUBLIC_INTERFACE
 * Returns winner symbol ("X"/"O") or null; or returns "draw" if board is full with no winner.
 */
function calculateWinner(board) {
  const winlines = [
    [0,1,2], [3,4,5], [6,7,8], // rows
    [0,3,6], [1,4,7], [2,5,8], // cols
    [0,4,8], [2,4,6]           // diags
  ];
  for (const [a,b,c] of winlines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  }
  if (board.every(cell => cell)) return 'draw';
  return null;
}

/**
 * PUBLIC_INTERFACE
 * Returns best move index (for CPU), simple AI: win>block> center>corner>side.
 */
function cpuBestMove(board, cpuSymbol, userSymbol) {
  // 1. Can win?
  for (let i=0;i<9;i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = cpuSymbol;
      if (calculateWinner(copy) === cpuSymbol) return i;
    }
  }
  // 2. Can block user win?
  for (let i=0;i<9;i++) {
    if (!board[i]) {
      const copy = [...board];
      copy[i] = userSymbol;
      if (calculateWinner(copy) === userSymbol) return i;
    }
  }
  // 3. Take center
  if (!board[4]) return 4;
  // 4. Take a corner
  for (let idx of [0,2,6,8]) if (!board[idx]) return idx;
  // 5. Take any side
  for (let idx of [1,3,5,7]) if (!board[idx]) return idx;
  return null; // Should never happen if called when moves remain
}

/** PUBLIC_INTERFACE
 * Square Button component for the board cell.
 */
function Square({ value, onClick, highlight }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      aria-label={value || 'empty'}
      style={{
        color: value === 'O' ? PALETTE.primary : value === 'X' ? PALETTE.accent : PALETTE.text,
        borderColor: highlight ? PALETTE.accent : PALETTE.border,
        background: highlight ? 'rgba(255,82,82,0.13)' : 'transparent',
      }}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

/** PUBLIC_INTERFACE
 * The board grid. Highlights a win if provided.
 */
function Board({ board, onCellClick, winningLine }) {
  function isHighlight(idx) {
    return winningLine && winningLine.includes(idx);
  }
  return (
    <div className="ttt-board">
      {board.map((v, idx) =>
        <Square
          key={idx}
          value={v}
          onClick={() => onCellClick(idx)}
          highlight={isHighlight(idx)}
        />
      )}
    </div>
  );
}

/** PUBLIC_INTERFACE
 * The menu bar, minimal branding & theme+menu.
 */
function MenuBar({ theme, toggleTheme }) {
  return (
    <nav className="ttt-menu-bar">
      <div className="ttt-logo" title="Tic Tac Toe">
        <span role="img" aria-label="TicTacToe" style={{fontSize:'1.2em'}}>🧩</span>
        <span style={{ marginLeft: 8, fontWeight: 700, letterSpacing: 2 }}>TIC TAC TOE</span>
      </div>
      <button className="ttt-theme-btn" onClick={toggleTheme} aria-label={'Toggle theme'}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  );
}

/** PUBLIC_INTERFACE
 * Main app with all game logic and UI.
 */
function App() {
  // Theme
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Game mode: "one" (single player vs CPU) or "two"
  const [gameMode, setGameMode] = useState('one');

  // Symbol as user in single player ("X"/"O"), always "X" for P1 in two player
  const [userSymbol, setUserSymbol] = useState('X');
  // Current turn: "X" or "O"
  const [turn, setTurn] = useState('X');
  // Board state
  const [board, setBoard] = useState(emptyBoard());
  // "winner": ("X"/"O" or "draw" or null), winnerLine: indices
  const [winner, setWinner] = useState(null);
  const [winnerLine, setWinnerLine] = useState([]);
  // Score tracking: {X: n, O: n, draw: n}
  const [score, setScore] = useState({X: 0, O: 0, draw: 0});

  // Resets board but preserves scores, keeps current user symbol/first move
  const handleResetBoard = () => {
    setBoard(emptyBoard());
    setWinner(null);
    setWinnerLine([]);
    setTurn('X');
  };

  // Full reset
  const handleFullReset = () => {
    setScore({X: 0, O: 0, draw: 0});
    setUserSymbol('X');
    setBoard(emptyBoard());
    setWinner(null);
    setWinnerLine([]);
    setTurn('X');
    setGameMode('one');
  };

  /**
   * PUBLIC_INTERFACE
   * Handles click on a board cell.
   */
  const handleCellClick = (idx) => {
    // If already filled or game ended
    if (board[idx] || winner) return;
    // If CPU turn in 1P mode, do nothing (UI blocks anyway)
    // Place piece
    const nextBoard = [...board];
    nextBoard[idx] = turn;
    setBoard(nextBoard);
    const result = calculateWinner(nextBoard);

    // Check win and record line if any
    if (result && result !== 'draw') {
      // Find the winning line
      const winlines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
      ];
      const winning = winlines.find(l => 
        l.every(i => nextBoard[i] === result)
      );
      setWinnerLine(winning);
      setWinner(result);
      setScore(sc => ({...sc, [result]: sc[result]+1}));
    } else if (result === 'draw') {
      setWinner('draw');
      setWinnerLine([]);
      setScore(sc => ({...sc, draw: sc.draw+1}));
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  /**
   * PUBLIC_INTERFACE
   * CPU move for single player mode, after user move and if not over.
   */
  useEffect(() => {
    if (
      gameMode === 'one' &&
      !winner && 
      turn !== userSymbol
    ) {
      // "CPU" plays after a small delay
      const cpuMove = () => {
        const idx = cpuBestMove(board, turn, userSymbol);
        if (idx !== null && !board[idx] && !winner) {
          handleCellClick(idx);
        }
      };
      // Simulate thinking
      const t = setTimeout(cpuMove, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [turn, board, winner, gameMode, userSymbol]);

  // When game mode changes: reset all
  useEffect(() => {
    handleFullReset();
    // eslint-disable-next-line
  }, [gameMode]);

  // Responsive: set font-size based on width for better touch
  useEffect(() => {
    function updateFont() {
      const vw = window.innerWidth;
      document.documentElement.style.setProperty('--ttt-fz',
        vw < 450 ? '7vw'
        : vw < 700 ? '6vw'
        : '2.7vw'
      );
    }
    updateFont();
    window.addEventListener('resize', updateFont);
    return () => window.removeEventListener('resize', updateFont);
  }, []);

  // For new match, after win/draw, next game, swap starter in single player
  const handlePlayAgain = () => {
    setBoard(emptyBoard());
    setWinner(null);
    setWinnerLine([]);
    // Only swap first player if 2-player (lets go next)
    setTurn('X');
  };

  // Build message
  let statusMessage;
  if (winner === 'draw') statusMessage = "It's a draw!";
  else if (winner) statusMessage = `Player ${winner} wins!`;
  else if (gameMode === 'one') {
    statusMessage = (turn === userSymbol) ?
      'Your move' : 'CPU is thinking...';
  } else {
    statusMessage = `Player ${turn}'s move`;
  }

  return (
    <div className="App ttt-root">
      <MenuBar theme={theme} toggleTheme={toggleTheme} />
      <div className="ttt-container">
        <div className="ttt-controls">
          <div className="ttt-modes">
            <ModeButton label="Single Player" accent={gameMode==='one'} onClick={()=>setGameMode('one')} />
            <ModeButton label="Two Player" accent={gameMode==='two'} onClick={()=>setGameMode('two')} />
          </div>
          <div className="ttt-scoreboard">
            <ScoreBox symbol="X" score={score.X} />
            <ScoreBox symbol="O" score={score.O} />
            <ScoreBox symbol="🤝" score={score.draw} label="Draws" />
          </div>
          {gameMode === 'one' && (
            <div className="ttt-symbol-choice">
              <span className="ttt-label">You play as:</span>
              <SymbolButton symbol="X" active={userSymbol==='X'} onClick={() => setUserSymbol('X')} disabled={board.some(Boolean) || winner}/>
              <SymbolButton symbol="O" active={userSymbol==='O'} onClick={() => setUserSymbol('O')} disabled={board.some(Boolean) || winner}/>
            </div>
          )}
        </div>
        <div className="ttt-board-section">
          <Board board={board} onCellClick={handleCellClick} winningLine={winnerLine}/>
          <div className="ttt-status">{statusMessage}</div>
          <div className="ttt-btn-row">
            <button className="ttt-btn" style={{background: PALETTE.primary}} onClick={handleResetBoard} disabled={!board.some(Boolean) || !!winner}>
              Reset
            </button>
            <button className="ttt-btn" style={{background: PALETTE.secondary}} onClick={handlePlayAgain} disabled={!winner}>
              Play Again
            </button>
            <button className="ttt-btn" style={{background: PALETTE.accent}} onClick={handleFullReset}>
              New Game
            </button>
          </div>
        </div>
        <footer className="ttt-footer">
          <span>Modern Tic Tac Toe &copy; {new Date().getFullYear()} | <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">Built with React</a></span>
        </footer>
      </div>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Score display box for X/O/draw
 */
function ScoreBox({ symbol, score, label }) {
  let color = symbol === "X" ? PALETTE.accent :
              symbol === "O" ? PALETTE.primary : PALETTE.textSecondary;
  return (
    <div className="ttt-score-box" style={{borderColor: color, color}}>
      <span className="ttt-score-label">{symbol}{label ? <small>{'\u00a0'}{label}</small> : ''}</span>
      <span className="ttt-score">{score}</span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Mode selection button
 */
function ModeButton({label, accent, onClick}) {
  return <button
    className="ttt-mode-btn"
    style={{
      borderColor: accent ? PALETTE.accent : PALETTE.border,
      color: accent ? PALETTE.accent : PALETTE.textSecondary,
      background: accent ? 'rgba(255,82,82,0.09)' : 'transparent'
    }}
    onClick={onClick}>{label}</button>;
}

/**
 * PUBLIC_INTERFACE
 * Button to pick X or O symbol for the player
 */
function SymbolButton({symbol, active, onClick, disabled}) {
  return <button
    className="ttt-symbol-btn"
    onClick={onClick}
    disabled={disabled}
    style={{
      color: symbol === "X" ? PALETTE.accent : PALETTE.primary,
      borderColor: active ? PALETTE.accent : PALETTE.border,
      background: active ? 'rgba(255,82,82,0.12)' : 'transparent',
      opacity: disabled ? 0.5 : 1,
    }}
    aria-pressed={active}
  >{symbol}</button>;
}

export default App;
