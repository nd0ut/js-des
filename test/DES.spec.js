import {expect} from "chai";
import {chance} from "../out/chance";
import math from "mathjs";
import numbers from "numbers";
import DES from "../out/DES";
import _ from "lodash";
import bigInt from "big-integer";

describe.only('DES', function () {
  describe('#generateKey', function () {
    it('make right check bits', function () {
      var key = DES.generateKey();
      var bin = key.toString(2);
      var bitsTable = _.chunk(bin.split(''), 8);

      _.forEach(bitsTable, bits => {
        var trueBitsCount = bits.filter(bit => parseInt(bit) === 1).length;

        expect(trueBitsCount % 2).to.not.eql(0);
      });
    });
  });

  describe('#removeCheckBits', function () {
    it('returns real key without check bits', function () {
      var key = DES.generateKey();
      var realKey = DES.removeCheckBits(key).toString(2);

      expect(key.toString(2).length).to.eql(64);
      expect(realKey.length).to.eql(56);
    });
  });

  describe('#generateRoundKeys', function () {
    it('works', function () {
      var key = DES.generateKey();
      var roundKeys = DES.generateRoundKeys(key);
    });
  });

  describe('#transpose', function () {
    it('works', function () {
      var arr = _.map(Array(64), (v, idx) => idx + 1);

      var initialTransposed = DES.initialTranspose(arr);
      var endTransposed = DES.endTranspose(initialTransposed);

      expect(endTransposed).to.eql(arr);
    });
  });

  describe('#extend', function () {
    it('works', function () {
      var table = [
        32, 1,  2,  3,  4,  5,
        4,  5,  6,  7,  8,  9,
        8,  9,  10, 11, 12, 13,
        12, 13, 14, 15, 16, 17,
        16, 17, 18, 19, 20, 21,
        20, 21, 22, 23, 24, 25,
        24, 25, 26, 27, 28, 29,
        28, 29, 30, 31, 32, 1
      ];

      var arr = _.map(Array(32), (v, idx) => idx + 1);
      var extended = DES.extend(arr);

      expect(extended).to.eql(table);
    });
  });

  it('should encrypt and decrypt text with valid key', function () {
    var key = DES.generateKey();

    var sourceText = chance.sentence();
    var cipher = DES.encryptText(sourceText, key);

    var decryptedText = DES.decryptText(cipher, key);

    expect(decryptedText).to.eql(sourceText);
  });

  it('should not decrypt text without valid key', function () {
    var key = DES.generateKey();

    var sourceText = chance.sentence();
    var cipher = DES.encryptText(sourceText, key);

    var invalidKey = key.toString(2).split('')
    invalidKey[0] = !invalidKey[0];
    invalidKey = invalidKey.join('');

    var decryptedText = DES.decryptText(cipher, bigInt(invalidKey, 2));

    expect(decryptedText).to.not.eql(sourceText);
  });
});
