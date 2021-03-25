function Specialist(id, count) {
	Specialist.superclass.constructor.apply(this, arguments);
}

utils.extend(Specialist, Element);

Specialist.prototype.getName = function(type){
	type = type||'short';
	return Specialist.names[this.id][type];
};

Specialist.prototype.getType = function(){
	return Specialist.types[this.id];
};

Specialist.prototype.getDescription = function(){
	return Specialist.description[this.id];
};

Specialist.prototype.getRealCount = function(){
	return this.getCount() * Specialist.inverseBase;
};

Specialist.prototype.getEffect = function(){
	var arr = lib.town.specialists[this.id];
	
	return arr[1] + arr[2] * Math.pow(this.count, arr[3]);
};

Specialist.prototype.getEffectDesc = function(){
	return Specialist.effectDesc[this.id];
};

Specialist.prototype.getUp = function(){
	return new this.constructor(this.id, this.count + 1);
};

Specialist.prototype.getDown = function(){
	return new this.constructor(this.id, this.count - 1);
};

Specialist.prototype.getResType = function(){
	switch(this.id){
		case Specialist.ids.science: return Resource.ids.science;
		case Specialist.ids.money: return Resource.ids.money;
		case Specialist.ids.food: return Resource.prodtypes.food;
		case Specialist.ids.production: return Resource.prodtypes.production;
		default: return false;
	}
};

Specialist.prototype.hasTownEffect = function(town){	
	var has = false;
	
	town = town||wofh.town;

	if( this.getId() == Specialist.ids.culture || this.getId() == Specialist.ids.grown ){
		has = !!(this.getId() == Specialist.ids.culture ? town.getCult() : town.getGrownInc());
	}
	else if( this.getId() == Specialist.ids.war ){
		has = !!utils.toPercent(town.getWarBonus()-1);
	}
	else{
		var resType = this.getResType(),
			resIncList = town.stock.getIncList(true),
			resList = ResList.getAll();
		
		if( resType !== false ){
			if( resType == Resource.prodtypes.food ){
				resList.delElem(Resource.ids.food);
			}
			
			resList = resList.getList();
			
			for( var res in resList ){
				res = resList[res];
				
				if( res.getProdtype() == resType ){
					has = !!(resIncList.getElem(res.id).getCount());
					
					if( has ) break;
				}
			}
		}
	}
	
	return has;
};

Specialist.prototype.isWar = function(){
	return this.id == Specialist.ids.war;
};


Specialist.base = 100; // Количество из расчута на 100 человек
Specialist.inverseBase = 0.01;

Specialist.ids = {
	science: 0,
	production: 1,
	food: 2,
	money: 3,
	war: 4,
	culture: 5,
	grown: 6,
};

Specialist.types = {};
Specialist.types[Specialist.ids.science] = 'science';
Specialist.types[Specialist.ids.production] = 'production';
Specialist.types[Specialist.ids.food] = 'food';
Specialist.types[Specialist.ids.money] = 'money';
Specialist.types[Specialist.ids.war] = 'war';
Specialist.types[Specialist.ids.culture] = 'culture';
Specialist.types[Specialist.ids.grown] = 'grown';

Specialist.names = {};
Specialist.names[Specialist.ids.science] = {full: 'Great Scientist', short:'scientist', prize:'Great Scientist'};
Specialist.names[Specialist.ids.production] = {full: 'Great Engineer', short:'engineer', prize:'Great Engineer'};
Specialist.names[Specialist.ids.food] = {full: 'Great Agronomist', short:'agronomist', prize:'Great Agronomist'};
Specialist.names[Specialist.ids.money] = {full: 'Great Financier', short:'financier', prize:'Great Financier'};
Specialist.names[Specialist.ids.war] = {full: 'Great General', short:'general', prize:'Great General'};
Specialist.names[Specialist.ids.culture] = {full: 'Great Creator', short:'creator', prize:'Great Creator'};
Specialist.names[Specialist.ids.grown] = {full: 'Great Doctor', short:'doctor', prize:'Great Doctor'};

Specialist.description = {};
Specialist.description[Specialist.ids.science] = 'Increases efficiency of ' + snip.res(Resource.ids.science) + 'knowledge production in the city of staying.';
Specialist.description[Specialist.ids.production] = 'Increases efficiency of ' + snip.icon(snip.c.bonusScience, 'production') + 'industrial resources production in the city of staying.';
Specialist.description[Specialist.ids.food] = 'Increases efficiency of ' + snip.resProdtypeIcon(Resource.prodtypes.food) + 'agricultural resources production in the city of staying.';
Specialist.description[Specialist.ids.money] = 'Increases efficiency of ' + snip.res(Resource.ids.money) + 'money production in the city of staying.';
Specialist.description[Specialist.ids.war] = 'Increases strength in offense and defense of that army, that belongs to the city of staying.';
Specialist.description[Specialist.ids.culture] = 'Increases ' + snip.icon(snip.c.bonusScience, 'culture') + 'culture in the city of staying.';
Specialist.description[Specialist.ids.grown] = 'Increases ' + snip.icon(snip.c.bonusScience, 'grown') + ' population growth in the city of staying.';

Specialist.effectDesc = {};
Specialist.effectDesc[Specialist.ids.science] = 'Increases production of ' + snip.res(Resource.ids.science) + 'knowledge';
Specialist.effectDesc[Specialist.ids.production] = 'Increases production of ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.production)) + 'industrial resources - ' + snip.resBigList(ResList.getAll().getProd(), true);
Specialist.effectDesc[Specialist.ids.food] = 'Increases the production of ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.food)) + 'agricultural resources - ' + snip.resBigList(ResList.getAll().getAgro(), true);
Specialist.effectDesc[Specialist.ids.money] = 'Increases production of ' + snip.res(Resource.ids.money) + 'money';
Specialist.effectDesc[Specialist.ids.war] = 'Increases power of army in attack and defense';
Specialist.effectDesc[Specialist.ids.culture] = 'Increases ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.culture)) + 'cultural limit';
Specialist.effectDesc[Specialist.ids.grown] = 'Increases ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.grown)) + 'population growth';