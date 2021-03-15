set = {
    updateAnnounce: function(ann){
    	reqMgr.convertData(ann, {});
		
        ann.account = ann.accounts[ann.acc];
		ann.end = ann.start + ann.time;
		delete ann.acc;
		delete ann.time;
		
		var annPos = _getAnnPosById(ann.id);
		
		if( annPos === undefined ){
			wofh.announces.splice(0, 0, ann);
		}
		else{
			if( ann.end > timeMgr.getNow() )
				ann.prolong = true; // Помечаем как продленное
			else{
				ann.end = timeMgr.getNow();
				ann.del = true; // Помечаем как удаленное
			}
			
			wofh.announces[annPos] = ann;
		}
		
		notifMgr.runEvent(Notif.ids.wsAnn, ann);
		
		function _getAnnPosById(id){
			for(var i = 0; i < wofh.announces.length; i++){
				if( wofh.announces[i].id == id ) return i;
			}
		}
    },
    
	support: {
		newTicket: function(data){
			data.newTicket = true;
			
			notifMgr.runEvent(Notif.ids.support, data);
		},
		newTicketMessage: function(data){
			data.newTicketMessage = true;
			
			notifMgr.runEvent(Notif.ids.support, data);
		},
		deleteTicketMessage: function(data){
			data.deleteTicketMessage = true;
			
			notifMgr.runEvent(Notif.ids.support, data);
		},
		ticketUpdate: function(data){
			data.ticketUpdate = true;
			
			notifMgr.runEvent(Notif.ids.support, data);
		}
	},
	
	trade: {
		barter: {
			barterCreate: function(data){
				wofh.barterOffers.addElem(data);
				
				data.barterCreate = true;
				
				notifMgr.runEvent(Notif.ids.townBarter, data);
			},
			barterUpdate: function(data){
				wofh.barterOffers.updElem(data);
				
				data.barterUpdate = true;
				
				notifMgr.runEvent(Notif.ids.townBarter, data);
			},
			barterDelete: function(data){
				wofh.barterOffers.delElem(data);
				
				data.barterDelete = true;
				
				notifMgr.runEvent(Notif.ids.townBarter, data);
			}
		},
		
		trade: {
			tradeCreate: function(data){
				wofh.tradeOffers.addElem(data);
				
				data.tradeCreate = true;
				
				notifMgr.runEvent(Notif.ids.townTradeOffers, data);
			},
			tradeUpdate: function(data){
				wofh.tradeOffers.updElem(data);
				
				data.tradeUpdate = true;
				
				notifMgr.runEvent(Notif.ids.townTradeOffers, data);
			},
			tradeDelete: function(data){
				wofh.tradeOffers.delElem(data);
				
				data.tradeDelete = true;
				
				notifMgr.runEvent(Notif.ids.townTradeOffers, data);
			}
		},
		
		stream: {
			streamMarketOfferCreate: function(data){
				wofh.streamOffers.addElem(data);
				
				notifMgr.runEvent(Notif.ids.townStreamMarketOffer);
			},
			streamMarketOfferUpdate: function(data){
				wofh.streamOffers.updElem(data);
				
				notifMgr.runEvent(Notif.ids.townStreamMarketOffer);
			},
			streamMarketOfferDelete: function(data){
				wofh.streamOffers.delElem(data);
				
				notifMgr.runEvent(Notif.ids.townStreamMarketOffer);
			}
		},
		
		ally: {
			tradeAllyUpdate: function(data){
				var ally = new TradeAlly(data);
				
				wofh.tradeAllies.addElem(ally); 
				
				notifMgr.runEvent(Notif.ids.accTradeAlly, ally);
			},

			tradeAllyDelete: function(data){
				wofh.tradeAllies.delElem(data.id);
				
				notifMgr.runEvent(Notif.ids.accTradeAlly, data);
			}
		}
	},
	
	events: {
		// Формирует и добавляет событие в очередь
		add: function(rawData) {
			var eventData = utils.clone(rawData);
			
			var event = new EventCommon(eventData);
			
			if( wofh.events.hasEvent(event.getId()) )
				return;
            
			var type = event.getType();
			
			if( type == EventCommon.type.townbonus )
				return;
			
			set.world.add(eventData);

			wofh.events.add(event);

			notifMgr.runEvent(Notif.ids.event, event);
			
			if( type == EventCommon.type.attack && event.isIncom() ){
				if( wofh.account.isPremium() || event.isGoingTo(wofh.town.id) )
					sndMgr.playEventSnd(EventSnd.events.townAttack);
			}

			if( type == EventCommon.type.attack ||
				type == EventCommon.type.defence || 
				type == EventCommon.type.armyreturn ||
				type == EventCommon.type.spy
			){
				notifMgr.runEvent(Notif.ids.eventArmy);
				notifMgr.runEvent(Notif.ids.townAttacks);
			}
			else if( type == EventCommon.type.train){
				notifMgr.runEvent(Notif.ids.eventArmy);
				notifMgr.runEvent(Notif.ids.townTrain);
			}
			else if( type == EventCommon.type.stream ){
				notifMgr.runEvent(Notif.ids.townStream);
			}
			else if( type == EventCommon.type.trade || type == EventCommon.type.market ){
				notifMgr.runEvent(Notif.ids.townTradersMove);
			}
			else if( type == EventCommon.type.buildI ){
				wofh.towns[event.getTown1()].getSlots().updEvents();

				notifMgr.runEvent(Notif.ids.townBuildQueue, {slotPos: event.getSlotPos(), townId: event.getTown1()});
			}
		},
		// Изменяются данные события
		update: function(eventData){
			var event = wofh.events.getById(eventData.id);
			
			if( !event )
				return;
			
			if( eventData.time !== undefined ) {
				event.time = eventData.time;

				// Если событие наступило, удаляем из списка
				if( event.isHappened() ){
					set.events.del(event);
					
					return;
				}
			}
			if( eventData.start !== undefined )
				event.start = eventData.start;
			if( eventData.data !== undefined ){
				eventData.data = JSON.parse(eventData.data);

				event.data = event.parseData(eventData, event.data.slot);
			}

			// Выход из военной операции при передвижении войск
			var type = event.getType();

			if( type == EventCommon.type.attack || type == EventCommon.type.defence || type == EventCommon.type.spy ){ 
				notifMgr.runEvent(Notif.ids.eventArmy);
			}

			if( type == EventCommon.type.buildI ){
				wofh.towns[event.getTown1()].getSlots().updEvents();

				notifMgr.runEvent(Notif.ids.townBuildQueue, {slotPos: event.getSlotPos(), townId: event.getTown1()});
			}
			
			notifMgr.runEvent(Notif.ids.event, event);
		},
		
		del: function(event, byServ) {
            event = wofh.events.delElem(event);
			
			var type = event.getType();
			
            notifMgr.runEvent(Notif.ids.event, event);
			
			notifMgr.runEvent(Notif.ids.townAttacks);//и войска и рабочие и много
			
			if( type == EventCommon.type.attack || 
				type == EventCommon.type.defence || 
				type == EventCommon.type.armyreturn || 
				type == EventCommon.type.spy 
			)
				notifMgr.runEvent(Notif.ids.eventArmy);
			else if( type == EventCommon.type.train){
				if( event.getTown2() == wofh.town.id )
					sndMgr.playEventSnd(EventSnd.events.townTrainEnd);
				
				notifMgr.runEvent(Notif.ids.eventArmy);
				notifMgr.runEvent(Notif.ids.townTrain);
			}
			else if( type == EventCommon.type.stream )
				notifMgr.runEvent(Notif.ids.townStream); // Удаляет подготовку потока
			else if( type == EventCommon.type.trade || type == EventCommon.type.market ){
				if( type == EventCommon.type.trade && event.town1 == wofh.town.id)
					sndMgr.playEventSnd(EventSnd.events.townBuildEnd);
				
				notifMgr.runEvent(Notif.ids.townTradersMove);
			}
			else if( type == EventCommon.type.buildI ){
				var townId = event.getTown1();
				
				// Запоминаем удалённое событие. Оно может использоваться в set.town.update (set.town.update вызываеться сразу после удаления события)
				set.town.buildImmDelEvent[townId] = event;
				
				wofh.towns[townId].getSlots().updEvents();
				
				notifMgr.runEvent(Notif.ids.townBuildQueue, {slotPos: event.getSlotPos(), townId: townId});					
			}
			
			if( byServ )
				return;
			
			if( type == EventCommon.type.makeimp )
				notifMgr.runEvent(Notif.ids.townImpBuilt);
        },
	},
	
    acc: {
        moneyAdd: function(count){
            wofh.account.money.sum += count;
            notifMgr.runEvent(Notif.ids.accMoney);
        },
		
        science: function (now, next){
            wofh.account.science.current = now;
            wofh.account.science.next = next;
        
            notifMgr.runEvent(Notif.ids.accScience);  
        },
		
        assistChange: function(accRaw){
			set.world.add(accRaw);
			
			if( accRaw.assistant !== undefined && accRaw.account !== undefined && accRaw.assistant == wofh.account.id ){
				accRaw.account = wofh.world.getAccount(accRaw.account);
				
				if( wofh.account.assistfor[accRaw.account.id] && !accRaw.on )
					delete wofh.account.assistfor[accRaw.account.id];
				else
					wofh.account.assistfor[accRaw.account.id] = accRaw.account;
				
				notifMgr.runEvent(Notif.ids.accOptions);
			}
        },
		
        report: function(report){
			if( report.type == Report.type.infoReport ) return;
			
			reqMgr.convertData(report, {baseNames: reqMgr.getReport.getBaseNames()});
			
			report = new Report(report);
			
			wofh.reports[report.id] = report;
			
			if( report.type == Report.type.science )
				wndMgr.addWnd(wReport, report.getIdCode());
			
			notifMgr.runEvent(Notif.ids.accReport, report); 
        },
		
		channelCountry: function(channelCountry){
			wofh.account.chat.country = channelCountry;
			
			notifMgr.runEvent(Notif.ids.countryChange);
		},
		
        update: function(accRaw){// из WebSocketMgr!
			var notifs = {};
			
			if( accRaw.language !== undefined ){
				appl.reload();
			}
			
			if ( accRaw.map !== undefined ){
				var oldMap = wofh.account.map;
				
				wofh.account.map = accRaw.map;
				
				if( wofh.account.map.file != oldMap.file )
					notifs[Notif.ids.accMap] = true;
				
				// Если был изменен город центр
				// Рассчитываем новую позицию для каждого города относительно нового центра
				if( wofh.account.map.o != oldMap.o ){
					var newCenterTown = wofh.towns[wofh.account.map.o];
					
					for(var town in wofh.towns){
                        town = wofh.towns[town];
						
						town.coordinates = [newCenterTown.id, town.pos.x-newCenterTown.pos.x, town.pos.y-newCenterTown.pos.y];
						
						delete town.pos;
						
						town.unpackPos();
                    }
					
					notifs[Notif.ids.accNewCenterTown] = true; 
				}
            }
			
            if( typeof(accRaw.townslist) == 'object' ){//объект или null
                wofh.account.townslist = accRaw.townslist;
				
                if(wofh.account.townslist == null){
                    //разлогиниваемся
                    wndMgr.showInterface('noTowns');
					
                    return;
                }
                //удаляем лишние города
                for(var town in wofh.towns){
                    var find = false;
                    for(var townId in wofh.account.townslist){
                        if( wofh.account.townslist[townId] == town ){
                            find = true;
							
                            break;
                        }
                    }
                    if( !find ){
						var events = wofh.events.getTownEvents(wofh.towns[town]);
						
						if( events.getLength() ){
							// Чистим события разрушенного города
							events.each(function(event){
								this.delElem(event);
							});
							
							notifMgr.runEvent(Notif.ids.event);
						}
						
                        delete wofh.towns[town];
                    }
                }
				
                // Если текущего города уже нет - ставим первый город
                if( !wofh.towns[wofh.town.id] ){
					var firstTown = wofh.account.getFirstTown();
					
					appl.setTown(firstTown.id);
					
					delete notifs[Notif.ids.accNewCenterTown];
				}
				
                //отправляем оповещение
                notifMgr.runEvent(Notif.ids.accTowns); 
            }
			
			if( accRaw.rainbowmode !== undefined){
				wofh.account.rainbowmode = accRaw.rainbowmode;
				
				wofh.account.unpackRainbow();
				
				notifMgr.runEvent(Notif.ids.townRainbow);
			}
			
			if( accRaw.dayprize !== undefined){
				wofh.account.dayprize = accRaw.dayprize;
				
				notifMgr.runEvent(Notif.ids.accChest);
			}

			if( accRaw.countrytime ){
				wofh.account.countrytime = accRaw.countrytime;
			}
            
			if( accRaw.country == 0 ){
				delete wofh.country;
				
				wofh.account.updateTownsAura();
				
				notifMgr.runEvent(Notif.ids.countryChange);
			}
            
			if( accRaw.messageblock !== undefined ){
				wofh.account.messageblock = accRaw.messageblock;
				
				notifMgr.runEvent(Notif.ids.accMessageBlock);
            }
			
            if( accRaw.newmessages && !wofh.account.isAdmin() ) {
				sndMgr.playEventSnd(EventSnd.events.accMsgNew);
				
                wofh.account.newmessages = accRaw.newmessages;
				
                notifMgr.runEvent(Notif.ids.accMessageNew);  
            }
			
            if( accRaw.newreports && !wofh.account.isAdmin() ) {
				sndMgr.playEventSnd(EventSnd.events.accRepNew);
				
                wofh.account.newreports = accRaw.newreports;
                notifMgr.runEvent(Notif.ids.accReportNew);  
            }
			
			if( accRaw.newtickets !== undefined ){
                wofh.account.newtickets = accRaw.newtickets;
				
                notifMgr.runEvent(Notif.ids.accTicketNew);
            }
            
            if( accRaw.diplomacy != undefined ) {
                wofh.account.diplomacy = accRaw.diplomacy;
            }
			
			if( accRaw.power !== undefined ){
				if( accRaw.id == wofh.account.id ){
					wofh.account.power = accRaw.power;
				}
				
				if( wofh.country && wofh.country.atkin ){
					if( !(wofh.account.isGeneral() || wofh.account.isHead()) ){
						delete wofh.country.atkin;
				
						notifMgr.runEvent(Notif.ids.countryAttack);
					}
				}
				
				notifMgr.runEvent(Notif.ids.countryPost, changes);
				notifMgr.runEvent(Notif.ids.countryChange);
			}
            
            if( accRaw.science ){
				if( wofh.account.science.state != accRaw.science.state )
					accRaw.updFutureBuilds = true;
				
                wofh.account.science = accRaw.science;
				
				wofh.account.unpackScience();
				
				notifMgr.runEvent(Notif.ids.accScience);
            }
            
            if( accRaw.research ) {
				if( !utils.isEqual(wofh.account.research.build, accRaw.research.build) )
					accRaw.updFutureBuilds = true;
				
                wofh.account.research = accRaw.research;
				
				// После изучения некоторых наук может появиться возможность добывать новые ресурсы
				for(var town in wofh.towns)
					wofh.towns[town].stock.updIncBase();
				
                notifMgr.runEvent(Notif.ids.townBuildings);  //из-за research.buildings
				
				notifMgr.runEvent(Notif.ids.accResearch);
            }
            
			if( accRaw.updFutureBuilds ){
				delete wofh.account.futureBuilds;
				
				wofh.account.unpackFutureBuilds();
				
				// notifMgr.runEvent(Notif.ids.accFutureBuilds); Отправляется через воркер
			}
			
            if( accRaw.coins !== undefined ) {
                wofh.account.coins = accRaw.coins;
				
                wofh.account.unpackCoins();
				
                notifMgr.runEvent(Notif.ids.accLuck);
            }
            
            if( accRaw.money ){
            	wofh.account.money = accRaw.money;
				wofh.account.unpackMoney();
				wofh.account.unpackMoneyWas();
				
				/*
				//wofh.account.money = accRaw.money; пока так не делать, т.к. теряется ссылочная связь с объектом
				for( var item in accRaw.money ){
					wofh.account.money[item] = accRaw.money[item];
				}
				if(!accRaw.money.credites){
                    wofh.account.money.credites = {inc: 0, sum: 0}
                }
                if(!accRaw.money.deposites){
                    wofh.account.money.deposites = {inc: 0, sum: 0}
                }
				*/
				
				notifMgr.runEvent(Notif.ids.townRes);
                
                notifMgr.runEvent(Notif.ids.accMoney);
            }
			
            if( accRaw.quests ) {
                //вычисляем изменения
                var changes = [],
					oldState = wofh.account.quests,
					questsPos = ls.getQuestsPos({}),
					pos = utils.sizeOf(questsPos);
				
                for( var sign in oldState ){
                    if( oldState[sign] != accRaw.quests[sign] ){
                        changes.push(+sign);
						
						if( accRaw.quests[sign] == Quest.status.active )
							questsPos[+sign] = ++pos;
                    }
                }
				
				ls.setQuestsPos(questsPos);
				
                wofh.account.quests = accRaw.quests;
				
                wofh.account.ability.checkQuests();
				
                notifMgr.runEvent(Notif.ids.accQuestsMgr, {changes: changes});
            }
			
			if( accRaw.email !== undefined ){
				// После подтверждения мыла, перезагружаем страничку дабы сменился статус чата
				if( !wofh.account.email ){
					appl.reload();
				}
				wofh.account.email = accRaw.email;
				notifMgr.runEvent(Notif.ids.accOptions);
			}
			
			if( accRaw.assistant !== undefined ){
				wofh.account.assistant = accRaw.assistant;
				//wofh.account.assistant.account = accRaw.assistant.account;
				//wofh.account.assistant.days = accRaw.assistant.days;
				//wofh.account.assistant.country = accRaw.assistant.country;
				//wofh.account.assistant.time = accRaw.assistant.time;
				
				notifMgr.runEvent(Notif.ids.accAssist);
			}
			
			if( accRaw.sex !== undefined ){
				wofh.account.sex = accRaw.sex;
				//notifMgr.runEvent(Notif.ids.accOptions);
			}
			
			if( accRaw.delreports !== undefined ){
				wofh.account.delreports = accRaw.delreports;
				notifMgr.runEvent(Notif.ids.accOptions);
			}
			
			if( accRaw.text !== undefined ){
				wofh.account.text = accRaw.text;
				notifMgr.runEvent(Notif.ids.accOptions);
			}
			
			if( accRaw.bonus !== undefined ){
				wofh.account.bonus = accRaw.bonus;
				
				notifMgr.runEvent(Notif.ids.accBonus);
			}
			
			if( accRaw.vote !== undefined ){
				wofh.account.vote = accRaw.vote;
			}
			
			if( accRaw.specialists !== undefined ){
                wofh.account.setSpecialists(accRaw.specialists);
				
				notifMgr.runEvent(Notif.ids.accSpecialists);
            }

			if ( accRaw.army !== undefined ) {
				wofh.account.army = accRaw.army;
				
				wofh.account.unpackArmy();
			}
			
			if ( accRaw.armytraining !== undefined ) {
				wofh.account.armytraining = accRaw.armytraining;
				
				wofh.account.unpackArmy();
			}
			
			for(var notif in notifs)
				notifMgr.runEvent(notif); 
        },
		
		tryDelAcc: function(val){
			wofh.account.tryDel = val === undefined ? true : val;
		}
    },
	
	town: {
		buildImmDelEvent: {},
		
		cur: function(id, init) {
            wofh.town = wofh.towns[id];
            
            ls.setTownId(id);
			
            if( !init ){
                notifMgr.runEvent(Notif.ids.townCur);
                
                hashMgr.setHash();
            }
            
            wofh.account.ability.checkTown();
			
            wndMgr.closeModalWnd();
            
			wndMgr.refreshWnd(true);
			
            return true;
		},
        
		streamUpdate: function(rawData){
			set.world.add(rawData);
			
			wofh.streams.addElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townStream);
			notifMgr.runEvent(Notif.ids.townTraders);
		},
		streamDelete: function(rawData){
			wofh.streams.delElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townStream);
		},
		streamOffer: function(rawData){
			set.world.add(rawData);
			
			rawData.town1 = rawData.town1||rawData.t1;
			rawData.town2 = rawData.town2||rawData.t2;
			
			wofh.streamPersonalOffers.addElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townStream);
		},
		streamOfferDelete: function(rawData){
			var elem = wofh.streamPersonalOffers.delElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townStreamOfferDelete, elem);
			notifMgr.runEvent(Notif.ids.townStream);
		},
		
		battleGroupChange: function(rawData){
			var elem = wofh.commanding.getElem(rawData, false);
			if( elem )
				wofh.commanding.updElem(rawData, elem);
			else
				wofh.commanding.addElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townArmyGroups);
		},
		battleGroupDelete: function(rawData){
			wofh.commanding.delElem(rawData);
			
			notifMgr.runEvent(Notif.ids.eventArmy);
		},
		
		battle: function(rawData){
			if ( rawData ){
				var event = new EventBattle(rawData);
				
				if( event.data.state == EventCommon.battleState.delete )
					wofh.events.delBattle(event);
				else
					wofh.events.addBattle(event);
				
				if( wofh.towns[rawData.town] ){
					wofh.towns[rawData.town].updBattle(event);
					
					if( event.data.state == EventCommon.battleState.enter )
						sndMgr.playEventSnd(EventSnd.events.townBattleEnter);
				}
			} else
				wofh.town.updBattle(false);
			
			notifMgr.runEvent(Notif.ids.townAttacks);
		},
		
		fleetUpdate: function(rawData){
			set.world.add(rawData);
			
			var elem = wofh.fleets.getElem(rawData, false);
			if( elem ){
				elem = wofh.fleets.updElem(rawData, elem);
				
				notifMgr.runEvent(Notif.ids.townFleetUpd);
			}
			else
				elem = wofh.fleets.addElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townFleet, elem);
			notifMgr.runEvent(Notif.ids.townAttacks);
			
		},
		
		fleetDelete: function(rawData){
			var elem = wofh.fleets.delElem(rawData);
			
			notifMgr.runEvent(Notif.ids.townFleetDel, elem);
		},
		
		defUpdate: function(rawData){
			var elem = wofh.reinforcements.getElem(rawData, false);
			
			if( elem ){
				if( rawData.army === '' )
					wofh.reinforcements.delElem(rawData);
				else
					wofh.reinforcements.updElem(rawData);
			}
			else
				wofh.reinforcements.addElem(rawData);
			
			notifMgr.runEvent(Notif.ids.eventArmy);
        },
		
        update: function(townRawData){// из WebSocketMgr!
            //копия старого города
            var town = wofh.towns[townRawData.id];
			
            if (typeof(town) == 'undefined' || !(town instanceof Town)) {
                //новый город
                if (typeof(townRawData.type) != 'undefined'){
                    wofh.towns[townRawData.id] = new Town(townRawData);
					
                    notifMgr.runEvent(Notif.ids.accTowns);
					notifMgr.runEvent(Notif.ids.townUpd);
                }
				
                return;
            }
            
            //запись новых данных
            var isCurTown = wofh.town.id == town.id;
            
			if( townRawData.name ) {
				wofh.world.getTown(town).name = town.name = townRawData.name;
				
				notifMgr.runEvent(Notif.ids.townName);
            }
            
			if( townRawData.budget || townRawData.budget === null ){
				town.budget = townRawData.budget;
			}

			if( townRawData.taxes || townRawData.taxes === null ){
				town.taxes = townRawData.taxes;	
				town.unpackTaxes();
            }
			
			if( townRawData.work ){
				town.work = townRawData.work;
				
				if( !townRawData.build ){
	                town.getSlots().setPop(townRawData.work.work);
	                
	                if( isCurTown )
	                    notifMgr.runEvent(Notif.ids.townPopSpread); 
	            }
			}
			
			//постройки и очередь строительства
            if( townRawData.buildings ) {
				if( townRawData.bimmetime !== undefined ) 
					town.bimmetime = townRawData.bimmetime;
				
				if( isCurTown )
					var townWonderActivity = town.getSlots().getWonder().isActive();
				
				var oldSlots = town.getSlots();
				
				town.buildings = townRawData.buildings;
				
				town.slots = {};
				
                town.unpackSlots();
				
				// getEventAppliedToSlot вернёт событие строительства в том случае если оно завершилось !по расписанию!
				// getEventAppliedToSlot вернёт true если событие совершлось внештатно (раньше запланированного времени)
				var eventAppliedToSlot = town.getSlots().getEventAppliedToSlot(oldSlots, set.town.buildImmDelEvent[town.id]);
				
				// Проверям была ли вызвана смена состояния строений (приход buildings) завершившимся событием строительства
				if( eventAppliedToSlot ){
					if( isCurTown )
						sndMgr.playEventSnd(EventSnd.events.townBuildEnd);
					
					var slotEventEndedOnTime = eventAppliedToSlot instanceof EventCommon;
					
					// Если событие совершилось по расписанию (вышло время), сервер не уведомляет об этом по сокету, но присылает новое состояние домиков. Удаляем событие вручную.
					if( slotEventEndedOnTime )
						set.events.del(eventAppliedToSlot);
				}
				
				if( !slotEventEndedOnTime ){
					/*
						На всякий случай обновляем список событий слотов, т.к. могут быть ситуации, когда какое-то событие строительства удаляеться из очереди 
						до прихода buildings. К примеру когда происходит ускорение строительства.
						В этом случае сокет сперва возвращает завершившееся событие (оно удаляется из очереди), а затем новое состояние buildings.
					*/
					town.getSlots().updEvents();
					
					if( isCurTown ){
						// Если было ЧС
						if( townWonderActivity != town.getSlots().getWonder().isActive() )
							notifMgr.runEvent(Notif.ids.townWonderActivity); 

						notifMgr.runEvent(Notif.ids.townBuildings);
					}
					else
						notifMgr.runEvent(Notif.ids.anyTownBuildings, town.id);	
				}
            }
			
			delete set.town.buildImmDelEvent[town.id];
			
            //население
            if (townRawData.pop) {
                if (typeof(townRawData.pop.has) != 'undefined'){
                    town.pop.has = townRawData.pop.has;
                }
                if (typeof(townRawData.pop.hasall) != 'undefined'){
                    town.pop.hasall = townRawData.pop.hasall;
                }
                if (typeof(townRawData.pop.inc) != 'undefined'){
                    town.pop.inc = townRawData.pop.inc;
                }
                if (typeof(townRawData.pop.incnc) != 'undefined'){
                    town.pop.incnc = townRawData.pop.incnc;
                }
                if (typeof(townRawData.pop.culture) != 'undefined'){
                    town.pop.culture = townRawData.pop.culture;
                }
                if (typeof(townRawData.pop.culturenc) != 'undefined'){
                    town.pop.culturenc = townRawData.pop.culturenc;
                }
                
                town.updPopInc();
				
                if( isCurTown )
					notifMgr.runEvent(Notif.ids.townPop, {forceUpdPopIter:true});
            }
            
            //армии
            if (townRawData.army !== undefined) {
				town.unpackArmy(townRawData.army);
				
				if (townRawData.army.own !== undefined)
					notifMgr.runEvent(Notif.ids.townOwnGarrison, {townId:town.id});
                if (townRawData.army.intown !== undefined && isCurTown)
					notifMgr.runEvent(Notif.ids.townGarrison);
            }
			
            if (typeof(townRawData.defgroup) != 'undefined'){
                town.defgroup = townRawData.defgroup;
            }
            
            //склад
            if (townRawData.foodpriority){
				town.stock.parseFoodpriorityStr(townRawData.foodpriority); 
			}
			
            if (townRawData.resources){
                var stockCapacity = town.stock.getMax();
                
				if(townRawData.resources.deposit){
					town.deposit = new Deposit(townRawData.resources.deposit);
					town.stock.updIncBase();
				}
				
                town.stock.update(townRawData.resources, townRawData.work);
                
				var stockCapacityChanged = stockCapacity != town.stock.getMax();
				
				if( stockCapacityChanged )
					wofh.tradeOffers.minimizeByStockMax(town);
				
                if( isCurTown ) {
                    notifMgr.runEvent(Notif.ids.townRes); 
                    
                    if( stockCapacityChanged ){
                        notifMgr.runEvent(Notif.ids.townStockCapacity);
						
						notifMgr.runEvent(Notif.ids.townTradeOffers);
                    }
                }
            }
            
            //кликеры
            if (townRawData.clickers) {
                if (!townRawData.clickers.have)
                    townRawData.clickers.have = town.clickers.have;
                
                town.clickers = townRawData.clickers;
				
                if (isCurTown)
                    notifMgr.runEvent(Notif.ids.townClickers); 
            }   
            
            //торговцы
            if( townRawData.traders ) {
				if( townRawData.traders.traders !== undefined ){
					townRawData.traders = townRawData.traders.traders;
					
					townRawData.traders.waterspeed = town.traders.waterspeed;
					
					if( (town.traders.fuell != townRawData.traders.fuell || town.traders.fuelw != townRawData.traders.fuelw) && isCurTown ){
						var isFuelChange = true;
					}
				
					town.traders = townRawData.traders;
				}
				// Свойство waterspeed меняется отдельно от остальных
				else if( townRawData.traders.waterspeed !== undefined ){
					town.traders.waterspeed = townRawData.traders.waterspeed;
				}
				
                if ( isCurTown ){
                    notifMgr.runEvent(Notif.ids.townTraders);
					if( isFuelChange )
						notifMgr.runEvent(Notif.ids.townFuel);
                }
				
                wofh.account.ability.checkTown();
            }
            
            if( townRawData.bonus !== undefined ) {
                town.bonus.real = townRawData.bonus||{};
                
                town.prepareRealBonus();
				
                notifMgr.runEvent(Notif.ids.accTownBonus);
            }
			
			if( townRawData.specialists !== undefined ) {
				town.specialists = townRawData.specialists;
				
                town.unpackSpecialists();
            }
			
			if( townRawData.usesmap !== undefined ){
				town.usesmap = townRawData.usesmap;
			}
			
			if( townRawData.aad !== undefined ){
				town.aad = townRawData.aad;
				
				notifMgr.runEvent(Notif.ids.townAirdef); 
			}
			
			notifMgr.runEvent(Notif.ids.townUpd);
        },
        
		// Обновляем данные по бонусам если время действия бонуса истекло
		updateBonus: function(town){
			for(var townBonus in town.bonus.real){
				townBonus = town.bonus.real[townBonus];
				if( townBonus.time - timeMgr.getNow() <= 0 ){
					townBonus.time = 0;
					townBonus.level = 0;
				}
			}
		},
        
        clickers: function(clicked, townId){
            var town = wofh.towns[townId];
            for (var i in clicked){
                if (clicked[i] != 0) {
                    town.clickers.have[i] = 0;
                }
            }
        },
	},
	
    country: {
        update: function(data){
			if( wofh.country === undefined || (wofh.country && wofh.country.id != data.id) ){
				wofh.country = new Country(data);
				
				wofh.account.country = wofh.country.id;
				
				wofh.account.unpackCountry();
			}
            
			if( data.towns ){
				wofh.world.parse(data.towns);
				
				notifMgr.runEvent(Notif.ids.countryTowns);
			}
			
			if( data.accounts )
				wofh.world.parse(false, data.accounts);
				
			if( data.accountslist ){
				wofh.country.accounts = data.accountslist;
				
                wofh.country.unpackAccounts(true);
                
                notifMgr.runEvent(Notif.ids.countryAccounts);
            }
			
            if( data.science ){
                wofh.country.science = data.science;
				
				wofh.country.unpackScience();
				
				notifMgr.runEvent(Notif.ids.accScience);
            }
			
            if( data.money ){
				wofh.country.money = data.money;
				
				wofh.country.unpackMoney();
				
                notifMgr.runEvent(Notif.ids.countryMoney);
            }
			
			if( data.taxes ){
				wofh.country.taxes = data.taxes;
				
				wofh.country.unpackMoney();
				
                notifMgr.runEvent(Notif.ids.countryMoney, {taxes: true});
            }

			if( data.taxtime ){
				wofh.country.taxtime = data.taxtime;
				
                notifMgr.runEvent(Notif.ids.countryMoney);
            }
			
			if( data.flag ){
				wofh.country.flag = data.flag;
				
				notifMgr.runEvent(Notif.ids.countryChange);
            }
			
			if( data.name ){
				wofh.country.name = data.name;
				
				notifMgr.runEvent(Notif.ids.countryChange);
            }
			
			if( data.text !== undefined || data.text_read !== undefined ){
				if( data.text !== undefined )
					wofh.country.text = data.mission;
				if( data.text_read !== undefined )
					wofh.country.text_read = data.text_read;
				
				notifMgr.runEvent(Notif.ids.countryText);
            }
			
			if( data.text ){
				wofh.country.text = data.text;
			}
			
			if( data.relations ){
				wofh.country.relations = data.relations;
				
				notifMgr.runEvent(Notif.ids.countryChange);
            }
			
			if( data.atkin !== undefined && wofh.country.atkin != data.atkin ){
				wofh.country.atkin = data.atkin;
				
				notifMgr.runEvent(Notif.ids.countryAttack);
            }
			
			if( data.mission !== undefined || data.mission_read !== undefined ){
				if( data.mission !== undefined )
					wofh.country.mission = data.mission;
				if( data.mission_read !== undefined )
					wofh.country.mission_read = data.mission_read;
				
				notifMgr.runEvent(Notif.ids.countryMission);
            }
            
			if( data.army !== undefined ){
				wofh.country.army = data.army;
				
				wofh.country.unpackArmy();
				
				notifMgr.runEvent(Notif.ids.countryArmy);
			}
			
			if( data.armytraining !== undefined ){
				wofh.country.armytraining = data.armytraining;
				
				wofh.country.unpackArmy();
				
				notifMgr.runEvent(Notif.ids.countryArmy);
			}
			
			if( data.ordersAccess !== undefined ){
				wofh.country.ordersAccess = data.ordersAccess;
				
				notifMgr.runEvent(Notif.ids.countryOrdersAccess);
			}
			
			if( data.wonder ){
				wofh.country.wonder = utils.copyProperties(wofh.country.wonder, data.wonder);
				
				wofh.account.updateTownsAura();
				
				notifMgr.runEvent(Notif.ids.countryWonder);
			}
			
			if( data.invited ){
				wofh.country.invited = data.invited;
				
				wofh.country.unpackInvited();
			}
			
			if( data.barter !== undefined ){
				wofh.country.barter = data.barter;
				
				notifMgr.runEvent(Notif.ids.countryBarter, wofh.country.barter);
			}
        }
    },
	
	sound: {
		enable: function(val, sndType){
			if( val != +val ) return;
			
			sndType.storageEnable(+val);
				
			notifMgr.runEvent(Notif.ids.sndEnable, sndType);
		},
		
		volume: function(val, sndType){
			if( val != +val ) return;
			
			sndType.storageVolume(+val);
			
			notifMgr.runEvent(Notif.ids.sndVolume, sndType);
		},
		
		globalVolume: function(val, useStorage){
			if( val != +val ) return;
			
			if( useStorage ){
				SndMgr.storageGlobalVolume(val, function(){
					sndMgr.setGlobalVolume(val, true);
					notifMgr.runEvent(Notif.ids.sndGlobalVolume);
				});
			}
			else{
				sndMgr.setGlobalVolume(val, true);
				notifMgr.runEvent(Notif.ids.sndGlobalVolume);
			}
		}
	},
	
	world: {
		/*Кешируем данные об городах, акках и странах*/
		/*a - towns, b-accounts, c-countries или a - {towns:{...}, accounts:{...}, countries:{...}}*/
		add: function(a, b, c){
			if(!b){
				if( a )
					wofh.world.parse(a.towns, a.accounts, a.countries);
			}
			else
				wofh.world.parse(a, b, c);
        }
	},
	
	global: {
		update: function(data){
			wofh.global = data;
			
			notifMgr.runEvent(Notif.ids.global);
		}
	},
	
	invite: function(data, time){
		set.world.add(data);
		
		if (data.acc == wofh.account.id) {
			if (data.add)
				wofh.account.invites.push({country: data.country, time: time});
			else {
				for(var i in wofh.account.invites){
					var invite = wofh.account.invites[i];
					
					if (invite.country == data.country) {
						wofh.account.invites.splice(i,  1);
					}
				}
			}
		
			notifMgr.runEvent(Notif.ids.accInvite);	
		}
		else if( wofh.country ){
			wofh.country.toggleInvite(data.acc, utils.toInt(data.add));
			
			notifMgr.runEvent(Notif.ids.countryInvite, {account: data.accounts[data.acc], toggle: utils.toInt(data.add)});
		}
	}
};