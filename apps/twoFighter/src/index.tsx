import * as PIXI from 'pixi.js';
import React from 'react';
import ReactDOM from 'react-dom';
import { Client } from 'colyseus.js';
import App from './App';
import './index.css';

// Backward compatibility for older colyseus.js client against 0.17 seat reservation payload.
if (!(Client.prototype as any).__patchedFor017) {
	(Client.prototype as any).__patchedFor017 = true;
	const consumeSeatReservation = (Client.prototype as any).consumeSeatReservation;

	(Client.prototype as any).consumeSeatReservation = function patchedConsumeSeatReservation(
		response: any,
		rootSchema: any,
		reuseRoomInstance: any,
	) {
		if (response && !response.room && response.roomId) {
			response.room = {
				name: response.name,
				roomId: response.roomId,
				processId: response.processId,
				publicAddress: response.publicAddress,
				createdAt: response.createdAt,
			};
		}

		return consumeSeatReservation.call(this, response, rootSchema, reuseRoomInstance);
	};
}

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

ReactDOM.render(<App />, document.getElementById('root'));
