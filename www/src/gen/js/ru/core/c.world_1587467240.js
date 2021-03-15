function World(/*towns, accounts, countries*/) {
	'use strict';

	this.towns = {};
	this.accounts = {};
	this.countries = {};
};

World.prototype.init = function(){
	this.accounts[Account.hermit.id] = new Account(Account.hermit);
	this.accounts[Account.barbarian.id] = new Account(Account.barbarian);
	this.accounts[Account.admin.id] = new Account(Account.admin);
	
	return this;
};

World.prototype.parse = function(towns, accounts, countries){
	if( towns )
		for(var town in towns)
			towns[town] = this.addElem(new Town().parseIdData(town, towns[town]));
	
	if( accounts )
		for(var account in accounts)
			accounts[account] = this.addElem(new Account().parseIdData(account, accounts[account]));
	
	if( countries )
		for(var country in countries)
			countries[country] = this.addElem(new Country().parseIdData(country, countries[country]));
	
	BaseItem.joinData({towns: towns, accounts: accounts, countries: countries});
};

//вставка элемента
World.prototype.addElem = function(elem) {
	if( !elem ) return;
	
	var list = this[BaseItem.getList(elem)];

	if( list ){
		if (list[elem.id])
			list[elem.id].extend(elem);
		else
			list[elem.id] = elem.clone();

		elem = list[elem.id];
		
		elem.upd = timeMgr.getNow();
	}
	
	return elem;
};

World.prototype.addElemList = function(list) {
	for (var elem in list){
		this.addElem(list[elem]);
	}
};

World.prototype.updateLinks = function(ref){
	if( ref ){
		// Обновляем ссылки определённых элементов
		var worldList;
		
		for(var list in ref){
			worldList = this[list];
			
			if( !worldList )
				continue;
			
    		list = ref[list];
			
	    	for(var elem in list){
				elem = worldList[elem];
				
				if( elem )
					elem.updLinks();
			}
    	}
	}
	else
		BaseItem.joinData(this);
};

//получение элемента по типу
World.prototype.getListByCls = function(cls, id) {
	var list;
	
	if( cls == Town ) list = 'towns';
	else if( cls == Account ) list = 'accounts';
	else if( cls == Country ) list = 'countries';
	else if( cls == BaseAccOrCountry ) list = BaseAccOrCountry.isCountry(id) ? 'countries' : 'accounts';
 
	return list;
};

//получение элемента по типу
World.prototype.getElem = function(cls, id, checkLvl) {
	var list = this.getListByCls(cls, id);

	if (list){
		var elem = this[list][id];
		
		if( !elem ) return false;
		
		if( !checkLvl || elem.checkLvl(checkLvl) )
			return elem;
	}
	
	return false;
};

//получает элемент по типу, если его нет - загружает
//delay - если данные старые, то перезагружаем. По умолчанию true - проверка используется
World.prototype.getOrUpdElem = function(cls, id, checkLvl, callback, delay) {
	delay = delay === undefined ? 60 : delay;

	var elem = this.getElem(cls, id, checkLvl);
	
	if( !elem ) {
		this.updElem(cls, id, callback);
		
		return;
	}
	
	if( delay && timeMgr.getNow() - elem.upd > delay ){
		this.updElem(cls, id, callback);
		
		return;	
	}
	
	callback(elem);
};


//получает элемент по типу, если его нет - загружает
//delay - если данные старые, то перезагружаем. По умолчанию true - проверка используется
//World.prototype.getOrUpdElemList = function(cls, ids, checkLvl, callback, delay) {
//	var wait = ids.length;
//	var elemList = new List();
//
//	for (var id in ids){
//		id = ids[id];
//		
//		this.getOrUpdElem(cls, id, checkLvl, function(elem){
//			elemList.addElem(elem);
//			wait--;
//			if (wait == 0) {
//				callback(elemList);	
//			}
//		}, delay);
//	}
//};

World.prototype.updElem = function(cls, id, callback) {
	if (cls == Town)
		reqMgr.getTown(id, function(resp){
			if( !resp.town ) return; // Города не существует
			
			var elem = resp.town[id];
			wofh.world.addElem(elem);
			callback(elem);
		});
	if (cls == Account)
		reqMgr.getAccount(id, function(resp){
			if( !resp.account ) return; // Акка не существует
			
			var elem = resp.account[id];
			wofh.world.addElem(elem);
			callback(elem);
		}, {full: true});
	if (cls == Country)
       	reqMgr.getCountry(id, function(resp){
			var elem = (resp.country||{})[id];
			wofh.world.addElem(elem);
			callback(elem);
       	}, {full: true});
};

World.prototype.getTown = function(town, clone) {
	town = Element.getId(town);
	
	town = this.towns[town]||false;
	
	if( clone && town ) town = town.clone();
	
	return town;
};

World.prototype.getAccount = function(account, clone) {
	account = Element.getId(account);
	
	account = this.accounts[account]||false;
	
	if( clone && account ) account = account.clone();
	
	return account;
};

World.prototype.getCountry = function(country, clone) {
	country = Element.getId(country);
	
	country = this.countries[country]||false;
	
	if( clone && country ) country = country.clone();
	
	return country;
};


//устаревшие
World.prototype.getAccountByTown = function(town) {
	town = Element.getId(town);
	
	return this.getAccount((this.getTown(town)||{}).account);
};

World.prototype.getCountryByTown = function(town) {
	town = Element.getId(town);

	return this.getCountry((this.getAccountByTown(town)||{}).country);
};

World.prototype.getCountryByAccount = function(account) {
	account = Element.getId(account);
	
	return this.getCountry((this.getAccount(account)||{}).country);
};

World.prototype.prepareToStorage = function(world){
	if( !(world instanceof Object) )
		return {};
	
	for(var town in world.towns){
		town = world.towns[town];
		
		town.account = BaseItem.getId(town.account);
	};
		
	for(var account in world.accounts){
		account = world.accounts[account];
		
		account.country = BaseItem.getId(account.country);
		
		account.race = Element.getId(account.race);
	};
	
	return world;
};