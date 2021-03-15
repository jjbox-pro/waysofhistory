/*=== Список очков рейтинга ===*/
function RatePointsList(data, allowZero) {
	this.list = {};
	this.elemClass = RatePoints;
	this.allowZero = allowZero !== undefined ? allowZero : false;
	this.mult = 1;
	
	if( data )
		this.parse(data);
}

utils.extend(RatePointsList, CountList);

RatePointsList.prototype.parseArr = function(obj) {
	for (var ratePoints in obj) {
		
		if( ratePoints == 'mult' ){
			this.mult = obj[ratePoints];
		}
		else{
			this.addCount(ratePoints, obj[ratePoints]);
		}		
	}
};



/*=== Список улучшений местности ===*/
function MapImpList(data) {
	this.list = {};
	this.elemClass = MapImp;
	if (data) { 
		this.parse(data);
	}
}

utils.extend(MapImpList, CountList);

MapImpList.prototype.parseStr = function(str) {
    var result = [];

    if (str) {
        var arr = str.split('^');
        arr.pop();
		for (var i in arr) {
            var mapImpId = utils.charToInt(arr[i].charAt(0));
            result[mapImpId] = parseFloat(arr[i].substr(1));
        }
    }
	
    return result;
};



/*=== Список заказов ресурсов ===*/
function ResOrdersList(data) {
	this.sorted = true;
	this.list = [];
	this.elemClass = ResOrder;
	
	if( data )
		this.parse(data);
}

utils.extend(ResOrdersList, List);

ResOrdersList.prototype.parseArr = function(arr) {
    for(var elem in arr){
		elem = new this.elemClass(arr[elem]);
		
		this.list.push(elem);
	}
};


ResOrdersList.sort = {
	no: 0,
	dist: 1,
	town: 2,
	acc: 3,
	group: 4,
	timecreate: 5,
	timestatus: 6
};


/*=== Список элементов для простой выбиралки ===*/
function smplSelectList(arr) {
	'use strict';
	
	this.elemClass = smplSelectElem;
	
	this.list = [];
	
	this.parse(arr);
}

utils.extend(smplSelectList, ArrayList);

smplSelectList.prototype.getByVal = function(val) {
	return this.each(function(elem){
		if( elem.getVal() == val )
			return elem; 
	});
};

smplSelectList.prototype.setSelected = function(elemOrIndex) {
	this.selected = this.isElemClass(elemOrIndex) ? elemOrIndex : this.getElem(elemOrIndex);
};

smplSelectList.prototype.getSelected = function() {
	return this.selected||this.getFirstElem();
};



function ContactsList(data){
	ContactsList.superclass.constructor.apply(this, arguments);
	
	this.parse(data);
};

utils.extend(ContactsList, List);

ContactsList.prototype.initSorted = function(){
	this.sorted = true;
};

ContactsList.prototype.initElemClass = function(){
	this.elemClass = Contact;
};

ContactsList.prototype.parse = function(list){
	for (var elem in list){
		this.addElem(new this.elemClass(list[elem]));
	}
};


ContactsList.prototype.getListByType = function(type){
	var list = new ContactsList();
	
	this.each(function(elem){
		if( elem.getType() == type )
			list.addElem(elem);
	});
	
	return list;
};

ContactsList.prototype.getOtherList = function(){
	return this.getListByType(Contact.typeIds.other);
};

ContactsList.prototype.getFriendsList = function(){
	return this.getListByType(Contact.typeIds.friends);
};

ContactsList.prototype.getEnemiesList = function(){
	return this.getListByType(Contact.typeIds.enemies);
};

ContactsList.prototype.extractData = function(){
	var arr = [];
	
	this.each(function(elem, index){
		arr[index] = elem.extractData();
	});
	
	return arr;
};

ContactsList.prototype.saveToLS = function(){
	ls.setContacts(this.extractData());
};;