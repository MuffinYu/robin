const {
  SyncHook
} = require("tapable");

class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(["newSpeed"])
    };
  }
  setSpeed(newSpeed) {
    /*
    function anonymous(newSpeed) {
      "use strict";
      var _context;
      var _x = this._x;
      var _fn0 = _x[0];
      _fn0(newSpeed);
      var _fn1 = _x[1];
      _fn1(newSpeed);

      }
    */
    this.hooks.accelerate.call(newSpeed);
  }
}

const myCar = new Car();

myCar.hooks.accelerate.tap("Plugin1", newSpeed =>
  console.log(`Accelerating to ` + newSpeed)
);
myCar.hooks.accelerate.tap("Plugin2", newSpeed =>
  console.warn("speed too fast")
);
myCar.setSpeed(100);
