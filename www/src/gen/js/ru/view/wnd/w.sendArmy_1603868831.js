wSendArmy = function(id, data){
	wSendArmy.superclass.constructor.apply(this, arguments);
};

utils.extend(wSendArmy, Wnd);

WndMgr.regWnd('sendArmy', wSendArmy);


wSendArmy.act = {
	atk: 0, // атака
	def: 1, // защита
};

wSendArmy.timeFormat = {simpleTime: 'hh:mm:ss',	dateTime: 'hh:mm:ss dd.mm'};

wSendArmy.alerts = {
	WEcantLoadTown: 'Неизвестные координаты',
	WEnoArmy: 'Войска не выбраны',
	WEbadArmy: 'Невозможно отправить такую армию',
	badPort: 'Укажите порт посадки',
	WEnoAccess: 'Город защищен от нападений до {{=timeMgr.fMoment(it.data)}}',
	WEbadPath: 'Невозможно добраться до цели',
	WElimit: 'Достигнут предел атак и подкреплений этого города',
	WEtownUnderBattle: 'Нельзя отправлять войска из города, где идёт бой',
	WEbadFleet: 'В городе посадки недостаточно транспортных кораблей',
	noData: 'Нет данных об этой военной операции. Возможно она уже закончилась.', // Нет данных для военной оперции (ВО закончилась)
};

wSendArmy.prepareData = function(id){
	var params = id instanceof Object ? id : utils.urlToObj(id),
		data = {};
	
	if( params.groupid ){
		data.сommanding = {};
		data.сommanding.groupid = params.groupid;
		data.сommanding.key = params.key;
	}
	else if( params.target )
		data.target = {id: params.target};
    
    return data;
};

wSendArmy.isUnitDisabled = function(unit, tmplData){
    if( tmplData.filter && !unit.isArmyTypeOf(tmplData.filter) )
        return true;

    if( tmplData.act == wSendArmy.act.atk && unit.hasAbility(Unit.ability.no_attack) && !unit.isSpy() )
        return true;

    if( !tmplData.filter && tmplData.water && (unit.isFleet() || unit.isAir()) )
        return true;

    if( 
        (!tmplData.targetOwnTown || !tmplData.commander || tmplData.act == wSendArmy.act.atk) // Можем отправлять войска по ВО защиты из города в котором идёт эта ВО
        &&
        !tmplData.water && tmplData.targetDistance && !tmplData.targetDistance.getLand() && unit.isLand() && !unit.isSpy()
    )
        return true;
    
	return false;
};


wSendArmy.prototype.calcName = function(){
	return 'sendArmy';
};

wSendArmy.prototype.getData = function(){
	this.data.town = wofh.town;
	
	this.dataReceived();
};

wSendArmy.prototype.calcChildren = function(){
	this.children.view = bSendArmy_view;
};


wSendArmy.prototype.setId = function(id){
	if( id instanceof Object )
		id = utils.objToUrl(id);
	
	arguments[0] = id;
	
	wSendArmy.superclass.setId.apply(this, arguments);
};

wSendArmy.prototype.initWndOptions = function(){
	wSendArmy.superclass.initWndOptions.apply(this, arguments);
	
	this.options.clipboard = {short: true};
};


bSendArmy_view = function(){
	this.name = 'view';
	
	bSendArmy_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(bSendArmy_view, Block);


bSendArmy_view.prototype.prepareReq = function(){
	if( this.parent.data.сommanding || this.parent.data.target )
		return bSendArmy_view.superclass.prepareReq.apply(this, arguments);
	
	return true;
};

bSendArmy_view.prototype.getData = function(){
	var self = this;
	
	delete this.submitDisabled;
    delete this.lastReq;
	
	this.cleanState();
	
	this.data.town = this.parent.data.town;
	this.data.activeTabName = this.parent.data.activeTabName||'oneattack';
	this.data.сommanding = this.parent.data.сommanding;
	this.data.target = this.parent.data.target;
    this.data.dists = [0];
	
	this.data.tmplData = {armySel: new Army(), town: this.data.town};
    
	this.data.water = false;
	
	this.countReq = 1;
	
	this.dataLoaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			if( self.data.сommanding )
				self.getCommandingData();
		    else if( self.data.target )
				self.getTargetData();
			else{
				self.data.changableTarget = true;
				
				self.data.tmplData.towns = wofh.towns;
			}
			
			self.dataReceived();
		} 
	);
};

bSendArmy_view.prototype.getTmplData = function(){
	return this.data.tmplData;
};

bSendArmy_view.prototype.addNotif = function(){
	this.notif.other[Notif.ids.eventSendArmy] = this.notifEventSendArmy;
	this.notif.other[Notif.ids.townOwnGarrison] = this.notifTownOwnGarrison;
};

    bSendArmy_view.prototype.notifEventSendArmy = function(){
        var wnd = wndMgr.getFirstWndByType(wArmy);

        if( wnd )
            wnd.activate();
        else
            wndMgr.addWnd(wArmy);

        if( ls.getSendArmyAutoClose(true) )
            this.close();
    };

    bSendArmy_view.prototype.notifTownOwnGarrison = function(data){
        if( this.data.town.id == data.townId && !this.massAttack ){
            // armyWasSend устанавливается при отправке армии
            if( this.armyWasSend ){
                this.filterArmy();
                
                if( data.checkSelCount )
                    this.checkSelCount(); // Проверяем, что навводил пользователь
                else{
                    this.data.tmplData.armySel = new Army();
                    
                    this.setFilters({filter: Army.types.none});
                }

                this.showArmy();

                delete this.armyWasSend;
            }
            else if( !this.cont.find('.sendArmy-updArmy').length )
                this.$army.append(tmplMgr.sendArmy.updArmy());
        }
    };

bSendArmy_view.prototype.dataReceived = function(){
	if( !(--this.countReq) )
		bSendArmy_view.superclass.dataReceived.apply(this, arguments);
};

bSendArmy_view.prototype.bindEvent = function(){
    var self = this;
	
    this.wrp
		.on('click', '.js-tabLink', function() {
			self.data.activeTabName = $(this).data('tab');
			
			self.showTab();
			
			return false;
		})
		// Порты
		.on('click','#to_sheeps', function(){
			self.toggleWaterPanel(!self.data.water);
            
            self.setCurArmy();
		})
		// Выбор цели
		.on('change', 'select[name=target]', function(){
            self.changeTarget($(this).val());
		})
		.on('change', '.sendArmy-ports', function(){
            self.calcDist();
        })
		// Отправка армии
		.on('submit', 'form', function(e){
            e.preventDefault();
            
			if ( 
					(!self.massAttack && self.submitDisabled) || 
					(self.massAttack && self.cont.find('.js-sendarmy-send-all').hasClass('-disabled')) ||
					self.data.act === undefined
				){
                
				if( !self.massAttack && self.checkSelfTarget() && !self.submitDisabled )
					wndMgr.addAlert('Войска не могут атаковать сами себя');
                
                return;
			}
            
			// Искуственно запускаем событие, что-бы изменения таймера точно вступили в силу до отправки запроса
			self.cont.find('.arrive-mask').trigger('focusout'); 
            
			self.askSendArmy();
		})
		.on('click', '.js-sendarmy-act', function(){
			self.selectAct(+$(this).attr('data-act'));
		})
		// Выбиралка всего
		.on('input', '.sendArmy-units input', function(){
			var inp = $(this),
                unitId = inp.data('id'),
                unit = self.data.tmplData.army.getElem(unitId),
                unitCount = Math.min(Math.max(0, utils.toInt(inp.val())), unit.getCount());
			
			self.setUnitCount(unitId, unitCount);
		})
		.on('click', '.js-get-all-units', function(){
			if( !$(this).parent().hasClass('-disabled') )
				self.setUnitCount($(this).data('id'));
		})
		.on('click', '.sendarmy-select.-type-groupSelect', function(){
			self.selectFilters($(this).data('filter'));
		})
        .on('change', '.sendarmy-select.-type-addSelect, .sendarmy-select.-type-subSelect', function(){
            var data = $(this).data();
            
			self.selectFilters(data.filter, data.subfilter, data.addfilter);
		})
		// Время прибытия
		.on('focus', '.arrive-timer', function(event){
			self.showArriveTimer(false);
			
			setTimeout(function(){
				self.cont.find('.arrive-mask').val(self.cont.find('.arrive-timer').val()).focus();
			}, 0);
			
			event.stopImmediatePropagation();
		})
		.on('input', '.arrive-mask', function(eventData){
			if( eventData.keyCode != 9 ){
				self.arriveChanged = true;
				
				if( self.massAttack ){
					//self.cont.find('.js-sendarmy-send-all').addClass('-disabled');
				}
			}
			else
				return false;
		})
		.on('focusout', '.arrive-mask', function(){
			if( self.massAttack ){
				if( self.cont.find('.js-sendarmy-send-all').hasClass('-disabled') )
					return false;
			}
			else
				self.showArriveTimer(true);

			if( $(this).val() == '' || !self.arriveChanged )
				self.runTimer();
			else{
				self.cont.find('.arrive-timer').addClass('-timer-stopped');
				
				var dateText = '';
				
				if( !self.massAttack ){
					var inputArr = self.cont.find('.arrive-mask').val().split(':');

					if (inputArr.length == 3) {
						self.periodArriveInput = inputArr[0] * 3600 + inputArr[1] * 60  + inputArr[2] * 1;//смещение прибытия, заданное игроком
						
						self.periodArriveInput -= lib.main.timeOffset;
						
						dateText = self.calcArriveDate();

						self.showArmy();

						if(!dateText) dateText = '';
					} else {
						self.periodArriveInput = -1;
					}
				}

				self.cont.find('.arrive-timer').val(self.cont.find('.arrive-mask').val()+dateText);
			}

		})
		// Массовая атака
		.on('click', '.mass_attack a', function(){
			var el = $(this).parent();
			self.selectTab(el.data('id') == 1);
		})
		//смена города
		.on('change', '.sendArmy-changeTown', function() {
            self.changeTown($(this).val());
		})
		// Обновляем данные
		.on('click', '.js-updArmy', function() {
			self.armyWasSend = true;
            
			notifMgr.runEvent(Notif.ids.townOwnGarrison, {townId: self.data.town.id, checkSelCount: true});
		})
		.on('change', '.js-autoClose', function() {
			ls.setSendArmyAutoClose($(this).prop('checked'));
		})
		.on('change', 'input[name=newbattlesystem]', function() {
			ls.setNewBattleSys($(this).prop('checked'));
		})
		.on('change', '.js-sendarmy-shipping', function() {
			self.setShipping($(this).val());
			
			self.setCurArmy();
		});
		
		snip.input1Handler(this.wrp);
};
    
    bSendArmy_view.prototype.selectFilters = function(filter, subfilterType, addfilterType){
        filter = utils.toInt(filter);
        
        var subfilter = [], addfilter = [];
        
        // Фильтрация по подтипу юнита (для воды: мелководный, глубоководный) 
        if( filter & Army.types.water ){
            this.$army.find('.sendarmy-select.-type-subSelect[data-filter=' + filter + ']').each(function(){
                if( $(this).find('input').prop('checked') )
                    subfilter.push($(this).data('subfilter'));
            });
        }
        else
            subfilter = false;
        
        this.$army.find('.sendarmy-select.-type-addSelect').each(function(){
            if( $(this).find('input').prop('checked') )
                addfilter.push($(this).data('addfilter'));
        });
        
        var unitCount,
            armySelWas = this.data.tmplData.armySel,
            armySel = this.data.tmplData.armySel = new Army();
    
        this.data.tmplData.army.each(function(unit){
            unitCount = 0;
            
            // Фильтрация по типу юнита
            if(
                (
                    filter & Army.types.water && 
                    (
                        this.checkFilterСondition(Army.types.highwater, subfilter, unit)
                        || 
                        this.checkFilterСondition(Army.types.lowwater, subfilter, unit)
                    )
                )
                ||
                (filter & Army.types.air && unit.isAir())
                ||
                (filter & Army.types.land && unit.isLand())
                ||
                (filter == Army.types.none && (!this.data.water || unit.isLand()) && this.checkFilterСondition(Army.types.peace, addfilter, unit))
                ||
                utils.inArray(addfilter, 'inTime')
            ){
                // Дополнительная фильтрация по миротворцам и времени прибытия
                if(
                    (utils.inArray(addfilter, Army.types.peace) || !unit.hasAbility(Unit.ability.no_attack))
                    &&
                    (!utils.inArray(addfilter, 'inTime') || this.getDistForArmyType(false)/unit.getSpeed() < this.data.commander.time - timeMgr.getNow())
                ){
                    unitCount = unit.getCount();
                    // Если изменилось значение подфильтра или допфильтра, оставляем ранее установленное количество для юнитов не подходящих под дополенительную фильтрацию
                    if( subfilterType || addfilterType ){
                        if( !this.checkFilterСondition(subfilterType||addfilterType, subfilterType ? subfilter : addfilter, unit) )
                            unitCount = armySelWas.getElem(unit.getId()).getCount();
                    }
                }
            }
            else{
                if( filter == Army.types.none && addfilterType ){
                    if( !this.checkFilterСondition(addfilterType, [addfilterType], unit) )
                        unitCount = armySelWas.getElem(unit.getId()).getCount();
                }
            }
            
            if( unitCount > 0 )
                armySel.setCount(unit.getId(), unitCount);
        }, this);
        
        this.setFilters({filter: filter, subfilter: subfilter, addfilter: addfilter});
        
        this.setCurArmy();
        
        this.showArmy();
    };
    
        bSendArmy_view.prototype.checkFilterСondition = function(type, filter, unit){
            if( !utils.inArray(filter, type) )
                return false;
            
            switch(type){
                case Army.types.highwater: return unit.hasAbility(Unit.ability.high_water);
                case Army.types.lowwater: return unit.hasAbility(Unit.ability.low_water);
                case Army.types.peace: return unit.hasAbility(Unit.ability.no_attack);
                case 'inTime': return true;
            }
            
            return false;
        };
        
        bSendArmy_view.prototype.setFilters = function(filters){
            this.data.tmplData.filter = filters.filter;
            this.data.tmplData.subfilter = filters.subfilter||false;
            this.data.tmplData.addfilter = filters.addfilter||false;
        };
    
bSendArmy_view.prototype.cacheCont = function(){
    this.$army = this.cont.find('.sendArmy-army');
    
    this.$transport = this.cont.find('.sendArmy-transport');
    this.$water_wrp = this.cont.find('.sendarmy_water_wrp');
    this.$to_sheeps = this.$water_wrp.find('#to_sheeps');
};

bSendArmy_view.prototype.afterDraw = function(){
	var self = this;
	
	if( this.data.target && this.data.target.id == this.data.town.id )
		this.data.tmplData.targetOwnTown = this.data.targetOwnTown = true;
	
    this.$form = this.cont.find('form');
    
    this.initPorts();
    
	this.filterArmy();
    
    this.setFilters({filter: Army.types.none});
    
	this.showArmy();
    
	this.setCurArmy({noCalcDist: true});
    
	this.cont.find('.arrive-mask').inputmask(wSendArmy.timeFormat.simpleTime,{
		clearIncomplete: true,
		onincomplete: function(){
			self.showArriveTimer(true);
			self.runTimer();
			self.momentArriveInput = 0;
		}
	});
    
	this.calcDist();
    
	this.noTimer = true;
    
	this.showErrorTimer();
    
	// Отправка массовой армии
	if (this.data.commander) {
		this.selectAct(this.data.commander.act);
		
		this.parent.setClipboard({tag: 'g' + this.data.commander.groupid + '/' + this.data.commander.key});
	}
    
	// По умолчанию массовая атака
	if ( !this.data.commander && Account.hasAbility(Science.ability.tactics) && (!this.data.target || !this.data.target.account.isBarbarian()) ){
		if( this.data.town.army.own.isEmpty() || this.data.targetOwnTown || (!this.data.target && utils.sizeOf(wofh.towns) == 1) ){
			this.data.activeTabName = 'massattack';
			
			this.showTab();
		}
	}

	if( this.activeTab )
        this.showTab();
	
	this.parent.setHeaderCont(this.data);
	
	this.initScroll({scrollbarPosition: 'outside'});
	
	this.stopDataLoader();
};

bSendArmy_view.prototype.close = function(){
	this.parent.close();
};


bSendArmy_view.prototype.stopDataLoader = function(){
	if( !this.distLoaderId ){
		contentLoader.stop(this.dataLoaderId);
		
		this.dataLoaderId = undefined;
	}
};

bSendArmy_view.prototype.getTargetData = function(){
	this.countReq++;
	
	this.getReqData(function(){
		var self = this,
            targetId = this.data.target.id;
		
		reqMgr.getTargetData(targetId, this.data.town.id, targetId, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
                    this.data.target = this.prepareTarget(targetId, resp);

                    if( !this.data.target )
                        return;

                    this.data.tmplData.target = this.data.target;
                    
					this.dataReceived();
				}
			);
		});
	});
};

    bSendArmy_view.prototype.prepareTarget = function(targetId, data){
        var target = data.town[targetId];
        
        if( target.pos === undefined ){
            wndMgr.addAlert('Невозможно добраться до цели');
            
            this.close();
            
            return;
        }
        
        target.dist = target.distance.air;
        
        target.country = target.account.country;
        
        target.in = data.in;
        
        target.towns = data.towns;
        
        target.accounts = data.accounts;
        
        return target;
    };

bSendArmy_view.prototype.getCommandingData = function() {
	this.countReq++;
	
	this.getReqData(function(){
		var self = this;
		
		reqMgr.getCommandingData(this.data.сommanding.groupid, this.data.сommanding.key, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					var commander = resp.commandgroup;

					if( !commander ){
						wndMgr.addAlert(wSendArmy.alerts.noData).onClose = this.close.bind(this);
                        
						return;
					}

					this.data.tmplData.commander = this.data.commander = commander;

					// Запрос инфы о городе на который идет военная операция
					this.data.target = {id: commander.target};

					this.getTargetData();

					this.dataReceived();
				}
			);
		});
	});
};


bSendArmy_view.prototype.checkSelCount = function() {
	var armyList = this.data.tmplData.army.getList(),
        armySelList = this.data.tmplData.armySel.getList();

	for(var selUnit in armySelList){
		selUnit = armySelList[selUnit];
        
		var unit = armyList[selUnit.id];
        
		if( unit )
			selUnit.setCount(Math.min(selUnit.getCount(), unit.getCount()));
		else
			delete armySelList[selUnit.id];
	}
};

bSendArmy_view.prototype.changeTown = function(townId){
    this.data.town = wofh.towns[townId];
    
    this.onTownChange();
};

bSendArmy_view.prototype.onTownChange = function(){
    this.parent.data.town = this.data.town;
    
	this.parent.data.activeTabName = this.data.activeTabName;
    
	this.show();
};

bSendArmy_view.prototype.changeTarget = function(targetId){
    if( !this.data.targets )
        this.data.targets = {};

    this.data.target = this.data.targets[targetId];
    
    if( !this.data.target ){
        var self = this,
            loaderId = contentLoader.start(
                this.parent.wrp.find('.wnd-cont-wrp'), 
                500, 
                function(){
                    reqMgr.getTargetData(targetId, self.data.town.id, targetId, function(resp, reqId){
                        self.tryProcessResp(
                            resp, reqId,
                            function(){
                                this.data.target = this.prepareTarget(targetId, resp);

                                if( !this.data.target )
                                    return;

                                this.initPorts();

                                this.data.targets[targetId] = this.data.target;

                                if( !this.onTargetChange() )
                                    contentLoader.stop(loaderId);
                            }
                        );
                    });
                }
            );
    }
    else
        this.onTargetChange();
};

bSendArmy_view.prototype.onTargetChange = function(){
    this.parent.data.target = this.data.target;

    this.cleanState();

    this.toggleWaterPanel(false, true);

    this.filterArmy();

	this.checkWaterPanel();
	
    if( this.data.water )
        this.showPorts('in');
	
	var wasReq = this.calcDist({
		callback: this.checkSubmit.bind(this)
	});
    
	this.checkSubmit();
	
	return wasReq;
};


bSendArmy_view.prototype.setUnitCount = function(unitId, count) {
	count = count === undefined ? this.data.tmplData.army.getElem(unitId).getCount() : count;
	
    this.$army.find('input[data-id="' + unitId + '"]').val(count);
    
    if( count > 0 )
        this.data.tmplData.armySel.setCount(unitId, count);
    else
        this.data.tmplData.armySel.delElem(unitId);
	
    this.cleanState();

    this.setCurArmy({noUpdArmy: true});
    
	this.showArmyAlerts();
};

bSendArmy_view.prototype.updateTargetDist = function() {
    this.data.target.dist = Trade.calcDistance(this.data.town.pos, this.data.target.pos);
};

bSendArmy_view.prototype.filterArmy = function() {
    var self = this; 
    
    var townArmy = this.data.town.army.own.clone(),
        target = this.data.target;
    
    if ( this.data.commander ){
        townArmy = townArmy.filter(function(unit){
            return  !unit.hasTag(Unit.tags.ship) && 
                    !unit.hasTag(Unit.tags.aircraft) && 
                    (self.data.act == wSendArmy.act.def || (!unit.hasAbility(Unit.ability.no_attack) && !unit.hasAbility(Unit.ability.noFight)));
        });
    }
	
	// Фильтруем корабли
	if( target ){
		if( target.hasWaterPath() ){
			if( target.hasLowWaterPath() && target.hasDeepWaterPath() ){
				// Можно отправить, как глубоководные корабли так и мелководные
			}
			else{
				var ability = target.hasLowWaterPath() ? Unit.ability.low_water : Unit.ability.high_water;
                
				townArmy = townArmy.filter(function(unit){
					return !(unit.hasTag(Unit.tags.ship) && !unit.hasAbility(ability));
				});
			}
		}
		else
			townArmy = townArmy.filter(function(unit){
				return !unit.hasTag(Unit.tags.ship);
			});
        
        if( 
            (!this.data.targetOwnTown || !this.data.commander || this.data.act == wSendArmy.act.atk) // Можем отправлять войска по ВО защиты из города в котором идёт эта ВО
            && 
            target.distance && !target.distance.getLand() && !target.in.length 
        ){
            townArmy = townArmy.filter(function(unit){
                return !unit.isLand() || unit.isSpy();
            });
        }
	}
	
    this.data.tmplData.army = townArmy;
    
    this.data.tmplData.armySel.filter(function(unit){
        return townArmy.hasElem(unit.getId());
    });
    
    this.checkArmyType();
};

bSendArmy_view.prototype.showArmy = function(){
    this.clearTimeout(this.showArmyTO);
    
    this.showArmyTO = this.setTimeout(this.showArmyImmidiate, 0);
};
    
    bSendArmy_view.prototype.showArmyImmidiate = function(){
        var tmplData = this.data.tmplData;
        
        if( tmplData.filter ){
            var hasFilteredUnits = tmplData.army.each(function(unit){
                return  (tmplData.filter & Army.types.water && unit.isFleet())
                        || 
                        (tmplData.filter & Army.types.air && unit.isAir())
                        ||
                        (tmplData.filter & Army.types.land && unit.isLand());
            });
            
            if( !hasFilteredUnits ){
                this.selectFilters(Army.types.none);
                
                return;
            }
        }
        
        tmplData.act = this.data.act;
        
        tmplData.water = this.data.water;
        
        tmplData.targetDistance = this.data.target && this.data.target.distance;
        
        var $unit = this.$army.find('.sendArmy-units input:focus'),
            textRange = utils.getInputTextRange($unit);

        this.validateArmySel(tmplData);

        this.validateFilter(tmplData);
        
        
        this.$army.html(tmplMgr.sendArmy.units(tmplData));
        
        
        snip.spinboxHandler(this.$army);
        
        if( $unit.length ){
            $unit = this.$army.find('input[data-id=' + $unit.data('id') + ']');

            utils.setInputTextRange($unit.data('selectdelay', false).trigger('focus'), textRange);
        }
        
        this.showArmyAlerts();
    };
    
        bSendArmy_view.prototype.validateArmySel  = function(tmplData){
            this.data.tmplData.armySel.filter(function(unit){
                if( 
                    (this.data.act == wSendArmy.act.atk && unit.hasAbility(Unit.ability.no_attack) && !unit.isSpy())
                    ||
                    (!tmplData.water && tmplData.targetDistance && !tmplData.targetDistance.getLand() && unit.isLand() && !unit.isSpy())
                ){
                    return false;
                }
                
                return true;
            }, this);
        };
        
        bSendArmy_view.prototype.validateFilter  = function(tmplData){
            if( this.data.act == wSendArmy.act.atk )
                utils.removeFromArray(tmplData.addfilter, Army.types.peace);
        };
    
bSendArmy_view.prototype.showArmyAlerts = function(){
	var self = this;

	var showAlerts = this.data.сommanding /*&& (this.checkSelfTarget(true) || utils.calcObjSum(this.data.dists))*/;

	if( showAlerts ) {
		var dist = this.getDistForArmyType(false),
            waterTime = this.data.water ? (this.transportTime||0) + (this.data.unloadingTime||0) : 0,
            arrive = this.data.commander.time;	
	}

	this.cont.find('.sendArmy-units').each(function(){
		var $unit = $(this);
		var $alertWrp = $unit.find('.sendArmy-unit-maxWrp');

		var unit = self.data.tmplData.army.getElem($unit.data('id'));
		var data = {unit: unit};

		if( showAlerts ){
			var unitArrive = unit.calcMoveTime(dist) + timeMgr.getNow() + waterTime;
            
			data.alertMin = arrive < unitArrive;
			data.alertMax = arrive - unitArrive > lib.war.maxarrivedelay;
		}
		
		$alertWrp.html(tmplMgr.sendArmy.unitMax(data));
	});
};


bSendArmy_view.prototype.showTab = function(){
	var activeTabName = this.activeTab = this.data.activeTabName;
	
	this.wrp.find('.js-tabLink').each(function(){
		$(this).toggleClass('-active', $(this).data('tab') == activeTabName);
	});

	this.selectTab(activeTabName == 'massattack');
};

// Доп. функции
bSendArmy_view.prototype.checkMassAtackArrive = function(act){
	this.momentArriveInput = timeMgr.parseMoment(this.cont.find('.arrive-mask').val(), 'hh:mm:ss DD.MM') - lib.main.timeOffset;
	
	if(this.momentArriveInput < timeMgr.getNow()){//если дата оказалась в прошлом, добавляем год
		this.momentArriveInput = timeMgr.add(this.momentArriveInput, 1, 'y');
	}
	
	var momentArrivePeriod = this.momentArriveInput - timeMgr.getNow();
	
	if( momentArrivePeriod > lib.war.maxbattlegroupdelay ){//елси дата слишком ускакала в будущее - алерт
		wndMgr.addAlert('Выбранный временной промежуток превышает допустимый на ' + timeMgr.fPeriod(momentArrivePeriod - lib.war.maxbattlegroupdelay) + '. Он должен быть не более ' + timeMgr.fPeriod(lib.war.maxbattlegroupdelay));
		
		this.momentArriveInput = '';
		
		return false;
	}
	
	return true;
};

bSendArmy_view.prototype.selectTab = function(val){
	var self = this;
	
	this.massAttack = val;
	
	this.cleanState();
	
	this.cont
		.find('.js-sendarmy-send-one').toggleClass('-hidden', this.massAttack)
        .end()
		.find('.js-sendarmy-send-all').toggleClass('-hidden', !this.massAttack)
        .end()
		.find('.mass_attack').removeClass('active')
        .end()
		.find('.mass_attack[data-id="'+(val?1:0)+'"]').addClass('active');

	// Отключаем интерфейсы
	this.cont
		.find('.sendArmy-army, .sendarmy_water_wrp, .sendarmy_period_wrp, .sendArmy-transport')
        .toggleClass('-hidden', this.massAttack);
	
    this.cont.find('.js-sendarmy-send-all').toggleClass('-disabled', this.massAttack);
	this.cont.find('.js-own-town').toggleClass('-hidden', !this.massAttack);
	
	if( !this.massAttack ){
		var $target = this.cont.find('select[name="target"]');
		
		if( $target.val() == this.data.town.id ){
			$target.val('');
            
            delete this.data.target;
        }
	}

	// Задаём маску
	this.cont.find('.arrive-mask').inputmask(
		this.massAttack ? wSendArmy.timeFormat.dateTime : wSendArmy.timeFormat.simpleTime,
		{ 
			oncomplete: function(){
				if( self.massAttack && self.checkMassAtackArrive() ){
					self.cont.find('.js-sendarmy-send-all').removeClass('-disabled');
				}
			},
			onKeyDown: function(event, buffer, caretPos, opts){
				if( self.massAttack && !$(event.target).inputmask('isComplete') ){
					self.cont.find('.js-sendarmy-send-all').addClass('-disabled');
				}
			}
		}
	).val('');
	
	this.cont.find('.arrive-timer').val('');
	
	if( this.massAttack ){
        this.setTimeout(function(){
            this.cont.find('.arrive-mask').focus();
        }, 100);
        
        this.noTimer = false;
        
		this.checkArmyType();
		this.checkSendType();
		this.checkAlert();
		this.showDist();
        this.checkSubmit();
	} 
	else{
		this.runTimer();
		
		this.setCurArmy();
	}
    
	this.showArriveTimer(!this.massAttack);
};

bSendArmy_view.prototype.cleanState = function(){
    delete this.data.cantTransport;
    
	delete this.data.waterPanelFixed;
};

bSendArmy_view.prototype.selectAct = function(act){
	this.data.act = act;
    
    this.filterArmy();
    
	this.cont.find('#sendarmy_sbm').removeClass('-hidden');
    
	this.setCurArmy({noCalcDist: true});
    
    this.calcDist();
	
    this.showArmy();
};

bSendArmy_view.prototype.runTimer = function(){
	this.arriveChanged = false;
	
	this.cont.find('.arrive-timer').removeClass('-timer-stopped');
};
    
bSendArmy_view.prototype.calcArriveDate = function(){
	if( this.massAttack ) return false;
	
	this.momentArriveInput = 0;
	
	if( this.periodArriveInput == -1 ) return false;
	
	if( !this.cont.find('.arrive-timer').hasClass('-timer-stopped') ) return false;
	
	var dateText = '',
		momentArriveTimer = timeMgr.getNow() + this.periodArriveCalc, // Время прибытия по таймеру
		momentArriveDay = timeMgr.startDay(momentArriveTimer); // Начало дня прибытия
		
	if( momentArriveDay + this.periodArriveInput < momentArriveTimer )
		momentArriveDay += 24 * 3600; // Перескакиваем на следующий день
	
	this.momentArriveInput = momentArriveDay + this.periodArriveInput;
	
	if( momentArriveDay != timeMgr.startDay() )
		dateText = ' ' + timeMgr.fMomentDate(momentArriveDay - lib.main.timeOffset);
	
	return dateText;
};

bSendArmy_view.prototype.showArriveTimer = function(val){
	if(this.noTimer) return;
	this.cont.find('.arrive-timer').toggleClass('-hidden', !val);
	this.cont.find('.arrive-mask').toggleClass('-hidden', val);
	this.cont.find('.arrive-error').addClass('-hidden');
};

bSendArmy_view.prototype.showErrorTimer = function(){
	this.cont.find('.arrive-timer').addClass('-hidden');
	this.cont.find('.arrive-mask').addClass('-hidden');
	this.cont.find('.arrive-error').removeClass('-hidden');
};


bSendArmy_view.prototype.checkWaterPanel = function(){
    var canWaterTransport = this.canWaterTransport();
    
    this.$water_wrp.toggleClass('-hidden', !canWaterTransport);
    
    if( !canWaterTransport ){
        this.toggleWaterPanel(false);

        return;
    }
    else if( this.$to_sheeps.prop('checked') )
        this.toggleWaterPanel(true);
    
    if( this.fixWaterPanel() && !this.data.water ){
        this.toggleWaterPanel( !!(this.data.target && this.data.target.id != this.data.town.id) );

        this.$to_sheeps.prop('checked', this.data.water);
    }
};
    
    bSendArmy_view.prototype.fixWaterPanel = function(){
        var fix =   this.data.cantTransport == true || 
                    this.data.tmplData.army.hasOnlyLandUnits(this.data.armyType) && this.data.target && this.data.target.distance && !this.data.target.distance.getLand();

        this.$to_sheeps.prop('disabled', fix);

        return fix;
    };

bSendArmy_view.prototype.toggleWaterPanel = function(open, checkSheeps){
    if( !this.canWaterTransport() )
        open = false;
    
    if( this.data.water === open )
        return;
    
    this.data.water = open;
    
    this.$transport.toggleClass('-type-hidden', !this.data.water);
    
    if( this.data.water )
        this.setShipping(Army.shipping.speed, true);
    
    if( checkSheeps )
        this.$to_sheeps.prop('checked', this.data.water);

    this.showArmy();
};


bSendArmy_view.prototype.canWaterTransport = function(){
    var canWaterTransport = !(this.data.cantTransport || this.massAttack);
    
    if( canWaterTransport )
        canWaterTransport = this.data.target && this.data.target.in.length > 0;
    
    if( canWaterTransport && this.data.tmplData.filter )
        canWaterTransport = this.data.tmplData.filter & Army.types.land;
    
	return canWaterTransport||false;
};

bSendArmy_view.prototype.checkSendType = function(){
	var sendType = this.data.act;
	
	switch (sendType){
		case wSendArmy.act.atk: sendType = this.isSpyAttack() ? 'spy' : 'atk'; break;
		case wSendArmy.act.def: sendType = 'def'; break;
		default: sendType = ''; break;
	}


	this.cont.find('.sendarmy_back').attr('data-type', sendType);
	this.cont.find('.sendArmy-act input').removeClass('selected');
	this.cont.find('.but_'+sendType).addClass('selected');
};

bSendArmy_view.prototype.isSpyAttack = function(){
	return (this.data.armySelType & Army.types.spy) && !this.data.сommanding && !this.massAttack;
};

bSendArmy_view.prototype.initPorts = function(){
	if ( !this.data )
        return;
	
    this.parsePorts(this.data.target, 'in');

    this.showPorts('in');
};

bSendArmy_view.prototype.showPorts = function(dir, empty){
    this.$transport.find('#sendarmy_transp_'+dir).html(tmplMgr.sendArmy.ports({
        ports: empty || !this.data.target ? [] : this.data.target[dir]
    }));
};

bSendArmy_view.prototype.showOutPort = function(inTownId){
	//фильтрация противоположного селектора
	for(var outTown in this.data.out){
		outTown = this.data.out[outTown];
		if (inTownId == '') {
			outTown.dis = true;
		} else {
			for(var inTown in this.data['in']){
				inTown = this.data['in'][inTown];
				if(inTown.id == inTownId) break;
			}

			outTown.dis = true;
			if(outTown.id != inTown.id){
				for(var inZone in inTown.zones){
					for(var outZone in outTown.zones){
						if(inTown.zones[inZone] == outTown.zones[outZone]){
							outTown.dis = false;
							break;
						}
					}
				}
			}
		}
	}

	this.showPorts('out');
};

bSendArmy_view.prototype.parsePorts = function(data, dir){
    if( !this.data.target )
        return;
    
	var newArr = [],
        newObj = {};
    
	for(var townPos in data[dir]){
		var town = data[dir][townPos];
		var townObj = data.towns[town.id];
        
		town.name = townObj.name;
		town.account = townObj.account;

		town.pos = {o: town.o, x: town.x, y: town.y};
        
		delete town.o;
		delete town.x;
		delete town.y;

		//распаковка флота
		if( dir == 'in' )
			town.fleet = new Army(town.tr);
		
		town.distX = Trade.calcDistance(dir == 'in' ? this.data.town.pos : this.data.target.pos, town.pos);
        
		newArr.push(town);
		newObj[town.id] = town;
	}
    
	newArr.sort(function(a, b){
        if(a.account.id != b.account.id){
            if(a.account.id == wofh.account.id) return -1;
            if(b.account.id == wofh.account.id) return 1;
        }
        
        return a.distX - b.distX;
    });
    
    this.data.target[dir] = newArr;
    this.data.target[dir+'Obj'] = newObj;
};

bSendArmy_view.prototype.setShipping = function(type, checkArmy){
    if( checkArmy )
        this.$transport.find('.js-sendarmy-shipping[value='+type+']').prop('checked', true);
	
	this.data.shipping = type;
};

bSendArmy_view.prototype.checkMassAttack = function(checkOwnTown){
	var commander = this.data.commander;
	
	if( commander ){
		var country = commander.country||commander.account.country,
			isAlien = false;
		
		if( country )
			isAlien = !wofh.country || wofh.country.id != country.id;
		else if( commander.account.id != wofh.account.id )
			isAlien = true;
		
		// Нельзя посылать войска в чужую ВО
		if( isAlien )
			return 'Нельзя участвовать в военной операции другой страны';
	}
	
	if( checkOwnTown && this.checkSelfTarget() ){
		return 'Невозможно отправить войска в военную операцию против родного города.';
	}
	if ( this.periodArriveCalc ) {
		var arriveMoment = this.periodArriveCalc+timeMgr.getNow();
		
		if (arriveMoment > this.data.commander.time) {
			return 'Выбранная армия не успеет дойти до цели к назначенному времени! Попробуй исключить медленные войска, выбрать другой маршрут, изменив порты загрузки или выгрузки войск.';
		}
        var delay = this.data.commander.time - (arriveMoment + lib.war.maxarrivedelay);
		if (delay > 0) {
			return 'Выбранную армию можно будет отправить на эту военную операцию через ' + snip.nobr(timeMgr.fPeriod(delay));
		}
	}
	else{
		var alertMsg = this.checkTransportLimit();
		
		if( alertMsg )
			return alertMsg;
	}
	
	return '';
};

bSendArmy_view.prototype.checkAttack = function(){
	var msg = '';
	
	if( this.data.armySelType & Army.types.mix ){
		msg += prepareAlert(wSendArmy.alerts, {error: 'WEbadArmy'});
	}
	else{
		msg += this.checkTransportLimit();
	}
	
	return msg;
};

bSendArmy_view.prototype.checkTransportLimit = function(){
	if( this.data.water && this.transportLimit )
		return 'Недостаточно свободных ' + '<a href="'+HashMgr.getHref('#/help/move')+'" class="link" target="_blank">транспортов</a>' + ' в порту который ты выбрал для посадки своей армии';
	return '';
};

bSendArmy_view.prototype.askSendArmy = function(){
	var self = this;
	
	var formData = utils.urlToObj(this.$form.serialize());
	
    var req = {};
    if (typeof(formData.target) != 'undefined') req.target = formData.target;
    if (typeof(formData.water) != 'undefined') req.water = formData.water;
    if (typeof(formData.it) != 'undefined') req.it = formData.it;
    if (typeof(formData.ot) != 'undefined') req.ot = formData.ot;
	if (typeof(formData.newbattlesystem) != 'undefined') req.newbattlesystem = formData.newbattlesystem;
    
    req.town = this.data.town.id;
	req.act = this.data.act||wSendArmy.act.atk;
    
    if( this.data.transport )
        req.transport = this.data.transport.toString();

	if ( this.data.target && this.data.target.id )
		req.target = this.data.target.id;
	else{
		wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WEcantLoadTown'}));
        
		return;
	}
	
	if( !this.massAttack ){
        if( wofh.events.getTownWarMoves(undefined, true) >= lib.war.maxbattleevents ){
			wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WElimit'}));
            
            return;
        }
	
        //не выбрана армия
        req.army = (new Army()).parseFormObj(formData).onlyPositive().toString();
        
		if( this.data.water && this.data.dists[1] == 0 ){
            wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WEbadPath'}));
            
            return;
        }
		
        if( !req.army ){
            wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WEnoArmy'}));
            
            return;
        }
		
        //не указан порт посадки
        if( this.data.water && !this.data.targetOwnTown ){
            if( !req.it ){
                wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'badPort'}));
                
                return;
            }
        } 
        else{
            delete req.it;
            delete req.ot;
        }
        
        //разношёрстная армия
        if(this.data.armySelType & Army.types.mix){
            wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WEbadArmy'}));
            
            return;
        }
	}
	
	if( !this.data.commander && !this.massAttack ){
		//цель не доступна
		if(!this.calcDistSum() && !this.data.targetOwnTown){
			wndMgr.addAlert(prepareAlert(wSendArmy.alerts, {error: 'WEbadPath'}));
            
			return;
		}
	}

	//указано время прибытия
	if( this.momentArriveInput )
		req.time = this.momentArriveInput;

	if( this.data.commander ){
		var error = this.checkMassAttack(true);
        
		if( error ){
			wndMgr.addAlert(error);
            
			return;
		}
        
		req.groupid = this.data.commander.groupid;
		req.key = this.data.commander.key;
	}
    
    if (
            self.data.act == wSendArmy.act.atk && 
            (
                wofh.towns[self.data.target.id] || //свой город
                (
                    wofh.country && 
                    self.data.target.account.country &&
                    (
                        (self.data.target.account.country.id == wofh.country.id) ||//город страны
                        wofh.country.isAlly(self.data.target.account.country.id)//союзник
                    )
                )
            )
        ){
        self.showCodeAlert(req);
        
        return;
    }
	else if(	
				self.data.act == wSendArmy.act.def && 
				!wofh.towns[self.data.target.id] &&
				wofh.country && 
				self.data.target.account.country &&
				wofh.country.isEnemy(self.data.target.account.country.id) // Враг
			){
        
		self.showCodeAlert(req, true);
        
		return;
	}
    
	this.askSendArmy2(req);
};

bSendArmy_view.prototype.askSendArmy2 = function(req){
	if( this.massAttack ){
		req.time = this.momentArriveInput;
		
		if( !req.time ){
			wndMgr.addAlert('Не указано время прибытия');
            
			return;
		}
		
		this.sendMassArmy(req);
		
		return;
	}
    
	if( this.isSpyAttack() && req.act == wSendArmy.act.atk ){
		delete req.act;
		
		this.sendSpy(req);
	}
	else
		this.sendArmy(req);
};

bSendArmy_view.prototype.showCodeAlert = function(req, defToEnemy){
	var self = this,
		rand = utils.toInt(Math.random() * 9999);
    
    wndMgr.addConfirm(tmplMgr.sendArmy.enterCode({rand: rand, defToEnemy: defToEnemy}), {
		callbacks: {
			bindEvent: function(){
				var wnd = this;
				
				this.wrp
					.on('input', 'input', function(){
						wnd.toggleAccept($(this).val() != rand);
					});
				
				snip.input1Handler(this.wrp);
			},
			afterDraw: function(){
				this.toggleAccept(true);
			},
			onAccept: function(){
				if( this.wrp.find('input').val() == rand )
					self.askSendArmy2(req);
				else
					self.showCodeAlert(req, defToEnemy);
			}
		}
	});
};

bSendArmy_view.prototype.sendArmy = function(data){
    if( this.data.town.hasBattle() )
        return wndMgr.addAlert('Нельзя отправить войска из города, где идет бой');
    
	var self = this;
	
	this.armyWasSend = true;
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		function(){
			reqMgr.sendArmy(data, [
                function(resp){
                    contentLoader.stop(loaderId);
                    
                    resp.data = resp.data||{};

                    if( resp.error ){
                        if( resp.error == ErrorX.ids.WEbadTime && resp.data.times )
                            self.confirmTimes(data, resp);

                        delete self.armyWasSend;
                    }
                    else{
                        self.updAfterArmySend();

                        if( resp.data.settime )
                            wndMgr.addAlert(tmplMgr.sendArmy.timeCorrect({settime:resp.data.settime, arrivetime:resp.data.arrivetime, target:self.data.target}));
                    }
                },
                function(resp){
                    if( resp.error == ErrorX.ids.WEnotAllFleet )
                        self.show();
                    else
                        contentLoader.stop(loaderId);
                }
            ]);
		}
	);
};

bSendArmy_view.prototype.sendSpy = function(data){
    if( this.data.town.hasBattle() )
        return wndMgr.addAlert('Нельзя отправить войска из города, где идет бой');
    
	var self = this;
	
	this.armyWasSend = true;
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			reqMgr.sendSpy(data, [
                function(resp){
                    contentLoader.stop(loaderId);
                    
                    self.updAfterArmySend();
                },
                function(){contentLoader.stop(loaderId);}
            ]);
		}
	);
};

bSendArmy_view.prototype.updAfterArmySend = function(){
	if( this.data.transport ){
		var frmData = utils.urlToObj(this.$form.serialize()),
			port = this.getPortToTarget(frmData.it);
    
        if( port )
            port.fleet.diffList(this.data.transport);

		delete this.data.transport;
	}
		
	this.setSubmitDisabled(true);
    
	notifMgr.runEvent(Notif.ids.eventSendArmy);
    
	if( this.data.town.id != wofh.town.id )
		appl.setTown(this.data.town.id);
};

bSendArmy_view.prototype.sendMassArmy = function(data){
	var self = this;
	
	var loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		function(){
			reqMgr.armyCommanderCreate(data.act, data.target, data.time, data.newbattlesystem, function(resp){
				contentLoader.stop(loaderId);
				
				resp.data = resp.data||{};
				
				if( resp.error ){
					if( resp.error == ErrorX.ids.WEbadTime && resp.data.times ){
						resp.data.arrivetime = data.time;
						
						self.confirmTimes(data, resp, true);
					}
				}
				else{
					self.cont.find('.js-sendarmy-send-all').addClass('-disabled');
					// key2 и id2 - возвращаются при объявлнии тренировочной ВО
					wndMgr.addSimple(tmplMgr.sendArmy.commanderCreateMsg({id: resp.data.id, id2: resp.data.id2, key: resp.data.key, key2: resp.data.key2, act: data.act, target:data.target}), {
						showBack: true,
						callbacks: {
							bindEvent: function(){
								var wnd = this;
								
								wnd.wrp
									.on('click', '.sendarmy-comcreate-close',function(){
										notifMgr.runEvent(Notif.ids.eventSendArmy);
									
										wnd.close();
									})
									.on('click', '.sendarmy-comcreate-send',function(){
										wndMgr.addWnd(wSendArmy, {groupid: resp.data.id, key: resp.data.key});
										
										wnd.close();
									});
							},
							afterDraw: function(){
								this.wrp.find('textarea').focus();
							}
						}
					});
				}
			});
		}
	);
};

bSendArmy_view.prototype.confirmTimes = function(data, resp, isMassAttack){
	var self = this;
	
	wndMgr.addModal(tmplMgr.sendArmy.chooseTime({times:resp.data.times, arrivetime:resp.data.arrivetime, target:this.data.target}), {
		callbacks: {
			bindEvent: function(){
				var wnd = this;
				
				this.wrp.on('click', '.js-newTime, .js-close', function(){
					if( $(this).data('time') ){
						data.time = $(this).data('time');
						
						if( isMassAttack )
							self.sendMassArmy(data);
						else
							self.sendArmy(data);
					}
					
					wnd.close();
				});
			}
		}
	});
};

bSendArmy_view.prototype.calcDistSum = function(){
	var sum = 0;
	for(var i in this.data.dists){
		sum += this.data.dists[i];
	}
    
	return sum;
};

bSendArmy_view.prototype.showDistTime = function(){
	this.showDist();
    
	this.showTime();
};

// Возвращает true если быд отправлен запрос reqMgr.getPathData
bSendArmy_view.prototype.calcDist = function(opt){
	opt = opt||{};
	
	var self = this,
        town = this.data.town,
        target = this.data.target;
        
	if( !target ){
		this.showDistTime(); 
		
		return false;
	}
	
    var reqPath = [town.pos.o], reqPath2 = [];
    
	if( this.data.water ){
		var frmData = utils.urlToObj(this.$form.serialize()),
            port = this.getPortToTarget(frmData.it);
		
		if( !port ){
            if( target.distance )
                this.checkDists(target.distance.getLand());
            
			this.showDistTime(); 
			
			return false;
		}
		
        
        var waterArmySpeedChanged = false;
        // Если дистанция(путь) до порта не известна и порт это не собственный город - делаем двойной запрос;
        // 1) Удаляем транспорт, узнавая дистанцию(путь) до порта
        // 2) Делаем обычный запрос с транспортами (узнавая пути до цели по воде и суше)
        if( !opt.calcPortDist && port.pathByLand === undefined ){
            port.transportSpeed = port.armySpeed = 0;

            if( port.id != town.id ){
                return this.calcDist({
                    calcPortDist: true,
                    callback: this.calcDist.bind(this, utils.copy({
                        setCurArmy: true, 
                        calcPortDists: !!this.data.commander // Для вычисления юнитов, которые придут вовремя по ВО, необходимо принудительно запрашивать данные о полном пути до цели, чтобы рассчитать реальное время прихода войск
                    }, opt))
                });
            }
            // Если порт - это собственный город, то путь до него равен 0
            port.pathByLand = 0;
        }

        if( opt.calcPortDist )
            delete this.data.transport;
        else if( !this.data.transport )
            this.calcPortTransportTime(port);
		
        
		var transportSpeed = utils.servRound(this.data.transport ? this.data.transport.getSpeed(false) * port.speed : 0),
            armySpeed = utils.servRound(this.data.tmplData.armySel.getSpeed(true));
		
        
        if( !opt.calcPortDist && opt.calcPortDists && !port.dists && !(transportSpeed && armySpeed) ){
            // В случае принудительного запроса полного пути до цели, берём минимальную скорость пешей армии, и в зависимости от опции, минимальную или максимальную скорость транспортов 
            transportSpeed = utils.servRound(port.fleet.getSpeed(false, this.data.shipping == Army.shipping.size) * port.speed);
            armySpeed = utils.servRound(this.data.tmplData.army.getSpeed(true));
        }

        waterArmySpeedChanged = this.isWaterArmySpeedChanged(port, transportSpeed, armySpeed);

        port.transportSpeed = transportSpeed;
        port.armySpeed = armySpeed;

        // Если маршрут до цели, с использованием текущего порта, известен и небыло изменения скорости передвижения армии по воде - берем данные из порта и обновляем путь и время
        if( !waterArmySpeedChanged && port.dists ){
            this.data.dists = port.dists;

            this.data.unloadingTime = port.unloadingTime||0;

            delete this.lastReq;

            this.showDistTime();

            return false;
        }

        if( port.pathByLand !== undefined && !armySpeed ){
            if( port.dists )
                this.data.dists = port.dists;
            else
                this.data.dists = [port.pathByLand];

            this.showDistTime(); 

            return false;
        }
        
        
		if( transportSpeed && armySpeed ){
			reqPath.push([port.pos.x, port.pos.y, target.pos.x, target.pos.y/*, Path.types.deepwater*/]);//глубоководный маршрут от порта до целевого города
			reqPath2.push([port.pos.x, port.pos.y, target.pos.x, target.pos.y, Path.types.deepwater]);//глубоководный маршрут от порта до целевого города
		}
        else if( town.pos.x != port.pos.x || town.pos.y != port.pos.y ){
			reqPath.push([town.pos.x, town.pos.y, port.pos.x, port.pos.y/*, Path.types.land*/]);//пеший маршрут от первого города до порта
			reqPath2.push([town.pos.x, town.pos.y, port.pos.x, port.pos.y, Path.types.land]);//пеший маршрут от первого города до порта
		}
        else{
            this.showDistTime(); 
            
            return false;
        }
	}
    else{
        var pathType = Path.types.land;
        
		if( this.data.armySelType & Army.types.water ){
			if( this.data.armySelType & Army.types.combinewater && !(this.data.armySelType & Army.types.spy) ){
				var combineWater = true;
                
				pathType = Path.types.combinewater; // Комбинированный путь для мелководных и глубоководных кораблей (города находятся на береговой линии)
			}
			else
				pathType = (this.data.armySelType & Army.types.highwater) > 0 ? Path.types.deepwater : Path.types.water;
		}
        else if( this.data.armySelType & Army.types.air || ((this.data.armySelType & Army.types.spy) && this.data.act != wSendArmy.act.def && !this.massAttack) ){
			var dists = [Trade.calcDistance(town.pos, target.pos)];
            
            delete this.lastReq;
            delete this.data.ignoreWater;
            
			if ( this.data.dists && this.data.dists[0] == dists[0] )
				this.data.dists = dists;
            else{
				this.data.dists = dists;
				this.arriveChanged = false;
				
                this.finishDistCalc(opt);
			}
            
            return false;
		}
        
        if( target.distance ){
            this.checkDists(target.distance.getByType(pathType), combineWater);

            this.finishDistCalc(opt);

            return false;
        }
        
		reqPath.push([town.pos.x, town.pos.y, target.pos.x, target.pos.y/*, pathType*/]);//пеший или глубоководный маршрут от первого города до второго города
		reqPath2.push([town.pos.x, town.pos.y, target.pos.x, target.pos.y, pathType]);//пеший или глубоководный маршрут от первого города до второго города
	}
	
	// Используется для сравнения запросов
	var curReq = {path_: JSON.stringify(reqPath2)};
    
    if( this.canReqDist(curReq, waterArmySpeedChanged) ){
		this.data.dists = this.data.dists||[];
		
		var _getPathData = function(){
			reqMgr.getPathData(reqPath, transportSpeed, armySpeed, function(resp){
                self.stopDistLoader();
				
				var path,
                    dists = [];
                
				for(var i = 0; i < reqPath2.length; i++){
					path = reqPath2[i];
                    
					if( transportSpeed && armySpeed )
						dists = resp.path_[path[0]][path[1]][path[2]][path[3]];
					else
                        dists.push(resp.path_[path[0]][path[1]][path[2]][path[3]][path[4]]);
				}

				if( transportSpeed && armySpeed ){
					if( port.pathByLand === undefined )
						port.pathByLand = self.data.dists[Path.types.land]||0;
                    
                    // Если в запросе указаны скорости транспортов и армии, то формат ответа меняется:
                    // dists[0] - время транспортировки по воде;
                    // dists[1] - время выгрузки на берег (вне порта);
                    // dists[2] - время пути по суше.
                    // port.dists имеет формат [путь по суше, путь по воде, путь по суше]
                    
					port.dists = 
                    self.data.dists = [port.pathByLand, dists[0] * timeMgr.invHtS * transportSpeed, dists[2] * timeMgr.invHtS * armySpeed];
                    
					port.unloadingTime = self.data.unloadingTime = dists[1];
				}
				else{
                    if( port )
                        port.pathByLand = dists[Path.types.land];
                    
					self.checkDists(dists[Path.types.land], combineWater);
                }
                
				self.finishDistCalc(opt);
                
				delete self.data.ignoreWater;
				delete self.reqWasSend;
			});
		};
		
		if( this.dataLoaderId ){
			this.distLoaderId = -1;
			
			_getPathData();
		}
		else{
            if( this.distLoaderId ){
                this.clearTimeout(this.distLoaderTO);
                
                _getPathData();
            }
            else{
                this.distLoaderId = contentLoader.start(
                    this.parent.wrp.find('.wnd-cont-wrp'), 
                    500, 
                    function(){
                        _getPathData();
                    }
                );
            }
		}
		
	    this.lastReq = curReq;
		this.reqWasSend = true;
		
		return true;
    }
	else if( !this.reqWasSend )
		delete this.data.ignoreWater;
	
	return false;
};
    
    bSendArmy_view.prototype.isWaterArmySpeedChanged = function(port, transportSpeed, armySpeed){
        if( port.transportSpeed != transportSpeed )
            return true;
        
        if( port.dists && !port.dists[0] && !port.dists[2] )
            return false;
        
        return port.armySpeed != armySpeed;
    };
    
    bSendArmy_view.prototype.canReqDist = function(curReq, forceReq){
        return !this.lastReq || this.lastReq.path_ != curReq.path_ || this.data.armySelType & Army.types.spy || forceReq;
    };
    
    bSendArmy_view.prototype.stopDistLoader = function(){
        this.distLoaderTO = this.setTimeout(function(){
            contentLoader.stop(this.distLoaderId);

            delete this.distLoaderId;

            if( this.dataLoaderId )
                this.stopDataLoader();
        }, 0);
    };

    bSendArmy_view.prototype.checkDists = function(dist, combineWater){
        this.data.unloadingTime = 0;
        
        this.data.dists = [dist];
        
        // В dists[0] может попадать путь до порта, а не до цели!!!
        if( !this.data.dists[0] )
            this.checkWaterPanel();

        if( combineWater ){
            this.data.canCombineWater = this.data.dists[0];
            
            this.checkArmyType();
        }
        else
            delete this.data.canCombineWater;
    };
    
    bSendArmy_view.prototype.finishDistCalc = function(opt){
        this.showDistTime();
        
        if( opt.setCurArmy )
            this.setCurArmy({noCalcDist: true});
        else
            this.checkSubmit();
        
        if( !(this.data.armySelType & Army.types.spy) ){
            if( this.reqWasSend || !opt.noUpdArmy )
                this.showArmy();
        }
        
        if( opt.callback )
            opt.callback();
    };
    
bSendArmy_view.prototype.setCurArmy = function(opt){
    opt = opt||{};
    
	this.checkArmyNoAttack();
	
	this.checkArmyType();
	
	this.checkSendType();
	
    this.showTime();
	
	if( !opt.noCalcDist )
		var noCheckSubmit = this.calcDist({noUpdArmy: opt.noUpdArmy});
    
	if( !noCheckSubmit )
		this.checkSubmit();
	
	this.checkAlert();
};

bSendArmy_view.prototype.checkAlert = function(){
	var alert = '';
	
	if( !this.massAttack && this.data.act == wSendArmy.act.atk ){
		if( this.isNoFightArmyOnly() )
			alert = snip.alert() + 'В атаку отправляются только «робкие» войска. Они все погибнут...';
	}
	
	this.cont.find('.sendarmy-alert-wrp').html(alert);
};

bSendArmy_view.prototype.isNoFightArmyOnly = function(){
	var isNoFight = false;
	
	var armySelList = this.data.tmplData.armySel.getList();
	for(var selUnit in armySelList){
		if( armySelList[selUnit].isNoFight() )
			isNoFight = true;
		else{
			isNoFight = false;
			break;
		}
	}
	
	return isNoFight;
};

bSendArmy_view.prototype.checkSubmit = function(){
    var alertMsg = '',
        submitDisabled = false;
    
	if( this.data.commander ){
		alertMsg = this.checkMassAttack();
        
		this.cont.find('.sendarmy-mass-alert').html(alertMsg);
        
        submitDisabled = alertMsg != '' || !this.periodArriveCalc || !this.hasArmySel();
	}
    else if( !this.massAttack ){
		alertMsg = this.checkAttack();
        
        this.cont.find('.sendarmy-alert').html(alertMsg);
        
		submitDisabled = alertMsg != '' || !this.periodArriveCalc || !this.hasArmySel();
	}
	else
        this.cont.find('.sendarmy-alert').html(alertMsg);
    
    this.setSubmitDisabled(submitDisabled);
};

    bSendArmy_view.prototype.hasArmySel = function(){
        return this.data.tmplData.armySel.getLength() > 0;
    };

//пытаемся атаковать сами себя
bSendArmy_view.prototype.checkSelfTarget = function(noCommander){
	return this.data.target && this.data.target.id == this.data.town.id && !(!noCommander && this.data.commander && this.data.act == wSendArmy.act.def);
};

bSendArmy_view.prototype.setSubmitDisabled = function(disabled){
    if( !this.data.target )
        disabled = true;
    else
        disabled = this.checkSelfTarget() || disabled;

	if( this.submitDisabled !== disabled ){
		this.submitDisabled = disabled;
		
		this.cont.find('.js-sendarmy-send-one').toggleClass('-disabled', disabled);
	}
};

bSendArmy_view.prototype.checkArmyNoAttack = function(){
    var armySel = this.data.tmplData.armySel;
    
    if( this.data.act != wSendArmy.act.atk || (armySel.getLength() == 1 && armySel.hasElem(Unit.ids.spy)) )
        return;
    
    armySel.filter(function(unit){
        if( !unit.hasAbility(Unit.ability.no_attack) )
            return true;
        
        this.$army.find('input[data-id="' + unit.getId() + '"]').val('0');
    }, this);
};

bSendArmy_view.prototype.checkArmyType = function(){
	var canCombineWater = this.data.canCombineWater === undefined ? this.data.town && this.data.town.hasCoast() : this.data.canCombineWater;
	
    this.data.armyType = this.data.tmplData.army.calcType(false);
	this.data.armySelType = this.data.tmplData.armySel.calcType(false, canCombineWater);
    
	// Исключаем возможность разведовательной операции, если разведчики идут по ВО 
	if( (this.data.armySelType & Army.types.spy) > 0 && this.data.сommanding )
		return;
	
	this.data.cantTransport =   (this.data.armySelType & Army.types.water) > 0 || 
                                (this.data.armySelType & Army.types.air) > 0 || 
                                ((this.data.armySelType & Army.types.spy) > 0 && this.data.act == wSendArmy.act.atk);
	
	this.checkWaterPanel();
	
    var armyIsSpy = (this.data.armySelType & Army.types.spy) != 0 && !this.massAttack;

	this.cont.find('.but_atk').toggleClass('-hidden', armyIsSpy);
	this.cont.find('.but_spy').toggleClass('-hidden', !armyIsSpy);
};


bSendArmy_view.prototype.extractArmyArr = function(obj){
	var armyArr = [];
	for(var unit = 0; unit < lib.units.list.length; unit++){
		var count = +obj['u'+unit];
		if(count){
			armyArr[unit] = count;
			delete obj['u'+unit];
		}
	}
	return armyArr;
};

bSendArmy_view.prototype.showDist = function(){
	var text,
        target = this.data.target,
        formatNum = function(num){return utils.formatNum(num, {fixed:1, round: true, base:1});};
	
	if( target ){
        if( this.massAttack ){
            if( target.distance )
                text = formatNum(target.distance.getLand())+', '+formatNum(target.distance.getDeepWater())+', '+formatNum(target.distance.getWater());         
            else
                text = '-';
		}
		else if(this.data.armySelType & Army.types.mix){
			text = '-';
		}
        else if( !this.data.dists ){
			text = '-';
		}
        else if(this.data.dists.length > 2){
            if( !this.data.dists[1] )
                var err = snip.warn('Такого пути не существует', 'red');
            else
                text = formatNum(this.data.dists[0])+'+'+formatNum(this.data.dists[1])+'+'+formatNum(this.data.dists[2])+'='+formatNum(this.calcDistSum());         
		}
        else
			text = this.data.dists[0] > 0 ? formatNum(this.data.dists[0]) : '-';
        
		text = err ? err : formatNum(target.dist)+' ('+text+')';
	}
    else
		text = '-';
    
	this.cont.find('#sendarmy_dist').html(text);
};


bSendArmy_view.prototype.getDistForArmyType = function(isAir){
    if( isAir )
        return this.data.target ? this.data.target.dist : 0;
    else{
        if( !this.data.dists )
            return 0;
		
        return this.data.dists[0] + (this.data.water ? (this.data.dists[2]||0) : 0);
    }
};

bSendArmy_view.prototype.showTime = function(){
    if( this.arriveChanged )
        return;
    
    if( this.data.tmplData.armySel.isEmpty() )
        delete this.periodArriveCalc;
    
    var time;
    
	//основная часть маршрута
    if( this.data.armySelType & Army.types.mix ){
        time = 0;
    } 
    else{
        var dist = this.getDistForArmyType(this.data.armySelType & Army.types.air);
        
        time = !this.massAttack ? this.data.tmplData.armySel.calcMoveTimeFromTown(dist) : 0;
		
		// Если расчитываем время прибытия воиск по ВО защиты в свой собственный город
		if( this.data.commander && this.data.act == wSendArmy.act.def && !dist && this.data.tmplData.armySel.getLength() )
			time = 1;
    }
	
	//транспортировка морем
	if( this.data.water ){
		var req = utils.urlToObj(this.$form.serialize());
		
		time = this.calcPortTransportTime(this.getPortToTarget(req.it), time);
	}

	time = utils.toInt(time);
	
	this.periodArriveCalc = time; //время в пути рассчитанное
	
	if(!time){
		this.noTimer = true;
		if(!this.massAttack){
			this.showErrorTimer();
		}
	} else {
		this.noTimer = false;
		this.showArriveTimer(true);
	}
	this.cont.find('#sendarmy_time').html(time? timeMgr.fPeriod(time): '-');
	
	this.arriveChanged = false;
	this.cont.find('.arrive-timer').data('time', time);
	this.showArriveTimer(true);
	this.cont.find('.arrive-timer').toggleClass('-timer-stopped', !time);
	this.cont.find('.unloading-alert').toggleClass('-hidden', !((this.data.unloadingTime||0) && time));
	
	if( !this.massAttack )
        this.momentArriveInput = 0;
	
	timeMgr.tick();
};


bSendArmy_view.prototype.getPortToTarget = function(portId){
    if( !this.data.target )
        return null;
    
    return this.data.target.inObj[portId]||null;
};

bSendArmy_view.prototype.calcPortTransportTime = function(port, time){
	time = time||0;
	
	this.transportLimit = false;
    
    var transport = false,
        transportTime = 0,
        armySel = this.data.tmplData.armySel;
    
	if( !port )
		time = 0;
	else{
		var fleet = port.fleet;
        
        transport = fleet.selectTransport(armySel, this.data.shipping);
		
		// Пытаемся отсеч корабли использование которых приведет либо к слишком позднему либо к слишком раннему прибытию
		if( this.data.commander && port.dists ){
			fleet = this.filterFleetByArrive(port, time, this.data.commander.time);
			
			if( !fleet.getLength() )
				fleet = port.fleet;
			// Если были исключены корабли, которые не подходят по времени, пытаемся перенабрать транспорт из оставшихся кораблей.
			// В случае неудачи, берем ранее набранный транспорт.
			else if( transport && fleet.getLength() != port.fleet.getLength() )
				transport = fleet.selectTransport(armySel, this.data.shipping)||transport;
		}
		
		if( !transport ){
			time = 0;
            
			this.transportLimit = true;
		}
        else{
			if( !this.data.dists[1] ) // Нет пути по воде
				time = 0;
			else{
                var selectedTransport = transport;
                
                if( this.data.commander && !selectedTransport.getLength() ){
                    selectedTransport = port.fleet
                                            .clone()
                                            .sortBySpeed(this.data.shipping == Army.shipping.speed)
                                            .getFirst()
                                            .toArmy();
                }

                // Ищем самого медленного
                transportTime = selectedTransport.calcMoveTime(this.data.dists[1]) / (port.speed||1);

                if( armySel.getLength() )
                    time += transportTime + (this.data.unloadingTime||0); // unloadingTime - время выгрузки на сушу
			}
		}
	}
	
    this.data.transport = transport;
    
	this.transportTime = transportTime;
	
	return time;
};

bSendArmy_view.prototype.filterFleetByArrive = function(port, time, commanderTime){
	var periodArriveCalc,
		arriveMoment;

	return port.fleet.clone().filter(function(unit){
		periodArriveCalc = utils.toInt(time + (unit.calcMoveTime(port.dists[1])/(port.speed||1)) + port.unloadingTime||0);
		arriveMoment = periodArriveCalc + timeMgr.getNow();

		if( arriveMoment > commanderTime )
			return false;

		if( commanderTime - (arriveMoment + lib.war.maxarrivedelay) > 0 )
			return false;

		return true;
	});
};