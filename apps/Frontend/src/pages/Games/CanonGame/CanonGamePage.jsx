import React, { useRef, useState, useEffect } from 'react';
import { CannonDuelGame } from './game.js';
import { MultiplayerClient } from './multiplayer.js';
import './style.css'; // The ported canon_game CSS

export default function CanonGamePage() {
  const canvasRef = useRef(null);
  const initialized = useRef(false);

  const [game, setGame] = useState(null);
  const [multiplayer, setMultiplayer] = useState(null);

  // UI States (similar to ui.js logic)
  const [screen, setScreen] = useState('menu'); // 'menu', 'setup-bot', 'setup-online', 'join-online', 'playing', 'overlay'
  const [hudVisible, setHudVisible] = useState(false);
  
  // Game Hud State
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [targetScore, setTargetScore] = useState(3);
  const [names, setNames] = useState({ left: 'Left', right: 'Right' });
  const [wind, setWind] = useState(0);
  
  // Room Status
  const [roomStatus, setRoomStatus] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // Overlay
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayBody, setOverlayBody] = useState('');

  // Setup Options
  const [botDiff, setBotDiff] = useState('normal');
  const [onlineTarget, setOnlineTarget] = useState(3);
  const [onlineTheme, setOnlineTheme] = useState('space');

  // Pseudo UI interface that game.js expects to call:
  const uiAdapter = {
    showScreen: (scr) => setScreen(scr),
    showHud: (visible) => setHudVisible(visible),
    setScores: (l, r, t, n) => {
      setScores({ left: l, right: r });
      if (t) setTargetScore(t);
      if (n) setNames(n);
    },
    setWind: (w) => setWind(w),
    setRoomStatus: (text, showBtn) => setRoomStatus(text), // Simplified
    showOverlay: (title, body) => {
      setOverlayTitle(title);
      setOverlayBody(body);
      setScreen('overlay');
    }
  };

  useEffect(() => {
    if (!canvasRef.current || initialized.current) return;
    initialized.current = true;

    const mp = new MultiplayerClient();
    const g = new CannonDuelGame(canvasRef.current, uiAdapter, mp);
    
    // Start loop
    g.lastTime = performance.now();
    requestAnimationFrame(g.loop);
    
    setGame(g);
    setMultiplayer(mp);

    // Support direct URL joining
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('roomId');
    if (urlRoomId) {
       setScreen("joining");
       mp.joinRoom(urlRoomId).then(res => {
         if (res.ok) {
           setRoomId(res.roomId);
           g.roomId = res.roomId;
           g.localSide = res.side;
           g.start("online");
           setRoomStatus(`Joined room ${res.roomId}. Press Ready when set.`);
         } else {
           setScreen("menu");
           alert(res.message);
         }
       });
    }

    return () => {
      // cleanup would be good, but single page app
    };
  }, []);

  // Handlers
  const playLocal = () => game?.start("local");
  const playBot = () => setScreen("setup-bot");
  const playOnline = () => setScreen("setup-online");
  const joinOnlineMenu = () => setScreen("join-online");

  const startBotMatch = () => {
    game?.start("bot", { difficulty: botDiff, targetScore: 3 });
  };

  const createRoom = async () => {
    setScreen("creating");
    const res = await multiplayer.createRoom(onlineTarget, onlineTheme);
    if (res.ok) {
      setRoomId(res.roomId);
      game.roomId = res.roomId;
      game.localSide = res.side;
      game.start("online", { targetScore: onlineTarget, theme: onlineTheme });
      setRoomStatus(`Room: ${res.roomId} - Waiting for opponent...`);
      // Update URL silently
      window.history.pushState({}, '', `/canon?roomId=${res.roomId}`);
    } else {
      setScreen("menu");
      alert("Failed to create room");
    }
  };

  const submitJoin = async () => {
    if (!joinCode) return;
    setScreen("joining");
    const res = await multiplayer.joinRoom(joinCode);
    if (res.ok) {
      setRoomId(res.roomId);
      game.roomId = res.roomId;
      game.localSide = res.side;
      game.start("online");
      setRoomStatus(`Joined room ${res.roomId}. Waiting for match to start...`);
      // Update URL silently
      window.history.pushState({}, '', `/canon?roomId=${res.roomId}`);
    } else {
      setScreen("join-online");
      alert(res.message);
    }
  };

  const handleReady = () => {
    multiplayer?.readyUp();
  };

  const backToMenu = () => {
    if (game) game.exitToMenu();
    window.history.pushState({}, '', '/canon');
    if (multiplayer?.room) {
      multiplayer.room.leave();
      multiplayer.room = null;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>

      {/* Menus Overlay */}
      <div className="canon-ui" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', color: '#fff', fontFamily: 'sans-serif' }}>
        
        {screen === 'menu' && (
          <div className="menu-box" style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#222', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2>Cannon Duel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={playLocal}>Local 1v1</button>
              <button onClick={playBot}>Play vs Bot</button>
              <button onClick={playOnline}>Create Online Room</button>
              <button onClick={joinOnlineMenu}>Join Room</button>
              <button onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</button>
            </div>
          </div>
        )}

        {screen === 'setup-bot' && (
          <div className="menu-box" style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#222', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2>Bot Setup</h2>
            <select value={botDiff} onChange={e => setBotDiff(e.target.value)} style={{ margin: '1rem', padding: '0.5rem' }}>
              <option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option><option value="expert">Expert</option>
            </select>
            <br/>
            <button onClick={startBotMatch}>Start Match</button>
            <button onClick={() => setScreen('menu')}>Back</button>
          </div>
        )}

        {screen === 'setup-online' && (
          <div className="menu-box" style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#222', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2>Online Setup</h2>
            <select value={onlineTarget} onChange={e => setOnlineTarget(parseInt(e.target.value))} style={{ margin: '1rem', padding: '0.5rem' }}>
              <option value={3}>First to 3</option><option value={5}>First to 5</option><option value={10}>First to 10</option>
            </select>
            <br/>
            <select value={onlineTheme} onChange={e => setOnlineTheme(e.target.value)} style={{ margin: '1rem', padding: '0.5rem' }}>
              <option value="space">Space</option><option value="jungle">Jungle</option><option value="desert">Desert</option>
            </select>
            <br/>
            <button onClick={createRoom}>Create Room</button>
            <button onClick={() => setScreen('menu')}>Back</button>
          </div>
        )}

        {screen === 'join-online' && (
          <div className="menu-box" style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#222', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
            <h2>Join Room</h2>
            <input type="text" placeholder="Room Code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ padding: '0.5rem', textTransform: 'uppercase' }} />
            <br/>
            <div style={{ marginTop: '1rem' }}>
              <button onClick={submitJoin}>Join</button>
              <button onClick={() => setScreen('menu')}>Back</button>
            </div>
          </div>
        )}

        {hudVisible && !['menu', 'setup-bot', 'setup-online', 'join-online', 'overlay'].includes(screen) && (
          <>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{names.left}: {scores.left}</div>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>{names.right}: {scores.right}</div>
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem', fontWeight: 'bold' }}>Target: {targetScore}</div>
            <div style={{ position: 'absolute', top: '3rem', left: '50%', transform: 'translateX(-50%)', fontSize: '1.2rem', color: wind > 0 ? '#4facfe' : '#ff9a9e' }}>Wind: {(wind * 100).toFixed(0)}</div>
            
            {roomStatus && (
               <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', padding: '1rem', borderRadius: '8px', pointerEvents: 'auto', textAlign: 'center' }}>
                 <div style={{ marginBottom: '8px' }}>{roomStatus}</div>
                 {roomId && !roomStatus.includes('Ready required') && !roomStatus.includes('Full') && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/canon?roomId=${roomId}`} 
                        style={{ padding: '0.4rem', fontSize: '0.9rem', width: '250px', background: '#333', color: '#fff' }} 
                        onClick={(e) => e.target.select()}
                      />
                      <button 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }} 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/canon?roomId=${roomId}`);
                          alert("Link Copied!");
                        }}
                      >Copy Link</button>
                    </div>
                 )}
                 {roomStatus.includes('Ready required') && <button onClick={handleReady} style={{ marginTop: '0.5rem' }}>I'm Ready</button>}
               </div>
            )}
            
            <button style={{ pointerEvents: 'auto', position: 'absolute', bottom: '1rem', left: '1rem' }} onClick={backToMenu}>Quit</button>
          </>
        )}

        {screen === 'overlay' && (
          <div className="menu-box" style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.85)', padding: '3rem', borderRadius: '8px', textAlign: 'center', border: '2px solid #555' }}>
            <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '2px 2px 0 #000' }}>{overlayTitle}</h1>
            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>{overlayBody}</p>
            <button onClick={backToMenu} style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.2rem' }}>Back to Menu</button>
          </div>
        )}

      </div>
    </div>
  );
}
