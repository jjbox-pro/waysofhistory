/*Базовый класс для всех элементов списков*/
function Element(id, count) {
	this.id = +id;
	this.count = count||0;
}

Element.prototype.clone = function () {
	var clone = new this.constructor(this.getId(), this.getCount());
	
	return clone;
};

Element.prototype.getId = function () {
	return this.id;
};

Element.prototype.getCount = function () {
	return this.count;
};

Element.prototype.setCount = function (count) {
	this.count = +count;
	return this;
};

Element.prototype.addCount = function (count) {
	this.count += +count||0;
	return this;
};

Element.prototype.multCount = function (mult) {
	this.count *= mult;
	return this;
};


Element.prototype.floorCount = function () {
	this.count = Math.floor(this.count);
	return this;
};

Element.prototype.toFixed = function (n) {
	this.count = this.count.toFixed(n);
	return this;
};

Element.prototype.toStages = function () {
	this.count = utils.stages(this.count);
	return this;
};

Element.prototype.toInt = function () {
	this.count = utils.toInt(this.count);
	
	return this;
};

Element.prototype.ceil = function () {
	this.count = Math.ceil(this.count);
	
	return this;
};

Element.prototype.hasZeroCount = function () {
	return this.count == 0;
};

Element.prototype._getAddLib = function () {
	return this.constructor.lib[this.id]||{};
};

Element.prototype.is = function (id) {
	return this.id == Elem.getId(id);
};



Element.getId = function (objOrId) {
	if ( objOrId instanceof Object ) return objOrId.getId ? objOrId.getId() : objOrId.id;
	else return objOrId;
};

Element.getObj = function (objOrId, nullOrCount) {
	if( typeof(objOrId) == 'object' ){
		if( objOrId instanceof this )
			return objOrId;
		else{
			nullOrCount = objOrId.count||0;
			
			objOrId = objOrId.id;
		}
	}
	
	return new this(objOrId, nullOrCount);
};



/*Базовый класс для элементов списка-массива*/
function ArrayElem(data) {
	'use strict';
	
	this.parse(data);
};

ArrayElem.prototype.parse = function(data){
	$.extend(this, data);
	
	this.unpack();
	
	return this;
};

ArrayElem.prototype.unpack = function(){};

ArrayElem.prototype.getIndex = function(){return this.index;};

ArrayElem.prototype.setIndex = function(index){return this.index = index;};

ArrayElem.prototype.isEqual = function(arrayElem){};

ArrayElem.prototype.isEmpty = function(){
	return !utils.sizeOf(this);
};