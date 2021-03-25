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
Specialist.names[Specialist.ids.science] = {full: 'Große Wissenschaftler', short:'Wissenschaftler', prize:'Großer Wissenschaftler'};
Specialist.names[Specialist.ids.production] = {full: 'Große Ingenieur', short:'Ingenieur', prize:'Großer Ingenieur'};
Specialist.names[Specialist.ids.food] = {full: 'Große Agronom', short:'Agronom', prize:'Großer Agronom'};
Specialist.names[Specialist.ids.money] = {full: 'Große Finanzier', short:'Finanzier', prize:'Großer Finanzier'};
Specialist.names[Specialist.ids.war] = {full: 'Große Kriegsherr', short:'Kriegsherr', prize:'Großer Kriegsherr'};
Specialist.names[Specialist.ids.culture] = {full: 'Große Schöpfer', short:'Schöpfer', prize:'Großer Schöpfer'};
Specialist.names[Specialist.ids.grown] = {full: 'Große Arzt', short:'Arzt', prize:'Großer Arzt'};

Specialist.description = {};
Specialist.description[Specialist.ids.science] = 'Erhöht Effizienz der Produktion von ' + snip.res(Resource.ids.science) + 'Wissen in der Stadt des Wohnens.';
Specialist.description[Specialist.ids.production] = 'Erhöht Effizienz der Produktion von ' + snip.icon(snip.c.bonusScience, 'production') + 'industriellen Ressourcen in der Stadt des Wohnens.';
Specialist.description[Specialist.ids.food] = 'Erhöht Effizienz der Produktion von ' + snip.resProdtypeIcon(Resource.prodtypes.food) + 'landwirtschaftlichen Ressourcen in der Stadt des Wohnens.';
Specialist.description[Specialist.ids.money] = 'Erhöht Effizienz der Produktion von ' + snip.res(Resource.ids.money) + 'Geld in der Stadt des Wohnens.';
Specialist.description[Specialist.ids.war] = 'Erhöht Stärke von Armee der Stadt des Wohnens in Angriff und Verteidigung.';
Specialist.description[Specialist.ids.culture] = 'Erhöht ' + snip.icon(snip.c.bonusScience, 'culture') + 'Kulturlimit in der Stadt des Wohnens.';
Specialist.description[Specialist.ids.grown] = 'Erhöht ' + snip.icon(snip.c.bonusScience, 'grown') + ' Bevölkerungzuwachs in der Stadt des Wohnens.';

Specialist.effectDesc = {};
Specialist.effectDesc[Specialist.ids.science] = 'Erhöht die Produktion von ' + snip.res(Resource.ids.science) + 'Wissen';
Specialist.effectDesc[Specialist.ids.production] = 'Erhöht die Produktion von ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.production)) + 'industriellen Ressourcen - ' + snip.resBigList(ResList.getAll().getProd(), true);
Specialist.effectDesc[Specialist.ids.food] = 'Erhöht die Produktion von ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.food)) + ' landwirtschaftlichen Ressourcen - ' + snip.resBigList(ResList.getAll().getAgro(), true);
Specialist.effectDesc[Specialist.ids.money] = 'Erhöht die Produktion von ' + snip.res(Resource.ids.money) + 'Geld';
Specialist.effectDesc[Specialist.ids.war] = 'Erhöht die Stärke der Armee bei Angriff und Verteidigung';
Specialist.effectDesc[Specialist.ids.culture] = 'Erhöht ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.culture)) + 'das Kulturlimit';
Specialist.effectDesc[Specialist.ids.grown] = 'Erhöht ' + snip.specialistEffectIcon(new Specialist(Specialist.ids.grown)) + 'das Bevölkerungswachstum';