const electron = require('electron'),
fs = require('fs'),
messages = require('./message.js');

const {app, BrowserWindow} = electron.remote

;(function(win, $, ipc){
	'use strict';

	var canvasProcNum = -1;
	var threadErrCheck;
	var thisWin, canvasWin;
	var isFirst = false;

	var closeCanvasResetCapture = function(){
		if(threadErrCheck) return;

		if(!canvasWin.isDestroyed() && 'undefined' !== typeof canvasWin) canvasWin.close();
		if(!thisWin.isDestroyed() && 'undefined' !== typeof thisWin) thisWin.reload();


	};

	// Data transfered from Main process
	ipc.on('captureInfo', (event, config) => {
		win.config = config

		thisWin = BrowserWindow.fromId(config.captureId);

		// web view element
		if('undefined' === config.url) thisWin.close();
		
		// thisWin.webContents.openDevTools();

		$('body').append('<webview id="webView" src="'+config.url+'" preload="../libs/inject.js" style="display:inline-flex; width:'+config.size.width+'px; height:100%; overflow:hidden;" autosize="on"></webview>');

		// According to Redirectable Page Issue
		if(config.isRedirect){
			setTimeout(function(){
				
				if(isFirst) return;
				isFirst = true;
				
				clearTimeout(threadErrCheck);
				threadErrCheck = null;

				threadErrCheck = setTimeout(function(){
					closeCanvasResetCapture();
			    },5000);
			    
			    if(config.popUpVisible && 'undefined' !== typeof config.ENVIRONMENT && config.ENVIRONMENT === "DEV")
			    	$('body').find('webview')[0].openDevTools();

	        	$('body').find('webview')[0].send('winConfig', config)
	        	
			},3000);
		}else{
			$('body').find('webview').on('did-finish-load', (e) => {
				
				clearTimeout(threadErrCheck);
				threadErrCheck = null;

				threadErrCheck = setTimeout(function(){
					closeCanvasResetCapture();
			    },5000);
			    
			    if(config.popUpVisible && 'undefined' !== typeof config.ENVIRONMENT && config.ENVIRONMENT === "DEV")
			    	$('body').find('webview')[0].openDevTools();

	        	$('body').find('webview')[0].send('winConfig', config)
			});
		}
		
		// $('body').find('webview').on('did-get-redirect-request', (e) => {
		// })
		
	})

	ipc.on('canvasProcess', (event, procNum) => {
	    if(canvasProcNum >= procNum) return;

	    clearTimeout(threadErrCheck);
		threadErrCheck = null;

		canvasProcNum = procNum;

		// threadErrCheck = setTimeout(function(){
		// 	// closeCanvasResetCapture();
	 //    },5000);

	})

	ipc.on('canvasProcessEnd', (event, procNum) => {
		
		clearTimeout(threadErrCheck);
		threadErrCheck = null;

		if('undefined' !== typeof thisWin && !thisWin.isDestroyed()) thisWin.close();
		
	})

	ipc.on('setCanvasId', (event, canvasId) => {
	    canvasWin = BrowserWindow.fromId(canvasId);
	})
})(window, jQuery, electron.ipcRenderer);