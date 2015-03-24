import {expect} from "chai";
import {chance} from "../out/chance";
import math from "mathjs";
import numbers from "numbers";
import _ from "lodash";

describe('chance', function () {
  describe('#odd', function () {
    it('should return odd number', function () {
      _.times(50, () => {
        var odd = chance.odd();
        expect(odd % 2).not.to.eql(0);
      })
    });
  });

  describe('#prime', function () {
    it('should return prime number', function () {
      _.times(50, () => {
        var prime = chance.prime();
        expect(numbers.prime.simple(prime)).to.be.true;
      })
    });
  });

});
