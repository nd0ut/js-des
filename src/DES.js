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

  static getSMatrix(i) {
    var matrixes = {
      S1: [
        14, 4,  13, 1, 2,  15, 11, 8,  3,  10, 6,  12, 5,  9,  0, 7,
        0,  15, 7,  4, 14, 2,  13, 1,  10, 6,  12, 11, 9,  5,  3, 8,
        4,  1,  14, 8, 13, 6,  2,  11, 15, 12, 9,  7,  3,  10, 5, 0,
        15, 12, 8,  2, 4,  9,  1,  7,  5,  11, 3,  14, 10, 0,  6, 13
      ],
      S2: [
        15, 1,  8,  14, 6,  11, 3,  4,  9,  7, 2,  13, 12, 0, 5,  10,
        3,  13, 4,  7,  15, 2,  8,  14, 12, 0, 1,  10, 6,  9, 11, 5,
        0,  14, 7,  11, 10, 4,  13, 1,  5,  8, 12, 6,  9,  3, 2,  15,
        13, 8,  10, 1,  3,  15, 4,  2,  11, 6, 7,  12, 0,  5, 14, 9
      ],
      S3: [
        10, 0,  9,  14, 6, 3,  15, 5,  1,  13, 12, 7,  11, 4,  2,  8,
        13, 7,  0,  9,  3, 4,  6,  10, 2,  8,  5,  14, 12, 11, 15, 1,
        13, 6,  4,  9,  8, 15, 3,  0,  11, 1,  2,  12, 5,  10, 14, 7,
        1,  10, 13, 0,  6, 9,  8,  7,  4,  15, 14, 3,  11, 5,  2,  12
      ],
      S4: [
        7,  13, 14, 3, 0,  6,  9,  10, 1,  2, 8, 5,  11, 12, 4,  15,
        13, 8,  11, 5, 6,  15, 0,  3,  4,  7, 2, 12, 1,  10, 14, 9,
        10, 6,  9,  0, 12, 11, 7,  13, 15, 1, 3, 14, 5,  2,  8,  4,
        13, 15, 0,  6, 10, 1,  13, 8,  9,  4, 5, 11, 12, 7,  2,  14
      ],
      S5: [
        2,  12, 4,  1,  7,  10, 11, 6,  8,  5,  3,  15, 13, 0, 14, 9,
        14, 11, 2,  12, 4,  7,  13, 1,  5,  0,  15, 10, 3,  8, 9,  6,
        4,  2,  1,  11, 10, 13, 7,  8,  15, 9,  12, 5,  6,  3, 0,  14,
        11, 8,  12, 7,  1,  14, 2,  13, 6,  15, 0,  9,  10, 4, 5,  3
      ],
      S6: [
        12, 1,  10, 15, 9, 2,  6,  8,  0,  13, 3,  4,  14, 7,  5,  11,
        10, 15, 4,  2,  7, 12, 9,  5,  6,  1,  13, 14, 0,  11, 3,  8,
        9,  14, 15, 5,  2, 8,  12, 3,  7,  0,  4,  10, 1,  13, 11, 6,
        4,  3,  2,  12, 9, 5,  15, 10, 11, 14, 1,  4,  6,  0,  8,  13
      ],
      S7: [
        4,  11, 2,  14, 15, 0, 8,  13, 3,  12, 9, 7,  5,  10, 6, 1,
        13, 0,  11, 7,  4,  9, 1,  10, 14, 3,  5, 12, 2,  15, 8, 6,
        1,  4,  11, 13, 12, 3, 7,  14, 10, 15, 6, 8,  0,  5,  9, 2,
        6,  11, 13, 8,  1,  4, 10, 7,  9,  5,  0, 15, 14, 2,  3, 12
      ],
      S8: [
        13, 2,  8,  4, 6,  15, 11, 1,  10, 9,  3,  14, 5,  0,  12, 7,
        1,  15, 13, 8, 10, 3,  7,  4,  12, 5,  6,  11, 0,  14, 9,  2,
        7,  11, 4,  1, 9,  12, 14, 2,  0,  6,  10, 13, 15, 3,  5,  8,
        2,  1,  14, 7, 4,  10, 8,  13, 15, 12, 9,  0,  3,  5,  6,  11
      ]

    };

    var m = matrixes[`S${i+1}`];

    return _.chunk(m, 16);
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

    var xoredBlock = _.map(extendedBlock, (bit, idx) => bit ^ key[idx]);

    var chunks = _.chunk(xoredBlock, 6);

    var sOut = '';

    _.forEach(chunks, (chunk, idx) => {
      var matrix = this.getSMatrix(idx);

      var rowIdx = bigInt(`${_.first(chunk)}${_.last(chunk)}`, 2).toString(10)
      var row = matrix[rowIdx];

      var colIdx = bigInt(`${chunk[1]}${chunk[2]}${chunk[3]}${chunk[4]}`, 2).toString(10);
      var cell = row[colIdx];

      var binCell = cell.toString(2);

      if(binCell.length !== 4) {
        _.times(4 - binCell.length, () => binCell = '0' + binCell);
      }

      sOut += binCell;
    });

    sOut = sOut.split('');

    var pMatrix = [
      16, 7, 20, 21, 29, 12, 28, 17, 1, 5, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25
    ];

    var p = this.matrixMove(pMatrix, sOut, Array(32));

    return p;
  }

  static feistelRound(left, right, rounds, keys) {
    var realRounds = Math.abs(rounds);
    var curRound = rounds < 0 ? realRounds : 1;

    while(1) {
      var leftEncrypted = this.f(left, keys[curRound - 1], curRound);
      var leftXored = _.map(leftEncrypted, (bit, idx) => bit ^ right[idx]);

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
    var bits = _(codes)
      .map(code => code.toString(2))
      .map(bits => bits.split(''))
      .map(bits => {
        if(bits.length !== 16) {
          _.times(16 - bits.length, () => bits.unshift(0));
        }
        return bits.join('');
      })
      .join('')
      .split('')
      .map(bit => parseInt(bit));

    var blocks = _(bits)
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

      var encrypted = this.feistelRound(left, right, 16, roundKeys);
      encrypted = this.endTranspose(encrypted);
      encryptedBlocks.push(encrypted);
    });

    encryptedBlocks = encryptedBlocks.map(block => block.join(''));

    var base64 = Base64.encode(encryptedBlocks.join(''));

    return base64;
  }

  static decryptText(cipher, key) {
    var roundKeys = this.generateRoundKeys(key);

    var encryptedBlocks = _.chunk(Base64.decode(cipher).split(''), 64);
    var decryptedBlocks = [];

    _.forEach(encryptedBlocks, block => {
      block = _.map(block, bit => parseInt(bit));
      block = this.initialTranspose(block);

      var left = _.take(block, block.length / 2);
      var right = _.takeRight(block, block.length / 2);

      var decrypted = this.feistelRound(left, right, -16, roundKeys);
      decrypted = this.endTranspose(decrypted);
      decryptedBlocks.push(decrypted);
    });

    decryptedBlocks = decryptedBlocks
      .map(block => {
        var chunks = _.chunk(block, 16);
        var codes = chunks.map(bin => bigInt(bin.join(''), 2).toString(10));
        codes = _.remove(codes, code => code !== '0');
        var chars = codes.map(code => String.fromCharCode(code));
        var text = chars.join('');
        return text;
      });

    var text = _.flatten(decryptedBlocks).join('');

    return text;
  }
}
