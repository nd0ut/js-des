import Chance from "chance";
import _ from "lodash";
import numbers from "numbers";
import forge from "node-forge";

export var chance = new Chance();

var eratosthenes = function(n) {
    // Eratosthenes algorithm to find all primes under n
    var array = [], upperLimit = Math.sqrt(n);

    // Make an array from 2 to (n - 1)
    for (var i = 0; i < n; i++) {
        array.push(true);
    }

    // Remove multiples of primes starting from 2, 3, 5,...
    for (var i = 2; i <= upperLimit; i++) {
        if (array[i]) {
            for (var j = i * i; j < n; j += i) {
                array[j] = false;
            }
        }
    }

    var res = 0;

    for (var i = 2; i < n; i++) {
        if(array[i]) {
            res = i;
        }
    }

    return res;
}

chance.mixin({
    'odd': function() {
        while(1) {
          var maybeOdd = chance.integer({min: 100000000, max: 9999999999});

          if(maybeOdd % 2 !== 0) {
            return maybeOdd;
          }
        }
    },
    'prime': function() {
        var prime;

        forge.prime.generateProbablePrime(16, function(err, num) {
            prime = parseInt(num.toString());
        });

        while(!prime) {}
        return prime;
    }
});
