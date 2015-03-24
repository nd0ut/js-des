import {expect} from "chai";
import {chance} from "../out/chance";
import math from "mathjs";
import numbers from "numbers";
import RSA from "../out/RSA";

describe('RSA', function () {
  it('encrypts with public and decrypts with private', function () {
    var keys = RSA.generateKeyPair();

    var sourceText = chance.sentence();
    var cipher = RSA.encryptText(sourceText, keys.public);

    var decryptedText = RSA.decryptText(cipher, keys.private);

    expect(sourceText).to.eql(decryptedText);
  });

  it('encrypts with private and decrypts with public', function () {
    var keys = RSA.generateKeyPair();

    var sourceText = chance.sentence();
    var cipher = RSA.encryptText(sourceText, keys.private);

    var decryptedText = RSA.decryptText(cipher, keys.public);

    expect(sourceText).to.eql(decryptedText);
  });
});
