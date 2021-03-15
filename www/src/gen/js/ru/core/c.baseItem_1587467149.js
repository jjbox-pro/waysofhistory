function BaseItem(){
	
}

//создаёт массив объектов из массива сырых данных
BaseItem.prepArray = function(array, cls){
	for(var item in array){
		array[item] = new cls().parseIdData(item, array[item]);
	}
};

BaseItem.prepArray2 = function(array, cls){
	for(var item in array){
		array[item] = new cls().parse(array[item]);
	}
};
//заменяет числа в массиве на объекты
BaseItem.replArray = function(data, repl, field){
	for(var item in data){
		if(repl[item]){
			data[field === undefined ? item : field] = repl[item][data[item]];
		} else {
			if(typeof(data[item]) == 'object') {
				BaseItem.replArray(data[item], repl, field);
			}
		}
	}
};

BaseItem.joinData = function(refArrays){
	for(var arr in refArrays){
		arr = refArrays[arr];
		
		for(var elem in arr)
			arr[elem].updLinks();
	}
};

BaseItem.getId = function (objOrId) {
	if ( objOrId instanceof Object ) 
		return objOrId.getId ? objOrId.getId() : objOrId.id;
	else 
		return objOrId;
};

BaseItem.getObj = function (objOrId) {
	if ( typeof(objOrId) == 'object' && objOrId instanceof this )
		return objOrId;
	
	return new this();
};

//ПАРСИНГ>

//парсим код-массив 
BaseItem.prototype.parseIdData = function(id, data){
	//сводим к обычному массиву
	if( utils.isArray(data) )
		data = [id].concat(data);	
	else
		data.id = data.id||id;
	
	return this.parse(data);
};

//парсим массив - заглушка
BaseItem.prototype.parseArr = function(arr){
	//преобразуем массив в объект и передаём в функцию parse
	return this;
};


//парсим данные в объекте - главная функция
BaseItem.prototype.parse = function(data){
	if( utils.isArray(data) )
		data = this.parseArr(data);
	
	utils.copy(this, data);
	
	this.checkId();
	
	this.checkUnknown();
	
	this.unpack();
	
	return this;
};

// Проверка на строковые id-ки
BaseItem.prototype.checkId = function(){
	if( this.id ) this.id = utils.toInt(this.id);
};

BaseItem.prototype.getId = function(){
	return this.id;
};

BaseItem.prototype.checkUnknown = function(){};

//распаковка -заглушка
BaseItem.prototype.unpack = function(){
	//нужно учитывать, что данные могут прийти уже распакованными
};


//<ПАРСИНГ

BaseItem.prototype.clone = function(){
	var data = {};
	for (var i in this) {
		if (this.hasOwnProperty(i)) {
			if (this[i] instanceof Object && !this[i] instanceof BaseItem) {
				data[i] = this[i].clone ? this[i].clone() : utils.clone(this[i], true);
			} else {
				data[i] = this[i];
			}
		}
	}
	
	return new this.constructor().parse(data);
};

//обновляет ссылки на другие объекты
BaseItem.prototype.updLinks = function() {};


//РАСШИРЯЕМ СВОЙСТВА

//расширение свойств объекта
BaseItem.prototype.extend = function(data){
	data = this.prepExtend(data);
	
	utils.copyProperties(this, data);
	
	this.unpack();

	return this;
};

//заглушка - действия над свойствами, чтобы не затереть нужное
BaseItem.prototype.prepExtend = function(data){
	return data;
};
/*
BaseItem.prototype.update = function(data){
};*/

//проверка уровня формата - какие данные есть.
BaseItem.prototype.checkLvl = function(checkLvl){
	if (typeof(checkLvl) == 'function'){
		//проверка по свойствам
		return checkLvl(this);   
	} else {
		//проверка по уровням
		return this['checkLvl'+checkLvl]();
	}
		
}

BaseItem.prototype.checkLvl1 = function(){
	return this.hasOwnProperty('id') && this.hasOwnProperty('name')
}


BaseItem.getList = function(obj){
	if (obj instanceof Town) return 'towns';
	if (obj instanceof Account) return 'accounts';
	if (obj instanceof Country) return 'countries';
};


function BaseAccOrCountry (a, b, c, d, e){
	//находим в данных id
	var id;

	if ( typeof(a) == 'object' ){
		id = a[0];
	} else {
		id = a;
	}

	if (BaseAccOrCountry.isCountry(id)) {
		return new Country();
	} else {
		return new Account();
	}
}

BaseAccOrCountry.isCountry = function(id){
	return id > BaseAccOrCountry.countryK;
};

BaseAccOrCountry.clearId = function(id){
	return id > BaseAccOrCountry.countryK? id%BaseAccOrCountry.countryK: id
}


//коэффициент для проверки, аккаунт или страна
BaseAccOrCountry.countryK = 1e6;