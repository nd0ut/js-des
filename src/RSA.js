import {chance} from "../out/chance";
import numbers from "numbers";
import math from "mathjs";
import bigInt from "big-integer";
import _ from "lodash";
import {Base64} from "js-base64";

export default class RSA {
  static generateKeyPair() {
    var p = chance.prime();
    var q = chance.prime();
    var n = p * q;
    var phi = (p - 1) * (q - 1);

    var e;
    while(1) {
      var maybeE = chance.integer({min: 2, max: phi - 1});

      var isPrime = numbers.prime.millerRabin(maybeE);

      if(!isPrime) {
        continue;
      }

      var isCoPrime = numbers.prime.coprime(maybeE, phi);

      if(isPrime && isCoPrime) {
        e = maybeE;
        break;
      }
    }

    var xgcd = math.xgcd(phi, e);
    var d = xgcd._data[2];

    if(d < 0) {
      d += phi;
    }

    var publicKey = { e: e, n: n };
    var privateKey = { d: d, n: n };

    return {
      private: privateKey,
      public: publicKey
    }
  }

  static encrypt(p, key) {
    if(p >= key.n) {
      console.log(arguments);
      throw "p should be < n";
    }

    var E = bigInt(p).modPow(key.e || key.d, key.n).toJSNumber();
    return E;
  }

  static decrypt(E, key) {
    var decrypted = bigInt(E).modPow(key.d || key.e, key.n).toJSNumber();
    return decrypted;
  }

  static encryptText(text, key) {
    var codes = _.map(text, char => char.charCodeAt(0));

    var shifted = _.map(codes, (code, idx) => {
      if(idx == 0) {
        return code;
      }

      var prevCode = codes[idx - 1];
      var shiftedCode = (code + prevCode) % key.n;

      return shiftedCode;
    });

    var encrypted = _.map(shifted, code => this.encrypt(code, key) );

    var base64 = Base64.encode(encrypted.join());

    return base64;
  }

  static decryptText(cipher, key) {
    var codes = Base64.decode(cipher);

    codes = _.map(codes.split(','), code => parseInt(code));

    var decrypted = _.map(codes, code => this.decrypt(code, key));

    decrypted = _.forEach(decrypted, (code, idx) => {
      if(idx == 0) {
        return code;
      }

      var prev = decrypted[idx - 1];
      var unshifted = (code - prev) % key.n;

      decrypted[idx] = unshifted;
    });

    var chars = _.map(decrypted, code => String.fromCharCode(code));

    return chars.join('');
  }
}
