bScreenPage_different = function(){
	bScreenPage_different.superclass.constructor.apply(this, arguments);
};

utils.extend(bScreenPage_different, ScreenPage);


bScreenPage_different.prototype.calcName = function(){
	return 'different';
};

bScreenPage_different.prototype.getData = function(){
	this.data.title = 'Разное';
	
	bScreenPage_different.superclass.getData.apply(this, arguments);
};

bScreenPage_different.prototype.addNotif = function(){
	this.notif.show = [
		Notif.ids.countryChange,
		{id: Notif.ids.accAbilities, params: [Ability.ids.science, Ability.ids.money]}
	];
	
	bScreenPage_different.superclass.addNotif.apply(this, arguments);
};