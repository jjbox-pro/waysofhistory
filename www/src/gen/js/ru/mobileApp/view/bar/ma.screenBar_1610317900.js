ScreenBar = function(){
	ScreenBar.superclass.constructor.apply(this, arguments);
};

utils.extend(ScreenBar, Bar);


ScreenBar.prototype.calcName = function(){
	return 'screenBar';
};

ScreenBar.prototype.calcTmplFolder = function(){
	return tmplMgr.screenBar;
};

ScreenBar.prototype.getData = function(){
	this.data.screenPagesLength = -1;
	
	this.data.screenPages = []; // Инициализируется позже
	
	this.getScreensInfoData();
	
	this.data.screensArr = [];
	
	for(var screenIndex in this.data.screensInfo)
		this.data.screensArr[screenIndex] = this.data.screensInfo[screenIndex].constructor;
	
    this.shownOptions = null;
    
	this.delegate('getData', ScreenBar, arguments);
};

    ScreenBar.prototype.getScreensInfoData = function(){
        this.data.screensInfo = [
            // Luck
            new ScreenInfo__({constructor: wBonus, pageName: 'luck', index: 0, abil: [Ability.ids.luckSubscription, Ability.ids.specialist], notices: [
    //			new ScreenNotice__({
    //				getLabel: function(){return 'o';},
    //				isActual: function(){
    //					return wofh.account.dayprize;
    //				},
    //				notifs: [Notif.ids.accChest]
    //			}),
                
                // Тестовые нотификации
                new ScreenNotice__({
                    getLabel: function(){return 'a1';},
                    isActual: function(){    
                        return ls.getTest1(false);
                    },
                    notifs: [Notif.ids.test1]
                }),
                new ScreenNotice__({
                    getLabel: function(){return 'a2';},
                    isActual: function(){
                        return ls.getTest2(false);
                    },
                    notifs: [Notif.ids.test2]
                }),
                
                new ScreenNotice__({
                    getLabel: function(){return 'a';}, // alarm
                    isActual: function(){
                        var now = timeMgr.getNow(),
                            bonus = wofh.account.getNextTownLuckBonusOver(now),
                            alarm = bonus && (bonus.time - LuckBonus.townAlarmPeriod) < now;
                            
                        return alarm;
                    },
                    notifs: [Notif.ids.accTownBonusAlarm]
                }),
                new ScreenNotice__({
                    getLabel: function(){return 'av';},
                    isActual: function(){
                        return ls.getNewSpecialists(false);
                    },
                    notifs: [Notif.ids.accNewSpecialists]
                })
            ], getTitle: function(){return 'Удача';}, getImg: function(){return 'luck';}, canDisplay: function(){
                return Ability.luck();
            }}),
            // Map
            new ScreenInfo__({constructor: MapScreen, pageName: 'map', index: 0, abil: [Ability.ids.map, Ability.ids.mapVersion], getTitle: function(){
                var title = 'Карта';

                if( ls.getMiniMapOn(false) )
                    title = 'Миникарта';
                else if( ls.getMActionsOn(false) )
                    title = 'Строительство';

                return title;
            }, getImg: function(){
                var img = 'map';

                if( ls.getMiniMapOn(false) )
                    img = 'mapMini';
                else if( ls.getMActionsOn(false) )
                    img = 'mapActions';

                return img;
            }}),
            // Town
            new ScreenInfo__({constructor: TownScreen, pageName: 'town', index: 0, notices: [
                new ScreenNotice__({
                    getLabel: function(){return 'q';},
                    isActual: function(){
                        return questsMgr.hasNewQuests();
                    },
                    notifs: [Notif.ids.accQuests, Notif.ids.accQuestViewed]
                }),
                new ScreenNotice__({
                    special__: true,
                    getLabel: function(){return 'E';},
                    isActual: function(){
                        return wofh.account.isPremium() && this.getCount();
                    },
                    getCount: function(){
                        return wofh.events.getAccAttacks().getList().length;
                    },
                    notifs: [Notif.ids.townAttacks]
                }),
                new ScreenNotice__({
                    getLabel: function(){return 'e';},
                    isActual: function(){
                        var militaryMoves = wofh.events.getTownMilitaryMoves();

                        return militaryMoves.attackIn || militaryMoves.attackOut || militaryMoves.defenceIn || militaryMoves.defenceOut;
                    },
                    notifs: [Notif.ids.event, Notif.ids.townCur]
                }),
                new ScreenNotice__({
                    option___: true,
                    options___: {},
                    getOption___: function(param){
                        if( !param || !param.town )
                            return '';

                        return this.options___['town_' + param.town.id];
                    },
                    setOption___: function(option){
                        this.options___[option.id] = option;
                    },
                    getLabel: function(){return 'e';},
                    isActual: function(param){
                        if( !param || !param.town )
                            return false;

                        var militaryMoves = wofh.events.getTownMilitaryMoves(param.town);

                        return militaryMoves.attackIn || militaryMoves.attackOut || militaryMoves.defenceIn || militaryMoves.defenceOut;
                    },
                    getCount: function(param){
                        if( !param || !param.town )
                            return false;

                        var militaryMoves = wofh.events.getTownMilitaryMoves(param.town);

                        return	((militaryMoves.attackIn||[]).count||0) + 
                                ((militaryMoves.attackOut||[]).count||0) +
                                ((militaryMoves.defenceIn||[]).count||0) +
                                ((militaryMoves.defenceOut||[]).count||0);
                    },
                    notifs: [Notif.ids.townEvent]
                }),
            ], getTitle: function(){return wofh.town.getName();}, getImg: function(){return 'town';}/*, getMark: function(){
                var html = '';

                if( wofh.town.traders.count > 0 )
                    html += snip.wrp('iconMarket-wrp', tmplMgr.mmenu.trade.send(), 'div');

                html += tmplMgr.mmenu.towns.rename();

                return html;
            }*/}),
            new ScreenInfo__({constructor: wTowns, pageName: 'town', index: 1, abil: [Ability.ids.towns], getTitle: function(){return 'Обзор твоих городов';}, getImg: function(){return 'towns';}, canDisplay: function(){
                return wofh.account.isPremium();
            }}),
            // Communication
            new ScreenInfo__({constructor: wMessages, pageName: 'communication', index: 0, abil: [Ability.ids.message], notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return 'm';},
                    isActual: function(){
                        return !this.parent.isActive() && wofh.account.hasNewMessages();
                    },
                    notifs: [Notif.ids.accMessageNew]
                })
            ], getTitle: function(){return 'Переписка';}, getImg: function(){return 'messages';}, canDisplay: function(){
                return wofh.account.ability.get(Ability.ids.message);
            }}),
            new ScreenInfo__({constructor: wReports, pageName: 'communication', index: 1, abil: [Ability.ids.report], notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return 'r';},
                    isActual: function(){
                        return !this.parent.isActive() && wofh.account.hasNewReports();
                    },
                    notifs: [Notif.ids.accReportNew]
                })
            ], getTitle: function(){return 'Отчеты';}, getImg: function(){return 'reports';}, canDisplay: function(){
                return wofh.account.ability.get(Ability.ids.report);
            }}),
            new ScreenInfo__({constructor: wAnnounce, pageName: 'communication', index: 2, notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return 'an';},
                    isActual: function(){
                        var lastUnreadAdminAnn = ls.getAnnLastUnreadAdminAnn({start: 0, end: 0});

                        return lastUnreadAdminAnn.end > timeMgr.getNow() && lastUnreadAdminAnn.start > ls.getAnnLastViewed(0);
                    },
                    prepareNotif: function(communicationPage, notifParam, notifId){
                        if( communicationPage.isSelected() && communicationPage.getCurScreenInfo().constructor == wAnnounce )
                            ls.setAnnLastViewed(timeMgr.getNow());
                        else if( notifParam && notifParam.account.getId() == Account.admin.id )
                            ls.setAnnLastUnreadAdminAnn({start: notifParam.start, end: notifParam.end});
                    },
                    notifs: [Notif.ids.wsAnn, Notif.ids.ifShown]
                })
            ], getTitle: function(){return 'Объявления';}, getImg: function(){return 'announce';}, canDisplay: function(){
                return Ability.announce();
            }}),
            new ScreenInfo__({constructor: wRate, pageName: 'communication', index: 3, abil: [Ability.ids.rate], getTitle: function(){return 'Рейтинги';}, getImg: function(){return 'rate';}, canDisplay: function(){
                return wofh.account.ability.get(Ability.ids.rate);
            }}),
            new ScreenInfo__({constructor: mwChat, pageName: 'communication', index: 4, notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return 'c';},
                    isActual: function(){
                        return ls.getChatLastUnreadMsg(0) > ls.getChatLastViewed(0);
                    },
                    prepareNotif: function(communicationPage, notifParam, notifId){
                        if( communicationPage.isSelected() && communicationPage.getCurScreenInfo().constructor == mwChat )
                            ls.setChatLastViewed(timeMgr.getNow());
                        else if( 
                            Notif.ids.chatMessageAdd == notifId && 
                            notifParam && 
                            (notifParam.time||0) > ls.getChatLastUnreadMsg(0) 
                        )
                            ls.setChatLastUnreadMsg(notifParam.time);
                    },
                    notifs: [Notif.ids.chatMessageAdd, Notif.ids.ifShown]
                })
            ], getTitle: function(){return 'Чат';}, getImg: function(){return 'chat';}, canDisplay: function(){
                return Ability.chat();
            }}),
            // Different
            new ScreenInfo__({constructor: wCountry, pageName: 'different', hash: 'country', index: 0, abil: [Ability.ids.country], notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return 'a' + wofh.country.atkin;},
                    isActual: function(){
                        return wofh.country && wofh.country.hasAttackIn();
                    },
                    notifs: [Notif.ids.countryAttack]
                }),
                new ScreenNotice__({
                    option___: true,
                    getLabel: tmplMgr.mmenu.btns.btn.invite,
                    isActual: function(){
                        return wofh.account.invites.length;
                    },
                    notifs: [Notif.ids.accInvite]
                })
            ], getTitle: function(){return 'Страна ';}, getImg: function(){return 'country';}, canDisplay: function(){
                return wofh.country || wofh.account.research.build[Slot.ids.embassy] || wofh.account.research.build[Slot.ids.embassyAfro] || Quest.isAvail(Quest.ids.country) || wofh.account.invites.length;
            }}),
            new ScreenInfo__({constructor: wScienceNext, pageName: 'different', index: 1, abil: [Ability.ids.science], getTitle: function(){return 'Наука';}, getImg: function(){return 'science';}, canDisplay: function(){
                return Quest.isAvail(Quest.ids.sciSelect) && ScienceList.hasAvail(wofh.country);
            }}),
            /*
            new ScreenInfo__({constructor: wMarket, pageName: 'different', index: 2, getTitle: function(){
                var title = '';

                if( Ability.showTrade() )
                    title = 'Торговля';
                else if( Trade.isBarterAllowed() )
                    title = 'Бартерный обмен';

                return title;
            }, getImg: function(){return 'market';}, canDisplay: function(){
                return wofh.town.traders.count > 0;
            }}),
            */
            new ScreenInfo__({constructor: wMoney, pageName: 'different', index: 3, abil: [Ability.ids.money], notices: [
                new ScreenNotice__({
                    option___: true,
                    getLabel: function(){return '-m';},
                    isActual: function(){
                        return !wofh.account.isMoneyEnough();
                    },
                    notifs: [Notif.ids.accMoney]
                })
            ], getTitle: function(){return 'Баланс';}, getImg: function(){return 'money';}, canDisplay: function(){
                return wofh.account.knowsMoney();
            }})
        ];
    };

    ScreenBar.prototype.getScreensInfo = function(){
        return this.data.screensInfo;
    };
    
    ScreenBar.prototype.getScreenInfoByAbil = function(abilId){
        var barScreensInfo = this.getScreensInfo();
            
        for(var screenInfo in barScreensInfo){
            screenInfo = barScreensInfo[screenInfo];
            
            if( utils.inArray(screenInfo.abil||[], abilId) )
                return screenInfo;
        }
        
        return null;
    };

ScreenBar.prototype.addNotif = function(){
	this.notif.other[Notif.ids.mobAppScreenSwipe] = function(screen){
		if( !this.wasShown() )
			return;
		
		var screenInfo = this.getScreenInfoByScreen(screen||wndMgr.getScreen());
		
        if( screenInfo )
            this.selectPage(this.children[screenInfo.pageName], screenInfo);
	};
    
    this.notif.other[Notif.ids.accAbilitiesWnd] = function(abilId){
        var screenInfo = this.getScreenInfoByAbil(abilId),
            screenPage = this.getScreenPageByScreenInfo(screenInfo);
    
        if( !screenPage )
            return;
        
        this.setTimeout(function(){
            if( !screenPage.isSelected() ){
                screenPage.checkOptionsByAbil(abilId);
                
                screenPage.setCurScreenInfo(screenInfo);
            }
            
            this.setTimeout(function(){
                screenPage.showBlink();
            }, wndMgr.swipeTime);
        }, 1000);
    };
    
    if( this.canDisplay() )
        return;
    
    this.notif.other[Notif.ids.accQuests] = function(){
        this.detachNotifElem(Notif.ids.accQuests);
        
        this.show();
    };
    
    this.notif.other[Notif.ids.accQuests].params = [Quest.ids.map];
};

    ScreenBar.prototype.getScreenInfoByScreen = function(screen){
        if( !screen )
            return false;
        
        var	screenIndex = this.data.screensArr.indexOf(screen.getPageConstructor());
		
		if( screenIndex < 0 )
			return false;
		
		return this.data.screensInfo[screenIndex]||false;
    };
    
    ScreenBar.prototype.getScreenPageByScreenInfo = function(screenInfo){
        if( !screenInfo )
            return null;
        
        return this.children[screenInfo.pageName];
    };
    
ScreenBar.prototype.canDisplay = function(){
	return Ability.map();
};

ScreenBar.prototype.calcChildren = function(){
	this.children.luck = bScreenPage_luck;
	this.children.map = bScreenPage_map;
	this.children.town = bScreenPage_town;
	this.children.communication = bScreenPage_communication;
	this.children.different = bScreenPage_different;
};

ScreenBar.prototype.bindEvent = function(){
	var self = this;
	
	wndMgr.$document.off('.screenBar').on('touchstart.screenBar', function(e){
		self.tryHideOptions(e);
	});
};

ScreenBar.prototype.afterDraw = function(firstShow){
    if( !firstShow )
        return;
    
    this.setTimeout(this.setExpand, 500);
};

ScreenBar.prototype.afterAllShow = function(){
    if( this.data.selectedPageName )
        return;
    
    var screenInfo = this.getScreenInfoByScreen(wndMgr.getScreen());
    
    if( screenInfo )
        this.selectPage(this.children[screenInfo.pageName], screenInfo);
};


ScreenBar.prototype.getSide = function(){
	return 'bottom';
};

ScreenBar.prototype.setSize = function(){
	var size = wndMgr.getWindowSize();
	
	size.height = '';
	
	this.wrp.css(size);
};

ScreenBar.prototype.setPos = function(){
	var side = this.getSide(),
		pos = {top: '', bottom: ''};
	
	this.wrp.attr('data-side', side);
	
	pos.bottom = wndMgr.getNavBarHeight();
	
	this.wrp.css(pos);
};


ScreenBar.prototype.selectPage = function(selectedPage, screenInfo){
	for(var page in this.children){
		page = this.children[page];
		
		page.setSelect(false);
	}
	
	selectedPage.setSelect(true, screenInfo);
};

ScreenBar.prototype.isSelectedPage = function(selectedPage){
    if( !selectedPage )
        return;
    
    return selectedPage.getName() == this.data.selectedPageName;
};

ScreenBar.prototype.getSelectedPage = function(){
    return this.children[this.data.selectedPageName];
};

ScreenBar.prototype.toggleOptions = function(toggle){
	for(var page in this.children){
		page = this.children[page];
		
		page.toggleOptions(toggle);
	}
};

ScreenBar.prototype.hideOptions = function(){
	this.toggleOptions(false);
};

ScreenBar.prototype.tryHideOptions = function(e){
	if( !this.shownOptions )
		return;
	
	var $screenBarWrp = $(e.target).closest(this.wrp);

    if( $screenBarWrp.length )
        return;

    this.hideOptions();
};





function ScreenInfo__(data){
	utils.copy(this, data);
};

ScreenInfo__.prototype.getIndex = function(){
	return this.index;
};

ScreenInfo__.prototype.isActive = function(){
	return this.page.isSelected() && this.page.getCurScreenInfo() == this;
};





function ScreenNotice__(data){
	this.id = ScreenNotice__.count++;
	
	utils.copy(this, data);
	
	this.notifs = this.notifs||[];
};


ScreenNotice__.count = 0;


ScreenNotice__.prototype.getId = function(){
	return this.id;
};

ScreenNotice__.prototype.getLabel = function(){
	return '+';
};

ScreenNotice__.prototype.isActual = function(){
	return this.getActual();
};

ScreenNotice__.prototype.setActual = function(actual){
	this.actual = actual;
	
	return this;
};

ScreenNotice__.prototype.getActual = function(){
	return this.actual||false;
};

ScreenNotice__.prototype.getCount = function(){
	return 1;
};

ScreenNotice__.prototype.isSpecial = function(){
	return this.special__||false;
};


ScreenNotice__.prototype.setOption___ = function(option___2){
	this.option___2 = option___2||false;
	
	return this;
};

ScreenNotice__.prototype.getOption___ = function(){
	return this.option___2||false;
};

ScreenNotice__.prototype.isOption___ = function(){
	return this.option___||false;
};





function ScreenOption__(data){
	utils.copy(this, data);
};

ScreenOption__.prototype.getId = function(){
	return this.id;
};

ScreenOption__.prototype.getTmpl = function(){
	return tmplMgr.screenPage.option.screen;
};

ScreenOption__.prototype.getScreenInfo = function(){
	return this.data.screenInfo;
};

ScreenOption__.prototype.getCls = function(){
	return '';
};

ScreenOption__.prototype.hasTown = function(){
    return false;
};




function ScreenTownOption__(data){
	ScreenTownOption__.superclass.constructor.apply(this, arguments);
};

utils.extend(ScreenTownOption__, ScreenOption__);


ScreenTownOption__.prototype.hasTown = function(){
    return true;
};

ScreenTownOption__.prototype.getTown = function(){
    return this.data.town;
};

ScreenTownOption__.prototype.getTownId = function(){
    return this.getTown().id;
};

ScreenTownOption__.prototype.getTmpl = function(){
	return tmplMgr.screenPage.option.town;
};





function ScreenMapOption__(data){
	ScreenMapOption__.superclass.constructor.apply(this, arguments);
};

utils.extend(ScreenMapOption__, ScreenOption__);


ScreenMapOption__.prototype.getName = function(){
    return this.name;
};