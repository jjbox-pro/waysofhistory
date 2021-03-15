wSlotBld = function(id, slot){
	wSlotBld.superclass.constructor.apply(this, arguments);
};

utils.extend(wSlotBld, wSlot);

WndMgr.regWnd('slot', wSlotBld);


wSlotBld.prepareData = function(id, extData){
    var data = wSlot.prepareData(id, extData);;
	
    if( !data )
        return false;
    
    data.pos = data.id;
	
	if( !wSlotBld.isSlotBld(data) )
		return false;
	
	return data;
};

    

wSlotBld.isSlotBld = function(data){
	var slot = data.slot !== undefined ? data.slot : data.town.getSlot(data.pos, false);
	
	return slot && wSlot.selectType(slot) == wSlotBld;
};


wSlotBld.prototype.calcName = function(){
    this.hashName = 'slot';
    
	return 'slotbld';
};

wSlotBld.prototype.initWndOptions = function(){
    wSlotBld.superclass.initWndOptions.apply(this, arguments);
    
    this.options.hasReqData = true;
};

wSlotBld.prototype.calcChildren = function(){
	this.children.view = bSlotBld_view;
};

wSlotBld.prototype.getData = function(){
	var slot = this.data.town.getSlot(this.data.pos, false);
	
	if( wSlotBld.isSlotBld({slot: slot}) )
		this.data.slot = slot;
	else{
		this.close();

		return;
	}
	
	if( this.data.slot.isWonder() )
		this.getWonderData();
	else
		this.dataReceived();
};

wSlotBld.prototype.dataReceived = function(){
	this.stopLoader();

	wSlotBld.superclass.dataReceived.apply(this, arguments);
};

wSlotBld.prototype.addNotif = function(){
    this.notif.show = [Notif.ids.townRes, Notif.ids.accBonus];
    
	// Прохавываем изменение состояния домика (состояние может меняться без событий строительства)
	this.notif.other[Notif.ids.townBuildings] = 
	this.notif.other[Notif.ids.anyTownBuildings] = function(townId){
		if( townId && this.data.town.id != townId )
			return;

		var slot = this.data.town.getSlot(this.data.pos),
			oldSlot = this.data.slot;

		if( oldSlot.getActive() != slot.getActive() || oldSlot.getId() != slot.getId() || oldSlot.getLevel() != slot.getLevel() )
			this.needShow();
	};
	// Прохавываем события строительства
	this.notif.other[Notif.ids.townBuildQueue] = function(params){
		if( !params )
			return;

		if( this.data.slot.getTown(wofh.town).id == params.townId && (this.data.slot.getPos() == params.slotPos || this.data.slot.haveActions()) ){
			this.data.tabsCountWas = utils.sizeOf(this.children.view.children);

			this.needShow();
		}
	};
};

wSlotBld.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.js-slotbld-build', function() {
			if( $(this).hasClass('-type-lvl20') ){
				wndMgr.addConfirm().onAccept = function(){
					self.showLoader();
                    
					reqMgr.slotBuild(self.data.slot, null, true);
				};
			} 
			else
                self.tryBuildSlot();
		})
		.on('click', '.js-slotbld-rebuild', function() {
			wndMgr.addModal(self.tmpl.rebuildAlert, {
				data: {slot: self.getSlotApply()},
				callbacks: {
					afterDataReceived: function(){
						notifMgr.runEvent(Notif.ids.townResUpd);
					},
					addNotif: function(){
						this.notif.show = [Notif.ids.townBuildResCollected];
					},
					bindEvent: function(){
						var wnd = this;

						this.wrp
							.on('click', '.slotbld-addBonus', function(){
								wnd.close();

								var type = LuckBonus.ids.production,
									town = self.getSlotApply().getTown(wofh.town),
									bonus = town.getLuckBonus(type);

								wBonusTakeNow.show(bonus);
							})
							.on('click', '.js-slotAction-accept', function(){
								//проверяем конкурентов
								var conflicts = self.getSlotApply().getRebuild().getConflictsInTown();

								if( conflicts.isEmpty() ){
                                    self.rebuildSlot(self.getSlotApply());
                                    
									wnd.close();
								} else {
									wndMgr.addConfirm(conflicts.hasTrainings() ? 'Внимание. По окончании строительства строения конкурирующие с новым зданием в этом городе будут выключены и перестанут выполнять свои функции.<br>Все обучающиеся в них войска, в том числе поселенцы и рабочие, исчезнут навсегда и безвозвратно' : 'Внимание. По окончании строительства строения конкурирующие с новым зданием в этом городе будут выключены и перестанут выполнять свои функции.').onAccept = function(){
										self.rebuildSlot(self.getSlotApply());
                                        
										wnd.close();
									};
								}
							});
					}
				}
			});
		})
		.on('click', '.js-slotbld-destroy', function() {
			wndMgr.addModal(self.tmpl.destroyAlert, {
				data: {slot: self.getSlotApply()},
				callbacks: {
					afterDataReceived: function(){
						notifMgr.runEvent(Notif.ids.townResUpd);
					},
					bindEvent: function(){
						var wnd = this;

						this.wrp
							.on('click', '.js-slotDestroy', function(){
								wnd.close();

								var slot = self.getSlotApply(),
									onelevel = $(this).data('onelevel') == '1';

								if( slot.getType() == Build.type.store ) {
									var townClone = slot.getTown(wofh.town).clone(),
										slotClone = townClone.getSlot(slot.pos);

									if( !onelevel )
										slotClone.setActive(false);
									else
										slotClone.setLevel(slot.level - 1);

									var newCapacity = townClone.calcCapacity(),
										stockHas = slot.getTown(wofh.town).stock.getHasList();

									stockHas.excludeFood();
									stockHas.addNum(-newCapacity);
									stockHas.onlyPositive();
									stockHas.round();

									if( stockHas.isEmpty() )
										self.destroySlot(onelevel, slot);
									else {
										wndMgr.addConfirm(tmplMgr.slotbld.stockDestroyAlert({
											capacity: slot.getTown(wofh.town).stock.max, 
											capacityNew: newCapacity,
											looseRes: stockHas
										})).onAccept = function(){
											self.destroySlot(onelevel, slot);
										};
									}
								}
								else
									self.destroySlot(onelevel, slot);
							});
					}
				}
			});
		})
		// Заявка на ресы для домика
		.on('click', '.slotBld-cost-makeOrder', function() {
			var data = {slot: self.getSlotApply()};

			if( $(this).hasClass('-type-rebuild') ){
				if( !wofh.account.isPremium() ){
					wndMgr.addWnd(wNoPremium);

					return;
				}

				data.slotRebuild = data.slot; // Перестраеваемый слот 

				data.slot = data.slot.getRebuild().setLevel(0); // Здание для которого заказываем ресы на постройку
			}

			hashMgr.showWnd('countryMakeOrder', data.slot.getPos(), data);
		})
		.on('click', '.js-openSlotNew', function() {
			wndMgr.addWnd(wSlotNew, self.getSlotApply().getPos(), {forceOpen: true});
		})
        
		.on('click', '.js-slotbld-swap', function(event) {
			wndMgr.doInf('toggleModeSwapSlot', [self.data.slot, utils.getPosFromEvent(event, 'client')]);
		})
		.on('click', '.js-slotbld-switchOn', function() {
			if( self.data.slot.isWonder() ){
				self.showLoader();

				reqMgr.slotSwitch(self.data.slot, true);
			}
			else {
				wndMgr.addConfirm(self.tmpl.alert({name: 'switchOn'})).onAccept = function(){
					self.showLoader();

					reqMgr.slotSwitch(self.data.slot, true);
				};
			}
		})
		.on('click', '.js-slotbld-switchOff', function() {
			wndMgr.addConfirm(self.tmpl.alert({name: 'switchOff'})).onAccept = function(){
				self.showLoader();

				reqMgr.slotSwitch(self.data.slot, false);
			};
		})
		// Добавить ресов - бонус
		.on('click', '.slotBld-cost-addBonus', function() {
			var type = LuckBonus.ids.production,
				town = self.data.slot.getTown(wofh.town),
				bonus = town.getLuckBonus(type);

			wBonusTakeNow.show(bonus);
		})
		// Создание страны
		.on('input', '.js-slotbld-newCountry-input', function(){
			$(this)	.parents('.js-slotbld-newCountry')
					.find('.js-slotbld-newCountry-button')
					.toggleClass('-disabled', $(this).val().length < lib.country.namelimit[0]);
		})
		.on('submit', '.js-slotbld-newCountry', function(){
			if( $(this).find('.js-slotbld-newCountry-button').hasClass('-disabled') )
				return false;

			var name = utils.urlToObj($(this).serialize()).name;

			self.showLoader();

			reqMgr.createCountry(name, self.close.bind(self));

			return false;
		})
		//сборка КК
		.on('click', '.js-slotbld-assemble', function() {
			self.showLoader();

			reqMgr.assembleSpaceship(function(){
				self.show();
			});
		})
		//запуск КК
		.on('click', '.js-slotbld-launch', function() {
			if( !wofh.country.canLaunchSpaceship() ) return false;

			self.showLoader();

			reqMgr.launchSpaceship(function(){
				self.show();
			});
		})
		// События строительства
		.on('click', '.js-tabLink .button2-small', function() {
			var eventId = $(this).data('id'),
				townId = $(this).data('town');

			if( $(this).hasClass('-type-immediate') ){
				var err = wofh.town.slots.canBuildUp();

				if( err.isOk() ){
					wndMgr.addConfirm().onAccept = function(){
						var event = wofh.events.getById(eventId); 

						if( !event ) return;

						self.showLoader();

						reqMgr.buildQueueImm(townId, {
							onFail: function(){
								self.stopLoader();
							}
						});
					};
				} 
				else
					wndMgr.addAlert(tmplMgr.bldqueue.alert.immediate());
			}
			else{
				var event = wofh.events.getById(eventId); 

				if( !event ) return;

				wndMgr.addConfirm(tmplMgr.bldqueue.alert.cancel({event: event})).onAccept = function(){
					event = wofh.events.getById(event.getId());  // Пока окно было открыто событие могло удалиться из очереди

					if( !event ) return;

					self.showLoader();

					reqMgr.buildQueueCancel(event.getBldQueuePos(), townId);
				};
			}
		});


	snip.input1Handler(this.wrp);
};

wSlotBld.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

wSlotBld.prototype.onClose = function(){
	this.stopLoader();
};

wSlotBld.prototype.getConflictWnd = wSlotBld.prototype.getIdentWnd;


wSlotBld.prototype.getSlotApply = function(){
	return this.data.slotApply||this.data.slot;
};

wSlotBld.prototype.needShow = function(){
	this.clearTimeout(this.showTO);

	this.showTO = this.setTimeout(this.show, 50);
};

wSlotBld.prototype.showLoader = function(){
	// Крутим лоадер пока ждём ответ на какое-то действие 
	this.loaderId = contentLoader.start(
		this.wrp.find('.wnd-cont-wrp'),
		100,
		false
	);
};

wSlotBld.prototype.stopLoader = function(){
	contentLoader.stop(this.loaderId);
};


wSlotBld.prototype.tryBuildSlot = function(){
    var self = this,
        slot = this.getSlotApply(),
        err = slot.canBuildErr(),
        hasPay = slot.getPay() == 0 && slot.getUp().getPay();

    wndMgr.addModal(this.tmpl.buildAlert, {
        data: {slot: slot, err: err, hasPay: hasPay},
        callbacks: {
            afterDataReceived: function(){
                notifMgr.runEvent(Notif.ids.townResUpd);
            },
            addNotif: function(){
                this.notif.show = [Notif.ids.townBuildResCollected];
            },
            bindEvent: function(){
                var wnd = this;

                this.wrp
                    .on('click', '.slotbld-addBonus', function() {
                        wnd.close();

                        var type = LuckBonus.ids.production,
                            town = slot.getTown(wofh.town),
                            bonus = town.getLuckBonus(type);

                        wBonusTakeNow.show(bonus);
                    })
                    .on('click', '.js-slotAction-accept', function(){
                        self.buildSlot(slot);

                        wnd.close();
                    });
            }
        }
    });
};

wSlotBld.prototype.buildSlot = function(slot){
	this.showLoader();

    reqMgr.slotBuild(slot);
};

wSlotBld.prototype.rebuildSlot = function(slot){
	this.showLoader();
                 
    reqMgr.slotRebuild(slot);
};

wSlotBld.prototype.destroySlot = function(onelevel, slot){
	this.showLoader();

	reqMgr.slotDestroy(slot, onelevel);
};

wSlotBld.prototype.getWonderData = function(){
	this.data.showActivateBtn = this.canActivateWonder();

	if( !this.data.showActivateBtn ){
		this.dataReceived();

		return;
	}

	var slotId = this.data.slot.id;

	this.getReqData(function(){
		var self = this;

		reqMgr.getWondersList(slotId, true, this.data.slot.getTown(wofh.town), function(list, reqId){
			self.tryProcessResp(
				list, reqId, 
				function(){
					for (var item in list){
						if( list[item].active && slotId == list[item].getId() ) {
							this.data.showActivateBtn = false;

							break;
						}
					}

					this.dataReceived();
				}
			);
		});
	});
};

wSlotBld.prototype.canActivateWonder = function(){
	return !this.data.slot.getActive() && !this.data.slot.canUp();
};



bSlotBld_view = function(parent){
	bSlotBld_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bSlotBld_view, Block);


bSlotBld_view.prototype.calcName = function(){
    return 'view';
};

bSlotBld_view.prototype.getData = function(){
	this.data.slot = this.parent.data.slot;
    
	this.data.showActivateBtn = this.parent.data.showActivateBtn;
    
	this.data.slotEvents = this.data.slot.getActions().getList();
    
	this.dataReceived();
};

bSlotBld_view.prototype.calcChildren = function(){
	var slot = this.data.slot,
		prevSlot = slot,
		realSlot = slot,
		childData = {pos: 0, slot: slot, realSlot: realSlot, first: true},
        town,
        bldQueue = wofh.events.getBldQueue(false, slot.getTown()).sort().getList(),
        childIndex = 0,
        slotEventsCount = this.data.slotEvents.length,
		event,
        nextSlot;
    
	this.addChild(childData);
    
    town = town||slot.getTown();
    
    for(var i = 0; i < bldQueue.length; i++){
        if( childIndex >= slotEventsCount ){
            if( childIndex )
                town.hasFurtherEvent = true;
            
            break;
        }
        
        event = bldQueue[i];
        
        nextSlot = slot.applyEvent();
        
        if( event.getSlotPos() != this.data.slot.getPos() ){
            town = this.calcNextTownSlot(town, event, nextSlot).getTown();
            
            continue;
        }

        slot = this.calcNextTownSlot(town, event, nextSlot);

        town = slot.getTown();

        slot.prevSlot = prevSlot;

        childData = {
            pos: ++childIndex, 
            event: event,
            curEvent: !i, // Проверяем является ли событие первым в очереди постройки
            slot: slot, 
            prevSlot: prevSlot,
            realSlot: realSlot
        };

        prevSlot = slot;

        this.addChild(childData);
    }
    
	childData.last = true;

	childData.noActions = childData.first && childData.last;

	if( childData.noActions )
		childData.showActivateBtn = this.data.showActivateBtn;

	// Запоминаем слот со всеми применёнными к нему событиями постройки
	this.parent.data.slotApply = slot;
};
    /*
     * 
     * @param {type} town - город хранящий состояние после завершения предыдущих событий постройки
     * @param {type} bldEvent - текущее событие постройки
     * @param {type} nextSlot - следующий слот в цепочке событий постройки
     * @returns {nextEventSlot}
    */
    bSlotBld_view.prototype.calcNextTownSlot = function(town, bldEvent, nextSlot){
        town = town.clone({army: true}); // Армии копируются по ссылке!!!
        
        var eventSlot = town.getSlots().getSlotByPos(bldEvent.getSlotPos()), // Слот текущего события постройки
            eventTimeLeft = bldEvent.getTimeLeft();
        
        if( eventSlot.getType() != nextSlot.getType() )
            this.calcTownParamsFlow(town, nextSlot, eventTimeLeft);
        
        this.calcTownParamsFlow(town, eventSlot, eventTimeLeft);
        
        town.prevEventTimeLeft = eventTimeLeft;
        
        var nextEventSlot = town.getSlots().getSlotByPos(eventSlot.getPos()).applyEvent(bldEvent, true); // Применяем событие к слоту и сохраняем данное состояние для города
        
        if( nextEventSlot.getType() != nextSlot.getType() )
            this.updTownParams(town, nextSlot);
        
        this.updTownParams(town, nextEventSlot);
        
        return nextEventSlot;
    };
        // Рассчитывает изменение параметров города за время строительства слота
        bSlotBld_view.prototype.calcTownParamsFlow = function(town, slot, eventTimeLeft) {
            switch( slot.getType() ){
                case Build.type.grown:
                case Build.type.culture:
                case Build.type.administration:
                    var pop = town.getPop();

                    pop.has = town.getPopHasNow() + town.calcPopFlow(eventTimeLeft - (town.prevEventTimeLeft||0));
                    /* Берём inc положителен но идёт убыль населения */
                    if( pop.inc > 0 && pop.incReal < 0 )
                        pop.has = Math.max(pop.culture, pop.has);

                    pop.has = Math.max(pop.has, lib.town.population.min);

                    break;
                case Build.type.store:
                    town.getStock().each(function(stockRes){
                        if( !stockRes.updateHour )
                            return;
                        
                        stockRes.fixHas(stockRes.getHasNow() + stockRes.updateHour * ((eventTimeLeft - (town.prevEventTimeLeft||0)) * timeMgr.invHtS));
                    });

                    break;
            };
        };
        
        bSlotBld_view.prototype.updTownParams = function(town, slot) {
            switch( slot.getType() ){
                case Build.type.grown:
                case Build.type.culture:
                case Build.type.administration:
                    town.updGrown();
                    town.updCult();
                    town.updPopInc();

                    break;
                case Build.type.store:
                    town.getStock().max = town.calcCapacity();
                    
                    break;
            };
        };
        
    bSlotBld_view.prototype.addChild = function(childData){
        childData.tabName = 'bldTab_' + childData.pos;
        childData.slotEventTitle = snip.slotEventTitle(childData.slot, childData.event, childData.prevSlot);

        this.children[childData.tabName] = childData;
    };
    
    bSlotBld_view.prototype.getExtChildrenData = function(childrenNew, childrenWas){
        return {
            sameChildrenCount: utils.sizeOf(childrenNew) == utils.sizeOf(childrenWas)
        };
    };
    
    bSlotBld_view.prototype.initChild = function(name, childData){
        return this.children[name] = new tabSlotBld(this, childData);
    };

bSlotBld_view.prototype.addNotif = function(){
	if( this.data.slot.canTrainUnits() )
		this.notif.show = [Notif.ids.townTrain, Notif.ids.accTownBonus];
};

bSlotBld_view.prototype.beforeShowChildren = function(){
	this.tabs = new Tabs(this.cont);

	this.tabs.addTabs(this.children);
};

bSlotBld_view.prototype.afterDraw = function(){
	var tabsCount = utils.sizeOf(this.children),
		tabPos = tabsCount - 1;

	if( this.parent.data.curTabPos !== undefined )
		tabPos = Math.min(this.parent.data.curTabPos, tabPos);

	if( this.parent.data.tabsCountWas ){
		if( tabsCount > this.parent.data.tabsCountWas )
			tabPos = tabsCount - 1;

		delete this.parent.data.tabsCountWas;
	}

	this.tabs.openTab('bldTab_' + tabPos);

	this.normalizeTabsWidth();
};

// Нормируем ширину табов, чтобы корректно влезали в одну строку
bSlotBld_view.prototype.normalizeTabsWidth = function(){
	if( !this.data.slotEvents.length )
		return;

	var tabs = this.tabs.tabs,
		tabsWrpWidth = this.wrp.find('.slotbld-tabs-wrp').width(),
		tabsWidth = 0,
		tabsCount = 0;

	for(var $tab in tabs){
		$tab = tabs[$tab].tab;

		tabsWidth += $tab.outerWidth(true);

		tabsCount++;
	}

	var overflowWidth = tabsWidth - tabsWrpWidth;

	if( !(overflowWidth > 0) )
		return;

	overflowWidth /= tabsCount;

	for(var $tabTitle in tabs){
		$tabTitle = tabs[$tabTitle].tab.find('.tabs-title');

		$tabTitle.width($tabTitle.width()-overflowWidth-5).addClass('-lenLim');
	}
};



tabSlotBld = function(parent, data){
	this.prepareData(data);

	tabSlotBld.superclass.constructor.apply(this, arguments);

	this.options.clearData = false;
};

utils.extend(tabSlotBld, Tab);


tabSlotBld.prototype.prepareData = function(data){
	this.name = data.tabName;
    
	if( data.slot.isEmpty() )
		this.tabTitle = (data.prevSlot||data.slot).getName();
	else
		this.tabTitle = data.slot.getName();
    
	this.data = data;
    
    return this;
};


tabSlotBld.prototype.calcTmplFolder = function(){
	return tmplMgr.slotbld.tab;
};

tabSlotBld.prototype.calcChildren = function(){
	if( this.data.slot.canTrainUnits() )
		this.children.train = bTrain;
	if( !this.data.slot.isEmpty() || this.data.slot.isWonder() )
		this.children.other = bSlotBld_other;
};
    
    tabSlotBld.prototype.isActualChild = function(childData, extChildrenData){
        return childData && extChildrenData.sameChildrenCount;
    };
    
tabSlotBld.prototype.afterDraw = function(){
	var slot = this.data.slot;
    
	if( slot.isEmpty() )
		slot = this.data.prevSlot||slot;
    
	this.wrp.find('.slotbld-slotLink').data('slot', slot);
    
	this.tab.data('slot', slot);
    
	var event = this.data.event;
    
    
	if( !event )
        return;
    
    
    this.tab.addClass('-type-action');
    
    var tabActionCls = 'slotbld-tabAction -type-' + Slot.actions[event.getAction()].name;
    
    if( this.data.curEvent ){
        if( slot.canImm() )
            this.tab.prepend(snip.buttonSmall({type: 'immediate', attrs: {id: event.getId(), town: event.getTown1(), title: utils.escapeHtml(tmplMgr.bldqueue.alert.immediate({popUp: true})), priority: 31, unrelated: true}}));

        tabActionCls += ' -state-active';
    }
    
    this.tab.prepend(snip.wrp(tabActionCls));
    
    this.tab.append(snip.buttonSmall({type: 'delete', attrs: {id: event.getId(), town: event.getTown1(), title: 'Отменить', priority: 31, unrelated: true}}));
};

tabSlotBld.prototype.getIcon = function(){
	if( this.data.event ){
		var action = Slot.actions[this.data.event.getAction()];

		return snip.icon(snip.c.bldActions, action.name, false, false, '-act-ok -type-tab');
	}
	else
		return snip.slotIcon(this.data.slot, {cls: '-type-tab'});
};

tabSlotBld.prototype.getCls = function(){
	return 'js-tooltip';
};

tabSlotBld.prototype.getAttrs = function(){
	return utils.makeDataAttrStr({'tooltip-wnd': 'buildinfo', head: this.data.slotEventTitle});
};

tabSlotBld.prototype.afterOpenTab = function(){
	this.parent.parent.data.curTabPos = this.data.pos;
};



bSlotBld_other = function(parent){
	bSlotBld_other.superclass.constructor.apply(this, arguments);
};

utils.extend(bSlotBld_other, Block);


bSlotBld_other.prototype.calcName = function(){
    return 'other';
};

bSlotBld_other.prototype.calcTmplFolder = function(){
    return tmplMgr.slotbld.other;
};

bSlotBld_other.prototype.addNotif = function(){
	var slot = this.data.slot;

	if( slot.getType() == Build.type.grown || slot.getType() == Build.type.culture || slot.getType() == Build.type.administration )
		this.notif.show = [Notif.ids.townPop, Notif.ids.townPopHas, Notif.ids.townPopSpread];
	else if( slot.getType() == Build.type.airdef )
		this.notif.show = [Notif.ids.townAirdef];
	else if( slot.isSpaceship() )
		this.notif.show = [Notif.ids.countryWonder];
};

bSlotBld_other.prototype.getData = function(){
	this.data = this.parent.data;
    
	this.dataReceived();
};