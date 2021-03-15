
/*
 * Интерфейс города
 */

iTown = function(){
	iTown.superclass.constructor.apply(this, arguments);
};

utils.extend(iTown, Interface);


iTown.prototype.calcName = function(){
	return 'town';
};

iTown.prototype.calcTmplFolder = function(){
	return tmplMgr.iTown;
};

iTown.prototype.calcChildren = function(){
	this.children.loadIndicator = bLoadIndicator;

	//виды на главной странице
	if( debug.isSimplifiedTown() ){
		wndMgr.$body.addClass('-simplified');
		
		this.children.town = bckTownOld;
	}
	else
		this.children.town = bckTown;

	this.children.mainmenu = bMainMenu;
	this.children.stock = pStock;
	
	this.children.garrison = pGarrison;

	if( debug.isSimplifiedTown() )
		this.children.bldqueue = pBldQueue;

	this.children.systmenu = pSystMenu;

	this.children.questlist = bQuestList;

	this.children.chat = pChat;

	if( wofh.platform.friends )
		this.children.friends = pFriends;

	this.children.clock = pClock;

	this.children.swapSlot = bSwapSlot;
};

iTown.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townRainbow];
    
    this.notif.other[Notif.ids.townChanged] = function(){
        this.tryResize(0);
    };
};

iTown.prototype.afterContSet = function(firstDraw){
	if( firstDraw )
		this.$right = this.wrp.find('.town-right-wrp');

	this.wrp.addClass('-invis');
};

iTown.prototype.beforeShowChildren = function(){
	wndMgr.$body.removeClass('-if-map');
};

iTown.prototype.afterDraw = function(){
	this.updRes();
};

iTown.prototype.resize = function(){
	this.tryResize();
};
    
    iTown.prototype.tryResize = function(delay){
        if ( !this.ready )
            return;
        
        this.clearTimeout(this.resizeTO);
        
        if( delay === 0 )
            this.doResize();
        else
            this.resizeTO = this.setTimeout(this.doResize, delay||200);
    };
    
    iTown.prototype.doResize = function(){
        var hasDef = Town.hasDefMoment(wofh.town.army);

        var mainmenu = this.children.mainmenu;

        mainmenu.resize();

        mainmenu.wrp.find('.mmenu-trCorner').css({top: hasDef ? 85: 0});
        mainmenu.wrp.find('.mmenu-bonus').css({top: hasDef ? 25: 90});

        if( this.children.chat.canDisplay() )
            this.children.chat.moveContEnd();   

        //положение правых панелей
        if( debug.isSimplifiedTown() ){
            var simplified = $(document).width() > 1250;

            mainmenu.wrp.find('.mmenu-trCorner').toggleClass('-simplified', simplified);

            if( this.children.stock.cont )
                this.children.stock.cont.toggleClass('-simplified', simplified);
            if( this.children.garrison.cont )
                this.children.garrison.cont.toggleClass('-simplified', simplified);
            if( this.children.bldqueue && this.children.bldqueue.cont )
                this.children.bldqueue.cont.toggleClass('-simplified', simplified);
        }

        this.resizeRight(hasDef ? 95 : 0);

        this.resizeLeft();
        
        this.getTown().resize();
    };
    
        iTown.prototype.resizeRight = function(topPadding){
            // Если правые панели не видны, не ресайзим
            if( this.$right.is(':hidden') )
                return;

            var stock = this.children.stock,
                garrison = this.children.garrison,
                bldqueue = this.children.bldqueue;

            //доступная для правых панелей высота
            var availHeight = appl.getAvailHeight() - topPadding,
                padding = 10,
                garrisonMinHeight = 146,
                stockMinHeight = 200;

            //обнуляем высоты контента
            stock.setContHeight('', true);
            garrison.setContHeight('', true);

            //высоты правых панелей
            var stockContHeight = stock.getContHeight(),
                stockHeight = stock.getSizePx({marg: true}).height - stockContHeight,
                garrisonContHeight = garrison.getContHeight(),
                garrisonHeight = garrison.getSizePx({marg: true}).height - garrisonContHeight,
                queueHeight = bldqueue ? bldqueue.getSizePx({marg: true}).height : 0,
                blockCount = utils.toInt(stockHeight > 0) + utils.toInt(garrisonHeight > 0) + utils.toInt(queueHeight > 0),
                diffHeight = availHeight - stockHeight - garrisonHeight - queueHeight - (blockCount-1) * padding;

            if( garrison.getContRealHeight() ){
                stockContHeight = Math.min(stockContHeight, diffHeight - garrisonMinHeight);
                stockContHeight = Math.max(stockContHeight, stockMinHeight);

                garrisonContHeight = Math.max(garrisonMinHeight, diffHeight - stockContHeight);
            } 
            else{
                stockContHeight = Math.min(stockContHeight, diffHeight);
                stockContHeight = Math.max(stockContHeight, stockMinHeight);

                garrisonContHeight = 0;
            }

            //правим высоты видов
            stock.setContHeight(stockContHeight, true);
            garrison.setContHeight(garrisonContHeight, true);

            stockHeight += stockContHeight;

            // Устанавливаем вертикальное положения блков
            stock.setStyle({top: topPadding});
            garrison.setStyle({top: stockHeight + padding + topPadding});

            if( bldqueue ){
                garrisonHeight += garrisonContHeight;

                bldqueue.setStyle({top: stockHeight + garrisonHeight + padding * 2 + topPadding});
            }

            //обновляем гарнизон
            garrison.checkDispType();
        };

        iTown.prototype.resizeLeft = function(){
            var questlist = this.children.questlist;

            if( !questlist || !questlist.wrp ) return;

            var cont = questlist.wrp.find('.quest-listWrp, .quest-listTextWrp');

            if( !cont.length ) return;

            var height = appl.getAvailHeight() - cont.offset().top - 50;

            var chat = this.children.chat;
            if(chat && chat.size != 'max' && chat.cont){
                height -= chat.cont.height();
            }
            cont.css({'max-height': height});

            this.children.questlist.checkMove();
        };
    

iTown.prototype.afterShow = function(){
	this.doResize();

	this.wrp.removeClass('-invis');
};


iTown.prototype.setId = function(id){
	if( wofh.towns[id] )
		wofh.town = wofh.towns[id];
};

iTown.prototype.getId = function(){
	return wofh.town.id;
};

iTown.prototype.esc = function(){
	//appl.logOut();
};


iTown.prototype.stopTown = function(){
	if( this.getTown().stopDrawView )
		this.getTown().stopDrawView();

	this.cont.find('> *').addClass('-hidden');
};

iTown.prototype.startTown = function(){
	if( this.getTown().startDrawView )
		this.getTown().startDrawView();

	this.cont.find('> *').removeClass('-hidden');

	this.children.mainmenu.resize();
};

iTown.prototype.toggleModeSwapSlot = function(slot, mousePos){
	var interface = ls.getGameIf(Appl.interface.standart);

	if( !(interface == Appl.interface.standart || interface == Appl.interface.mobile) ){
		wndMgr.addWnd(wSwapSlot);

		return;
	}

	this.cont.toggleClass('-mode-swapSlot');

	if( !slot )
		this.tryResize(0);

	wndMgr.clearWnd();

	this.getTown().toggleModeSwapSlot(slot, mousePos);
};

iTown.prototype.toggleInterface = function(){
	wndMgr.$body.toggleClass('-clrScr');

	this.getTown().toggleInterface();
};

iTown.prototype.getStock = function(){
	return this.children.stock;
};

iTown.prototype.getTown = function(){
	return this.town;
};

iTown.prototype.updRes = function(){
	// Обновляем данные по ресурасам (в том числе перезапускается итератор)
	notifMgr.runEvent(Notif.ids.townRes, {clean: true});
};

iTown.prototype.update = function(){
	for(var child in this.children){
		if( child == 'town' )
			notifMgr.runEvent(Notif.ids.townChange);
		else
			this.children[child].show();
	}
};



bLoadIndicator = function(parent){
	bLoadIndicator.superclass.constructor.apply(this, arguments);
};

utils.extend(bLoadIndicator, Block);


bLoadIndicator.prototype.calcName = function(){
	return 'loadIndicator';
};

bLoadIndicator.prototype.calcTmplFolder = function(){
	return tmplMgr.loadIndicator;
};

bLoadIndicator.prototype.resize = function(){
	var friends = wndMgr.interfaces.town.friends;

	this.cont.css('bottom', '');

	if( !(friends && friends.cont && friends.cont.hasClass('-expanded')) )
		return;

	this.cont.css('bottom', parseInt(this.cont.css('bottom')) + parseInt(friends.cont.height()));
};


bLoadIndicator.prototype.toggle = function(toggle){
	this.loading = toggle;

	this.cont.toggleClass('-hidden', !toggle);
};

bLoadIndicator.prototype.isLoading = function(){
	return this.loading;
};