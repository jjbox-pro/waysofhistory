function EventBattle(raw) {
	this.type = EventCommon.type.battle;
	
	raw = raw||{};
	
	this.time = (raw.time || timeMgr.getNow()) * 1000;
	this.key = raw.session;
	
	this.town1 = raw.home||-1;
	this.town2 = raw.town||wofh.town.id;
	
	this.data = {};
    if (raw.army) {
        this.data.army = new Army(raw.army);
    }
    if (raw.armycurrent) {
        this.data.armycurrent = new Army(raw.armycurrent);
    }
    if (raw.side) {
        this.data.side = raw.side;
    }
	this.data.state = raw.state;
	
	this.data.secret = raw.secret;
	
}

utils.extend(EventBattle, EventCommon);



EventBattle.prototype.getState = function(){
    return this.data.state;
}

EventBattle.prototype.getSession = function(){
    return this.key;
}

EventBattle.prototype.getSecret = function(){
    return this.data.secret;
};