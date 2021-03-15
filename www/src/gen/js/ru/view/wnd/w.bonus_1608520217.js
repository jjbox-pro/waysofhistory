wBonus = function(){
	this.name = 'bonus';
	
	wBonus.superclass.constructor.apply(this, arguments);
};

utils.extend(wBonus, Wnd);

WndMgr.regWnd('bonus', wBonus);


wBonus.warnDelay = 3 * 24 * 3600;//если до окончания бонуса осталось времени меньше указанного, то включаем сигнализацию

wBonus.prepareData = function(){
	if( LuckBonus.subscription.isOn() ){
		wndMgr.addWnd(wBonusSpecial);
		
		return false;
	}
	
	return {};
};


wBonus.prototype.calcChildren = function(){
	this.children.info = bBonus_info;
};

wBonus.prototype.bindEvent = function(){
	snip.input1Handler(this.wrp);
};

wBonus.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

bBonus_info = function(parent){
	bBonus_info.superclass.constructor.apply(this, arguments);
};
	
utils.extend(bBonus_info, Block);


bBonus_info.prototype.calcName = function(){
	return 'info';
};

bBonus_info.prototype.getData = function(){
	var towns = [];
	for(var town in wofh.towns){
		town = wofh.towns[town];

		set.town.updateBonus(town);

		towns.push(town);
	}

	towns.sort(function(a, b){
		return a.id < b.id ? -1 : 1;
	});

	this.data.towns = towns;
    
    this.data.newSpecialists = ls.getNewSpecialists(false);
    
	this.dataReceived();
};

bBonus_info.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accLuck, Notif.ids.accTownBonus, Notif.ids.accBonus, Notif.ids.accSpecialists];
};

bBonus_info.prototype.calcChildren = function(){
	this.children.specialists = bBonus_info_specialists;
};

bBonus_info.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('mouseenter', '.bonus-town-specialist', function(){
			self.cont.find('.js-accSpecialists[data-id="' + $(this).data('id') + '"]').addClass('-accSpec-backlight');
		})
		.on('mouseleave', '.bonus-town-specialist', function(){
			self.cont.find('.js-accSpecialists').removeClass('-accSpec-backlight');
		})
		.on('click', this.getSpecialistEventCls(), function() {
			if( self.data.linkClick ){
				delete self.data.linkClick;

				return;
			}

			var params = {};

			if( $(this).data('id') !== undefined )
				params.id = $(this).data('id');
			if( $(this).data('town') !== undefined )
				params.town = $(this).data('town');

			hashMgr.showWnd('setSpec', utils.objToUrl(params));

			return false;
		})
		.on('click', '.bonus-towns-town .link', function(){
			self.data.linkClick = true;
		})
		//переименовать
		.on('submit', '.bonus-rename', function(e){
			e.preventDefault();
			
			if( self.data.canRename ){
				var $form = $(this);
				
				wndMgr.addConfirm().onAccept = function(){
					var params = utils.urlToObj($form.serialize());
					
					reqMgr.accountRename(params.name, params.password, function(){appl.reload();});
				};
			}
		})
		//добавить бонус
		.on('click', '.bonus-activate, .bonus-town-takeNow', function(e){
			self.activateBonus($(this), e);
		})
		//попап
		.on('mouseenter', '.bonus-town-cell', function(e) { 
			self.togglePopup($(this), true, {event: e});
		})
		.on('mouseleave', '.bonus-town-cell', function(e) {
			self.togglePopup($(this), false, {event: e});
		})
		.on('mouseenter', '.bonus-town-popup', function() { 
			self.togglePopup($(this).closest('.bonus-town-cell, .bonus-towns-town'), false);
		})
		.on('mouseenter', '.bonus-town-takeNow-wrp', function() { 
			self.togglePopup($(this).closest('.bonus-town-cell'), true, {type: $(this).data('type')});
		})
		.on('mouseenter', '.bonus-town-add', function() { 
			self.togglePopup($(this).closest('.bonus-town-cell'), true, {type: $(this).data('type'), action: 'add'});
		})
		.on('mouseenter', '.bonus-town-up', function() { 
			self.togglePopup($(this).closest('.bonus-town-cell'), true, {type: $(this).data('type'), action: 'up'});
		})
		.on('mouseleave', '.bonus-town-takeNow-wrp, .bonus-town-add, .bonus-town-up', function() { 
			self.togglePopup($(this).closest('.bonus-town-cell'), true);
		})
		// Проверка на минимальное введенное количество символов
		.on('input', '.bonus-rename input[name="name"]', function() {
			self.setCanRename(Account.checkNameLimits($(this).val()));
		})
		//премиум
		.on('click', '.bonus-other-premiumBtn', function(){
			self.cont.find('.bonus-other-premium').toggleClass('-hidden');
		})
		//передача удачи
		.on('click', '.bonus-take', function(){
			var wnd = wndMgr.addWnd(wBonusTake);
		})
		//подселение
		.on('click', '.bonus-drop', function(){
			wndMgr.addWnd(wBonusDrop);
		})
		//рефералы
		.on('click', '.bonus-referals', function(){
			wndMgr.addWnd(wBonusReferals);
		});
};

bBonus_info.prototype.afterDraw = function(){
	snip.spinboxHandler(this.wrp);
};


bBonus_info.prototype.getSpecialistEventCls = function(){
	return '.bonus-towns-town, .bonus-town-specialist';
};

bBonus_info.prototype.checkBonusCost = function(cost){
	var has = utils.toInt(wofh.account.getCoinsAll());
	
	if (cost > has) {
		wndMgr.addAlert(tmplMgr.bonus.alert.noCoins({cost: cost, has: has}));
		return false;
	} else {
		return true;
	}
};

bBonus_info.prototype.activateBonus = function($el){
	var type = $el.data('type'),
		town = $el.data('town'),
		act = $el.data('act');
				
	if( act == 'now' ){
		var town = wofh.towns[town],
			bonus = town.getLuckBonus(type);

		wBonusTakeNow.show(bonus);	
	}
	else{
		var cost = Math.ceil(+$el.data('cost'));

		if( !this.checkBonusCost(cost) )
			return;

		wndMgr.addConfirm().onAccept = function(){
			reqMgr.addBonus(type, act, town);
		};
	}	
};

bBonus_info.prototype.togglePopup = function($cell, toggle, opt){
	opt = opt||{};
	
	$cell.toggleClass('-active', toggle);
	
	if( !toggle )
		return;

	var townId = $cell.data('town'),
		town = wofh.towns[townId],
		type = opt.type === undefined ? $cell.data('type') : opt.type;
		bonus = town.getLuckBonus(type);
	
	// Таймер мгновенного бонуса
	if( !bonus.canUp() && bonus.isMomental() )
		bonus.setLevel(0);
	
	$cell.find('.bonus-town-popup').html(tmplMgr.bonus.town.popup({bonus: bonus, action: opt.action}));
};

bBonus_info.prototype.setCanRename = function(state){	
	if( this.data.canRename != state ){

		this.data.canRename = state;
		
		this.wrp.find('.js-bonus-rButton').prop('disabled', !state).toggleClass('-disabled', !state);
	}
};



bBonus_info_specialists = function(parent){
	bBonus_info_specialists.superclass.constructor.apply(this, arguments);
};

utils.extend(bBonus_info_specialists, Block);


bBonus_info_specialists.prototype.calcName = function(){
	return 'specialists';
};

bBonus_info_specialists.prototype.calcTmplFolder = function(){
	return tmplMgr.bonus.specialists;
};

bBonus_info_specialists.prototype.getData = function(){
	this.data.newSpecialists = ls.getNewSpecialists(false);
    
    if( this.data.newSpecialists ){
		ls.setNewSpecialists(false);
		
		notifMgr.runEvent(Notif.ids.accNewSpecialists);
	}
    
    this.data.newSpecialists = this.data.newSpecialists||{};
    
    this.dataReceived();
};

bBonus_info_specialists.prototype.canDisplay = function(){
    return wofh.account.getSpecialists().getLength();
};





wBonusSpecial = function(){
	wBonusSpecial.superclass.constructor.apply(this, arguments);
	
	if( !LuckBonus.subscription.isAccepted() ){
		this.options.showBack = true;
		this.options.canClose = false;
	}
};

utils.extend(wBonusSpecial, wBonus);


wBonusSpecial.selectionType = {bonus: 'bonus', settle: 'settle'};

wBonusSpecial.prepareData = function(){
	return {};
};


wBonusSpecial.prototype.calcChildren = function(){
	this.children.info = bBonusSpecial_info;
};

wBonusSpecial.prototype.bindEvent = function(){
	wBonusSpecial.superclass.bindEvent.apply(this, arguments);
	
	if( !LuckBonus.subscription.isAccepted() )
		this.wrp.off('click', '.wnd-back-wrp');
};



bBonusSpecial_info = function(parent){
	this.name = 'info';
	
	bBonusSpecial_info.superclass.constructor.apply(this, arguments);
};
	
utils.extend(bBonusSpecial_info, bBonus_info);


bBonusSpecial_info.prototype.getData = function(){
	this.data.bonuses = LuckBonus.getDefBonuses(undefined, true);
	
	this.data.subscription = wofh.account.getLuckBonus(LuckBonus.ids.subscription);
	
	this.data.bonusSelect = this.data.settleSelect = undefined;
	
	if( this.data.subscription.isActive() )
		this.data.bonusSelect = true;
	
	this.data.settleSelect === wofh.account.bonus.teamdrop !== undefined;
	
	bBonusSpecial_info.superclass.getData.apply(this, arguments);
};

bBonusSpecial_info.prototype.bindEvent = function(){
	bBonusSpecial_info.superclass.bindEvent.apply(this, arguments);
	
    var self = this;
    
	this.wrp.off('mouseleave, mouseenter', '.bonus-town-cell');
	
	this.wrp
		.on('click', '.bonusSpecial-selection-refuse', function(){
			var type = $(this).parents('.bonusSpecial-selection-block').data('type');
			
			self.setSelection(type, false);
			
			$(this).addClass('-active');
			
			self.checkCanConfirm();
		})
		.on('click', '.bonusSpecial-selection-accept', function(){
			var type = $(this).parents('.bonusSpecial-selection-block').data('type');
			
			if( type == wBonusSpecial.selectionType.bonus ){
				var canBuy = wofh.account.getCoinsAll() >= lib.luckbonus.subscription.cost || debug.isAdmin(),
					prolong = self.data.bonusSelect;
					
					wndMgr.addModal(tmplMgr.bonusSpecial.wnd.confirm({bonuses: self.data.bonuses, prolong: prolong}), {
						callbacks: {
							bindEvent: function(){
								var wnd = this;
								
								this.wrp
									.on('click', '.js-setEnable', function(){
										if( canBuy ){
											reqMgr.addAccBonus(LuckBonus.ids.subscription, 'add', function(){
												if( !prolong )
													self.setSelectionAccepted(type);
												
												wnd.close();
											});
										}
										else
											wndMgr.addAlert(tmplMgr.snipet.noCoins());
									});
							}
						}
					});
			}
			else{
				var wnd = wndMgr.addWnd(wBonusDrop);
				
                utils.overrideFunc(wnd.children.view, 'setBonusDrop', function __func__(){
                    __func__.origin.call(this, function(){
						self.setSelectionAccepted(type);
						
						wnd.close();
					});
                });
			}
		})
		.on('click', '.bonusSpecial-confirm', function(){
			if( !self.data.canConfirm ) return;
			
			for(var type in wBonusSpecial.selectionType){
				if( !self.data[wBonusSpecial.selectionType[type] + 'Select'] ){
					wndMgr.addConfirm(tmplMgr.bonusSpecial.wnd.confirm.refuse(self.data)).onAccept = function(){
						self.acceptBonuses();
					};
					
					return false;
				}
			}
			
			self.acceptBonuses();
		});
		
	if( !LuckBonus.subscription.isAccepted() )
		this.showFooter();
};


bBonusSpecial_info.prototype.showFooter = function(){
	this.cont.find('.bonusSpecial-footer-wrp').html(tmplMgr.bonusSpecial.footer());
	
	this.setCanConfirm(!!(this.data.bonusSelect || this.data.settleSelect));
};

bBonusSpecial_info.prototype.setSelection = function(type, val){
	this.data[type + 'Select'] = val;
};

bBonusSpecial_info.prototype.setSelectionAccepted = function(type){
	this.setSelection(type, true);
	
	this.cont.find('.bonusSpecial-selection-block[data-type=' + type + ']').html(tmplMgr.bonusSpecial.selection.accepted({type:type}));
	
	if( type == wBonusSpecial.selectionType.settle )
		this.cont.find('.bonusSpecial-settle-block').html(tmplMgr.bonusSpecial.settle.text({teamdrop:true}));
	
	this.checkCanConfirm();
};

bBonusSpecial_info.prototype.checkCanConfirm = function(){
	this.setCanConfirm(!(this.data.bonusSelect === undefined || this.data.settleSelect === undefined));
};

bBonusSpecial_info.prototype.setCanConfirm = function(state){
	this.data.canConfirm = state;

	this.cont.find('.bonusSpecial-confirm').toggleClass('-type-disabled', !state);
};

bBonusSpecial_info.prototype.acceptBonuses = function(){
	var self = this;
	
	LuckBonus.subscription.setAccepted(function(){
		self.close();
	});
};





wBonusTowns = function(id, data){
	wBonusTowns.superclass.constructor.apply(this, arguments);
};

utils.extend(wBonusTowns, Wnd);

WndMgr.regWnd('bonusTowns', wBonusTowns);


wBonusTowns.prepareData = function(bonusPack){
	if( LuckBonus.subscription.isOn() )
		return false;
	
	return {bonusPack:bonusPack};
};


wBonusTowns.prototype.calcName = function(){
	return 'bonusTowns';
};

wBonusTowns.prototype.getTmplData = function(){
	this.data.bonuses = LuckBonus.getUsableBonuses(this.data.bonusPack);
	
	return this.data;
};

wBonusTowns.prototype.bindEvent = function(){
	this.wrp.on('click', '.js-bonusTown', function() {
		var town = wofh.towns[$(this).data('town')],
			bonus = town.getLuckBonus($(this).data('bonus'));
		
		wBonusTakeNow.show(bonus);
	});
};





wBonusTake = function(){
	this.name = 'bonusTake';
	
	wBonusTake.superclass.constructor.apply(this, arguments);
	
    this.options.showBack = true;
    this.options.setHash = false;
};

utils.extend(wBonusTake, Wnd);

WndMgr.regWnd('bonusTake', wBonusTake);


wBonusTake.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('input', 'input[name="name"]', function(){
			self.checkCanTake();
		})
		.on('submit', '.bonus-take-form', function(){
			if( !self.data.canTake )
				return false;
			
			var data = utils.urlToObj($(this).serialize());
			
			reqMgr.coinsTransfer(data.name, data.count, function(){
				wndMgr.addAlert('На <b>'+wofh.account.email+'</b> было отправлено письмо с инструкцией по переводу.').onClose = function(){
					self.close();
				};
			});
			
			return false;
		});
	
	snip.input1Handler(this.wrp);
	
	snip.iSliderHandler({
		$slider: this.wrp.find('.bonus-take-slider'), 
		min: 0, 
		maxLimit: utils.toInt(wofh.account.getCoinsBought()), 
		shortStep: 1, 
		name: 'count', 
		labelIcon: snip.resBig(Resource.ids.luck), 
		setValue: function(iSlider, value){
			snip.iSliderHandler.setValue(iSlider, value);
			
			self.checkCanTake();
		},
		change: function(){
			self.checkCanTake();
		}
	});
};

wBonusTake.prototype.afterDraw = function(){
	this.checkCanTake();
};

wBonusTake.prototype.checkCanTake = function(){
	var name = this.wrp.find('input[name="name"]').val(),
		count = +this.wrp.find('input[name="count"]').val(),
		state = Account.checkNameLimits(name) && count && name.toLowerCase() != wofh.account.name.toLowerCase();
	
	if( this.data.canTake != state ){
		this.data.canTake = state;
		
		this.wrp.find('.bonus-take-button').toggleClass('-disabled', !state);
	}
};





wBonusDrop = function(){
	this.name = 'bonusDrop';
	
	wBonusDrop.superclass.constructor.apply(this, arguments);
	
    this.options.showBack = true;
    this.options.setHash = false;
};

utils.extend(wBonusDrop, Wnd);

WndMgr.regWnd('bonusDrop', wBonusDrop);


wBonusDrop.prototype.calcChildren = function(){
	this.children.view = bBonusDrop_view;
};



bBonusDrop_view = function(){
	this.name = 'view';
	
	bBonusDrop_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bBonusDrop_view, Block);


bBonusDrop_view.prototype.getData = function(){
    var self = this;
	
	this.data.pop = 1;
	this.data.rad = 0;
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		100,
		function(){
			self.getReqData(function(){
				if( wofh.account.bonus.teamdrop ){
					reqMgr.dropList(function(resp, reqId){
						self.tryProcessResp(
							resp, reqId,
							function(){
								contentLoader.stop(loaderId);
								
								var hasNoUsed = false,
									settledCount = 0,
									dropCost = 0,
									list = resp.list||[];
								
								for(var offer in list){
									offer = list[offer];
									
									if( offer.acc.id )
										settledCount++;
									else if( !hasNoUsed )
										hasNoUsed = true; 
								}
								
								if( hasNoUsed )
									dropCost = this.getDropBonusCost(list.length) - this.getDropBonusCost(settledCount);
								
								this.data.teamdrop = wofh.account.bonus.teamdrop;
								this.data.hasNoUsed = hasNoUsed;
								this.data.list = list;
								this.data.dropCost = dropCost;
								this.data.settledCount = settledCount;
								
								this.dataReceived();
							}
						);
					});
				}
				else{
					reqMgr.getBonusDropPlaces(function(resp, reqId){
						self.tryProcessResp(
							resp, reqId,
							function(){
								contentLoader.stop(loaderId);
								
								this.data.places = resp;
								
								this.dataReceived();
							}
						);
					});
				}
			});
		}
	);
};

bBonusDrop_view.prototype.bindEvent = function(){
    var self = this;
    
    this.wrp
		.on('submit', 'form', function(){
			self.setBonusDrop(function(){
				self.parent.close();
			});
			
			return false;
		})
		.on('click', '.js-dropcancel', function(){
			wndMgr.addConfirm('', {rubber: true}).onAccept = function(){
				reqMgr.dropCancel(function(){
					setTimeout(appl.reload, 0); // FF
				});
			};
			
			return false;
		});

    //инициализация слайдеров
    this.data.popSlider = this.wrp.find("#pop_slider .sld");
    snip.sliderHandler(this.data.popSlider, {
        min: this.data.pop,
        max: lib.luckbonus.teamdrop.maxcount,
        value: this.data.pop,
        slide: function(event, ui){
            self.updPop(ui.value);
        }
    });

    this.radSlider = this.wrp.find("#rad_slider .sld");
    snip.sliderHandler(this.radSlider, {
        step: 0.2,
        slide: function(event, ui){
            self.updRad(ui.value);
        }
    });

    //умолчальные значения
    this.updPop(this.data.pop);
};

	
bBonusDrop_view.prototype.updPop = function(value){
    this.data.pop = value;

    var libBonus = lib.luckbonus.teamdrop;
    //выводим значение
    this.wrp.find("#bonusdrop_pop").html(this.data.pop);
	
    //сумма
    var sum = this.getDropBonusCost(this.data.pop);
	
    this.wrp.find("#bonusdrop_sum").html(sum);
    //радиусы
    var rMin = libBonus.distance.min + (this.data.pop - 1) * libBonus.distance.mink,
		rMax = libBonus.distance.max + (this.data.pop - 1) * libBonus.distance.maxk;
	
    this.data.rad = Math.max(Math.min(this.data.rad, rMax), rMin);
    this.radSlider.slider('option', {min: rMin, max: rMax, value: this.data.rad});
    this.updRad(this.data.rad);

    this.showProgress(this.data.popSlider, value);
};
			
bBonusDrop_view.prototype.updRad = function(value){
    this.data.rad = value;

    var area = Math.PI * Math.pow(this.data.rad, 2);
    var density = area / (this.data.pop + 1);
	
    this.wrp.find("#bonusdrop_radius").html(this.data.rad.toFixed(1));
    this.wrp.find("#bonusdrop_area").html(utils.toInt(area));
    this.wrp.find("#bonusdrop_density").html(utils.toInt(density));

    this.showProgress(this.radSlider, value);
};
			
bBonusDrop_view.prototype.showProgress = function(slider, value){
    var progTag = slider.find('.ui-slider-progress');

    var valMax = slider.slider('option', 'max');
    var valMin = slider.slider('option', 'min');
    var dist = valMax - valMin;

    //длина фона
    var width = slider.width() / dist * (value-valMin)
    progTag.css('width', width +"px");

    //цвет фона
    var rred = ~~((valMax - value) / valMax * 255);
    var ggreen = ~~(value / valMax * 255);

    progTag.css("background-color", "rgb(" + rred + ", " + ggreen + ", 0)");
};
	
bBonusDrop_view.prototype.getDropBonusCost = function(pop){
    var libBonus = lib.luckbonus.teamdrop;
	
	return (2 * libBonus.cost + libBonus.costup * (pop - 1)) / 2 * pop;
};

bBonusDrop_view.prototype.setBonusDrop = function(callback){
	var self = this;
	
    reqMgr.setBonusDrop(self.data.pop, self.data.rad, callback);
};





wBonusReferals = function(){
	this.name = 'bonusReferals';
	
	wBonusReferals.superclass.constructor.apply(this, arguments);
	
    this.options.showBack = true;
    this.options.setHash = false;
};

utils.extend(wBonusReferals, Wnd);

WndMgr.regWnd('bonusReferals', wBonusReferals);


wBonusReferals.prototype.calcChildren = function(){
	this.children.view = bBonusReferals_view;
};



bBonusReferals_view = function(){
	this.name = 'view';
	
	bBonusDrop_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bBonusReferals_view, Block);


bBonusReferals_view.prototype.getData = function(){
	this.data.worlds = [];
	
	this.data.referCount = 0;
	this.data.questStr = '';
	this.data.questUpd = false;	
	
	this.loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		this.getWorlds.bind(this)
	);
	
};

bBonusReferals_view.prototype.afterDraw = function(){
	this.initScroll();
};


bBonusReferals_view.prototype.getWorlds = function(){
    var self = this;

    reqMgr.getWorlds(function(resp){
        for(var world in resp.worlds){
			world = resp.worlds[world];
			
            if(world.working && utils.inArray(world.langs.split(','), lib.main.language)){
                self.data.referCount++;
				
                self.getRefers(world);
            }
        }
    });
};
	
bBonusReferals_view.prototype.getRefers = function(world){
    var self = this;
    
    reqMgr.getReferals(world.id, wofh.account.globalid, wofh.account.referalsinfokey, function(resp){
        resp = resp || {};
		
        if( resp.questdata !== undefined )
            self.data.questStr += resp.questdata;

        if( resp.refers ){
			resp.world = world;
			
			self.data.worlds.push(resp);
			
			self.data.questUpd = true;
        }
		
        self.data.referCount--;
		
        if( !(self.data.referCount) ){
            if( self.data.questUpd )
                reqMgr.setReferalQuest(self.data.questStr);
			
			contentLoader.stop(self.loaderId);
			
			self.dataReceived();
        }
    });
};





wBonusTakeNow = function(id, data){
	wBonusTakeNow.superclass.constructor.apply(this, [tmplMgr.bonus.add2.main, {data: data}]);
};

utils.extend(wBonusTakeNow, ModalWnd);


wBonusTakeNow.prepareData = function(bonus){
	return {bonus: bonus};
};

wBonusTakeNow.show = function(bonus){
    wndMgr.addWnd(wBonusTakeNow, bonus);
};

wBonusTakeNow.canShow = function(bonus){
	if( LuckBonus.subscription.isOn() ) return false;
	
    if( bonus.id == LuckBonus.ids.science || 
		bonus.id == LuckBonus.ids.sciencePack || 
		bonus.id == LuckBonus.ids.production || 
		bonus.id == LuckBonus.ids.productionPack
	){
        if (wofh.town.pop.incReal < 0) return false;
    }
    
	if (bonus.canUpNow() && bonus.getUp().hasEffect()) return true;
    
	bonus = bonus.getMomentalBonus();
    
	if (bonus && bonus.canUpNow() && bonus.getUp().hasEffect()) return true;
    
	return false;
};


wBonusTakeNow.prototype.calcName = function(){
	return 'bonusTakeNow';
};

wBonusTakeNow.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.bonus-takeNow-confirm', function(){
			var checkData,
				town = self.data.bonus.town||wofh.town,
				bonus = town.getLuckBonus($(this).data('type'));

			if( bonus.id == LuckBonus.ids.productionPack )
				checkData = bonus.getUp().getTypedEffect().toString();
			
			if(bonus.id == LuckBonus.ids.sciencePack)
				checkData = bonus.getUp().getTypedEffect().count;
			
			reqMgr.addBonus(bonus.id, 'up', town.id, function(){}, checkData);
			
			self.close();
		});
};