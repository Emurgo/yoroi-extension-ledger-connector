//  //
import { CONNECTION_TYPE } from './types'; // https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md

export const HARDENED = 0x80000000;
export const PURPOSE = 44;
export const COIN_TYPE = 1815; // Cardano

export const CONNECTOR_URL = 'https://emurgo.github.io/yoroi-extension-ledger-connect';
export const YOROI_LEDGER_CONNECT_TARGET_NAME = 'YOROI-LEDGER-CONNECT';
export const DEFAULT_CONNECTION_TYPE = CONNECTION_TYPE.WEB_AUTHN;
export const DEFAULT_LOCALE = 'en-US';