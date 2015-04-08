import {chance} from "../out/chance";
import numbers from "numbers";
import math from "mathjs";
import bigInt from "big-integer";
import _ from "lodash";
import {Base64} from "js-base64";
import forge from "node-forge";

function shiftLeft(arr)
{
  var temp = new Array();
  for (var i = 1; i <= arr.length-1; i++) temp.push(arr[i]);
  temp.push(arr[0]);
  return temp;
}

export default class DES {
  static matrixMove(matrix, source, dest) {
    var res = _.reduce(matrix, (t, destIdx, sourceIdx) => {
      t[sourceIdx] = source[destIdx - 1];
      return t;
    }, dest);

    return res;
  }

  // block should be 64 bits
  static initialTranspose(block) {
    var matrix = [
      58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4,
      62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8,
      57, 49, 41, 33, 25, 17, 9 , 1, 59, 51, 43, 35, 27, 19, 11, 3,
      61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7,
    ];

    return this.matrixMove(matrix, block, Array(64));
  }

  // block should be 64 bits
  static endTranspose(block) {
    var matrix = [
      40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31,
      38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29,
      36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27,
      34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9 , 49, 17, 57, 25
    ];

    return this.matrixMove(matrix, block, Array(64));
  }

  // block should be 32 bits
  static extend(halfBlock) {
    var matrix = [
      32, 1,  2,  3,  4,  5,
      4,  5,  6,  7,  8,  9,
      8,  9,  10, 11, 12, 13,
      12, 13, 14, 15, 16, 17,
      16, 17, 18, 19, 20, 21,
      20, 21, 22, 23, 24, 25,
      24, 25, 26, 27, 28, 29,
      28, 29, 30, 31, 32, 1
    ];

    return this.matrixMove(matrix, halfBlock, Array(48));
  }

  static generateKey() {
    while(true) {
      var bytes = forge.random.getBytesSync(7);
      var hex = forge.util.bytesToHex(bytes);
      var int = bigInt(hex, 16);
      var bin = int.toString(2).split('');

      if(bin.length === 56) {
        break;
      }
    }

    var checkBits = _.map(_.chunk(bin, 7), sevenBits => {
      var count = _.filter(sevenBits, bit => parseInt(bit) === 1).length;

      if(count % 2 === 0) {
        sevenBits.push(1);
      }
      else {
        sevenBits.push(0);
      }

      return sevenBits;
    });

    var int = bigInt(_.flatten(checkBits).join(''), 2);

    return int;
  }

  static removeCheckBits(key) {
    var bitsTable = _.chunk(key.toString(2).split(''), 8);

    var realKey = _.map(bitsTable, bits => _.dropRight(bits));

    var int = bigInt(_.flatten(realKey).join(''), 2);

    return int;
  }

  static generateRoundKeys(key) {
    var keyBits = key.toString(2).split('');

    var matrix = [
      57, 49, 41, 33, 25, 17, 9,  1,  58, 50, 42, 34, 26, 18, // C0
      10, 2,  59, 51, 43, 35, 27, 19, 11, 3,  60, 52, 44, 36,
      63, 55, 47, 39, 31, 23, 15, 7,  62, 54, 46, 38, 30, 22, // D0
      14, 6,  61, 53, 45, 37, 29, 21, 13, 5,  28, 20, 12, 4
    ];

    var [c, d] = _.chunk(this.matrixMove(matrix, keyBits, Array(56)), 28);

    var shiftMatrix = [
      1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1
    ];

    var cdRounds = Array(16);

    for(var i = 0; i < 16; i++) {

      var curC, curD;


      if(i === 0) {
        _.times(shiftMatrix[i], () => {
          curC = shiftLeft(c);
          curD = shiftLeft(d);
        });
      }
      else {
        _.times(shiftMatrix[i], () => {
          curC = shiftLeft(_.take(cdRounds[i - 1], 28));
          curD = shiftLeft(_.takeRight(cdRounds[i - 1], 28));
        });
      }
      cdRounds[i] = _.flatten([curC, curD]);
    }

    var kMatrix = [
      14, 17, 11, 24, 1,  5,  3,  28, 15, 6,  21, 10,
      23, 19, 12, 4,  26, 8,  16, 7,  27, 20, 13, 2,
      41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
      44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
    ];

    var kRounds = _.map(cdRounds, (cd, round) => {
      var k = this.matrixMove(kMatrix, cd, Array(48))
      return k;
    });

    var keys = kRounds;

    return keys;
  }

  static f(block, key, round) {
    var extendedBlock = this.extend(block);

    var xoredBlock = _.map(extendedBlock, (code, idx) => code ^ key[idx]);

    var chunks = _.chunk(xoredBlock, 6);

    return _.map(block, code => {
      return code + round;
    });
  }

  static feistelRound(left, right, rounds, keys) {
    var realRounds = Math.abs(rounds);
    var curRound = rounds < 0 ? realRounds : 1;

    while(1) {
      var leftEncrypted = this.f(left, keys[curRound - 1], curRound);
      var leftXored = _.map(leftEncrypted, (code, idx) => code ^ right[idx]);

      var newLeft = leftXored;
      var newRight = left;

      if(curRound === (rounds < 0 ? 1 : realRounds)) {
        return left.concat(leftXored);
      }

      left = newLeft;
      right = newRight;

      curRound = rounds < 0 ? curRound - 1: curRound + 1;
    }
  }

  static encryptText(text, key) {
    var roundKeys = this.generateRoundKeys(key);

    var codes = _.map(text, char => char.charCodeAt(0));
    var blocks = _(codes)
      .chunk(64)
      .map(block => {
        if(block.length !== 64) {
          _.times(64 - block.length, () => block.push(0));
        }

        return block
      }).value();

    var encryptedBlocks = [];

    _.forEach(blocks, block => {
      block = this.initialTranspose(block);

      var left = _.take(block, block.length / 2);
      var right = _.takeRight(block, block.length / 2);

      var encrypted = this.feistelRound(left, right, 4, roundKeys);
      encrypted = this.endTranspose(encrypted);
      encryptedBlocks.push(encrypted);
    });

    encryptedBlocks = encryptedBlocks.map(block => block.join(','));

    var base64 = Base64.encode(encryptedBlocks.join(':'));

    return base64;
  }

  static decryptText(cipher, key) {
    var roundKeys = this.generateRoundKeys(key);

    var encryptedBlocks = Base64.decode(cipher).split(':');
    var decryptedBlocks = [];

    _.forEach(encryptedBlocks, block => {
      block = _.map(block.split(','), code => parseInt(code));
      block = this.initialTranspose(block);

      var left = _.take(block, block.length / 2);
      var right = _.takeRight(block, block.length / 2);

      var decrypted = this.feistelRound(left, right, -4, roundKeys);
      decrypted = this.endTranspose(decrypted);
      _.forEachRight(decrypted, code => code === 0 ? decrypted.pop() : false);
      decryptedBlocks.push(decrypted);
    });

    decryptedBlocks = decryptedBlocks
      .map(block => _.map(block, code => String.fromCharCode(code)).join(''));

    var text = _.flatten(decryptedBlocks).join('');

    return text;
  }
}
