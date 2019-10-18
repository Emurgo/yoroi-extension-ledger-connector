//  //
import { DEFAULT_LOCALE, DEFAULT_CONNECTION_TYPE, HARDENED, PURPOSE, COIN_TYPE } from './const';
/**
 * Makes target full URL like:
 * https://emurgo.github.io/yoroi-extension-ledger-connect/?transport=u2f&locale=ja-JP
 * 
 * @param {*} connectorUrl 
 * @param {*} connectionType 
 * @param {*} locale
 * @returns string
 */

export function makeFullURL(connectorUrl, connectionType, locale) {
  const parms = {
    connectionType: connectionType === DEFAULT_CONNECTION_TYPE ? '' : `transport=${connectionType}`,
    locale: locale === DEFAULT_LOCALE ? '' : `locale=${locale}`
  };
  let fullURL = connectorUrl + (connectorUrl.endsWith('/') ? '' : '/');
  let foundFirst = false;

  for (const prop in parms) {
    const value = parms[prop]; // Check own property and escape empty values

    if (Object.prototype.hasOwnProperty.call(parms, prop) && value) {
      // choose to prepend ? or &
      if (!foundFirst) {
        foundFirst = true;
        fullURL = fullURL + `?${value}`;
      } else {
        fullURL = fullURL + `&${value}`;
      }
    }
  }

  return fullURL;
}
;
/**
 * Restructures error object from payload
 * 
 * @param {*} payload 
 * @returns string
 */

export function prepareError(payload) {
  return payload && payload.error ? payload.error : 'SOMETHING_UNEXPECTED_HAPPENED';
}
/**
 * Get the Bip44 path required to specify an address
 *
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
 * Ledger (according to current security rules) denies any derivation path which does not start with
 *  `[HD+44, HD+1815, HD+(account), chain, address]`
 * 
 * @param {*} account account index eg: { 0 = first account , 1 = second account ...}
 * @param {*} chain 0 = external or 1 = change
 * @param {*} address address index eg: { 0 = first address , 1 = second address ...}
 * @returns BIP32Path
 */

export function makeCardanoBIP44Path(account, chain, address) {
  return [HARDENED + PURPOSE, HARDENED + COIN_TYPE, HARDENED + account, chain, address];
}
/**
 * Get the Bip44 path required to create an account
 *
 * See BIP44 for explanation
 * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
 * Ledger (according to current security rules) denies any derivation path which does not start with
 *  `[HD+44, HD+1815, HD+(account)]`
 * 
 * @param {*} account
 * @returns BIP32Path
 */

export function makeCardanoAccountBIP44Path(account) {
  return [HARDENED + PURPOSE, HARDENED + COIN_TYPE, HARDENED + account];
}
/**
 * Converts BIP32Path to string version (like m/44'/1815'/0'/0/0)
 * 
 * @param {*} derivationPath 
 * @returns string
 */

export function toDerivationPathString(derivationPath) {
  return `m/${derivationPath.map(item => item % HARDENED + (item >= HARDENED ? "'" : '')).join('/')}`;
}