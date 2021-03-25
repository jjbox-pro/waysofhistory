/*Базовый класс для всех списков*/
function CountList() {
	//сам список
	this.list = {};
	//тип элементов, используемых в списке
	this.elemClass = Element;
}

utils.extend(CountList, List);


CountList.prototype.toString = function (divider, charCount) {
	divider = divider || '^';
    charCount = charCount || 1;
	var str = '';
	for(var elemId in this.getList()){
		var count = this.getCount(elemId);
		str += utils.intToChar(+elemId, charCount) + count + divider;
	}
	return str;
};

CountList.prototype.toCountObj = function () {
	var obj = {};
	for(var elemId in this.getList()){
		var count = this.getCount(elemId);
        obj[elemId] = +count;
	}
	return obj;
};

//получить такой клон списка ресурсов
CountList.prototype.clone = function (withAttr) {
	var clone = new this.constructor().setSorted(this.sorted),
		list = this.getList();
	
	for (var elemId in list){
		elemId = this.sorted ? list[elemId].id : elemId;
		
		clone.setCount(elemId, this.getCount(+elemId));
        
		if( withAttr )
			utils.copyProperties(clone.getElem(elemId), this.getElem(elemId));
	}
	
	clone.allowZero = this.allowZero;
	
	return clone;
};


//*** Работа с элементом - количество ***//

//добавить количесто к ресурсу
CountList.prototype.addCount = function (elemId, count, ignoreZero) {
	if( !(count || this.allowZero || ignoreZero) ) return;
	
	var elem = this.createElem(elemId);
	
	elem.addCount(count);
	
	if ( !(elem.getCount() || this.allowZero || ignoreZero) ) this.delElem(elemId);
	
	return elem;
};

//установить количество ресурса
CountList.prototype.setCount = function (elemId, count) {
	var elem = this.createElem(elemId);
	
	elem.setCount(count);
	
	return this;
};

//получаем количество у элемента
CountList.prototype.getCount = function (elemId) {
	var elem = this.getElem(elemId);
	return elem ? elem.getCount() : 0;
};


//*** Математика и обработка массивов ***//

//умножить каждый из ресурсов в списке на скаляр
CountList.prototype.mult = function (mult) {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		elem.multCount(mult)
	}
	return this;
}

//сумма всех элементов списка
CountList.prototype.calcSum = function () {
	var sum = 0;
	for (var elemId in this.getList()) {
		sum += this.getCount(elemId);
	}
	return sum;
};

//возвращает список из положительных значений
CountList.prototype.onlyPositive = function () {
    var list = this.getList();
    
	if( this.sorted ){
		for (var i = 0; i < list.length; i++){
			if ( list[i].getCount() > 0 )
                continue;
            
            list.splice(i, 1);
            i--;
		}
	}
	else{
		for (var elem in list) {
			elem = list[elem];
            
			if (elem.getCount() > 0)
                continue;
            
            this.delElem(elem);
		}
	}
    
	return this;
};

//возвращает список с целыми числами
CountList.prototype.toInt = function () {
	for (var resId in this.list) {
		var res = this.list[resId];
		
		res.setCount(utils.toInt(res.getCount()));
	}
	
	return this;
};

//есть ли отрицательные значения у элементов
CountList.prototype.hasNegative = function () {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		if (elem.getCount() < 0) return true;
	}
	return false;
};

//прибавить один список ресурсов к другому
CountList.prototype.addList = function (list) {
	for (var elemPos in list.getList()) {
		var elem = list.getElemByPos(elemPos);
		this.addCount(elem.getId(), elem.getCount());
	}
	return this;
};

// вычесть один список из второго
CountList.prototype.diffList = function (list) {
	for (var elemId in list.getList()) {
		elemId = list.sorted ? list.getElemByPos(elemId).id : elemId;
		var count = this.getCount(elemId) - list.getElem(elemId).getCount();
		
		this.setCount(elemId, count);
	}
	return this;
};

//прибавить к каждому элементу константу
CountList.prototype.addNum = function (num) {
	for (var elemPos in this.getList()) {
		var elem = this.getElem(elemPos)
		elem.count = elem.count + num;
	}
	return this;
}

// равен ли один список другому
CountList.prototype.isEqual = function (list) {
    if( this.getLength() != list.getLength() )
        return false;
    
	for (var elemId in list.getList()) {
        if( this.getElem(elemId) && this.getElem(elemId).getCount() == list.getElem(elemId).getCount() )
            continue;
        else
            return false;
	}
	
	return true;
};

//округлить все ресурсы в списке
CountList.prototype.round = function () {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		elem.setCount(Math.round(elem.getCount()));
	}
	return this;
}

//округлить все ресурсы в списке
CountList.prototype.floor = function () {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		elem.setCount(Math.floor(elem.getCount()));
	}
	return this;
}

//округлить все ресурсы в списке
CountList.prototype.ceil = function () {
	for (var elemId in this.getList()) {
		var elem = this.getElem(elemId);
		elem.setCount(Math.ceil(elem.getCount()));
	}
	return this;
}

//сколько раз выбранный список ресурсов включён в текущий список ресурсов
//список ресурсов, количество, которое нужно набрать
//если количество не указано, выбирается по списку максимум, если указано, возвращает 0 или максимум
CountList.prototype.calcIncludeCount = function (list, need){
	var incCount = 999999999;
	var check = false;
	for (var elemId in list.getList()) {
		var elem1 = list.getCount(elemId);
		if (!elem1) continue;
		var elem2 = this.getCount(elemId);
		incCount = Math.min(incCount, elem2 / elem1);
        if (need && incCount < need) return 0;//быстрая проверка, если надо убедить
		check = true;
	}
	return check? incCount: 0;
}
/*
//можно ли включить выбранный список ресурсов в текущий список ресурсов
CountList.prototype.canInclude = function (list, need){
    if (!need) need = 1;
    return this.calcIncludeCount(list, need) ? true : false;
}*/

CountList.prototype.getMaxElem = function () {
	if (this.getLength()){
		var maxElem = new this.elemClass();
		maxElem.setCount(-99999999);
		for (var elemId in this.getList()) {
			var elem = this.getElem(elemId);
			if (elem.getCount() > maxElem.getCount()) {
				maxElem = elem;
			}
		}
		
		return maxElem;
	} else {
		return false;
	}
};

CountList.prototype.getMinElem = function () {
	if (this.getLength()){
		var minElem = new this.elemClass();
		minElem.setCount(99999999);
		for (var elemId in this.getList()) {
			var elem = this.getElem(elemId);
			if (elem.getCount() < minElem.getCount()) {
				minElem = elem;
			}
		}
		
		return minElem;
	} else {
		return false;
	}
};

CountList.prototype.getMaxCount = function () {
	var elem = this.getMaxElem();
	return elem ? elem.getCount() : 0;
};

CountList.prototype.getMinCount = function () {
	var elem = this.getMinElem();
	return elem ? elem.getCount() : 0;
};

//вычисляем список элементов, число которых больше максимума
CountList.prototype.calcOverflow = function (max){
	/*var list = this.constructor();
	for (var elem in this.getList()){
		elem = this.getElem(elem);

		if (elem.count > max) {
			elem.
		}
	}*/
}


//получение сортированного списка
CountList.prototype.sortByCount = function(dir) {
	dir = dir? 1: -1;
	this.sort(function(elem1, elem2){
		return (elem1.count > elem2.count? 1: -1) * dir;
	});
    
    return this;
};