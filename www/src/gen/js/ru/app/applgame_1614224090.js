function ApplGame(){}

utils.extend(ApplGame, Appl);


ApplGame.prototype.initEnvironment = function(){
    wndMgr.initEnvironment();
    
    this.prepareLib();

    if( servodata.platform.inframe ){
        if( window.top == window ){
            wndMgr.$body.addClass('-blank');

            return false;
        }

        this.initCrossDomain();
    }

    window.requestAnimFrame = function(){
        return	window.requestAnimationFrame       || 
                window.webkitRequestAnimationFrame || 
                window.mozRequestAnimationFrame    || 
                window.oRequestAnimationFrame      || 
                window.msRequestAnimationFrame     || 
                function(callback){
                    window.setTimeout(callback, 17);
                };
    }();

    window.cancelAnimationFrame = function(){
        return	window.cancelAnimationFrame || 
                window.mozCancelAnimationFrame ||
                function(timeoutId){
                    window.clearTimeout(timeoutId);
                };
    }();

    return true;
};
    
    ApplGame.prototype.prepareLib = function(){};
    
    ApplGame.prototype.initCrossDomain = function(){
        if( location.host )
            document.domain = location.host.split('.').splice(1, 2).join('.');
    };

ApplGame.prototype.initComponents = function(){
    this.initWebSocket();

    this.initWorker();

    this.initServBuffer();

    this.initTmplMgr();

    this.toggleLoader(true);
};

    ApplGame.prototype.initWebSocket = function(){
        this.сomponents++;

        webSocketMgr = (new WebSocketMgr()).init();
    };

    ApplGame.prototype.initWorker = function(){
        this.сomponents++;

        workerMgr = (new WorkerMgr()).init();
    };

    ApplGame.prototype.initServBuffer = function(){
        this.сomponents++;

        this.notifHandler = notifMgr.getHandler();

        notifMgr.addListener(Notif.ids.wsOpen, this.notifHandler, function(){
            servBuffer = new ServBufferMgr(function(){
                appl.onComponentsInited();
            });
        });
    };
    
    ApplGame.prototype.initTmplMgr = function(){
        tmplMgr.parseTemplates(wndMgr.$body.find('#preload-templates'));
    };

    ApplGame.prototype.toggleLoader = function(toggle){
        var $wrp = wndMgr.$body.find('#preload-templates').empty();

        if( toggle ){
            wndMgr.$body.addClass('-state-loading');

            this.loaderId = contentLoader.start($wrp, 500, false, {
                appearanceTime: 500, 
                animationTime: 15000,
                noPingTime: 3600000,
                infinityIconAnim: true,
                noPingCont: tmplMgr.preload.loading()
            });
        }
        else{
            wndMgr.$body.removeClass('-state-loading');

            contentLoader.stop(this.loaderId);

            delete this.loaderId;

            $wrp.remove();
        }
    };

ApplGame.prototype.loadDependencies = function(){
    this.loadMobileDependencies();
};
    
    ApplGame.prototype.loadMobileDependencies = function(){
        if( !this.checkMobile() )
            return;
        
        this.dependencies++;
        
        utils.loadStylesheet('gen/css/ru/mobile/mobile_1612955383.css', {async: false, callback: function(){
            appl.onDependenciesLoaded();
        }});
        
        this.loadMobileExt();
        
        this.dependencies++;
        
        utils.loadScript('gen/js/ru/mobile/dependencies/game_1614224089.js', {async: false, callback: function(){
            appl.onDependenciesLoaded();
        }});
    };
        
        ApplGame.prototype.checkMobile = function(){
            if( !debug.allowMobile() )
                return false;

            if( ls.getMobileAccept(LS.def.MobileAccept) ){
                if( ls.getGameIf() != Appl.interface.mobile )
                    return false;
            }
            else
                ls.setGameIf(Appl.interface.mobile);
            
            return true;
        };
        
        ApplGame.prototype.loadMobileExt = function(){
            if( !debug.useMobileApp() )
                return;

            this.dependencies++;

            utils.loadStylesheet('gen/css/ru/mobileApp/mobileApp_1614209520.css', {async: false, callback: function(){
                appl.onDependenciesLoaded();
            }});
            
//            this.dependencies++;
//            
//            utils.loadStylesheet('gen/css/ru/mobileApp/mobileApp_import_1614223299.css', {async: false, callback: function(){
//                appl.onDependenciesLoaded();
//            }});
            
            appl.useMobileAppScripts = true;
        };

ApplGame.prototype.prepare = function(){
    ApplGame.superclass.prepare.apply(this, arguments);
    
    this.initPage();
    
    SelectStyled.bind();
    
    this.isFramed = servodata.platform.fullscreenbutton;
};

    ApplGame.prototype.initDevice = function(){
        wndMgr.$body.addClass('-if-desk');

        this.checkTouchDevice();
    };

        ApplGame.prototype.checkTouchDevice = function(){
            if( !utils.isTouchDevice() )
                return;

            wndMgr.$body.addClass('-device-touch');

            this.overrideTouchDevice();
        };
            // Переопределяем необходимые методы для корректной работы touch устройств в обычном интерфейсе
            // Следует перенести данную функцию в другое место
            ApplGame.prototype.overrideTouchDevice = function(){
                iMap.prototype.bindEvent = function(){
                    this.ignorePullRefresh();
                };

                iMap.prototype.ignorePullRefresh = function(){
                    wndMgr.$body.addClass('-no-pull-refresh');

                    var lastPageY;

                    wndMgr.$window
                        .on('scroll.mapPullRefresh', function(){
                            if( !window.scrollY )
                                wndMgr.$body.addClass('-no-pull-refresh');
                        })
                        .on('touchstart.mapPullRefresh', function(e){
                            lastPageY = e.originalEvent.changedTouches[0].pageY;
                        })
                        .on('touchmove.mapPullRefresh', function(e){
                            if( lastPageY - e.originalEvent.changedTouches[0].pageY > 0 )
                                wndMgr.$body.removeClass('-no-pull-refresh');
                        })
                        .on('touchend.mapPullRefresh', function(){
                            if( !window.scrollY )
                                wndMgr.$body.addClass('-no-pull-refresh');
                        });
                };

                utils.overrideMethod(iMap, 'onRemove', function __method__(){
                    __method__.origin.apply(this, arguments);

                    wndMgr.$window.off('.mapPullRefresh');

                    wndMgr.$body.removeClass('-no-pull-refresh');
                });


                utils.overrideMethod(bckMap, 'touchStart', function __method__(e){
                    if( e.touches.length > 1 )
                        return;

                    this._scrolling_ = {
                        checkScroll: true,
                        allowScroll: false,
                        startPos: utils.getPosFromEvent(e.touches[0])
                    };
                });

                utils.overrideMethod(bckMap, 'touchMove', function __method__(e){
                    if( !this._scrolling_ )
                        return;

                    if( e.touches.length > 1 )
                        return;

                    if( this._scrolling_.checkScroll ){
                        var scrollWrp = wndMgr.$html.get(0),
                            scrollWrpPos = {
                                atLeft: !scrollWrp.scrollLeft,
                                atRight: scrollWrp.scrollLeft >= (scrollWrp.scrollWidth - scrollWrp.clientWidth) - 1,
                                atTop: !scrollWrp.scrollTop,
                                atBottom: scrollWrp.scrollTop >= (scrollWrp.scrollHeight - scrollWrp.clientHeight) - 1
                            };

                        if( scrollWrpPos.atLeft && scrollWrpPos.atRight && scrollWrpPos.atTop && scrollWrpPos.atBottom )
                            this._scrolling_.allowScroll = true;
                        else{
                            var curPos = utils.getPosFromEvent(e.touches[0]),
                                dX = this._scrolling_.startPos.x - curPos.x,
                                dY = this._scrolling_.startPos.y - curPos.y;

                            if( Math.abs(dX) > Math.abs(dY) ){
                                if( scrollWrpPos.atLeft || scrollWrpPos.atRight ){
                                    if( scrollWrpPos.atLeft && scrollWrpPos.atRight )
                                        this._scrolling_.allowScroll = true;
                                    else
                                        this._scrolling_.allowScroll = (scrollWrpPos.atLeft && dX < 0) || (scrollWrpPos.atRight && dX > 0);
                                }
                            }
                            else{
                                if( scrollWrpPos.atTop || scrollWrpPos.atBottom ){
                                    if( scrollWrpPos.atTop && scrollWrpPos.atBottom )
                                        this._scrolling_.allowScroll = true;
                                    else
                                        this._scrolling_.allowScroll = (scrollWrpPos.atTop && dY < 0) || (scrollWrpPos.atBottom && dY > 0);
                                }
                            }
                        }

                        if( this._scrolling_.allowScroll )
                            this.touchStart.origin.call(this, e);

                        this._scrolling_.checkScroll = false;
                    }

                    if( this._scrolling_.allowScroll )
                        __method__.origin.apply(this, arguments);
                });

                utils.overrideMethod(bckMap, 'touchEnd', function __method__(e){	
                    if( !this._scrolling_ || e.touches.length > 0 )
                        return;

                    if( this._scrolling_.allowScroll )
                        __method__.origin.apply(this, arguments);

                    delete this._scrolling_;
                });


                utils.overrideMethod(bckTown, 'touchStart', function __method__(e){
                    if( e.touches.length > 1 )
                        return;

                    this._scrolling_ = {
                        checkScroll: true,
                        allowScroll: false,
                        startPos: utils.getPosFromEvent(e.touches[0])
                    };
                });

                utils.overrideMethod(bckTown, 'touchMove', function __method__(e){
                    if( !this._scrolling_ )
                        return;

                    if( e.touches.length > 1 ){
                        this._scrolling_.checkScroll = false;

                        this._scrolling_.allowScroll = true;
                    }

                    if( this._scrolling_.checkScroll ){
                        if( this.modeSwap )
                            this._scrolling_.allowScroll = true;

                        if( !this._scrolling_.allowScroll ){
                            var scrollWrp = wndMgr.$html.get(0),
                                scrollWrpPos = {
                                    atLeft: !scrollWrp.scrollLeft,
                                    atRight: scrollWrp.scrollLeft >= (scrollWrp.scrollWidth - scrollWrp.clientWidth) - 1,
                                    atTop: !scrollWrp.scrollTop,
                                    atBottom: scrollWrp.scrollTop >= (scrollWrp.scrollHeight - scrollWrp.clientHeight) - 1
                                };

                            if( scrollWrpPos.atLeft && scrollWrpPos.atRight && scrollWrpPos.atTop && scrollWrpPos.atBottom )
                                this._scrolling_.allowScroll = true;
                            else{
                                var curPos = utils.getPosFromEvent(e.touches[0]),
                                    dX = this._scrolling_.startPos.x - curPos.x,
                                    dY = this._scrolling_.startPos.y - curPos.y;

                                if( Math.abs(dX) > Math.abs(dY) ){
                                    if( scrollWrpPos.atLeft || scrollWrpPos.atRight ){
                                        if( scrollWrpPos.atLeft && scrollWrpPos.atRight )
                                            this._scrolling_.allowScroll = true;
                                        else
                                            this._scrolling_.allowScroll = (scrollWrpPos.atLeft && dX < 0) || (scrollWrpPos.atRight && dX > 0);
                                    }
                                }
                                else{
                                    if( scrollWrpPos.atTop || scrollWrpPos.atBottom ){
                                        if( scrollWrpPos.atTop && scrollWrpPos.atBottom )
                                            this._scrolling_.allowScroll = true;
                                        else
                                            this._scrolling_.allowScroll = (scrollWrpPos.atTop && dY < 0) || (scrollWrpPos.atBottom && dY > 0);
                                    }
                                }
                            }
                        }

                        if( this._scrolling_.allowScroll ){
                            this.touchStart.origin.call(this, e);

                            if( this.modeSwap )
                                this.swapStart(e);
                        }

                        this._scrolling_.checkScroll = false;
                    }

                    if( this._scrolling_.allowScroll ){
                        __method__.origin.apply(this, arguments);

                        if( this.modeSwap )
                            this.swapMove(e);
                    }
                });

                utils.overrideMethod(bckTown, 'touchEnd', function __method__(e){	
                    if( !this._scrolling_ || e.touches.length > 0 )
                        return;

                    if( this._scrolling_.allowScroll ){
                        __method__.origin.apply(this, arguments);

                        if( this.modeSwap )
                            this.swapEnd(e);
                    }

                    delete this._scrolling_;
                });

                bckTown.prototype.swapStart = function(e){
                    this.touchMoved = true;

                    this.mouseHold = false;

                    if( !this.modeSwap.slot )
                        this.onMouseClick(this.posWtl);

                    if( this.modeSwap.slot )
                        e.preventDefault();
                    else
                        this.mouseHold = true;
                };

                bckTown.prototype.swapMove = function(e){
                    if( !this.modeSwap.slot )
                        return;

                    this.posSwapHover = this.getTouchPos(e.touches[0], {ignoreScroll: true, ignoreZoom: true});

                    var movingDirs = {};

                    if( this.checkMoveViewWhileSwap(this.posSwapHover, movingDirs) ){
                        if( !this.moving )
                            this.startMoveView(movingDirs);
                    }
                    else
                        this.stopMoveView();

                    e.preventDefault();
                };

                bckTown.prototype.swapEnd = function(e){
                    this.onMouseClick(this.posWtl, {immClick: true});
                };

                    bckTown.prototype.checkMoveViewWhileSwap = function(posSwapHover, dirs){
                        var $view = wndMgr.$html,
                            atLeft = posSwapHover.x < 40,
                            atRight = posSwapHover.x > $view.width() - 40,
                            atTop = posSwapHover.y < 40,
                            atBottom = posSwapHover.y > $view.height() - 40;

                        if( !(atLeft || atRight || atTop || atBottom) )
                            return false;

                        if( dirs ){
                            dirs.atLeft = atLeft;
                            dirs.atRight = atRight;
                            dirs.atTop = atTop;
                            dirs.atBottom = atBottom;
                        }

                        return true;
                    };

                    // Перемещение внутри вида по направлениям
                    bckTown.prototype.startMoveView = function(movingDirs){
                        this.moving = {dirs: movingDirs};

                        this.iterMoveView();
                    };

                    bckTown.prototype.iterMoveView = function(){
                        if( !this.moving )
                            return;

                        var moveDirs = this.moving.dirs,
                            moveX,
                            moveY;

                        if( moveDirs.atLeft )
                            moveX = -1;
                        else if( moveDirs.atRight )
                            moveX = 1;

                        if( moveDirs.atTop )
                            moveY = -1;
                        else if( moveDirs.atBottom )
                            moveY = 1;

                        if( moveX )
                            this.posWcOcO.x += (moveX * (1 + 40 * 1/this.zoom));

                        if( moveY )
                            this.posWcOcO.y += (moveY * (1 + 40 * 1/this.zoom));

                        this.onViewMoved();

                        this.moving.TO = this.setTimeout(this.iterMoveView, 17);
                    };

                    bckTown.prototype.stopMoveView = function(){
                        if( !this.moving )
                            return;

                        this.clearTimeout(this.moving.TO);

                        delete this.moving;
                    };

                    bckTown.prototype.onViewMoved = function(){
                        if( !this.posSwapHover )
                            return;

                        this.checkViewBounds();

                        this.centerView();
                    };
            };

    ApplGame.prototype.initPage = function(){
        wndMgr.$html.addClass(debug.isTest('system') ? '-if-test' : '');

        this.setAntialiasing();
    };

        ApplGame.prototype.setAntialiasing = function(){
            wndMgr.$body.toggleClass('-pixelart', !ls.getAntialiasing(LS.def.Antialiasing));
        };

ApplGame.prototype.finishInit = function(){
	timeMgr.setTime(servodata.time, +servBuffer.serv.options.timeZone, servodata.locTime, servodata.syncDelay);
	
	this.initWofh();
	
	this.initMgrs();
	
	this.checkDevice();
	
	this.checkLastUpd();
	
	this.prepareInterface();
	
	this.preparePlatform();
	
	this.setHrefBehavior();
	
	this.initClipboard();
	
    this.extendSnip();
    
	this.initListeners();
	
	this.initHeader();
	
	this.bindEvents();
	
	this.initInterfaces();
	
	this.onInited();
};

    ApplGame.prototype.initWofh = function(){
        if( ls.getNA(false) )
            servodata.account.status = 2;

        wofh.init(servodata);
    };

    ApplGame.prototype.initMgrs = function(){
        wndMgr.init();

        chatMgr = (new ChatMgr()).init();

        hashMgr = (new HashMgr()).init();

        hashMgr.setFirstParam = function(){return wofh.town ? wofh.town.id: 0;};

        hashMgr.onFirstParamChange = function(tid){
            if( wndMgr.town )
                appl.setTown(tid);
        };

        questsMgr = (new QuestsMgr()).init();

        sndMgr = (new SndMgr()).init();

        tooltipMgr = new TooltipMgr();

        workerMgr.initDependencies();
    };
    
    ApplGame.prototype.checkDevice = function(){};
    
    ApplGame.prototype.checkLastUpd = function(){
        var applLastUpd = ls.getApplLastUpd(0),
            lastUpd = location.href.match(/_([^_]+?)([.&#?]|$)/)[1]; // Берём время последнего обновлния мира.

        if( applLastUpd && lastUpd > applLastUpd ){
            ls.cleanConsoleErrors();

            notifMgr.runEvent(Notif.ids.sysConsoleError);
        }

        ls.setApplLastUpd(lastUpd);
    };
    
    ApplGame.prototype.prepareInterface = function(){
        if( LuckBonus.subscription.isOn() )
            wndMgr.$body.addClass('-mode-subscription');
    };
    
    ApplGame.prototype.preparePlatform = function(){
        wofh.platform = servodata.platform;
        
        for(var i in window.servodata_platform){
            wofh.platform[i] = servodata_platform[i];
        }

        if( wofh.platform.init )
            wofh.platform.init();

        if( wofh.platform.inframe )
            wndMgr.$body.addClass('-addScroll');
    };
    
    ApplGame.prototype.setHrefBehavior = function(){
        // Запрещаем создание новых вкладок
        var tags = ['a'];

        if( ls.getGameIf() == Appl.interface.simplified )
            tags.push('area');

        wndMgr.$document.on('mousedown', tags.join(','), function(event){
            var $this = $(this);

            // Не запрещаем создания новой вкладки для боя если параметр platform.battletabs истина
            if( $this.hasClass('js-battleLink') && wofh.platform.battletabs ) 
                return; 

            if( utils.getMouseButton(event) != Appl.mouseButton.left ){
                if( $this.attr('href') !== undefined ){
                    $this.data('href', $this.attr('href'));
                    $this.removeAttr('href');
                }
            }
            else{
                if( $this.attr('href') === undefined && $this.data('href') !== undefined ){
                    $this.attr('href', $this.data('href'));
                    $this.data('href', false);
                }
            }
        });
    };
    
    ApplGame.prototype.initListeners = function(){
        notifMgr.addListener(Notif.ids.accMessageNew, this.notifHandler, this.showHeader);

        notifMgr.addListener(Notif.ids.accReportNew, this.notifHandler, this.showHeader);

        notifMgr.addListener(Notif.ids.applResize, this.notifHandler, this.resize);
    };
    
        ApplGame.prototype.resize = function(delay){
            clearTimeout(appl.resizeTimeout);

            if( delay === undefined )
                delay = appl.resizeDelay;
            else
                delay = delay||0;

            if( delay < 0 )
                wndMgr.resize();
            else
                appl.resizeTimeout = setTimeout(function(){wndMgr.resize();}, delay);
        };
    
    ApplGame.prototype.initHeader = function(){
        this.showHeader();
    };
    
        ApplGame.prototype.showHeader = function(){
            var mark = wofh.account.hasNewMessages() || wofh.account.hasNewReports()? '* ': '';

            document.title = mark + 'π - ' + utils.unescapeHtml(wofh.account.name);
        };
    
    ApplGame.prototype.bindEvents = function(){
        this.initResizeDelay();

        window.onresize = function(e){
            appl.onResize();
        };

        notifMgr.runEvent(Notif.ids.applResize, 10);

        if( wofh.platform.fullscreenbutton ){
            wndMgr.$window
                .on('mozfullscreenchange webkitfullscreenchange fullscreenchange', function() {
                    this.fullScreenMode = !this.fullScreenMode;

                    if ( !this.fullScreenMode && appl.fullScreen )
                        appl.toggleFrame(true);
                });
        }

        wndMgr.$document
            .on('click', '.js-battleLink', function(event){
                if( utils.getMouseButton(event) == Appl.mouseButton.left ){
                    wndMgr.addWnd(wBattle, encodeURIComponent($(this).attr('href')));

                    return false;
                }

                return true;
            });

        this.bindKeyEvents();
    };
        
        ApplGame.prototype.initResizeDelay = function(){
            this.resizeDelay = 17;
        };
        
        ApplGame.prototype.onResize = function(){
            notifMgr.runEvent(Notif.ids.applResize);
        };
        
        ApplGame.prototype.toggleFrame = function(notToggleFullScreen){
            this.fullScreen = !this.fullScreen;
            
            this.toggleFramed();

            if( !notToggleFullScreen )
                this.toggleFullScreen();

            wndMgr.$body.toggleClass('-fullscr', this.fullScreen);

            // Перерасчет положения чата при переключении экранного режима (задержка в 100 для ожидания полного переключения)
            if( window.wndMgr && wndMgr.interfaces.town && wndMgr.interfaces.town.friends ){
                setTimeout(function(){
                    pFriends.resizeDependComponent();

                    wndMgr.centerWnd();
                }, 100);
            }
        };
            
            ApplGame.prototype.toggleFramed = function(){
                this.isFramed = !this.isFramed;

                notifMgr.runEvent(Notif.ids.applFramed);
            };
            
            ApplGame.prototype.toggleFullScreen = function(){
                if( utils.isFullScreen() )
                    utils.unsetFullScreen();
                else
                    utils.setFullScreen();
            };
        
        ApplGame.prototype.bindKeyEvents = function(){
            $(document)
                .on('keyup', function(event){
                    if( event.ctrlKey && wofh.account.isPremium() && (event.keyCode == 0x25 || event.keyCode == 0x27) ){
                        if( event.target ){
                            var tagName = event.target.tagName.toLowerCase();

                            if( tagName == 'textarea' || tagName == 'input' ) 
                                return;
                        }

                        wofh.account.switchTown(event.keyCode == 0x25);

                        return false;
                    }
                })
                .on('keypress', 'form', function(event){//отправка форм по ctrl-enter
                    if( (event.ctrlKey) && ((event.keyCode == 0xA)||(event.keyCode == 0xD)) ) {
                        $(this).submit();

                        return false;
                    }
                });
        };

    ApplGame.prototype.initInterfaces = function(){
        if( !this.checkInterfaces(true) )
            return;
        
        this.assignNotif();
        
        this.addInterfaces();

        // Берем интерфейс из хэша и показываем
        hashMgr.parse();

        this.afterHashParsed();

        // Инициализация счётчиков - обязательно после инициализации видов
        this.initIterators();

        this.initFreeLuck();

        this.initRefNotif();

        this.initGroundhound();

        this.initQuests();
    };

        ApplGame.prototype.checkInterfaces = function(init){
            var hasTowns = utils.sizeOf(wofh.towns) > 0 && !debug.isNoTowns();

            // Инициализация интерфейсов
            new iNoTowns();

            if ( !hasTowns ){
                wndMgr.resize = function(){};

                wndMgr.showInterface('noTowns');

                return false;
            }

            this.checkCurTown(init);

            this.checkAbility();

            return true;
        };
        
            ApplGame.prototype.checkCurTown = function(init){
                //берем из хэша
                var tIdHash = hashMgr.getFirstParam(),
                    tId = tIdHash;

                //берем из тида
                tId = tId||utils.urlToObj(location.search).tid;

                //берем из локального хранилища
                if( !tId || wofh.towns[tId] === undefined )
                    tId = ls.getTownId();

                //проверяем на наличие такого города в данных
                if( wofh.towns[tId] === undefined ){
                    utils.objToArr(wofh.towns, function(a, b){return a.id - b.id;});

                    tId = Towns.getArray()[0].id;
                }

                if( tId === undefined )
                    return;

                set.town.cur(tId, init);

                if( init && tId != tIdHash && !hashMgr.getSecondParam() ) {
                    setTimeout(function(){
                        wndMgr.addWnd(wTownInfo, tIdHash);
                    }, 0);
                }
            };
            
            ApplGame.prototype.checkAbility = function(){
                wofh.account.ability.init();

                wofh.account.ability.checkAccount();
            };
        
        ApplGame.prototype.assignNotif = function(){
            if( wofh.account.isAdmin() )
                return;
            
            this.abilityWndList = [];
            
            notifMgr.addListener(Notif.ids.accAbilities, 'appl', function(id){
                appl.abilityWndList.push(id);

                appl.showAbil();
            });
        };
        
            ApplGame.prototype.showAbil = function(){
                if( wndMgr.getWndByType(wAbility).length == 0 && this.abilityWndList.length ){
                    if( this.allowImmediateAbilShow() ){
                        wndMgr.addWnd(wAbility, this.abilityWndList[0]);

                        this.abilityWndList = this.abilityWndList.slice(1);
                    } 
                    else
                        setTimeout(function(){appl.showAbil();}, 1000);
                }
            };
                
                ApplGame.prototype.allowImmediateAbilShow = function(){
                    return wndMgr.interface;
                };
        
        ApplGame.prototype.addInterfaces = function(){
            if( this.isInited() )
                return;

            new iMap();

            new iTown();
        };
        
        ApplGame.prototype.afterHashParsed = function(){};
        
        ApplGame.prototype.initIterators = function(){
            resHasIterator = new ResHasIterator();
            bldPercIterator = new BldPercIterator();
            sciProgIterator = new SciProgIterator();
            popIterator = new PopIterator();
            eventIterator = new EventIterator();
            moneyIterator = new MoneyIterator();
            accBonusIterator = new AccBonusIterator();
            townsBonusAlarmIterator = new TownsBonusAlarmIterator();
        };
        
        ApplGame.prototype.initFreeLuck = function(){
            if( LuckBonus.subscription.isActive() && !LuckBonus.subscription.isAccepted() )
                wndMgr.addWnd(wBonus);
            else if( wofh.account.getDoneQuests().length == 0 && wofh.account.getCoinsFree() > 0 )
                wndMgr.addWnd(wFreeLuck);
        };
        
        ApplGame.prototype.initRefNotif = function(){
            if( wofh.platform.noinvitewindow || !wofh.account || !wofh.account.invitewindow ) 
                return;

            var delayStart = 60, // Задержка от старта
                delayShow = 8 * 3600, // Задержка от предыдущего показа
                time = ls.getRefNotif(0),
                delay = 0;

            if( time ) {
                var delayLastShow = timeMgr.getNow() - time;//сколько времени с последнего запуска

                if( delayLastShow < delayShow )
                    delay = delayShow - delayLastShow;
            }

            delay = Math.max(delayStart, delay); //ограничиваем снизу

            setTimeout(function(){
                wndMgr.addWnd(wRefNotif);

                ls.setRefNotif(timeMgr.getNow());
            }, delay * 1000);
        };
        
        ApplGame.prototype.initGroundhound = function(){
            if(
                (
                    wofh.gameEvent.has(GameEvent.ids.groundhogWinter)
                    || 
                    wofh.gameEvent.has(GameEvent.ids.groundhogSpring)
                )
                && 
                (ls.getGroundhog(0) < timeMgr.getNow() - 3600 * 24 * 30)
            ){
                ls.setGroundhog(timeMgr.getNow());

                wndMgr.addWnd(wGroundhog);
            }
        };
        
        ApplGame.prototype.initQuests = function(){
            // Кешируем ресурсы боевого клиента до первой атаки на город
            if( Quest.isUnavail(Quest.ids.attackBarb) )
                battleMgr.cach();

            // Открытие окна 1-го квеста
            if( Quest.isBonus(Quest.ids.reward) )
                wndMgr.addWnd(wQuestInfo, Quest.ids.reward);
        };
    
    ApplGame.prototype.onInited = function(){
        wndMgr.$head.find('script').remove();

        this.toggleLoader(false);

        this.inited = true;
    };
        

ApplGame.prototype.reload = function(){
    this.stopAppl();
    
    if( wndMgr.$body )
        wndMgr.$body.fadeOut(200, function(){
            appl.reloadNow();
        });
};

    ApplGame.prototype.stopAppl = function(){
        window.onhashchange = function(){return false;};
        
        wndMgr.addWnd = function(){};
    };

ApplGame.prototype.setTown = function(tid){
    set.town.cur(tid);
};

ApplGame.prototype.getAvailHeight = function(selector){
	var height = $(selector||document).height();
	
	var friends = wndMgr.interfaces.town.friends;
	
	if (friends && friends.cont){
		height = friends.cont.offset().top;
	}
	
	return height;
};

ApplGame.prototype.sendClicker = function(i, val){
	if( this.clickerTO )
		clearTimeout(this.clickerTO);
	else
		this.clickerData = '00000';
	
	this.clickerTown = wofh.town.id;
	this.clickerData = this.clickerData.slice(0, i) + val + this.clickerData.slice(i+1);
	
	this.clickerTO = setTimeout(function(){
		reqMgr.clickClickers(appl.clickerData, appl.clickerTown);
		
		appl.clickerData = '00000';
	}, 5000);
};

ApplGame.prototype.logOut = function(){
	wndMgr.addConfirm(wofh.account.isMale() ? 'Ты уверен что хочешь покинуть игру? Твои города будут продолжать жить без тебя. Они могут быть подвергнуты нападению. Ими может завладеть голод, разруха и уныние без своего любимого правителя...' : 'Ты уверена что хочешь покинуть игру? Твои города будут продолжать жить без тебя. Они могут быть подвергнуты нападению. Ими может завладеть голод, разруха и уныние без своего любимого правителя...').onAccept = function(){
		reqMgr.logOut(wofh.account.isAssistant()?'relogin='+lib.main.domain:'');
	};
};

ApplGame.prototype.update = function(data){
	wofh.update(data);
	
	if( !this.checkInterfaces() )
		return;
	
	chatMgr.openChannels(true);
	
	notifMgr.runEvent(Notif.ids.wsUpdate);
};


appl = new ApplGame();