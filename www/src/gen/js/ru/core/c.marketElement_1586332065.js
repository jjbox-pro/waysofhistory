function MarketElement(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(MarketElement, Element);

MarketElement.prototype.clone = function () {
	var data = {};
	for(var i in this){
		if( this.hasOwnProperty(i) )
			data[i] = this[i] instanceof Object ? utils.clone(this[i]) : this[i];;
	}
	
	return new this.constructor(data);
};

MarketElement.prototype.getTown1 = function(){
	return Element.getId(this.town1);
};

MarketElement.prototype.getTown2 = function(){
	return Element.getId(this.town2);
};

MarketElement.prototype.isForTown = function (town) {
	town = town||wofh.town;
	
	return this.getTown1() == town.id || this.getTown2() == town.id || this.town == town.id;
};

MarketElement.getObj = function (obj) {
	if( obj instanceof this )
		return obj;
	
	return new this(obj);
};



function Offer(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Offer, MarketElement);



function BarterOffer(data) {
	$.extend(this, data instanceof Object ? data : {});
	
	this.uniformData();
}

utils.extend(BarterOffer, Offer);

// Подгоняем данные под единый формат
BarterOffer.prototype.uniformData = function () {
	// this.res1count - приходит в сокет данных, в init данных this.count1
	if( this.res1count !== undefined )
		this.count1 = this.res1count;
	if( this.res2count !== undefined )
		this.count2 = this.res2count;
	
	if ( this.res1 == Resource.ids.science ) this.res1 = Resource.ids.luck;
	if ( this.res2 == Resource.ids.science ) this.res2 = Resource.ids.luck;
};

BarterOffer.prototype.getProfit = function(){
	return Math.round(this.count1/this.count2 * 100);
};

BarterOffer.prototype.isAvail = function(){
	return !!this.getCount();
};


function TradeOffer(data) {
	$.extend(this, data instanceof Object ? data : {});
	
	this.uniformData();
}

utils.extend(TradeOffer, Offer);

// Подгоняем данные под единый формат
TradeOffer.prototype.uniformData = function () {
	if ( this.res == Resource.ids.science ) this.res = Resource.ids.luck;
};

TradeOffer.prototype.isAvail = function(){
	return !((this.sell && this.limit == Trade.removeTradeOfferLimit[(this.res == Resource.ids.luck ? 'luck' : '') + this.getStrType()]) || (!this.sell && this.limit == Trade.removeTradeOfferLimit[(this.res == Resource.ids.luck ? 'luck' : '') + this.getStrType()]));
};

TradeOffer.prototype.isPresent = function(town){
	town = town||wofh.town;
	
	if( this.res == Resource.ids.luck ){
		return true;
	}
	else{
		var limit = this.realLimit === undefined ? this.limit : this.realLimit;
		
		return (this.sell && ((town.stock.getElem(this.res).has||0) - limit) > 0) || (!this.sell && (limit - (town.stock.getElem(this.res).has||0)) > 0);
	}
};

TradeOffer.prototype.getStrType = function(){
	return this.sell ? 'sell' : 'buy';
};

// Возвращает лимит предложения с учетом уменьшение  при входящих торговцах (ресурсах)
TradeOffer.prototype.getLimit = function(town){
	if( this.realLimit === undefined && !this.sell ){
		var incomResList = wofh.events.getTownTradersMoves(town).calcIncomRes();
		
		if( incomResList.getLength() ){
			return this.limit + incomResList.getElem(this.res).getCount();
		}
	}
	
	return this.limit;
};



function StreamOffer(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(StreamOffer, Offer);

StreamOffer.prototype.getCount = function(){
	return this.isOff() ? 0 : this.count;
};

StreamOffer.prototype.isOff = function(){
	return this.count < StreamOffer.offCount * 0.5;
};

StreamOffer.prototype.isAvail = function(){
	return this.getCount() > 0;
};


StreamOffer.offCount = -1000000;



function Stream(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(Stream, MarketElement);


Stream.dirs = {
	'in': 'in',
	'out': 'out'
};

Stream.stages = {
	offer: 0,
	opening: 1,
	open: 2
};

Stream.getListByStage = function(stage){
	switch(stage){
		case Stream.stages.open: return wofh.streams;
		case Stream.stages.offer: return wofh.streamPersonalOffers;
		case Stream.stages.opening: return wofh.events;
	}
};


Stream.prototype.getData = function(field){
	return field === undefined ? this : this[field];
};

Stream.prototype.getDir = function(town){
	if (!town) town = wofh.town;
	
	return this.getTown1() == town.id ? Stream.dirs.out : Stream.dirs.in;
};

Stream.prototype.getTown = function(town){
	return this.getDir(town) == Stream.dirs.out ? this.town2 : this.town1;
};

Stream.prototype.calcPrice = function(){
	return Trade.calcStreamPrice(this.cost, this.getCount(), this.tcost, this.traders);
};

Stream.prototype.calcDistTime = function(){
	var path = this.path||0,
		speed = Trade.getSpeedInSeconds(this.account1.race.getTradeSpeed());

	if( this.fuel ){
		var pathType = this.wayType == Trade.wayType.l ? 0 : 1;
		
		speed *= Trade.getTradeFuelSpeed(pathType, this.getData('fuel'));
	}
	if( this.wayType == Trade.wayType.w && this.waterspeed )
		speed *= this.waterspeed;
	
	return Trade.calcTradeTimeBySpeed(path, speed, this.account1);
};

Stream.prototype.getCount = function () {
	if( this.countLol === undefined )
		return this.count_;
	
	return (this.getTown1() + this.getTown2())%2 ? this.count_ : this.count_;
};

Stream.prototype.getStage = function(){
	return Stream.stages.open;
};

Stream.prototype.getFuel = function(count){
	if( this.fuel ){
		var pathType = this.wayType == Trade.wayType.l ? 0 : 1;
		
		return Trade.calcTradeMoveFuelCount(
			Resource.getId(this.fuel), 
			pathType, 
			this.path, 
			(new Resource(this.res, count||this.getCount())).toResList(),
			this.wayType == Trade.wayType.a ? lib.trade.fuelacons : false
		);
	}
	
	return false;
};

Stream.prototype.getTax1 = function(){
	return utils.calcObjSum(this.tax1);
};

Stream.prototype.getTax2 = function(){
	return this.tax2||0;
};

//список ускорялок, с которыми поток можно улучшить
Stream.prototype.getUpFuels = function(){
	var fuelList = wofh.account.getAvailFuel(this.wayType);

	var nextFuelList = new ResList();
	for (var res in fuelList.getList()){
		res = fuelList.getElem(res);

		if (res.getFuelSpeed(this.wayType) == 1) continue;
		
		if (this.fuel && this.fuel.getFuelSpeed() >= res.getFuelSpeed()) continue;

		nextFuelList.addElem(res);
	}
	return nextFuelList;
};

//можно ли улучшить усоряльный ресурс
Stream.prototype.canUpFuel = function(){
	return !this.getUpFuels().isEmpty();
};



function StreamPersonalOffer(data) {
	$.extend(this, data instanceof Object ? data : {});
}

utils.extend(StreamPersonalOffer, Stream);

StreamPersonalOffer.prototype.getCount = function (){
	return this.count;
};

StreamPersonalOffer.prototype.getStage = function(){
	return Stream.stages.offer;
};
