Soundbridge, a minimal way of crossbrowser audio output
-------------------------------------------------------

Getting realtime audio output out of your browser, in 3 easy steps.

1. copy the soundbridge folder to the public folder of your project

2. Provide a callback function that sends audio signals back

3. Start the soundbridge.

Or, expressed in code, here's the minimum working example:

(function() {
  var soundbridge = null;
  
  var absoluteBufferPos = 0;
  // a function that calculates sounds for the given number of samples
  // and channels.
  
  var calc = function(bridge, bufferSize, channels) {
    for(var b=0;b<bufferSize;b++) {
      var period = ((absoluteBufferPos + b) % 100) / 100;
      period *= 2 * Math.PI;
      var val = Math.sin(period);
      bridge.addToBuffer(val,val);
    }
    absoluteBufferPos += bufferSize;      
  };

  window.onload = function() {    
    // initialise the sound bridge with number of channels and sample rate
    // and URL prefix of the soundbridge root (needed for flash fallback)
    soundbridge = SoundBridge(2, 44100, '..');
    window.setTimeout(function() {
      soundbridge.setCallback(calc);
      soundbridge.play();
    }, 1000);    
  };
})();

WARNING
-------
Playing with raw audio data can be hazardous to your hearing and general health.
Audio glitches and bursts can and will occur. Protect yourself by running your
code on a machine with volume set to the lowest possible value.

STATUS
------

Currently missing: Proper flash support. It kind of works, but only in Mono 
and only 80% of the time.
Also, there are some strange bugs in Chrome 10 with sound simply stopping 
without any reason, so it seems.

CREDITS
-------
(c) 2009-2011 Jan Krutisch. Written during various Music Hack Days and 
extracted in preparation of the Javascript Usergroup Hamburg (#hhjs).

LICENSE
-------

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
                   Version 2, December 2004 

Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 

Everyone is permitted to copy and distribute verbatim or modified 
copies of this license document, and changing it is allowed as long 
as the name is changed. 

           DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
  TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 

 0. You just DO WHAT THE FUCK YOU WANT TO.
 