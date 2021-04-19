// @flow //
declare var chrome;

import type {
  ConnectionType,
  Config,
  MessageType,
  FuncResp,
  BIP32Path,
  TxInput,
  ExtendedPublicKeyResp,
  GetVersionResponse,
  GetSerialResponse,
  DeriveAddressResponse,
  SignTransactionResponse,
  GetVersionRequest,
  GetSerialRequest,
} from './types';
import {
  CONNECTION_TYPE
} from './types';
import {
  DEFAULT_LOCALE,
  DEFAULT_CONNECTION_TYPE,
  CONNECTOR_URL,
  YOROI_LEDGER_CONNECT_TARGET_NAME,
} from './const';
import {
  prepareError,
  makeFullURL,
} from './util';
import type {
  DeriveAddressRequest,
  ShowAddressRequest,
  GetExtendedPublicKeysRequest,
  Transaction,
} from '@cardano-foundation/ledgerjs-hw-app-cardano';

export default class LedgerConnect {
  fullURL: string;
  connectionType: ConnectionType;
  targetWindow: ?any; // $FlowIssue TODO fix type
  extensionPort: ?any; // $FlowIssue TODO fix type
  extensionTabId: number;

  /**
   * Use `connectorUrl` to use this library with your own website
   * 
   * @param {*} config { connectorUrl?: string, connectionType?: ConnectionType, locale?: string }
   */
  constructor (config? : Config) {
    this.connectionType = (config && config.connectionType) || DEFAULT_CONNECTION_TYPE;
    const connectorUrl = (config && config.connectorUrl) || CONNECTOR_URL;
    const locale = (config && config.locale) || DEFAULT_LOCALE;
    this._setupTarget(connectorUrl, locale);
  }

  // ==============================
  //   Interface with Cardano app
  // ==============================

  getExtendedPublicKey: {|
    serial: ?string,
    params: GetExtendedPublicKeysRequest,
  |} => Promise<ExtendedPublicKeyResp> = (request) => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-extended-public-key',
        params: request.params,
        serial: request.serial,
        extension: chrome.runtime.id,
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(prepareError(payload)))
        }
      })
    });
  };

  signTransaction: {|
    serial: ?string,
    params: Transaction,
  |} => Promise<SignTransactionResponse> = (request) => {
    return new Promise((resolve, reject) => {
        this._sendMessage({
          action: 'ledger-sign-transaction',
          params: request.params,
          serial: request.serial,
          extension: chrome.runtime.id,
        },
        ({success, payload}) => {
          if (success) {
            resolve(payload);
          } else {
            reject(new Error(prepareError(payload)))
          }
        })
    });
  };

  showAddress: {|
    serial: ?string,
    params: ShowAddressRequest,
  |} => Promise<void> = (request) => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-show-address',
        params: request.params,
        serial: request.serial,
        extension: chrome.runtime.id,
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(prepareError(payload)))
        }
      })
    });
  };

  deriveAddress: {|
    serial: ?string,
    params: DeriveAddressRequest,
  |} => Promise<DeriveAddressResponse> = (request) => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-derive-address',
        params: request.params,
        serial: request.serial,
        extension: chrome.runtime.id,
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(prepareError(payload)));
        }
      })
    });
  };

  getVersion: {|
    serial: ?string,
    params: GetVersionRequest,
  |} => Promise<GetVersionResponse> = (request) => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-version',
        params: request.params,
        serial: request.serial,
        extension: chrome.runtime.id,
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(prepareError(payload)));
        }
      });
    });
  };

  getSerial: {|
    serial: ?string,
    params: GetSerialRequest,
  |} => Promise<GetSerialResponse> = (request) => {
    return new Promise((resolve, reject) => {
      this._sendMessage({
        action: 'ledger-get-serial',
        params: request.params,
        serial: request.serial,
        extension: chrome.runtime.id,
      },
      ({success, payload}) => {
        if (success) {
          resolve(payload);
        } else {
          reject(new Error(prepareError(payload)));
        }
      });
    });
  };

  // ==============================
  //  Target Website Management
  // ==============================

  /**
   * Prepares and opens target WebSite
   * 
   * @param {*} connectorUrl: string
   * @param {*} locale      : string
   * @returns void
   */
  _setupTarget = (connectorUrl: string, locale: string): void => {
    // Close target Website when Yoroi is forcefully closed or refreshed (F5)
    window.addEventListener('beforeunload', this.dispose);

    switch(this.connectionType) {
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

  /**
   * Opens target WebSite
   * 
   * @returns void
   */
  _openTarget = (): void => {
    if (!this.fullURL) {
      throw new Error(`[YLCH] Not a valid target URL: ${this.fullURL}`);
    }

    chrome.tabs.query({
      currentWindow: true,
      active: true,
    }, (tabs) => {
      const curTab = tabs[0];
      if (!curTab) {
        throw new Error(`[YLCH] Something wrong with browser tabs`);
      }
      this.extensionTabId = curTab.id;
      console.debug(`[YLCH] Opening: ${this.fullURL}`);

      // Opening new tab, right next to the Yoroi Extension
      chrome.tabs.create({
          url: this.fullURL,
          index: curTab.index + 1,
      }, tab => {
        this.targetWindow = tab;
        chrome.runtime.onConnect.addListener(this._onWebPageConnected);
      });
    });
  }

  /**
   * If extension port exists that means we are connected with the target WebSite
   * @returns boolean
   */
  isConnectorReady = (): boolean => {
    return this.extensionPort != null;
  };

  /**
   * Stores extension port of target WebPage
   * @param {*} port: any
   * @returns void
   */
  _onWebPageConnected = (port: any): void => {
    if(port.name === YOROI_LEDGER_CONNECT_TARGET_NAME &&
      port.sender.id  === chrome.runtime.id &&
      port.sender.url === this.fullURL) {
      this.extensionPort = port;
    } else {
      console.error(`[YLCH Wrong port is trying to connect, PortName: ${port.name} SenderId: ${port.sender.id} SenderURL: ${port.sender.url}]`);
    }
  };

  /**
   * Sends request to the target WebSite
   * 
   * @param {*} msg: MessageType
   * @param {*} cb : FuncResp
   * @returns void
   */
  _sendMessage = (msg: MessageType, cb: FuncResp): void => {
    msg.target = YOROI_LEDGER_CONNECT_TARGET_NAME;
    console.debug(`[YLCH] _sendMessage::${this.connectionType}::${msg.action}`);

    if(!this.extensionPort) {
      throw new Error(`[YLCH] extensionPort is null::action: ${msg.action}`);
    }
    this.extensionPort.postMessage(msg);

    // $FlowIssue TODO fix type
    if(!this.extensionPort || !this.extensionPort.onMessage) {
      throw new Error(`[YLCH] extensionPort.onMessage is null::action: ${msg.action}`);
    }
    this.extensionPort.onMessage.addListener(this._handleResponse.bind(this, msg, cb));

    // $FlowIssue TODO fix type
    if(!this.extensionPort || !this.extensionPort.onDisconnect) {
      throw new Error(`[YLCH] extensionPort.onDisconnect is null::action: ${msg.action}`);
    }
    this.extensionPort.onDisconnect.addListener(this._onextensionPortDisconnect.bind(this, cb));
  };

  /**
   * Handles response from WebSite, basically passes result back to Yoroi
   * 
   * @param {*} req : MessageType
   * @param {*} cb  : FuncResp
   * @param {*} resp: any
   * @returns void
   */
  _handleResponse = ( req: MessageType, cb: FuncResp, resp: any): void => {
    if (resp && resp.action === `${req.action}-reply`) {
      cb(resp);
      console.debug(`[YLCH] _handleResponse::${this.connectionType}::${req.action}::${resp.action}`);
    } else {
      console.debug(`[YLCH] _handleResponse::${this.connectionType}::${req.action}::${resp.action}:: redundant handler`);
    }
  };

  /**
   * If Website is closed forcefully then error will be thrown back to Yoroi
   * 
   * @param {*} cb: FuncResp
   * @returns void
   */
  _onextensionPortDisconnect = (cb: FuncResp): void => {
    console.debug(`[YLCH] _onextensionPortDisconnect::extensionPort is Disconnected!!!`);
    cb({
      success:false,
      payload: {
        error: 'Forcefully cancelled by user'
      }}
    );
  };

  /**
   * This method must be called after success or failure,
   * this.extensionPort.disconnect() will close the target WebSite
   * @returns void
   */
  dispose = (): void => {
    if (this.extensionTabId) {
      chrome.tabs.update(this.extensionTabId, {
        active: true
      });
      this.extensionTabId = 0;
      console.debug('[YLCH] Made Yoroi Extension active');
    }

    if (this.targetWindow) {
      chrome.tabs.remove(this.targetWindow.id);
      this.targetWindow = undefined
      console.debug('[YLCH] closed target Website');
    }    

    if(this.extensionPort) {
      this.extensionPort.disconnect();
      this.extensionPort = undefined;
      console.debug('[YLCH] disconnected extension port');
    }
  };
}