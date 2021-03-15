wAttacks = function(){
	wAttacks.superclass.constructor.apply(this, arguments);
};

utils.extend(wAttacks, Wnd);

WndMgr.regWnd('attacks', wAttacks);


wAttacks.prepareData = function(){
	return wofh.account.isPremium() ? {} : false;
};


wAttacks.prototype.calcName = function(){
	return 'attacks';
};

wAttacks.prototype.getData = function(){
	this.data.townAttackEvents = {};
	
	var list = wofh.events.list;

	for(var event in list){
		event = list[event];
		
		if( event.isAttack() ){
			if( !this.data.townAttackEvents[event.town2] )
				this.data.townAttackEvents[event.town2] = [];
			this.data.townAttackEvents[event.town2].push(event);
		}
	}
	
	this.data.townsAttack = [];
	
	for(var town in wofh.towns){
		town = wofh.towns[town];
		
		town.attacks = this.data.townAttackEvents[town.id];
		
		this.data.townsAttack.push(town);
	}
	
	this.data.townsAttack.sort(function(a,b){
		return a.id > b.id ? 1 : -1;
	});
	
	this.dataReceived();
};

wAttacks.prototype.afterDraw = function(){
	this.initScroll();
};
