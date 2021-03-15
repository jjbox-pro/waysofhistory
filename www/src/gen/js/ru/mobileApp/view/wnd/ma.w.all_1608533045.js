utils.reExtend(wBonus, ScreenWnd);

    utils.reExtend(wBonusSpecial, wBonus);

utils.reExtend(wTowns, ScreenWnd);
	/*
	wTowns.prototype.initOptions = function(){
		wTowns.superclass.initOptions.apply(this, arguments);
		
		this.options.useCache = true;
	};
	*/

utils.reExtend(wMessages, ScreenWnd);

utils.reExtend(wReports, ScreenWnd);

utils.reExtend(wAnnounce, ScreenWnd);

utils.reExtend(wRate, ScreenWnd);


utils.reExtend(wCountry, ScreenWnd);

utils.reExtend(wScienceNext, ScreenWnd);

//utils.reExtend(wMarket, ScreenWnd);

WndMgr.regWnd('market', wMarket);

wMarket.prepareType = function(type){
	if( type != wMarket )
		return;
	
	var marketDisplayInfo = wMarket.getDisplayInfo()||{};
	
	return wndMgr.getWndClassesByHash(marketDisplayInfo.name||'')[0]||type;
};


wMarket.prototype.getPageConstructor = function(){
	return wMarket;
};

wMarket.prototype.onIdentShow = function(){
	for(var inheritor in wMarket.inheritors){
		inheritor = wMarket.inheritors[inheritor]();
		
		if( !(this instanceof inheritor) ){
			var inheritorWnd = wndMgr.getFirstWndByType(inheritor);
			
			if( inheritorWnd ){
				this.closeInheritorWnd(inheritorWnd);
				
				break;
			}
		}
	}
	
	this.saveLastMarketWnd();
	
	wMarket.superclass.onIdentShow.apply(this, arguments);
};


//	utils.reExtend(wTrade, wMarket);
//	
//	utils.reExtend(wStream, wMarket);
//	
//	utils.reExtend(wBarter, wMarket);
	
	
utils.reExtend(wMoney, ScreenWnd);



mwChat = function(id, data){
	this.hashName = 'chat';
	
	mwChat.superclass.constructor.apply(this, arguments);
};

utils.extend(mwChat, ScreenWnd);

WndMgr.regWnd('chat', mwChat);


mwChat.prototype.calcName = function(){
	return 'wchat';
};

mwChat.prototype.initWndOptions = function(){
	mwChat.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showButtons = false;
	this.options.canClose = false;
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

mwChat.prototype.setZ = function(){
	mwChat.superclass.setZ.apply(this, arguments);
};

mwChat.prototype.delete = function(){
	this.setActive(false);
	
	this.resetZ();
	
	this.hideCont();
};





ChatMgr.prototype.getChat = function(chat){
	return chat;
};





utils.reOverrideMethod(pChat, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
    
    this.wrp
		.on('touchstart', '.chat-smile-wrp, .chat-chanInfo-wrp', function(e){
			e.stopPropagation();
		});
});

pChat.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	var size = wndMgr.getWndLayerSize(),
		margin = 14;
	
	this.wrp.find('.chat-cont').css({
		width: size.width - margin,
		height: this.size == 'max' ? size.height - (margin * 0.5) - this.announce.getContHeight() : ''
	});
};


pChat.prototype.getDefSize = function(){return 'max';};





//bBonus_info.prototype.calcChildren = function(){
//	this.children.luck = bMMenu_luck;
//	
//	this.children.bonus = bMMenu_bonus;
//};
//
//bBonus_info.prototype.modifyCont = function(){
//	this.cont.prepend(tmplMgr.bonus.shares());
//};





wAbility.prototype.getToggleProp = function(){
    var imgOffset = this.getImgCenterOffset(), $target = $();
    
    switch(this.id){
        case Ability.ids.trade:
            break;
        case Ability.ids.attack:
            var screen = wndMgr.getScreen();
            
            if( !screen.isInstanceOf(TownScreen) )
                break;
            
            $target = screen.getAttacks().$getIcon();
            
            break;
        default:
            var screenBar = wndMgr.bars.screenBar;
            
            if( screenBar.isContHidden() )
                break;
            
            $target = screenBar.getScreenPageByScreenInfo(screenBar.getScreenInfoByAbil(this.id)).wrp||$target;
    }
    
	return {top: this.getTopOffset(imgOffset, $target), left: this.getLeftOffset(imgOffset, $target)};
};

wAbility.prototype.getTopOffset = function(imgOffset, $target){
    var topOffset = wndMgr.getWindowSize().height
                    - 90 // Отступ высоты нижней панели
                    - 110 // Отсуп картинки сверху
                    - (this.topOffset||0); // Отсуп сверху до контента;
    
    if( !$target.length )
        return topOffset;
    
    switch(this.id){
        case Ability.ids.trade:
            break;
        default:
            topOffset = ($target.offset().top + ($target.height() * 0.5)) - imgOffset.top;
    }
    
    return topOffset;
};

wAbility.prototype.getLeftOffset = function(imgOffset, $target){
    var leftOffset = 0;
    
    if( !$target.length )
        return leftOffset;
    
    switch(this.id){
        case Ability.ids.trade:
            break;
        default:
            leftOffset = ($target.offset().left + ($target.width() * 0.5)) - imgOffset.left;
    }
    
    return leftOffset;
};





wSend_view.prototype.modifyCont = function(){
	this.cont.find('.send-traders-wrp').append(tmplMgr.market.button.tradersMove());
};





wTradersMove.prepareData = function(parentWnd){
	if( parentWnd instanceof ScreenWnd )
		return false;
	
	return {parentWnd: parentWnd};
};





utils.reOverrideMethod(tabOptGeneral, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
});

tabOptGeneral.prototype.bindEventExt = function(){
    this.wrp.on('change', '.options-mapVersion', function(){
        ls.setMapVersion(+$(this).val());
        
        iMap.clearChunks(function(){
            notifMgr.runEvent(Notif.ids.mapVersion);
        });
    });
};





wSlotBld.prototype.buildSlot = function(slot){
	this.close();

    reqMgr.slotBuild(slot);
};

wSlotBld.prototype.rebuildSlot = function(slot){
	this.close();
                 
    reqMgr.slotRebuild(slot);
};

wSlotBld.prototype.destroySlot = function(onelevel, slot){
	this.close();

	reqMgr.slotDestroy(slot, onelevel);
};