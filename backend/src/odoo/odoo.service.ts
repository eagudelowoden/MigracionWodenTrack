// src/odoo/odoo.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as xmlrpc from 'xmlrpc';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OdooService {
  private common: xmlrpc.Client;
  private models: xmlrpc.Client;
  private _cachedUid: number | null = null;
  private _uidExpiry = 0;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('ODOO_URL');
    // Usamos createSecureClient si es HTTPS, createClient si es HTTP
    this.common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });
    this.models = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });
  }

  // Asegúrate de que el nombre sea EXACTAMENTE 'authenticate'
  public authenticate(): Promise<number> {
    if (this._cachedUid && Date.now() < this._uidExpiry) {
      return Promise.resolve(this._cachedUid);
    }
    return new Promise((resolve, reject) => {
      this.common.methodCall(
        'authenticate',
        [
          this.config.get('ODOO_DB'),
          this.config.get('ODOO_USER'),
          this.config.get('ODOO_PASS'),
          {},
        ],
        (err, uid: number) => {
          if (err || !uid) {
            reject(new InternalServerErrorException('Error Odoo Auth'));
            return;
          }
          this._cachedUid = uid;
          this._uidExpiry = Date.now() + 30 * 60 * 1000; // 30 min
          resolve(uid);
        },
      );
    });
  }

  public executeKw<T>(
    model: string,
    method: string,
    params: any[],
    options: any,
    uid: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.get('ODOO_DB'),
          uid,
          this.config.get('ODOO_PASS'),
          model,
          method,
          params,
          options,
        ],
        (err, result: T) => {
          if (err) {
            reject(new InternalServerErrorException('Error Odoo execute_kw'));
            return;
          }
          resolve(result);
        },
      );
    });
  }
}
