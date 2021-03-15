function Trade() {
	'use strict';
}


Trade.clonePoint = function(point){
    return utils.clone(point);
};

Trade.movePoint = function(point, disp){
    return {o:point.o, x:point.x + disp.x, y: point.y + disp.y}; // o:point.o - для совместимости точек вида o,x,y
};

Trade.movePointToMap = function(point, noNormalize){
    point = Trade.clonePoint(point);
    
	if( !noNormalize ){
		var diag = point.x - point.y;
		
		while (diag >= lib.map.size.x ) {
			diag -= 2 * lib.map.size.x;
			point = Trade.movePoint(point, {x: -lib.map.size.x, y: lib.map.size.x});
		}
		while (diag < -lib.map.size.x) {
			diag += 2 * lib.map.size.x;
			point = Trade.movePoint(point, {x: lib.map.size.x, y: -lib.map.size.x});
		}
	}
	
    return point;
};

Trade.getPointRepeatCount = function(point){
	var count = 0;
	
	point = Trade.clonePoint(point);
    
	var diag = point.x - point.y - (wofh.account.map.x - wofh.account.map.y);

	while (diag >= lib.map.size.x ) {
		diag -= 2 * lib.map.size.x;
		
		count--;
	}
	while (diag < -lib.map.size.x) {
		diag += 2 * lib.map.size.x;
		
		count++;
	}
	
    return count;
};

Trade.repeatPointOnMap = function(point, repeatCount){
	if( !repeatCount )
		return point;
	
	point = Trade.clonePoint(point);
	
	point.x += -lib.map.size.x * repeatCount;
	point.y += lib.map.size.x * repeatCount;
	
	return point;
};

Trade.roundDistance = function(distance, base, fixed){
	base = base||1;
	fixed = fixed||1;
	
	return utils.formatNum(distance, {base: base, servRound: 3, ceil: true, uFixed: fixed});
};

Trade.roundCost = function(cost, dec, fixed){
	dec = dec||0.001;
	fixed = fixed||3;
	
	return utils.toFixed(cost * dec, fixed);
};

Trade.calcMapDistance = function(pointA, pointB){
    var disp = {x: -lib.map.size.x, y: lib.map.size.x};
    
    var dist = Trade.calcDistance(pointA, pointB);

    //двигаем одну точку
    var pointAtmp = pointA;
    while (true){
    	pointAtmp = Trade.movePoint(pointAtmp, disp);
    	var distTmp = Trade.calcDistance(pointAtmp, pointB);
    	if (distTmp < dist) {
    		dist = distTmp;
    	} else {
    		break;
    	}
    }

    //двигаем другую
    var pointBtmp = pointB;
    while (true){
    	pointBtmp = Trade.movePoint(pointBtmp, disp);
    	var distTmp = Trade.calcDistance(pointA, pointBtmp);
    	if (distTmp < dist) {
    		dist = distTmp;
    	} else {
    		break;
    	}
    }

    return dist;
};

Trade.isPointsEqual = function(pointA, pointB){
	return pointA.x == pointB.x && pointA.y == pointB.y;
};

//две точки и координата, которую берем
Trade.calcMapCoordDistance = function(pointA, pointB, coord){
    
    var disp = {x: -lib.map.size.x, y: lib.map.size.x};
    
    var dist = Trade.calcCoordDistance(pointA[coord], pointB[coord]);

    //двигаем одну точку
    var pointAtmp = pointA;
    while (true){
    	pointAtmp = Trade.movePoint(pointAtmp, disp);
    	var distTmp = Trade.calcCoordDistance(pointAtmp[coord], pointB[coord]);
    	if (distTmp < dist) {
    		dist = distTmp;
    	} else {
    		break;
    	}
    }

    //двигаем другую
    var pointBtmp = pointB;
    while (true){
    	pointBtmp = Trade.movePoint(pointBtmp, disp);
    	var distTmp = Trade.calcCoordDistance(pointA[coord], pointBtmp[coord]);
    	if (distTmp < dist) {
    		dist = distTmp;
    	} else {
    		break;
    	}
    }

    return dist;
};

Trade.calcCoordDistance = function(x1, x2){
	return Math.abs(x1 - x2);
};

Trade.calcDistance = function(pointA, pointB){
	var dx = pointA.x - pointB.x,
		dy = pointA.y - pointB.y;
	
	return Math.sqrt(dx*dx + dy*dy);
};


//пересечения прямых. НЕ УЧИТЫВАЕТ ПАРАЛЛЕЛЬНОСТЬ!
Trade.calcLinesIntersect = function(A, B, C, D){
	var O = {};
	O.x = -((A.x*B.y-B.x*A.y)*(D.x-C.x)-(C.x*D.y-D.x*C.y)*(B.x-A.x))/((A.y-B.y)*(D.x-C.x)-(C.y-D.y)*(B.x-A.x));
	O.y = ((D.y-C.y)*O.x-(C.x*D.y-D.x*C.y))/(D.x-C.x);
	return O;
};

//проверка нахождения точки в квадрате с противоположнымиуглами A,B
Trade.isPointOnSquare = function(A, B, O){
	return (((A.x<O.x)^(B.x<O.x))||A.x == O.x ||B.x==O.x) && 
			(((A.y<=O.y)^(B.y<O.y))||A.y == O.y ||B.y==O.y);
};

//пересечения отрезков
Trade.calcSegmIntersect = function(A, B, C, D){
	//точка пересечения линий
	var O = Trade.calcLinesIntersect(A, B, C, D);
	//проверяем, находится ли она на отрезках
	if (Trade.isPointOnSquare(A, B, O) && Trade.isPointOnSquare(C, D, O)){
		return O;
	} else {
		return false;
	}
};

//пересечение отрезка и полигона(находим первое пересечение)
Trade.calcSegmPolygonIntersect = function(polygon, C, D){
    for (var i=0; i< polygon.length; i++) {
        var A = polygon[i];
        var B = polygon[(i+1)%polygon.length];
        var O = Trade.calcSegmIntersect(A, B, C, D);
        if (O) return O;
    }
    return false;
};


Trade.calcTradeMoveFuelCount = function(resId, pathType, path, resList, fuelcons){
	fuelcons = fuelcons||(pathType == 0 ? lib.trade.fuellcons : lib.trade.fuelwcons);
	
	var fuelList = new ResList(fuelcons);
	
	var fuel = fuelList.getElem(resId);

	var resCount = resList.calcSum();

	return fuel.multCount(resCount/lib.trade.capacity * path);
};

Trade.calcTradeTimeByPaths = function(pathArr, dist, resList, fuell, fuelw, useAirWay){
	var mintime = 999999999,
		tradeSpeed = Trade.getSpeedInSeconds(wofh.account.race.getTradeSpeed());
	
	if( useAirWay ){
		var speed = tradeSpeed,
			fuelId = Resource.ids.fuel,
			fuel = Trade.calcTradeMoveFuelCount(fuelId, pathType, dist, resList, lib.trade.fuelacons);
		
		speed *= Trade.getTradeFuelSpeed(pathType, fuelId, lib.trade.fuelaspeed);
		
		var time = Trade.calcTradeTimeBySpeed(dist, speed);
		
		mintime = time;
		
		var minpath = path,
			mincons = fuel,
			minPathType = 4;
	}
	else{
		for(var pathType = 0; pathType < 3; pathType++){
			var path = pathArr[pathType];
			
			// Доступен ли путь
			if (!Trade.isTradePathAvailable(path, dist)) continue;
			
			// Вычисляем скорость
			var speed = tradeSpeed;

			// Учёт топлива
			if (resList && Trade.getTradeFuelConsumption(pathType, fuell, fuelw)) {
				var fuelId = Trade.getTradeFuelConsumption(pathType, fuell, fuelw);
				var fuel = Trade.calcTradeMoveFuelCount(fuelId, pathType, path, resList);

				speed *= Trade.getTradeFuelSpeed(pathType, fuelId);
			} else {
				var fuel = false;
			}

			// Учёт портов и пристаней в городе
			if ( pathType > 0 )
				speed *= Trade.getPortEffect();

			var time = Trade.calcTradeTimeBySpeed(path, speed);

			if (time < mintime) {
				mintime = time;
				
				var minpath = path,
					mincons = fuel,
					minPathType = pathType;
			}
		}
	}
	
	return {time: mintime, cons: mincons, pathType: minPathType, path: minpath};
};

Trade.calcTradeTimeBySpeed = function(distance, speed) {
	return utils.toInt((distance + Appl.C_EPSILON1000) / speed);
};

Trade.calcStreamTradersByRescount = function(count, disttime, floor){
	var traders = ((count/lib.trade.capacity) * (2 * Trade.getTimeInHours(disttime)));
	
	return floor ? Math.floor(traders) : Math.ceil(traders);
};

Trade.calcStreamRescountByTraders = function(traders, disttime){
	return utils.toInt(((traders * lib.trade.capacity) / (2 * Trade.getTimeInHours(disttime))) + Appl.C_EPSILON1000);
};

Trade.calcPortEffect = function(town){
	town = town||wofh.town;
	
	var port = town.slots.getSlotsByAbility(Build.type.watertradespeed).getFirst();

	if( port && port.isActive() )
		return 1 + port.getEffect();
	
	return 1;
};

Trade.getPortEffect = function(town){
	town = town||wofh.town;
	
	return town.traders.waterspeed;
};

Trade.getTimeInHours = function(time){
	return time * timeMgr.invHtS;
};

Trade.getSpeedInSeconds = function(speed){
	return speed * timeMgr.invHtS;
};

Trade.calcPledge = function(count, noCeil){
	return noCeil ? count * lib.trade.pledgehours : Math.ceil(count * lib.trade.pledgehours);
};

Trade.calcImmediateCost = function(dist){
	return Math.ceil(+dist / lib.trade.distance) * lib.luckbonus.tradeimcost;
};

Trade.calcStreamPrice = function(cost, count, tcost, traders){
	return (cost * count + (traders||0) * tcost) * 0.001;
};



Trade.getTradersByRes = function(res){
	return Math.ceil(res / lib.trade.capacity);
};

Trade.getTradeFuelSpeed = function(pathType, resId, fuelspeed) {
	resId = resId||Trade.getTradeFuelConsumption(pathType);
	fuelspeed = fuelspeed||(pathType == 0 ? lib.trade.fuellspeed : lib.trade.fuelwspeed);
	
	var resList = new ResList(fuelspeed);
	
	return resList.getCount(resId);
};

Trade.getTransportInfo = function(pathArr, dist, fuell, fuelw) {
	var minPath = 999999;
	var speedUp = {list:{}};
	var minEffectPath = {}; // Хранит минимальное путь с учетом эффектов 

	for(var pathType = 0; pathType < 3; pathType++){
		var path = pathArr[pathType];

		// Доступен ли путь
		if( Trade.isTradePathAvailable(path, dist) ){
			var fuelResList, wayType;
			
			if( pathType == 0 ){
				fuelResList = new ResList( lib.trade.fuellcons );
				wayType = Trade.wayType.l;
			}
			else{
				fuelResList = new ResList( lib.trade.fuelwcons );
				wayType = Trade.wayType.w;
			}

			fuelResList = fuelResList.getList();

			for(var fuelId in fuelResList){
				if( !Trade.isFuelScienceAvailable(fuelId) ) continue;

				var fuelPath = path;
				var fuel = Trade.calcTradeMoveFuelCount(fuelId, pathType, fuelPath, new ResList());

				fuelPath /= Trade.getTradeFuelSpeed(pathType, fuelId);

				// Учёт портов и пристаней в городе
				if( pathType > 0 )
					fuelPath /= Trade.getPortEffect();

				fuel.speedUpInfo = {
					// type - тип пути (0 - суша, 1 - глубоководный, 2 - мелководный)
					// val - величина пути для определенного типа (без учета ускорения)
					// wayType - принодлежность к пути (l - по земле, w - по воде)
					path: {type:pathType, val:path, wayType:wayType},
					minPath: fuelPath,
					// Выставлено ли по умолчанию потребление текущего ресурса
					consumption: (Trade.getTradeFuelConsumption(pathType, fuell, fuelw) == fuelId) ? fuelId : 0
				};

				if( speedUp.list[fuelId] ){   
					if( fuelPath < speedUp.list[fuelId].speedUpInfo.minPath )
						speedUp.list[fuelId] = fuel;
				}
				else
					speedUp.list[fuelId] = fuel;

				if( fuelPath < minPath )
					minPath = fuelPath;
			}

			// Получаем длину пути с учетом эффектов но без учета ускорителей для определенной принадлежности пути (сухопутный путь или водный)
			var effectPath = path;

			// Учёт портов и пристаней в городе)
			if( pathType > 0 ){
				effectPath /= Trade.getPortEffect();
			}

			if( minEffectPath.val ){
				if( effectPath < minEffectPath.val ){
					minEffectPath.val = effectPath;
					minEffectPath.wayType = wayType;
				}
			}
			else{
				minEffectPath.val = effectPath;
				minEffectPath.wayType = wayType;
			}
		}
	}

	// Проверяем кароче ли путь с ускорителем чем минимальный путь без ускорителя но с учетом эффектов (проверяем не совпадающие принадлежности путей)
	for(var fuelId in speedUp.list){
		var fuelInfo = speedUp.list[fuelId].speedUpInfo;

		if( minEffectPath.wayType != fuelInfo.path.wayType )
			if( fuelInfo.minPath >= minEffectPath.val )
				delete speedUp.list[fuelId];
	}

	speedUp.minEffectPathWayType = minEffectPath.wayType;

	// Выбираем топливо по умолчанию
	var minPath = 999999;
	for( var fuelId in speedUp.list ){
		var fuel = speedUp.list[fuelId];
		
		if( fuel.speedUpInfo.consumption && fuel.speedUpInfo.minPath < minPath ){
			minPath = fuel.speedUpInfo.minPath;
			
			fuel.speedUpInfo.selected = true;
			
			speedUp.selectedFuel = fuel;
		}
		
		fuel.speedUpInfo.stockCount = utils.toInt(wofh.town.getRes(fuelId).getHas());
	}
	
	return speedUp;
};


// Какое топливо потребляется городом
// fuell и fuelw - одноразовое переключение ресурса в окне транспортировке реса
Trade.getTradeFuelConsumption = function(pathType, fuell, fuelw){
	fuell = fuell === undefined ? wofh.town.traders.fuell : fuell;
	fuelw = fuelw === undefined ? wofh.town.traders.fuelw : fuelw;
	
	return pathType == 0 ? fuell : fuelw;
};

// Получить количество торговцев на снабжении !!!!!
Trade.getStreamTradersCount = function(){
	var count = 0;
	
	var streams = wofh.streams.getTownStreams().getList();
	for( var stream in streams ){
		stream = streams[stream];
		if( stream.town1 == wofh.town.id )
			count += stream.traders;
	}
	
	return count;
};


Trade.isBarterAllowed = function(){
    return Ability.isBarterAvailable() || wofh.barterOffers.getLength();
};

Trade.isTradeDistAvailable = function(pathArr, dist) {
	for(var pathType = 0; pathType < 3; pathType++){
		var path = pathArr[pathType];
		
		if( Trade.isTradePathAvailable(path, dist) )
			return true;
	}
	
	return false;
};

Trade.isTradePathAvailable = function(path, dist) {
	if (path == 0) return false;
	
	return dist <= lib.trade.distance || Account.hasAbility(Science.ability.longTrade);
};

Trade.isFuelScienceAvailable = function(fuelId) {
	var list = [],
		fuelScienceList = Resource.fuelScience.getList();
	
	for(var resId in fuelScienceList)
		list[resId] = fuelScienceList[resId].getCount();
	
	if( list[fuelId] !== undefined )
		if( (new Science(list[fuelId])).isKnown() )
			return true;
	
	return false;
};

Trade.hasAirWay = function(town1, town2, checkFuel) {
	if( !town1 || !town2 )
		return false;
	
	var wonder1 = town1.getWonder(),
		wonder2 = town2.getWonder();
	
	if( !wonder1 || !wonder2 )
		return false;
	
	if( wonder1.getId() != Slot.ids.airport || wonder2.getId() != Slot.ids.airport )
		return false;
	
	if( !wonder1.isActive() || !wonder2.isActive() )
		return false;
	
	return true;
};

Trade.isSell = function(type) {
	type = type instanceof Object ? type.type : type;
	
	return type == Trade.type.sell;
};

Trade.isBuy = function(type) {
	type = type instanceof Object ? type.type : type;
	
	return type == Trade.type.buy;
};

// return - время самой поздней транзакции в списке
Trade.parseTrans = function(data){
	var time;
	for(var item in data.list){
		item = data.list[item];
		/*item.town1 = new Town().parseIdData(item.town1, data.towns[item.town1]);

		item.account1 = new Account().parseIdData(item.town1.account, data.accounts[item.town1.account]);
		item.res1 = new ResList(item.res1);
		item.town2 = new Town().parseIdData(item.town2, data.towns[item.town2]);

		item.account2 = new Account().parseIdData(item.town2.account, data.accounts[item.town2.account]);
		item.res2 = new ResList(item.res2);*/
		time = item.time;
	}
	return time;
};

Trade.normalizeByTradersCapacity = function(resCount){
	return utils.toInt(resCount / lib.trade.capacity) * lib.trade.capacity;
};

Trade.getBarterFilter = function(){
	if( !Trade.barterFilter )
		Trade.barterFilter = {
			s: ResList.filter.resType.all,
			b: ResList.filter.resType.all
		};
	
	return Trade.barterFilter;
};

Trade.getStreamFilter = function(){
	if( !Trade.streamFilter )
		Trade.streamFilter = {
			res: ResList.filter.resType.all,
			type: Trade.type.buy
		};
	
	return Trade.streamFilter;
};

Trade.getTradeFilter = function(){
	if( !Trade.tradeFilter )
		Trade.tradeFilter = {
			res: ResList.filter.resType.all,
			type: Trade.type.buy,
			ally: TradeAlly.undif
		};
	
	return Trade.tradeFilter;
};

Trade.getFreeMarketFilter = function(){
	if( !Trade.freeMarketFilter )
		Trade.freeMarketFilter = {
			stock: false,
			sending: false,
			dist: false,
			path: false,
			ally: TradeAlly.undif
		};
	
	return Trade.freeMarketFilter;
};

Trade.getFreeMarketFilterProp = function(prop){
	var filter = ls.getFreeMarketFilter(Trade.getFreeMarketFilter());
	
	if( !wofh.account.isPremium() && (prop == 'sending' || prop == 'path') )
		filter = Trade.getFreeMarketFilter();
	
	return filter[prop];
};


Trade.minDistance = 1;
Trade.minPath = 1;

Trade.removeTradeOfferLimit = {};
Trade.removeTradeOfferLimit.sell = 1000000000; // Число при котором предложение продажи точно будет снято с рынка
Trade.removeTradeOfferLimit.buy = 0; // Число при котором предложение покупки точно будет снято с рынка
Trade.removeTradeOfferLimit.lucksell = 0; // Число при котором предложение продажи точно будет снято с рынка (МУ)
Trade.removeTradeOfferLimit.luckbuy = 0; // Число при котором предложение покупки точно будет снято с рынка (МУ)

Trade.type = {
	sell: 'sell',
	buy: 'buy'
};

Trade.moneyMoveType = {
	trade: 0,
	pledge: 1,
	admin: 2,
	credit: 3,
	subsidy: 4,
	deposit: 5,
	send: 6,
	tax: 7,
	budget: 8,
	slot: 9,
	buildOff: 10,
	stamp: 11,
	buildOn: 12,
	added: 13,
	luckBonus: 14,
	trainUnits: 15
};

Trade.wayType = {
	l: 0,	/*land*/
	w: 1,	/*water*/
	a: 2	/*air*/
};

Trade.taxes = {};
Trade.taxes.stream = {};
Trade.taxes.stream.ids = {
	sell: 0,
	customs: 1
};
Trade.taxes.stream.def = [];
Trade.taxes.stream.def[Trade.taxes.stream.ids.sell] = 0;
Trade.taxes.stream.def[Trade.taxes.stream.ids.customs] = 0;