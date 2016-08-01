//
// Routines that interact with libraries
// Lazy loading
//

function initLibraries() {
  app.libraries = {
    m: function() {
      if (typeof this.m_ === 'undefined') this.m_ = Moment.load();
      return this.m_;
    },

    // We use a library here called "Moment"
    // It's a dependency, so the below won't work until you have done this:
    // Go to Resources -> Libraries and enter this product key: MHMchiX6c1bwSqGM1PZiW_PxhMjh3Sh48
    //var moment = Moment.load();
    moment: function() {
      return this.m().apply(this, arguments);
    },
    
    iMoment: {
      reportSeconds: function (startTime) {
        return app.libraries.m().duration(new Date().getTime() - startTime).asSeconds();
      },
    },

    // We use a library here called "Underscore", especially for prioritizing and other functions.
    // It's a dependency, so the below won't work until you have done this:
    // Go to Resources -> Libraries and enter this product key: M3i7wmUA_5n0NSEaa6NnNqOBao7QLBR4j
    underscore: function() {
      if (typeof this.underscore_ === 'undefined') this.underscore_ = Underscore.load();
      return this.underscore_;
    },

    showdown: function() {
      if (typeof this.showdown_ === 'undefined') this.showdown_ = new Showdown.converter();
      return this.showdown_;
    },
  };

  app.libraries.interface = {
    dates: {
      today: function() { return app.libraries.moment() },
      tomorrow: function() { return this.today().add(1, 'days') },
      yesterday: function() { return this.today().add(-1, 'days') },
    }
  }
}

