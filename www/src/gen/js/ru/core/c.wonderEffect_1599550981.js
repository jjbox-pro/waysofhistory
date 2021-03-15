WonderEffect = function(effectId, data){
    this.effectId = effectId;
	
	utils.copy(this, data);
};

//эффект
WonderEffect.prototype.getEffect = function(buildId){
	// Жертвенник Эффект для казармы и бойцовской ямы (Костыль)
	if ( !this.effect && !this.effect1 && !this.effect2 )
		return this.getLocal() + this.getCountry() + this.getGlobal();
	else {
		if( buildId !== undefined && (this.buildid1 || this.buildid2) ){
			if( this.buildid1 == buildId )
				return this.effect1;
			else if( this.buildid2 == buildId )
				return this.effect2;
			else
				return 1;
		}
		else
			return this.effect !== undefined ? this.effect : 1;
	}
	/* Было
	else {
		if ( !this.data.effect )
			return this.getLocal() + this.getCountry() + this.getGlobal();
		else
			return this.data.effect;
	}
	*/
};

//эффект в городе - с учётом построек и т.п.
WonderEffect.prototype.getEffectTown = function(town){
   // if(this.effectId == )
};

WonderEffect.prototype.getLocal = function(){
    return this.local||0;
};

WonderEffect.prototype.getCountry = function(){
    return this.country||0;
};

WonderEffect.prototype.getGlobal = function(){
    return this.global||0;
};

WonderEffect.prototype.getBuild = function(){
    return this.buildid || this.buildid1 || this.buildid2;
};

WonderEffect.prototype.useBuild = function(buildId){
    return this.buildid == buildId || this.buildid1 == buildId || this.buildid2 == buildId;
};


WonderEffect.prototype.getRes = function(){
    return this.resid;
}
/*
WonderEffect.prototype.getUnitType = function(){
    return this.data.unittype;
}*/

WonderEffect.prototype.getFilter = function(){
    return this.filter;
};

WonderEffect.prototype.getUnit = function(){
    return this.unit || this.unit1 || this.unit2;
};

WonderEffect.prototype.hasEffectUnit = function(unitId){
    return this.unit == unitId || this.unit1 == unitId || this.unit2 == unitId;
};

WonderEffect.prototype.getUnits = function(){
    return this.units;
};

WonderEffect.getEffect = function(buildId, effectId){
    var effects = WonderEffect.getEffects(buildId);
    
    return effects ? effects[effectId] : false;
};

WonderEffect.getEffects = function(buildId){
    return WonderEffect.builds[buildId];
};

WonderEffect._addWonder = function(buildId, effectId, data){
    //if(!lib.wonder[buildId])lib.wonder[buildId] = {};
    if(!data)
        data = lib.wonder[buildId];
    
    WonderEffect.builds[buildId][effectId] = new WonderEffect(effectId, data);
    
};

//типы эффектов
WonderEffect.ids = {
    train: 0,//тренировка
    cult: 1,//культура
    res: 2,//ресурсы
    warbonus: 3,//военный бонус
    resForBuild: 4,//ресурсы за постройки
    space: 5,//полёт в космос
    grown: 6,//рост
    damageDefenceWood: 7,//повреждение деревянным войскам
    traders: 8,//увеличение торговцев
    oracle: 10,//предсказывает атакующие войска
    maxDefence: 11,//максимальные разрушения ограничены
    lasvegas: 12,//деньги с других городов
    slotCost: 13,//стоит стоит дешевле
    armySupply: 14,//армия меньше потребляет
	tradespeed: 15,//быстрый путь между аэропортами
};
WonderEffect.group = {};
WonderEffect.group[WonderEffect.ids.train] = Build.type.train;
WonderEffect.group[WonderEffect.ids.cult] = Build.type.culture;
WonderEffect.group[WonderEffect.ids.res] = Build.type.production;
WonderEffect.group[WonderEffect.ids.warbonus] = Build.type.train;
WonderEffect.group[WonderEffect.ids.resForBuild] = Build.type.production;
WonderEffect.group[WonderEffect.ids.space] = Build.type.administration;
WonderEffect.group[WonderEffect.ids.grown] = Build.type.grown;
WonderEffect.group[WonderEffect.ids.damageDefenceWood] = Build.type.train;
WonderEffect.group[WonderEffect.ids.traders] = Build.type.trade;
WonderEffect.group[WonderEffect.ids.oracle] = Build.type.train;
WonderEffect.group[WonderEffect.ids.maxDefence] = Build.type.train;
WonderEffect.group[WonderEffect.ids.lasvegas] = Build.type.production;
WonderEffect.group[WonderEffect.ids.slotCost] = Build.type.production;
WonderEffect.group[WonderEffect.ids.armySupply] = Build.type.train;

WonderEffect.group[WonderEffect.ids.tradespeed] = Build.type.tradespeed;


//привязка эффектов к чудесам
WonderEffect.builds = {};
for (var i in lib.wonder){
    WonderEffect.builds[i] = {};
}
WonderEffect.builds[30] = {};//аэропорт, которого почему то нет в списке
WonderEffect.builds[29] = {};//цуп, которого почему то нет в списке
WonderEffect.builds[77] = {};//космодром, которого почему то нет в списке
WonderEffect.builds[65] = {};//космодром, которого почему то нет в списке

WonderEffect._addWonder(9, WonderEffect.ids.train);
WonderEffect._addWonder(11, WonderEffect.ids.train);
WonderEffect._addWonder(29, WonderEffect.ids.space, {effect: true});
lib.wonder[29]={space: 1};
WonderEffect._addWonder(30, WonderEffect.ids.tradespeed, {effect: true});
WonderEffect._addWonder(43, WonderEffect.ids.cult);
WonderEffect._addWonder(56, WonderEffect.ids.res);
WonderEffect._addWonder(58, WonderEffect.ids.cult, {effect: lib.wonder[58].culture})
WonderEffect._addWonder(58, WonderEffect.ids.warbonus, {effect: lib.wonder[58].warbonus})
WonderEffect._addWonder(60, WonderEffect.ids.res);
WonderEffect._addWonder(73, WonderEffect.ids.cult);
/*WonderEffect._addWonder[73][WonderEffect.ids.cult].effect = 
        WonderEffect._addWonder[73][WonderEffect.ids.cult].local + 
        WonderEffect._addWonder[73][WonderEffect.ids.cult].country + 
        WonderEffect._addWonder[73][WonderEffect.ids.cult].global;*/
WonderEffect._addWonder(75, WonderEffect.ids.res, {
		resid: Resource.ids.money,
		effect: lib.wonder[75].local});
WonderEffect._addWonder(75, WonderEffect.ids.resForBuild, {
		resid: Resource.ids.money,
		effect: lib.wonder[75].effect,
		buildid: lib.wonder[75].buildid});
WonderEffect._addWonder(76, WonderEffect.ids.res);
WonderEffect._addWonder(77, WonderEffect.ids.space, {effect: true});
WonderEffect._addWonder(83, WonderEffect.ids.grown);
WonderEffect._addWonder(91, WonderEffect.ids.res, {resid: Resource.ids.science, effect: lib.wonder[91].science});
WonderEffect._addWonder(91, WonderEffect.ids.damageDefenceWood, {effect: lib.wonder[91].damage, unitsList:function(){
	return Army.getAll().filter(function(unit){
		var cost = unit.getCost(),
			wood = cost.getElem(Resource.ids.wood, false);
		
		if( wood && (wood.getCount()/cost.calcSum()) >= lib.wonder[91].woodk )
			return true;
		
		return false;
	});
	
	
}});
WonderEffect._addWonder(92, WonderEffect.ids.grown);
/*WonderEffect._addWonder(92][WonderEffect.ids.grown].effect = 
        WonderEffect._addWonder[92][WonderEffect.ids.grown].local + 
        WonderEffect._addWonder[92][WonderEffect.ids.grown].country + 
        WonderEffect._addWonder[92][WonderEffect.ids.grown].global;*/
WonderEffect._addWonder(94, WonderEffect.ids.traders, {effect: lib.wonder[94].traders});
WonderEffect._addWonder(95, WonderEffect.ids.train, {units: lib.wonder[95].units, effect: lib.wonder[95].train});
WonderEffect._addWonder(95, WonderEffect.ids.armySupply, {units: lib.wonder[95].units, effect: lib.wonder[95].train});

WonderEffect._addWonder(97, WonderEffect.ids.oracle);
WonderEffect._addWonder(98, WonderEffect.ids.train);
WonderEffect._addWonder(99, WonderEffect.ids.train);
WonderEffect._addWonder(100, WonderEffect.ids.maxDefence);
WonderEffect._addWonder(107, WonderEffect.ids.lasvegas);//лас-вегас
WonderEffect._addWonder(108, WonderEffect.ids.train, {effect: lib.wonder[108].effect, filter: function(unit){return unit.hasTag(Unit.tags.trooper) && !unit.isPeaceful();}});
WonderEffect._addWonder(112, WonderEffect.ids.slotCost);//стоимость слота