// Copyright (c) 2016 bankerup.me
// The MIT License (MIT)
// A simple buffer to storing data

exports.Buffer = function() {
  this.data = Buffer.alloc(0);
  this.append = function(chunk) {
    if(typeof chunk == 'number') {
      chunk = [chunk];
    }
    this.data = Buffer.concat([this.data, Buffer.from(chunk)]);
    return this;
  }
  this.toString = function() {
    return this.data.toString();
  }
}
