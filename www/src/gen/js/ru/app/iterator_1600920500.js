
/* пошаговые изменения
 * - ресурсы на складе
 * - проценты строительства
 * - изменение науки
 * - количество населения
 * - ...
 */

Iterator = function(){
    this.init();
};

Iterator.prototype.init = function(){
	this.inited = false;
	
    this.bind();
	
    this.calcUpdates();
	
	this.inited = true;
};


Iterator.prototype.isInited = function(){
	return this.inited||false;
};
//перезапуск обновлений
//подменять своей функцией
Iterator.prototype.calcUpdates = function(){      
    //основной код
    if( !this.calcUpdateInner() )
		return;

	//сразу же запуск события на обновление
	this.runUpdate();

	//проверка следующего обновления
	this.checkNextUpdate();
};
   
//поиск следующего обновления и запуск таймера
Iterator.prototype.checkNextUpdate = function() {
    clearTimeout(this.timer);
    
    var time = this.getNextUpdateTime();
    if (!time) return;
	
    var delayS = time - timeMgr.getNow();//задержка в секундах
    
	// Иначе проблемы с слишком большими числами
	if ( delayS > Iterator.longDelay ){
		delayS = Iterator.longDelay;
		
		var prolong = true;
	}
	else if( delayS < 0 ){
		this.ended();
		
		return;
	}
	
    this.timer = setTimeout(this.run.bind(this, prolong), delayS * 1000);
};

Iterator.prototype.run = function(prolong){
	// Повторить пересчет итератора если он должен сработь через большой промежуток времени (больший чем Iterator.longDelay)
	if( prolong ){
		this.calcUpdates();
		
		return;
	}
	
	this.update();
	this.runUpdate(true);
	this.checkNextUpdate();
};

Iterator.prototype.ended = function(){};

//действия при обновлении - возвращает, стоит ли обновлять
Iterator.prototype.calcUpdateInner = function() {};

//момент наступления следующего события
Iterator.prototype.getNextUpdateTime = function(){};
    
//действия перед обновлением
Iterator.prototype.update = function(){};

// запуск события обновления
// Если timerUpd истина - итератор обновляется по таймеру а не по нотификации
Iterator.prototype.runUpdate = function(timerUpd){};

//приклепление итератора к событиям
Iterator.prototype.bind = function(){};



Iterator.longDelay = 24 * 3600;

/*
 * Проценты строительства 
 */

var BldPercIterator = function(){
    this.init();
};

    utils.extend(BldPercIterator, Iterator);

    //действия при обновлении
    BldPercIterator.prototype.calcUpdateInner = function(){   
        var queue = wofh.events.getBldQueue(false, wofh.town);

        if (!queue.getLength()){
			this.perc = 100; // Отрубаем итератор для события, которое до этого итерировалось (возможно в случае ускорения строительства)
			
			return false;
		}

        this.event = queue.getFirst();
        
		this.perc = utils.toInt(wofh.events.getBldQueueProgress() * 100);
		
        if (this.perc > 100) return false;

        return true;
    };

    //момент наступления следующего события
    BldPercIterator.prototype.getNextUpdateTime = function(){   
        if (this.perc >= 100) return false;
		
        return this.calcMomentByPerc(this.perc+1);
    };

    //действия перед обновлением
    BldPercIterator.prototype.update = function(){
        this.perc = Math.min(this.perc+1, 100);
    };
	
    //запуск события обновления
    BldPercIterator.prototype.runUpdate = function(){
        notifMgr.runEvent(Notif.ids.townBuildQueuePerc, this.perc);
    };

    //подключение к оповещениям
    BldPercIterator.prototype.bind = function(){
        var self = this;
		
        notifMgr.addListener(Notif.ids.townBuildQueue, 'update', function(){
            self.calcUpdates();
        });
    };


    BldPercIterator.prototype.calcMomentByPerc = function(perc){
        return this.event.getTime() - (1 - perc/100) * this.event.getActionTime();
    };
	
	BldPercIterator.prototype.ended = function(){
		this.run();
	};

/*
 * Текущее количество ресурсов
 */

ResHasIterator = function(){
    //минимальное и максимальное обновление ресурсов
	this.minDelay = 2;
	this.maxDelay = 3600;
    
    this.init();
};

utils.extend(ResHasIterator, Iterator);
	
//действия при обновлении
ResHasIterator.prototype.calcUpdateInner = function(){  
    for (var res in wofh.town.stock.getList()) {
        res = wofh.town.stock.getElem(res);
        res.calcTimeUpdate();
    }

    return true;
};

//момент наступления следующего события
ResHasIterator.prototype.getNextUpdateTime = function(){
	//подсчитываем время следующего изменения ресурсов и те ресурсы, которые поменяются
    this.resHasIterator = [];

    var now = timeMgr.getNow();

    var minDelay = now + this.minDelay;
    var update = now + this.maxDelay;

    for (var res in wofh.town.stock.getList()) {
        res = wofh.town.stock.getElem(res);
        if (res.updateHour == 0) continue;
        if (!res.isStockable()) continue;
        if (res.has == wofh.town.stock.max && res.updateHour > 0) continue;
        if (res.has == 0 && res.updateHour < 0) continue;
        if (res.upd <= update) {
            if (update == minDelay)
                this.resHasIterator.push(res);
            else
                this.resHasIterator = [res];
            
            update = Math.max(minDelay, res.upd);
        }
    }
	
    return update;
};

//действия перед обновлением
ResHasIterator.prototype.update = function(){
    for(var res in this.resHasIterator) {
        res = this.resHasIterator[res];
        
		res.updHas();
        
		res.calcTimeUpdate();
        
		if (res.isGrown() && !res.isFood()) {
            wofh.town.stock.fixFood();
        }
    }
};
    
//запуск события обновления
ResHasIterator.prototype.runUpdate = function(){
    for(var res in this.resHasIterator) {
        res = this.resHasIterator[res];
        if (res.isGrown() && !res.isFood()) {
            var resFood = wofh.town.stock.getElem(Resource.ids.food);
			
            notifMgr.runEvent(Notif.ids.townResHas, resFood);
        }
		notifMgr.runEvent(Notif.ids.townResHas, res);
    }
};
	
//подключение к оповещениям
ResHasIterator.prototype.bind = function(){
    var self = this;
	
    notifMgr.addListener(Notif.ids.townRes, 'iterRes', function(opt){
		opt = opt||{};
		
		if( opt.clean ) delete self.resHasIterator;
		
		if( opt.forceUpdate ){
			wofh.town.stock.updResHas();
			
			self.update();
		}
		
        self.calcUpdates();
    });
	notifMgr.addListener(Notif.ids.townResUpd, 'iterRes', function(){
		self.update();
		
        self.calcUpdates();
    });
};

ResHasIterator.prototype.checkNextUpdate = function() {
    clearTimeout(this.timer);
    
    var time = this.getNextUpdateTime();
    if (!time) return;
	
    var delayS = time - timeMgr.getNow();//задержка в секундах
    
	// Иначе проблемы с слишком большими числами
	if ( delayS > Iterator.longDelay ){
		delayS = Iterator.longDelay;
		
		var prolong = true;
	}
	else if( delayS < 0 ){
		this.ended();
		
		return;
	}
	
    this.timer = setTimeout(this.run.bind(this, prolong), delayS * 1000);
};

/*
 * Прогресс науки
 */

SciProgIterator = function(){
	this.delay = 20;
	
    this.init();
};

utils.extend(SciProgIterator, Iterator);
	
//действия при обновлении
SciProgIterator.prototype.calcUpdateInner = function(){
	var scienceData = Science.getScienceData(true);
	
	if( scienceData.incReal ){
		var timeProgress = (timeMgr.getNow() - scienceData.updated)/3600,
			availScienceList = ScienceList.getAll().filterKnown(Science.known.avail, true).getList(),
			progressLength = Object.keys(availScienceList).length - (scienceData.current == Science.debt ? 0 : 1), // Количествоизучаемых наук не включая текущую
			otherLearningByScience = (progressLength > 0) ? lib.science.otherlearning/progressLength : 0, // Значение инкримента для каждой из изучаемых наук НЕ включая текущую
			learning;
			
		if( scienceData.current == Science.debt ){
			scienceData.debt = Math.max(0, utils.toInt(scienceData.debtWas - timeProgress * scienceData.incReal));
			
			// Задолженность погашена
			if( !scienceData.debt )
				scienceData.current = Science.no;
		}
		
		for(var key in availScienceList){
			if( key == scienceData.current )
				learning = 1 + (progressLength ? 0 : lib.science.otherlearning);
			else
				learning = otherLearningByScience;

			scienceData.progress[key] = (scienceData.progressWas[key]||0) + (timeProgress * scienceData.incReal * learning);
		}
	}
    
    return true;
};

//момент наступления следующего события
SciProgIterator.prototype.getNextUpdateTime = function(){   
    return timeMgr.getNow() + this.delay; // Фиксированное обновление
};
    
//запуск события обновления
SciProgIterator.prototype.runUpdate = function(){
    this.calcUpdateInner();
	
	var now = timeMgr.getNow();
	
	if( !this.updDelay || now > this.updDelay ){
		this.updDelay = this.calcUpdDelay(now);
		
		notifMgr.runEvent(Notif.ids.accScienceHas);
	}
};

//действия перед обновлением
SciProgIterator.prototype.calcUpdDelay = function(now){
	var scienceData = Science.getScienceData(true);
	
	if( !scienceData.incReal )
		return now + timeMgr.DtS;
	
	var minRest = 999999999999;
	
	for(var sciId in scienceData.progress){
		var progress = scienceData.progress[sciId],
			rest = Science.get(sciId).getCost() - progress;
		
		if( rest < minRest ){
			minRest = Math.max(0, rest);
			
			if( !minRest )
				return 0;
		}
	}
	
	if( scienceData.debt && scienceData.debt < minRest )
		minRest = scienceData.debt;
	
	minRest *= 0.01; // Берём 1 процент от минимально остатка
	
	var timeLeftForOnePerc = (minRest / scienceData.incReal) * timeMgr.HtS;
	
	timeLeftForOnePerc = Math.min(timeLeftForOnePerc, timeMgr.DtS);
	
	if( timeLeftForOnePerc < this.delay )
		return 0;
	
	return now + timeLeftForOnePerc;
};

//подключение к оповещениям
SciProgIterator.prototype.bind = function(){
    var self = this;
	
    notifMgr.addListener(Notif.ids.accScience, 'iterSci', function(){
		self.updDelay = 0;
		
        self.calcUpdates();
    });
};



/*
 * Население
 */

PopIterator = function(){
    this.init();
};

    utils.extend(PopIterator, Iterator);

    //действия при обновлении - возвращает, стоит ли обновлять
    PopIterator.prototype.calcUpdateInner = function(){   
        return !this.stopUpd();
    };

    //момент наступления следующего события
    PopIterator.prototype.getNextUpdateTime = function(){
		if( !(wofh.town.pop.incReal > 0) ) return false;
		
		var nextVal = Math.ceil(wofh.town.pop.has) + 0.01,
			time = (nextVal - wofh.town.pop.was) / (wofh.town.pop.incReal / 24 / 3600) + wofh.town.pop.upd;
		
        return time;
		
        /*
		if( wofh.town.pop.incReal == 0 ) return false;
		
		
        if(wofh.town.pop.incReal>0){
            var nextVal = Math.ceil(wofh.town.pop.has) + 0.01;
        } else{
            var nextVal = Math.floor(wofh.town.pop.has) - 0.01;
        }
		var time = (nextVal - wofh.town.pop.was) / (wofh.town.pop.incReal / 24 / 3600) + wofh.town.pop.upd;
		 
        return time;
		*/
    };

    //действия перед обновлением
    PopIterator.prototype.update = function(){
		// Пересчитываем население города, только при его росте
		if( wofh.town.pop.incReal > 0 )
			wofh.town.pop.has = wofh.town.getPopHasNow();
		
		if( this.stopUpd() ){
			wofh.town.pop.incReal = 0;
			
			if( wofh.town.pop.inc > 0 )
				wofh.town.pop.has = wofh.town.pop.culture;
			else
				wofh.town.pop.has = lib.town.population.min;
		}
    };

    //запуск события обновления
    PopIterator.prototype.runUpdate = function(){
        notifMgr.runEvent(Notif.ids.townPopHas, this.perc);
    };

    //подключение к оповещениям
    PopIterator.prototype.bind = function(){
        var self = this;
		
        notifMgr.addListener(Notif.ids.townPop, 'update', function(opt){
			opt = opt||{};
			
			if( opt.forceUpdPopIter && !self.stopUpd() ) self.update();
			
            self.calcUpdates();
        });
    };
	
	PopIterator.prototype.ended  = function(){
		this.run();
    };
	
	
	PopIterator.prototype.stopUpd  = function(){
		// pop.inc - учитываем убыль населения от домиков
		var pop = wofh.town.pop;
		
		return (( (pop.has >= pop.culture && pop.incReal > 0) || (pop.has <= pop.culture && pop.incReal < 0)) && pop.inc > 0) || (utils.toInt(pop.has) <= lib.town.population.min && pop.inc < 0);
    };
	
/*
 * События
 */

EventIterator = function(){
    this.init();
};
	
    utils.extend(EventIterator, Iterator);
	
    //действия при обновлении
    EventIterator.prototype.calcUpdateInner = function(){
		if( this.getEvents().getLength() )
			return true;
		else
			clearTimeout(this.timer); // Если после обновления по сокету событий не осталось, чистим таймер
		
		return false;
    };
	
    //момент наступления следующего события
    EventIterator.prototype.getNextUpdateTime = function(){
		if( this.firstEvent )
			return this.firstEvent.time;
    };
	
    //действия перед обновлением
    EventIterator.prototype.update = function(){
        set.events.del(this.firstEvent);
    };
	
    //запуск события обновления
    EventIterator.prototype.runUpdate = function(){
		this.firstEvent = this.getEvents().getSortList('time', true).getFirst();
    };
	
    //подключение к оповещениям
    EventIterator.prototype.bind = function(){
        var self = this;
		
        notifMgr.addListener(Notif.ids.event, 'update', function(){
			self.calcUpdates();
        });
		notifMgr.addListener(Notif.ids.townFleet, 'update', function(fleet){
			var event = wofh.events.getElem(false, fleet.getEventId()),
				needUpdate = false;
			
			if( event ){
				wofh.events.delElem(event);
				
				needUpdate = true;
			}
			
			if( fleet.isEvent() ){
				wofh.events.addFleetEvent(fleet);
				
				needUpdate = true;
			}
			
			if( needUpdate )
				self.calcUpdates();
        });
		notifMgr.addListener(Notif.ids.townFleetDel, 'update', function(fleet){
			var event = wofh.events.getElem(false, fleet.getEventId());
			
			if( event ){
				wofh.events.delElem(event);
				
				self.calcUpdates();
			}
		});
    };
	
	EventIterator.prototype.ended = function(){
		this.run();
	};
	// Получаем список событий, завершение которых должно отслеживаться на клиенте
	EventIterator.prototype.getEvents = function(){
		return wofh.events.clone().filter(function(event){
			/*
				Завершение событий постройки не отслеживается итератором.
				Обработка данного события происходит при получении сокет данных с новым состоянием домиков.
			*/
			return event.getType() != EventCommon.type.buildI;
		});
	};
	
	
	
/*
 * Деньги аккаунта
 */

MoneyIterator = function(){
    //минимальное и максимальное обновление ресурсов
	this.delay = 10;
    
    this.init();
};

utils.extend(MoneyIterator, Iterator);
	
//действия при обновлении
MoneyIterator.prototype.calcUpdateInner = function(){
    return wofh.account.getMoneyInc() > 0 || wofh.account.money.sum > 0;
};

MoneyIterator.prototype.update = function(){   
    var money = wofh.account.money,
		inc = wofh.account.getMoneyInc();
	
	if( inc >= 0 || money.sum > 0 ){
		var timeProgress = (timeMgr.getNow() - money.updated)*timeMgr.invHtS;
		
		if( wofh.country ){
			var dutyChange = false;
			
			// money.deck - коэффициент (множитель) выплаты налогов игроком (от 0 до 1, если undefined то deck == 1)
			// money.deck == 0 - полное отключение налогов
			// money.deck == [0,1] - частичное отключение налогов
			// money.deck == undefined || money.deck == 1 - налоги включены
			if( money.deck == 0 ){
				money.duty = money.dutyWas + (timeProgress * wofh.account.getMoneyTaxInc());
				
				dutyChange = true;
			}
			else if( money.deck ){
				money.duty = money.dutyWas - (timeProgress * wofh.account.getMoneyInc(true));
				
				dutyChange = true;
			}
			
			// Если долг стране был изменен (dutyChange == true), не изменяем его второй раз
			if( !dutyChange && money.duty > 0 ){
				money.duty = money.dutyWas - (timeProgress * inc);
				
				if( money.duty <= 0 ){
					money.duty = 0;
					
					money.updated = timeMgr.getNow();
				}
			}
			else
				money.sum = money.sumWas + (timeProgress * inc);
		}
		else
			money.sum = money.sumWas + (timeProgress * inc);
		
		if( money.sum < 0 )
			money.sum = 0;
	}
};

//момент наступления следующего события
MoneyIterator.prototype.getNextUpdateTime = function(){   
    return timeMgr.getNow() + this.delay; // Фиксированное обновление
};
    
//запуск события обновления
MoneyIterator.prototype.runUpdate = function(){
    notifMgr.runEvent(Notif.ids.accMoneyIter);
};
	
//подключение к оповещениям
MoneyIterator.prototype.bind = function(){
    var self = this;
	
    notifMgr.addListener(Notif.ids.accMoney, 'update', function(){
        self.calcUpdates();
    });
};

/*
 * Окончание бонусов (пока только ЦАК)
 */

AccBonusIterator = function(){
    this.init();
};

utils.extend(AccBonusIterator, Iterator);

//действия при обновлении
AccBonusIterator.prototype.calcUpdateInner = function(){
    return wofh.account.isPremium();
};

//момент наступления следующего события
AccBonusIterator.prototype.getNextUpdateTime = function(){   
    return wofh.account.bonus.premium||0;
};

//запуск события обновления
AccBonusIterator.prototype.runUpdate = function(timerUpd){
	if( timerUpd )
		notifMgr.runEvent(Notif.ids.accBonus, {iterator:true});
};

//подключение к оповещениям
AccBonusIterator.prototype.bind = function(){
    var self = this;
	
    notifMgr.addListener(Notif.ids.accBonus, 'iterator', function(opt){
		opt = opt||{};
		
		if( opt.iterator ) return;
		
        self.calcUpdates();
    });
};


/*
 * Окончание бонусов для городов
 */

TownsBonusAlarmIterator = function(){
    this.init();
};

utils.extend(TownsBonusAlarmIterator, Iterator);

//действия при обновлении - возвращает, стоит ли обновлять
TownsBonusAlarmIterator.prototype.calcUpdateInner = function(){
	return true;
};

TownsBonusAlarmIterator.prototype.runUpdate = function(timerUpd){
	if( timerUpd )
		notifMgr.runEvent(Notif.ids.accTownBonusAlarm);
};

//момент наступления следующего события
TownsBonusAlarmIterator.prototype.getNextUpdateTime = function(){   
	var now = timeMgr.getNow(),
		bonus = wofh.account.getNextTownLuckBonusOver(now),
		alarmMoment = 0,
		time = 0;
	
	if( bonus ){
		alarmMoment = bonus.time - LuckBonus.townAlarmPeriod;
		
		if( alarmMoment < now )
			time = bonus.time; // Если до отключения бонуса осталось времени меньше чем LuckBonus.townAlarmPeriod, устанавливаем таймер на отключение мигалки
		else
			time = alarmMoment; // Если до отключения бонуса осталось времени больше чем LuckBonus.townAlarmPeriod, устанавливаем таймер на включение мигалки
		
		time += 2;
	}
	
	return time;
};

//подключение к оповещениям
TownsBonusAlarmIterator.prototype.bind = function(){
    var self = this;
	
    notifMgr.addListener(Notif.ids.accTownBonus, 'iterator', function(){
        self.calcUpdates();
    });
};