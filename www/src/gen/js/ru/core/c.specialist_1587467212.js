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
Specialist.names[Specialist.ids.science] = {full: 'Великий Ученый', short:'ученый', prize:'Великий Ученый'};
Specialist.names[Specialist.ids.production] = {full: 'Великий Инженер', short:'инженер', prize:'Великий Инженер'};
Specialist.names[Specialist.ids.food] = {full: 'Великий Агроном', short:'агроном', prize:'Великий Агроном'};
Specialist.names[Specialist.ids.money] = {full: 'Великий Финансист', short:'финансист', prize:'Великий Финансист'};
Specialist.names[Specialist.ids.war] = {full: 'Великий Полководец', short:'полководец', prize:'Великий Полководец'};
Specialist.names[Specialist.ids.culture] = {full: 'Великий Творец', short:'творец', prize:'Великий Творец'};
Specialist.names[Specialist.ids.grown] = {full: 'Великий Врач', short:'врач', prize:'Великий Врач'};

Specialist.description = {};
Specialist.description[Specialist.ids.science] = 'Увеличивает эффективность выработки ' + snip.res(Resource.ids.science) + 'знаний в городе, где обитает.';
Specialist.description[Specialist.ids.production] = 'Увеличивает эффективность выработки ' + snip.icon(snip.c.bonusScience, 'production') + 'промышленных ресурсов в городе, где обитает.';
Specialist.description[Specialist.ids.food] = 'Увеличивает эффективность выработки ' + snip.resProdtypeIcon(Resource.prodtypes.food) + 'cельскохозяйственных ресурсов в городе, где обитает.';
Specialist.description[Specialist.ids.money] = 'Увеличивает эффективность выработки ' + snip.res(Resource.ids.money) + 'денег в городе, где обитает.';
Specialist.description[Specialist.ids.war] = 'Увеличивает силу армии города, в котором обитает, как в атаке, так и в защите.';
Specialist.description[Specialist.ids.culture] = 'Увеличивает предел ' + snip.icon(snip.c.bonusScience, 'culture') + 'Культуры города, где обитает.';
Specialist.description[Specialist.ids.grown] = 'Увеличивает ' + snip.icon(snip.c.bonusScience, 'grown') + ' прирост населения городе, где обитает.';

Specialist.effectDesc = {};
Specialist.effectDesc[Specialist.ids.science] = 'Увеличивает выработку ' + snip.res(Resource.ids.science) + 'знаний';
Specialist.effectDesc[Specialist.ids.production] = 'Увеличивает производство ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.production)) + 'промышленных ресурсов — ' + snip.resBigList(ResList.getAll().getProd(), true);
Specialist.effectDesc[Specialist.ids.food] = 'Увеличивает производство ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.food)) + 'сельскохозяйственных ресурсов — ' + snip.resBigList(ResList.getAll().getAgro(), true);
Specialist.effectDesc[Specialist.ids.money] = 'Увеличивает производство ' + snip.res(Resource.ids.money) + 'денег';
Specialist.effectDesc[Specialist.ids.war] = 'Увеличивает силу армии в атаке и защите';
Specialist.effectDesc[Specialist.ids.culture] = 'Увеличивает ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.culture)) + 'культурный предел';
Specialist.effectDesc[Specialist.ids.grown] = 'Увеличивает ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.grown)) + 'прирост населения';