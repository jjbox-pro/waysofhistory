ApplGame.prototype.allowImmediateAbilShow = function(){
	return true;
};

ApplGame.prototype.initDevice = function(){
	var viewportCont = 'width=device-width, initial-scale=1',
		viewport = document.querySelector('meta[name=viewport]');
	
	if( debug.useTransformZoom() )
		viewportCont += ', user-scalable=0, minimum-scale=1, maximum-scale=1';
    else if( !this.isDeviceZoomAvailable() )
        viewportCont += ', user-scalable=0';
	
	viewport.setAttribute('content', viewportCont);
	
	if( window.top != window ){
		try{
			viewport = window.top.document.querySelector('meta[name=viewport]');
	
			viewport.setAttribute('content', viewportCont);
		}
		catch(e){}
	}
	
	wndMgr.$html.addClass('-if-mob');
	
	/*
	var meta = document.createElement('meta');
	
	meta.setAttribute('name', 'theme-color');
	meta.setAttribute('content', '#faebd7');
	
	viewport.parentNode.insertBefore(meta, viewport);
	*/
};
    
    ApplGame.prototype.isDeviceZoomAvailable = function(){
        return true;
    };
    
ApplGame.prototype.bindKeyEvents = function(){};

ApplGame.prototype.initResizeDelay = function(){
	this.resizeDelay = 0;
};

utils.overrideMethod(ApplGame, 'addInterfaces', function __method__(){
	this.addBars();
	
	wndMgr.addWnd(mwChat);
	
	__method__.origin.call(this);
	
	if( !debug.isDen() )
		return;
	
	this.initSize();
});

ApplGame.prototype.addBars = function(){
	(new StatusBar()).show();
	
	(new MenuBar()).show();
	
	wndMgr.addNavBar();
	
	wndMgr.resizeWndLayer();
};

ApplGame.prototype.initQuests = function(){
	// Открытие окна 1-го квеста
	if( Quest.isBonus(Quest.ids.reward) )
		setTimeout(function(){
			wndMgr.addWnd(wQuestInfo, Quest.ids.reward);
		}, 750);
};


utils.overrideMethod(ApplGame, 'onInited', function __method__(){
	__method__.origin.apply(this, arguments);
	
	if( !ls.getMobileAccept(LS.def.MobileAccept) ){
		setTimeout(function(){
			wndMgr.addWnd(wMobileAccept);
			
			ls.setMobileAccept(true);
			
			servBuffer.apply();
		}, 2500);
	}
});


ApplGame.prototype.initSize = function(){
	wndMgr.$size = $('<div class="mob-size"></div>');
	
	wndMgr.$body.append(wndMgr.$size);
	
	wndMgr.$size.draggable();
	
	wndMgr.$size.on('click', function(){
		appl.showSize();
	});
	
	wndMgr.$size.css({
		top: '20px',
		left: '20px'
	});
	
	wndMgr.$document.on('click', function(e){
		appl.showSize(e.target);
	});
	
	appl.showSize();
};

ApplGame.prototype.showSize = function(el){
	/*
	var html = '';
	
	html += '<div>wrp.h: ' + this.wrp.height() + '</div>';
	html += '<div>$contWrp.h: ' + this.$contWrp.height() + '</div>';
	
	appl.showSize(html);
	*/
	
	
	var html = '';
	
	html += '<div>html.clientWidth: ' + wndMgr.documentElement.clientWidth + '</div>';
	html += '<div>html.clientHeight: ' + wndMgr.documentElement.clientHeight + '</div>';
    html += '<div>html.offsetWidth: ' + wndMgr.documentElement.offsetWidth + '</div>';
	html += '<div>html.offsetHeight: ' + wndMgr.documentElement.offsetHeight + '</div>';
	html += '<div>window.outerWidth: ' + wndMgr.window.outerWidth + '</div>';
	html += '<div>window.outerHeight: ' + wndMgr.window.outerHeight + '</div>';
	html += '<div>window.innerWidth: ' + wndMgr.window.innerWidth + '</div>';
	html += '<div>window.innerHeight: ' + wndMgr.window.innerHeight + '</div>';
	html += '<div>screnn.width: ' + wndMgr.deviceScreen.width + '</div>';
	html += '<div>screnn.height: ' + wndMgr.deviceScreen.height + '</div>';
	html += '<div>devicePixelRatio: ' + wndMgr.window.devicePixelRatio + '</div>';
	
	if( el ){
		html += '<div>el.offsetWidth: ' + el.offsetWidth + '</div>';
		html += '<div>el.offsetHeight: ' + el.offsetHeight + '</div>';
		html += '<div>el.font: ' + wndMgr.window.getComputedStyle(el).font + '</div>';
		
	}
	
	//html += text;
	
	wndMgr.$size.html(html);
};