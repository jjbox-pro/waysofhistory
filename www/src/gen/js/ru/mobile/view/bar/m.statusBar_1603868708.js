StatusBar = function(){
	StatusBar.superclass.constructor.apply(this, arguments);
};

utils.extend(StatusBar, Bar);


StatusBar.prototype.calcName = function(){return 'statusBar';};

StatusBar.prototype.calcTmplFolder = function(){return tmplMgr.statusBar;};

StatusBar.prototype.calcChildren = function(){
	this.children.statusBar = bStatusBar_info;
};


StatusBar.prototype.getSide = function(){return 'top';};

StatusBar.prototype.setExpand = function(){};

StatusBar.prototype.toggleExpand = function(){};

StatusBar.prototype.isExpanded = function(){return true;};

	
	
bStatusBar_info = function(){
    this.name = 'info';
    
	bStatusBar_info.superclass.constructor.apply(this, arguments);
};

utils.extend(bStatusBar_info, Block);


bStatusBar_info.prototype.initOptions = function(){
	bStatusBar_info.superclass.initOptions.apply(this, arguments);

	this.options.inactive = true;
};

bStatusBar_info.prototype.addNotif = function(){
	this.notif.other[Notif.ids.mobToggleBars] = function(data){
		if( this.wrp )
			this.wrp.find('.info-bars').toggleClass('-state-minimized', data.hide);
	};
	
	if( debug.isAdmin() || debug.isTest() || debug.isNA() ){
		this.notif.other[Notif.ids.sysConsoleError] = function(){
			if( this.wrp )
				this.wrp.find('.test-consoleErrors').toggleClass('-type-error', ls.getConsoleErrors([]).length > 0);
		};
	}
};

bStatusBar_info.prototype.calcChildren = function(){
	this.children.mute = bMMenu_mute;
	
	this.children.clock = pClock;
	
	this.children.towns = bStatusBar_towns;
};

bStatusBar_info.prototype.bindEvent = function(){
	this.wrp
		.on('click', '.info-fullScreen', function(){
			appl.toggleFullScreen();
		})
		.on('click', '.info-bars', function(){
			wndMgr.toggleBars(!ls.getLandscapeNoPanels());
		})
		.on('click', '.info-mute', function(){
			set.sound.globalVolume($(this).hasClass('-active') ? Snd.volume.min : Snd.volume.max, true);
		});
};


bStatusBar_info.prototype.afterContSet = function(){
	this.$controlsWrp = this.wrp.find('.info-controls-wrp');
};



bMMenu_mute.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.mute;
};



bStatusBar_towns = function(parent){
	bStatusBar_towns.superclass.constructor.apply(this, arguments);
};

utils.extend(bStatusBar_towns, bMMenu_towns);


bStatusBar_towns.prototype.calcTmplFolder = function(){ 
	return tmplMgr.mmenu.towns;
};

bStatusBar_towns.prototype.afterContSet = function(){
	this.$townName = this.wrp.find('.mmenu-towns-name');
};

bStatusBar_towns.prototype.makeResize = function(){
	this.$townName.css('max-width', this.wrp.width() - this.parent.$controlsWrp.width() - 50);
};