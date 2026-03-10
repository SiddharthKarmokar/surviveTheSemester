export const MESSAGE_TYPES = {
    WAITING: 'waiting',
    START: 'start',
    STOP: 'stop',
    JOINED: 'joined',
    KILLED: 'killed',
    WON: 'won',
    LEFT: 'left',
    TIMEOUT: 'timeout'
};

/**
 * @typedef {'waiting' | 'start' | 'stop' | 'joined' | 'killed' | 'won' | 'left' | 'timeout'} MessageType
 */

/**
 * @typedef {Object} MessageJSON
 * @property {MessageType} type
 * @property {number} ts
 * @property {string} from
 * @property {*} params
 */