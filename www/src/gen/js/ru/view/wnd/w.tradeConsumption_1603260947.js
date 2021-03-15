wTradeCons = function(id, data){
	this.name = 'tradeCons';
	this.hashName = 'tradeCons';
	
	wTradeCons.superclass.constructor.apply(this, arguments);
};

utils.extend(wTradeCons, Wnd);

WndMgr.regWnd('tradeCons', wTradeCons);


wTradeCons.prepareData = function(){
	var data = Resource.fuelScience.getLength() ? {} : false;
	
	return data;
};


wTradeCons.prototype.getData = function(){
	this.data.consumption = {};
	
	for (var town in wofh.towns) {
		var town = wofh.towns[town];
		
		if( !town.traders )
			continue;
		
		this.data.consumption[town.id] = {
			l: town.traders.fuell,
			w: town.traders.fuelw,
			lResList: (new ResList(lib.trade.fuellcons)).getSortList('count'),
			wResList: (new ResList(lib.trade.fuelwcons)).getSortList('count'),
			town: town
		};
	}
	
	this.dataReceived();
};

wTradeCons.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-setTradeConsumption', function(){
			if( $(this).hasClass('-disabled') )
				return;
			
			self.wrp.find('.js-tradeCons-town').each(function(){
				var townEl = $(this);
				var tid = townEl.data('id');

				var reqTown = tid;
				var reqL = +townEl.find('select[data-pathtype="l"]').val();
				var reqW = +townEl.find('select[data-pathtype="w"]').val();

				if (self.data.consumption[tid].l == reqL && self.data.consumption[tid].w == reqW) return;
				
				self.data.consumption[tid].l = reqL;
				self.data.consumption[tid].w = reqW;

				reqMgr.setTradeConsumption(reqTown, reqL, reqW, function(){
					self.close();
				});
			});
		});
		
	this.wrp.one('change', '.tradeCons-select', function(){
		self.wrp.find('.js-setTradeConsumption').removeClass('-disabled');
	});
};

wTradeCons.prototype.afterDraw = function(){
	SelectStyled.init(this.wrp);
	
	this.initScroll();
};