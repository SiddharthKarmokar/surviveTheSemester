import React, { useState, useEffect, useRef } from 'react';
import { BinarySudokuMultiplayer } from './multiplayer';
import './style.css';

const BACKEND_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000';

function validLine(arr, size) {
  if (arr.includes("")) return false;
  let zeros = arr.filter(v => v === 0).length;
  let ones = arr.filter(v => v === 1).length;
  if (zeros !== size / 2 || ones !== size / 2) return false;
  for (let i = 0; i < size - 2; i++) {
    if (arr[i] === arr[i + 1] && arr[i] === arr[i + 2]) return false;
  }
  return true;
}

function unique(lines) {
  let set = new Set();
  for (let line of lines) {
    let str = line.join("");
    if (set.has(str)) return false;
    set.add(str);
  }
  return true;
}

function isValid(boardData, size) {
  for (let i = 0; i < size; i++) {
    let row = boardData[i];
    let col = boardData.map(r => r[i]);
    if (!validLine(row, size) || !validLine(col, size)) return false;
  }
  if (!unique(boardData)) return false;
  let columns = [];
  for (let i = 0; i < size; i++) {
    columns.push(boardData.map(r => r[i]));
  }
  if (!unique(columns)) return false;
  return true;
}

function solvedAgainstSolution(boardData, solutionData, size) {
  if (!Array.isArray(boardData) || !Array.isArray(solutionData)) return false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (boardData[r]?.[c] === '' || boardData[r]?.[c] !== solutionData[r]?.[c]) {
        return false;
      }
    }
  }
  return true;
}

export default function BinarySudokuPage() {
  const [screen, setScreen] = useState('menu'); 
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Player');
  
  const [size, setSize] = useState(6);
  const [difficulty, setDifficulty] = useState('medium');

  // Game State
  const [puzzleRaw, setPuzzleRaw] = useState("");
  const [solutionRaw, setSolutionRaw] = useState("");
  const [timer, setTimer] = useState(0);
  const [winner, setWinner] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copyStatus, setCopyStatus] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentBoard, setCurrentBoard] = useState([]);
  const [opponentBoard, setOpponentBoard] = useState([]);
  const [hasOpponent, setHasOpponent] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  const mpRef = useRef(null);
  const listenersBoundRef = useRef(false);
  const startedPuzzleRef = useRef('');
  const autoJoinHandledRef = useRef(false);
  const joinByLinkInFlightRef = useRef(false);
  
  const [browsingRooms, setBrowsingRooms] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [waitingMode, setWaitingMode] = useState(''); // 'creating' | 'joining'

  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId && !autoJoinHandledRef.current) {
      const joinGuardKey = `bs-autojoin-${roomId}`;
      const recentlyHandled = sessionStorage.getItem(joinGuardKey) === '1';
      if (recentlyHandled) {
        return;
      }
      sessionStorage.setItem(joinGuardKey, '1');
      autoJoinHandledRef.current = true;
      handleJoinByLink(roomId);

      // Keep guard briefly to prevent duplicate StrictMode remount joins.
      setTimeout(() => {
        try {
          sessionStorage.removeItem(joinGuardKey);
        } catch {
          // no-op
        }
      }, 8000);
    }
  }, []);

  const handleJoinByLink = async (roomId) => {
    if (joinByLinkInFlightRef.current) return;
    joinByLinkInFlightRef.current = true;

    setScreen('waiting');
    setWaitingMode('joining');
    setErrorMsg('');
    setInviteLink('');
    try {
      if (!mpRef.current) mpRef.current = new BinarySudokuMultiplayer();
      const res = await mpRef.current.joinRoom(roomId, playerName);
      if (!res.ok) {
        setErrorMsg(res.message);
        setScreen('menu');
        return;
      }
      setupRoomListeners();
    } finally {
      joinByLinkInFlightRef.current = false;
    }
  };

  const createRoom = async () => {
    setScreen('waiting');
    setWaitingMode('creating');
    setErrorMsg('');
    setCopyStatus('');
    setIsCreatingRoom(true);
    if (!mpRef.current) mpRef.current = new BinarySudokuMultiplayer();
    try {
      const res = await mpRef.current.createRoom(playerName, size, difficulty);
      if (!res.ok) {
        setErrorMsg(res.message);
        setScreen('menu');
        return;
      }

      const roomId = res.roomId || mpRef.current?.room?.roomId || mpRef.current?.room?.id;
      if (!roomId) {
        setErrorMsg('Room created, but invite link could not be generated. Please retry.');
        setScreen('menu');
        return;
      }

      const link = `${window.location.origin}/binarysudoku?roomId=${roomId}`;
      setInviteLink(link);
      window.history.pushState({}, '', `/binarysudoku?roomId=${roomId}`);
      setupRoomListeners();
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const browseRooms = async () => {
    setScreen('browser');
    setBrowsingRooms(true);
    setErrorMsg("");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/games/binarysudoku/rooms`);
      if (!resp.ok) throw new Error("Could not fetch rooms");
      const data = await resp.json();
      setAvailableRooms(data);
    } catch(err) {
      setErrorMsg(err.message);
    } finally {
      setBrowsingRooms(false);
    }
  };

  const joinRoom = async (roomId) => {
    setScreen('waiting');
    setWaitingMode('joining');
    setErrorMsg('');
    setInviteLink('');
    setCopyStatus('');
    if (!mpRef.current) mpRef.current = new BinarySudokuMultiplayer();
    
    const res = await mpRef.current.joinRoom(roomId, playerName);
    if (!res.ok) {
        setErrorMsg(res.message);
        setScreen('browser');
        return;
    }
    window.history.pushState({}, '', `/binarysudoku?roomId=${res.roomId}`);
    setupRoomListeners();
  };

  const setupRoomListeners = () => {
    if (!mpRef.current || listenersBoundRef.current) return;
    mpRef.current.clearHandlers();
    listenersBoundRef.current = true;

    mpRef.current.on("state-change", (state) => {
      setTimer(state.timer);
      setSize(state.size);
      setHasOpponent((state?.players?.size || 0) > 1);
      
      if (state.puzzleRaw && state.phase === "playing") {
         setScreen("playing");
         setPuzzleRaw(state.puzzleRaw);
         setSolutionRaw(state.solutionRaw);

         if (startedPuzzleRef.current !== state.puzzleRaw) {
            startedPuzzleRef.current = state.puzzleRaw;
            const puz = JSON.parse(state.puzzleRaw);
            setCurrentBoard(puz);
          setOpponentBoard([]);
            setIsSolved(false);
         }
      }

      if (state.winner) {
          setWinner(state.winner);
      }

      if (state.phase === 'ended') {
        setScreen('ended');
      }
    });

    mpRef.current.on("opponent-board-update", ({ sessionId, boardData }) => {
      if (sessionId !== mpRef.current.sessionId) {
          setOpponentBoard(boardData);
      }
    });

    mpRef.current.on("player-finished", ({ message }) => {
      // Optional toast for user finished
    });

    mpRef.current.on("game-over", () => {
       setScreen("ended");
    });

    mpRef.current.on("opponent-left", ({ name }) => {
       setHasOpponent(false);
       setScreen("ended");
       setWinner(mpRef.current ? mpRef.current.sessionId : "You");
       setErrorMsg(`${name || 'Opponent'} disconnected!`);
    });

    mpRef.current.on("connection-error", ({ message }) => {
      setErrorMsg(message || 'Failed to connect to room');
      setScreen('menu');
    });
  };

  const changeValue = (r, c) => {
     if (isSolved || screen !== "playing") return;
      if (!puzzleRaw || !solutionRaw) return;
      const originalPuzzle = JSON.parse(puzzleRaw);
      const solutionBoard = JSON.parse(solutionRaw);
     if (originalPuzzle[r][c] !== "") return; // Cannot edit original fixed cells

     const newBoard = JSON.parse(JSON.stringify(currentBoard));
     if(newBoard[r][c] === "") newBoard[r][c] = 0;
     else if(newBoard[r][c] === 0) newBoard[r][c] = 1;
     else newBoard[r][c] = "";

     setCurrentBoard(newBoard);
     mpRef.current.sendBoardUpdate(newBoard);

      // Solve only when board matches server-provided solution and is structurally valid.
      if (isValid(newBoard, size) && solvedAgainstSolution(newBoard, solutionBoard, size)) {
         setIsSolved(true);
         mpRef.current.sendBoardSolved();
     }
  };

  const quitGame = () => {
    if (mpRef.current) {
      mpRef.current.leave();
      mpRef.current.clearHandlers();
    }
    listenersBoundRef.current = false;
    startedPuzzleRef.current = '';
    setPuzzleRaw('');
    setSolutionRaw('');
    setCurrentBoard([]);
    setOpponentBoard([]);
    setHasOpponent(false);
    setWinner('');
    setErrorMsg('');
    setTimer(0);
    setIsSolved(false);
    setInviteLink('');
    setCopyStatus('');
    setWaitingMode('');
    window.history.pushState({}, '', '/binarysudoku');
    setScreen('menu');
  };

  const copyInvite = async () => {
    const roomIdFromUrl = new URLSearchParams(window.location.search).get('roomId');
    const fallbackLink = roomIdFromUrl ? `${window.location.origin}/binarysudoku?roomId=${roomIdFromUrl}` : '';
    const roomIdFromClient = mpRef.current?.room?.roomId || mpRef.current?.room?.id;
    const clientLink = roomIdFromClient ? `${window.location.origin}/binarysudoku?roomId=${roomIdFromClient}` : '';
    const linkToCopy = inviteLink || clientLink || fallbackLink;
    if (!linkToCopy) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        const temp = document.createElement('textarea');
        temp.value = linkToCopy;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopyStatus('Link copied');
      setTimeout(() => setCopyStatus(''), 1500);
    } catch {
      setCopyStatus('Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const deriveInviteLink = () => {
    const roomIdFromUrl = new URLSearchParams(window.location.search).get('roomId');
    const roomIdFromClient = mpRef.current?.room?.roomId || mpRef.current?.room?.id;
    const fallbackRoomId = roomIdFromClient || roomIdFromUrl;
    if (!fallbackRoomId) return '';
    return `${window.location.origin}/binarysudoku?roomId=${fallbackRoomId}`;
  };

  const leaveToDashboard = () => {
    if (mpRef.current) {
      mpRef.current.leave();
      mpRef.current.clearHandlers();
    }
    listenersBoundRef.current = false;
    setWaitingMode('');
    window.location.href = '/';
  };

  // Safe renderer for identical classes as vanilla CSS
  const renderBoard = (board, isOpponent) => {
     if (!board || board.length === 0) return null;
     const og = puzzleRaw ? JSON.parse(puzzleRaw) : [];

     return (
        <div className="game-board" style={{ gridTemplateColumns: `repeat(${size}, 50px)` }}>
           {board.map((row, r) => 
               row.map((cell, c) => {
                  const isFixed = og[r] && og[r][c] !== "";
                  return (
                      <div 
                         key={`${r}-${c}`} 
                         className={`cell ${isFixed ? 'fixed' : ''}`}
                         onClick={!isOpponent ? () => changeValue(r, c) : undefined}
                         style={{ opacity: isOpponent ? 0.7 : 1, cursor: isOpponent ? 'default' : (isFixed ? 'default' : 'pointer') }}
                      >
                         {cell}
                      </div>
                  );
               })
           )}
        </div>
     );
  };

  return (
    <div className="bski-ui">
      {(() => {
        const shownInviteLink = inviteLink || deriveInviteLink();

        return (
          <>
      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className="main-menu flex-center-col full-screen">
          <h1 className="bs-title">Binary Sudoku Race</h1>
          
          <div className="menu-controls bs-card">
              <input
                className="bs-input"
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
              />
              
              <div className="bs-inline-row">
                  <label>Grid Size:</label>
                  <select className="bs-select" value={size} onChange={e=>setSize(parseInt(e.target.value))}>
                      {[4,6,8,10,12].map(s => <option key={s} value={s}>{s}x{s}</option>)}
                  </select>
              </div>

              <div className="bs-inline-row">
                  <label>Difficulty:</label>
                  <select className="bs-select" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                  </select>
              </div>

              {errorMsg && <p className="bs-error">{errorMsg}</p>}
              
              <button className="menu-btn" onClick={createRoom} disabled={isCreatingRoom}>
                {isCreatingRoom ? 'Creating...' : 'Create Room'}
              </button>
              <button className="menu-btn" onClick={browseRooms}>Browse Rooms</button>
              <button className="menu-btn bs-danger-btn" onClick={leaveToDashboard}>Exit Game</button>
          </div>
        </div>
      )}

      {/* BROWSER SCREEN */}
      {screen === 'browser' && (
        <div className="browser-menu flex-center-col full-screen">
          <h2 className="bs-subtitle">Available Rooms</h2>
          {errorMsg && <p className="bs-error">{errorMsg}</p>}
          <div className="room-list">
            {browsingRooms ? <p className="bs-muted">Loading...</p> : 
              availableRooms.length === 0 ? <p className="bs-muted">No open rooms found.</p> :
              availableRooms.map(room => (
                <div key={room.roomId} className="room-entry bs-room-entry">
                   <span>
                       <strong>{room.metadata?.creatorName || 'Player'}'s Race</strong> <br/>
                       <small>{room.clients}/2 P ({room.metadata?.size || 6}x{room.metadata?.size || 6})</small>
                   </span>
                   <button className="bs-join-btn" disabled={room.clients >= 2} onClick={() => joinRoom(room.roomId)}>Join</button>
                </div>
              ))}
          </div>
          <button className="menu-btn bs-top-gap" onClick={() => { setScreen('menu'); setErrorMsg(''); }}>Back</button>
        </div>
      )}

      {/* WAITING SCREEN */}
      {screen === 'waiting' && (
        <div className="waiting-menu flex-center-col full-screen">
          <h2 className="bs-subtitle">{waitingMode === 'joining' ? 'Joining room...' : 'Waiting for challenger...'}</h2>
         {waitingMode === 'creating' && shownInviteLink && (
             <div className="bs-card bs-invite-box">
                <p className="bs-invite-label">Invite Link:</p>
                <div className="bs-invite-row">
              <input className="bs-input" type="text" readOnly value={shownInviteLink} />
                <button className="bs-copy-btn" onClick={copyInvite}>Copy</button>
                 </div>
               {copyStatus && <p className="bs-copy-status">{copyStatus}</p>}
             </div>
          )}
         {waitingMode === 'creating' && !shownInviteLink && <p className="bs-muted">{isCreatingRoom ? 'Generating invite link...' : 'Link unavailable. Try cancel and create room again.'}</p>}
         {waitingMode === 'joining' && <p className="bs-muted">Establishing connection with host room...</p>}
           <button className="menu-btn bs-danger-btn bs-top-gap-lg" onClick={quitGame}>Cancel</button>
        </div>
      )}

      {/* GAME UI */}
      {(screen === 'playing' || screen === 'ended') && (
        <div className="game-container bs-game-container full-screen">
           
           <div className="player-section bs-panel">
               <h2>Your Board</h2>
               {renderBoard(currentBoard, false)}
             <div className="status bs-status">
               Time Elapsed: <span className="bs-timer-value">{timer}</span>s
               </div>
             {isSolved && <div className="bs-completed">COMPLETED!</div>}
             <button onClick={quitGame} className="menu-btn bs-danger-btn bs-top-gap">Surrender</button>
           </div>

           <div className="opponent-section bs-panel">
               <h2>Opponent's Board</h2>
               {hasOpponent ? renderBoard(opponentBoard, true) : <p className="bs-muted">Waiting for opponent to connect...</p>}
             <div className="bs-muted bs-top-gap-sm">{hasOpponent ? 'Live Progress...' : 'No opponent data yet'}</div>
           </div>

           {/* OVERLAY */}
           {screen === 'ended' && (
            <div id="overlay" className="overlay active">
             <div id="message" className="message bs-message">
                     {winner === mpRef.current?.sessionId ? "🏆 You Won the Race!" : (!errorMsg ? "❌ You Lost!" : errorMsg)}
                 </div>
             <button onClick={quitGame} className="menu-btn bs-top-gap">Back to Menu</button>
              </div>
           )}
        </div>
      )}
          </>
        );
      })()}
    </div>
  );
}
