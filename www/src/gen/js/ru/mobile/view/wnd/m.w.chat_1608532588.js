mwChat = function(id, data){
	wndMgr.wndChat = this;
	
	mwChat.superclass.constructor.apply(this, arguments);
};

utils.extend(mwChat, Wnd);


mwChat.prototype.calcName = function(){
	return 'wchat';
};

mwChat.prototype.initWndOptions = function(){
	mwChat.superclass.initWndOptions.apply(this, arguments);
	
	this.options.setHash = false;
	this.options.showButtons = false;
	this.options.canClose = false;
	this.options.swiped = false;
};

mwChat.prototype.calcChildren = function(){
	this.children.chat = pChat;
};

utils.overrideMethod(mwChat, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	var self = this;
	
	this.wrp
		.on('focusin', function(){
			self.clearTimeout(self.focusedTO);
			
			self.wrp.addClass('-state-focused');
		})
		.on('focusout', function(){
			self.focusedTO = self.setTimeout(function(){
				self.wrp.removeClass('-state-focused');
			}, 50);
		});
});

mwChat.prototype.refresh = function(){};


mwChat.prototype.getBound = function(){
	var chat = this.children.chat;
	
	if( !chat.wrp || !chat.wrp.height() )
		return 0;
	
	return 46 + chat.announce.getContHeight(); // Высота в режиме min + высота объявления
};

mwChat.prototype.setSize = function(){
	this.wrp.css({bottom: 0});
};

mwChat.prototype.setZ = function(){
	this.wrp.css({'z-index': 100});
};

mwChat.prototype.bindBaseSwipe = function(){
	var self = this;
	
	this.wrp
		.on('touchstart', '.wnd-cont-wrp', function(e){
			self.swipeStar({touches: e.originalEvent.touches});
		})
		.on('touchmove', '.wnd-cont-wrp', function(e){
			self.swipeMove({touches: e.originalEvent.touches});
		})
		.on('touchend', '.wnd-cont-wrp',function(){
			self.swipeEnd();
		});
};


mwChat.prototype.swipeStar = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 )
		return;
	
	this.swipe = {
		startPos: utils.getPosFromEvent(opt.touches[0]),
	};
};

mwChat.prototype.swipeMove = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe )
		return;
	
	var curSwipePos = utils.getPosFromEvent(opt.touches[0]),
		swipe = this.swipe;
	
	swipe.dY = swipe.startPos.y - curSwipePos.y;
};

mwChat.prototype.swipeEnd = function(){
	if( !this.swipe )
		return;
	
	this.doSwipe(this.swipe.dY);
	
	delete this.swipe;
};

mwChat.prototype.doSwipe = function(dY){
	if( Math.abs(dY||0) < 20 )
		return;
	
	var sizes = {
			min: 0,
			med: 1,
			max: 2
		},
		chat = this.children.chat,
		curSize = sizes[chat.size],
		nextSize = curSize + (dY > 0 ? 1 : -1);
	
	if( nextSize < 0 || nextSize > 2 )
		return;
	
	for(var size in sizes){
		if( sizes[size] == nextSize ){
			chat.changeSize(size);
			
			return;
		}
	}
};



utils.overrideMethod(pChat, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	var self = this;
	
	this.wrp
		.on('touchstart', '.chat-mainCont, .chat-smile-wrp, .chat-chanInfo-wrp', function(e){
			e.stopPropagation();
		})
		.on('click', '.view-chat[data-size="min"] .chat-mainCont', function(e){
			if( e._linkСlicked_ )
				return;
			
			e.preventDefault();
			e.stopPropagation();
			
			self.changeSize('med');
		})
		.on('click', '.view-chat[data-size="min"] .chat-messages-text a', function(e){			
			e._linkСlicked_ = true;
		});
});

pChat.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	var size = wndMgr.getWndLayerSize(),
		margin = 14;
	
	this.wrp.find('.chat-cont').css({
		width: size.width - margin,
		height: this.size == 'max' ? size.height - margin - this.announce.getContHeight() : ''
	});
};

pChat.prototype.toggleDisplay = function(show, notifId){
	this.parent.toggleDisplay(show);
	
	if( notifId )
		notifMgr.runEvent(Notif.ids.applResize);
};


pChat.prototype.getDefSize = function(){return 'min';};


pChat.prototype.bindSearchEvent = function(){};


utils.overrideMethod(pChat, 'doResize', function __method__(){
	this.makeResize();
	
	__method__.origin.apply(this, arguments);
});


pChat.prototype.prepareDrag = function(){};

pChat.prototype.startMoveCont = function(){};

pChat.prototype.moveContEnd = function(){};



utils.overrideMethod(bChat_announce, 'pullNewAnnounce', function __method__(){
	var ann = __method__.origin.apply(this, arguments);
	
	if( ann )
		notifMgr.runEvent(Notif.ids.applResize);
	
	return ann;
});

utils.overrideMethod(bChat_announce, 'stopCycle', function __method__(){
	__method__.origin.apply(this, arguments);
	
	notifMgr.runEvent(Notif.ids.applResize);
});



bChat_chanInfo.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('touchstart', '.chat-info', function(e){
			self.swipeStar({touches: e.originalEvent.touches});
		})
		.on('touchmove', '.chat-info', function(e){
			self.swipeMove({touches: e.originalEvent.touches});
		})
		.on('touchend', '.chat-info',function(){
			self.swipeEnd();
		})
		.on('click', '.chat-info', function(e){
			var $chat = self.parent.wrp.find('.view-chat');

			if( !$chat.hasClass('-expandUsers') ){
				$chat.toggleClass('-expandUsers');
				
				return;
			}
			
			if( $(e.target).closest('.chat-info-user, .chat-info-actionsWrp, .chanInfo-invite-wrp', this).length )
				return;
			
			$chat.toggleClass('-expandUsers');
		});
};


bChat_chanInfo.prototype.swipeStar = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 )
		return;
	
	this.swipe = {
		startPos: utils.getPosFromEvent(opt.touches[0])
	};
};

bChat_chanInfo.prototype.swipeMove = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swipe )
		return;
	
	var curSwipePos = utils.getPosFromEvent(opt.touches[0]),
		swipe = this.swipe;
	
	swipe.dX = swipe.startPos.x - curSwipePos.x;
};

bChat_chanInfo.prototype.swipeEnd = function(){
	if( !this.swipe )
		return;
	
	this.doSwipe(this.swipe.dX);
	
	delete this.swipe;
};

bChat_chanInfo.prototype.doSwipe = function(dX){
	if( Math.abs(dX||0) < 20 )
		return;
	
	this.parent.wrp.find('.view-chat').toggleClass('-expandUsers', dX > 0);
};



utils.overrideMethod(bChat_answer, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.wrp.find('.chat-answ-text').data('view-block', 'nearest');
});

utils.overrideMethod(bChat_answer, 'postMessage', function __method__(){
	var $answText = __method__.origin.apply(this, arguments);
	
	$answText.focus();
});



utils.overrideMethod(bChat_chanInfoInvite, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.wrp
		.find('.chat-info-invite-name')
		.data('view-block', 'nearest')
		.data('view-inline', 'nearest');
});