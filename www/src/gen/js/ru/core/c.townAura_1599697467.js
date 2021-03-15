TownAura = function(data, town) {
    this.data = data;
    this.data.personal = this.data.personal||{};// по городам игрока
    this.data.country = this.data.country||{};// по стране
	
    this.town = town;
};

TownAura.prototype._getGlobal = function(aura){
    if ( aura == TownAura.getAura(Slot.ids.pyramid) ) return wofh.global.wonders73||0;
    if ( aura == TownAura.getAura(Slot.ids.garden) ) return wofh.global.wonders92||0;
	
	return 0;
};

TownAura.prototype._getPersonal = function(aura){
	return this.town.account.getAuraWonders(aura);
};

TownAura.prototype._getCountry = function(aura){
	var count = 0;
	
	if( wofh.country )
		count = wofh.country.getAuraWonders(aura);
	
    return count;
};


TownAura.prototype.getCult = function(iterator){
    var wondersIds = TownAura.ids.cult.bld,
        wonderId, effect = 0, effectSum = 0;
    
    for(var i in wondersIds){
        wonderId = wondersIds[i];
        
        effect = this.calcWonderEffect(wonderId, WonderEffect.ids.cult);
        
        if( !(effect > 0) )
            continue;
        
        effectSum += effect;
        
        if( iterator )
            iterator(new Slot(wonderId), effect);
    }
    
    return effectSum;
};

TownAura.prototype.getGrown = function(iterator){
    var wondersIds = TownAura.ids.grown.bld,
        wonderId, effect = 0, effectSum = 0;
    
    for(var i in wondersIds){
        wonderId = wondersIds[i];
        
        effect = this.calcWonderEffect(wonderId, WonderEffect.ids.grown);
        
        if( !(effect > 0) )
            continue;
        
        effectSum += effect;
        
        if( iterator )
            iterator(new Slot(wonderId), effect);
    }
    
    return effectSum;
};

TownAura.prototype.calcWonderEffect = function(wonderId, wonderEffectType){
    var countryCount, globalCount, wonderEffect, globalEffect, countryEffect, townWonder = this.town.getSlots().getWonder();
    
    countryCount = Math.max(this._getCountry(TownAura.getAura(wonderId)), this._getPersonal(TownAura.getAura(wonderId)));
    globalCount = this._getGlobal(TownAura.getAura(wonderId));
    
    if( townWonder.getId() == wonderId && townWonder.isActive() ) {
        countryCount = 0;

        globalCount--;
    }

    if( countryCount > 0 )
        globalCount--;

    wonderEffect = WonderEffect.getEffect(wonderId, wonderEffectType);

    countryCount = Math.max(0, Math.min(1, countryCount));
    globalCount = Math.max(0, Math.min(wonderEffect.maxglobal, globalCount));

    countryEffect = wonderEffect.getCountry();
    globalEffect = wonderEffect.getGlobal();

    return globalCount * globalEffect + countryCount * (countryEffect + globalEffect);
};


TownAura.prototype.hasColossus = function(){
    return this._getCountry(TownAura.getAura(Slot.ids.colossus)) + this._getPersonal(TownAura.getAura(Slot.ids.colossus)) != 0;
};

TownAura.prototype.getColossusEffect = function(){
    var build = TownAura.ids.colossus.bld;
    
	var effect = WonderEffect.ids.resForBuild;
	
    return WonderEffect.getEffect(build, effect);
};

TownAura.prototype.getLasVegasIncom = function(){
    return this.data.vegas;
};

TownAura.prototype.getLasVegasOutcome = function(){
    return this.data.vegas;
};


TownAura.ids = {
    cult: {
        pos: 0,
        bld: [Slot.ids.pyramid],
    },
    grown: {
        pos: 1,
        bld: [Slot.ids.garden],
    },
    vegas: {
        pos: 2,
        bld: Slot.ids.lasVegas,
    },
    colossus: {
        pos: 3,
        bld: Slot.ids.colossus,
    },
    oracle: {
        pos: 4,
        bld: Slot.ids.oracle,
    }
};

TownAura.auras = {};
TownAura.auras[Slot.ids.pyramid] = 'pyramid';
TownAura.auras[Slot.ids.garden] = 'garden';
TownAura.auras[Slot.ids.colossus] = 'coloss';

TownAura.getAura = function(wonderId){
	return TownAura.auras[wonderId];
};

TownAura.getWonderId = function(aura){
	for(var wonderId in TownAura.auras)
		if( TownAura.auras[wonderId] == aura )
			return wonderId;
};