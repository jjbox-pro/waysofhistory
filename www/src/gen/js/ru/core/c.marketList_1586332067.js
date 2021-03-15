function MarketList(data) {
	this.elemClass = MarketElement;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(MarketList, List);

// Преобразование массива с потоками в объект
MarketList.prototype.parseArr = function(arr){
	for (var elem in arr) {
		elem = new this.elemClass(arr[elem]);
		this.list[elem.getId()] = elem;
	}
};

MarketList.prototype.getTownElements = function (town, onlyCount){
	town = town||wofh.town;
	
	var elementsList = new this.constructor();
	var elements = this.getList();
	for (var element in elements) {
		element = elements[element].clone();
		
		if ( element.isForTown(town) )
			elementsList.addElem(element);	
	}
	
	if( onlyCount )
		return elementsList.getLength();
	
	return elementsList;
};

MarketList.prototype.updElem = function(data){
	var elem = this.getElem(data.id);
	
	for(var key in data)
		if( data[key] !== undefined )
			elem[key] = data[key];
	
	if( elem.uniformData )
		elem.uniformData(); // Подгоняем данные под единый формат
};



// Список бартерных предложений
function BarterOfferList(data){
	this.elemClass = BarterOffer;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(BarterOfferList, MarketList);

BarterOfferList.prototype.getTownOffers = function (town, onlyCount){
	return this.getTownElements(town, onlyCount);
};



// Список торговых предложений
function TradeOfferList(data){
	this.elemClass = TradeOffer;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(TradeOfferList, MarketList);

TradeOfferList.prototype.getTownOffers = function (town, onlyCount){
	return onlyCount ? this.getTownElements(town, onlyCount) : this.getTownElements(town).calcLimits(town);
};

// Учитываем уменьшение лимита предложения при входящих торговцах (ресурсах)
TradeOfferList.prototype.calcLimits = function(town){
	town = town||wofh.town;
	
	var incomResList = wofh.events.getTownTradersMoves(town).calcIncomRes();
	
	if( incomResList.getLength() ){
		var list = this.getList();
		for(var offer in list){
			offer = list[offer];
			
			if( !offer.sell ){
				offer.realLimit = offer.limit;
				offer.limit += incomResList.getElem(offer.res).getCount();
			}
		}
	}
	
	return this;
};

TradeOfferList.prototype.minimizeByStockMax = function(town){
	town = town||wofh.town;
	
	var list = this.getList();
	
	for(var tradeOffer in list){
		tradeOffer = list[tradeOffer];
		
		if( tradeOffer.isForTown(town) && !tradeOffer.sell )
			tradeOffer.limit = Math.min(tradeOffer.limit, town.stock.getMax());
	}
};


// Список потоковых предложений
function StreamOfferList(data){
	this.elemClass = StreamOffer;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(StreamOfferList, MarketList);

StreamOfferList.prototype.getTownOffers = function (town, onlyCount){
	return this.getTownElements(town, onlyCount);
};



// Список открытых потоков
function StreamList(data){
	this.elemClass = Stream;
	this.list = {};
	
	this.parseArr(data);
}

utils.extend(StreamList, MarketList);

StreamList.prototype.getTownStreams = function (town, onlyCount){
	return this.getTownElements(town, onlyCount);
};



// Список потоков ждущих подтверждения
function StreamPersonalOfferList(data){
	this.elemClass = StreamPersonalOffer;
	this.list = {};

	this.parseArr(data);
}

utils.extend(StreamPersonalOfferList, MarketList);

StreamPersonalOfferList.prototype.getTownPersonalOffers = function (town, onlyCount){
	return this.getTownElements(town, onlyCount);
};