bMapR = function(parent){
	this.setMap(parent);
	
	bMapR.superclass.constructor.apply(this, arguments);
};
	
	utils.extend(bMapR, Block);
	
    
    bMapR.C_TOWNS_BLOCK_MULT = 0.35;
    bMapR.C_MIN_BLOCK_HEIGHT = 100;
    bMapR.C_FIT_FREE_HEIGHT = true;
    
    
	bMapR.prototype.calcName = function(){
		return 'mapR';
	};
	
	bMapR.prototype.calcChildren = function(){
        this.children.tile = bMapTile;
		this.children.towns = bMapTowns;
		this.children.comments = bMapComments;
		this.children.nav = bMapNav;
		this.children.events = bMapEvents;
	};

	bMapR.prototype.addNotif = function(){
        this.notif.other[Notif.ids.mapTileSelectInfo] = this.notifToggleAfterMapReady;
		this.notif.other[Notif.ids.mapTileSelect] = function(){
			var posTMT = this.map.tileSelect.tile[Tile.param.posTMT];
			
			if (this.lastTMT && posTMT.x == this.lastTMT.x && posTMT.y == this.lastTMT.y)
				this.toggle();
			else
				this.lastTMT = posTMT;
		};
		this.notif.other[Notif.ids.mapIfResize] = this.setResize;
	};
    
        bMapR.prototype.notifToggleAfterMapReady = function(){
            this.toggle(this.map.settings.p_rgt);

            this.detachNotifElem(Notif.ids.mapTileSelectInfo);
        };
    
	bMapR.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.map_panelR_toggle', function(){
				self.toggle();
			})
			.on('click', '.map_panelR_toggleAll', function(){
				wndMgr.toggleInterface();
			})
			.on('click', '.map_panelR_saveMap', function(e){
				e.stopPropagation();
				
				var $this = $(this),
					canvasWTag = self.map.map.canvasWTag,
					downloadFromBlob = function(blob){
						var url = URL.createObjectURL(blob);
						
						download(url);
						
						setTimeout(function(){
							URL.revokeObjectURL(url);
							
							$this.removeClass('-disabled');
						}, 100);
					},
					download = function(src){
						var link = document.createElement('a');
						
						link.setAttribute('download', 'map.png');
						
						link.setAttribute('href', src);
						
						link.dispatchEvent(new MouseEvent('click'));
					};
					
				if( $this.hasClass('-disabled') )
					return;
				else
					$this.addClass('-disabled');
				
				if( canvasWTag.toBlob ){
					canvasWTag.toBlob(function(blob){
						downloadFromBlob(blob);
					});
				}
				else if( canvasWTag.msToBlob ){
					var blob = self.map.map.canvasWTag.msToBlob();
					
					downloadFromBlob(blob);
				}
				else{
					download(canvasWTag.toDataURL());
					
					$this.removeClass('-disabled');
				}
			});
	};
	
	
	bMapR.prototype.setMap = function(parent){
		this.map = parent;
	};
	
	bMapR.prototype.toggle = function(opened){
		this.cont.toggleClass('opened', opened);
		
		this.setSettings(this.cont.hasClass('opened'));
	};
	
	bMapR.prototype.setSettings = function(status){
		this.map.settings.p_rgt = status;
		
		this.map.setSettings();
	};
	
	bMapR.prototype.setResize = function(delay){
        if( !this.isReady() )
            return;
        
        this.clearTimeout(this.resizeTO);
        
        if( delay < 0 )
            this._doResize();
        else
            this.resizeTO = this.setTimeout(this._doResize, delay||0);
	};
        
        bMapR.prototype._doResize = function(){
            var towns = this.children.towns,
                comments = this.children.comments,
                tile = this.children.tile;
            
            //блоки
            var townsScrollWrp = towns.wrp.find('.map_scroll_wrp'),
                commsScrollWrp = comments.wrp.find('.map_scroll_wrp');
            
            //убираем высоты
            townsScrollWrp.css('height', '');
            commsScrollWrp.css('height', '');
            
            towns.updScroll(true);
            comments.updScroll(true);
            
            //запоминаем текущие
            var townsHeight = townsScrollWrp.height();
            var commsHeight = commsScrollWrp.height();
            var allHeight = this.getAvailHeight();
            var townsTitleHeight = towns.wrp.find('.map_panelR_towns_title').height();
            var freeHeight = allHeight - (townsTitleHeight + tile.getContHeight() + comments.getContHeight());
            
            //ограничение towns по максимальной высоте
            townsHeight = allHeight * bMapR.C_TOWNS_BLOCK_MULT - townsTitleHeight;
            //ограничение towns по минимальной высоте
            townsHeight = Math.max(townsHeight, bMapR.C_MIN_BLOCK_HEIGHT);
            //ограничение comms по максимальной высоте
            commsHeight = freeHeight - townsHeight;
            //ограничение comms по минимальной высоте
            commsHeight = Math.max(commsHeight, bMapR.C_MIN_BLOCK_HEIGHT);
            
            //проверка на минимальные высоты
            if(townsHeight + commsHeight > freeHeight){
                if(townsHeight > bMapR.C_MIN_BLOCK_HEIGHT)
                    townsHeight = Math.max(bMapR.C_MIN_BLOCK_HEIGHT, freeHeight - commsHeight);

                if( bMapR.C_FIT_FREE_HEIGHT && townsHeight + commsHeight > freeHeight)
                    townsHeight = commsHeight = freeHeight * 0.5;
            }

            //выставляем высоты
            townsScrollWrp.css('height', townsHeight);
            commsScrollWrp.css('height', commsHeight);
        };
        
            bMapR.prototype.getAvailHeight = function(){
                return $(document).height();
            };
	
    
    
	bMapTowns = function(parent){
		this.setMap(parent);

		bMapTowns.superclass.constructor.apply(this, arguments);
	};
	
    
    utils.extend(bMapTowns, Block);
    
    
    bMapTowns.prototype.calcName = function(){
        return 'towns';
    };
    
    bMapTowns.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.townCur, Notif.ids.accTowns];
        
        this.notif.other[Notif.ids.mapMode] = 
        this.notif.other[Notif.ids.townResHas] = 
        this.notif.other[Notif.ids.townGarrison] = this.showStock;
    };

    bMapTowns.prototype.getTmplData = function(){
        var data = {towns: wofh.towns, links: {}};
        
        for(var town in data.towns){
            data.links[town] = {link: this.map.genPosLink(data.towns[town].pos)};
        }
        
        return data;
    };

    bMapTowns.prototype.bindEvent = function(){
        this.wrp
            .on('click', '.map-panelR-towns-set', function(){
                appl.setTown($(this).data('id'));
            });
    };

    bMapTowns.prototype.afterDraw = function(){
        this.parent.setResize(-1);

        this.initScroll({cls: '.map_scroll_wrp'});
    };
    
    
    bMapTowns.prototype.setMap = function(parent){
        this.map = parent.map;
    };
    
    bMapTowns.prototype.showStock = function(){
        this.wrp.find('.map-pR-town-stock').empty();

        if( this.map.mode.type == iMap.mode.type.build ) {
            var data = {};

            data.show = true;

            var townUnits = wofh.town.army.own;

            data.unit = townUnits.getElem(Unit.ids.worker);

            var resources;

            // Находим все ресурсы
            if( !this.map.mode.subtype || this.map.mode.subtype == 'road' ){
                resources = new ResList();

                var road;

                for (var roadId = 1; roadId < wofh.account.research.road; roadId++){
                    road = new Road(roadId);

                    resources.addList(road.getCost());
                }

                if( wofh.account.hasAbility(Science.ability.roadTunnel) ){
                    road = new Road(Road.ids.tunnel);

                    resources.addList(road.getCost());
                }
            }
            if( !this.map.mode.subtype || this.map.mode.subtype == 'env' ){
                var resources = resources||new ResList();

                if( !this.map.mode.subtype ){
                    var envList = wofh.account.research.env;
                } else {
                    var impId = this.map.mode.subid;
                    var envList = [];
                    envList[impId] = wofh.account.research.env[impId];
                }

                //находим все ресурсы
                for (var env in envList){
                    if(envList[env]){
                        var imp = new MapImp(env, envList[env]);
                        resources.addList(imp.getCost());
                    }
                }
            }

            //проставляем количества ресурсов
            if( resources ) {
                data.resources = resources;

                for (var res in resources.getList()) {
                    res = resources.setCount(res, utils.toInt(wofh.town.getRes(res).has));
                }
            }

            this.wrp.find('.map-pR-town.-active .map-pR-town-stock').html(tmplMgr.iMap.mapR.towns.stock(data));
        }

    };
	
    
    
	bMapTile = function(parent){
        this.setMap(parent);

		bMapTile.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMapTile, Block);


    bMapTile.prototype.calcName = function(){
        return 'tile';
    };

    bMapTile.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.mapTileSelectInfo, Notif.ids.townCur];

        this.notif.other[Notif.ids.mapTileSelect] = this.showAndWaitData;
    };

    bMapTile.prototype.getData = function(){
        this.data.tile = this.map.tileSelect;

        this.dataReceived();
    };

    bMapTile.prototype.canDisplay = function(){
        return this.data.tile;
    };

    bMapTile.prototype.afterDraw = function(){
        this.parent.setResize();
    };

    bMapTile.prototype.bindEvent = function(){
        var self = this;

        this.wrp.on('click', '.map_panelR_admin', function(){
            if( self.map.tileSelect && self.map.tileSelect.town ){
                wndMgr.addWnd(wAdminTownInfo, self.map.tileSelect.town.id);
            }
        });
        
        this.wrp.on('click', '.town-attacks', function(){
            self.showTownAttacks($(this));
        });
    };

    
    bMapTile.prototype.setMap = function(parent){
        this.map = parent.map;
    };
    
    bMapTile.prototype.getContHeight = function(){
        if( !this.wrp )
            return 0;
        
        return this.wrp.find('.map_panelR_dist').outerHeight(true) +
               this.wrp.find('.map_panelR_objects').outerHeight(true);
    };

    bMapTile.prototype.showTownAttacks = function($loaderCont){
        if( $loaderCont.hasClass('-disabled') )
            return false;
        else
            $loaderCont.addClass('-disabled');

        var loaderId = contentLoader.start( 
            $loaderCont, 
            0, 
            function(){
                reqMgr.getTownAttacks(this.map.tileSelect.town.id, function(resp){
                    contentLoader.stop(loaderId);

                    wndMgr.addSimple(tmplMgr.snipet.townAttacks(Army.parseAttacks(resp)), {
                        callbacks: {
                            calcName: function(){return 'townAttacks';},
                            
                            afterDraw: function(){
                                this.initScroll();
                            }
                        }
                    });
                });
            }.bind(this),
            {icon: ContentLoader.icon.small, cssPosition: {right: -15, top: 2}, callback:function(){
                $loaderCont.removeClass('-disabled');
            }}
        );
    };
    
    bMapTile.prototype.showAndWaitData = function(){
        this.show();
            
            if( !this.map.tileSelect || utils.sizeOf(this.map.tileSelect.dist) > 1 )
                return;
            
            this.cont.find('.paths-wrp').html('(' + snip.wrp('loader-container-icon-small') + ')');
    };
	
    
    
	bMapComments = function(parent){
		this.map = parent.map;

		bMapComments.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMapComments, Block);
    
    
    bMapComments.prototype.calcName = function(){
        return 'comments';
    };
    
    bMapComments.prototype.addNotif = function(){
        this.notif.show = [
            Notif.ids.mapTileSelect, 
            Notif.ids.mapTileSelectInfo,
            Notif.ids.accQuests,//мигающая кнопка
        ];
    };

    bMapComments.prototype.getTmplData = function(){
        this.checkDepositComment();

        var data = {tile: this.map.tileSelect};

        this.adding = false;

        data.canComment = !(new Quest(Quest.ids.mappost).isStatusUnavail());

        return data;
    };

    bMapComments.prototype.afterDraw = function(){
        this.resizeParent(-1);
        
        this.initScroll({cls: '.map_scroll_wrp'});
    };

    bMapComments.prototype.bindEvent = function(){
        var self = this;

        this.wrp
            .on('click', '.map_comm_butToggle', function(){
                if ( wofh.account.canMessage() ){
                    self.toggleAdding(true);

                    $('.map_comm_add_text').focus();
                }
                else
                    wndMgr.addAlert(snip.alertTmpl.blocked.message());
            })
            .on('click', '.map_comm_butReject', function(){
                self.toggleAdding(false);
            })
            .on('click', '.map_comm_butAccept', function(){
                if( self.data.canSend === false )
                    return false;

                self.toggleAdding(false);

                self.setComment();
            })
            .on('click', '.map_comm_delBut', function(){
                if ( wofh.account.canMessage() )
                    self.setComment(true);
                else
                    wndMgr.addAlert(snip.alertTmpl.blocked.message());
            })
            .on('input', '.map_comm_add_text', function(event){
                var val = $(this).val();

                self.setCanSend(!!val, val);
            });
    };
    
    
    bMapComments.prototype.resizeParent = function(delay){
        this.parent.setResize(delay);
    };
    
    bMapComments.prototype.isMutedTime = function(){
        return !wofh.account.isAdmin() && wofh.account.getMutedTime();
    };

    bMapComments.prototype.toggleAdding = function(adding){
        this.adding = adding;

        this.wrp.find('.map_comm').toggleClass('adding', adding);

        this.resizeParent();
    };

    bMapComments.prototype.checkDepositComment = function(){
        // Чистим коммент на местороде если до этого он уже был оставлен на другом местороде
        if( 
            this.map.tileSelect && 
            this.map.tileSelect.deposit && 
            this.map.lastDepositCommentTile && 
            this.map.tileSelect.comments && 
            !utils.isEqual(this.map.tileSelect.posTMT, this.map.lastDepositCommentTile.posTMT)
        ){
            for(var comment in this.map.tileSelect.comments){
                if( this.map.tileSelect.comments[comment].account.id == wofh.account.id )
                    this.map.tileSelect.comments.splice(comment, 1);
            }
        }
    };


    bMapComments.prototype.setComment = function(clear){
        var self = this,
            tileSelect = this.map.tileSelect;

        if( !tileSelect )
            return;

        var text = clear ? '' : this.wrp.find('.map_comm_add_text').val();

        if( text == '' )
            clear = true;

        reqMgr.postMessage(this.map.posMWT.o, tileSelect.posTMT.x, tileSelect.posTMT.y, text, function(resp){
            //удаляем старый комментарий
            for(var comment in tileSelect.comments){
                if( tileSelect.comments[comment].account.id == wofh.account.id )
                    tileSelect.comments.splice(comment, 1);
            }

            //добавляем новый
            if(clear){
                tileSelect.comment = '';

                for(var pos in tileSelect.comments){
                    var comment = tileSelect.comments[pos];

                    if(comment.account.id == wofh.account.id)
                        tileSelect.comments.splice(pos, 1);
                }
            } else {
                if(!tileSelect.comments)
                    tileSelect.comments = [];

                if( lib.mode.winmode != 0 && tileSelect.deposit )
                    self.map.lastDepositCommentTile = tileSelect;

                tileSelect.comments.splice(0, 0, {
                    text: resp.data.text,
                    time: timeMgr.getNow(),
                    account: wofh.account
                });

                tileSelect.comment = text;
            }
            
            self.map.map.clearTileCache(); // Чистим кеш тайла, чтобы запросить новые данные по комментариям

            self.show();
        });
    };

    bMapComments.prototype.setCanSend = function(state, text){
        if( state && (text && (TextParser.checkCanLinks(text) || text.match(/\n/g)||[]).length > lib.map.postmaxbr) ) state = false;

        if( this.data.canSend != state ){
            this.data.canSend = state;
            this.wrp.find('.map_comm_butAccept').toggleClass('-disabled', !state);
        }
    };
    
    bMapComments.prototype.getContHeight = function(){
        if( !this.wrp )
            return 0;
        
        return  this.wrp.find('.map_comm_title').outerHeight(true) + 
                this.wrp.find(this.adding ? '.map_comm_add_block' : '.map_comm_toggleBlock').outerHeight(true);
    };
    
        
        
	bMapNav = function(parent){
		this.setMap(parent);

		bMapNav.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMapNav, Block);


    bMapNav.prototype.calcName = function(){
        return 'nav';
    };

    bMapNav.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.mapSettings];
    };

    bMapNav.prototype.getTmplData = function(){
        var data = {enabled: this.map.settings.p_iface[LS.mapIFace.navigation]};

        return data;
    };

    bMapNav.prototype.bindEvent = function(){
        var self = this;

        //навигация
        this.wrp.on('click', '.map_nav button', function(){
            var dir = $(this).data('dir');

            if( dir < 0 )
                self.map.moveTo(wofh.town.pos, {highlight: true});
            else if( dir != 8 )
                self.moveByDir(dir);
            else
                self.map.moveTo(self.map.tileSelect.posTMT);
        });
    };


    bMapNav.prototype.setMap = function(parent){
        this.map = parent.map;
    };

    bMapNav.prototype.moveByDir = function(dir){
        var disp = Tile.dirsScr[dir];

        this.map.map.moveStep(disp.x, disp.y);
    };
		
		
		
	bMapEvents = function(parent){
		this.setMap(parent);
		
		bMapEvents.superclass.constructor.apply(this, arguments);
	};

    utils.extend(bMapEvents, Block);


    bMapEvents.prototype.calcName = function(){
        return 'events';
    };

    bMapEvents.prototype.initOptions = function(){
        bMapEvents.superclass.initOptions.apply(this, arguments);

        this.options.resizeParent = false;
    };

    bMapEvents.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.event, Notif.ids.mapTileHover, Notif.ids.mapTileSelect];
    };

    bMapEvents.prototype.getTmplData = function(){
        var workEvents = new EventList();

        for (var event in wofh.events.getList()){
            event = wofh.events.getElem(event).clone();

            if (event.type == EventCommon.type.maketown || 
                    event.type == EventCommon.type.makeres || 
                    event.type == EventCommon.type.makeroad || 
                    event.type == EventCommon.type.makeimp ||
                    event.type == EventCommon.type.explore) {

                //определяем наведенность
                var tiles = event.getAffectedTiles(this.map);
                for (var tile in tiles){
                    tile = tiles[tile];
                    if (this.map.tileHover && this.map.tileHover.tile && Tile.isSame(tile, this.map.tileHover.tile)){
                        event.hover = true;
                    }
                    if (this.map.tileSelect && this.map.tileSelect.tile && Tile.isSame(tile, this.map.tileSelect.tile)){
                        event.hover = true;
                    }
                }
                if (this.map.tileSelect && this.map.tileSelect.town) {
                    if (event.getTown1() == this.map.tileSelect.town.id)
                        event.hover = true;
                }

                workEvents.addElem(event);
            }
        }

        return {events: workEvents};
    };

    bMapEvents.prototype.bindEvent = function(){
        var self = this;

        this.wrp
            .on('click', '.map-event', function(){
                self.map.moveTo(utils.urlToObj($(this).attr('href')), {highlight:true});

                return false;
            })
            .on('click', '.map-event-time', function(){
                hashMgr.showWnd('army');

                return false;
            });
    };


    bMapEvents.prototype.setMap = function(parent){
        this.map = parent.map;
    };

    bMapEvents.prototype.bindHoverEvent = function(){
        var self;

        this.wrp
            .on('mouseover', '.map-event', function(e){
                var eventId = $(this).data('id');
                var event = wofh.events.getElem(wofh.events.getI(eventId));

                self.map.eventSelect = eventId;
                self.map.map.drawHighCanvas();

                var events = new EventList();
                events.list.push(event);

                var cont = tmplMgr.iMap.tooltip({events: events});

                // Из-за изменения текста таймером, раз в секунду, 
                tooltipMgr.show(cont, utils.getPosFromEvent(e), {voiceHelper: {$target: $(this).find('.eventIcon'), text: cont, important: true}});
            })
            .on('mouseout', '.map-event', function(){
                tooltipMgr.hide();

                delete self.map.eventSelect;

                self.map.map.drawHighCanvas();
            });
    };