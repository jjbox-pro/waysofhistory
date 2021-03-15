function TradeAlly(data, my) {
	if( utils.isArray(data) )
		this.parseArr(data, my);
	else if( data instanceof Object )
		this.parseRaw(data);
}

TradeAlly.prototype.parseArr = function (arr, my) {
	this.id =  arr[0];
	this.name =  arr[1];
	this.country = this.name == '';// Союз страны
	this.incCountry =  arr[2] == TradeAlly.inc.country;
	this.my = my;
	
	this.accountsCount = arr[3]||0;
};

TradeAlly.prototype.parseRaw = function (data) {
	this.id = data.id;
	this.name = data.name;
	this.country = this.name == '';
	this.incCountry = false;
	this.owner = data.owner;
	this.text = data.text;
	this.my = this.owner == wofh.account.id;
	this.members = data.members;
	
	this.accountsCount = data.accountsnumber||0;
};

TradeAlly.prototype.clone = function () {
	var data = {};
	for(var i in this){
		if( this.hasOwnProperty(i) ){
			if ( this[i] instanceof Object )
				data[i] = this[i].clone ? this[i].clone() : utils.clone(this[i], true);
			else
				data[i] = this[i];
		}
	}
	
	return new this.constructor(data);
};

TradeAlly.prototype.getId = function () {
	return this.id;
};

TradeAlly.prototype.getName = function () {
	return this.name;
};

TradeAlly.prototype.getAccountsCount = function () {
	return this.accountsCount;
};


TradeAlly.getIdByGid = function(gid){
	if( gid > BaseAccOrCountry.countryK )
		return gid%BaseAccOrCountry.countryK;
	
	return 0;
};

TradeAlly.getId = function (objOrId) {
	if (typeof(objOrId) == 'object') return objOrId.getId ? objOrId.getId() : objOrId.id;
	else return objOrId;
};

TradeAlly.getObj = function (obj) {
	if( obj instanceof this )
		return obj;
	
	return new this(obj);
};

TradeAlly.no = 0;//отсутствие союза
TradeAlly.undif = -1;//неопределенный союз - все варианты(для фильтрации)
TradeAlly.blackMarket = lib.tradeally.blackmarket;

TradeAlly.inc = {
	player: 1,
	country: 2
};
