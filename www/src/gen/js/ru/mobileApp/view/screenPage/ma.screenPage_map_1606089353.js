bScreenPage_map = function(){
	bScreenPage_map.superclass.constructor.apply(this, arguments);
};

utils.extend(bScreenPage_map, ScreenPage);


bScreenPage_map.prototype.calcName = function(){
	return 'map';
};

bScreenPage_map.prototype.addNotif = function(){
    if( !Ability.mapMini() ){
        this.notif.other[Notif.ids.accQuests] = function(){
            this.detachNotifElem(Notif.ids.accQuests);
            
            this.show();
			
            this.showBlink();
		};
        
        this.notif.other[Notif.ids.accQuests].params = [Quest.ids.deposit];
    }
    
	if( !Ability.mapBuild() ){
		this.notif.other[Notif.ids.accResearch] = function(){
			if( !Ability.mapBuild() )
                return;
            
            this.detachNotifElem(Notif.ids.accResearch);
            
            this.show();
            
            this.showBlink();
		};
    }
	
	this.notif.other[Notif.ids.mobAppMiniMapOnToggle] =
	this.notif.other[Notif.ids.mobAppMActionsOnToggle] = this.onOptionToggle;
};


bScreenPage_map.prototype.onOptionClick = function($option){
	var index = this.getOptionIndexById($option.data('id'))%this.data.options.length,
		option = this.data.options[index];
	
	if( wndMgr.getScreen().constructor == this.data.curScreenInfo.constructor )
		this.showScreenByOption(option);
	else{
		if( option.setLS )
			option.setLS(true);
		
		this.showScreenByIndex(0);
	}
};


bScreenPage_map.prototype.getOptions = function(){
	/* Для карты элементами опций пока являються её чилды и работа с ними. */
	
	var options = [];
	
	var option = new ScreenMapOption__({
		id: 'map',
		name: 'map',
		order: 0,
		data: {
			screenInfo: {
				index: 'map',
				getTitle: function(){
					return 'Карта';
				},
                getImg: function(){
					return 'map';
				}
			}
		},
		setLS: function(toggle){
			if( toggle ){
				ls.setMiniMapOn(false);
				
				ls.setMActionsOn(false);
			}
		}
	});
	
	options.push(option);
	
    if( Ability.mapMini() ){
        option = new ScreenMapOption__({
            id: 'mapMini',
            name: 'minimap',
            order: 1,
            data: {
                screenInfo: {
                    index: 'mapMini',
                    getTitle: function(){
                        return 'Миникарта';
                    },
                    getImg: function(){
                        return 'mapMini';
                    }
                }
            },
            setLS: function(toggle){
                ls.setMiniMapOn(toggle);

                if( toggle )
                    ls.setMActionsOn(false);
            }
        });

        options.push(option);
    }
    else
        ls.setMiniMapOn(false); // На случай заместителя
	
	if( Ability.mapBuild() ){
		option = new ScreenMapOption__({
			id: 'mapActions',
			name: 'actions',
			order: 2,
			data: {
				screenInfo: {
					index: 'mapActions',
					getTitle: function(){
						return 'Строительство';
					},
                    getImg: function(){
                        return 'mapActions';
                    }
				}
			},
			setLS: function(toggle){
				ls.setMActionsOn(toggle);
				
				if( toggle )
					ls.setMiniMapOn(false);
			}
		});
		
		options.push(option);
	}
	else
        ls.setMiniMapOn(false); // На случай заместителя
    
	return options;
};

	bScreenPage_map.prototype.calcCurOption = function(options){
		options = options||this.data.options;
		
		var order = 0;
		
		if( ls.getMiniMapOn(false) )
			order = 1;
		else if( ls.getMActionsOn(false) )
			order = 2;
		
		return options[this.getOptionIndexByOrder(order, options)];
	};
    
bScreenPage_map.prototype.showScreenByIndex = function(index){
	if( wndMgr.getScreen().constructor == this.data.curScreenInfo.constructor && this.allowNext() ){
		index = (this.getCurOptionIndex() + 1)%this.data.options.length;
		
		this.showScreenByOption(this.data.options[index]);
	}
	else
		bScreenPage_map.superclass.showScreenByIndex.apply(this, arguments);
};

bScreenPage_map.prototype.showScreenByOption = function(option){
	var mapChild, secreen = wndMgr.getScreen();
	
	if( option.order > 0 ){
		mapChild = secreen.getChild(option.getName());
        
		if( mapChild.isExpanded() )
			return;
        
		mapChild.toggleExpand(true, {duration: wndMgr.swipeTime});
	}
	else{
        for(option in this.data.options){
            if( option < 1 )
                continue;
           
            option = this.data.options[option];
            
            mapChild = secreen.getChild(option.getName());
            
            if( mapChild.isExpanded() )
                mapChild.toggleExpand(false, {duration: wndMgr.swipeTime});
        }
	}
};

bScreenPage_map.prototype.updCurScreenInfo = function(screenInfo){
	this.data.curOption = this.calcCurOption();
	
	bScreenPage_map.superclass.updCurScreenInfo.apply(this, arguments);
};

bScreenPage_map.prototype.getCurScreenInfoId = function(curScreenInfo){
	return bScreenPage_map.superclass.getCurScreenInfoId.apply(this, arguments) + '_' + this.getCurOptionIndex();
};


bScreenPage_map.prototype.getOptionIndexByOrder = function(order, options){
	order = order||0;
	options = options||this.data.options;
	
    for(var index in options){
        if( options[index].order == order )
            return +index;
    }
    
	return 0;
};

bScreenPage_map.prototype.getOptionIndexById = function(id){
	id = id||'map';
	
    for(var index in this.data.options){
        if( this.data.options[index].id == id )
            return +index;
    }
    
	return 0;
};

 bScreenPage_map.prototype.getOptionById = function(optionId){
    for(var option in this.data.options){
        if( this.data.options[option].id == optionId )
            return this.data.options[option];
    }
    
    return null;
};
    
bScreenPage_map.prototype.getCurOptionIndex = function(){
	var curOption = this.data.curOption;
	
	if( !curOption )
		return 0;
	
	return this.getOptionIndexByOrder(curOption.order);
};

bScreenPage_map.prototype.getCurOptionId = function(){
    if( !this.data.curOption )
		return '';
    
	return this.data.curOption.id;
};

bScreenPage_map.prototype.onOptionToggle = function(){
	this.updCurScreenInfo();
};

bScreenPage_map.prototype.checkOptionsByAbil = function(abil){
    switch(abil){
        case Ability.ids.mapVersion:
            ls.setMiniMapOn(false);
            ls.setMActionsOn(false);
            
            break;
    }
};