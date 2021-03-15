function EventList () {
    this.elemClass = EventCommon;
	this.list = [];
	this.sorted = true;
}


utils.extend(EventList, List);

//массив с событиями
EventList.prototype.parseEvents = function(arr){
	for (var event in arr) {
		this.list.push(new EventCommon(arr[event]));
	}
}


//массив с событиями
EventList.prototype.getElem = function(i, event){
	i = event ? this.getI(event) : i;
	
	return this.getList()[i];
};

//индекс события в списке
EventList.prototype.getI = function(event, filter){
	var eventId = event instanceof Object ? event.id : event;
	
	filter = filter||function(event){
		return event.id == eventId;
	};
	
    for(var i in this.list) {
        if( filter(this.list[i]) )
            return i;
    }
	
    return EventList.noPos;
};

// Удаление событие
EventList.prototype.del = function(i){
	if( i == EventList.noPos ) return false;
	
    return this.getList().splice(i, 1)[0];
};

EventList.prototype.delElem = function(elem, filter){
	return this.del(this.getI(elem, filter))||elem;
};

// Клонирует только массив
EventList.prototype.clone = function(events, pos){
	var clone = new EventList();
	clone.list = this.getList().slice(0);
	return clone;
};

// Клонирует массив и элементы
EventList.prototype.clone2 = function(){
	var events = new EventList();
	for (var event in this.getList()) {
		events.list.push(this.getElem(event).clone());
	}
	
	return events;
};


EventList.prototype.getPosById = function(id){
	for (var eventI in this.getList()) {
		var event = this.getElem(eventI);
        if (event.getId() == id) return eventI;
    }
	
    return EventList.noPos;
};

EventList.prototype.hasEvent = function(eventId){
    return this.getPosById(eventId) != EventList.noPos;
};


EventList.prototype.getById = function(id){
    var pos = this.getPosById(id);
    
	if (pos == EventList.noPos) return false;
	
    return this.getList()[pos];
};

EventList.prototype.getTownEvents = function(town) {
    if (!town) town = wofh.town;
    
	var townEvents = new EventList(),
		list = this.getList();
	for (var event in list) {
		event = list[event];
		if ( event.isForTown(town) )
			townEvents.list.push(event.clone());
	}
	return townEvents;
};

EventList.prototype.getAccAttacks = function() {
	var attacks = new EventList();
	
	for (var event in this.getList()) {
		var event = this.getElem(event).clone();
		
		if ( !event.isAttack() )
			continue;
		
		if( !wofh.towns[event.getTown2()] ) 
			continue;
		
		attacks.list.push(event);
	}
	
	return attacks;
};

EventList.prototype.getTownTradersMoves = function(town) {
    town = town||wofh.town;
	var tradersMove = new EventList(),
		list = this.getTownEvents(town).getList();
	
	for (var event in list) {
		var event = list[event];
		
		if ((event.getType() == EventCommon.type.market && event.getTown1() == town.id) || event.getType() == EventCommon.type.trade ) {
			tradersMove.list.push(event);
		}
	}
	
	return tradersMove;
};

EventList.prototype.getTownMilitaryMoves = function(town, noBattle) {
	if (!town) town = wofh.town;
	
	var attacks = {},
		list = this.getTownEvents(town).getList();
    
    if( !noBattle )
        attacks.battle = town.battle;
	
	for (var event in list) {
		event = list[event];
		
		if (event.isAttack() || event.getType() == EventCommon.type.explore) 
			event.setType(EventCommon.type.attack);
		else if (
			event.isDefence() || 
			event.getType() == EventCommon.type.maketown || 
			event.getType() == EventCommon.type.makeres || 
			event.getType() == EventCommon.type.makeroad || 
			event.getType() == EventCommon.type.makeimp
		) 
			event.setType(EventCommon.type.defence);
		else if( event.getType() == EventCommon.type.armyreturn && !event.isOutgo(town.id) )
			event.setType(EventCommon.type.armyreturn);
		else 
			continue;
		
		if (event.isOutgo(town.id))
			var dir = 'Out';
		else if(event.isGoingTo(town.id))
			var dir = 'In';
		else
			continue;
		
		if( event.getType() == EventCommon.type.armyreturn )
			event.setType(EventCommon.type.defence);
		
		var type = utils.cnstName(EventCommon.type, event.getType()) + dir;
		
		var data = attacks[type];
		
		if( !data ) {
			attacks[type] = {
				count: 1,
				time: event.getTime()
			};
		} 
		else {
			data.count++;
			data.time = Math.min(data.time, event.getTime());
		}
	}
	
	return attacks;
};

EventList.prototype.getTownWarMoves = function (town, getOutCount) {
	if (!town) town = wofh.town;
	
	var battles = {},
		list = this.getTownEvents(town).removeEventFleet().getList();
	
	for(var event in list) {
		event = list[event];
		
		if( town.id != event.getTown1() && getOutCount )
			continue;
		
		if( event.isAttack() )
			event.setType(EventCommon.type.attack);
		else if (event.isDefence() ) 
			event.setType(EventCommon.type.defence);
		else 
			continue;
		
		if( event.isOutgo(town.id) )
			var dir = 'Out';
		else if( event.isGoingTo(town.id) )
			var dir = 'In';
		else
			continue;
		
		var type = utils.cnstName(EventCommon.type, event.getType()) + dir;
		
		var data = battles[type];
		
		if( !data ) 
			battles[type] = {count: 1, time: event.getTime()};
		else{
			data.count++;
			data.time = Math.min(data.time, event.getTime());
		}
	}
	
	if( getOutCount )
		battles = utils.toInt((battles.attackOut||{}).count) + utils.toInt((battles.defenceOut||{}).count);
	
	return battles;
};

EventList.prototype.getTownBattles = function (town) {
	town = town||wofh.town;
	var battles = new EventList(),
		list = this.getTownEvents(town).getList();
	
	for (var event in list) {
		var event = list[event];
		
		if ( event.getType() == EventCommon.type.battleGroup )
			battles.list.push(event);
	}
	
	return battles;
};

EventList.prototype.getTownTrainArmy = function (town) {
	town = town||wofh.town;
	var army = new Army(),
		list = this.getTownEvents(town).getList();
	
	for (var event in list) {
		var event = list[event];
		
		if ( event.getType() == EventCommon.type.train )
			army.addList(event.data.army);
	}
	
	return army;
};

EventList.prototype.getTownStreams = function (town, onlyCount) {
	if (!town) town = wofh.town;
	
	var streams = new EventList(),
		list = this.getTownEvents(town).getList();
	
	for ( var event in list ) {
		var event = list[event];
		
		if ( event.getType() == EventCommon.type.stream )
			streams.addElem(event);
	}
	
	if( onlyCount )
		return streams.getLength();
	
	return streams;
};




EventList.prototype.getByType = function (type) {
	var events = new EventList();
	for (var event in this.getList()) {
		event = this.getElem(event);
		if (event.getType() == type) {
			events.list.push(event);
		}
	}
	return events;
}



EventList.prototype.getTrainQueue = function(slot) {
	var events = [];
	for (var event in this.getList()) {
		var event = this.getElem(event);
		if (event.getType() == EventCommon.type.train && event.getTown2() == slot.getTown().id && event.data.slot == slot.getPos()){
			
            events.push(event);
		}
	}
	
	return events;
}

// Битва

EventList.prototype.parseBattles = function(arr){
	for (var eventId in arr) {
        var data = arr[eventId];
		var event = new EventBattle(data);
		
		this.addBattle(event);
        
        //записываем битвы в город
        var town = wofh.towns[event.getTown2()];
        if (town)
            town.updBattle(event);
	}  
};

EventList.prototype.getTownBattle = function(townId){
	for(var event in this.list){
		event = this.list[event];
		
		if( event.isBattle() && event.getTown2() == townId )
			return event;
	}
	
	return false;
};

EventList.prototype.delBattle = function(eventBattle){
	return this.delElem(eventBattle, function(event){
		return event.isBattle() && event.getTown2() == eventBattle.getTown2();
	});
};

EventList.prototype.addBattle = function(eventBattle){
	var battle = this.getTownBattle(eventBattle);
	
	if( battle )
		this.delBattle(battle.getTown2());
	
	this.add(eventBattle);
};


//прогресс 1го пункта очереди (0..1)
EventList.prototype.getBldQueueProgress = function(town){
	if(!town) town = wofh.town;
	
	var event = this.getBldQueue(false, town).getFirst();
	
	return Math.max(0, 1 - (event.getTime() - timeMgr.getNow()) / event.getActionTime());
};

EventList.prototype.getBldQueue = function(slot, town) {
	if( slot === undefined ) 
		slot = false;
	
	if( !town )
		town = slot ? slot.getTown() : wofh.town;
	
	var list = new EventList();
	
	for (var event in this.getList()) {
		var event = this.getList()[event];
		
		if( event.getType() != EventCommon.type.buildI ) 
			continue;
		
		if(	(slot && slot.isSameSlot(event.getBuildSlot())) || (!slot && event.getTown1() == town.id) )
			list.add(event);
	}
	
	return list;
};

EventList.prototype.addEvent = function(id, type, data, key, time, town1, town2){
	var event = new EventCommon();
	
	event.setId(id);
	event.setType(type);
	event.setData(data);
	event.setKey(key);
	event.setTime(time);
	event.setTown1(town1);
	if (town2){
		event.setTown2(town2);
	}
	
    this.add(event);
};

EventList.prototype.add = function(event){
	this.getList().push(event);
};

EventList.prototype.addFleetEvent = function(fleet){
	if( fleet instanceof Fleet && fleet.isEvent() )
		this.add(fleet.toEvent());
};

EventList.prototype.addTrainEvent = function(slot, unit, count, key, time, start){
	var event = new EventCommon();
	var army = new Army();
	army.addCount(unit.getId(), count);
	
	event.setType(EventCommon.type.train);
	event.setData({
		army: army,
		slot: slot.getPos(),
	});
	event.setKey(key);
	event.setTime(time);
    event.setStart(start);
	event.setTown1(0);
	event.setTown2(slot.getTown().id);
	
	this.getList().push(event);
};

EventList.prototype.calcEventStartTime = function(events, pos){
	if (!events) {
		return timeMgr.getNow();
	}
	
	if (typeof(pos)=='undefined') pos = events.getLength() - 1;
	else pos--;
	if (pos > EventList.noPos) {
		var event = events.getElem(pos);
		return event.getTime();
	} else {
		return timeMgr.getNow();
	}
};

EventList.prototype.leaveEventTypes = function(listTypes){
	for (var eventPos = 0; eventPos < this.getList().length;) {
	
		var event = this.getList()[eventPos];
		if (utils.inArray(listTypes, event.type)) {
			eventPos++;
		} else {
			this.del(eventPos);
		}
	}
	return this;
};

EventList.prototype.removeEventType = function(type, townId){
	for (var eventPos in this.getList()) {
		event = this.getElem(eventPos);
		if (event.type == type) {
			if (typeof(townId) == 'undefined' || event.isGoingTo(townId)){
				this.del(eventPos);
			}
		}
	}
	return this;
	//event.type == EventCommon.type.market && event.isGoingTo(it.town.id)
};

EventList.prototype.removeEventFleet = function(){
	var list = this.getList();
	
	for (var eventPos in list) {
		if ( list[eventPos] instanceof EventFleet ) {
			this.del(eventPos);
		}
	}
	
	return this;
};

EventList.prototype.isBldQueueEmpty = function(town) {
	if (!town) town = wofh.town;
	
	return this.getBldQueue(false, town).length == 0;
};

EventList.prototype.isBldQueueOpen = function(town) {
	return this.getBldQueue(false, town).getLength() < (wofh.account.isPremium()? 3: 2);
};

EventList.prototype.sort = function() {
    this.list.sort(function(a, b){
        if( isNaN(a.getTime()) ) return -1;
        else if( isNaN(b.getTime()) ) return 1;
		
        return a.getTime() - b.getTime();
    });
	
	return this;
};

//расёт суммы входящих ресурсов
EventList.prototype.calcIncomRes = function(){
	var resources = new ResList();

	var tradersMove = this.getTownTradersMoves().getList();
	for( var move in tradersMove ){
		move = tradersMove[move];

		if( move.type == wTradersMove.moveType.sendres && move.town1 != wofh.town.id ){
			for(var res in move.data.res){
				resources.addCount(res, move.data.res[res]);
			}
		}
	}
	return resources;
};

EventList.prototype.hasCommander = function(){
	return this.each(function(event){
		if( (event.data||{}).commander )
			return true;
	});
};


EventList.noPos = -1;