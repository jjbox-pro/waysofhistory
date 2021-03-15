function EventCommon (data) {
	if (data) this.parse(data);
	
	if (this.getType() == EventCommon.type.buildI) {
		this.getBuildSlot().getCurState().getActions().add(this);
	}
};

utils.extend(EventCommon, Element);


//Типы событий (слоты на самом деле 0-99)
EventCommon.type = {
	train: 0,
    spaceship: 1,
	defence: 100,
	attack: 101,
	armyreturn: 102,
	maketown: 103,
	makeres: 104,
	buildI: 105,
	spy: 106,
	townbonus: 107, // Бонус для города. Приходит только при включении бонуса (возможно при завершении, но это не точно. Проверить).
	trade: 108,
	market: 109,
	stream: 111,
	makeroad: 113,
	explore: 114,
	makeimp: 115,
	battle: 201,//битва
	//spaceon:300,//не знаю id
	invasion: 500,
};

//Событие использует и второй город
EventCommon.useTown2 = [
	EventCommon.type.defence,
	EventCommon.type.attack,
	EventCommon.type.trade,
	EventCommon.type.stream
];

EventCommon.battleState = {
	wait: 0,
	enter: 1,
	active: 2,
	finished: 3,
    'delete': 4,
	waitForNextBattle: 5
};

EventCommon.getId = function (objOrId) {
	if (typeof(objOrId) == 'object') return objOrId.getId();
	else return objOrId;
};


EventCommon.prototype.getType = function(){
	return this.type;
};

EventCommon.prototype.setType = function(type){
	this.type = type;
};

EventCommon.prototype.getData = function(field){
	return field === undefined ? this.data : this.data[field];
};

EventCommon.prototype.setData = function(data){
	this.data = data;
};

EventCommon.prototype.getKey = function(){
	return this.key;
};

EventCommon.prototype.setKey = function(key){
	this.key = key;
};

EventCommon.prototype.getId = function(){
	return this.id;
};

EventCommon.prototype.setId = function(id){
	this.id = id;
};

EventCommon.prototype.getTime = function(){
	return this.time;
};

EventCommon.prototype.getTimeLeft = function(){
	return Math.max(0, this.getTime() - timeMgr.getNow());
};

EventCommon.prototype.setTime = function(time){
	this.time = time;
};

EventCommon.prototype.isHappened = function(){
	// ... <= 100500 - невелирование разницы между временем наступления события и текущим временем на клиенте
	return this.getTime() - timeMgr.getNow() <= 5;
};


EventCommon.prototype.getStart = function(){
	return this.start;
};

EventCommon.prototype.setStart = function(start){
	this.start = start;
};

EventCommon.prototype.getActionTime = function(){
	return this.time - (this.getStart()||0);
};

EventCommon.prototype.getTown1 = function(){
	return this.town1;
};

EventCommon.prototype.setTown1 = function(town1){
	this.town1 = typeof(town1 =='object')? town1.id: town1;
};

EventCommon.prototype.getTown2 = function(){
	return this.town2;
};

EventCommon.prototype.setTown2 = function(town2){
	this.town2 = town2;
};

//направление перемещения
EventCommon.prototype.isGoingTo = function(townId) {
	return this.getTown2() == townId;
};

EventCommon.prototype.isIncom = function(town){
	if(!town) town = wofh.town;
	
	return this.isGoingTo(town.id);
};

EventCommon.prototype.isOutgo = function(townId){
	return	this.getTown1() == townId && 
			this.getTown1() != this.getTown2(); // Может быть в случае отзыва своего подкрепа из ВО на свой город
};

EventCommon.prototype.isForTown = function(town){
	town = town||wofh.town;
	
	return town.id == this.getTown1() || town.id == this.getTown2();
};



//Зависят от типа
EventCommon.prototype.getSlot = function(){
	//слот всегда находится в состоянии до срабатывания события
	return this.getData().slot || false;
};

EventCommon.prototype.getBuildSlot = function(){
	var slot = wofh.towns[this.getTown1()].getSlot(this.getSlotPos()).clone();
	
	var slotActions = slot.getActions();
	
	for( var event in slotActions.getList() ){
		event = slotActions.getElem(event);
		
		if( event == this )
			break;
		
		slot = slot.applyEvent(event);
	}
	
	slot.actions.list = [this];
	
	return slot;
};

EventCommon.prototype.setSlot = function(slot){
	this.getData().slot = slot;
};

EventCommon.prototype.getAction = function(){
	return this.getData().action;
};

EventCommon.prototype.isBuild = function(){
	return this.getAction() == Slot.actionsIds.build;
};

EventCommon.prototype.isRebuild = function(){
	return this.getAction() == Slot.actionsIds.rebuild;
};

EventCommon.prototype.isDestroy = function(){
	return this.getAction() == Slot.actionsIds.destroy;
};

EventCommon.prototype.isDestroylevel = function(){
	return this.getAction() == Slot.actionsIds.destroylevel;
};

EventCommon.prototype.getSlotPos = function(){
	return this.getData().pos;
};

EventCommon.prototype.getBuildId = function(){
	return this.getData().buildId;
};

EventCommon.prototype.getArmy = function(){
	return this.getData().army;
};

EventCommon.prototype.getUnit = function(){
	return this.getData().army.getFirstUnit();
};

EventCommon.prototype.getCount = function(){
	return this.getData().count;
};

EventCommon.prototype.getCommander = function(){
	return this.getData().commander;
};

EventCommon.prototype.clone = function(){
	var event = new this.constructor();
	
	event.id = this.id;
	event.type = this.type;
	
	event.data = utils.clone(this.data);
	event.key = this.key;
	event.start = this.start;
	event.time = this.time;
	event.town1 = this.town1;
	event.town2 = this.town2;
    
	return event;
};

//На входе фирменный объект
//type - тип события (EventCommon.type)
//time - время наступления события 
//key - хэш-ключ (строка)
//data - дополнительные данные у события (зависят от типа события)
//town1, town2 - исходный и конечный города,
//duration - продолжительность события - дополнительный параметр для пересчёта очередей
EventCommon.prototype.parse = function(raw){
	if (raw.event < 100) {
		var slot = raw.event;
		this.type = EventCommon.type.train;
	} else {
		this.type = raw.event;
	}
	
    this.id = raw.id;
	this.start = raw.start;//иногда бывает
	this.time = raw.time;
	this.key = raw.key;
	
	//У возвращающейся армии города как у отправленной армии - разворачиваем
	this.town1 = raw.town1;
	this.town2 = raw.town2;
	this.reverseTowns();
	
    this.data = this.parseData(raw, raw.event);
};

EventCommon.prototype.parseData = function(raw, slot){
	if (this.type == EventCommon.type.spaceship) {//кк
		var data = {};
	} else {
		
		var data = raw.data|| {};
		
		if (this.type == EventCommon.type.stream){
			//
		} else if (this.type == EventCommon.type.makeres || this.type == EventCommon.type.makeroad || this.type == EventCommon.type.makeimp){
			data.army = new Army();
			data.army.addCount(Unit.ids.worker, data.workers);
		} else if (this.type == EventCommon.type.maketown){
			data.army = new Army();
			data.army.addCount(Unit.ids.settler, data.colonists);
		} else if (this.type == EventCommon.type.explore){
			data.army = new Army();
			data.army.addCount(Unit.ids.spy, data.spyes);
		} else if (this.type == EventCommon.type.train) {
			data.army = new Army();
			data.army.addCount(data.unit, data.count);
			data.slot = slot;
		} else if (this.type == EventCommon.type.buildI) {
			/*data.slot = wofh.towns[raw.town1].getSlot(raw.data.pos).applyEvents();
			data.slot.getActions().addElem(this)*/
			if (raw.data.id != Slot.actionsIds.rebuild && raw.data.id != Slot.actionsIds.destroy && raw.data.id != Slot.actionsIds.destroylevel) {
				data.action = Slot.actionsIds.build;
				data.buildId = raw.data.id;
			} else {
				data.action = raw.data.id;
			}
		} else if (this.type == EventCommon.type.armyreturn) {
			data.res = new ResList(data.res);
			data.army = new Army(data.army);
		} else {
			if(this.type == EventCommon.type.market){
				delete data.res;
			}
			if(data.res){
				data.res = utils.parseResString(data.res);
			}
			if(typeof(data.army) != 'undefined'){
				data.army = new Army(data.army.split('=')[0]);
			}
		}
	}
    if(raw.groupid){
        data.groupId = raw.groupid;
    }
    return data;
};

EventCommon.prototype.reverseTowns = function(){
	if(this.type == EventCommon.type.armyreturn || this.type == EventCommon.type.train){
		var tmpTown = this.town1;
		this.town1 = this.town2;
		this.town2 = tmpTown;
	}
	return this;
};

//ТРЕНИРОВКА
//возвращает число уже подготовленных юнитов
EventCommon.prototype.getTrainedUnitCount = function() {
	var unit = this.getUnit();
	
    return Math.max(0, utils.toInt((timeMgr.getNow() - this.getStart()) / this.getPeriod() * unit.getCount()));
};

//ТРЕНИРОВКА
//сколько длится тренировка
EventCommon.prototype.getPeriod = function() {
    return this.getTime() - this.getStart();
};

//ТРЕНИРОВКА
//находим момент, когда следующий юнит натренируется
EventCommon.prototype.getNextUnitReady = function(){
	var unit = this.getUnit();
	
	return this.getStart() + (this.getTrainedUnitCount() + 1) / unit.getCount() * this.getPeriod();
};

//событие строительства является текущим
EventCommon.prototype.isCurBuild = function() {
	var events = wofh.events.getBldQueue(false, this.getBuildSlot().getTown());
	var firstEvent = events.getFirst();
	return firstEvent && firstEvent.getId() == this.getId();
};

EventCommon.prototype.isSameEvent = function(event) {
	return this.getId() == event.getId();
};

//для событий строительства апдейтим слот
EventCommon.prototype.updateSlot = function() {
	var slot = this.getSlot().getCurState().clone();
	var events = wofh.events.getBldQueue(slot);
	
	for (var pos in events) {
		var event = events[pos];
		if (!this.isSameEvent(event)) {
			slot = slot.applyEvent(event);
		} else {
			slot.setActions(events.splice(pos, 1));
			break;
		}
	}
	
	this.setSlot(slot);
};

//продолжительность события
EventCommon.prototype.calcDuration = function(){
	switch (this.getType()) {
		case EventCommon.type.train:
            var slot = wofh.towns[this.getTown2()].getSlot(this.getSlot());
			return slot.calcTrainTime(this.getUnit(), this.getCount());
		case EventCommon.type.buildI:
			return this.getSlot().getEventTime(this);
	}
};

EventCommon.prototype.canCancel = function(){
    if (utils.inArray([EventCommon.type.spy, EventCommon.type.makeres, EventCommon.type.maketown, EventCommon.type.makeroad, EventCommon.type.explore, EventCommon.type.makeimp], this.getType())) return true;
    
	var returnperiod = this.getType() == EventCommon.type.defence ? lib.war.returndefendperiod : lib.war.returnattackperiod;
	
	var result = 
		(this.getStart() + returnperiod > timeMgr.getNow()) && 
		(!this.getArmy().isNuclear()) && 
		(!this.getArmy().isSpace()) &&
		(this.getType() != EventCommon.type.armyreturn);
	
	return result;
};

// Для событий подготовки потока
EventCommon.prototype.getDir = function(town){
	if( this.getType() != EventCommon.type.stream )
		return;
	
	if (!town) town = wofh.town;
	
	return this.getTown1() == town.id ? Stream.dirs.out : Stream.dirs.in;
};

EventCommon.prototype.getStage = function(){
	if( this.getType() == EventCommon.type.stream )
		return Stream.stages.opening;
};

EventCommon.prototype.getTax1 = function(){
	if( this.getType() == EventCommon.type.stream )
		return utils.calcObjSum(this.tax1);
};

EventCommon.prototype.getTax2 = function(){
	if( this.getType() == EventCommon.type.stream )
		return this.tax2||0;
};

EventCommon.prototype.getTown = function(town){
	if( this.getType() == EventCommon.type.stream ){
		return this.getDir(town) == Stream.dirs.out ? this.getTown2() : this.getTown1();
	}
};

EventCommon.prototype.calcPrice = function(){
	if( this.getType() == EventCommon.type.stream ){
		var data = this.getData();
		
		return Trade.calcStreamPrice(data.cost, data.count, data.tcost, data.traders);
	}
};

EventCommon.prototype.getFuel = function(count){
	if( this.getType() == EventCommon.type.stream ){
		var stream = new Stream(this.getData());
		
		return stream.getFuel(count);
	}
};

EventCommon.prototype.calcImmediateCost = function(){
	return this.data.luck !== undefined ? this.data.luck : Trade.calcImmediateCost(this.data.distance);
};


EventCommon.prototype.getBldQueuePos = function(bldqueue){
    // Считаем позицию в списке событий города
    bldqueue = (bldqueue||wofh.events.getBldQueue(false, wofh.towns[this.getTown1()])).getList();
	
    for(var eventI in bldqueue){
        if( bldqueue[eventI].getTime() == this.getTime() )
            return eventI;
    }
    
    return -1;
};

//исправляем косяк нессответствия форматов
EventCommon.prototype.getRoadDir = function() {
	return (this.data.direction+2)%8;
};

//список тайлов, на которые действует событие
EventCommon.prototype.getAffectedTiles = function(map, posTMT){
	var tiles = [];

	var tile = map.getTile(posTMT||this.data);
	
	if( tile ) {
		tiles.push(tile);
		
		if( this.type == EventCommon.type.makeroad ){
			tile = map.getTileByDir(tile[Tile.param.posTMT], this.getRoadDir());
			
			if( tile )
				tiles.push(tile);
		}
	}

	return tiles;
};

EventCommon.prototype.isAttack = function(noSpy){
	var type = this.getType();
	
	return type == EventCommon.type.attack || (!noSpy && this.isSpy());
};

EventCommon.prototype.isSpy = function(){
	return this.getType() == EventCommon.type.spy;
};

EventCommon.prototype.isDefence = function(){
	return this.getType() == EventCommon.type.defence;
};

EventCommon.prototype.isBattle = function(){
	return this instanceof EventBattle;
};


EventCommon.prototype.getArmyCls = function(){
	var cls = '';
	
	if( utils.inArray([EventCommon.type.makeres, EventCommon.type.maketown, EventCommon.type.makeroad, EventCommon.type.explore, EventCommon.type.makeimp], this.getType()) )
		cls = 'road';
	else if( utils.inArray([EventCommon.type.defence, EventCommon.type.armyreturn], this.getType()) )
		cls = this.isIncom() ? 'blue' : 'supp';
	else if( (this.isAttack() && this.isIncom()) || this.getType() == EventCommon.type.invasion )
		cls = 'att';
	else
		cls = 'green';
	
	return cls;
};

EventCommon.prototype.hasTrophy = function(){
	return this.getType() == EventCommon.type.armyreturn && this.data.res && !this.data.res.isEmpty();
};


// Событие перемещения войск с использованием флотов
function EventFleet (data) {
	if (data) this.parse(data);
};

utils.extend(EventFleet, EventCommon);

EventFleet.prototype.parse = function(data){
	this.town3 = data.town3;
	
	EventFleet.superclass.parse.apply(this, arguments);
};

EventFleet.prototype.clone = function(){
	var event = EventFleet.superclass.clone.apply(this, arguments);
	
	event.town3 = this.town3;
	
	return event;
};

// Порт погрузки
EventFleet.prototype.getTown3 = function(){
	return this.town3;
};

EventFleet.prototype.isForTown = function(town, noPorts){
	town = town||wofh.town;
	
	return !noPorts && town.id != this.getTown1() && town.id != this.getTown2() && town.id == this.getTown3();
};

EventFleet.prototype.isGoingTo = function(townId) {
	return this.getTown3() == townId && this.getType() == EventCommon.type.armyreturn;
};

EventFleet.prototype.isOutgo = function(townId, noPorts) {
	return this.getTown3() == townId && this.getType() != EventCommon.type.armyreturn;
};

/*
	Теоретически события при своём завершении должны всегда персчитывать глобальные данные. 
*/