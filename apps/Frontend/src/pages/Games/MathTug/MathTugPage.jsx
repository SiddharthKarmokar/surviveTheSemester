import React, { useState, useEffect, useRef } from 'react';
import { MathTugMultiplayer } from './multiplayer';
import './style.css';

const BACKEND_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000';

export default function MathTugPage() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'browser', 'waiting', 'playing', 'ended'
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Player');
  
  // Game State
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [timer, setTimer] = useState(10);
  const [flagPos, setFlagPos] = useState(0);
  const [questions, setQuestions] = useState({ q1: "", q2: "" });
  const [localSide, setLocalSide] = useState("");
  const [winnerMessage, setWinnerMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [ans1, setAns1] = useState("");
  const [ans2, setAns2] = useState("");

  const mpRef = useRef(null);
  const p1CharRef = useRef(null);
  const p2CharRef = useRef(null);
  const listenersBoundRef = useRef(false);
  
  const [browsingRooms, setBrowsingRooms] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  // Deep join logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
      handleJoinByLink(roomId);
    }
  }, []);

  const handleJoinByLink = async (roomId) => {
    setScreen('waiting');
    setErrorMsg('');
    setInviteLink('');
    if (!mpRef.current) mpRef.current = new MathTugMultiplayer();
    const res = await mpRef.current.joinRoom(roomId, playerName);
    if (!res.ok) {
      setErrorMsg(res.message);
      setScreen('menu');
      return;
    }
    setupRoomListeners();
  };

  const createRoom = async () => {
    setScreen('waiting');
    setErrorMsg('');
    if (!mpRef.current) mpRef.current = new MathTugMultiplayer();
    
    const res = await mpRef.current.createRoom(playerName);
    if (!res.ok) {
      setErrorMsg(res.message);
      setScreen('menu');
      return;
    }
    
    const link = `${window.location.origin}/mathtug?roomId=${res.roomId}`;
    setInviteLink(link);
    window.history.pushState({}, '', `/mathtug?roomId=${res.roomId}`);
    setupRoomListeners();
  };

  const browseRooms = async () => {
    setScreen('browser');
    setBrowsingRooms(true);
    setErrorMsg("");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/games/mathtug/rooms`);
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
    setErrorMsg('');
    setInviteLink('');
    if (!mpRef.current) mpRef.current = new MathTugMultiplayer();
    
    const res = await mpRef.current.joinRoom(roomId, playerName);
    if (!res.ok) {
        setErrorMsg(res.message);
        setScreen('browser');
        return;
    }
    window.history.pushState({}, '', `/mathtug?roomId=${res.roomId}`);
    setupRoomListeners();
  };

  const setupRoomListeners = () => {
    if (!mpRef.current || listenersBoundRef.current) return;
    mpRef.current.clearHandlers();
    listenersBoundRef.current = true;

    mpRef.current.on("connected", ({ side }) => {
      setLocalSide(side);
    });

    mpRef.current.on("state-change", (state) => {
      const players = state?.players;
      const localSessionId = mpRef.current?.sessionId;
      setScores({
        left: getScore(players, "left", localSessionId),
        right: getScore(players, "right", localSessionId)
      });
      setFlagPos(state.flagPos);
      setTimer(state.timer);
      setQuestions({ q1: state.q1Str, q2: state.q2Str });
      
      if (state.phase === "playing" && screen !== "playing") {
        setScreen("playing");
      }
    });

    mpRef.current.on("pull-anim", ({ side }) => {
       animatePull(side);
    });

    mpRef.current.on("game-over", ({ winner }) => {
       setScreen("ended");
       if (winner === localSide) setWinnerMessage("You Win!");
       else if (winner === "left" || winner === "right") setWinnerMessage("You Lost!");
       else setWinnerMessage("Match Terminated!");
    });

    mpRef.current.on("opponent-left", () => {
       setScreen("ended");
       setWinnerMessage("Opponent Disconnected!");
    });
  };

  // Helper map sessionId to side
  const getScore = (players, checkSide, localSessionId) => {
      if (!players || typeof players.forEach !== 'function') return 0;
      let localScore = 0;
      let opponentScore = 0;

      players.forEach((player, sessionId) => {
        if (sessionId === localSessionId) localScore = Number(player?.score || 0);
        else opponentScore = Number(player?.score || 0);
      });

      if (!localSide) {
        const ordered = [];
        players.forEach((player) => ordered.push(Number(player?.score || 0)));
        return checkSide === 'left' ? (ordered[0] || 0) : (ordered[1] || 0);
      }

      if (localSide === 'left') return checkSide === 'left' ? localScore : opponentScore;
      return checkSide === 'right' ? localScore : opponentScore;
  };

  const animatePull = (side) => {
    const char = side === "left" ? p1CharRef.current : p2CharRef.current;
    if (char) {
      char.style.transform = "translateX(20px)";
      setTimeout(() => {
        if(char) char.style.transform = "translateX(0px)";
      }, 200);
    }
  };

  const handleSubmit = (e, side) => {
    e.preventDefault();
    if (side !== localSide) return;

    const val = side === "left" ? parseInt(ans1) : parseInt(ans2);
    if (!isNaN(val)) {
       mpRef.current.submitAnswer(localSide, val);
    }
    if (side === "left") setAns1("");
    else setAns2("");
  };

  const quitGame = () => {
    if (mpRef.current) {
        mpRef.current.leave();
        mpRef.current.clearHandlers();
    }
    listenersBoundRef.current = false;
    setLocalSide('');
    setScores({ left: 0, right: 0 });
    setFlagPos(0);
    setTimer(10);
    setQuestions({ q1: '', q2: '' });
    setWinnerMessage('');
    setInviteLink('');
    window.history.pushState({}, '', '/mathtug');
    setScreen('menu');
  };

  const leaveToDashboard = () => {
    if (mpRef.current) {
      mpRef.current.leave();
      mpRef.current.clearHandlers();
    }
    listenersBoundRef.current = false;
    window.location.href = '/';
  };

  return (
    <div className="mathtug-ui">
      
      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className="main-menu flex-center-col full-screen">
          <h1 className="mathtug-title">Math Tug-of-War</h1>
          <input
            className="mathtug-input mathtug-name-input"
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
          />
          {errorMsg && <p className="mathtug-error">{errorMsg}</p>}
          <button className="menu-btn" onClick={createRoom}>Create Room</button>
          <button className="menu-btn" onClick={browseRooms}>Browse Rooms</button>
          <button className="menu-btn mathtug-danger-btn" onClick={leaveToDashboard}>Back to Dashboard</button>
        </div>
      )}

      {/* BROWSER SCREEN */}
      {screen === 'browser' && (
        <div className="browser-menu flex-center-col full-screen">
          <h2 className="mathtug-subtitle">Available Rooms</h2>
          {errorMsg && <p className="mathtug-error">{errorMsg}</p>}
          <div className="room-list">
            {browsingRooms ? <p className="mathtug-muted">Loading...</p> : 
              availableRooms.length === 0 ? <p className="mathtug-muted">No open rooms found.</p> :
              availableRooms.map(room => (
                <div key={room.roomId} className="room-entry mathtug-room-entry">
                   <span><strong>{room.metadata?.creatorName || 'Player'}'s Room</strong> <br/><small>{room.clients}/2 Players</small></span>
                   <button className="mathtug-join-btn" disabled={room.clients >= 2} onClick={() => joinRoom(room.roomId)}>Join</button>
                </div>
              ))}
          </div>
          <button className="menu-btn mathtug-top-gap" onClick={() => { setScreen('menu'); setErrorMsg(''); }}>Back</button>
        </div>
      )}

      {/* WAITING SCREEN */}
      {screen === 'waiting' && (
        <div className="waiting-menu flex-center-col full-screen">
           <h2 className="mathtug-subtitle">Waiting for opponent...</h2>
          {inviteLink && localSide === 'left' && (
             <div className="mathtug-invite-box">
                <p className="mathtug-invite-label">Invite your friend:</p>
                <div className="mathtug-invite-row">
                  <input className="mathtug-input" type="text" readOnly value={inviteLink} />
                  <button className="mathtug-copy-btn" onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy</button>
                 </div>
             </div>
          )}
           <button className="menu-btn mathtug-danger-btn mathtug-top-gap-lg" onClick={quitGame}>Cancel</button>
        </div>
      )}

      {/* GAME UI */}
      {(screen === 'playing' || screen === 'ended') && (
        <div className="game-container full-screen">
           <header className="game-header">
               <div className="player-panel">
                   <h3>Player 1 {localSide === "left" && "(You)"}</h3>
                   <div className="score">Score: {scores.left}</div>
               </div>
               
               <div className="timer-box">
                  <div id="timer">{timer}</div>
               </div>

               <div className="player-panel">
                   <h3>Player 2 {localSide === "right" && "(You)"}</h3>
                   <div className="score">Score: {scores.right}</div>
               </div>
           </header>

           <div className="game-area">
              <div className="ground"></div>

              <div className="rope"></div>
              
              <div id="flag" className="flag" style={{ left: `${240 + flagPos}px` }}></div>

              <div id="p1char" className="character p1-char" ref={p1CharRef}>🤸</div>
              <div id="p2char" className="character p2-char" ref={p2CharRef}>🏋️</div>
           </div>

           <div className="controls">
              {/* Player 1 Controls */}
              <div className={`control-panel ${localSide !== "left" ? "disabled-panel" : ""}`}>
                 <div className="question-box">{questions.q1 || "?"}</div>
                 <form onSubmit={(e) => handleSubmit(e, "left")}>
                    <input 
                      type="number" 
                      placeholder="Answer" 
                      value={ans1}
                      disabled={localSide !== "left" || screen === 'ended'}
                      onChange={(e) => setAns1(e.target.value)}
                    />
                    <button type="submit" disabled={localSide !== "left" || screen === 'ended'}>Submit</button>
                 </form>
              </div>

              {/* Player 2 Controls */}
              <div className={`control-panel ${localSide !== "right" ? "disabled-panel" : ""}`}>
                 <div className="question-box">{questions.q2 || "?"}</div>
                 <form onSubmit={(e) => handleSubmit(e, "right")}>
                    <input 
                      type="number" 
                      placeholder="Answer" 
                      value={ans2}
                      disabled={localSide !== "right" || screen === 'ended'}
                      onChange={(e) => setAns2(e.target.value)}
                    />
                    <button type="submit" disabled={localSide !== "right" || screen === 'ended'}>Submit</button>
                 </form>
              </div>
           </div>

           {/* OVERLAY */}
           {screen === 'ended' && (
              <div id="overlay" className="overlay active">
                 <div id="message" className="message">{winnerMessage}</div>
                  <button onClick={quitGame} className="menu-btn mathtug-top-gap">Back to Menu</button>
              </div>
           )}

        </div>
      )}
    </div>
  );
}
