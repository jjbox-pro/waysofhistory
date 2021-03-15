wArmy = function(){
	wArmy.superclass.constructor.apply(this, arguments);
};

utils.extend(wArmy, Wnd);

WndMgr.regWnd('army', wArmy);


wArmy.commUpdDelay = 60; // Обновлять данные по ВО можно не чаще чем раз в минуту

wArmy.canCommanderDelete = function(group){
	return group.isCommander || (group.isOwner && group.act == wSendArmy.act.def);
};

wArmy.canCommandingUpd = function(group){
	return group.upd + 60 > timeMgr.getNow();
};


wArmy.prototype.calcName = function(){
    return 'army';
};

wArmy.prototype.calcChildren = function(){
	this.children.view = wArmy_view;
};



wArmy_view = function(){
	this.name = 'view';
	
	wArmy_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(wArmy_view, Block);


wArmy_view.prototype.getData = function(){
	var self = this;
	
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		this.wasShown() ? 100 : 0, 
		function(){
			self.getReqData(function(){
				var self = this;
				
				reqMgr.getArmyData(function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							this.data.bonus = wofh.town.army.bonus;

							this.data.fleets = wofh.fleets.getTownFleets().getList();
							for (var fleet in this.data.fleets) {
								fleet = this.data.fleets[fleet];

								fleet.army = new Army(fleet.army);
								fleet.transport = new Army(fleet.transport);
							}
							
							// Содержание армии
							var armyPay = wofh.town.army.own.clone();

							// Подкрепления
							this.data.defin = [];
							this.data.defout = [];

							this.data.reinforcements = wofh.reinforcements.getTownReinforce().getList();

							for (var reinf in this.data.reinforcements) {
								reinf = this.data.reinforcements[reinf];

								if (reinf.home == wofh.town.id) {
									var armyFleet = new Army(reinf.army);

									var item = {
										id: reinf.id,
										army: armyFleet,
										fleetId: reinf.fleet,
										home: reinf.home,
										targ: wofh.world.towns[reinf.town],
										town: wofh.world.towns[reinf.town],
										group: reinf.group
									};
									this.data.defout.push(item);

									// Учёт потребления
									armyPay.addList(item.army);
								}
								if (reinf.town == wofh.town.id) {
									var armyFleet = new Army(reinf.army);

									var item = {
										id: reinf.id,
										army: armyFleet,
										fleetId: reinf.fleet,
										home: reinf.home,
										targ: wofh.world.towns[reinf.town],
										town: wofh.world.towns[reinf.home],
										group: reinf.group,
									};
									this.data.defin.push(item);
								}
							}

							this.data.events = wofh.events.getTownEvents(wofh.town).getSortList('time', true);

							// Нашествие с севера
							if ( wofh.gameEvent.has(GameEvent.ids.newYear1Stage) ) {
								var eventData = {};

								eventData.data = {};

								eventData.data.army = "";

								eventData.event = EventCommon.type.invasion;
								eventData.town2 = wofh.town.id;

								eventData.time = (debug.getLang() == 'en' ? new Date((new Date()).getFullYear(),11,24,6,0,0) : new Date((new Date()).getFullYear(),11,31,6,0,0)).getTime();
								eventData.time = timeMgr.locToServ(eventData.time);

								this.data.events.addElem(new EventCommon(eventData));
							}

							//  Флоты
							for (var fleetId in this.data.fleets) {
								fleet = this.data.fleets[fleetId];

								if ( fleet.t2 == wofh.town.id )
									armyPay.addList(fleet.transport);

								if (fleet.t1 != wofh.town.id && fleet.t2 == wofh.town.id && fleet.status == Fleet.status.stayDef) {
									this.data.defout.push({
										id: fleet.reinforcement,
										army: fleet.army,
										fleetId: fleetId,
										home: fleet.t1,
										targ: fleet.t4,
										town: wofh.world.towns[fleet.t1],
										town2: wofh.world.towns[fleet.t4]
									});
								}
							}

							// Коммандование
							if( this.data.commandingTimeOutId )
								this.clearTimeout(this.data.commandingTimeOutId);

							this.data.commanding = {};

							if( resp.commanding ){
								var minTime, // Время в которое будет наступит самая быстрая ВО
									curMinTime,
									curTime = timeMgr.getNow();

								for (var groupId in resp.commanding) {
									var group = resp.commanding[groupId];

									this.prepareCommandingGroup(group, groupId);

									group.noTacticsChange = this.getNoTacticsChange(group);

									this.data.commanding[group.id] = group;

									curMinTime = group.time - curTime;

									if( curMinTime > 0 ){
										if( minTime === undefined )
											minTime = curMinTime;
										else if( curMinTime < minTime )
											minTime = curMinTime;
									}
								}

								// Костыль для обновления инфы о начале ВО
								if( minTime )
									this.data.commandingTimeOutId = this.setTimeout(function(){
										notifMgr.runEvent(Notif.ids.eventArmy);
									}, minTime * 1000);
							}

							var defFilter = {reinf: [1], '0': {'0': 1, '1': 1, operation: [1, 1]}, '1': {'0':1, '1':1, operation: [1, 1]} };

							this.data.filter = ls.getArmyFilter(defFilter);

							// Гарнизон - весь
							this.data.armyIntown = wofh.town.army.intown;

							// Гарнизон - ожидаемый
							this.data.armyMove = this.data.armyIntown.clone();

							this.data.resources = new ResList();

							var i = 0;
							while(i < this.data.events.getLength()){
								var event = this.data.events.getElem(i);

								if( event.data.groupid && event.data.commander ) {
									var commander = {};
									if( event.data.commander > BaseAccOrCountry.countryK )
										commander.country = wofh.world.getCountry(event.data.commander%BaseAccOrCountry.countryK);
									else{
										commander.account = wofh.world.getAccount(event.data.commander);
										commander.country = wofh.world.getCountryByAccount(event.data.commander);
									}

									event.data.commander = commander;
								}

								if ((event.getType() == EventCommon.type.defence && event.isIncom()) || event.getType() == EventCommon.type.armyreturn) {
									this.data.armyMove = this.data.armyMove.addList(event.data.army);
									
									if( event.getData('res') )
										this.data.resources.addList(event.getData('res'));
								}

								if(!utils.inArray([EventCommon.type.attack, EventCommon.type.spy, EventCommon.type.defence, EventCommon.type.armyreturn, EventCommon.type.maketown, EventCommon.type.makeres, EventCommon.type.makeroad, EventCommon.type.makeimp, EventCommon.type.explore, EventCommon.type.invasion], event.getType())){
									this.data.events.getList().splice(i, 1);
								} else if(event.getType() == EventCommon.type.armyreturn && event.isOutgo(wofh.town.id)){ // не показывать исходящий возврат армий
									this.data.events.getList().splice(i, 1);
								} else {
									if( event.isForTown(wofh.town, true) && (event.getType() == EventCommon.type.armyreturn || event.isOutgo(wofh.town.id)) ){
										armyPay.addList(event.getArmy());
									}
									i++;
								}
							}

							// Битвы
							this.data.battleIn = [];
							this.data.battleOut = [];
							for (var battle in resp.battles) {
								battle = resp.battles[battle];
								battle.home = wofh.world.getTown(battle.home);
								battle.army = new Army(battle.army);
								battle.armyCurrent = new Army(battle.armycurrent);

								if (battle.home.id == wofh.town.id) {
									this.data.battleOut.push(battle);
									armyPay.addList(battle.army);
								} else if (battle.town.id == wofh.town.id){
									battle.town = battle.home;
									this.data.battleIn.push(battle);
								}
							}

							// Оплата армии
							armyPay = armyPay.diffList(wofh.town.army.free.clone()).onlyPositive();

							this.data.pay = armyPay.calcPay(true);

							this.data.map = wofh.account.map;

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

wArmy_view.prototype.addNotif = function(){
	this.notif.other[Notif.ids.eventArmy] = 
	this.notif.other[Notif.ids.townGarrison] = 
	this.notif.other[Notif.ids.townArmyGroups] = 
	this.notif.other[Notif.ids.townFleetUpd] = 
	this.notif.other[Notif.ids.townFleetDel] = this.notifUpd;
};

wArmy_view.prototype.calcChildren = function(){
	this.children.tabAll = tabArmy_view_all;
	this.children.tabMy = tabArmy_view_my;
	
	if( wofh.account.isPremium() )
		this.children.expected = tabArmy_view_expected;
};

wArmy_view.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.cancel-reinforce', function() {
			var defType = $(this).data('deftype'),
				reinfData = self.data[defType][$(this).data('index')],
				tmplData = {};
			
			tmplData.reinfArmy = reinfData.army.clone();
			
			tmplData.oneUnit = tmplData.reinfArmy.getLength() > 1 ? false : true;
			tmplData.hasFleet = reinfData.fleetId ? true : false;
			tmplData.canSendBackBySpeed = (wofh.account.bonus && wofh.account.isPremium());
			tmplData.town = wofh.world.towns[reinfData.home];
			tmplData.acc = tmplData.town.account;
			tmplData.country = tmplData.town.account.country;
			tmplData.defType = defType;
			tmplData.defTypeText = defType == 'defin' ? 'Выдворить' : 'Отозвать';
			
			wndMgr.addModal(tmplMgr.army.cancelReinforce(tmplData), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						wnd.wrp
							.on('click', '.reinforce-army-cancel', function() {
								if ( $(this).hasClass('readonly') ) return false;

								wnd.selectCancelArmy(this);
								
								wnd.checkSend();

								return false;
							})
							.on('click', '.reinforce-army-all-cancel', function() {
								wnd.wrp.find('.reinforce-army-cancel').each(function(){
									wnd.selectCancelArmy(this);
								});

								wnd.checkSend();

								return false;
							})
							.on('submit', '.frm-reinforce-ret', function() {
								if( !wnd.data.canSend )
									return false;

								if( tmplData.hasFleet )
									var army = tmplData.reinfArmy;
								else
									var army = (new Army()).parseForm($(this).find('.army-reinforce-cancel-input').serialize());

								var unitList = army.getList();
								for(var unit in unitList){
									unit = unitList[unit];

									if( unit.getType() == Unit.type.space && unit.getCount() > 0 ){
										wndMgr.addAlert("Нельзя отзывать компоненты КК");
										return false;
									}
								}

								wnd.data.canSend = false;

								reqMgr.sendBack(reinfData.id, army, (tmplData.canSendBackBySpeed && $(this).find('input[name="byspeed"]').prop('checked')), function(){self.show();});

								wnd.close();

								return false;
							})
							.on('input', '.army-reinforce-cancel-input', function(){
								var val = (+$(this).val().replace(/[^\d]/gi, ""))||'';
								$(this).val(val);
								$(this).attr('value', val);

								wnd.checkSend();
							});
					},
					afterDraw: function(){
						if( tmplData.oneUnit || tmplData.hasFleet )
							this.setCanSend(true);
					},
					
					setCanSend: function(state){
						if( this.data.canSend != state ){

							this.data.canSend = state;

							if( state )
								this.wrp.find('.reinforce-btn').removeClass('-disabled');
							else
								this.wrp.find('.reinforce-btn').addClass('-disabled');
						}
					},
					setCanSendBySpeed: function(state){
						if( this.data.canSendBySpeed != state && !tmplData.oneUnit && tmplData.canSendBackBySpeed ){

							this.data.canSendBySpeed = state;

							var $byspeed = this.wrp.find('input[name="byspeed"]');

							if( state ){
								$byspeed.removeAttr('disabled');
								$byspeed.parent().removeClass('crDi');
							}
							else{
								$byspeed.attr('disabled', 'disabled');
								$byspeed.parent().addClass('crDi');
							}
						}
					},
					checkSend: function(){
						var armyLength = this.wrp.find('.army-reinforce-cancel-input[value!=""][value!="0"]').length;
						if( armyLength ){
							this.setCanSend(true);
							if( armyLength > 1 )
								this.setCanSendBySpeed(true);
							else
								this.setCanSendBySpeed(false);
						}
						else{
							this.setCanSend(false);
							this.setCanSendBySpeed(false);
						}
					},
					selectCancelArmy: function(_this){
						var qty = $(_this).text();
						
						$(_this).prev().val(qty).attr('value', qty);
					}
				}
			});
			
			return false;
		})
		.on('click', '.cancel-reinforce-all', function() {
			var tmplData = {};
			
			tmplData.canSendBackAll = true;
			tmplData.canSendBackAllSpeed = (wofh.account.bonus && wofh.account.isPremium());
			
			wndMgr.addModal(tmplMgr.army.cancelReinforce(tmplData), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						this.wrp
							.on('click', '.cancel-all-btn', function(){
								if( tmplData.canSendBackAllSpeed && wnd.wrp.find('input[name="byspeed"]').prop('checked') )
									var bySpeed = true;
								
								reqMgr.sendBackAll(wofh.town.id, bySpeed, function(){self.show();});
								
								wnd.close();
							});
					}
				}
			});
			
					
			return false;
		})
		.on('click', '#army-dismiss', function() {
			wndMgr.addModal(tmplMgr.army.armyDismiss({}), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						wnd.wrp
								.on('click', '.dismiss-army-qty', function() {
									wnd.selectAll($(this));

									wnd.checkCanDismiss();

									return false;
								})
								.on('click', '.dismiss-army-qty-all', function() {
									wnd.wrp.find('.dismiss-army-qty').each(function(){
										wnd.selectAll($(this));
									});

									wnd.checkCanDismiss();

									return false;
								})
								.on('click', '#dismiss-calc', function() {
									if( !wnd.data.canDismiss )
										return false;
									
									var townPop = wofh.town.pop.has;
									var townMaxPop = wofh.town.pop.culture;

									var dismissArmy = new Army();
									var $unitEls = wnd.wrp.find('.frm-dismiss-ret').find('.army-qty-input');
									$unitEls.each(function(){
										var el = $(this);
										var id = el.attr('name').substr(1);
										var qty = el.val();
										dismissArmy.addCount(id, qty);
									});

									var pop = dismissArmy.addList(wofh.town.army.free.clone().mult(-1)).onlyPositive().calcPop();
									var retPop = Math.min(pop, Math.max(Math.min(townMaxPop, lib.town.population.maxdismisspop) - townPop, 0));

									wnd.wrp.find('#army-dismiss-qty').html(utils.toInt(retPop));

									$(this).parent().addClass('-hidden');
									$(this).parent().next().removeClass('-hidden');

									$unitEls.each(function() {
										var input = wnd.wrp.find(this).find('input');
										input.attr('readonly', 'readonly');
										input.next().addClass('readonly');
									});

									wnd.data.canSubmit = true;
									
									return false;
								})
								.on('input', '.army-qty-input', function(){
									utils.checkInputInt(this, {max: $(this).data('data-qty'), min: 0});

									wnd.checkCanDismiss();
								})
								.on('submit', '.frm-dismiss-ret', function() {
									if( !(wnd.data.canSubmit && wnd.data.canDismiss) )
										return false;

									var army = (new Army()).parseForm($(this).serialize());

									var $dismissBtn = $(this).find('.js-dismiss-confirm');

									if( $dismissBtn.hasClass('-disabled') )
										return false;
									else
										$dismissBtn.addClass('-disabled');

									var loaderId = contentLoader.start( 
										$dismissBtn, 
										0, 
										function(){
											reqMgr.armyDismiss(army, function(){
												contentLoader.stop(loaderId);

												// Закрываем окно отправки войск если был роспуск войск, чтобы в нем небыло разночтения данных
												var wndSendArmy = wndMgr.getFirstWndByType(wSendArmy);
												if( wndSendArmy ) 
													wndSendArmy.close();

												wnd.close();
											});
										},
										{
											icon: ContentLoader.icon.short, 
											cssPosition: {right: -55, top: 0},
											callback: function(){
												$dismissBtn.removeClass('-disabled');
											}
										}
									);


									return false;
								});
					},
					afterDraw: function(){
						this.checkCanDismiss();
					},
					
					checkCanDismiss: function(){
						var state = false;
						
						this.wrp.find('.army-qty-input').each(function(){
							if( utils.toInt($(this).val()) ){
								state = true;
								
								return false;
							}
						});
						
						if( this.data.canDismiss != state ){
							this.data.canDismiss = state;
							
							var $button;
							
							if( this.wrp.find('.js-dismiss-confirm-block').hasClass('-hidden') )
								$button = this.wrp.find('#dismiss-calc');
							else
								$button = this.wrp.find('.js-dismiss-confirm');
							
							$button.toggleClass('-disabled', !state);
						}
					},
					selectAll: function($this){
						if( $this.hasClass('readonly') ) return false;
						
						$this.prev().val($this.text());
					}
				}
			});
		})
        // Коммандование - раскрыть детали
        .on('click', '.js-army-comm-toggle', function(){
            var el = $(this).parents('.js-army-commanding');
            el.find('.js-army-comm-toggle').toggleClass('-hidden');
            
            var group = self.data.commanding[el.data('id')];
            var wrp = el.find('.army-comm-details');
            wrp.html(wrp.html() ? '' : tmplMgr.army.oper.spoiler({group:group, defin:self.data.defin}));
        })
        // Коммандование - убрать армию
        .on('click', '.js-army-comm-cancel', function(){
			var id = +$(this).parents('.js-army-comm-join').data('id'),
				groupId = +$(this).parents('.js-army-commanding').data('id');
			
            wndMgr.addConfirm('Вы действительно хотите исключить армию из военной операции?').onAccept = function(){
                reqMgr.armyCommanderDrop(id, groupId, function(){
					notifMgr.runEvent(Notif.ids.eventArmy);
				});
            };
        })
		// Содержание горнизона
		.on('click', '#soder_gor, #soder_gor_text', function(){
			
			var el = self.cont.find('#crop_town');
			
			
			if( el.css('display') == 'none' )
			{
				el.slideDown();
				$(this).css({backgroundPosition: '-46px 0px'});
			} else {
				el.slideUp();
				$(this).css({backgroundPosition: '-23px 0px'});
			}
			
			return false;
		})
		// Отмена колонизации МР, основания города, армии
		.on('click', '.army_move_cancelLink', function(){
            var $this = $(this),
				event = wofh.events.getById($this.data('event')),
				_removeCancelLink = function(){
					wndMgr.addAlert('Время для возврата армии прошло.');
					
					$this.remove();
				};
			
			if( event.canCancel() ){
				wndMgr.addConfirm().onAccept = function(){
					if( event.canCancel() )
						reqMgr.eventDel(event);
					else
						_removeCancelLink();
				};
			}
			else
				_removeCancelLink();
			
            return false;
        })
		// Отмена участия в ВО
		.on('click', '.army_сommanderDrop', function(){
            var eventId = $(this).data('event');
			
            wndMgr.addConfirm().onAccept = function(){
                var event = wofh.events.getById(eventId);
				
                if ( event.data.groupid ) reqMgr.armyCommanderDrop(eventId, event.data.groupid);
            };
			
            return false;
        })
		// Открытие окна с тактиками
		.on('click', '.js-setTactic', function(){
			var data = {};
			data.groupId = $(this).parents('.js-army-commanding').data('id');
			
			var group = self.data.commanding[data.groupId];
			
			if( group.tactics )
				data.usedTactic = group.tactics.extractData();
			
			data.noTacticsChange = self.getNoTacticsChange(group);
			
			wndMgr.addWnd(wTactics, utils.clone(data));
			
			return false;
		})
		// Передача ВО воеводе
		.on('click', '.js-countryBattleGroup', function(){
			var $this = $(this),
				group = self.data.commanding[$this.data('id')];
			
			wndMgr.addConfirm().onAccept = function(){
				if( wofh.account.canTransfOperToCountry(group) ){
					contentLoader.start(
						self.cont.find('.view-army'), 
						0, 
						function(){
							reqMgr.countryBattleGroup(group.id, function(){
								$this.remove();
								
								notifMgr.runEvent(Notif.ids.eventArmy);
							});
						},
						{
							afterAnimation: function(loader){
								contentLoader.stop(loader.id);
							}
						}
					);
				}
			};
			
			return false;
		})
		// Отмена ВО
		.on('click', '.js-commanderDelete', function(){
			var tmplData = {};
			
			tmplData.commanderDelete = true;
			tmplData.empty = $(this).hasClass('js-empty');
			tmplData.groupId = $(this).parents('.js-army-commanding').data('id');
			tmplData.group = self.data.commanding[tmplData.groupId];
			tmplData.canSendBackAllSpeed = wofh.account.bonus && wofh.account.isPremium() && tmplData.group.army.getLength() > 1;
			
			wndMgr.addModal(tmplMgr.army.cancelReinforce(tmplData), {
				callbacks: {
					bindEvent: function(){
						var wnd = this;
						
						this.wrp.on('click', '.js-cancel', function(){
							contentLoader.start(
								self.parent.wrp.find('.wnd-cont-wrp'), 
								0, 
								function(){
									if( !tmplData.empty && wnd.wrp.find('input[name="sendBack"]').prop('checked') ){
										reqMgr.commanderSendBack(tmplData.groupId, tmplData.canSendBackAllSpeed && wnd.wrp.find('input[name="byspeed"]').prop('checked'), function(){
											reqMgr.commanderDelete(tmplData.groupId, true);
										});
									}
									else{
										reqMgr.commanderDelete(tmplData.groupId, tmplData.empty, function(){
											if( tmplData.group.isOwner )
												notifMgr.runEvent(Notif.ids.eventArmy);
										});
									}
									
									wnd.close();
								},
								{
									afterAnimation: function(loader){
										contentLoader.stop(loader.id);
									}
								}
							);
					
							return false;
						});
						
						if( !tmplData.empty ){
							this.wrp.on('change', 'input[name="sendBack"]', function(){
								wnd.wrp.find('.js-sendBackBySpeed').toggleClass('-hidden', !$(this).prop('checked'));
							});
						}
					}
				}
			});
		})
		// Получить бонус
		.on('click', '.war-addBonus', function(){
	        var bonus = wofh.town.getLuckBonus(LuckBonus.ids.war);
			
	        wBonusTakeNow.show(bonus);
			
			return false;
		})
		// Вступить в бой
		.on('click', '.js-army-btl-startOperation', function(){
			var groupId = $(this).closest('.js-army-commanding').data('id');
			
	        wndMgr.addConfirm(tmplMgr.confirm.army.btlStartOperation(), {okText: 'Присоединиться', cancelText: 'Подождать'}).onAccept = function(){
				contentLoader.start(
					self.cont.find('.view-army'), 
					0, 
					function(){
						reqMgr.armyJoinToBattle(groupId, function(){
							notifMgr.runEvent(Notif.ids.eventArmy);
						});
					},
					{
						afterAnimation: function(loader){
							contentLoader.stop(loader.id);
						}
					}
				);
			};
			
			return false;
		})
		.on('click', '.army-oper-linkInfo', function() {
			// Решение не очень красивое. При полной переделке окна следует пересмотреть возможность обновления информации о ВО.

			var comId = $(this).parents('.js-army-commanding').data('id'),
				group = self.data.commanding[comId];
				
			wndMgr.addSimple(snip.wrp('army-operation-info-wrp', '', 'div'), {
				callbacks: {
					calcName: function(){return 'operInfo';},
					
					bindEvent: function(){
						var wnd = this;
						
						this.wrp
							.on('click', '.js-operation-updInfo', function(){
								if( $(this).hasClass('-disabled') )
									return;

								var loaderId = contentLoader.start(
									wnd.wrp.find('.army-operation-info-wrp'), 
									0, 
									function(){
										reqMgr.getCommandingInfo(function(resp){
											contentLoader.stop(loaderId);
											
											var updGroup = self.prepareCommandingGroup(resp.commanding[group.id], group.id);

											group.upd = updGroup.upd = timeMgr.getNow();

											wnd.updCont(updGroup);
										});
									}
								);
							});
					},
					afterDraw: function(){
						this.updCont(group);
					},
					
					updCont: function(group){
						var updTimeLeft = 60 - (timeMgr.getNow() - group.upd);
						
						if( updTimeLeft > 0 )
							this.setTimeout(this.allowUpd, updTimeLeft * 1000);
						
						this.wrp.find('.army-operation-info-wrp').html(tmplMgr.army.massattackinfo({group: group, updTimeLeft: updTimeLeft}));
					},
					allowUpd: function(){
						this.wrp.find('.js-operation-updInfo').removeClass('-disabled').text('Обновить');
					}
				}
			});
		})
		//добавление войск в военную операцию
		.on('click', '.js-addGarrison', function(){
			self.data.groupSelected = self.data.commanding[$(this).parents('.js-army-commanding').data('id')];
			
			wndMgr.addModal(tmplMgr.army.addGarrison({list: self.getJoinGroupList(self.data.groupSelected)}), {
				callbacks: {
					addNotif: function(){
						this.notif.other[Notif.ids.townAttacks] = this.checkSubmit;
					},
					bindEvent: function(){
						var wnd = this;
						
						this.wrp
							.on('submit', '.army-addGar',function(){
								if( !wnd.data.canSubmit ) return false;
								
								var form = utils.urlToObj($(this).serialize()),
									reinf = [];
								
								for(var i in form){
									reinf.push(+i);
								}
								
								if( self.data.groupSelected.isReady )
									wnd.addGarrison(reinf);
								else
									wndMgr.addConfirm('Эти подкрепления невозможно будет отозвать до начала '+snip.icon(snip.c.other, 'oper')+'Военной Операции').onAccept = function(){wnd.addGarrison(reinf);};
								
								return false;
							})
							.on('click', '.army-addGar-selAll', function(){
								utils.toggleAttr(wnd.wrp.find('input'), 'checked', $(this).is(':checked'));
							})
							.on('change', 'input', function(){
								wnd.checkSubmit();
							});
					},
					afterDraw: function(){
						this.initScroll();
					},
					
					checkSubmit: function(){
						this.data.canSubmit = !!this.wrp.find('input:checkbox:checked').length && wofh.town.battle.state != EventCommon.battleState.active;

						this.wrp.find('.js-army-addGar-btn').toggleClass('-disabled', !this.data.canSubmit);
					},
					addGarrison: function(reinf){
						var wnd = this;
						
						reqMgr.armyJoinGroup(reinf, self.data.groupSelected.id, self.data.groupSelected.key, function(){
							wnd.close();

							self.parent.close();

							wndMgr.addWnd(wArmy);
						});
					}
				}
			});
		})
		//фильтры
		.on('click', '.filter-input', function(){
			var type = $(this).data('type');
			var subtype = $(this).data('subtype');
			var dir = $(this).data('dir');
			
			if( self.data.oldFilter ){
				self.data.filter = self.data.oldFilter;
				delete self.data.oldFilter;
			}
			
			if (typeof(subtype) != 'undefined') {
				self.data.filter[type][dir][subtype] = +!self.data.filter[type][dir][subtype];
			} else {
				self.data.filter[type][dir] = +!self.data.filter[type][dir];
			}

			self.filter();
			
			ls.setArmyFilter(self.data.filter);
		})
		.on('click', '.js-pointFilter', function(){
			var $filter = $(this).parent().find('.filter-input');
			
			var type = $filter.data('type');
			var subtype = $filter.data('subtype');
			var dir = $filter.data('dir');
			
			var defFilter = {reinf: [0], '0': {'0': 0, '1': 0, operation: [0, 0]}, '1': {'0':0, '1':0, operation: [0, 0]}};
			
			if (typeof(subtype) != 'undefined') {
				defFilter[type][dir][subtype] = +!defFilter[type][dir][subtype];
			} else {
				defFilter[type][dir] = +!defFilter[type][dir];
			}
			
			if( !self.data.oldFilter ){
				self.data.oldFilter = self.data.filter;
			}
			
			self.data.filter = defFilter;
			
			self.filter();
		})
		//ускорение перемещений войск
		.on('click', '.army-events-imm', function(){
			var eventPos = $(this).parents('.js-army-event').data('id'),
				event = self.data.events.getElem(eventPos);
			
			reqMgr.eventImm(event, function(){self.show();});

		})
		.on('click', '.js-toSimbattle', function(){
			var simbattleHash = utils.urlToObj(wSimbattle.defHashStr);
			
			if( $(this).data('act') == wSendArmy.act.atk ){
				simbattleHash.a1 = $(this).data('army');
			}
			else{
				simbattleHash.a2 = $(this).data('army');
				
				var perimetr = wofh.town.getSlot(Build.slotGroup.perimetr);
				
				if( !perimetr.isEmpty() && perimetr.getLevel() ){
					simbattleHash.dt = perimetr.getId();

					simbattleHash.dl = perimetr.getLevel();
				}
				
				simbattleHash.b2 = utils.toPercent(wofh.town.getWarBonus()-1);
			}
			
			hashMgr.showWnd('simbattle', utils.objToUrl(simbattleHash));
		});
};

wArmy_view.prototype.beforeShowChildren = function(){   
	this.tabs = new Tabs(this.cont);
	
	this.tabs.onOpenTab = function(tab){
		tab.parent.updScrollMaxHeight();
	};
	
	this.tabs.addTabs(this.children);
};

wArmy_view.prototype.afterDraw = function(){
    this.tabs.openTab('all');
	
	//Подключаем спойлеры
	this.spoil = new Spoil(this.cont, function(count){
		return 'Показать все (' + count + ')';
	});
	
	//таблица военных операций
	this.table = new tblArmyOper(this, this.wrp.find('.army-operation'));
	
	this.table.toggleSort('armies');
	
	this.filter();
	
	var self = this;
	
	this.initScroll({
		callbacks: {
			onScroll: function(){
                self.scrollTopPos = this.scrollTop;
			}
		},
		scrollbarPosition: 'outside'
	});
};

wArmy_view.prototype.initScroll = function(){
	wArmy_view.superclass.initScroll.apply(this, arguments);
	
	this.updScrollMaxHeight();
	
	if( this.scrollTopPos )
		this.doScroll('scrollTo', this.scrollTopPos);
};


wArmy_view.prototype.notifUpd = function(){
	this.clearTimeout(this.notifTimeout);
	
	this.notifTimeout = this.setTimeout(function(){
		this.show();
	}, 1000);
};


wArmy_view.prototype.filter = function() {
    var self = this;
    
    this.cont.find('.army-armyRow').each(function(){
        var type = $(this).data('type');
        var dir = $(this).data('dir');
        
        $(this).toggleClass('-hidden', !self.data.filter[type][dir]);
    });
    
    this.cont.find('.army-defout,.army-defin').toggleClass('-hidden', !self.data.filter.reinf[0]);
	this.cont.find('.army-battle-row').each(function(){
        var type = $(this).data('type');
        var dir = $(this).data('dir');
        
        $(this).toggleClass('-hidden', !self.data.filter[type][dir]);
    });
	
    this.table.filterData();
    this.table.show();
};

wArmy_view.prototype.getJoinGroupList = function(group) {
    var list = [];
    
    for (var reinf in this.data.defin){
        reinf = this.data.defin[reinf];
		
        if( this.canJoinReinf(reinf, group) )
            list.push(reinf);
    }
	
    return list;
};

wArmy_view.prototype.canJoinReinf = function(reinf, group) {
    var canJoin = !reinf.group && (reinf.army.calcType()&Army.types.air) == 0;
	
	if( canJoin ){
		canJoin = reinf.targ.id == group.town.id;
			
		if( canJoin ){
			canJoin = reinf.town.account.id == group.commander;
			
			if( !canJoin ){
				var groupCountry;
				
				if( wofh.account.id == group.commander )
					groupCountry = wofh.account.country;
				else if( group.commander > BaseAccOrCountry.countryK )
					groupCountry = new Country({id: group.commander - BaseAccOrCountry.countryK});
				else
					groupCountry = wofh.world.getCountryByAccount(group.commander);
				
				canJoin = (groupCountry && reinf.town.account.country && groupCountry.id == reinf.town.account.country.id)
			}
		}
	}
	
    return canJoin;
};

wArmy_view.prototype.prepareCommandingGroup = function(group, groupId){
	group.isOwner = !!wofh.towns[group.town2];
	group.isReady = timeMgr.getNow() > group.time;
	
	if (!group.key && !group.joined && !group.isOwner) return;
	
	group.id = groupId;
	
	if( group.tactics )
		group.tactics = new Tactic({data:group.tactics});

	group.town = wofh.world.getTown(group.town2, true);

	group.joined = group.joined||{};
	group.status = group.joined;

	var joined = [];

	if( group.joined.def )
		joined = joined.concat(group.joined.def);

	if( group.joined.move )
		joined = joined.concat(group.joined.move);

	group.joined = group.joined.battle||joined;

	/*владелец города может добавить войска из дефа в любую операцию защиты (но не во время боя)*/
	group.canJoinArmies = group.act == wSendArmy.act.def && group.town.id == wofh.town.id && this.getJoinGroupList(group).length != 0 && !group.status.battle;
	group.inCountry = +(wofh.country && group.commander == BaseAccOrCountry.countryK + wofh.country.id);
	group.isCommander = group.commander == wofh.account.id || (group.inCountry && (wofh.account.isHead() || wofh.account.isGeneral()));

	if( !group.isCommander ){
		if (group.commander < BaseAccOrCountry.countryK)
			group.commanderAcc = wofh.world.getAccount(group.commander);
		else
			group.commanderCountry = wofh.world.getCountry(group.commander - BaseAccOrCountry.countryK);
	}

	group.army = new Army();
	group.armyCurrent = new Army();

	for (var join in group.joined){
		join = group.joined[join];

		join.town = wofh.world.towns[join.town1];
		join.account = wofh.world.accounts[join.town.account];

		join.army = new Army( join.data ? join.data.army : join.army );
		join.armyCurrent = new Army( join.data ? join.data.armyCurrent : join.armycurrent );
		group.army.addList(join.army);
		group.armyCurrent.addList(join.armyCurrent);
	}
	
	group.upd = timeMgr.getNow();
	
	return group;
};

wArmy_view.prototype.getScrollMaxHeight = function(){
	return Math.max(utils.getWindowHeight(-(this.wrp.find('.js-page-army-uhead').height() + 140), 0), 100) + 'px';
};

wArmy_view.prototype.updScrollMaxHeight = function(){
	if( this.$scroll ){
		this.$getScrollWrp().css('max-height', this.getScrollMaxHeight());
		
		this.updScroll();
	}
};

wArmy_view.prototype.getNoTacticsChange = function(group){
	if( (group.isReady && !group.act) || group.status.battle )
		return true;
};



/******
 * Вкладка all
 */

tabArmy_view_all = function(){
    this.name = 'all';
	this.tabTitle = 'Весь гарнизон в городе';
	
	tabArmy_view_all.superclass.constructor.apply(this, arguments);
};

utils.extend(tabArmy_view_all, Tab);

tabArmy_view_all.prototype.getData = function(){
	this.data = this.parent.data;
	
    tabArmy_view_all.superclass.getData.apply(this, arguments);
};



/******
 * Вкладка my
 */

tabArmy_view_my = function(){
    this.name = 'my';
	this.tabTitle = 'Собственный гарнизон';
	
	tabArmy_view_my.superclass.constructor.apply(this, arguments);
};

utils.extend(tabArmy_view_my, Tab);

tabArmy_view_my.prototype.getData = function(){
	this.data = this.parent.data;
	
    tabArmy_view_my.superclass.getData.apply(this, arguments);
};



/******
 * Вкладка expected
 */

tabArmy_view_expected = function(){
    this.name = 'expected';
	this.tabTitle = 'Ожидаемый гарнизон';
	
	tabArmy_view_expected.superclass.constructor.apply(this, arguments);
};

utils.extend(tabArmy_view_expected, Tab);

tabArmy_view_expected.prototype.getData = function(){
	this.data = this.parent.data;
	
    tabArmy_view_expected.superclass.getData.apply(this, arguments);
};



tblArmyOper = function(parent, cont) {
    this.tmpl = tmplMgr.army.operations;
    
    this.data = {};
    this.data.list = [];
    for (var groupId in parent.data.commanding) {
        var group = parent.data.commanding[groupId];
		
        this.data.list.push(group);
    }
    this.data.filter = parent.data.filter;
    
	//this.parentFilter = parent.filter.bind(parent);
	
	tblArmyOper.superclass.constructor.apply(this, arguments);
    
    
    this.options.blockSize = 5;
    this.data.blocksShown = 1;
    
    this.bind();
    
    this.splitBlocks();
};

utils.extend(tblArmyOper, Table);

tblArmyOper.prototype.getDefSortDir = function(field){
    var arr = ['armies'];
    return utils.inArray(arr, field);
}

tblArmyOper.prototype.getSortVal = function(group, field) {
    if (field == 'town') return group.town.name.toUpperCase();
    if (field == 'armies') return utils.sizeOf(group.joined)//oper.town.id;
    if (field == 'time') return group.time//oper.town.id;
    
    return group.id;//сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblArmyOper.prototype.bind = function() {
	tblArmyOper.superclass.bind.apply(this, arguments);
    var self = this;
    
    this.cont.on('click', '.army-show-operBlock', function(){
        $(this).parents('.army-show-operBlock-wrp').remove();
        self.cont.find('.army-operBlock.-hidden').first().removeClass('-hidden')
        self.data.blocksShown ++;
        self.parent.spoil.prepare();
    });
    this.cont.on('click', '.army-show-operBlockAll', function(){
        self.cont.find('.army-show-operBlock-wrp').remove();
        self.cont.find('.army-operBlock').removeClass('-hidden')
        self.data.blocksShown = 99;
        self.parent.spoil.prepare();
    });
};
    

tblArmyOper.prototype.afterSort = function() {
    this.splitBlocks();
}

tblArmyOper.prototype.afterDraw = function() {
    timeMgr.tick();
    this.parent.spoil.prepare();
};

tblArmyOper.prototype.filterData = function() {
    for (var item in this.data.list){
        item = this.data.list[item];
        var country = ~~(wofh.country && item.commander == BaseAccOrCountry.countryK + wofh.country.id);
        item.show = this.data.filter[item.act].operation[country];
        console.log(item.show, item.act, country);
    }
};