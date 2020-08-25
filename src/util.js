// @flow //

import type {
  ConnectionType,
  BIP32Path,
} from './types';
import {
  DEFAULT_LOCALE,
  DEFAULT_CONNECTION_TYPE,
  HARDENED,
} from './const';

/**
 * Makes target full URL like:
 * https://emurgo.github.io/yoroi-extension-ledger-connect/?transport=u2f&locale=ja-JP
 * 
 * @param {*} connectorUrl 
 * @param {*} connectionType 
 * @param {*} locale
 * @returns string
 */
export function makeFullURL(
  connectorUrl: string,
  connectionType: ConnectionType,
  locale: string
): string {
  const params = {
    connectionType: (connectionType === DEFAULT_CONNECTION_TYPE)? '' : `transport=${connectionType}`,
    locale: (locale === DEFAULT_LOCALE)? '' : `locale=${locale}`
  }

  let fullURL = connectorUrl + (connectorUrl.endsWith('/')? '' : '/');

  let foundFirst = false;
  for (const prop in params) {
    const value = params[prop]
    // Check own property and escape empty values
    if (Object.prototype.hasOwnProperty.call(params, prop) && value) {
      // choose to prepend ? or &
      if(!foundFirst) {
        foundFirst = true;
        fullURL = fullURL + `?${value}`;
      } else {
        fullURL = fullURL + `&${value}`;
      }
    }
  }

  return fullURL;
};

/**
 * Restructures error object from payload
 * 
 * @param {*} payload 
 * @returns string
 */
export function prepareError(payload: any): string {
  return (payload && payload.error)
    ? payload.error
    : 'SOMETHING_UNEXPECTED_HAPPENED';
}

/**
 * Converts BIP32Path to string version (like m/44'/1815'/0'/0/0)
 * 
 * @param {*} derivationPath 
 * @returns string
 */
export function toDerivationPathString(derivationPath: BIP32Path): string {
  return `m/${derivationPath
    .map((item) => (item % HARDENED) + (item >= HARDENED ? "'" : ''))
    .join('/')}`
}