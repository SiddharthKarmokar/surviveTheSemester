import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MathTugMultiplayer } from './multiplayer';
import './style.css';
import logoBlack from '../../../assests/logos/logo_black.svg';

const BACKEND_URL = import.meta.env.VITE_GAME_SERVER_URL || 'http://localhost:3000';

export default function MathTugPage() {
  const user = useSelector((state) => state.user.currentUser);
  const [screen, setScreen] = useState('menu');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Player');
  const [scores, setScores] = useState({ you: 0, opponent: 0 });
  const [timer, setTimer] = useState(60);
  const [localSide, setLocalSide] = useState('');
  const [questionText, setQuestionText] = useState('Waiting for first question...');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answerInput, setAnswerInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [winnerMessage, setWinnerMessage] = useState('');
  const [standings, setStandings] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [browsingRooms, setBrowsingRooms] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  const mpRef = useRef(null);
  const listenersBoundRef = useRef(false);
  const autoJoinHandledRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId && !autoJoinHandledRef.current) {
      const joinGuardKey = `mt-autojoin-${roomId}`;
      const recentlyHandled = sessionStorage.getItem(joinGuardKey) === '1';
      if (recentlyHandled) return;

      sessionStorage.setItem(joinGuardKey, '1');
      autoJoinHandledRef.current = true;
      handleJoinByLink(roomId);

      setTimeout(() => {
        try {
          sessionStorage.removeItem(joinGuardKey);
        } catch {
          // no-op
        }
      }, 8000);
    }
  }, []);

  const buildStandingsFromState = (players, localSessionId) => {
    if (!players || typeof players.forEach !== 'function') return [];

    const rows = [];
    players.forEach((player, sessionId) => {
      rows.push({
        sessionId,
        name: player?.name || (sessionId === localSessionId ? 'You' : 'Opponent'),
        solved: Number(player?.score || 0),
        totalTimeMs: Number(player?.totalTimeMs || 0)
      });
    });

    return rows.sort((a, b) => {
      if (b.solved !== a.solved) return b.solved - a.solved;
      return a.totalTimeMs - b.totalTimeMs;
    });
  };

  const handleJoinByLink = async (roomId) => {
    setScreen('waiting');
    setErrorMsg('');
    setInviteLink('');
    if (!mpRef.current) mpRef.current = new MathTugMultiplayer();
    setupRoomListeners();
    const res = await mpRef.current.joinRoom(roomId, playerName, user?.id);
    if (!res.ok) {
      setErrorMsg(res.message);
      setScreen('menu');
      return;
    }
  };

  const createRoom = async () => {
    setScreen('waiting');
    setErrorMsg('');
    if (!mpRef.current) mpRef.current = new MathTugMultiplayer();
    setupRoomListeners();

    const res = await mpRef.current.createRoom(playerName, user?.id);
    if (!res.ok) {
      setErrorMsg(res.message);
      setScreen('menu');
      return;
    }

    const link = `${window.location.origin}/mathtug?roomId=${res.roomId}`;
    setInviteLink(link);
    window.history.pushState({}, '', `/mathtug?roomId=${res.roomId}`);
  };

  const browseRooms = async () => {
    setScreen('browser');
    setBrowsingRooms(true);
    setErrorMsg('');
    try {
      const resp = await fetch(`${BACKEND_URL}/api/games/mathTug/rooms`);
      if (!resp.ok) throw new Error('Could not fetch rooms');
      const data = await resp.json();
      setAvailableRooms(data);
    } catch (err) {
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
    setupRoomListeners();

    const res = await mpRef.current.joinRoom(roomId, playerName, user?.id);
    if (!res.ok) {
      setErrorMsg(res.message);
      setScreen('browser');
      return;
    }
    window.history.pushState({}, '', `/mathtug?roomId=${res.roomId}`);
  };

  const setupRoomListeners = () => {
    if (!mpRef.current || listenersBoundRef.current) return;
    mpRef.current.clearHandlers();
    listenersBoundRef.current = true;

    mpRef.current.on('connected', ({ side }) => {
      setLocalSide(side);
    });

    mpRef.current.on('state-change', (state) => {
      const players = state?.players;
      const localSessionId = mpRef.current?.sessionId;
      setScores(getScore(players, localSessionId));
      setTimer(Number(state?.timer || 0));
      setTotalQuestions(Number(state?.totalQuestions || 10));

      if (state.phase === 'playing') {
        setScreen('playing');
      }

      if (state.phase === 'ended') {
        const derivedStandings = buildStandingsFromState(players, localSessionId);
        const fallbackWinner = derivedStandings[0] || null;

        setScreen('ended');
        setStandings(derivedStandings);

        if (!fallbackWinner) {
          setWinnerMessage('Match ended without a winner.');
        } else if ((state?.winnerSessionId || fallbackWinner.sessionId) === localSessionId) {
          setWinnerMessage('You win! Highest solved count and best time.');
        } else {
          setWinnerMessage(`${state?.winner || fallbackWinner.name || 'Opponent'} wins this round.`);
        }
      }
    });

    mpRef.current.on('question-update', (payload) => {
      setTotalQuestions(Number(payload?.totalQuestions || 10));
      setQuestionIndex(Number(payload?.currentIndex || 0));
      setQuestionText(payload?.done ? 'All questions solved. Waiting for result...' : (payload?.questionText || 'Question unavailable'));
      setFeedbackMsg('');
    });

    mpRef.current.on('answer-feedback', (payload) => {
      if (payload?.correct) {
        setAnswerInput('');
      }
      setFeedbackMsg(payload?.message || '');
    });

    mpRef.current.on('game-over', ({ winnerSessionId, winnerName, standings: resultStandings = [] }) => {
      const localSessionId = mpRef.current?.sessionId;
      setScreen('ended');

      if (!winnerSessionId) {
        setWinnerMessage('Match ended without a winner.');
      } else if (winnerSessionId === localSessionId) {
        setWinnerMessage('You win! Highest solved count and best time.');
      } else {
        setWinnerMessage(`${winnerName || 'Opponent'} wins this round.`);
      }

      setStandings(Array.isArray(resultStandings) ? resultStandings : []);
    });

    mpRef.current.on('opponent-left', () => {
      setScreen('ended');
      setWinnerMessage('Opponent Disconnected!');
    });
  };

  const getScore = (players, localSessionId) => {
    if (!players || typeof players.forEach !== 'function') return { you: 0, opponent: 0 };
    let localScore = 0;
    let opponentScore = 0;

    players.forEach((player, sessionId) => {
      if (sessionId === localSessionId) localScore = Number(player?.score || 0);
      else opponentScore = Number(player?.score || 0);
    });

    return { you: localScore, opponent: opponentScore };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(answerInput, 10);
    if (!isNaN(val)) {
      mpRef.current.submitAnswer(val);
    }
  };

  const quitGame = () => {
    if (mpRef.current) {
      mpRef.current.leave();
      mpRef.current.clearHandlers();
    }
    listenersBoundRef.current = false;
    setLocalSide('');
    setScores({ you: 0, opponent: 0 });
    setTimer(60);
    setQuestionText('Waiting for first question...');
    setQuestionIndex(0);
    setTotalQuestions(10);
    setAnswerInput('');
    setFeedbackMsg('');
    setWinnerMessage('');
    setStandings([]);
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
      <div className="mathtug-brand-corner">
        <img src={logoBlack} alt="Survive The Semester" className="mathtug-brand-logo" />
      </div>
      {screen === 'menu' && (
        <div className="main-menu flex-center-col full-screen">
          <div className="mathtug-card mathtug-hero-card">
            <p className="mathtug-eyebrow">Mental tug match</p>
            <div className="mathtug-symbol-row" aria-hidden="true">
              <span>+</span>
              <span>x</span>
              <span>=</span>
            </div>
            <h1 className="mathtug-title">Math Tug-of-War</h1>
            <p className="mathtug-subcopy">Solve fast, pull hard, and drag the round to your side.</p>
            <input
              className="mathtug-input mathtug-name-input"
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={16}
            />
            {errorMsg && <p className="mathtug-error">{errorMsg}</p>}
            <div className="mathtug-action-stack">
              <button className="menu-btn mathtug-primary-btn" onClick={createRoom}>Create Room</button>
              <button className="menu-btn" onClick={browseRooms}>Browse Rooms</button>
              <button className="menu-btn mathtug-danger-btn" onClick={leaveToDashboard}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'browser' && (
        <div className="browser-menu flex-center-col full-screen">
          <div className="mathtug-card mathtug-browser-card">
            <p className="mathtug-eyebrow">Open matches</p>
            <div className="mathtug-symbol-row" aria-hidden="true">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
            <h2 className="mathtug-subtitle">Available Rooms</h2>
            {errorMsg && <p className="mathtug-error">{errorMsg}</p>}
            <div className="room-list">
              {browsingRooms ? <p className="mathtug-muted">Loading...</p> :
                availableRooms.length === 0 ? <p className="mathtug-muted">No open rooms found.</p> :
                availableRooms.map((room) => (
                  <div key={room.roomId} className="room-entry mathtug-room-entry">
                    <span><strong>{room.metadata?.creatorName || 'Player'}&apos;s Room</strong> <br /><small>{room.clients}/2 Players</small></span>
                    <button className="mathtug-join-btn" disabled={room.clients >= 2} onClick={() => joinRoom(room.roomId)}>Join</button>
                  </div>
                ))}
            </div>
            <button className="menu-btn mathtug-top-gap" onClick={() => { setScreen('menu'); setErrorMsg(''); }}>Back</button>
          </div>
        </div>
      )}

      {screen === 'waiting' && (
        <div className="waiting-menu flex-center-col full-screen">
          <div className="mathtug-card mathtug-waiting-card">
            <div className="mathtug-sparkle" />
            <p className="mathtug-eyebrow">Room is live</p>
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
        </div>
      )}

      {(screen === 'playing' || screen === 'ended') && (
        <div className="full-screen mathtug-play-shell">
          <div className="mathtug-play-card">
            <header className="mathtug-match-header">
              <div className="mathtug-score-pill">
                <span className="mathtug-pill-label">You</span>
                <strong>{scores.you}</strong>
              </div>

              <div className="mathtug-center-status">
                <p className="mathtug-progress-label">Question {questionIndex} / {totalQuestions}</p>
                <p className="mathtug-clock">{timer}s left</p>
              </div>

              <div className="mathtug-score-pill">
                <span className="mathtug-pill-label">Opponent</span>
                <strong>{scores.opponent}</strong>
              </div>
            </header>

            <section className="mathtug-question-zone">
              <p className="mathtug-question-heading">Solve this</p>
              <h2 className="mathtug-main-question">{questionText}</h2>
              {feedbackMsg && <p className="mathtug-feedback">{feedbackMsg}</p>}
            </section>

            <form className="mathtug-answer-form" onSubmit={handleSubmit}>
              <input
                type="number"
                placeholder="Type your answer"
                value={answerInput}
                disabled={screen === 'ended' || questionIndex === 0 || questionIndex > totalQuestions}
                onChange={(e) => setAnswerInput(e.target.value)}
              />
              <button type="submit" disabled={screen === 'ended' || questionIndex === 0 || questionIndex > totalQuestions}>Submit</button>
            </form>

            <div className="mathtug-side-note">
              Both players receive the same 10 questions in order. Winner is decided by solved count, then total solve time.
            </div>
          </div>

          {screen === 'ended' && (
            <div id="overlay" className="overlay active">
              <div className="mathtug-card mathtug-end-card">
                <div id="message" className="message">{winnerMessage}</div>
                {standings.length > 0 && (
                  <div className="mathtug-standings">
                    {standings.map((entry, idx) => (
                      <div className="mathtug-standing-row" key={`${entry.sessionId}-${idx}`}>
                        <span>{idx + 1}. {entry.name}</span>
                        <span>{entry.solved}/10 · {(Number(entry.totalTimeMs || 0) / 1000).toFixed(2)}s</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={quitGame} className="menu-btn mathtug-top-gap">Back to Menu</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
