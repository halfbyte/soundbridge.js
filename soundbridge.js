// function genSound(bufferSize, bufferPos) {
//   return seq.update(bufferSize, bufferPos);
// }

var SoundBridge = function(channels, sampleRate, pathForFallback) {
  var that = {};
  var flashObject = null;
  var flashBuffer = "";
  var callback = null;
  var context = null;
  var jsNode = null;
  var jsNodeOutputBuffer = null;
  var chanL = null;
  var chanR = null;
  var bufferCounter = 0;
  var playing = false;
  var method = 'audiocontext';
  var audioElement = null;
  var soundData;
  var tail = null;
  var prebufferSize = 0;
  var currentWritePosition = 0;
  var WEBKIT = 0;
  var MOZILLA = 1;
  var FLASH = 2;
  var webkitChannels = [];
  
  if(channels > 2) {
    throw("Only one or two channels are allowed!");
  }

  var log = function(text) {
    if (typeof console !== 'undefined' && console.log)
      console.log(text);
  };

  var getMovie = function(movieName) {
    if (navigator.appName.indexOf("Microsoft") != -1) {
      return window[movieName];
    } else {
      return document[movieName];
    }
  };

  var fallThrough = function() {
    playerCode = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" width="200" height="30" id="soundbridgeFlash" align="middle">';
    playerCode += '<param name="movie" value="' + pathForFallback + '/soundbridge.swf"/>';
    playerCode += '<param name="allowScriptAccess" value="always" />';
    playerCode += '<param name="quality" value="high" />';
    playerCode += '<param name="scale" value="noscale" />';
    playerCode += '<param name="salign" value="lt" />';
    playerCode += '<param name="bgcolor" value="#ffffff"/>';
    playerCode += '<embed src="' + pathForFallback + '/soundbridge.swf" bgcolor="#ffffff" width="200" height="30" name="soundbridgeFlash" quality="high" align="middle" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />';
    playerCode += '</object>';
    var body = document.getElementsByTagName("body")[0];
    body.innerHTML += playerCode;
    flashObject = getMovie('soundbridgeFlash');
    };


  that.encodeHex = function(word) {
    var HEX = "0123456789ABCDEF";
    var buffer = "";
    buffer += HEX.charAt(word & 0xF);
    buffer += HEX.charAt((word >> 4) & 0xF);
    buffer += HEX.charAt((word >> 8) & 0xF);
    buffer += HEX.charAt((word >> 12) & 0xF);
    return buffer;
  };

  that.setCallback = function(fun) {
    callback = fun;
    
    if(method === WEBKIT) {
      jsNode.onaudioprocess = function(event) {
        //log(event);
        bufferCounter = 0;
        jsNodeOutputBuffer = event.outputBuffer;
        for(var i=0;i<channels;i++) {
          webkitChannels[i] = jsNodeOutputBuffer.getChannelData(i);
        }        
        if (playing) {
          callback(that, webkitChannels[0].length, channels);        
        } else {        
          var len = webkitChannels[0].length;
          for(var i=0;i<len;i++) {
            for(c=0;c<channels;c++) {
              webkitChannels[c][i] = 0.0;
            }
          }
        }
          
      };
    } else if (method === MOZILLA) {
      log("setting interval call function");
      window.setInterval(function() {
        if (!playing) return;
        var written;
        // Check if some data was not written in previous attempts.
        if(tail) {  
          written = audio.mozWriteAudio(tail);
          currentWritePosition += written;
          if(written < tail.length) {
            // Not all the data was written, saving the tail...
            tail = tail.slice(written);
            return; // ... and exit the function.
          }
          tail = null;
        }

        // Check if we need add some data to the audio output.
        var currentPosition = audio.mozCurrentSampleOffset();
        var available = Math.min(currentPosition + prebufferSize - currentWritePosition, 22050 * channels);
        if(available > 0) {
         // Request some sound data from the callback function.
         soundData = new Float32Array(available * channels);
         bufferCounter = 0;
         if (playing) {
           callback(that, soundData.length / channels, channels);
         } else {
           var len = soundData.length;
           for(var i=0;i<len;i++) soundData[i] = 0.0;
         }
         

         // Writting the data.
         written = audio.mozWriteAudio(soundData);
         if(written < soundData.length) {
           // Not all the data was written, saving the tail.
           tail = soundData.slice(written);
         }
         currentWritePosition += written;
        }
      },100);
    } else if (method === FLASH) {
      window.__soundbridgeGenSound = function(bufferSize, bufferPos) {
        flashBuffer = "";
        var durStart = new Date().getTime();
        callback(that, bufferSize, channels);
        return flashBuffer;
      };
      flashObject.setCallback("__soundbridgeGenSound");
            
    }
    
    
  };

  that.addToBuffer = function() {
    if(arguments.length !== channels) {
      throw("Given wrong number of arguments, not matching channels");
    }
    
    if (method === WEBKIT) {
      for(var i=0;i<channels;i++) {
        webkitChannels[i][bufferCounter] = arguments[i];
      }
      bufferCounter++;
    } else if (method === MOZILLA) {
      for(var i=0;i<channels;i++) {
        soundData[bufferCounter] = arguments[i];
        bufferCounter++;
      }      
    } else if (method === FLASH) {
      // currently only mono, discarding other channels.
      var word = Math.round((arguments[0] * 32768.0 * 0.5) + 32768.0);
      flashBuffer += that.encodeHex(word);   
    }
  };
  that.play = function() {
    playing = true;
    if(method === FLASH && flashObject !== null) flashObject.play();      
  };

  that.stop = function() {
    playing = false;
    if(method === FLASH && flashObject !== null) flashObject.stop();
  };

  if (typeof webkitAudioContext !== 'undefined') {
    context = new webkitAudioContext();
    jsNode = context.createJavaScriptNode(8192, 0, channels);
    jsNode.connect(context.destination);
    method = WEBKIT;
    log("I'm on webkit");
  } else if (typeof AudioContext !== 'undefined') {
    context = new AudioContext();
    jsNode = context.createJavaScriptNode(8192, 0, channels);
    jsNode.connect(context.destination);
    method = WEBKIT;
    log("I'm on webkit");
  } else if ((typeof Audio !== 'undefined') && (audio = new Audio()) && audio.mozSetup) {
    log("I'm on an audio build of mozilla");
    audioElement = audio;
    audioElement.mozSetup(channels, 44100);
    prebufferSize =  44100 / 2;
    method = MOZILLA;
  } else {
    method = FLASH;
    log("I suck and will fall through to flash");
    fallThrough();
    
  }


  // initializing
  return that;




};
