//  //
import { CONNECTION_TYPE } from './types';
import { DEFAULT_LOCALE, DEFAULT_CONNECTION_TYPE, CONNECTOR_URL, YOROI_LEDGER_CONNECT_TARGET_NAME } from './const';
import { prepareError, makeFullURL } from './util';
export default class LedgerConnect {
  // $FlowIssue TODO fix type
  // $FlowIssue TODO fix type

  /**
   * Use `connectorUrl` to use this library with your own website
   * 
   * @param {*} config { connectorUrl?: string, connectionType?: ConnectionType, locale?: string }
   */
  constructor(config) {
    this.fullURL = void 0;
    this.connectionType = void 0;
    this.targetWindow = void 0;
    this.extensionPort = void 0;
    this.extensionTabId = void 0;

    this.getExtendedPublicKey = hdPath => {
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
            reject(new Error(prepareError(payload)));
          }
        });
      });
    };

    this.signTransaction = (inputs, outputs) => {
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
            reject(new Error(prepareError(payload)));
          }
        });
      });
    };

    this.showAddress = (hdPath, address) => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-show-address',
          params: {
            hdPath,
            address
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(prepareError(payload)));
          }
        });
      });
    };

    this.deriveAddress = (hdPath, knownDeviceCode) => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-derive-address',
          params: {
            hdPath,
            knownDeviceCode
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(prepareError(payload)));
          }
        });
      });
    };

    this.getVersion = knownDeviceCode => {
      return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-get-version',
          params: {
            knownDeviceCode
          }
        }, ({
          success,
          payload
        }) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(prepareError(payload)));
          }
        });
      });
    };

    this._setupTarget = (connectorUrl, locale) => {
      // Close target Website when Yoroi is forcefully closed or refreshed (F5)
      window.addEventListener('beforeunload', this.dispose);

      switch (this.connectionType) {
        case CONNECTION_TYPE.U2F:
        case CONNECTION_TYPE.WEB_AUTHN:
        case CONNECTION_TYPE.WEB_USB:
          this.fullURL = makeFullURL(connectorUrl, this.connectionType, locale);

          this._openTarget();

          break;

        default:
          throw new Error('[YLCH] Un-supported Transport protocol');
      }
    };

    this._openTarget = () => {
      if (!this.fullURL) {
        throw new Error(`[YLCH] Not a valid target URL: ${this.fullURL}`);
      }

      chrome.tabs.query({
        currentWindow: true,
        active: true
      }, tabs => {
        const curTab = tabs[0];

        if (!curTab) {
          throw new Error(`[YLCH] Something wrong with browser tabs`);
        }

        this.extensionTabId = curTab.id;
        console.debug(`[YLCH] Opening: ${this.fullURL}`); // Opening new tab, right next to the Yoroi Extension

        chrome.tabs.create({
          url: this.fullURL,
          index: curTab.index + 1
        }, tab => {
          this.targetWindow = tab;
          chrome.runtime.onConnect.addListener(this._onWebPageConnected);
        });
      });
    };

    this.isConnectorReady = () => {
      return this.extensionPort != null;
    };

    this._onWebPageConnected = port => {
      if (port.name === YOROI_LEDGER_CONNECT_TARGET_NAME && port.sender.id === chrome.runtime.id && port.sender.url === this.fullURL) {
        this.extensionPort = port;
      } else {
        console.error(`[YLCH Wrong port is trying to connect, PortName: ${port.name} SenderId: ${port.sender.id} SenderURL: ${port.sender.url}]`);
      }
    };

    this._sendMessage = (msg, cb) => {
      msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
      console.debug(`[YLCH] _sendMessage::${this.connectionType}::${msg.action}`);

      if (!this.extensionPort) {
        throw new Error(`[YLCH] extensionPort is null::action: ${msg.action}`);
      }

      this.extensionPort.postMessage(msg); // $FlowIssue TODO fix type

      if (!this.extensionPort || !this.extensionPort.onMessage) {
        throw new Error(`[YLCH] extensionPort.onMessage is null::action: ${msg.action}`);
      }

      this.extensionPort.onMessage.addListener(this._handleResponse.bind(this, msg, cb)); // $FlowIssue TODO fix type

      if (!this.extensionPort || !this.extensionPort.onDisconnect) {
        throw new Error(`[YLCH] extensionPort.onDisconnect is null::action: ${msg.action}`);
      }

      this.extensionPort.onDisconnect.addListener(this._onextensionPortDisconnect.bind(this, cb));
    };

    this._handleResponse = (req, cb, resp) => {
      if (resp && resp.action === `${req.action}-reply`) {
        cb(resp);
        console.debug(`[YLCH] _handleResponse::${this.connectionType}::${req.action}::${resp.action}`);
      } else {
        console.debug(`[YLCH] _handleResponse::${this.connectionType}::${req.action}::${resp.action}:: redundant handler`);
      }
    };

    this._onextensionPortDisconnect = cb => {
      console.debug(`[YLCH] _onextensionPortDisconnect::extensionPort is Disconnected!!!`);
      cb({
        success: false,
        payload: {
          error: 'Forcefully cancelled by user'
        }
      });
    };

    this.dispose = () => {
      if (this.extensionTabId) {
        chrome.tabs.update(this.extensionTabId, {
          active: true
        });
        this.extensionTabId = 0;
        console.debug('[YLCH] Made Yoroi Extension active');
      }

      if (this.targetWindow) {
        chrome.tabs.remove(this.targetWindow.id);
        this.targetWindow = undefined;
        console.debug('[YLCH] closed target Website');
      }

      if (this.extensionPort) {
        this.extensionPort.disconnect();
        this.extensionPort = undefined;
        console.debug('[YLCH] disconnected extension port');
      }
    };

    this.connectionType = config && config.connectionType || DEFAULT_CONNECTION_TYPE;

    const _connectorUrl = config && config.connectorUrl || CONNECTOR_URL;

    const _locale = config && config.locale || DEFAULT_LOCALE;

    this._setupTarget(_connectorUrl, _locale);
  } // ==============================
  //   Interface with Cardano app
  // ==============================


}