function RNG(seed) {
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;
  
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
}
RNG.prototype.nextFloat = function() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function(start, end) {
    // returns in range [start, end): including start, excluding end
    // can't modulo nextInt because of weak randomness in lower bits
    let rangeSize = end - start;
    let randomUnder1 = this.nextInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function(array) {
    return array[this.nextRange(0, array.length)];
}

function generateGlobalRNG(testing=false) {
    if (testing) {
        let seed = Math.random();
        return new RNG(seed);
    }
    // Specified date
    let specifiedDate = new Date('2023-01-01'); // For example, January 1, 2023
    // Current date
    let currentDate = new Date();
    // Calculate the difference in milliseconds between the two dates
    let timeDifference = currentDate.getTime() - specifiedDate.getTime();
    // Convert milliseconds to days (1 day = 24 * 60 * 60 * 1000 milliseconds)
    let seed = Math.floor(timeDifference / (1000 * 60 * 60 * 24))*123;
    return new RNG(seed);
}