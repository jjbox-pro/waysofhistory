utils.overrideMethod(TownScreen, 'calcChildren', function __method__(){
	__method__.origin.apply(this, arguments);
	
    this.children.infoExt = pTownInfoExt;
    
	delete this.children.luck;
    
    delete this.children.stock;
    
    delete this.children.garrison;
	
    delete this.children.bonus;
    
	delete this.children.defence;
});

TownScreen.prototype.modifyCont = function(){
//    this.$topicWrp.remove();
    this.$topicWrp.append(snip.wrp('panel-town-info-wrp', '', 'div'));
};

TownScreen.prototype.bindEvent = function(){
    var infoExt = this.children.infoExt;
    
    this.wrp.on('touchstart', '.wnd-cont', function(){
        infoExt.toggleExpand(false);
    });
};

TownScreen.prototype.calcContWrpSize = function(wndSize){
    var size = {
        width: wndSize.width,
        height: wndSize.height,
        offsetTop: 0
    };
    
    if( !this.isReady() )
        return size;
    
    size.offsetTop = this.children.info.calcFullHeight();
    
    size.height -= size.offsetTop;
    
    return size;
};

//utils.overrideMethod(TownScreen, 'makeResize', function __method__(){
//    this.$contWrp.css('transform', 'translateY(' + this.getContWrpSize().offsetTop + 'px)');
//    
//	__method__.origin.apply(this, arguments);
//});

TownScreen.prototype.setContWrpSize = function(wndSize){
    this.contWrpSize = this.calcContWrpSize(wndSize);
};

//    TownScreen.prototype.getContWrpSize = function(){
//        return {
//            width: this.contWrpSize.width,
//            height: this.contWrpSize.height - this.$topicWrp.outerHeight()
//        };;
//    };





utils.overrideMethod(bckTown, 'drawView', function __method__(){
    this.checkViewSize();
    
	__method__.origin.apply(this, arguments);
});

    bckTown.prototype.checkViewSize = function(){
        if( !this.contWrpSizeWas ){
            this.contWrpSizeWas = {
                width: this.parent.$contWrp.width(),
                height: this.parent.$contWrp.height()
            };
    
            return;
        }
        
        if( this.parent.$contWrp.height() != this.contWrpSizeWas.height ){
            this.contWrpSizeWas.height = this.parent.$contWrp.height();
            
            this.parent.resizeZoom();
        }
	};





pTownInfo = utils.reExtend(bTownInfo, hPanel);


pTownInfo.prototype.calcTmplFolder = function(){
	return this.parent.tmpl[this.name];
};

pTownInfo.prototype.initOptions = function(){
	pTownInfo.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

pTownInfo.prototype.calcChildren = function(){
	this.children.stock = bInfo_stock;
    
    this.children.garrison = bInfo_garrison;
    
    this.children.attacks = bInfo_attacks;
	
	this.children.pop = bMMenu_pop;
    
    this.children.market = bInfo_market;
    
    this.children.bonus = bMMenu_bonus;
    
	this.children.defence = bMMenu_defence;
    
    this.children.questlist = bQuestList;
};

pTownInfo.prototype.addNotif = function(){
    if( this.canExpand() )
        return;
    
    this.notif.other[Notif.ids.accQuests] = function(){
        this.detachNotifElem(Notif.ids.accQuests);
        
        this.toggleExpand(true);
    };
    
    this.notif.other[Notif.ids.accQuests].params = [Quest.ids.bldHouse1];
};

pTownInfo.prototype.cacheCont = function(){
    pTownInfo.superclass.cacheCont.apply(this, arguments);
    
	this.$stockGarrisonWrp = this.cont.find('.info-stockGarrison-wrp');
        
        this.$stock = this.$stockGarrisonWrp.find('.info-stock-wrp');
        
        this.$garrison = this.$stockGarrisonWrp.find('.info-garrison-wrp');
        
        this.$__tmpArrow = this.$stockGarrisonWrp.find('.__tmpArrow');
        
    this.$menuWrp = this.cont.find('.info-menu-wrp');
};

pTownInfo.prototype.bindEvent = function(){
	this.wrp.on('click', '.info-stockGarrison-wrp', function(){
        notifMgr.runEvent(Notif.ids.mobAppTownToggleInfoExt, true);
    });
};

pTownInfo.prototype.afterShow = function(firstShow){
	if( firstShow )
		//this.toggleExpand(this.canExpand(), {duration: pTownInfo.wasExpanded ? -1 : undefined});
        this.toggleExpand(this.canExpand(), {duration: -1});
};

pTownInfo.prototype.getZoffset = function(){return 1;};

pTownInfo.prototype.getSide = function(){
	return 'top';
};

pTownInfo.prototype.onToggleEnd = function(duration){
    if( !pTownInfo.wasExpanded && duration > 0 )
        pTownInfo.wasExpanded = true;
};


pTownInfo.prototype.doSwipe = function(pointDelta){
	var toggle = false;
	
	if( this.getSide() == 'top' && pointDelta.y < 0 )
		toggle = true;
	else if( this.getSide() == 'bottom' && pointDelta.y > 0 )
		toggle = true;
	
	if( toggle )
		notifMgr.runEvent(Notif.ids.mobAppTownToggleInfoExt, true);
};


pTownInfo.prototype.canExpand = function(){
	return Quest.isAvail(Quest.ids.bldHouse1);
};

pTownInfo.prototype.calcFullHeight = function(){
    if( !this.isExpanded() )
        return 0;
    
	return  this.$stock.outerHeight() + 
            (this.$garrison.hasClass('-type-hidden') ? 0 : this.$garrison.outerHeight()) + 
            this.$__tmpArrow.outerHeight() + 
            this.$menuWrp.outerHeight();
};



bInfo_stock = function(){
	bInfo_stock.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfo_stock, Block);


bInfo_stock.prototype.calcName = function(){
	return 'stock';
};

bInfo_stock.prototype.calcTmplFolder = function(){
	return tmplMgr.stock;
};

bInfo_stock.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townRes] = function(){
        this.updList();
    };
    
    this.notif.other[Notif.ids.townResHas] = function(res){
        this.$list
            .find('.stock-list-res[data-id="' + res.id + '"] .stock-list-resHas')
            .html(snip.resStockWarnHas(res, this.shortFormatFlag));
    };
};

bInfo_stock.prototype.getTmplData = function(){
	return this.calcData();
};

bInfo_stock.prototype.cacheCont = function(){
	this.$list = this.cont.find('.stock-list');
    this.list = this.$list.get(0);
};

bInfo_stock.prototype.modifyCont = function(){
    this.updList(this.data);
};

bInfo_stock.prototype.afterDraw = function(){
    var self = this;
    
    this.$list.on('scroll', function(){
        self.checkOverflow();
    });
    
	this.setTimeout(function(){
        this.checkOverflow();
        
        this.cont.removeClass('-state-noTransition');
    }, 0);
};


bInfo_stock.prototype.calcData = function(){
    this.data = {stock: wofh.town.getStock()};
    
    this.data.resGroups = this.data.stock.getResGroups(ls.getStockGroups([1,2,3,4]), true);
    
    return this.data;
};

bInfo_stock.prototype.updList = function(data){
    this.$list.html(this.tmpl.list(data||this.calcData()));
    
    this.checkOverflow();
};

bInfo_stock.prototype.checkOverflow = function(){
	this.cont.toggleClass('-type-overflow', this.list.scrollLeft < this.list.scrollWidth - this.list.clientWidth - 20);
};

bInfo_stock.prototype.getResEl = pStock.prototype.getResEl;

bInfo_stock.prototype.shortFormatFlag = true;



bInfo_garrison = function(){
	bInfo_garrison.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfo_garrison, Block);
	

bInfo_garrison.prototype.calcName = function(){
	return 'garrison';
};

bInfo_garrison.prototype.addNotif = function(){
    this.notif.other[Notif.ids.townGarrison] = this.updList;
};

bInfo_garrison.prototype.getTmplData = function(){
	return this.calcData();
};

bInfo_garrison.prototype.cacheCont = function(){
	this.$list = this.cont.find('.garrison-list');
    this.list = this.$list.get(0);
};

bInfo_garrison.prototype.modifyCont = function(){
    this.updList(this.data);
};

bInfo_garrison.prototype.afterDraw = function(){
    var self = this;
    
    this.$list.on('scroll', function(){
        self.checkOverflow();
    });
    
	this.setTimeout(function(){
        this.checkOverflow();
        
        this.cont.removeClass('-state-noTransition');
    }, 0);
};


bInfo_garrison.prototype.calcData = function(){
    this.data.list = wofh.town.getGarrisonWithEvents().sortByDefault(true);
    
    return this.data;
};

bInfo_garrison.prototype.updList = function(data){
    this.$list.html(tmplMgr.garrison.list(data||this.calcData()));
    
    this.checkOverflow();
    
    this.checkHidden();
};

bInfo_garrison.prototype.checkOverflow = function(){
	this.cont.toggleClass('-type-overflow', this.list.scrollLeft < this.list.scrollWidth - this.list.clientWidth - 20);
};

bInfo_garrison.prototype.checkHidden = function(){
	this.wrp.toggleClass('-type-hidden', !this.data.list.getLength());
};



bInfo_market = function(){
	bInfo_market.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfo_market, bMMenu_trade);


bInfo_market.prototype.calcName = function(){
	return 'market';
};

bInfo_market.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

bInfo_market.prototype.addContToWrp = function(){
    this.wrp.removeClass('-type-hidden');
    
    bInfo_market.superclass.addContToWrp.apply(this, arguments);
};

bInfo_market.prototype.afterContSet = function(){};

bInfo_market.prototype.makeResize = function(){};



bMMenu_pop.prototype.addContToWrp = function(){
    this.wrp.removeClass('-type-hidden');
    
    bMMenu_pop.superclass.addContToWrp.apply(this, arguments);
};



bInfo_attacks = function(){
	bInfo_attacks.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfo_attacks, bMMenu_attacks);


bInfo_attacks.prototype.calcTmplFolder = function(){
    return tmplMgr.town.info.attacks;
};

bInfo_attacks.prototype.addNotif = function(){
    bInfo_attacks.superclass.addNotif.apply(this, arguments);
    
    if( this.canDisplay() )
        return;
    
    this.notif.show.push({id: Notif.ids.accQuests, params: Quest.ids.attackBarb});
};

bInfo_attacks.prototype.addContToWrp = function(){
    this.wrp.removeClass('-type-hidden');
    
    bInfo_attacks.superclass.addContToWrp.apply(this, arguments);
};

bInfo_attacks.prototype.canDisplay = function(){
    return Quest.isAvail(Quest.ids.attackBarb);
};


bInfo_attacks.prototype.$getIcon = function(){
    var $el = $();
    
    if( this.wrp )
        $el = this.wrp.find('.info-attacks-icon');
    
    return $el;
};





bQuestList.calcMaxHeight = function(){
	return 'auto';
};


bQuestList.prototype.calcFullName = function(){
    return 'town-' + this.name;
};

utils.overrideMethod(bQuestList, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.townGarrison] = this.makeResize;
});

bQuestList.prototype.cacheCont = function(){
	this.$questlist = this.cont;
	
	this.$listWrp = this.$questlist.find('.quest-listWrp');
	
	this.$btnUp = this.$questlist.find('.quest-btn.-type-up');
	this.$btnDown = this.$questlist.find('.quest-btn.-type-down');
};

bQuestList.prototype.makeResize = function(){
	if( !this.$listWrp || wndMgr.isLandscape() )
		return;
	
    this.clearTimeout(this.calcSizeTO);
    
	this.calcSizeTO = this.setTimeout(this.calcSize, 0);
};
    
    bQuestList.prototype.calcSize = function(){
        this.$listWrp.css('max-height', this.getAvailHeight() - 
									this.$btnUp.height() - 
									this.$btnDown.height() - 
									//this.parent.calcFullHeight() - 
                                    10);
        
        this.checkMove();
    };
    
        bQuestList.prototype.getAvailHeight = function(){
            return this.parent.parent.getContWrpSize().height;
        };

bQuestList.prototype.bindActionEvent = function(){
	var self = this;
			
	this.wrp
		.on('click', '.quest-btn.-type-up', function(){
			self.moveList(-1);
		})
		.on('click', '.quest-btn.-type-down', function(){
			self.moveList(1);
		});
	
    this.initScroll({
        callbacks: {
            onScroll: function(){self.checkMove();},
            onUpdate: function(){self.checkMove();}
        }
    });
};

bQuestList.prototype.getScrollTag = function(){
	return this.$listWrp;
};


bQuestList.prototype.getListView = function(){
	return bQuestList.type.img;
};

bQuestList.prototype.checkMove = function(){
	var scroll = this.$listWrp.get(0);
	
	this.showUp = scroll.scrollTop > 0;
	this.showDown = scroll.scrollTop < (scroll.scrollHeight - scroll.clientHeight) - 1;
	
	this.$btnUp.toggleClass('-disabled', !this.showUp);
	this.$btnDown.toggleClass('-disabled', !this.showDown);
};

bQuestList.prototype.moveList = function(dir){
	if( !this.$listWrp.is(':animated') )
	    this.$listWrp.animate({scrollTop: this.$listWrp.scrollTop() + (dir * 2 * this.itemHeight)}, 250);
};





function pTownInfoExt(){
	pTownInfoExt.superclass.constructor.apply(this, arguments);
};

utils.extend(pTownInfoExt, pTownInfo);


pTownInfoExt.prototype.calcName = function(){
	return 'infoExt';
};

pTownInfoExt.prototype.calcChildren = function(){
	this.children.stock = bInfoExt_stock;
    
    this.children.garrison = bInfoExt_garrison;
    
    this.children.attacks = bInfoExt_attacks;
    
    this.children.army = bInfoExt_army;
};

pTownInfoExt.prototype.addNotif = function(){
    this.notif.other[Notif.ids.mobAppTownToggleInfoExt] = this.toggleExpand;
};

pTownInfoExt.prototype.afterShow = function(){};

pTownInfoExt.prototype.afterAllShow = function(){
    pTownInfoExt.superclass.afterAllShow.apply(this, arguments);
    
    snip.yScrollHandler(this.$contWrp, this, {
        checkAbortSwipe: function(scrolling, dY){
            return !(scrolling.atBottom && dY > 0);
        }
    });
};

pTownInfoExt.prototype.getZoffset = function(){return 2;};


pTownInfoExt.prototype.doSwipe = function(){
    pTownInfo.superclass.doSwipe.apply(this, arguments);
};

pTownInfoExt.prototype.abortSwipe = function(){
	this.$contBlk.trigger('swipeabort');
};


pTownInfoExt.prototype.setSize = function(){
	this.$contWrp.css('max-height', wndMgr.getWndLayerSize().height - this.$footerWrp.outerHeight());
};



bInfoExt_stock = function(){
	bInfoExt_stock.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfoExt_stock, bInfo_stock);

bInfoExt_stock.prototype.calcName = function(){
    return 'stockExt';
};

bInfoExt_stock.prototype.calcTmplFolder = function(){
	return tmplMgr.stockExt;
};

bInfoExt_stock.prototype.calcChildren = function(){
    this.children.foodpriority = bStock_foodpriority;
};

bInfoExt_stock.prototype.afterDraw = function(){};


bInfoExt_stock.prototype.checkOverflow = function(){};

bInfoExt_stock.prototype.shortFormatFlag = false;


    
    bStock_foodpriority = function(){
        bStock_foodpriority.superclass.constructor.apply(this, arguments);
    };

    utils.extend(bStock_foodpriority, Block);
    
    
    bStock_foodpriority.prototype.calcName = function(){
        return 'foodpriority';
    };
    
    bStock_foodpriority.prototype.cacheCont = function(){
        this.$list = this.cont.find('.foodpriority-list');
    };
    
    
    bStock_foodpriority.prototype.afterDraw = function(){
        var self = this;
        
        this.wrp.find('.foodpriority-list').sortable({
            containment: 'parent',
            tolerance: 'pointer',
            axis: "x",
            distance: 25,
            start: function(event, ui){
                var $this = $(this);
                
                $this.addClass('-state-sorting');
                
                $this.one('touchend touchcancel', function(){
                    var event = '';
                    
                    if( false ){ // По завершению сортировки ждёт последний цикл анимации
                        if( wndMgr.document.onanimationiteration !== undefined )
                            event = 'animationiteration';
                        else if( wndMgr.document.onwebkitanimationiteration !== undefined )
                            event = 'webkitAnimationIteration';
                    }
                    
                    if( event ){
                        $this   .find('.foodpriority-res:not(.ui-sortable-helper):not(.ui-sortable-placeholder)')
                                .first()
                                .one(event, function(){
                                    $this.removeClass('-state-sorting');
                                });
                    }
                    else
                        $this.removeClass('-state-sorting');
                });
                
                clearTimeout(self.updateOrderTO);
            },
            update: function(event, ui){
                var data = [];
                
                $(this).find('.foodpriority-res').each(function(){
                    data.push($(this).data('id'));
                });
                
                self.updateOrder(data);
            }
        });
    };
    
    
    bStock_foodpriority.prototype.updateOrder = function(data){
        clearTimeout(this.updateOrderTO);
        
        this.updateOrderTO = setTimeout(function(){
            reqMgr.setFoodPriority(data);
        }, 2000);
    };
    
    
    
bInfoExt_garrison = function(){
	bInfoExt_garrison.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfoExt_garrison, bInfo_garrison);


bInfoExt_garrison.prototype.calcName = function(){
    return 'garrisonExt';
};

bInfoExt_garrison.prototype.calcTmplFolder = function(){
	return tmplMgr.garrisonExt;
};

bInfoExt_garrison.prototype.afterDraw = function(){};


bInfoExt_garrison.prototype.checkOverflow = function(){};

bInfoExt_garrison.prototype.checkHidden = function(){};



bInfoExt_attacks = function(){
	bInfoExt_attacks.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfoExt_attacks, bMMenu_attacks);


bInfoExt_attacks.prototype.calcTmplFolder = function(){
    return tmplMgr.town.infoExt.attacks;
};

bInfoExt_attacks.prototype.getData = function(){
    this.data = wofh.events.getTownMilitaryMoves(wofh.town, true);
    
    this.dataReceived();
};

bInfoExt_attacks.prototype.canDisplay = function(){
    return !utils.isEmpty(this.data);
};



bInfoExt_army = function(){
	bInfoExt_army.superclass.constructor.apply(this, arguments);
};

utils.extend(bInfoExt_army, Block);


bInfoExt_army.prototype.calcName = function(){
    return 'army';
};

bInfoExt_army.prototype.calcTmplFolder = function(){
    return tmplMgr.town.infoExt.army;
};

bInfoExt_army.prototype.addNotif = function(){
    
};

bInfoExt_army.prototype.canDisplay = function(){
    return Quest.isAvail(lib.quest.ability.sendarmy);
};





iTown.prototype.getStock = function(){
	return this.screen.children.info.children.stock;
};





utils.overrideMethod(pGarrison, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.townToggleGarrison] = this.toggleExpand;
});


pGarrison.prototype.getSide = function(){
	return 'right';
};

pGarrison.prototype.initOptions = function(){
	pGarrison.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};

pGarrison.prototype.canDisplay = function(){
	var canDisplay = pGarrison.superclass.canDisplay.apply(this, arguments);
	
	return canDisplay;
};





utils.overrideMethod(pStock, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.townToggleStock] = this.toggleExpand;
});


pStock.prototype.initOptions = function(){
	pStock.superclass.initOptions.apply(this, arguments);
	
	this.options.expanded = false;
};





TownClicker.prototype.getDestElem = function(){
    return this.town.parent.children.info.wrp.find('.info-stock-wrp');
};