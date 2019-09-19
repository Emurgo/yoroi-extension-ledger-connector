import EventEmitter from 'events'; // https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#examples
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md

const HARDENED = 0x80000000;
const PURPOSE = 44;
const COIN_TYPE = 1815; // Cardano

const BRIDGE_URL = 'https://emurgo.github.io/yoroi-extension-ledger-connect';
export const YOROI_LEDGER_CONNECT_TARGET_NAME = 'YOROI-LEDGER-CONNECT';
export const ConnectionTypeValue = Object.freeze({
  WEB_AUTHN: 'webauthn',
  U2F: 'u2f'
});
const DEFAULT_CONNECTION_TYPE = ConnectionTypeValue.WEB_AUTHN;
const DEFAULT_LOCALE = 'en-US';
export class LedgerBridge extends EventEmitter {
  /**
   * Use `bridgeOverride` to use this library with your own website
   * 
   * @param {*} connectionType 'webauthn' | 'u2f'
   * @param {*} bridgeOverride 
   */
  constructor(config) {
    super();
    this.bridgeUrl = void 0;
    this.locale = void 0;
    this.connectionType = void 0;
    this.targetWindow = void 0;

    this._setupTarget = () => {
      switch (this.connectionType) {
        case ConnectionTypeValue.U2F:
        case ConnectionTypeValue.WEB_AUTHN:
          this.targetWindow = window.open(this._makeFullURL());
          break;

        default:
          throw new Error('[YLCH] Un-supported Transport protocol');
      }
    };

    this._makeFullURL = () => {
      const parms = {
        connectionType: this.connectionType === DEFAULT_CONNECTION_TYPE ? '' : `transport=${this.connectionType}`,
        locale: this.locale === DEFAULT_LOCALE ? '' : `locale=${this.locale}`
      };
      let fullURL = this.bridgeUrl + (this.bridgeUrl.endsWith('/') ? '' : '/');
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
    };

    this._onTargetClose = cb => {
      const data = {
        success: false,
        payload: {}
      };
      cb(data);
    };

    this.bridgeUrl = config && config.bridgeOverride || BRIDGE_URL; // Rename BRIDGE_URL

    this.connectionType = config && config.connectionType || DEFAULT_CONNECTION_TYPE;
    this.locale = config && config.locale || DEFAULT_LOCALE;

    this._setupTarget();
  }

  isBridgeReady() {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'is-ready',
        params: {}
      }, ({
        success,
        payload
      }) => {
        if (success) {
          console.debug('[YLCH] Completely loaded');
          resolve(true);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  dispose() {
    if (this.targetWindow) {
      this.targetWindow.close();
    }
  } // ==============================
  //   Interface with Cardano app
  // ==============================


  getVersion() {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-version',
        params: {}
      }, ({
        success,
        payload
      }) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  getExtendedPublicKey(hdPath) {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-extended-public-key',
        params: {
          hdPath
        }
      }, ({
        success,
        payload
      }) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  deriveAddress(hdPath) {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-derive-address',
        params: {
          hdPath
        }
      }, ({
        success,
        payload
      }) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  showAddress(hdPath) {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-show-address',
        params: {
          hdPath
        }
      }, ({
        success,
        payload
      }) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  signTransaction(inputs, outputs) {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-sign-transaction',
        params: {
          inputs,
          outputs
        }
      }, ({
        success,
        payload
      }) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(_prepareError(payload)));
        }
      });
    });
  }

  _sendMessage(msg, cb) {
    msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
    console.debug(`[YLCH]::_sendMessage::${this.connectionType}::${msg.action}`);

    switch (this.connectionType) {
      case ConnectionTypeValue.U2F:
      case ConnectionTypeValue.WEB_AUTHN:
        this.targetWindow.postMessage(msg, this.bridgeUrl);
        break;

      default:
        throw new Error('[YLCH] Un-supported Transport protocol');
    }

    this.targetWindow.onunload = this._onTargetClose.bind(this, cb);
    window.addEventListener('message', ({
      origin,
      data
    }) => {
      if (origin !== _getOrigin(this.bridgeUrl)) {
        throw new Error(`[YLCH]::_sendMessage::EventHandler::${this.connectionType}::${msg.action}::${data.action}:: Unknown origin: ${origin}`);
      }

      console.debug(`[YLCH]::_sendMessage::EventHandler::${this.connectionType}::${msg.action}::${data.action}`);

      if (data && data.action && data.action === `${msg.action}-reply`) {
        cb(data);
      } else {
        // TODO: https://app.clubhouse.io/emurgo/story/1829/yoroi-extension-ledger-bridge-better-event-handling
        console.debug(`[YLCH]::_sendMessage::EventHandler::${this.connectionType}::${msg.action}::${data.action}:: redundant handler`);
      }
    });
  }

} // ================
//   Bridge Setup
// ================

function _getOrigin(bridgeUrl) {
  const tmp = bridgeUrl.split('/');
  tmp.splice(-1, 1);
  return tmp.join('/');
} // ====================
//   Helper Functions
// ====================


function _prepareError(payload) {
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
 */

export function makeCardanoAccountBIP44Path(account) {
  return [HARDENED + PURPOSE, HARDENED + COIN_TYPE, HARDENED + account];
}
export function toDerivationPathString(derivationPath) {
  return `m/${derivationPath.map(item => item % HARDENED + (item >= HARDENED ? "'" : '')).join('/')}`;
}