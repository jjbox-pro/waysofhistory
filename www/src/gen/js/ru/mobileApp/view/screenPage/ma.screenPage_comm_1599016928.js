bScreenPage_communication = function(){
	bScreenPage_communication.superclass.constructor.apply(this, arguments);
};

utils.extend(bScreenPage_communication, ScreenPage);


bScreenPage_communication.prototype.calcName = function(){
	return 'communication';
};

bScreenPage_communication.prototype.getData = function(){
	this.data.title = 'Общение';
	
	bScreenPage_communication.superclass.getData.apply(this, arguments);
};

bScreenPage_communication.prototype.addNotif = function(){
	this.notif.show = [
        Notif.ids.accBonus,
		{id: Notif.ids.accQuests, params: [Quest.ids.bldAltair1, Quest.ids.rep, Quest.ids.message, lib.quest.ability.announces]}
	];

	bScreenPage_communication.superclass.addNotif.apply(this, arguments);
};