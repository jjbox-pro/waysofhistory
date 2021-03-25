/* Базовый класс для списков */
function List() {
    this.initSorted();
	
	this.initList();
	
	this.initElemClass();
}

List.prototype.initSorted = function(){
	this.sorted = false;
};

List.prototype.initList = function(){
	this.list = this.sorted ? [] : {};
};

List.prototype.initElemClass = function(){
	this.elemClass = Element;
};


List.prototype.parse = function(data) {
	if( typeof(data) == 'string' )
		data = this.parseStr(data);
	
	this.parseArr(data);
};

List.prototype.setSorted = function(sorted, forceSort) {
	if( !forceSort && this.sorted == sorted )
		return this;
	
    this.sorted = sorted;
	
    var list = this.sorted ? [] : {};
	
    for (var item in this.list) {
        if( this.sorted )
            list.push(this.list[item]);
        else{
			item = this.list[item];
			
            list[item.getId()] = item;
        }
    }
	
    this.list = list;
	
    return this;
};

List.prototype.parseArr = function(arr) {
	this.list = {};
	
	for (var elemId in arr) {
		this.list[elemId] = new this.elemClass(elemId, arr[elemId]);
	}
};

List.prototype.clone = function(opt){
	opt = opt||{};
	
	var clone = new this.constructor().setSorted(this.sorted, true);
	
	for(var elemPos in this.getList()){
		var elem = this.getElemByPos(elemPos),
			elemClone = elem.clone();
		
		if( opt.extElemClone )
			opt.extElemClone(elemClone, elem, clone, this);
		
		clone.addElem(elemClone);
	}
	
	if( this.allowZero !== undefined )
		clone.allowZero = this.allowZero;
	
	return clone;
};

List.prototype.cloneDef = function(){
	return List.prototype.clone.apply(this, arguments);
};

List.prototype.cloneElements = function() {
	for (var elemId in this.getList()){
		var elem = this.getElem(elemId);
		
		this.list[elemId] = elem.clone();
	}
	
    return this;
};

List.prototype.setAllowZero = function(allowZero) {
	this.allowZero = allowZero;
	
    return this;
};

//*** Работа с элементом - объект ***//

List.prototype.createElem = function(elemId) {
	elemId = this.elemClass.getId(elemId);
	var elem = this.getElemRaw(elemId);
	if (!elem) {
		elem = new this.elemClass(elemId);
        if (this.sorted){
            this.list.push(elem);
        } else {
            this.list[elemId] = elem;
        }
	}
	return elem;
};

//PRIV удалить ресурс из списка
List.prototype.delElem = function(elem) {
	elem = this.getElem(elem);

	if( this.sorted ){
		var pos = this.getElemPos(elem);
		
		if( pos !== false )
			this.list.splice(pos, 1);
	}
	else
		delete this.list[Element.getId(elem)];	
	
	return elem;
};

List.prototype.popElem = function() {
	if ( this.sorted )
		return this.list.splice(-1)[0];
	else{
		var elem = this.getLast();
		
		if( !elem )
			return;
		
		delete this.list[Element.getId(elem)];
		
		return elem;
	}
};

//получаем элемент
List.prototype.getElem = function(elemId, def) {
	var elem = this.getElemRaw(elemId);
	
	if ( !elem ) elem = def === undefined ? new this.elemClass(elemId, 0) : def;
	
	return elem;
};

//получаем элемент
List.prototype.getElemRaw = function(elemId) {
	var elemId = this.elemClass.getId(elemId);
	
    if (this.sorted) {
        var elem = false;
        for (var elemPos in this.list){
            if (this.list[elemPos].id == elemId){
                elem = this.list[elemPos];
				
                break;
            }
        }
    } else {
        var elem = this.list[elemId];
    }
	
	return elem;
};

//получаем элемент
List.prototype.getElemByPos = function(pos) {
	if( this.sorted )
		return this.list[pos]||false;
	else{
		for (var elemId in this.list){
			if (elemId == pos) return this.list[elemId];
		}
	}
	
	return false;
};

//есть ли элемент в списке
List.prototype.hasElem = function(elemId) {
    elemId = Element.getId(elemId);
	return this.getElemRaw(elemId) ? true : false;
};

//первый элемент
List.prototype.getFirst = function() {
	for (var elem in this.list)
		return this.list[elem];
	
	return false;
};

List.prototype.getLast = function() {
	var elem = false;
	for (var elem in this.list)
		elem = this.list[elem];
	
	return elem;
};

//добавляет элемент. В сортированных списках добавляет элемент в конец!
List.prototype.addElem = function(elem) {
	elem = this.elemClass.getObj(elem);
    
    if ( this.sorted )
        this.list.push(elem);
    else
        this.list[elem.getId()] = elem;
	
	return elem;
};

List.prototype.unshiftElem = function(elem) {
	var elem = this.elemClass.getObj(elem);
	
	if ( this.sorted )
        this.list.unshift(elem);
    else
        this.addElem(elem);
	
	return elem;
};

List.prototype.getElemPos = function(elem) {
	for (var pos in this.list){
		if (this.list[pos].id == elem.id) {
			return pos;
		}
	}
	return false;
}

//заменяет элемент - актуально для сортированных списков, для несортированных аналогично .addElem
List.prototype.replaceElem = function(elem) {
	var elem = this.elemClass.getObj(elem);
    
    if (this.sorted){
        var pos = this.getElemPos(elem);
        if (pos === false){
        	this.list.push(elem);
        } else {
        	this.list[pos] = elem;
        }
    } else {
        this.addElem(elem);
    }
	return elem;
};

//записываем или удаляем
List.prototype.toggleElem = function(elem) {
	if( this.hasElem(elem.id) )
		this.delElem(elem);
	else
		this.addElem(elem);

	return this;
};


//*** Работа со списком ***//

//получение списка
List.prototype.getList = function(){
	return this.list;
};

//получение сортированного списка
List.prototype.getSortList = function(sortFieldOrFunk, dir) {
	this.setSorted(true);
    
	if( !sortFieldOrFunk )
		return this;
	else if( typeof(sortFieldOrFunk) == 'function' ){
		this.list = this.getList().sort(sortFieldOrFunk);
		
		return this;
	}
	
	this.list = this.getList().sort(function(a, b){
		a = typeof(a[sortFieldOrFunk]) == 'function' ? a[sortFieldOrFunk]() : a[sortFieldOrFunk];
		b = typeof(b[sortFieldOrFunk]) == 'function' ? b[sortFieldOrFunk]() : b[sortFieldOrFunk];

		if( dir )
			return a > b ? 1 : -1;
		else
			return a < b ? 1 : -1;
	});
	
	return this;
};

//получение сортированного списка
List.prototype.sort = function(func) {
	this.setSorted(true);
    
    this.list = this.getList().sort(func);
    
    return this;
};

//получение списка
List.prototype.getArray = function(){
    var array = [];
    for(var i in this.getList()){
        array.push(this.getElem(i))
    }
	return array;
}

//длина списка
List.prototype.getLength = function() {
	return utils.sizeOf(this.getList());
};

//проверка на пустоту
List.prototype.isEmpty = function() {
	return this.getLength() == 0;
};

//фильтрация по функции
List.prototype.filter = function(callback, context) {
	var list = this.getList();
	
	if( this.sorted ){
		for(var i = 0; i < list.length;){
			if( !callback.call(context||this, list[i], this) )
				this.delElem(list[i]);
			else
				i++;
		}
	}
	else{
		for(var elem in list){
			elem = list[elem];
			
			if( !callback.call(context||this, elem, this) )
				this.delElem(elem);
		}
	}
    
    return this;
};

List.prototype.each = function(callback, context){
	var list = this.getList(),
        result = false;
	
	for(var key in list){
		result = callback.call(context||this, list[key], key, this);
		
		if( result )
			return result;
	}
	
	return result;
};

//прибавить один список ресурсов к другому
List.prototype.joinList = function (list) {
	for (var elemPos in list.getList()) {
		var elem = list.getElemByPos(elemPos);
		this.addElem(elem);
	}
	return this;
};

List.prototype.joinUniqList = function (list) {
	for (var elemPos in list.getList()) {
		var elem = list.getElemByPos(elemPos);
		if ( !this.hasElem(elem) ) {
			this.addElem(elem);	
		}
	}
	
	return this;
};

//исключить из первого списка элементы из другого списка
List.prototype.unjoinList = function (list) {
	for (var elemPos in list.getList()) {
		var elem = list.getElemByPos(elemPos)
		this.delElem(elem);
	}
	return this;
};


/* Базовый класс для списка-массива */
function ArrayList(arr) {
	'use strict';
	
	this.elemClass = ArrayElem;
	
	this.list = [];
	
	this.parse(arr);
};

ArrayList.prototype.parse = function(arr){
	for(var elem in arr)
		this.addElem(new this.elemClass(arr[elem]));
	
	this.unpack();
};

ArrayList.prototype.each = function(callback, start, context){
	var list = this.getList();
	
	for(var i = (start||0); i < list.length; i++){
		var result = callback.call(context||this, list[i], i);
		
		if( result ) return result;
	}
	
	return false;
};

ArrayList.prototype.reindex = function(){
	this.each(function(arrayElem, index){
		arrayElem.setIndex(index);
	});
};

ArrayList.prototype.unpack = function(){
	this.reindex();
};

ArrayList.prototype.addElem = function(elem){
	if( !this.isElemClass(elem) )
		elem = new this.elemClass(elem);
	
	elem.setIndex(this.getLength());
	
	this.getList().push(elem);
		
	return elem;
};

ArrayList.prototype.insertElem = function(index, elem){
	if( !this.isElemClass(elem) )
		elem = new this.elemClass(elem);
	
	elem.setIndex(index);
	
	return this.getList()[index] = elem;
};

ArrayList.prototype.getElem = function(index){
	return this.getList()[index];
};

ArrayList.prototype.getLastElem = function(){
	return this.getElem(this.getLength()-1);
};

ArrayList.prototype.getFirstElem = function(){
	return this.getElem(0);
};

ArrayList.prototype.getList = function(){
	return this.list;
};

ArrayList.prototype.getLength = function(){
	return this.getList().length;
};

ArrayList.prototype.deleteElem = function(index){
	var elem = (this.getList().splice(index, 1)[0]);
	
	this.reindex();
	
	return elem;
};

ArrayList.prototype.findElem = function(filter){
	if( !filter ) return false;
	
	return this.each(function(arrayElem){
		if( filter(arrayElem) )
			return arrayElem;
	});
};

ArrayList.prototype.findEqualElem = function(elem){
	return this.findElem(function(arrayElem){
		return elem.isEqual(arrayElem);
	});
};

ArrayList.prototype.hasElem = function(elem){
	return !!this.findEqualElem(elem);
};

ArrayList.prototype.isEqual = function(arrayList){
	if( this.getLength() != arrayList.getLength() )
        return false;
	
	return !this.each(function(arrayElem, index){
		if( !arrayElem.isEqual(arrayList.getElem(index)) )
			return true;
	});
};

ArrayList.prototype.isEmpty = function(){
	return !this.getLength();
};

ArrayList.prototype.isElemClass = function(elem){
	return elem instanceof this.elemClass;
};


function Sort(field) {
	'use strict';
	
	this.setField(field);
};

Sort.prototype.getField = function(noDir){
	return noDir ? this.getUnreverseField() : this.field;
};

Sort.prototype.setField = function(field){
	this.field = '' + field;
	
	return this;
};

Sort.prototype.getReverseField = function(){
	return (this.isReverse() ? '' : Sort.reverse) + this.field;
};

Sort.prototype.getUnreverseField = function(){
	return this.isReverse() ? this.field.slice(1) : this.field;
};

Sort.prototype.setReverse = function(){
	this.setField(this.getReverseField());
	
	return this;
};

Sort.prototype.unsetReverse = function(){
	this.setField(this.getUnreverseField());
	
	return this;
};

Sort.prototype.changeDir = function(){
	if( this.isReverse() )
		this.unsetReverse();
	else
		this.setReverse();
	
	return this;
};

Sort.prototype.isReverse = function(){
	return this.field[0] == Sort.reverse;
};

Sort.prototype.isEqual = function(sort, noDir){
	if( !(sort instanceof Sort) )
		sort = new Sort(sort);
	
	return this.getField(noDir) == sort.getField(noDir);
};


Sort.reverse = '-';