function MilitaryElement(data) {
	$.extend(this, data instanceof Object ? data : {});
}

MilitaryElement.prototype.clone = function () {
	var data = {};
	for(var i in this){
		if( this.hasOwnProperty(i) )
			data[i] = this[i] instanceof Object ? utils.clone(this[i]) : this[i];
	}
	
	return new this.constructor(data);
};

MilitaryElement.prototype.getId = function () {
	return this.id;
};

MilitaryElement.getId = function (objOrId) {
	if (typeof(objOrId) == 'object') return objOrId.getId ? objOrId.getId() : objOrId.id;
	else return objOrId;
};

MilitaryElement.getObj = function (obj) {
	if( obj instanceof this )
		return obj;
	
	return new this(obj);
};



function Fleet(data, id) {
	this.id = +id;
	
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Fleet, MilitaryElement);

Fleet.prototype.isEvent = function(){
	return this.status == Fleet.status.moveDef || this.status == Fleet.status.moveAttack || this.status == Fleet.status.moveBack;
};

Fleet.prototype.toEvent = function(){
	var eventData = {};
	
	eventData.id = this.getEventId();
	
	eventData.town1 = this.t1; // Город отбытия
	eventData.town2 = this.t4; // Город прибытия
	
	eventData.town3 = this.t2; // Порт посадки
	
	eventData.time = this.arrive;
	
	eventData.event = this.getEventType();
	
	eventData.data = {};
	eventData.data.army = this.army;
	eventData.data.transport = new Army(this.transport);
	eventData.data.fleet = this.id;
	eventData.data.speed = Math.round(new Army(this.army).getSpeed());
	
	return new EventFleet(eventData);
};

Fleet.prototype.getEventType = function(){
	switch(this.status){
		case Fleet.status.moveDef:
			return EventCommon.type.defence;
		case Fleet.status.moveAttack:
			return EventCommon.type.attack;
		case Fleet.status.moveBack:
			return EventCommon.type.armyreturn;
	}
};

Fleet.prototype.getEventId = function(){
	return this.id + Fleet.eventPrefix;
};



Fleet.status = {
    moveDef: 0,
    moveAttack: 1,
    stayDef: 2,
    moveBack: 3,
    inBattle: 4
};

Fleet.eventPrefix = '_fleet';



function Reinforce(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Reinforce, MilitaryElement);

Reinforce.prototype.useTownFleet = function(town){
	if (!town) town = wofh.town;
	
	if( this.fleet ){
		var fleet = wofh.fleets.getElem(this.fleet);
		
		if( fleet.t1 != town.id && fleet.t2 == town.id && fleet.status == 2 )
			return true;
	}
};



function Commanding(data, id) {
	this.id = +id;
	
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Commanding, MilitaryElement);



function Battle(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Battle, MilitaryElement);

