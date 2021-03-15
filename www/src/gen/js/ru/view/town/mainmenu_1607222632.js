/**
	Главное меню игры
*/

bMainMenu = function(){
	bMainMenu.superclass.constructor.apply(this, arguments);
};

utils.extend(bMainMenu, Block);
	
	
	bMainMenu.prototype.calcName = function(){
		return 'mmenu';
	};
	
	bMainMenu.prototype.calcTmplFolder = function(){
		return tmplMgr.mmenu;
	};
	
	bMainMenu.prototype.calcChildren = function(){
		this.children = {
			btns: bMMenu_btns, 
			defence: bMMenu_defence,  
			trade: bMMenu_trade,
			pop: bMMenu_pop, 
			towns: bMMenu_towns,
			attacks: bMMenu_attacks,
			toggleIf: bMMenu_toggleIf,
			luck: bMMenu_luck,
			mute: bMMenu_mute,
		};
		
		if( !LuckBonus.subscription.isOn() ){
			this.children.bonus = bMMenu_bonus;
		}
		
	};
	
	bMainMenu.prototype.bindEvent = function(){
		this.resize();
	};
	
	bMainMenu.prototype.resize = function(){
		var $wrp = this.cont.find('.mmenu-wrp'),
			$cont = $wrp.find('.mmenu-cont').toggleClass('-hidden', !Ability.map());
		
		$wrp.width($cont.width())
			.height($cont.height())
			.find('.mmenu-back')
			.width($cont.width()-80);
	};
	
	bMainMenu.prototype.moveRight = function(val){
		this.wrp.find('.mmenu-trCorner').toggleClass('-type-allRight', val)
	};
	
	bMainMenu.prototype.toggleLoadInd = function(show){
		if( this.loadInd )
			this.loadInd.toggle(true);
	};
	
	bMainMenu.prototype.toggleExt = function(ext){
		this.cont.toggleClass('-extended', ext)
	}
	
	//торговля

	bMMenu_trade = function(parent){
		bMMenu_trade.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMMenu_trade, Block);


    bMMenu_trade.prototype.calcName = function(){
        return 'trade';
    };

    bMMenu_trade.prototype.addNotif = function(){
        this.notif.show = [
            Notif.ids.townTraders, 
            Notif.ids.accBonus,//расширенная информация для царьакки
            Notif.ids.сhangeMarketType, 
            Notif.ids.countryBarter
        ];
        
        if( !this.canDisplay() )
            this.notif.show.push({id: Notif.ids.accQuests, params: Quest.ids.resSpend});
    };

    bMMenu_trade.prototype.canDisplay = function(){
        return wofh.town.traders.count > 0;
    };

	//бубен удачи

	bMMenu_luck = function(parent){
		bMMenu_luck.superclass.constructor.apply(this, arguments);
	};
		
    utils.extend(bMMenu_luck, Block);
    
    
    bMMenu_luck.prototype.calcName = function(){
        return 'luck';
    };
    
    bMMenu_luck.prototype.addNotif = function(){
        this.notif.show = [
            {id: Notif.ids.accQuests, params: [Quest.ids.luckBonus, Quest.ids.bldImm]},
            Notif.ids.accChest,//закрытие окна сундука,
            Notif.ids.accTownBonus,//выключение мигалки бонуса - купи или бонус кончится
            Notif.ids.accTownBonusAlarm,
            Notif.ids.accNewSpecialists // выключение мигалки для ВГ
        ];
    };


    bMMenu_luck.prototype.getTmplData = function(){
        var now = timeMgr.getNow(),
            bonus = wofh.account.getNextTownLuckBonusOver(now),
            data = {
                alarm: bonus && (bonus.time - LuckBonus.townAlarmPeriod) < now,
                alarmSpec: ls.getNewSpecialists(false),
                galaxy: this.canDisplayDayprize()
            };

        return data;
    };

    bMMenu_luck.prototype.canDisplay = function(){
        return Ability.luck();
    };
    
    
    bMMenu_luck.prototype.canDisplayDayprize = function(){
        return wofh.account.dayprize && wndMgr.getFirstWndByType(wChest) == false && !debug.hideDayprize();
    };
        
        
        
	//бубен акции

	bMMenu_bonus = function(parent){
		this.name = 'bonus';
		
		bMMenu_bonus.superclass.constructor.apply(this, arguments);
	};
		utils.extend(bMMenu_bonus, Block);

		bMMenu_bonus.rotateDelay = 10;//сколько висит один бонус пока не сменится другим
		bMMenu_bonus.premiumDelay = 0/*8 * 3600*/;//от загрузки страницы до окончания периода бонус для премиум аккаунтов не показывается
		bMMenu_bonus.animPeriod = 0.4;//длительность анимации вращения
		
		bMMenu_bonus.luck = -1;//индекс акции (предложение покупки МУ) в списке бонусов
		bMMenu_bonus.specialist = -2;//индекс акции (ВГ в подарок) в списке бонусов
		
        bMMenu_bonus.prototype.calcFullName = function(){
            return 'town-' + this.name;
		};
        
		bMMenu_bonus.prototype.addNotif = function(){
			this.notif.show = [
				Notif.ids.accLuck, 
				Notif.ids.townBuildings,
				Notif.ids.townGarrison,
				Notif.ids.townPop,
				Notif.ids.townRes,
				{id: Notif.ids.accQuests, params: Quest.ids.bldHouse3}
			];
		};

		bMMenu_bonus.prototype.getData = function(){
			var bonus = wofh.account.getCoinsLuckBonus(true, true),
				specialistBonus = wofh.account.getCoinsSpecialistBonus(true);
			
			this.data.bonuses = {};
			
			if ( Quest.isAvail(Quest.ids.bldHouse3) && (bonus || specialistBonus) ) {
				this.rotateDelay = 30;
				
				this.data.action = true;
				this.data.actionTitle = {};

				if( bonus ) {
					this.data.actionTitle[bMMenu_bonus.luck] = 'Получи Монеты Удачи в подарок';
					this.data.bonuses[bMMenu_bonus.luck] = bonus;
				}
				if( specialistBonus ){
					this.data.actionTitle[bMMenu_bonus.specialist] = 'Получи любого Великого Гражданина в подарок';
					this.data.bonuses[bMMenu_bonus.specialist] = specialistBonus;
				}
			} 
			else if ( (Quest.isAvail(Quest.ids.luckBonus) ) && ls.getBonusShow(0) < timeMgr.getNow()){
				this.rotateDelay = bMMenu_bonus.rotateDelay;
				
				this.data.bonuses = this.calcBonuses();
			}

			//отключаем таймер
			delete this.$bonus;
			
			this.clearTimeout(this.to);
			this.clearTimeout(this.toPremium);
			
			var delay = (timeMgr.servTime + bMMenu_bonus.premiumDelay - timeMgr.getNow() + 1) * 1000;
			
			if( delay > 0 )
				this.toPremium = this.setTimeout(this.show, delay);
			
			this.dataReceived();
		};
		
		bMMenu_bonus.prototype.afterDraw = function(){
			//пиздец причём полный. Этот код нужен для того, чтобы добавлять многоточие после контента            
			this.wrp.find('.luckTambourine-effect').each(function(id, wrp){
				var replacer = $('<span>...</span>');
				var $elems = $(wrp).find('.-nobr');
				var elemsLength = $elems.length;
				for (var i = $elems.length - 1; i > 0; i --){
					var $elem = $elems.eq(i);
					if ($elem.position().top < 20 && i == $elems.length - 1) {
						return;
					}
					$elem.replaceWith(replacer);
					if (replacer.position().top < 20) {
						return;
					}
				}
			});
			
			this.showNextBonus();
		};

		bMMenu_bonus.prototype.calcBonuses = function(){
			var bonusIds = [LuckBonus.ids.grown, LuckBonus.ids.culture, LuckBonus.ids.science, 
				LuckBonus.ids.sciencePack, LuckBonus.ids.production, LuckBonus.ids.productionPack, 
				LuckBonus.ids.traders, LuckBonus.ids.war, LuckBonus.ids.accountPremium];//проверяемые бонусы
			var bonuses = {};//активные бонусы

			for (var i in bonusIds){
				var bonusId = bonusIds[i];
				if (bonusId == LuckBonus.ids.accountPremium) {
					if (!wofh.account.isPremium() && timeMgr.getNow() - timeMgr.servTime > bMMenu_bonus.premiumDelay) {
						bonuses[bonusId] = 1;
					}
					continue;   
				}
				var bonus = wofh.town.getLuckBonus(bonusId);
				if (bonus.canUpNow() || bonusId == LuckBonus.ids.accountPremium){
					switch(bonusId){
						case LuckBonus.ids.grown:
							if (bonus.getTypedEffectUp() >= 10){
								bonuses[bonusId] = bonus;
							}
							break;
						case LuckBonus.ids.culture:
							if (wofh.town.pop.culture < (wofh.town.pop.has + wofh.town.pop.incReal)) {
								bonuses[bonusId] = bonus;
							}
							break;
						case LuckBonus.ids.science:
						case LuckBonus.ids.production:
							if (bonus.getUp().hasEffect()) {
								bonuses[bonusId] = bonus;
							}
						case LuckBonus.ids.sciencePack:
						case LuckBonus.ids.productionPack:
							if (wBonusTakeNow.canShow(bonus)) {
								bonuses[bonusId] = bonus;
							}
							break;
						case LuckBonus.ids.traders:
							if (wofh.town.traders.count >= 10 && wofh.town.traders.busy / wofh.town.traders.count > 0.8) {
								bonuses[bonusId] = bonus;
							}
							break;
						case LuckBonus.ids.war:
							if (wofh.town.army.own.clone().getBattleUnits().calcPop() > wofh.town.pop.has / 9) {//армия больше 10% населения (совокупного: армия+нас)
								bonuses[bonusId] = bonus;
							}
							break;
					}
				}   
			}

			return bonuses;
		};

		bMMenu_bonus.prototype.showNextBonus = function(){
			//ищем следующий бонус
			var $bonuses = this.wrp.find('.mmenu-bonus');

			if( $bonuses.length < 2 ) return;
			
			var $nextBonus;
			
			if( !this.$bonus ) {
				$bonuses.addClass('-hidden');
				
				$nextBonus = $bonuses.eq(utils.random($bonuses.length));
			} 
			else {
				$nextBonus = this.$bonus.next();
				
				if (!$nextBonus.length)
					$nextBonus = $bonuses.eq(0);                    
			}
			
			//начало анимации
			if( this.$bonus ){
				this.$bonus.removeClass('-turnStart');
				
				this.$bonus.addClass('-turnEnd');   
			}

			//середина анимации
			this.setTimeout(function(){
				if (this.$bonus) {
					this.$bonus.removeClass('-turnEnd');
					
					this.$bonus.addClass('-hidden');
				}
				
				this.$bonus = $nextBonus;
				
				this.$bonus.removeClass('-hidden');
				
				this.$bonus.addClass('-turnStart');
			}, bMMenu_bonus.animPeriod / 2 * 1000);

			//перезапуск цикла
			this.to = this.setTimeout(this.showNextBonus, this.rotateDelay * 1000);
		};

		bMMenu_bonus.prototype.bindEvent = function(){
			var self = this;
			
			//щёлк в бонус
			this.wrp
				.on('click', '.luckTambourine', function() {
					var type = $(this).data('id');
					if ( type == bMMenu_bonus.luck || type == bMMenu_bonus.specialist ) {
						wndMgr.addWnd(wShop);
					} else {
						var town = wofh.town;
						var bonus = town.getLuckBonus(type);

						wBonusTakeNow.show(bonus);   
					}
					return false;
				})
				//сокрытие бонуса
				.on('click', '.luckTambourine-close', function() {
					ls.setBonusShow(timeMgr.getNow() + wofh.account.offerhideperiod);//устанавливаем время до которого не будем показывать бонусы
					
					setTimeout(self.show.bind(self), (wofh.account.offerhideperiod + 1) * 1000);
					
					self.show();
				});
		};



	//население

	bMMenu_pop = function(parent){
		bMMenu_pop.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMMenu_pop, Block);
    
    
    bMMenu_pop.prototype.calcName = function(){
        return 'pop';
    };
    
    bMMenu_pop.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.townPop, Notif.ids.townPopHas, Notif.ids.townPopSpread, {id: Notif.ids.accQuests, params: [Quest.ids.bldHouse3, Quest.ids.popSpread, Quest.ids.popSpread2]}];
    };
    
    bMMenu_pop.prototype.getData = function(){
        this.data = utils.clone(wofh.town.getPop());
        
        var maxTownWorkPop = utils.toInt(wofh.town.calcMaxWorkPop(true)); // Максимумальное количество рабочих мест, для населения города, которое можно использовать
        var curWorkPop = wofh.town.getSlots().calcPop();
        
        this.data.ext = {};
        this.data.ext.lessPop = utils.sizeOf(wofh.towns) == 1 && wofh.account.pop <= 100;
        this.data.ext.noPop = maxTownWorkPop == 0;
        this.data.ext.townWorkPop = this.data.ext.noPop ? 1 : (curWorkPop / maxTownWorkPop);
        this.data.ext.blink = this.data.ext.townWorkPop <= 0.9;
        this.data.ext.maxWorkPop = utils.toInt(wofh.town.getSlots().calcMaxPop({realProduce:true})); // Максимумальное количество рабочих мест, которое можно использовать
        
        
        this.checkLessPopLimit();
        
        this.dataReceived();
    };
    
    bMMenu_pop.prototype.canDisplay = function(){
        return Ability.popSpread();
    };
    
    bMMenu_pop.prototype.checkLessPopLimit = function(){
        if( !this.data.ext.lessPop ) return;

        if( this.data.has >= this.data.culture )
            this.data.ext.lessPopLimit = bMMenu_pop.lessPopLimitIds.already;
        else if( this.data.has+this.data.incReal >= this.data.culture )
            this.data.ext.lessPopLimit = bMMenu_pop.lessPopLimitIds.soon;
        else
            this.data.ext.lessPopLimit = bMMenu_pop.lessPopLimitIds.no;

        this.data.ext.lessPopAlarm =	
                                    this.data.ext.lessPopLimit != ls.getLessPopLimit(bMMenu_pop.lessPopLimitIds.no) &&
                                    this.data.ext.lessPopLimit != bMMenu_pop.lessPopLimitIds.no;
    };
    
    bMMenu_pop.prototype.afterDraw = function(){
        if( this.data.ext.lessPopAlarm ){
            var self = this;

            this.wrp
                .find('.mmenu-pop-limitAlert')
                .one('mouseenter', function(){
                    var $this = $(this);

                    ls.setLessPopLimit(self.data.ext.lessPopLimit);

                    self.setTimeout(function(){
                        $this.removeClass('-anim-blink2');
                    }, 2000);
                });
        }
    };

    bMMenu_pop.lessPopLimit = {
        0: {name:'no'},
        1: {name:'already', text:'Внимание. Население твоего города достигло культурного предела и перестало расти. Стоит улучшить или построить культурные здания. Например Алтарь или Обелиск.'},
        2: {name:'soon', text:'Внимание. Население твоего города приближается к культурному пределу. После того как оно достигнет максимума — перестанет расти. Стоит улучшить или построить культурные здания. Например Алтарь или Обелиск.'}
    };

    utils.createIds(bMMenu_pop.lessPopLimit, bMMenu_pop.lessPopLimitIds = {});
	
	
    
	bMMenu_defence = function(parent){
		bMMenu_defence.superclass.constructor.apply(this, arguments);
	};
    utils.extend(bMMenu_defence, Block);
    
    
    bMMenu_defence.prototype.calcName = function(){
        return 'defence';
    };
    
    bMMenu_defence.prototype.calcFullName = function(){
        return 'town-' + this.name;
    };

    bMMenu_defence.prototype.addNotif = function(){
        this.notif.show = [
            Notif.ids.townAttacks,
            Notif.ids.accBonus,//включение царьакки
        ];
    };

    bMMenu_defence.prototype.getData = function(){
        if ( Town.hasDefMoment(wofh.town.army) )
            this.data.defmoment = wofh.town.army.defmoment;

        if( wofh.account.isPremium() )
            this.data.attacks = wofh.events.getAccAttacks().getList().length;

        this.dataReceived();
    };

    bMMenu_defence.prototype.canDisplay = function(){
        return this.data.defmoment || this.data.attacks;
    };

    bMMenu_defence.prototype.bindEvent = function(){
        var self = this;

        this.wrp.on('click', '.mmenu-peace', function(){
            wndMgr.addModal(self.tmpl.alert.peace());
        });
    };


	//кнопки

	bMMenu_btns = function(parent){
		bMMenu_btns.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
		
		utils.extend(bMMenu_btns, Block);

		
		bMMenu_btns.prototype.calcName = function(){
			return 'btns';
		};
		
		bMMenu_btns.prototype.calcChildren = function(){
			this.children = {
				science: bMMenu_btns_science,
				money: bMMenu_btns_money
			};
		};

		bMMenu_btns.prototype.addNotif = function(){
			this.notif.show = [
				Notif.ids.accMoney,
				Notif.ids.countryChange,
				Notif.ids.accBonus,//кнопка царьакка
				Notif.ids.countryAttack,//для мигалки на флаге
				Notif.ids.accInvite,//для мигалки инвайтов в стране
				{id: Notif.ids.accAbilities, params: [Ability.ids.science, Ability.ids.money]},
				{id: Notif.ids.accQuests, params: [Quest.ids.map, Quest.ids.rep, Quest.ids.message, Quest.ids.bldAltair1, Quest.ids.sciSelect]}
			];

			if( !debug.isAdmin() ){
				this.notif.show.push(Notif.ids.accMessageNew);
				this.notif.show.push(Notif.ids.accReportNew);
			}
			
			this.notif.other[Notif.ids.accAbilitiesWnd] = function(id){
				this.setTimeout(function(){
					var type = '.-type-'+utils.cnstName(Ability.ids, id),
                        $el = this.cont.find('.mmenu-btnBig'+type+', .mmenu-btn'+type);
					
					$el.addClass('-anim-splash');
                    
                    this.setTimeout(function(){
                        $el.removeClass('-anim-splash');
                    }, 2000);
				}, 1000);
			};
		};
		
		bMMenu_btns.prototype.getData = function(){
			this.data.ext = this.calcSize();
			
			this.data.btns = this.data.btns||[
				new MMBtn_towns(this),
				new MMBtn_map(this),
				new MMBtn_report(this),
				new MMBtn_message(this),
				new MMBtn_rate(this),
				new MMBtn_country(this)
			];
			
			this.dataReceived();
		};
		
		bMMenu_btns.prototype.calcSize = function(){
			//дублируются условия из шаблона!
			var count = 0;
			
			if (wofh.account.isPremium()) count++;
			if (wofh.account.ability.get(Ability.ids.map)) count++;
			if (wofh.account.ability.get(Ability.ids.report)) count++;
			if (wofh.account.ability.get(Ability.ids.message)) count++;
			if (Ability.showRate()) count++;
			if (wofh.country || wofh.account.research.build[Slot.ids.embassy] || wofh.account.research.build[Slot.ids.embassyAfro]) count++;
			if (Quest.isAvail(Quest.ids.sciSelect) && ScienceList.hasAvail(wofh.country)) count++;
			if (wofh.account.knowsMoney()) count++;

			var ext = count!=0 && count<=3;

			this.parent.toggleExt(ext);
			
			return ext;
		};
	
	
		// Кнопка денег
		
		bMMenu_btns_money = function(parent){
			this.name = 'money';
			
			bMMenu_btns_money.superclass.constructor.apply(this, arguments);
		};

			utils.extend(bMMenu_btns_money, Block);

			bMMenu_btns_money.prototype.addNotif = function(){
				this.notif.show.push(Notif.ids.accMoneyIter);
			};

			bMMenu_btns_money.prototype.getData = function(){
				this.data.money = {};
				this.data.money.sum = wofh.account.money.sum;
				this.data.money.reserve = wofh.account.money.reserve||0;
				this.data.money.treasury = this.data.money.sum-this.data.money.reserve;
				this.data.money.inc = wofh.account.getMoneyInc();
				
				this.data.ext = this.parent.data.ext;
				
				this.data.btn = this.data.btn||new MMBtn_money(this);
				
				this.dataReceived();
			};
			
		//кнопка науки

		bMMenu_btns_science = function(parent){
			this.name = 'science';
			
			bMMenu_btns_science.superclass.constructor.apply(this, arguments);
		};

			utils.extend(bMMenu_btns_science, Block);

			bMMenu_btns_science.prototype.addNotif = function(){
				this.notif.show = [
					Notif.ids.accScienceHas,
				];
			};

			bMMenu_btns_science.prototype.getData = function(){
				this.data = {};

				this.data.science = new Science(Science.getScienceData(true).current);
				this.data.scienceNext = new Science(Science.getScienceData(true).next);
				
				this.data.ext = this.parent.data.ext;
				
				this.data.btn = this.data.btn||new MMBtn_science(this);
				
				this.dataReceived();
			};
		
	// список городов

	bMMenu_towns = function(parent){
		bMMenu_towns.superclass.constructor.apply(this, arguments);
	};
	
		utils.extend(bMMenu_towns, Block);
		
		bMMenu_towns.prototype.calcName = function(){
			return 'towns';
		};
		
		bMMenu_towns.prototype.addNotif = function(){
			this.notif.show = [
				Notif.ids.townName, 
				Notif.ids.accTowns, 
				Notif.ids.accBonus,//раскраска городов у царьакки
				Notif.ids.townPopSpread,
				{id: Notif.ids.accQuests, params: Quest.ids.townRename}
			];

			this.notif.other[Notif.ids.townCur] = 
			this.notif.other[Notif.ids.townEnter] = function(){
				if(this.wrp){
					//не перерисовываем компонент полностью при смене текущего города чтобы панель компонента закрывалась плавно.
					this.wrp.find('.mmenu-towns-name').text(utils.unescapeHtml(wofh.town.name));
					this.wrp.find('.mmenu-towns-item').removeClass('-active');
					this.wrp.find('.mmenu-towns-item[data-id="'+wofh.town.id+'"]').addClass('-active');
				}
			};
		};

		bMMenu_towns.prototype.getData = function(){
			this.data = {};
			
			this.data.towns = [];
			
			for(var town in wofh.towns){
				this.data.towns.push(wofh.towns[town]);
			}
			
			this.data.towns.sort(function(a, b){
				return a.id - b.id;
			});

			this.dataReceived();
		};

		bMMenu_towns.prototype.bindEvent = function(){
			var self = this;
			
			// Выбор города
			this.wrp
				.on('click', '.mmenu-towns-sel', function(){
					self.wrp.find('.mmenu-towns').focus();
					
					self.togglePanel();
				})
				.on('focusout', '.mmenu-towns', function(){
					self.togglePanel(false);
				})
				.on('click', '.mmenu-towns-list a', function(){
					self.togglePanel();
					
					self.resize();
					
					appl.setTown(+$(this).data('id'));
				});
		};

		bMMenu_towns.prototype.togglePanel = function(state){
			this.cont.toggleClass('-expanded', state);
		};

		bMMenu_towns.prototype.updWidth = function(){
			var width = 0;
			
			this.wrp.find('span').each(function(){
				width = Math.max(width, $(this).width());
			});
			
			var townName = snip.wrp(wofh.town.name);
			
			this.wrp.append(townName);
			
			width = Math.max(width, townName.width()+8);
			
			townName.remove();

			this.wrp.find('form').width(width + 47);
		};

	//атаки на аккаунт

	bMMenu_attacks = function(parent){
		bMMenu_attacks.superclass.constructor.apply(this, arguments);
	};
    
    utils.extend(bMMenu_attacks, Block);
    
    
    bMMenu_attacks.prototype.calcName = function(){
        return 'attacks';
    };
    
    bMMenu_attacks.prototype.calcTmplFolder = function(){
        return tmplMgr.mmenu.attacks;
    };
    
    bMMenu_attacks.prototype.addNotif = function(){
        this.notif.show = [Notif.ids.townAttacks];
    };
    
    bMMenu_attacks.prototype.getData = function(){
        this.data = wofh.events.getTownMilitaryMoves(wofh.town);

        this.dataReceived();
    };
    
    bMMenu_attacks.prototype.$getAttackByType = function(type){
        var $el = $();

        if( this.wrp && typeof(type) == 'string' )
            $el = this.wrp.find('.iconAttacks.-type-' + type);

        return $el;
    };
    
    bMMenu_attacks.prototype.$getAttackIn = function(){
        return this.$getAttackByType('attackIn');
    };
    
	//отключение интерфейсов

	bMMenu_toggleIf = function(parent){
		this.name = 'toggleIf';
		bMMenu_toggleIf.superclass.constructor.apply(this, arguments);
	}
		utils.extend(bMMenu_toggleIf, Block);
		
		bMMenu_toggleIf.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.accQuests];
		};
		
		bMMenu_toggleIf.prototype.getData = function(){
			this.dataReceived();
		};

		bMMenu_toggleIf.prototype.bindEvent = function(){
			var self = this;

			this.wrp.on('click', '.js-mmenu-toggleIf', function(){
				wndMgr.toggleInterface();
			});
		};

	bMMenu_mute = function(parent){
		bMMenu_mute.superclass.constructor.apply(this, arguments);
	};
	
		utils.extend(bMMenu_mute, Block);
		
		bMMenu_mute.prototype.calcName = function(){
			return 'mute';
		};
		
		bMMenu_mute.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.sndGlobalVolume];
		};
		
		bMMenu_mute.prototype.getData = function(){
			this.data.active = SndMgr.storageGlobalVolume() != Snd.volume.min;

			this.dataReceived();
		};

		bMMenu_mute.prototype.bindEvent = function(){
			this.wrp.on('click', '.mmenu-mute', function(){
				set.sound.globalVolume($(this).hasClass('-active') ? Snd.volume.min : Snd.volume.max, true);
			});
		};





// Упрощеная менюшка (только кнопки и торговля) 
bShortMainMenu = function(){
	bShortMainMenu.superclass.constructor.apply(this, arguments);
};

utils.extend(bShortMainMenu, Block);
	
	
	bShortMainMenu.prototype.calcName = function(){
		return 'smmenu';
	};
	
	bShortMainMenu.prototype.calcTmplFolder = function(){
		return tmplMgr.smmenu;
	};
	
	bShortMainMenu.prototype.getData = function(){
		this.data.opened = ls.getMapToggleMenu(true);
		
		bShortMainMenu.superclass.getData.apply(this, arguments);
	};
	
	bShortMainMenu.prototype.bindEvent = function(){
		var self = this;

		this.wrp.on('click', '.smmenu-toggle', function(){
			var $menu = $(this).closest('.view-smmenu').toggleClass('-type-opened'),
				toggle = $menu.hasClass('-type-opened');
			
			ls.setMapToggleMenu(toggle);
			
			self.parent.children.minimap.toggleInTown(!toggle);
		});
	};
	
	bShortMainMenu.prototype.calcChildren = function(){
		this.children.btns = bSMMenu_btns;
		
		this.children.trade = bMMenu_trade;
	};
	
	bShortMainMenu.prototype.resize = function(){
		var $cont = this.cont.find('.smmenu-wrps');
		
		this.cont.width($cont.width());
	};
	
	
	
	bSMMenu_btns = function(parent){
		bSMMenu_btns.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
		
		utils.extend(bSMMenu_btns, bMMenu_btns);
		
		
		bSMMenu_btns.prototype.calcName = function(){
			return 'btns';
		};
		
		bSMMenu_btns.prototype.calcChildren = function(){
			this.children.money = bMMenu_btns_money;
			this.children.science = bMMenu_btns_science;
		};
		
		bSMMenu_btns.prototype.getData = function(){
			this.data.btns = this.data.btns||this.getBtns();
			
			this.dataReceived();
		};
		
		
		bSMMenu_btns.prototype.getBtns = function(){
			return [
				new MMBtn_towns(),
				new MMBtn_town(),
				new MMBtn_report(),
				new MMBtn_message(),
				new MMBtn_rate(),
				new MMBtn_country()
			];
		};