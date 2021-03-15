function Army(data) {
	this.list = {};
	this.elemClass = Unit;
	
	//this.fleetId = Army.noFleet;
	
	if (data) { 
		this.parse(data);
	}
}

utils.extend(Army, CountList);

//парсит строку в массив
Army.prototype.parseStr = function (str) {
	//this.fleetId = Army.noFleet;
	var arr = [];
	if (str) {
		
		str = this.convertNegativeStr(str);
		
		var army = str ? str.split('^^') : '';
		for (var i in army) {
			if (army[i]) {
				var id = utils.charToInt(army[i][0] + army[i][1]);
				var count = Number(army[i].substring(2, army[i].length));
				
				if ( id > lib.units.list.length ){
					// Учет шаблонов юнитов
					if( id >= Unit.ids.tmplStart && id <= Unit.ids.tmplEnd ){
						var unitIdCount = UnitTmpl.toUnitIdCount(id, count);
						
						id = unitIdCount.id;
						count = unitIdCount.count;
					}
					else
						continue;
				}
				
				arr[id] = count;
			}
		}
	}
	
	return arr;
};

Army.prototype.parseArr = function(arr) {
	this.list = {};
	for (var unit in arr) {
		unit = new Unit(unit, arr[unit]);
		this.list[unit.id] = unit;
	}
};

// Конвертация стороки с армией содержащих юнитов с отрицательными значениями
Army.prototype.convertNegativeStr = function(str){
	var tmpStr = '';
	
	for( var i = 0; i < str.length; i++ ){
		var char = str[i];
		if( char == '-' ){
			if( (str[i+1]||'').match(/\d/) )
				tmpStr += char;
			else
				tmpStr += '^^';
		}
		else
			tmpStr += char;
	}
	
	return tmpStr;
}; 

//парсит строку из формы в массив
Army.prototype.parseForm = function (str) {
	if (str) {
		var army = str ? str.split('&') : '';
		for (var unit in army) {
            unit = army[unit].split('=');
            
            var id = unit[0].substring(1);
            var count = unit[1];
            
            this.setCount(id,count);
		}
	}
	
    return this;
};


//парсит объект из формы в массив
Army.prototype.parseFormObj = function (army) {
    for (var id in army) {
        if(id[0] != 'u') continue;
        var count = army[id];
        
        var id = id.substring(1);
        
        this.setCount(id, count);
    }
	
    return this;
};

//парсит объект из формы в массив
Army.prototype.parseArray = function (army) {
	//this.fleetId = Army.noFleet;
    
    for (var unit in army) {
        var unit = army[unit];
        this.setCount(+unit, 1);
    }
    return this;
}


Army.prototype.toString = function (checkTmplUnits) {
	if( checkTmplUnits ){
		var divider = '-';
		var charCount = 2;
		var str = '';
		var unitList = this.getList();
		for( var unit in unitList ){
			unit = unitList[unit];
			var id = unit.getId();
			var count = unit.getCount();
			
			if( unit.isTemplate() ){
				var tmplIdCount =  UnitTmpl.toTmplIdCount(unit, id, count);
				
				id = tmplIdCount.id;
				count = tmplIdCount.count;
			}
			
			str += utils.intToChar(id, charCount) + count + divider;
		}
		
		return str;
	}
	
    return Army.superclass.toString.apply(this, ['-', 2]);
};

// strictSpaceship - строгое сравнение для КК (не добавляется бит type|Army.types.land) 
// hasCombineWater - если истина, то есть возможность отправлять глубоководные и мелководные коробли вместе
Army.prototype.calcType = function (strictSpaceship, hasCombineWater){
	var type = Army.types.none;
    
	this.each(function(unit){
        if( unit.getCount() == 0 )
            return;
        
        if( unit.hasTag(Unit.tags.ship) ){
            if( type && (type & Army.types.water) == 0 )
                type |= Army.types.mix;
            
            type |= Army.types.water;
            
            if( unit.hasAbility(Unit.ability.high_water) == 1 )
                type |= Army.types.highwater;
            
            if( unit.hasAbility(Unit.ability.low_water) == 1 )
                type |= Army.types.lowwater;
			
            if( type&Army.types.lowwater && type&Army.types.highwater ){
				if( hasCombineWater && !(type & Army.types.mix) )
					type |= Army.types.combinewater;
				else
					type |= Army.types.mix;
			}	
        }
        else if( unit.hasTag(Unit.tags.aircraft) ){
            if( type && (type & Army.types.air) == 0 )
                type |= Army.types.mix;
            
            if( unit.hasAbility(Unit.ability.nuclear_attack) == 1 ){
                if( type )
                    type |= Army.types.mix;
                
                type |= Army.types.nuclear;
            }
            else if( type && (type & Army.types.nuclear) )
                type |= Army.types.mix;
            
            type |= Army.types.air;
        }
        else if (unit.hasTag(Unit.tags.spaceship)){
			if( !strictSpaceship )
				type |= Army.types.land;
            
            type |= Army.types.space;
        }
        else{   
            if( type && (type&Army.types.land) == 0 )
                type |= Army.types.mix;
            
            if( !type && unit.hasAbility(Unit.ability.spy) == 1 )
                type |= Army.types.spy;
            else
                type &= ~Army.types.spy;
            
            type |= Army.types.land;
        }
        
		if ( !strictSpaceship && unit.isPeaceful() )
            type |= Army.types.peace;
	});
    
    if( type & Army.types.mix )
        type &= ~Army.types.spy;
    
	return type == Army.types.none ? Army.types.land : type;
};

Army.prototype.hasOnlyLandUnits = function(armyType){
    if( armyType === undefined )
        armyType = this.calcType();
    
    return armyType && !(armyType & Army.types.water || armyType & Army.types.air);
};

//
Army.prototype.calcTypeMain = function (){
    return this.calcType() % 8;//none,land,water,air
};

Army.prototype.calcMinSpeed = function(ignoreCount){
    var speed = 0;
    
    this.each(function(unit){
        if( ignoreCount || unit.getCount() )
            speed = Math.min(speed||999999999, unit.getSpeed());
    });
    
    return speed;
};

Army.prototype.calcMaxSpeed = function(ignoreCount){
    //вычисляем минимальную скорость
    var speed = 0;
    
    this.each(function(unit){
        if( ignoreCount || unit.getCount() )
            speed = Math.max(speed, unit.getSpeed());
    });
    
    return speed;
};

Army.prototype.calcMoveTime = function (dist){
    if (this.calcType() == Army.types.mix) {
        return 0;
    }
    
    var minSpeed = this.calcMinSpeed(),
        time = minSpeed ? dist / minSpeed : 0;

    return Math.round(time);
};

Army.prototype.calcMoveTimeFromTown = function (dist){
    var time = this.calcMoveTime(dist);
    
	if (this.calcType() & Army.types.air){
        //ускорение
        var slot = wofh.town.slots.getSlotsByAbility(Build.type.airarmyspeed).getFirst()
        if (slot && slot.isActive()) {
            time /= slot.getEffect() + 1;
        }
        
        //подготовка вылета
		time += lib.war.airmovetimeadd;
	}
    
	if (this.calcType() & Army.types.water){
        //ускорение
        var slot = wofh.town.slots.getSlotsByAbility(Build.type.waterarmyspeed).getFirst();
        if (slot && slot.isActive()) {
            time /= slot.getEffect() + 1;
        }
    }
    
    return Math.round(time);
};

Army.prototype.isWater = function (){
	return this.calcType() & Army.types.water;
};

Army.prototype.isAir = function (){
	return this.calcType() & Army.types.air;
};

Army.prototype.isNuclear = function (){
	return this.calcType() & Army.types.nuclear;
};

Army.prototype.isSpace = function (){
	return this.calcType() & Army.types.space;
};

//население затраченное на строительство армии
Army.prototype.calcPop = function () {
	var pop = 0;
    
    this.each(function(unit){
        pop += unit.getPopCost() * unit.getCount();
    });
    
	return pop;
};

//стоимость содержания армии
Army.prototype.calcPay = function (useTown) {
	var resList = new ResList();
	
    if (useTown && wofh.town.getSlots().wonderEffect) {
        var effect = wofh.town.getSlots().wonderEffect[WonderEffect.ids.armySupply];
    } else {
        var effect = null;
    }
    
    
	for (var unit in this.getList()) {
		var unit = this.getElem(unit);
        
        var mult = 1;
        if (effect) {
            if (utils.inArray(effect.getUnits(), unit.getId())) {
                mult /= effect.getEffect();
            }
        }
        
		resList.addList(unit.getPay().mult(unit.getCount() * mult));
	}
	
	return resList;
}
//стоимость содержания армии
Army.prototype.calcCost = function () {
	var resList = new ResList();
	
	for (var unit in this.getList()) {
		var unit = this.getElem(unit);
		resList.addList(unit.getCost().mult(unit.getCount()));
	}
	
	return resList;
}

Army.prototype.calcCapacity = function (){
    var capacity = 0;
	
	for (var unit in this.getList()) {
		var unit = this.getElem(unit);
		capacity += unit.getCapacity() * unit.getCount(); 
	}
    
    return capacity;
}

//повреждения наносимые авиации
Army.prototype.calcAirDamage = function () {
	var count = 0;
	
	for (var unit in this.getList()) {
		var unit = this.getElem(unit);
		count += unit.getAirDamage() * unit.getCount();
	}
	
	return count;
};

Army.prototype.calcWaterDamage = function (bonus) {
	var count = 0;
	
	for (var unit in this.getList()) {
		var unit = this.getElem(unit);
		count += unit.getWaterDamage() * unit.getCount();
	}
	
	count *= (bonus||1);
	
	return count;
};

Army.prototype.getFirstUnit = function () {
	for (var unit in this.getList())
	unit = this.getElem(unit);
	return unit;
};

Army.prototype.getType = function () {
	var unit = this.getFirstUnit();
	switch (unit.getType()) {
		case Unit.type.boat: return Army.type.water;
		case Unit.type.air: return Army.type.air;
	}
	return Army.type.land;
};

Army.prototype.isSpam = function () {
	return this.getLength() == 1 && this.getFirstUnit().getCount() == 1;
};

Army.prototype.isNuclear = function () {
	var unit = this.getFirstUnit();
	return this.getLength() == 1 && unit.hasAbility(Unit.ability.nuclear_attack);
};

// effect - эффект от портов и т.п.
Army.prototype.getSpeed = function (checkCount, byMaximum) {
	return (byMaximum ? this.calcMaxSpeed(!checkCount) : this.calcMinSpeed(!checkCount)) * timeMgr.HtS;
};

Army.prototype.sortByDefault = function () {
    this.setSorted(true);
    this.list.sort(function(unit1, unit2){
        var val1 = unit1.isEnabled();
        var val2 = unit2.isEnabled();
        
        if (val1 == val2){
            val1 = unit1.getEra();
            val2 = unit2.getEra();
        }
        
        if (val1 == val2){
            var val1 = unit1.getTactic();
            var val2 = unit2.getTactic();
        }
        
        if (val1 == val2){
            val1 = unit1.getId();
            val2 = unit2.getId();
        }
        
        return val1 > val2 ? 1: -1;
    });
    return this;
};

Army.prototype.canCancelReinf = function(town, reinf){
	town = town||wofh.town;
	
    var type = this.calcType(true);
	
	if( !(type&Army.types.space) )
		return true;
	else{
		for(var tmpType in Army.types ){
			tmpType = Army.types[tmpType];
			if( tmpType&type && tmpType != Army.types.space )
				return true;
		}
	}
	
    return false;
};

// Исключает все КК из армии
Army.prototype.excludeKK = function () {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		if (elem.isKK()) {
			this.delElem(elemId);
		}
	}
	return this;
};

Army.prototype.sortBySpeed = function(reverse) {
    return this.sort(function(a, b){
        var val = a.getSpeed() < b.getSpeed()? -1: 1;
        if (reverse){
            val *= -1;
        }
        return val;
    });
};

// Из всего флота выбираются корабли для транспортировки
Army.prototype.selectTransport = function(army, type){
    var armyPop = army.calcPop(),
		armyPopWas = armyPop,
		sortedFleet = this.clone().sortTransport(),
		transport = new Army();
	
	// Оптимизация по скорости транспортов
	if( type == Army.shipping.speed ){
		var isTransportLoaded = false;
		
		// Набираем корабли
		for (var i = sortedFleet.list.length - 1; i >= 0; i--) {
			var ship = sortedFleet.list[i];
			if (ship.count) {
				var cariage = ship.calcCariage();
				var carSum = cariage * ship.count;
				if (carSum >= armyPop){
					transport.addCount(ship, Math.ceil(armyPop / cariage));
					
					isTransportLoaded = true;
					
					break;
				}else{
					transport.addCount(ship, ship.count);
					armyPop -= carSum;
				}
			}
		}
		
		if( isTransportLoaded ){
			if( transport.getLength() > 1 ){
				transport.sortBySpeed(true).normalizeTransport(armyPopWas); // Нормируем транспорты (исключаем лишние корабли, если это возможно)
			}
			
			// Если у транспортного флота разные скорости, пытаемся оптимизировать (сохранить быстрые корабли если это возможно)
			if( transport.isTransportMultispeed() ){
				var reserve = sortedFleet.clone().diffList(transport).onlyPositive(), // Формируем резерв из кораблей, которые остальс в порту после набора кораблей для траспортировки
					maxSpeed = utils.servRound(transport.getFirst().getSpeed() * timeMgr.HtS), // Максимальная скорость набранных транспортов
					minSpeed = utils.servRound(transport.getSpeed()); // Минимальная скорость набранных транспортов
				
				// Отбрасываем из резерва корабли скорость которых менее минемальной набранной или более или равна максимально набранной
				// Резер отсортирован по скорости (начиная с наименьшей) и объему (начиная с наименьшего)
				reserve.filter(function(unit){
					var uSpeed = utils.servRound(unit.getSpeed() * timeMgr.HtS);
					return uSpeed >= minSpeed && uSpeed < maxSpeed;
				});
				
				if( reserve.getLength() ){
					var	transportWas = transport.clone(),
						transportCariageWas = transportWas.calcTransportCariage();
					
					// Пытаемся заменить быстрые корабли из набранных (начинаем с быстрых), кораблями из резерва (начинаем с медленных)
					for(var tShip in transportWas.list){
						tShip = transport.list[tShip];
						var tShipCount = tShip.getCount();

						for(var i = 0; i < tShipCount; i++){
							if( !reserve.getLength() )
								break;

							var tShipReplaced = false; // Удалось ли произвести замену
							tShip.count--;

							for(var rShip in reserve.list){
								rShip = reserve.list[rShip];
								
								// Если скорости одинаковые менять смысла нету
								if( !(utils.servRound(tShip.getSpeed()) > utils.servRound(rShip.getSpeed()) /*&& rShip.getCount() > 0*/) )
									continue;

								var tShipInReserveWas = transport.getElem(rShip).clone(), // В резерве может находится юнит, который уже есть в набранных кораблях. Запоминаем его состояние (количество штук) для последующего восстановления, если не удастся провести замену
									tShipCanReplaced = false, // Может ли резерыный корабль заменить собой уже набранный 
									shipReplacedCount = 0;
								
								// Заменяем один уже набранный корабль резервным (поштучно) 
								for(var j = 0; j < rShip.getCount(); j++){
									transport.addCount(rShip, 1);
									
									// Если после замены хватает объема транспорта, считаем, что возможно произвести замену
									if( transport.calcTransportCariage() >= armyPopWas ){
										tShipCanReplaced = true;
										shipReplacedCount = j + 1;
										break;
									}
								}
								
								// Если количество погрузочных мест стало меньша или осталось прежним - производим замену, корректируя резерв
								if( tShipCanReplaced && transport.calcTransportCariage() <= transportCariageWas ){
									rShip.addCount(-shipReplacedCount);
									
									if( !(rShip.getCount() > 0) )
										reserve.delElem(rShip);
									
									tShipReplaced = true;
									break;
								}
								// Если количество погрузочных мест стало больше - восстанавливаем значения юнита, совпадающего с резервом и переходим к следующему кораблю из резерва
								else{
									transport.setCount(tShipInReserveWas, tShipInReserveWas.getCount());
								}
							}
							
							// Если после перебора всех кораблей из резерва произвести замену неудалось - восстанавливаем состояние заменяемого коробля (восстанавливаем его количесто) и переходим к следующему кораблю
							if( !tShipReplaced ){
								tShip.count++;
								break;
							}
						}
					}
				}
			}
			
			return transport.setSorted(false).onlyPositive();
		}
	}
	// Оптимизация по размеру транспортов
	else{
		var isTransportLoaded = false;
		
		for (var ship in sortedFleet.list) {
			ship = sortedFleet.list[ship];
			if (ship.count) {
				var cariage = ship.calcCariage();
				var carSum = cariage * ship.count;
				if (carSum >= armyPop) {
					transport.addCount(ship, Math.ceil(armyPop / cariage));
					
					isTransportLoaded = true;
					
					break;
				}else{
					transport.addCount(ship, ship.count);
					armyPop -= carSum;
				}
			}
		}
		
		if( isTransportLoaded ){
			if( transport.getLength() > 1 ){
				transport.sortBySpeed(true).normalizeTransport(armyPopWas); // Сортируем и нормируем транспорты (исключаем лишние корабли, если это возможно)
			}
			
			transport.setSorted(false);
			
			return transport;
		}
	}
	
    return false;
};

Army.prototype.sortTransport = function(reverse) {
    return this.sort(function(a, b){
		var val1 = utils.servRound(a.getSpeed() * timeMgr.HtS),
			val2 = utils.servRound(b.getSpeed() * timeMgr.HtS);

		if( val1 == val2 ){
			val1 = a.calcCariage();
			val2 = b.calcCariage();
		}
		
		var val = val1 < val2 ? -1 : 1;
		
        if ( reverse )
            val *= -1;
		
        return val;
    });
};

Army.prototype.calcTransportCariage = function() {
    var cariage = 0;
	
	for (var ship in this.list) {
        ship = this.list[ship];
		cariage += ship.calcCariage() * ship.count;
    }
	
	return cariage;
};

Army.prototype.isTransportMultispeed = function() {
	if( this.getLength() > 1 ){
		var list = this.getList(),
			speed = false;
		for (var unit in list) {
			var uSpeed = utils.servRound(list[unit].getSpeed() * timeMgr.HtS);

			if( speed !== false ){
				if( speed != uSpeed )
					return true;
			}
			else
				speed = uSpeed;	
		}
	}
	
	return false;
};

Army.prototype.normalizeTransport = function(armyPop) {
    for(var ship in this.list){
		ship = this.list[ship];

		for(var i = 0; i < ship.getCount(); i++){
			ship.count--;

			if( this.calcTransportCariage() < armyPop ){
				ship.count++;
				break;
			}
		}
	}
	
	this.onlyPositive();
};



Army.prototype.getBattleUnits = function(){
	return this.filter(function(unit){return !unit.isPeaceful();});
};

Army.prototype.getPeacefulUnits = function(){
	return this.filter(function(unit){return unit.isPeaceful();});
};

Army.prototype.getTrainUnits = function(){
	return this.filter(function(unit){return !unit.getHoliday();});
};

Army.prototype.filterLandUnits = function(leave, noFilter){
	if( noFilter ) return this;
	
	return this.filter(function(unit){return leave ? unit.isLand(true) : !unit.isLand(true);});
};

Army.prototype.filterKKUnits = function(leave, noFilter){
	if( noFilter ) return this;
	
	return this.filter(function(unit){return leave ? unit.isKK() : !unit.isKK();});
};

Army.prototype.filterFleetUnits = function(leave, noFilter){
	if( noFilter ) return this;
	
	return this.filter(function(unit){return leave ? unit.isFleet() : !unit.isFleet();});
};

Army.prototype.filterAirUnits = function(leave, noFilter){
	if( noFilter ) return this;
	
	return this.filter(function(unit){return leave ? unit.isAir() : !unit.isAir();});
};

Army.prototype.filterUnitsByTactics = function(tactics){
	if( !utils.sizeOf(tactics) ) return this;
	
	return this.filter(function(unit){
		return !!tactics[unit.getTactic()];
	});
};

Army.prototype.filterUnitsByAbilities = function(ability){
	if( !ability ) return this;
	
	return this.filter(function(unit){
		return unit.hasAbility(ability);
	});
};

Army.prototype.getEraTacticGroups = function(opt){
	opt = opt||{};
	
	var list = this.getList(),
		totalList = [],
		unitTactics = [[0], [1], [2], [3,4,5], [6], [7]],
		filter = function(unit, era, unitTacticsArr){
			return unit.getEra() == era && utils.inArray(unitTacticsArr, unit.getTactic()) && unit.getHealth() > 0 && !unit.getHoliday();
		};
		
	filter = opt.filter||filter;
	
	if( opt.includeKK )
		unitTactics.push([8]);
	
	for (var era = 0; era < Unit.erasLength; era++){
		if( totalList[era] === undefined )
			totalList[era] = [];
		
		for (var unitTactic in unitTactics){
			if( totalList[era][unitTactic] === undefined )
				totalList[era][unitTactic] = new Army();
			
			for (var unit in list){
				unit = list[unit];
				
				if( filter(unit, era, unitTactics[unitTactic]) )
					totalList[era][unitTactic].addElem(unit);
			}
		}
	}
	
	return totalList;
};


Army.parseAttacks = function(attacks){
	var battles = [];
	
	for(var battle in attacks){
		battle = attacks[battle];

		var data = battle.data;

		battle.attack = new Army();
		battle.defence = new Army();
		battle.attack_die = new Army(); 
		battle.defence_die = new Army();
		battle.robbed = new ResList();

		if( battle.type == Report.type.battleFull ){
			for (var army in data.attackers){
				army = data.attackers[army];
				battle.attack.addList(new Army(army.army));
				battle.attack_die.addList(new Army(army.army));
				battle.attack_die.addList(new Army(army.survived).mult(-1));
				battle.robbed.addList(new ResList(army.robbed));
			}
			for (var army in data.defenders){
				army = data.defenders[army];
				battle.defence.addList(new Army(army.army));
				battle.defence_die.addList(new Army(army.army));
				battle.defence_die.addList(new Army(army.survived).mult(-1));
			}

			if (battle.town) {
				battle.town = {
					id: battle.town[0],
					name: battle.town[1]
				};
			}
		}
		else if( battle.type == Report.type.battleShort ){
			if( data.isattacker ){
				battle.attack.addList(new Army(data.army));
				battle.attack_die.addList(new Army(data.army));
				battle.attack_die.addList(new Army(data.survived).mult(-1));
			}
			else{
				battle.defence.addList(new Army(data.army));
				battle.defence_die.addList(new Army(data.army));
				battle.defence_die.addList(new Army(data.survived).mult(-1));
			}
		}
		else if( battle.type == Report.type.attackWater ){
			battle.attack.addList(new Army(data.army1));
			battle.attack_die.addList(new Army(data.army1));
			battle.attack_die.addList(new Army(data.survived1).mult(-1));
			battle.robbed.addList(new ResList(data.grabbed));
			
			battle.defence.addList(new Army(data.water2));
			// При водной атаке урон наносится только водным юнитам защиты
			battle.defence_die = battle.defence.clone().diffList(new Army(data.watersurvive2)).onlyPositive();
			battle.defence.addList(new Army(data.ground2));
		}
		else{
			battle.attack.addList(new Army(data.army1));
			battle.attack_die.addList(new Army(data.army1));
			battle.attack_die.addList(new Army(data.survived1).mult(-1));

			battle.defence.addList(new Army(data.army2));
			battle.defence.addList(new Army(data.armyland));
			battle.defence_die.addList(new Army(data.armyland));
			battle.defence_die.addList(new Army(data.surviveland).mult(-1));
		}
		
		battles.push(battle);
	}
	
	battles.sort(function(a, b){
		return b.time - a.time;
	});
	
	return battles;
};

Army.diff = function (army1, army2) {
	army1 = utils.armyStrToObj(army1);
	army2 = utils.armyStrToObj(army2);
	var list = [],
		diff;
	for (var i in army1) {
		if (!army2[i]) {
			list[i] = army1[i];
		} else {
			diff = army1[i] - army2[i];
			if (diff > 0) {
				list[i] = diff;
			}
		}
	}
	return list;
};

Army.countFromStr = function (str) {
	str = str || '';
	var groups = str.split('-');
	var size = 0;
	for (var i in groups) {
		if (!groups[i]) continue;

		size += parseInt(groups[i].substr(2));
	}
	return size;
};

Army.getAll = function(){
	var army = new Army();
	
	for (var i in lib.units.list) {
        var unit = new Unit(i);
        if (unit.isEnabled()) {
            army.createElem(i);
        }
	}
	
	return army;
};

Army.noFleet = -1;

Army.type = {
	empty: 0,
	land: 1,
	water: 2,
	air: 3,
	mix: 4
};

Army.tableSort = [0,12,1,8,13,56,43,96,57,2,36,16,92,51,11,20,29,80,37,78,3,79,41,45,42,35,32,33,52,23,4,44,46,81,28,24,101,15,40,25,30,5,38,39,22,17,18,87,26,27,75,19,21,86,14,31,88,47,50,76,58,59,48,49,98,34,77,9,53,10,6,54,55,7,66,70,67,68,69,72,73,71,85,74,82,83,84,89,90,91,93,94,95,60,61,62,63,64,65,97,99,100,102,103,104,105,106,107,108,109];


Army.types = {
	none: 0,
	land: 1 << 0,
	water: 1 << 1,
	air: 1 << 2,
	spy: 1 << 3,//дополнение к ground - одни шпионы-пихоты
	highwater: 1 << 4,//дополнение к water - есть глубоководные
	lowwater: 1 << 5,//дополнение к water - есть мелководные
	nuclear: 1 << 6,//добавление к air - ядерная атака
	space: 1 << 7,
	mix: 1 << 8,
	combinewater: 1 << 9, // дополнение к water - есть мелководные и глубоководные
	peace: 1 << 10 // миротворцы 
};

// Транспортировка
Army.shipping = {
	speed: 0, // По скорости
	size: 1 // По размеру
};