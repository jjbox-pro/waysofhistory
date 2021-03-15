function Ability (data) {
    this.list = {};
}

Ability.prototype.init = function(){
    this.checkQuests();
    
    delete this.initing;
};

Ability.prototype.checkQuests = function(){
	this.set(Ability.ids.luckSubscription, LuckBonus.subscription.isActive());
	
    this.set(Ability.ids.map, Quest.isAvail(Quest.ids.map));
	
    this.set(Ability.ids.report, Quest.isAvail(Quest.ids.rep));
	
    this.set(Ability.ids.message, Quest.isAvail(Quest.ids.message));
	
    this.set(Ability.ids.rate, Ability.showRate());
    
    this.set(Ability.ids.science, Quest.isAvail(Quest.ids.sciSelect));
    
    this.set(Ability.ids.attack, Quest.isAvail(Quest.ids.attackBarb));
};

Ability.prototype.checkMap = function(){
	this.set(Ability.ids.mapVersion, Quest.isAvail(Quest.ids.town2));
};

Ability.prototype.checkTown = function(){
    this.set(Ability.ids.trade, wofh.town.traders.count > 0);
};

Ability.prototype.checkAccount = function(){
    this.set(Ability.ids.country, wofh.country ? true : false);
	
    this.set(Ability.ids.money, wofh.account.knowsMoney());
	
    this.set(Ability.ids.towns, wofh.account.isPremium());
	
	this.set(Ability.ids.specialist, wofh.account.isSpecWasObtained());
};

Ability.prototype.get = function(id){
    return this.list[id]||false;
};

Ability.prototype.set = function(id, val){
    var oldVal = this.list[id];
    this.list[id] = val;
    
    if( !oldVal && val && !this.initing )
        notifMgr.runEvent(Notif.ids.accAbilities, id);
};

//разные статичные абилки

Ability.showRate = function(){
    return Quest.isAvail(Quest.ids.bldAltair1);
};
Ability.showEconomy = function(){
    return Quest.isAvail(Quest.ids.resSpend);
};
Ability.isBarterAvailable = function(){
    return	!wofh.account.hasAbility(Science.ability.noBarter) || wofh.account.hasCounrtyBarter();
};
Ability.showTrade = function(){
    return Account.hasAbility(Science.ability.money);
};
Ability.popSpread = function(){
    return Quest.isAvail(Quest.ids.popSpread)
};
Ability.popSpreadAuto = function(){
    return Quest.isAvail(Quest.ids.resSpend)
};
Ability.map = function(){
    return Quest.isAvail(Quest.ids.map);
};
Ability.luck = function(){
    return Quest.isAvail(Quest.ids.luckBonus) || Quest.isAvail(Quest.ids.bldImm) || LuckBonus.subscription.isActive();
};
Ability.swap = function(){
    return Quest.isDone(Quest.ids.bldCollector1);
};
Ability.bldDestroy = function(){
    return Quest.isDone(Quest.ids.popSpread)
};
Ability.mapAura = function(){
    return Quest.isAvail(Quest.ids.country)
};
Ability.mapFilter = function(){
    return Quest.isAvail(Quest.ids.deposit)
};
Ability.announce = function(){
    return Quest.isAvail(lib.quest.ability.announces);
};
Ability.simulator = function(){
    return Quest.isAvail(Quest.ids.simulator) || wofh.account.pop > 100
};
Ability.forum = function(){
    return (Quest.isAvail(Quest.ids.day01092009) || wofh.account.pop > 100) && lib.main.community[wofh.platform.id]
};
Ability.support = function(){
    return wofh.account.pop > 50;
};
Ability.chat = function(){
    return Quest.isAvail(Quest.ids.bldAltair1);
};
Ability.mapBuild = function(){
    var can = Unit.isAvailAcc(Unit.ids.settler);
	
	if( !can )
		can = Unit.isAvailAcc(Unit.ids.worker) && wofh.account.research.road > 1;

	if( !can ){
		for(var env in wofh.account.research.env){
			if( wofh.account.research.env[env] ){
				can = true;
				
				break;
			}
		}
	}

	return can;
};
Ability.mapMini = function(){
    return Quest.isAvail(Quest.ids.deposit);
};


Ability.ids = {
    map: 0,//+
    report: 1,//+
    message: 2,//+
    rate: 3,//+
    country: 4,//+
    science: 5,//+
    money: 6,//+
    towns: 7, //+
    //economics: 8,//+
    trade: 9,//+
    attack: 10,//+
    mapVersion: 11,
	specialist: 13,
	luckSubscription: 14
};