MenuBar = function(){
	MenuBar.superclass.constructor.apply(this, arguments);
};

utils.extend(MenuBar, Bar);


MenuBar.prototype.calcName = function(){
	return 'menuBar';
};

MenuBar.prototype.calcTmplFolder = function(){
	return tmplMgr.menuBar;
};

MenuBar.prototype.calcChildren = function(){
	this.children.trade = bMMenu_trade;
	
	this.children.mainmenu = bShortMainMenu;
	
	this.children.questlist = bQuestList;
};

MenuBar.prototype.setWrp = function(){
	MenuBar.superclass.setWrp.apply(this, arguments);
	
	this.hideCont();
};

MenuBar.prototype.afterDraw = function(firstShow){
    if( !firstShow )
        return;
    
    this.setTimeout(this.setExpand, 500);
};


MenuBar.prototype.getSide = function(){
	return wndMgr.isLandscape() ? 'left' : ls.getMenuSide('top');
};

MenuBar.prototype.setSize = function(){
	var size = wndMgr.getWindowSize();
	
	this.landscape = wndMgr.isLandscape(size);
	
	if( this.landscape ){
		size.width = '';

		size.height -= wndMgr.getStatusBarHeight();
	}
	else
		size.height = '';
	
	this.wrp.css(size);
};

MenuBar.prototype.setPos = function(){
	var side = this.getSide(),
		pos = {top: '', bottom: ''};
	
	this.wrp.attr('data-side', side);
	
	if( side == 'bottom' )
		pos.bottom = wndMgr.getNavBarHeight();
	else
		pos.top = wndMgr.getStatusBarHeight();
	
	this.wrp.css(pos);
};

MenuBar.prototype.onExpandStart = function(){
	if( this.isExpanded() && this.children.trade )
		this.children.trade.setBlockPos();
    
    MenuBar.superclass.onExpandStart.apply(this, arguments);
};



bMMenu_trade.prototype.afterContSet = function(){
	this.cont.toggleClass('-type-questOffset', wofh.account.getActiveQuests(true).length > 0);
};

bMMenu_trade.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('touchstart', '.mmenu-trade', function(e){
			self.swipeStarBlock({touches: e.originalEvent.touches});
		})
		.on('touchmove', '.mmenu-trade', function(e){
			self.swipeMoveBlock({touches: e.originalEvent.touches});
		})
		.on('touchend', '.mmenu-trade',function(){
			self.swipeEndBlock();
		});
};

bMMenu_trade.prototype.makeResize = function(){
	if( !this.parent.wasShown() || this.parent.isContHidden() )
		return;
	
	this.setBlockPos();
};


bMMenu_trade.prototype.setBlockPos = function(pos){
	if( !this.cont )
		return;
	
	var tradeBlockPos = ls.getTradeBlockPos({}),
		orientation = 'p',
		dir = 'left',
		minDir = 0,
		size = 'width',
		dirs = {left: '', top: ''};
	
	if( wndMgr.isLandscape() ){
		orientation = 'l';
		dir = 'top';
		minDir = this.cont.hasClass('-type-questOffset') ? 30 : 5;
		size = 'height';
	}
	
	if( pos === undefined )
		pos = tradeBlockPos[orientation];
	
	pos = pos||0;
	
	pos = Math.max(minDir, pos);
	
	pos = Math.min(pos, this.parent.cont[size]() - this.cont[size]());
	
	dirs[dir] = pos;
	
	this.cont.css(dirs);
	
	if( wndMgr.isKeyboardOpen() )
		return;
	
	tradeBlockPos[orientation] = pos;
	
	ls.setTradeBlockPos(tradeBlockPos);
};


bMMenu_trade.prototype.swipeStarBlock = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 )
		return;
	
	this.swiping = {
		startPosition: this.cont.position(),
		startPos: new Vector2D(utils.getPosFromEvent(opt.touches[0])),
		dirCoor: wndMgr.isLandscape() ? {dir: 'top', coor: 'y'} : {dir: 'left', coor: 'x'}
	};
};

bMMenu_trade.prototype.swipeMoveBlock = function(opt){
	opt = opt||{};
	
	if( opt.touches.length != 1 || !this.swiping )
		return;
	
	var curSwipePos = utils.getPosFromEvent(opt.touches[0]);
	
	this.doSwipeBlock(new Vector2D(curSwipePos).diffVector(this.swiping.startPos));
};

bMMenu_trade.prototype.swipeEndBlock = function(){
	delete this.swiping;
};

bMMenu_trade.prototype.doSwipeBlock = function(dPoint){
	if( !this.swiping )
		return;
	
	if( !this.swiping.allowMove ){
		if( Math.abs(dPoint[this.swiping.dirCoor.coor]||0) < 10 )
			return;
		
		this.swiping.allowMove = true;
	}
	
	this.setBlockPos(this.swiping.startPosition[this.swiping.dirCoor.dir] + dPoint[this.swiping.dirCoor.coor]);
};



bShortMainMenu.prototype.initOptions = function(){
	bShortMainMenu.superclass.initOptions.apply(this, arguments);
	
	this.options.inactive = true;
};

bShortMainMenu.prototype.getData = function(){
	this.data.opened = true;
	
	bShortMainMenu.superclass.getData.apply(this, arguments);
};

bShortMainMenu.prototype.modifyCont = function(){
	this.cont.toggleClass('-type-traders', wofh.town.traders.count > 0);
};

bShortMainMenu.prototype.calcChildren = function(){
	this.children.btns = bSMMenu_btns;
};

bShortMainMenu.prototype.addNotif = function(){
    if( this.canDisplay() )
        return;
    
	this.notif.other[Notif.ids.accQuests] = function(){
        this.detachNotifElem(Notif.ids.accQuests);
        
        this.show();
        
        notifMgr.runEvent(Notif.ids.applResize);
    };
    
    this.notif.other[Notif.ids.accQuests].params = [Quest.ids.map];
};

bShortMainMenu.prototype.canDisplay = MMBtn_map.prototype.canDisplay;

bShortMainMenu.prototype.bindEvent = function(){};

bShortMainMenu.prototype.resize = function(){};



utils.overrideMethod(bSMMenu_btns, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.show.push(Notif.ids.ifShown);
});

bSMMenu_btns.prototype.canDisplay = function(){
	return wofh.account.ability.get(Ability.ids.map);
};


utils.overrideMethod(bSMMenu_btns, 'getBtns', function __method__(){
	var btns = __method__.origin.apply(this, arguments);
	
	btns.splice(1, 0, new MMBtn_map());
	
	return btns;
});





bMMenu_luck.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.luck;
};



bMMenu_pop.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.pop;
};



bMMenu_trade.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.trade;
};



bMMenu_attacks.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.attacks;
};





bQuestList.prototype.cacheCont = function(){
	this.$questlist = this.cont.find('.view-questlist');
};

bQuestList.prototype.makeResize = function(){
	if( !this.$questlist )
		return;
	
	this.$questlist.css({'max-width': ''});
	
	if( !wndMgr.isLandscape() )
		return;
	
	if( !this.refreshing )
		this.wrp.addClass('-state-collapsed');
	
	// Минимальная задержка, чтобы успел пересчитаться размер оконного слоя
	this.setTimeout(function(){
		this.$questlist.css({'max-width': wndMgr.getWndLayerSize().width});		
	}, 0);
};

bQuestList.prototype.refresh = function(){
	this.refreshing = true;
	
	this.show();
};

bQuestList.prototype.afterShow = function(){
	delete this.refreshing;
};


bQuestList.prototype.bindActionEvent = function(){
	var self = this;
	
	this.wrp
			.on('click', '.quest-roll', function(){
				self.wrp.toggleClass('-state-collapsed');
			})
			.on('focusout', function(){
				self.wrp.addClass('-state-collapsed');
			});
};


bQuestList.prototype.getListView = function(){
	return bQuestList.type.text;
};

bQuestList.prototype.togglePos = function(toggle){};

bQuestList.prototype.startMoveList = function(val){};

bQuestList.prototype.moveList = function(){};

bQuestList.prototype.checkMove = function(){};