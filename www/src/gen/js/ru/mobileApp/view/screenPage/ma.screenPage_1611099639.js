ScreenPage = function(){
	ScreenPage.superclass.constructor.apply(this, arguments);
	
	this.initScreenPage();
};

utils.extend(ScreenPage, Block);


ScreenPage.prototype.initOptions = function(){
	this.options = this.options||{};
};

    ScreenPage.prototype.initScreenPage = function(){
        this.index = ++this.parent.data.screenPagesLength;

        this.parent.data.screenPages[this.index] = this;
    };

ScreenPage.prototype.calcTmplFolder = function(){
	return tmplMgr.screenPage;
};

ScreenPage.prototype.getData = function(){
	this.data.screens = this.getScreens();
	
	this.data.notices = this.getNotices();
	
	if( !this.data.curScreenInfo )
		this.data.curScreenInfo = this.data.screens[0];
	
	this.data.options = this.getOptions();
	
	this.data.pageName = this.getName();
	
	this.delegate('getData', ScreenPage, arguments);
};

    ScreenPage.prototype.getScreens = function(){
        var screensInfo = this.parent.data.screensInfo,
            screens = [];

        for(var screenInfo in screensInfo){
            screenInfo = screensInfo[screenInfo];

            if( screenInfo.pageName == this.getName() && (!screenInfo.canDisplay || screenInfo.canDisplay()) ){
                screenInfo.page = this;

                screens.push(screenInfo);
            }
        }

        return screens;
    };
    
    ScreenPage.prototype.getNotices = function(){
        var notices = [];

        for(var screen in this.data.screens){
            screen = this.data.screens[screen];

            for(var notice in screen.notices){
                notice = screen.notices[notice];

                notice.parent = screen;

                notices.push(notice);
            }
        }

        return notices;
    };

    ScreenPage.prototype.getOptions = function(){
        var options = [], option;
        
        if( this.data.screens.length < 2 )
            return options;
        
        for(var screen in this.data.screens){
            screen = this.data.screens[screen];
            
            option = new ScreenOption__({
                id: screen.index,
                data: {screenInfo: screen}
            });

            this.initOptionNotices(option, screen.notices);

            options.push(option);
        }
        
        return options;
    };

        ScreenPage.prototype.initOptionNotices = function(option, notices){
            option.notices = [];

            for(var notice in notices){
                notice = notices[notice];

                if( notice.isOption___() ){
                    notice.setOption___(option);

                    option.notices.push(notice);
                }
            }
        };
        
ScreenPage.prototype.addNotif = function(){
	this.notif.otherHandlersArr = {}; // Используем список обработчиков, если одна и таже нотификация используется для самого блока и для уведомления о произошедшем событии
	
	for(var notice in this.data.notices){
		notice = this.data.notices[notice];
		
		for(var notif in notice.notifs){
			notif = notice.notifs[notif];
			
			if( this.notif.other[notif] ){
				if( this.notif.other[notif] == this.tryNoticeReceived )
					continue;
				
				if( !this.notif.otherHandlersArr[notif] )
					this.notif.otherHandlersArr[notif] = [];
				else
					continue;
				
				this.notif.otherHandlersArr[notif].push(this.notif.other[notif]);
				this.notif.otherHandlersArr[notif].push(this.tryNoticeReceived);
				
				this.notif.other[notif] = function(param, notifId){
					var handlersArr = this.notif.otherHandlersArr[notifId];
					
					for(var handler in handlersArr)
						handlersArr[handler].apply(this, arguments);
				};
			}
			else
				this.notif.other[notif] = this.tryNoticeReceived;
		}
	}
};

ScreenPage.prototype.canDisplay = function(){
	return this.data.screens.length > 0;
};

ScreenPage.prototype.setWrp = function(){
	ScreenPage.superclass.setWrp.apply(this, arguments);
	
	if( this.wrp )
		this.wrp.removeClass('-hidden');
};

ScreenPage.prototype.modifyCont = function(){
	this.cont.addClass('screenPage-cont');
};

ScreenPage.prototype.cacheCont = function(){
    //this.$optNoticesWrp = this.cont.find('.screenPage-optNotices-wrp');
	
	this.$optionsWrp = this.cont.find('.screenPage-options-wrp');
	
	this.$options = this.$optionsWrp.find('.screenPage-options');
	
    this.$optionsList = this.$options.find('.screenPage-option');
    
    
    this.$screenPage = this.cont.find('.screenPage');
    
	this.$screenTitleWrp = this.$screenPage.find('.screenPage-screenTitle-wrp');
	
	this.$screenImgWrp = this.$screenPage.find('.screenPage-screenImg-wrp');
    
	this.$noticesWrp = this.$screenPage.find('.screenPage-notices-wrp');
	
	var $noticesInfo = this.$screenPage.find('.screenPage-notices-info');
	
	this.$noticesInfoSpecial = $noticesInfo.filter(function(){
		return $(this).hasClass('-type-special');
	});
	
	this.$noticesInfo = $noticesInfo.filter(function(){
		return !$(this).hasClass('-type-special');
	});
};

ScreenPage.prototype.bindBaseEvent = function(){
	this.delegate('bindBaseEvent', ScreenPage, arguments);
	
	var self = this;
	
	this.wrp
		.on('click', '.screenPage', function(){
			self.showNextScreen();
		})
		.on('click', '.screenPage-option', function(){
			self.onOptionClick($(this));
		});
	
	snip.swipeHandler(this.wrp, {
		callbacks: {
			onSwipeEnd: function(pointDelta){
				if( Math.abs(pointDelta.y||0) < snip.getSwipeThreshold() )
					return;
				
				if( !self.hasMulty() )
					return;
				
				self.parent.hideOptions();
				
				self.toggleOptions(pointDelta.y > 0);
			}
		}
	});
};

ScreenPage.prototype.afterDraw = function(){
	this.checkMultyTitle();
	
	this.showNotices();
	
	this.updCurScreenInfo();
};


ScreenPage.prototype.tryNoticeReceived = function(param, notifId){
	this.noticeReceived.apply(this, arguments);
};

ScreenPage.prototype.noticeReceived = function(param, notifId){
	if( !this.isReady() )
		return;
	
	var $wrp, $notice, option, blink = false;
	
	for(var notice in this.data.notices){
		notice = this.data.notices[notice];
		
		if( !utils.inArray(notice.notifs, notifId) )
			continue;
		
		if( notice.prepareNotif )
			notice.prepareNotif(this, param, notifId);

		$wrp = $().add(this.$noticesWrp);
        
        // Уведомления показывающиеся в блоках с опциями
		if( notice.isOption___() && wofh.account.isPremium() ){
			option = notice.getOption___(param, notifId);

			$wrp = $wrp.add(this.$options.find('[data-id="' + option.id + '"] .screenPage-optNotices-wrp'));

			this.showNoticesCount(this.$options.find('[data-id="' + option.id + '"] .screenPage-optNotices-info'), this.calcNoticesCount(option.notices, option.noticeParam));
		}
        
		$notice = $wrp.find('.screenPage-notice[data-id="' + notice.getId() + '"]');
		
		if( $notice.length ){
			$notice.remove();

			if( notice.isActual(param, notifId) ){
//				if( notifId != Notif.ids.ifShown )
//					blink = true; // Избыточно
                
				$notice = $(snip.wrp('screenPage-notice', '', 'div', {id: notice.getId()}));
                
				$wrp.prepend($notice.html(notice.getLabel()));
			}
		}
		else if( notice.isActual(param, notifId) ){
			blink = true;

			$notice = $(snip.wrp('screenPage-notice', '', 'div', {id: notice.getId()}));

			$wrp.prepend($notice.html(notice.getLabel()));
		}
	}
	
	this.showAllNoticesCount();
	
	if( blink )
		this.showBlink(this.$noticesInfo);
};

	ScreenPage.prototype.___noticeReceivedOld = function(param, notifId){
		if( !this.isReady() )
			return;

		var $wrp, $notice, blink = false;

		for(var notice in this.data.notices){
			notice = this.data.notices[notice];

			if( utils.inArray(notice.notifs, notifId) ){
				$wrp = $().add(this.$noticesWrp);

				if( notice.isOption___() && wofh.account.isPremium() )
					$wrp = $wrp.add(this.$options.find('[data-id="' + notice.getOption___(param, notifId).id + '"] .screenPage-optNotices-wrp'));

				$notice = $wrp.find('.screenPage-notice[data-id="' + notice.getId() + '"]');

				if( notice.prepareNotif )
					notice.prepareNotif(this, param, notifId);

				if( $notice.length ){
					$notice.remove();

					if( notice.isActual(param, notifId) ){
						if( notifId != Notif.ids.ifShown )
							blink = true; // Избыточно

						$notice = $(snip.wrp('screenPage-notice', '', 'div', {id: notice.getId()}));

						$wrp.prepend($notice.html(notice.getLabel()));
					}
				}
				else if( notice.isActual(param, notifId) ){
					blink = true;

					$notice = $(snip.wrp('screenPage-notice', '', 'div', {id: notice.getId()}));

					$wrp.prepend($notice.html(notice.getLabel()));
				}
			}
		}

		if( blink )
			this.showBlink();
	};


ScreenPage.prototype.onOptionClick = function($option){
	this.showScreenByIndex(this.getScreenIndexByOrder($option.data('id')));
};


ScreenPage.prototype.getScreenConstructor = function(screenInfo){
	screenInfo = screenInfo||this.data.curScreenInfo;
	
	if( !screenInfo )
		return false;
	
	var constructor = screenInfo.constructor;
	
	if( constructor.prepareData && !constructor.prepareData() )
		return false;
	
	if( typeof(constructor) == 'string' )
		constructor = wndMgr.getScreenClassByHash(constructor);
	
	return constructor;
};

ScreenPage.prototype.setSelect = function(select, screenInfo){
	if( !this.wrp )
		return;
	
	this.wrp.toggleClass('-type-selected', select);
	
	if( select ){
        if( this.parent.shownOptions != this  )
            this.parent.hideOptions();
        
		this.parent.data.selectedPageName = this.getName();
		
		if( screenInfo )
			this.setCurScreenInfo(screenInfo);
	}
};

ScreenPage.prototype.isSelected = function(){
	return this.parent.isSelectedPage(this);
};


ScreenPage.prototype.showNotices = function(){
	// Уведомления для конкретной опции
	if( wofh.account.isPremium() ){
		for(var option in this.data.options){
			option = this.data.options[option];

			if( (option.notices||[]).length ){
				this.$options.find('[data-id="' + option.id + '"] .screenPage-optNotices-info').html(tmplMgr.screenPage.notices({
					notices: option.notices,
					param: option.noticeParam
				}));
				
				this.showNoticesCount(this.$options.find('[data-id="' + option.id + '"] .screenPage-optNotices-info'), this.calcNoticesCount(option.notices, option.noticeParam));
			}
		}
	}
	
    this.showAllNoticesCount();
    
	// Уведомления всех опций (общие)
	this.$noticesWrp.html(tmplMgr.screenPage.notices(this.data));
};
	
	ScreenPage.prototype.showAllNoticesCount = function(){
		this.showNoticesCount(this.$noticesInfo, this.calcNoticesCount());
		
		this.showNoticesCount(this.$noticesInfoSpecial, this.calcSpecialNoticesCount());
	};
	
	ScreenPage.prototype.calcNoticesCount = function(notices, param){
		notices = notices||this.data.notices;
		
		var count = 0;
		
		for(var notice in notices){
			notice = notices[notice];
			
			if( !notice.isSpecial() && notice.isActual(param) )
				count += notice.getCount(param);
		}
		
		return count;
	};
	
	ScreenPage.prototype.calcSpecialNoticesCount = function(){
		var count = 0;
		
		for(var notice in this.data.notices){
			notice = this.data.notices[notice];
			
			if( !notice.isSpecial() )
				continue;
			else if( notice.isActual() )
				count += notice.getCount();
		}
		
		return count;
	};
	
	ScreenPage.prototype.showNoticesCount = function($wrp, count){
		count = count||0;
		
		$wrp.removeClass('-type-big');
		
		if( count ){
			if( !wofh.account.isPremium() )
				$wrp.text('');
			else{
				if( count > 1 )
					$wrp.addClass('-type-big').text(count > 10 ? '9+' : count);
				else
					$wrp.text('');
			}
		}
		
		$wrp.toggleClass('-state-hidden', !count);
	};
	
ScreenPage.prototype.___showNoticesOld = function(){
	// Уведомления для конкретной опции
	if( wofh.account.isPremium() ){
		for(var option in this.data.options){
			option = this.data.options[option];

			if( (option.notices||[]).length )
				this.$options.find('[data-id="' + option.id + '"] .screenPage-optNotices-wrp').html(tmplMgr.screenPage.notices({
					notices: option.notices,
					param: option.noticeParam
				}));
		}
	}
	
	// Уведомления всех опций (общие)
	this.$noticesWrp.html(tmplMgr.screenPage.notices(this.data));
};


ScreenPage.prototype.setCurScreenInfo = function(screenInfo){
	this.data.curScreenInfo = screenInfo;
	
	this.updCurScreenInfo(screenInfo);
};

ScreenPage.prototype.updCurScreenInfo = function(){
    this.setCurScreenInfoImg();
    
    this.setCurScreenInfoTitle();
    
    this.setCurScreenInfoOption();
};

    ScreenPage.prototype.setCurScreenInfoImg = function(){
        if( !this.data.curScreenInfo )
            return;

        var img = this.data.curScreenInfo.getImg(),
            index = this.getCurScreenInfoId(this.data.curScreenInfo, {img: true}),
            $screenImg = this.$screenImgWrp.find('.screenPage-screenImg');

        if( $screenImg.length > 0 ){
            if( $screenImg.last().data('index') == index )
                return;

            utils.animateElem($screenImg, {
                endCSS: {left: '-200%'},
                anim: {duration: wndMgr.swipeTime},
                callback: function(){$(this).remove();}
            });

            $screenImg = $(snip.wrp('screenPage-screenImg', '', '', {type: img, index: index})).css('right', '-200%');

            this.$screenImgWrp.append($screenImg);

            utils.animateElem($screenImg, {
                endCSS: {right: '0'},
                anim: {duration: wndMgr.swipeTime}	
            });
        }
        else
            this.$screenImgWrp.append(snip.wrp('screenPage-screenImg', '', '', {type: img, index: index}));
    };
    
    ScreenPage.prototype.setCurScreenInfoTitle = function(title){
        if( !this.data.curScreenInfo )
            return;

        title = title||this.data.curScreenInfo.getTitle();

        var index = this.getCurScreenInfoId(this.data.curScreenInfo, {title: true}),
            $screenTitle = this.$screenTitleWrp.find('.screenPage-screenTitle');

        if( $screenTitle.length > 0 ){
            if( $screenTitle.last().data('index') == index )
                return;

            utils.animateElem($screenTitle, {
                endCSS: {left: '-200%'},
                anim: {duration: wndMgr.swipeTime},
                callback: function(){$(this).remove();}		
            });

            $screenTitle = $(snip.wrp('screenPage-screenTitle', title, '', {index: index})).css('right', '-200%');

            this.$screenTitleWrp.append($screenTitle);

            utils.animateElem($screenTitle, {
                endCSS: {right: '0'},
                anim: {duration: wndMgr.swipeTime}	
            });
        }
        else
            this.$screenTitleWrp.append(snip.wrp('screenPage-screenTitle', title, '', {index: index}));
    };
    
    ScreenPage.prototype.setCurScreenInfoOption = function(){
        this.$optionsList.removeClass('-type-active');
        
        this.$optionsList.filter('[data-id="' + this.getCurOptionId() + '"]').addClass('-type-active');
    };

ScreenPage.prototype.getCurScreenInfo = function(){
	return this.data.curScreenInfo;
};

ScreenPage.prototype.getCurOptionId = function(){
	return this.getCurScreenInfoId();
};


ScreenPage.prototype.getCurScreenInfoId = function(curScreenInfo){
	curScreenInfo = curScreenInfo||this.data.curScreenInfo;
	
	if( !curScreenInfo )
		return '0';
	
	return curScreenInfo.index + '';
};

ScreenPage.prototype.getCurScreenInfoIndex = function(curScreenInfo){
	curScreenInfo = curScreenInfo||this.data.curScreenInfo;
	
	if( !curScreenInfo )
		return 0;
	
	return this.getScreenIndexByOrder(curScreenInfo.index);
};

ScreenPage.prototype.getScreenIndexByOrder = function(order){
	order = order||0;
	
    for(var screenIndex in this.data.screens){
        if( this.data.screens[screenIndex].index == order )
            return +screenIndex;
    }
    
	return 0;
};
/*
ScreenPage.prototype.getCurScreenInfoIndex = function(){
	var curScreenInfo = this.data.curScreenInfo;
	
	if( !curScreenInfo )
		return 0;
	
	return curScreenInfo.index;
};
*/
ScreenPage.prototype.showScreenByIndex = function(index){
	var screenInfo = this.data.screens[index];
	
	if( screenInfo.hash ){
		hashMgr.showWnd(screenInfo.hash, screenInfo.id);
		
		return;
	}
	
	var constructor = this.getScreenConstructor(screenInfo);

	if( constructor )
		wndMgr.showScreen(constructor, screenInfo.id);
};

ScreenPage.prototype.showNextScreen = function(){
	var screens = this.data.screens;
	
	if( !screens.length )
		return;
	
	var index = this.getCurScreenInfoIndex();

	if( this.isSelected() && this.allowNext() )
		index += 1;
	
	index = index%screens.length;
	
	this.showScreenByIndex(index);
	
//	this.parent.hideOptions();
};

ScreenPage.prototype.toggleOptions = function(toggle){
	if( !this.wrp )
		return;
	
//	var $optionsWrp = this.wrp.find('.screenPage-options-wrp'),
//		$options = $optionsWrp.find('.screenPage-options');
//	
//	if( toggle ){
//		$optionsWrp.css({left: ''});
//		
//		var dxOverflow = $options.get(0).getBoundingClientRect().right - wndMgr.getWindowSize().width;
//		
//		$optionsWrp.css({left: dxOverflow > 0 ? -dxOverflow : 0});
//	}	
	
    this.clearTimeout(this.optionsToggleTO);
    
    if( toggle )
        this.$optionsWrp.removeClass('-type-hidden');
    
	this.wrp.toggleClass('-type-optionsActive', toggle);
	
    this.optionsToggleTO = this.setTimeout(function(){
        if( !toggle )
            this.$optionsWrp.addClass('-type-hidden');
    }, 250);
    
    this.parent.shownOptions = toggle ? this : null;
};

ScreenPage.prototype.checkMultyTitle = function(){
	if( !this.wrp )
		return;
	
    this.wrp.toggleClass('-type-multy', this.hasMulty());
};

    ScreenPage.prototype.hasMulty = function(){
        return this.data.options.length > 1;
    };

ScreenPage.prototype.allowNext = function(){
	return wndMgr.getSwipedWndList([mwChat]).length < 2;
};

ScreenPage.prototype.showBlink = function($wrp){
	$wrp = $wrp||this.$screenPage;
	
	if( $wrp.hasClass('-anim-splash') )
		return;
	
	$wrp.addClass('-anim-splash');
	
	this.setTimeout(function(){
		$wrp.removeClass('-anim-splash');
	}, 2000);;
};

ScreenPage.prototype.checkOptionsByAbil = function(abil){};