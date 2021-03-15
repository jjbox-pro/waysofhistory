bScreenPage_town = function(){
	bScreenPage_town.superclass.constructor.apply(this, arguments);
};

utils.extend(bScreenPage_town, ScreenPage);


bScreenPage_town.prototype.calcName = function(){
	return 'town';
};

bScreenPage_town.prototype.addNotif = function(){
	this.notif.show = [
		Notif.ids.townName, 
		Notif.ids.accTowns, 
		Notif.ids.accBonus,
		Notif.ids.townPopSpread,
		{id: Notif.ids.accQuests, params: Quest.ids.townRename}
	];
	
	this.notif.other[Notif.ids.townCur] = this.updCurScreenInfo;
	this.notif.other[Notif.ids.event] = function(event){
		if( !event )
			return;
		
		var town = wofh.towns[event.getTown1()];
		
		if( town )
			notifMgr.runEvent(Notif.ids.townEvent, {town: town, event: event});
		
		town = wofh.towns[event.getTown2()];
		
		if( town )
			notifMgr.runEvent(Notif.ids.townEvent, {town: town, event: event});
	};
	
	bScreenPage_town.superclass.addNotif.apply(this, arguments);
};

bScreenPage_town.prototype.getData = function(){
	this.data.title = 'Город';
	
	bScreenPage_town.superclass.getData.apply(this, arguments);
};


bScreenPage_town.prototype.onOptionClick = function($option){
	var option = this.getOptionById($option.data('id'));
	
	this.setOption(option);
};


bScreenPage_town.prototype.getOptions = function(){
	var options = [],
		screenOptions = bScreenPage_town.superclass.getOptions.apply(this, arguments),
		townScreenInfo,
		towns = [], 
		option;
	
	if( screenOptions.length )
		townScreenInfo = screenOptions.shift().data.screenInfo;
	else
		townScreenInfo = this.data.screens[0];
	
	for(var town in wofh.towns){
		towns.push(wofh.towns[town]);
	}
	
	towns.sort(function(a, b){return b.id - a.id;});
	
	for(var town in towns){
		town = towns[town];
		
		option = new ScreenTownOption__({
			id: 'town_' + town.id,
			data: {
                town: town,
				screenInfo: townScreenInfo
			}
		});
		
		this.initOptionNotices(option, this.data.curScreenInfo.notices);
		
		options.push(option);
	}
	
	options = options.concat(screenOptions);
	
	if( options.length < 2 )
		options = [];
	
	return options;
};
	
	bScreenPage_town.prototype.initOptionNotices = function(option, notices){
		bScreenPage_town.superclass.initOptionNotices.apply(this, arguments);
		
		option.noticeParam = {town: option.data.town};
	};
	
	bScreenPage_town.prototype.calcCurOption = function(options){
		options = options||this.data.options;
		
		for(var option in options){
			option = options[option];
			
			if( this.data.curScreenInfo.index == 0 ){
				if( option.hasTown() && option.getTownId() == wofh.town.getId() )
					return option;
			}
			else if( this.data.curScreenInfo.index == option.data.screenInfo.index )
				return option;
		}
		
		return option;
	};
	
	bScreenPage_town.prototype.setOption = function(option){
		this.data.curOption = option;
		
		if( option.hasTown() ){
			this.setTown(+option.getTownId());
			
			if( this.isSelected() && this.data.curScreenInfo == this.data.screens[0] )
				return;
		}
		
		this.showScreenByIndex(option.data.screenInfo.index);
	};


bScreenPage_town.prototype.updCurScreenInfo = function(){
	this.data.curOption = this.calcCurOption();
	
	bScreenPage_town.superclass.updCurScreenInfo.apply(this, arguments);
};

bScreenPage_town.prototype.showNextScreen = function(){
	var screens = this.data.screens;
	
	if( !screens.length )
		return;
	
	if( this.isSelected() && this.allowNext() ){
		if( !this.data.options.length )
			return;
		
		var index = this.getCurOptionIndex() + 1, option;
		
		index = index%this.data.options.length;
		
		option = this.data.options[index];
		
		this.setOption(option);
	}
	else{
		this.showScreenByIndex(this.data.curScreenInfo.index);
		
		this.parent.hideOptions();
	}
};

bScreenPage_town.prototype.getCurScreenInfoId = function(curScreenInfo, opt){
	opt = opt||{};
	
	var postFix = '';
	
	if( opt.title )
		postFix = '_' + this.getCurOptionIndex();
	
	return bScreenPage_town.superclass.getCurScreenInfoId.apply(this, arguments) + postFix;
};

bScreenPage_town.prototype.getOptionById = function(optionId){
	var options = this.data.options;
	
	for(var option in options){
		if( options[option].id == optionId )
			return options[option];
	}
	
	return options[0];
};

bScreenPage_town.prototype.getCurOptionIndex = function(){
	var curOption = this.data.curOption;
	
	if( !curOption )
		return 0;
	
	for(var index in this.data.options){
		if( this.data.options[index].id == curOption.id )
			return +index;
	}
	
	return 0;
};

bScreenPage_town.prototype.getCurOptionId = function(){
    if( !this.data.curOption )
		return '';
    
	return this.data.curOption.id;
};

bScreenPage_town.prototype.setTown = function(id){
	appl.setTown(+id);
};