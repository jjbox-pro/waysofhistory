bMMenu_bonus.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.bonus;
};





bMMenu_defence.prototype.calcTmplFolder = function(){
	return tmplMgr.mmenu.defence;
};

bMMenu_defence.prototype.addNotif = function(){
	this.notif.show = [
		Notif.ids.townAttacks,
		Notif.ids.accBonus,//включение царьакки
		{id: Notif.ids.accQuests, params: Quest.ids.bldHouse3}
	];
};

utils.overrideMethod(bMMenu_defence, 'canDisplay', function __method__(){
	return Ability.map() && __method__.origin.apply(this, arguments);
});