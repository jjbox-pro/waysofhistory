bMapTL = function(parent){
	this.map = parent;
	
	bMapTL.superclass.constructor.apply(this, arguments);
	
	this.options.staticZ = true;
};

	utils.extend(bMapTL, Block);
	
	
	bMapTL.prototype.calcName = function(){
		return 'mapTL';
	};
	
	bMapTL.prototype.calcChildren = function(){
		this.children = {};
		
		this.children.zoom = bMapZoom;
		this.children.mode = bMapMode;
		this.children.filters = bMapFilters;
	};
	
	
	
	bMapZoom = function(parent){
		this.setMap(parent);

		bMapZoom.superclass.constructor.apply(this, arguments);
	};
		
		utils.extend(bMapZoom, Block);
		
		
		bMapZoom.prototype.calcName = function(){
			return 'zoom';
		};
		
		bMapZoom.prototype.getTmplData = function(){
			return {show: +this.map.settings.p_iface[LS.mapIFace.zoom]};
		};
		
		bMapZoom.prototype.bindEvent = function(){
			var self = this;
			
			this.wrp
				.on('click', '.map_zoom_plus', function(){
					self.map.changeZoom(-self.getSliderStep());
				})
				.on('click', '.map_zoom_minus', function(){
					self.map.changeZoom(self.getSliderStep());
				});
		};
		
		bMapZoom.prototype.afterDraw = function(){
			var self = this,
				dir = this.getSliderDir();
			
			//зум
			this.$slider = this.wrp.find('.map_zoom_slider').slider({
				orientation: 'vertical',
				min: dir * this.map.getMaxZoom(),
				max: dir * this.map.getMinZoom(),
				slide: function(e, ui){
					self.map.toggleZoom(true);
					
					self.map.setZoom(dir * ui.value);
				},
				stop: function(e, ui){
					self.map.toggleZoom(false);
				},
				value: dir * this.map.zoomLevel
			});
			
			this.setZoom();
		};
		
		bMapZoom.prototype.addNotif = function(){ 
			this.notif.show = [Notif.ids.mapSettings];
			
			this.notif.other[Notif.ids.mapZoom] = this.setZoom;
		};
		
		
		bMapZoom.prototype.getSliderDir = function(){
			return 1;
		};
		
		bMapZoom.prototype.getSliderStep = function(){
			return 1;
		};
		
		bMapZoom.prototype.setMap = function(parent){ 
			this.map = parent.map;
		};
		
		bMapZoom.prototype.setZoom = function(){
			if( !this.$slider )
				return;
			
			this.$slider.slider('value', this.map.zoomLevel);
			
			this.$slider.find('a').html(this.map.getZoomPoints()[this.map.zoomLevel]);
		};
		
		
		
	bMapMode = function(parent){
		this.setMap(parent);
		
		bMapMode.superclass.constructor.apply(this, arguments);
	};
		
		utils.extend(bMapMode, Block);
		
		
		bMapMode.prototype.calcName = function(){
			return 'mode';
		};
		
		bMapMode.prototype.initOptions = function(){
			bMapMode.superclass.initOptions.apply(this, arguments);
			
			this.options.activatable = true;
		};
		
		bMapMode.prototype.addNotif = function(){
			this.notif.other[Notif.ids.mapTileSelect] = this.showModeSubtypePanel;
			this.notif.other[Notif.ids.mapTileHover] = function(){
				if( this.map.mode.subtype == 'road' )
					this.showModeSubtypePanel();
			};
		};
		
		bMapMode.prototype.getTmplData = function(){
			var data = {};
			
            data.need = Town.getNewTownCost();
            
			data.showBuildBtn = false;
			
			if( Unit.isAvailAcc(Unit.ids.settler) ){
				// Поселенцы для нового города
				data.colonists = wofh.town.army.own.getCount(Unit.ids.settler);
				
				data.showBuildBtn = true;
			}

			if( Unit.isAvailAcc(Unit.ids.worker) ){
				if( wofh.account.research.road > 1 ){
					data.canRoadBuild = true;
                    
					data.showBuildBtn = true;
				}
			}
			
			data.env = [];
			
			if( wofh.account.research.env ){
				for(var env in wofh.account.research.env){
					if(wofh.account.research.env[env]){
						data.env.push(new MapImp(env));
						
						data.showBuildBtn = true;
					}
				}
			}           
            
			return data;
		};
		
		bMapMode.prototype.bindEvent = function(){
			var self = this;

			//режимы карты
			this.wrp
				.on('click', '.btnMapMode', function(e){
					var tab = $(this);
					
					if( tab.hasClass('map_mode_vers') )
						return;
					
					if( !tab.hasClass('active') && tab.hasClass('-type-view') )
						e.stopPropagation();
					
					self.wrp.find('.btnMapMode').not(tab).removeClass('active');
					
					tab.addClass('active');
					
                    var modeType = tab.data('id');
                    
                    if( self.map.mode.type !== modeType )
                        self.map.setMode(modeType);
					
					self.wrp.find('.map_mode_panel').addClass('-hidden');
					
					var curPanel = self.wrp.find('.map_mode_panel.'+tab.data('id'));
					
					curPanel.removeClass('-hidden');
					
					var buttons = curPanel.find('button');
					
					if( buttons.length == 1 )
						buttons.click();
				})
				//переключение версий карты
				.on('click', '.btnMapMode.-type-view', function(){
					self.wrp.find('.map_mode_versBtn').removeClass('-hidden');
					
					if( $(this).hasClass('-state-inactive') ){
						$(this).removeClass('-state-inactive');
						
						return;
					}
					
					self.wrp.find('.map_mode_versWrp').toggleClass('-hidden');
				})
				.on('click', '.btnMapMode.-type-build', function(){
					self.wrp.find('.map_mode_main').addClass('-state-inactive');
					
					self.wrp.find('.map_mode_versBtn').addClass('-hidden');
					self.wrp.find('.map_mode_versWrp').addClass('-hidden');
				})
				.on('click', '.map_mode_vers', function(){
                    ls.setMapVersion(iMap.isSimplified() ? iMap.version.full : iMap.version.simplified);
					
                    iMap.clearChunks(function(){
                        notifMgr.runEvent(Notif.ids.mapVersion);
                    });
				})
				//улучшения
				.on('click', '.map_mode_imp_tab', function(){
					var tab = $(this);
					
					self.wrp.find('.map_mode_imp_tab').not(tab).removeClass('active');
					tab.addClass('active');
					
					self.map.setMode(false, tab.data('type'), tab.data('id'));
					
					self.wrp.find('.map_mode_imp_panel').addClass('-hidden');
					self.wrp.find('.map_mode_imp_panel.'+tab.data('type')+(tab.data('id') !== undefined ? tab.data('id') : '')).removeClass('-hidden');
					
					self.showModeSubtypePanel();
				});
		};
		
		
		bMapMode.prototype.setMap = function(parent){
			this.map = parent.map;
		};
		
		bMapMode.prototype.showModeSubtypePanel = function(){
			if( !this.map.tileSelect || !this.map.mode.subtype )
				return;
			
			var cont = this.wrp.find('.map_mode_imp_panel.'+this.map.mode.subtype+(this.map.mode.subtype=='env'?this.map.mode.subid:''));
			
			if( this.map.mode.subtype == 'road' ){
				var roadType = this.map.tileSelect.roadType;
				
				var data = this.map.prepareModePanelRoad(roadType, this.map.tileSelect.tile, this.map.tileHover.tile);
				
				cont.html(this.tmpl.modeRoad(data));
			}
			else if (this.map.tileHover){
				//расчёт времени
				var dist = Trade.calcMapDistance(wofh.town.pos, this.map.tileHover.posTMT);
				var time = utils.servRound(dist / lib.units.list[Unit.ids.worker].speed)||lib.map.minenvmovetime;

				//расчёт улучшения
				var impId = this.map.mode.subid;
				var imp = Tile.getTileImpUp(this.map.tileHover.tile, impId);
				
				if( !imp )
					imp = new MapImp(impId, 1);
					
				cont.html(this.tmpl.modeImp({imp: imp, time: time}));
			}
		};
	
	
	
	bMapFilters = function(parent){
		this.setMap(parent);
		
		bMapFilters.superclass.constructor.apply(this, arguments);
	};

		utils.extend(bMapFilters, Block);
		
		bMapFilters.prototype.calcName = function(){
			return 'filters';
		};
		
		bMapFilters.prototype.calcChildren = function(){
			this.children.aura = pMapFilterAura;
			this.children.iface = pMapFilterIFace;
			this.children.filter = pMapFilterFilter;
		};
		
		
		bMapFilters.prototype.setMap = function(parent){
			this.map = parent.map;
		};
		
		
		
pMapFilter = function(parent){
	this.setMap(parent);
	
	pMapFilter.superclass.constructor.apply(this, arguments);

	this.options.mini = true;
	this.options.hidden = true;
};

utils.extend(pMapFilter, Panel);


pMapFilter.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

pMapFilter.prototype.afterDraw = function(){
	this.toggleHidden(!this.map.settings[this.getSettingsName()]);
};


pMapFilter.prototype.setMap = function(parent){
	this.map = parent.map;
};

pMapFilter.prototype.getExtClass = function(){
	var css = pMapFilter.superclass.getExtClass.apply(this, arguments);

	css += ' map_filter';

	return css;
};

pMapFilter.prototype.toggleHidden = function(){
	pMapFilter.superclass.toggleHidden.apply(this, arguments);

	this.map.settings[this.getSettingsName()] = !this.isHidden();
	this.map.setSettings();
};


pMapFilter.prototype.getSettingsName = function(){
	return 'p_'+this.name+'_show';
};
		
		
		
pMapFilterAura = function(parent){
	pMapFilterAura.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapFilterAura, pMapFilter);


pMapFilterAura.prototype.calcName = function(){
	return 'aura';
};


pMapFilterAura.prototype.canDisplay = function(){
	return Ability.mapAura();
};

pMapFilterAura.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('change', 'input', function(){
		var val = $(this).val(),
			checked = $(this).prop('checked'),
			premiumOnly;

		if(!wofh.account.isPremium()){
			premiumOnly = true;
			if (val == 'town')
				premiumOnly = false;
			if (val == 'cnt' && (wofh.account.isHead() || wofh.account.isAdviser()))
				premiumOnly = false;
		} 
		else
			premiumOnly = false;

		if(premiumOnly){
			$(this).prop('checked', false);
			
			wndMgr.addWnd(wNoPremium);
		} else {
			self.map.activeAura[val] = checked;
			
			notifMgr.runEvent(Notif.ids.mapSettings);
		}
	});
};

pMapFilterAura.prototype.getTmplData = function(){
	this.data.activeAura = this.map.activeAura;
	
	return this.data;
};


pMapFilterAura.prototype.getExtClass = function(){
	var css = pMapFilterAura.superclass.getExtClass.apply(this, arguments);

	css += ' -type-aura';

	return css;
};


		
pMapFilterIFace = function(parent){
	pMapFilterIFace.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapFilterIFace, pMapFilter);


pMapFilterIFace.prototype.calcName = function(){
	return 'iface';
};


pMapFilterIFace.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp.on('change', 'input', function(){
		self.applyFilter($(this).val(), $(this).is(':checked'));
	});
};

pMapFilterIFace.prototype.applyFilter = function(name, active){
	this.map.settings.p_iface[name] = +active;
	this.map.setSettings();

	notifMgr.runEvent(Notif.ids.mapSettings);
};

pMapFilterIFace.prototype.getTmplData = function(){
	this.data.settings = this.map.settings.p_iface;
	
	return this.data;
};


pMapFilterIFace.prototype.getExtClass = function(){
	var css = pMapFilterIFace.superclass.getExtClass.apply(this, arguments);
	
	css += ' -type-iface';
	
	return css;
};



pMapFilterFilter = function(parent){
	pMapFilterFilter.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapFilterFilter, pMapFilter);


pMapFilterFilter.prototype.calcName = function(){
	return 'filter';
};


pMapFilterFilter.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.mapSettings];
};

pMapFilterFilter.prototype.canDisplay = function(){
	return Ability.mapFilter();
};

pMapFilterFilter.prototype.getTmplData = function(){
	this.data.settings = this.map.settings.p_filter2;
	this.data.filterDefault = LS.mapFilter2.default.split('.');

	return this.data;
};

pMapFilterFilter.prototype.bindEvent = function(){
	this.wrp.on('click', '.panel-cont-wrp', function(){
		wndMgr.addWnd(wMapFilter);
	});
};


pMapFilterFilter.prototype.getExtClass = function(){
	var css = pMapFilterFilter.superclass.getExtClass.apply(this, arguments);

	css += ' -type-filter';

	return css;
};