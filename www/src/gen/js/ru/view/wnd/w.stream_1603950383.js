wStream = function(id){
	wStream.superclass.constructor.apply(this, arguments);
	
	// Удаляем параметр id если он хранит имя вкладки, которую необходимо открыть пренудительно
	if( id == 'info' )
		delete this.id;
};

utils.extend(wStream, wMarket);

WndMgr.regWnd('stream', wStream);


wStream.prepareData = function(id){
	var data = Ability.showTrade() ? {} : false;
	
	if( data && id && id != 'info' ){
		if( typeof(id) == 'string' ){
			var params = id.split('&');
			
			id = params.shift();
			
			if( params.length ){
				params = params.join('&');
				
				data.initStream = utils.urlToObj(params);
			}
		}
		
		if( id == wofh.town.id )
			data = false;
		else
			data.targetId = id;
	}
	else if( data && id == 'info' )
		data.tab = id;
	
	if( data ){
		data.initStream = data.initStream||{};
		data.initStream.res = data.initStream.res||Resource.ids.wood;
		data.initStream.count = data.initStream.count||0;
		data.initStream.cost = data.initStream.cost||0;
		data.initStream.traders = 1;
	}
	
	return data;
};


wStream.prototype.calcName = function() {   
    return 'stream';
};

wStream.prototype.getData = function() {
	if( this.data.targetId ){
		this.getTargetData();
		
		return;
	}
	
	this.getPathData();
	
	this.dataReceived();
};

wStream.prototype.calcChildren = function() {
	this.children.marketPanel = bMStream_panel;
	this.children.marketTabs = bMarket_tabs;
	
	this.children.info = tabStreamInfo;
	this.children.sell = tabStreamSell;
	this.children.buy = tabStreamBuy;
};

wStream.prototype.beforeShowChildren = function() {   
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

wStream.prototype.afterDraw = function() {
	var tab;
	
	if( this.data.tab )
		tab = this.data.tab;
	else if( this.data.targetId )
		tab = 'info';
	
    this.showTab(tab);
};


wStream.prototype.getTargetData = function() {
	var self = this;
	
	reqMgr.getTargetData(this.data.targetId, wofh.town.id, undefined, function(resp){
		if( !resp.town )
			return self.unknownTown();
		
		var target = resp.town[self.data.targetId];
		
		if( !target.pos )
			return self.unknownTown();
		
		for(var acc in resp.accounts){
			if( acc == target.account ){
				target.account = new Account().parseIdData(target.account, resp.accounts[target.account]);
				break;
			}
		}
		
		if( target.account && target.account.country ){
			for(var country in resp.countries){
				if( country == target.account.country ){
					target.country = new Country().parseIdData(+country, resp.countries[country]);
					break;
				}
			}
		}
		
		self.data.target = target;
		
		self.getPathData();
		
		self.dataReceived();
	});
};

wStream.prototype.getPathData = function() {
	var self = this;
	
	var towns = [];
	
	if(self.data.target){
		towns.push(self.data.target);
	}
	
	for(var town in wofh.towns){
		town = wofh.towns[town];
		
		if( town.id != wofh.town.id ){
			var townClone = town.cloneBase();
			
			townClone.pos = town.pos;
			townClone.country = wofh.country;
			townClone.wonder = town.getWonder();
			if( townClone.wonder )
				townClone.wonder = townClone.wonder.clone();
			
			towns.push(townClone);
		}
	}
	
	// Вставляем пустышку, если нету цели и городов больше чем 1
	if( !self.data.target && towns.length > 1 ){
		towns.unshift({id:0, name:'', account: wofh.account});
	}
	
	self.data.towns = towns;
	
	this.data.defTown = this.data.towns[0];
};

wStream.prototype.unknownTown = function() {
	this.close();
	
    hashMgr.showWnd('townInfo', this.data.targetId);
};

wStream.prototype.showTab = function(tab){
	this.showMyStreamOffersCount();
	
	this.showStreamsCount();
	
	this.tabs.openTab(tab||ls.getLastStreamTab('buy'));
};

wStream.prototype.showMyStreamOffersCount = function(){
	this.cont.find('.js-streamOffersCount').text(wofh.streamOffers.getTownOffers(false, true));
};

wStream.prototype.showStreamsCount = function(){
	this.cont.find('.js-streamsCount').text(
		wofh.streams.getTownStreams(false, true) +
		wofh.streamPersonalOffers.getTownPersonalOffers(false, true) +
		wofh.events.getTownStreams(false, true)
	);
};



bMStream_panel = function(){
	bMStream_panel.superclass.constructor.apply(this, arguments);
};

utils.extend(bMStream_panel, bMarket_panel);

bMStream_panel.prototype.getTmplData = function(){
	this.data.showTradersMove = true;
	
	return this.data;
};



/******
 * Вкладка info
 */

tabStreamInfo = function(){
    this.name = 'info';
	
	tabStreamInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(tabStreamInfo, Tab);

tabStreamInfo.prototype.getData = function(){
	this.data = {};
	
	// Топливо для ускорения по умолчанию 
	this.data.fuell = wofh.town.traders.fuell;
	this.data.fuelw = wofh.town.traders.fuelw;
	
	this.data.initStream = this.parent.data.initStream;
	this.data.target = this.parent.data.target;
	this.data.towns = this.parent.data.towns;
	this.data.defTown = this.parent.data.defTown;
	
	this.data.allowDef = !this.data.initStream.count;
	
	this.data.streamInfo = {};
	
	this.loadTownPath(this.data.defTown, this.dataReceived.bind(this), this.parent.cont.find('.' + this.getTmplWrpClass()));
};

tabStreamInfo.prototype.bindEvent = function(){
    var self = this;

	self.wrp
		.on('click', '.js-resFilter .js-resb', function(){
			var res = new Resource(snip.filterResChange($(this)), self.data.streamInfo.res.getCount());
			
			self.data.streamInfo.res = res;
			
			self.cont.find('.js-stream-info-res').html(snip.resBig(res));
			self.cont.find('.js-stream-info-resPledge').html(res.needPledge()? snip.resBig(res): '');
			
			self.calcPledge(res.count);
			
			self.calcStream({checkSpeedUp:true});
		})
		.on('change', '.js-stream-info-towns-townSelect', function(){
			var town = self.data.towns[$(this).val()];
			
			self.loadTownPath(town, self.selectTown.bind(self));
		})
		.on('input', '.js-stream-info-res-input', function(){
			self.data.allowDef = false;
				
			var resCount = $(this).val();
			
			resCount = resCount||1;
			
			self.checkInputVal(this, undefined, 1);
			
			self.calcPledge(resCount);
			
			self.data.streamInfo.res.setCount(resCount);
			
			self.calcStream({updTraders:true});
		})
		.on('input', '.js-stream-info-traders-input', function(){
			if( !self.data.streamInfo.selectedPath )
				return;
			
			self.data.allowDef = false;
			
			self.checkInputVal(this, undefined, 1);
			
			self.setCountByTraders($(this).val());
			
			self.calcStream();
		})
		.on('focusin', '.js-stream-info-res-input', function(){
			$(this).select();
		})
		.on('input', '.js-stream-info-cost-input', function(){
			self.checkInputVal(this, lib.trade.maxtradeprice, 0);
			
			self.data.streamInfo.cost = $(this).val()||0;
		})
		.on('click', '.js-performStream', function(){
			if ($(this).hasClass('-disabled')) return false;
			if( !self.data.canPerformStream )
				return false;
			
			wndMgr.addConfirm(tmplMgr.stream.confirm({streamInfo:self.data.streamInfo}), {rubber: true}).onAccept = function(){	
				var streamInfo = self.data.streamInfo;
				
				reqMgr.stream(streamInfo.town.id, streamInfo.res.id, streamInfo.res.count, streamInfo.cost, (streamInfo.transportCons||{}).id, streamInfo.selectedPath.wayType);
			};
			
			return false;
		})
		.on('change', '.js-stream-info-speedUpSelect', function(){
			var resId = +$(this).val();
			
			if( resId ){
				if( $('option:selected', this).attr('pathtype') == Trade.wayType.l ){
					self.data.fuell = resId;
					self.data.fuelw = 0;
				}
				else{
					self.data.fuelw = resId;
					self.data.fuell = 0;
				}
			}
			else
				self.data.fuell = self.data.fuelw = 0;

			self.calcStream({checkSpeedUp:true, noUpdSpeedUp:true, updTraders:true});
		})
		.on('click', '.js-immediateStream', function(){
			if( !self.data.canImmediate )
				return false;
			
			self.setCanImmediate(false);
			
			var $this = $(this),
				loaderId = contentLoader.start(
				$this, 
				0, 
				function(){
					var event = wofh.events.getById($this.parents('.js-stream-info-stream').data('id'));
					
					if( wofh.account.getCoinsAll() < event.calcImmediateCost() && !wofh.account.isAdmin() ){
						contentLoader.stop(loaderId);
						
						wndMgr.addAlert(tmplMgr.snipet.noCoins());
					}
					else{
						reqMgr.eventImm(event, function(){
							contentLoader.stop(loaderId);
						});
					}
				},
				{icon: ContentLoader.icon.small, cssPosition: {left: 8, top: 8}, callback: function(){
					self.setTimeout(function(){this.setCanImmediate(true);}, Notif.delay); // Синхронизируемся с обновлением контента в таблице потоков
				}}
			);
			
		})
		.on('click', '.js-acceptStream', function(){
			reqMgr.streamAccept($(this).parents('.js-stream-info-stream').data('id'));
		})
		.on('click', '.js-delStream', function(){
			var $stream = $(this).parents('.js-stream-info-stream'),
				list = Stream.getListByStage($stream.data('stage'));
				
				if( $stream.data('stage') == Stream.stages.opening )
					var stream = list.getById($stream.data('id'));
				else
					var stream = list.getElem($stream.data('id'));
			
			// Проверка на переполнение склада
			var stockOverflowed = 0,
				confirmText;
			
			if( stream.getDir() == Stream.dirs.out ){
				stockOverflowed = (wofh.town.stock.getElem(stream.res).getHas() + Trade.calcPledge(stream.getCount())) - wofh.town.stock.max;
				
				if( stockOverflowed > 0 )
					confirmText = tmplMgr.confirm.stock.full({res:stream.res, count:stockOverflowed});
			}
			else
				confirmText = 'Отмена снабжения приведет к высвобождению залоговых ресурсов. При этом они могут не поместиться в хранилища '+snip.town(wofh.world.getTown(stream.getTown()))+' и будут потеряны безвозвратно.';
			
			wndMgr.addConfirm(confirmText).onAccept = function(){
				reqMgr.closeStream(stream.id, stream.getStage());
			};
		})
		.on('change', 'input[name="useairway"]', function(){
			self.calcStream({checkSpeedUp:true, noUpdSpeedUp:true, updTraders:true});
		});
		
};

tabStreamInfo.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townStream] = function(){
		this.clearTimeout(this.notifTimeout);
		
		this.notifTimeout = this.setTimeout(function(){
			this.parent.showStreamsCount();
			
			this.table.data.list = this.getList();
			this.table.show();
		}, Notif.sDelay);
	};
};

tabStreamInfo.prototype.afterDraw = function(){
	this.calcStream({checkSpeedUp:true, updTraders:true});
	
	this.calcPledge(this.data.streamInfo.res.getCount());
	
	this.table = new tblStreamInfo(this, this.cont.find('.stream-info-streams'));
	this.table.toggleSort('stage', false);
	
	this.setCanImmediate(true);
};

tabStreamInfo.prototype.afterOpenTab = function(){
	ls.setLastStreamTab(this.name);
};


tabStreamInfo.prototype.getList = function() {
	var list = [],
		streams;
	
	streams = wofh.streams.getTownStreams().getList();
	for( var stream in streams )
		list.push(streams[stream]);
	
	streams = wofh.streamPersonalOffers.getTownPersonalOffers().getList();
	for( var stream in streams )
		list.push(streams[stream]);
	
	streams = wofh.events.getTownStreams().getList();
	for( var stream in streams )
		list.push(streams[stream]);
	
	return list;
};

tabStreamInfo.prototype.setFormEnabled = function(enabled){
	this.cont.find('.js-performStream').toggleClass('-disabled', !enabled);
};

tabStreamInfo.prototype.checkCanPerformStream = function() {
	var town = this.cont.find('.js-stream-info-towns-townSelect').val();
	town = this.data.towns[town];
	
	this.setCanPerformStream(
					town && 
					town.avail && 
					this.checkStockPledge(this.data.streamInfo.res) && 
					(!this.data.streamInfo.transportCons || !this.data.streamInfo.transportCons.transportAbort)
					);
};

tabStreamInfo.prototype.setCanPerformStream = function(state) {
	if( this.data.canPerformStream != state ){
		this.data.canPerformStream = state;
		this.cont.find('.js-performStream').toggleClass('-disabled', !state);
	}
};

tabStreamInfo.prototype.setCanImmediate = function(state){
	if( this.data.canImmediate != state ){
		this.data.canImmediate = state;

		this.cont.find('.js-immediateStream').toggleClass('-disabled', !state);
	}
};

tabStreamInfo.prototype.checkInputVal = function(el, maxVal, minVal){
	var $el = $(el),
		val = $el.val(),
		oldVal = $el.attr('value'),
		valid = true; // Валидация изменения значения в инпуте. Если значение валидно (не вставлялись символы и т.п.) не производим ручную вставку в инпут ($el.val(val)), дабы не сбрасывать положение каретки
	
	val = ~~val.replace(/[^\d]/gi, "");
	
	if( maxVal !== undefined && val > maxVal ){
		val = maxVal;
		valid = false;
	}
	else if( minVal !== undefined && val <= minVal ){
		val = minVal;
		valid = false;
	}
	
	val = '' + val;
	
	if( oldVal == val || oldVal == '0' )
		valid = false;
	
	if( !valid )
		$el.val(val);
	
	$el.attr('value', val);
};

tabStreamInfo.prototype.calcPledge = function(count, streamInfo){
	streamInfo = streamInfo||this.data.streamInfo;
	
	var pledge = streamInfo.res.needPledge() ? Trade.calcPledge(count): '';
	
	this.cont.find('.js-stream-info-resPledgeCount')
		.html(pledge)
		.toggleClass('clr0', !this.checkStockPledge(streamInfo.res, pledge));
};

tabStreamInfo.prototype.checkStockPledge = function(res, pledge){
	if( !res.needPledge() )
		return true;
	
	pledge = pledge !== undefined ? pledge : Trade.calcPledge(res.getCount());
	
	return wofh.town.getRes(res).has >= pledge;
};

tabStreamInfo.prototype.calcStream = function(opt){
	opt = opt||{};
	
	var streamInfo = {};
	
	streamInfo.town = this.data.streamInfo.town||this.data.towns[this.wrp.find('.js-stream-info-towns-townSelect').val()];
	streamInfo.res = this.data.streamInfo.res||(new Resource(this.wrp.find('.js-resFilterVal').val(), this.wrp.find('.js-stream-info-res-input').val()));
	streamInfo.cost = this.data.streamInfo.cost||this.wrp.find('.js-stream-info-cost-input').val()||0;
	streamInfo.useAirWay = this.wrp.find('input[name="useairway"]').prop('checked');
	
	if( streamInfo.town && streamInfo.town.avail ){
		streamInfo.hasAirWay = streamInfo.town.hasAirWay;
		
		if( streamInfo.useAirWay )
			streamInfo.useAirWay = streamInfo.hasAirWay;
		
		if( opt.checkSpeedUp ){
			streamInfo.speedUp = Trade.getTransportInfo(streamInfo.town.pathArr, streamInfo.town.dist, this.data.fuell, this.data.fuelw);

			if( streamInfo.speedUp.selectedFuel ){
				if( streamInfo.speedUp.selectedFuel.speedUpInfo.path.wayType == Trade.wayType.l ){
					this.data.fuell = streamInfo.speedUp.selectedFuel.getId();
					this.data.fuelw = 0;
				}
				else{
					this.data.fuelw = streamInfo.speedUp.selectedFuel.getId();
					this.data.fuell = 0;
				}
			}
			else
				this.data.fuell = this.data.fuelw = 0;
		}
		
		var minPath = Trade.calcTradeTimeByPaths(
			streamInfo.town.pathArr,
			streamInfo.town.dist,
			streamInfo.res.toResList(),
			this.data.fuell,
			this.data.fuelw,
			streamInfo.useAirWay);

		// Если присутствует потребление ускорителя
		if(minPath.cons){
			var fuelResCount = streamInfo.res.getId() == minPath.cons.getId() && streamInfo.res.needPledge() ? Trade.calcPledge(streamInfo.res.getCount()) : 0;
			minPath.cons.stockRest = wofh.town.getRes(minPath.cons).has - fuelResCount - Trade.calcPledge(minPath.cons.getCount());
			minPath.cons.transportAbort = minPath.cons.stockRest < 0;
			
			streamInfo.transportCons = minPath.cons;
		}

		streamInfo.selectedPath = {type: minPath.pathType, wayType: streamInfo.useAirWay ? Trade.wayType.a : (minPath.pathType != 0) ? Trade.wayType.w : Trade.wayType.l, time: minPath.time, path: minPath.path};
		streamInfo.paths = streamInfo.town.pathArr;
		streamInfo.dist = streamInfo.town.dist;
		
		// По умолчанию устанавливаем количество реса, которо может нести 1 торговец и перерасчитываем поток
		if( this.data.allowDef && opt.updTraders ){
			this.setCountByTraders(1, streamInfo);
			
			delete opt.updTraders;
			
			this.calcStream(opt);
			
			return;
		}
		else		
			streamInfo.traders = Trade.calcStreamTradersByRescount(streamInfo.res.getCount(), streamInfo.selectedPath.time);

		if( opt.updTraders )
			this.cont.find('.js-stream-info-traders-input').val(streamInfo.traders);
	}
	
	this.updStremInfo(streamInfo, opt);
};

tabStreamInfo.prototype.updStremInfo = function(streamInfo, opt){
	opt = opt||{};
	
	if( streamInfo.transportCons && streamInfo.transportCons.getCount() > 0 ){
		this.cont
				.find('.js-stream-info-speedUpCons')
				.html(snip.resBigCount(streamInfo.transportCons.toFixed(1)));
		
		// Залог ресурса ускорения
		this.cont.find('.js-stream-info-speedUpPledge')
			.toggleClass('clr0', streamInfo.transportCons.transportAbort)
			.html(snip.resBigCount(streamInfo.transportCons.id, Trade.calcPledge(streamInfo.transportCons.count, true).toFixed(1)));
	}
	else
		this.cont.find('.js-stream-info-speedUpCons, .js-stream-info-speedUpPledge').html('');
	
	if( streamInfo.speedUp ){
		this.cont.find('.js-stream-info-speedUp-wrp').toggleClass('-invis', !(utils.sizeOf(streamInfo.speedUp.list) || streamInfo.useAirWay));
		
		this.cont.find('.stream-info-speedUpAir-wrp').toggleClass('-invis', !streamInfo.hasAirWay);
		
		this.cont.find('.js-stream-info-speedUp').toggleClass('-type-airWay', streamInfo.useAirWay);
		
		if( !opt.noUpdSpeedUp ) {
			this.cont.find('.js-stream-info-speedUp').html(tmplMgr.stream.speedUp(streamInfo));
			
			SelectStyled.init(this.cont);
		}
		
		this.cont.find('.js-stream-info-time').html( streamInfo.selectedPath ? snip.time(timeMgr.fPeriod(streamInfo.selectedPath.time) + (wofh.account.isPremium() ? ' в ' + snip.timer(streamInfo.selectedPath.time, 'inc') : '')) : '');
	}
	
	this.data.streamInfo = streamInfo;
	
	this.checkCanPerformStream();
};

tabStreamInfo.prototype.loadTownPath = function(town, callback, wrp){
	if( this.isNeedLoadTown(town) ){
		var path = [wofh.town.pos.o, [wofh.town.pos.x, wofh.town.pos.y, town.pos.x, town.pos.y]];

		var loaderId = contentLoader.start(
			wrp||this.wrp.find('.stream-info-block'), 
			100, 
			function(){
				reqMgr.getPathData(path, false, false, function(resp){
					town.dist = Trade.calcDistance(wofh.town.pos, town.pos),

					town.pathArr = resp.path_[wofh.town.pos.x][wofh.town.pos.y][town.pos.x][town.pos.y];
					
					town.path = new Path({air: town.dist}).parse(town.pathArr);
					
					town.hasAirWay = Trade.hasAirWay(town, wofh.town); // Путь по воздуху (аэропорт)
					
					town.noPath = !town.path.land && !town.path.water && !town.path.deepwater;
					
					if( town.noPath && town.hasAirWay )
						town.onlyAirWay = true;
					
					if( town.hasAirWay ){
						town.noPath = false;
						town.avail = true;
					}
					else
						town.avail = !town.noPath && Trade.isTradeDistAvailable(town.pathArr, town.dist);
					
					callback(town);

					contentLoader.stop(loaderId);
				}.bind(this));
			}
		);
	}
	else
		callback(town);
};

tabStreamInfo.prototype.isNeedLoadTown = function(town){
	return town && town.id && !town.path;
};

tabStreamInfo.prototype.selectTown = function(town){
	this.setFormEnabled(town.avail);

	this.wrp.find('.js-stream-info-townsImg').html( town.id ? snip.townIconLink(town, town.account, wofh.country) : '' );
	this.wrp.find('.js-stream-info-towns-path').html( town.path && town.id ? tmplMgr.send.townPath({path:town.path, dist:town.dist, noPath:town.noPath}) : '' );
	this.wrp.find('.js-stream-info-towns-account').html( town.account && town.id ? snip.accCountry(town.account, wofh.account.isPremium() ? town.country : undefined) : '' );
	
	if( !town.avail ) 
		this.wrp.find('.js-stream-info-time').html('');
	else{
		var airWayProp = {checked: false, disabled: false};
		
		if( town.onlyAirWay )
			airWayProp.checked = airWayProp.disabled = true;
		
		this.wrp.find('input[name="useairway"]').prop(airWayProp);
	}
	
	this.data.fuell = wofh.town.traders.fuell;
	this.data.fuelw = wofh.town.traders.fuelw;

	this.data.streamInfo.town = town;
	
	this.calcStream({checkSpeedUp:true, updTraders:true});
};

tabStreamInfo.prototype.setCountByTraders = function(traders, streamInfo){
	streamInfo = streamInfo||this.data.streamInfo;
	
	var resCount = Trade.calcStreamRescountByTraders(traders, streamInfo.selectedPath.time);

	this.wrp.find('.js-stream-info-res-input').val(resCount);

	this.calcPledge(resCount, streamInfo);

	streamInfo.res.setCount(resCount);

	streamInfo.traders = traders;
};


/******
 * Вкладка info - таблица потоков
 */

tblStreamInfo = function(parent, cont) {
    this.tmpl = tmplMgr.stream.tableStreams;
    this.data = {};
    this.data.list = parent.getList();
    
	tblStreamInfo.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblStreamInfo, Table);

tblStreamInfo.prototype.getSortVal = function(stream, field, exField) {
    if( field == 'dir' ) return stream.getDir();
    if( field == 'water' ) return stream.getData('wayType') == Trade.wayType.w;
	if( field == 'account' ) return wofh.world.getAccountByTown(stream.getTown()).name.toLowerCase();
	if( field == 'res' ) return stream.getData('res');
	if( field == 'count' ) return (stream.getDir() == Stream.dirs.out? -1: 1) * (stream.getCount()||0);
	if( field == 'price' ) return (stream.getDir() == Stream.dirs.out? 1: -1) * (stream.calcPrice()||0);
    
	if( field == 'fuel' ) return stream.getStage() != Stream.stages.offer && stream.getDir() == Stream.dirs.out ? stream.getFuel().count||0 : 0;
	if( field == 'traders' ) return stream.getStage() != Stream.stages.offer && stream.getDir() == Stream.dirs.out ? stream.getData('traders') : 0;
	
	if( exField == 'account' )
		return wofh.world.getTown(stream.getTown()).name.toLowerCase();
	else
		return stream.getStage(); // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblStreamInfo.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.parent.wrp.find('.js-stream-info-streams').toggleClass('dN', showTable);
		
		this.showTable = showTable;
	}
};



/******
 * Вкладка sell
 */

tabStreamSell = function(){
    this.name = 'sell';
	
	tabStreamSell.superclass.constructor.apply(this, arguments);
};

utils.extend(tabStreamSell, Tab);

tabStreamSell.prototype.bindEvent = function(){
    var self = this;
	
	self.wrp
		.on('click', '.js-changeOfferAvailability', function(){
			var $this = $(this);
			
			if( $this.hasClass('-disabled') )
				return false;
			
			if( $this.prop('checked') ){
				$this.prop('checked', !$this.prop('checked'));
				return;
			}
			else{
				wndMgr.addConfirm('Данное предложение будет снято с рынка. Это обдуманное решение?', {okText: 'Да', cancelText: 'Нет'}).onAccept = function(){
					$this.addClass('-disabled');
					
					var offer = wofh.streamOffers.getElem($this.data('id')).clone();
					
					offer.count = StreamOffer.offCount;
					wofh.streamOffers.getElem($this.data('id')).clone();
					contentLoader.start( 
						$this.parent('.js-activity-wrp'), 
						100, 
						function(){
							reqMgr.setStreamOffer(offer.id, offer.sell, offer.res, offer.count, offer.tcost, offer.cost, offer.distance, offer.ally, offer.text);
						}.bind(this),
						{icon: ContentLoader.icon.small, callback: function(){$this.removeClass('-disabled');}} 
					);
				};
			}
			
			return false;
		})
		.on('click', '.js-editOffer', function(){
			wndMgr.addWnd(wStreamOffer, $(this).data('id'));

			return false;
		})
		.on('click', '.js-delOffer', function(){
			var el = $(this);
			if (el.hasClass('-disabled')) return false;
			
			wndMgr.addConfirm().onAccept = function(){
				el.addClass('-disabled');
				
				reqMgr.delStreamOffer(el.data('id'));
			};

			return false;
		}); 
};

tabStreamSell.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townStreamMarketOffer] = function(){
		this.clearTimeout(this.notifTimeout);
		
		this.notifTimeout = this.setTimeout(function(){
			this.parent.showMyStreamOffersCount();
			
			this.table.data.list = wofh.streamOffers.getTownOffers().getSortList().getList();
			this.table.show();
		}, Notif.sDelay);
	};
};

tabStreamSell.prototype.afterDraw = function(){
	this.table = new tblStreamSellOffers(this, this.wrp);
    this.table.toggleSort('cost');
};

tabStreamSell.prototype.afterOpenTab = function(){
	ls.setLastStreamTab(this.name);
};



/******
 * Вкладка sell - таблица списка выставленных предложений
 */

tblStreamSellOffers = function(parent, cont) {
    this.tmpl = tmplMgr.stream.tableSellOffers;
    this.data = {};
    this.data.list = wofh.streamOffers.getTownOffers().getSortList().getList();
    
	tblStreamSellOffers.superclass.constructor.apply(this, arguments);
    
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblStreamSellOffers, Table);

tblStreamSellOffers.prototype.bind = function() {
    var self = this;
	tblStreamSellOffers.superclass.bind.apply(this, arguments);
    
};

tblStreamSellOffers.prototype.getSortVal = function(offer, field) {
	if (field == 'res') return offer.res;
	if (field == 'sell') return utils.toInt(offer.sell);
    if (field == 'count') return offer.count;
    if (field == 'cost') return offer.cost;
    if (field == 'distance') return offer.distance;
	if( field == 'tcost' ) return offer.tcost;
	
    return offer.cost; // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblStreamSellOffers.prototype.afterDraw = function() {
	var showTable = !this.data.list.length;
	
	if( this.showTable != showTable ){
		this.parent.wrp.find('.js-stream-sell-offers').toggleClass('dN', showTable);
		
		this.showTable = showTable;
	}
};



/******
 * Вкладка buy
 */

tabStreamBuy = function(parent, cont){
	this.name = 'buy';

	tabStreamBuy.superclass.constructor.apply(this, arguments);
};

utils.extend(tabStreamBuy, Tab);


tabStreamBuy.prototype.getData = function(){
	this.data.pos = 0;

	this.dataReceived();
};

tabStreamBuy.prototype.calcChildren = function(){
	this.children.list = bStreamBuy_list;
};

tabStreamBuy.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('change', '.js-stream-buy-resFilter-wrp input', function(){
			self.data.pos = 0;
			self.children.list.show();
		})
		.on('click', '.js-resFilter .js-resb', function(){
			snip.filterResChange($(this));
		})
		.on('click', '.page-nav-next.-active', function(){
			self.data.pos = self.data.next;
			self.children.list.show();
		})
		.on('click', '.page-nav-prev.-active', function(){
			self.data.pos = self.data.prev;
			self.children.list.show();
		});
};

tabStreamBuy.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

tabStreamBuy.prototype.afterOpenTab = function(){
	ls.setLastStreamTab(this.name);
};



bStreamBuy_list = function(){
	this.name = 'list';

	bStreamBuy_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bStreamBuy_list, Block);


bStreamBuy_list.prototype.getData = function(upd){
	if( upd ){
		this.dataReceived();

		return;
	}

	var self = this;

	this.data = this.parent.data;

	var loaderId = contentLoader.start( 
		this.parent.wrp, 
		100, 
		function(){
			self.getReqData(function(){
				var reqData = utils.urlToObj(this.parent.wrp.find('form').serialize());

				reqData.n = this.data.pos;

				reqMgr.getStreamOffers(reqData.res, reqData.n, Trade.isSell(reqData.type), reqData.onlycountry, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId, 
						function(){
							contentLoader.stop(loaderId);
							
							this.setFilter(reqData);
							
							resp.offers = resp.offers||[];
							
							for(var index = 0; index < resp.offers.length; index++){
								var offer = resp.offers[index];

								if( offer.town && offer.town.account && offer.town.account.country && offer.town.account.country.id == (wofh.country||{}).id )
									offer.inCountry = true;

								if( Trade.isSell(reqData.type) )
									this.prepareSellOffer(offer);

								/* 
									Добавачная стоимость к каждой единицы ресурса при наличии цены за торговца.
									Т.е. цена за торговца делится на количество реса, которое может нести 1 торговец и прибавляется к каждой еденицы ресурса.
								*/
								offer.tSum = offer.tcost / Trade.calcStreamRescountByTraders(1, offer.time);
							}
							
							this.data.offers = resp.offers;

							if( wofh.country )
								this.data.countryAlly = wofh.tradeAllies.getCountryAlly().id;

							this.data.next = resp.next;

							this.data.prev = resp.prev;

							this.data.type = reqData.type;

							this.data.sliderType = Trade.isSell(reqData.type) ? 'res' : 'traders';

							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

bStreamBuy_list.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townFuel];
};

bStreamBuy_list.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.stream-buy-buyOffer', function(){
			var $offer = $(this).parents('.js-stream-buy-offer'),
				offer = self.data.offers[$offer.data('pos')];

			wndMgr.addModal('', {
				callbacks: {
					bindEvent: function(){
						var wnd = this;

						this.wrp
							.on('input', 'input[name=res], input[name=traders]', function(){
								wnd.calcPopupData($(this).val(), $(this).attr('name'));
							})
							.on('click', 'input[name=type]', function(){
								wnd.data.sliderType = $(this).val();

								wnd.wrp.find('input[name=res], input[name=traders]').attr('disabled', 'disabled');
								wnd.wrp.find('input[name='+wnd.data.sliderType+']').removeAttr('disabled');

								wnd.setSliderType(wnd.data.sliderType);
							})
							.on('click', '.js-makeStream', function(){
								if( !wnd.data.canMakeStream )
									return false;

								wnd.setCanMakeStream(false);

								var reqData = {},
									traders = +wnd.wrp.find('input[name=traders]').val(),
									count = +wnd.wrp.find('input[name=res]').val(),
									makeByRes = wnd.data.sliderType == 'res';

								if( !makeByRes && Trade.isSell(self.data.type) ){
									var fullTradersLoad = Trade.calcStreamRescountByTraders(traders, offer.time);

									// Создаем поток по ресу, если торговцы могут нести больше реса чем есть в предложении 
									// или количество реса в предложении меньше чем может нести один торговец
									makeByRes = count != fullTradersLoad;
								}

								if ( makeByRes )
									reqData.count = count;
								else
									reqData.traders = traders;

								var loaderId = contentLoader.start( 
									$(this), 
									0, 
									function(){
										reqMgr.makeStream(offer.id, reqData.traders, reqData.count, {
											onSuccess: function(resp){
												contentLoader.stop(loaderId);
												
												self.updOffer(offer, resp.data.count, resp.data.traders);
												
												var closePopUp = true;
												
												if( resp.error == ErrorX.ids.WEbadSize || resp.error == ErrorX.ids.WElimit ){
													wnd.updCont('Внимание! Предложение изменилось.<br>Необходимо подтвердить новые условия.');
													
													closePopUp = false;
												}
												
												self.updList();
												
												if( closePopUp )
													wnd.close();
											},
											onFail: function(){
												contentLoader.stop(loaderId);
											}
										});
									},
									{icon: ContentLoader.icon.short, cssPosition: {right: -55, top: 1}, 
									callback:function(){wnd.setCanMakeStream(true);}} 
								);

								return false;
							});

						snip.input1Handler(this.cont);
					},
					afterDraw: function(){
						this.updCont();
					},

					updCont: function(alert){
						var wnd = this;

						this.wrp.find('.wnd-cont-wrp').html(tmplMgr.stream.buyOfferPopUp({offer: offer, type: 'traders', sell: Trade.isSell(self.data.type), alert: alert}));

						snip.spinboxHandler(this.cont);

						this.data.$slider = wnd.wrp.find('.js-streamPopup-buy-offer-slider .slider');
						this.data.sliderType = 'traders';

						snip.sliderHandler(this.data.$slider, {
							min: 0,
							slide: function(event, ui){
								wnd.calcPopupData(ui.value);
							}
						});

						this.setSliderType(this.data.sliderType);
						this.calcPopupData(this.setDefCount());
					},
					setSliderType: function(sliderType){
							sliderType = sliderType||this.data.sliderType;

							var sliderMax = sliderType == 'res' ? offer.count : offer.traders,
								count = this.wrp.find('input[name=' + sliderType + ']').val();

							this.data.$slider.slider({max: sliderMax, value: count});

							this.calcPopupData(count);
						},
					calcPopupData: function(count, sliderType){
						count = Math.max(0, utils.toInt(count));
						sliderType = sliderType||this.data.sliderType;

						if (sliderType == 'res') {
							var res = Math.min(count, offer.count);
							var traders = self.calcTradersByRes(res, offer, self.data.type);
						} else {
							var traders = Math.min(count, offer.traders);
							var res = self.calcResByTraders(traders, offer);
						}

						this.data.$slider.slider({value: sliderType=='res'? res : traders});

						this.wrp.find('input[name=res]').val(res);
						this.wrp.find('input[name=traders]').val(traders);

						this.checkCanMakeStream();

						var summ = Trade.calcStreamPrice(offer.cost, res, offer.tcost, traders);
						this.wrp.find('.js-offer-sum').text(summ.toFixed(0));

						var pledge = Trade.calcPledge(Trade.isSell(self.data.type) ? res : summ);
						this.wrp.find('.js-offer-pledge').text(pledge);
					},
					checkCanMakeStream: function(){
						this.setCanMakeStream(!!(+this.wrp.find('input[name=res]').val()));
					},
					setCanMakeStream: function(state){
						if( this.data.canMakeStream != state ){
							this.data.canMakeStream = state;

							this.wrp.find('.js-makeStream').toggleClass('-disabled', !state);
						}
					},
					setDefCount: function(){
						// Если покупаем, то по дефу пытаемся купить максимально большой объем предложения, который позваляют финансы
						// Отказались 06.09.2018
						/*
						if( self.data.type != 'sell' && this.data.sliderType == 'traders' ){
							var res = self.calcResByTraders(offer.traders, offer),
								// Сразу после покупки потока, взымаеться только залог. И уже после его подготовки начинает взыматься почасовая оплата за поставки на потоке
								pledge = Trade.calcPledge(Trade.calcStreamPrice(offer.cost, res, offer.tcost, offer.traders));

							if( wofh.account.money.sum < pledge ){
								var moneyPerTrader = pledge/offer.traders;

								return utils.toInt(wofh.account.money.sum/moneyPerTrader);
							}
							else
								return offer.traders;

						}
						*/

						return 0;
					}
				}
			});

			return false;
		});
};

bStreamBuy_list.prototype.afterDraw = function(){
	this.parent.wrp.find('.page-nav-prev').toggleClass('-active', this.data.prev !== undefined);
	this.parent.wrp.find('.page-nav-next').toggleClass('-active', this.data.next !== undefined);
};

bStreamBuy_list.prototype.updOffer = function(offer, count, traders){
	if( Trade.isBuy(this.data.type) ){
		offer.count = count;
		
		offer.traders = traders;
	}
	else{
		offer.count = count;

		this.prepareSellOffer(offer);
	}
};

bStreamBuy_list.prototype.setFilter = function(data){
	var filter = ls.getStreamFilter(Trade.getStreamFilter());

	filter.res = data.res;
	filter.type = data.type;
	filter.onlycountry = data.onlycountry;

	ls.setStreamFilter(filter);
};

bStreamBuy_list.prototype.prepareSellOffer = function(offer){
	offer.traders = wofh.town.getFreeTraders(); // Начальное значение
	offer.traders = this.calcTradersByRes(offer.count, offer, Trade.type.sell);

	offer.count = Math.min(offer.count, Trade.calcStreamRescountByTraders(offer.traders, offer.time));
};

bStreamBuy_list.prototype.updList = function(){
	this.getData(true);
};

bStreamBuy_list.prototype.calcTradersByRes = function(resCount, offer, type){
	var val = Trade.calcStreamTradersByRescount(resCount, offer.time, Trade.isBuy(type));

	return Math.min(val, offer.traders);
};

bStreamBuy_list.prototype.calcResByTraders = function(traders, offer){
	var val = Trade.calcStreamRescountByTraders(traders, offer.time);

	return Math.min(val, offer.count);
};



/******
 * Окно создания/редактирования предложения
 */

wStreamOffer = function(){
	this.name = 'streamOffer';
	this.hashName = 'streamOffer';
	
	wStreamOffer.superclass.constructor.apply(this, arguments);
	
	this.options.showBack = true;	
};

utils.extend(wStreamOffer, Wnd);

WndMgr.regWnd('streamOffer', wStreamOffer);


wStreamOffer.prepareData = function(id){
	var data = {},
		params = {id:id};
	
	if( typeof(id) == 'string' )
		params = utils.urlToObj(id);
	
	var	offer = wofh.streamOffers.getElem(params.id).clone();
	
	data.town = wofh.towns[offer.town||params.town]||wofh.town;
	
	offer.id = offer.id;
	//offer.sell = offer.sell === undefined ? +!(params.buy) : offer.sell;
	offer.res = offer.res||Resource.ids.wood;
	offer.count = offer.getCount()||0;
	offer.cost = offer.cost||0;
	offer.tcost = offer.tcost||0;
	offer.text = offer.text||'';
	
	var lastData = ls.getStreamOfferLastData({distance:lib.trade.distance});
	
	if( lastData.ally && !wofh.tradeAllies.getElem(lastData.ally))
		delete lastData.ally;
	
	if( lastData.distance > lib.trade.distance && !Account.hasAbility(Science.ability.longTrade) )
		lastData.distance = lib.trade.distance;
	
	
	offer.distance = offer.distance||lastData.distance;
	offer.ally = offer.ally !== undefined ? offer.ally : lastData.ally;
	
	if( offer.sell == 1 || offer.id ){
		// Вычисляем, какие ресурсы будут заблокированы 
		data.disabled = [];
		for(var res in lib.resource.data){
			if( offer.id ){
				if( offer.res != res )
					data.disabled.push(+res);
			}
			else if( !wofh.town.getRes(res).getHas() ){
				data.disabled.push(+res);
			}
		}
	}
	
	data.offer = offer;
	
	return data;
};


wStreamOffer.prototype.bindEvent = function(){
	var self = this;
	
	this.cont
		.on('click', '.js-resFilter .js-resb', function(){
			if( self.data.offer.id )
				return false;
			
			snip.filterResChange($(this));
		})
		.on('change', '.js-operation-type', function(){
			if( self.data.offer.id )
				return false;

			self.checkCanSetOffer(true); 
			$(this).parent().addClass('-active').siblings().removeClass('-active');

			var buy = $(this).val() == 'buy';
			
			self.resFilterToggleDisabled(self.cont.find('.js-resFilter'), !buy);
		})
		.on('submit', '.js-streamPopup-sell-offer', function(){
			if( !self.data.canSetOffer )
				return false;
			
			self.checkCanSetOffer(false); // Запрещаем повторное нажатие кнопок
			
			contentLoader.start( 
				self.cont.find('.js-setOffer'), 
				0, 
				function(){
					var reqData = utils.urlToObj($(this).serialize());
					
					reqData.tcost *= self.data.tcostSlider.float.digit;
					reqData.cost *= self.data.costSlider.float.digit;
					
					reqMgr.setStreamOffer(self.data.offer.id, reqData.type == 'sell', reqData.res, reqData.count, reqData.tcost, reqData.cost, reqData.distance, reqData.ally, reqData.text, function(){
						if( self.data.offer.id === undefined )
							ls.setStreamOfferLastData({distance:reqData.distance, ally:reqData.ally});
						
						self.close();
					}, self.data.town);
				}.bind(this),
				{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){self.checkCanSetOffer(true);}}
			);
			
			return false;
		})
		.on('click', '.js-delOffer', function(){
			var $this = $(this);
			
			if( !self.data.canSetOffer )
				return false;
			
			wndMgr.addConfirm().onAccept = function(){
				self.checkCanSetOffer(false); // Запрещаем повторное нажатие кнопок
				
				var loaderId = contentLoader.start(
					$this, 
					0, 
					function(){
						reqMgr.delStreamOffer(self.data.offer.id, function(){
							contentLoader.stop(loaderId);
							
							self.close();
						}, self.data.town);
					}.bind(this),
					{icon: ContentLoader.icon.small, cssPosition: {right: -30, top: 10}, callback: function(){
						self.checkCanSetOffer(true);
					}}
				);
				
			};
			
			return false;
		});
	
	// Слайдер количества
	snip.iSliderHandler({
		$slider: this.cont.find('.js-streamPopup-offerCount-slider .slider'),
		min: Math.min(0, self.data.offer.count),
		maxLimit: wofh.town.stock.getLimit(),
		max: (utils.toInt((Math.abs(self.data.offer.count) + lib.trade.capacity)/lib.trade.capacity)) * lib.trade.capacity,
		value: this.data.offer.count,
		shortStep: 1,
		name: 'count',
		labelIcon: snip.resBig(self.data.offer.res),
		create: function(iSlider){
			self.cont.on('click', '.js-streamPopup-resFilter .js-resFilter .js-resb', function(){
				if( $(this).is('.disabled') ) return;
				
				iSlider.$slider.find('.js-slider-label-icon').html(snip.resBig($(this).data('res')));
			});
		}
	});
	
	//  Слайдер стоимости торговца
	this.data.tcostSlider = snip.iSliderHandler({
		$slider: this.cont.find('.js-streamPopup-offerTcost-slider .slider'),
		min: 0,
		maxLimit: lib.trade.maxtraderprice,
		max: (utils.toInt((this.data.offer.tcost + 1000)/1000)) * 1000,
		value: this.data.offer.tcost,
		shortStep: 1,
		name: 'tcost',
		labelIcon: snip.resBig(Resource.ids.money),
		float: {fixed: 3}
	});
	
	// Слайдер стоимости
	this.data.costSlider = snip.iSliderHandler({
		$slider: this.cont.find('.js-streamPopup-offerCost-slider .slider'),
		min: 0,
		maxLimit: lib.trade.maxtradeprice,
		max: (utils.toInt((this.data.offer.cost + 1000)/1000)) * 1000,
		value: this.data.offer.cost,
		shortStep: 1,
		name: 'cost',
		labelIcon: snip.resBig(Resource.ids.money),
		float: {fixed: 3}
	});
	
	// Слайдер расстояния
	snip.iSliderHandler({
		$slider: this.cont.find('.js-streamPopup-offerDist-slider .slider'),
		min: Trade.minDistance,
		maxLimit: Account.hasAbility(Science.ability.longTrade) ? lib.map.size.array : lib.trade.distance,
		value: this.data.offer.distance,
		shortStep: 1,
		name: 'distance',
		labelIcon: snip.ruler()
	});
	
	this.checkCanSetOffer(this.data.offer.sell != undefined);
};



wStreamOffer.prototype.checkCanSetOffer = function(state){
	if( this.data.canSetOffer != state ){
		this.data.canSetOffer = state;
		
		this.cont.find('.js-setOffer, .js-delOffer').toggleClass('-disabled', !state);
	}
};

wStreamOffer.prototype.resFilterToggleDisabled = function($filter, disabled){
	$filter.find('a[data-disabled=1]').toggleClass('disabled', disabled);
	
	// Выделялка первого по умолчанию
	if ( $filter.find('a.disabled.-active').length )
		$filter.find('a:not(.disabled)').first().trigger('click');
};





wStreamChange = function(){
	this.name = 'streamChange';
	this.hashName = 'streamChange';
	
	wStreamChange.superclass.constructor.apply(this, arguments);
	
	this.options.showBack = true;	
};

utils.extend(wStreamChange, Wnd);

WndMgr.regWnd('streamChange', wStreamChange);


wStreamChange.prepareData = function(id){
	var data = {},
		params = {id:id};
	
	if( typeof(id) == 'string' )
		params = utils.urlToObj(id);
	
	if( !params.id )
		return false;
	
	var	stream = wofh.streams.getElem(params.id).clone();
	
	data.town = wofh.towns[stream.town||params.town]||wofh.town;
	
	var town1 = stream.town1,
		town2 = stream.town2;

	stream.town1 = wofh.world.getTown(town1);
	stream.account1 = wofh.world.getAccountByTown(town1);
	stream.country1 = wofh.world.getCountryByTown(town1);

	stream.town2 = wofh.world.getTown(town2);
	stream.account2 = wofh.world.getAccountByTown(town2);
	stream.country2 = wofh.world.getCountryByTown(town2);
	
	// Перерасчитываем округленную на сервере переменую disttime
	stream.disttime = stream.calcDistTime();
	stream.fuel = stream.getFuel();
	stream.price = stream.calcPrice();
	stream.dir = stream.getDir(data.town);

	stream.changePrice = stream.price != 0 && stream.dir == Stream.dirs.out;
	stream.changeCount = wofh.towns[stream.town1.id] ? true : false;

	if( stream.dir == Stream.dirs.in )
		stream.maxTraders = stream.changeCount ? stream.traders * 2 : stream.traders;
	else
		stream.maxTraders = Math.max(0, data.town.getFreeTraders()) + stream.traders;
	
	stream.maxCount = stream.changeCount ? Trade.calcStreamRescountByTraders(stream.maxTraders, stream.disttime) : stream.getCount();
	
	
	var nextChange = stream.costuptime + lib.trade.costup.period;

	data.canUpPrice = timeMgr.getNow() > nextChange;

	if( stream.changePrice && !data.canUpPrice )
		stream.timer = timeMgr.fPeriod(nextChange - timeMgr.getNow());

	if( stream.changePrice ){
		if( data.canUpPrice )
			data.maxPriceUp = stream.price * lib.trade.costup.mult;
		else
			stream.timer = timeMgr.fPeriod(nextChange - timeMgr.getNow());
	}
	
	data.stream = stream;
	
	//новые данные
	data.streamNew = stream.clone();
	
	return data;
};


wStreamChange.prototype.bindEvent = function(){
	var self = this,
		stream = this.data.stream,
		streamNew = this.data.streamNew;
	
	this.cont
		.on('input', 'input[name=count]', function(){
			utils.checkInputInt(this, {min: 0});
			
			self.data.mainField = 'count';
			self.disableInputs('count');
			self.calc('count');
		})
		.on('input', 'input[name=traders]', function(){
			utils.checkInputInt(this, {min: 0});
			
			self.data.mainField = 'traders';
			self.disableInputs('traders');
			self.calc('traders');
		})
		.on('input', 'input[name=cost]', function(){
			utils.checkInputInt(this, {min: 0});
			
			self.disableInputs('cost');
			self.calc('cost');
		})
		.on('input', 'input[name=tcost]', function(){
			utils.checkInputFloat(this, undefined, 0, 1);
			
			self.disableInputs('tcost');
			self.calc('tcost');
		})
		.on('change', '.streamChg-speedUp', function(){
			var fuelId = +$(this).val();
			self.data.streamNew.fuel = fuelId ? new Resource(fuelId) : false;
			self.disableInputs('fuel');
			self.calc(self.data.mainField||'count');
		})
		.on('click', '.js-change', function(){
			if( !self.data.canChange )
				return false;
			
			var data = utils.urlToObj(self.cont.find('.js-settings').serialize());
			
			// Условия учитывают изменение вместимости торговцев
			if( data.traders == stream.traders )
				data.count = self.cont.find('.js-changeStream-count').val();
			// Если изменить traders при одинаковом count, 
			// то произойдет перерасчет count в зависимости от нового параметра traders.
			// Таким образом не получится избавится от "лишнего" торговца на потоке после после преыдущего увеличения потока.
			// Но возможно это условие еще понадобится.
			//else if( data.count == stream.getCount() )
			//	data.traders = self.cont.find('.js-changeStream-traders').val();
			
			/* 
			 * Если количество торговцев (data.traders) изменяется, то парамет count игнорируется сервером и расчет происходит по вместимости торговцев 
			 * Если у инпута был выставлен атрибут disabled, то при парсинге формы значение данного инпута будет отсутствовать
			*/
			data.count = data.count == undefined ? stream.getCount() : data.count;
			
			data.traders = data.traders == undefined ? stream.traders : data.traders;
			
			data.cost = data.cost == undefined ? stream.cost : data.cost;
			
			data.tcost = data.tcost == undefined ? stream.tcost : utils.formatNum(data.tcost, {uFixed: true}) * 1000;
			
			data.fuelId = streamNew.fuel ? streamNew.fuel.id : 0;
			
			reqMgr.updateStream(stream.id, data.count, data.traders, data.cost, data.tcost, data.fuelId, stream, self.data.town, function(){
				self.close();
			});
		});
		
	if( stream.changePrice ){
		if( this.data.canUpPrice ){
			this.calcMaxStreamCost(stream);
			this.calcMaxStreamTcost(stream);
		}
		else{
			stream.maxCost = stream.cost;
			stream.maxTcost = stream.tcost;
		}
		
		snip.sliderHandler(this.cont.find('.js-costSlider'), {
			min: 0,
			max: stream.maxCost,
			value: stream.cost,
			slide: function(event, ui){
				self.cont.find('input[name=cost]').val((ui.value));
				self.disableInputs('cost');
				self.calc('cost');
			}
		});
		
		if( stream.maxTcost >= 1000 )
			snip.sliderHandler(this.cont.find('.js-tcostSlider'), {
				min: 0,
				max: utils.toInt(stream.maxTcost * 0.001),
				value: utils.toInt(stream.tcost * 0.001),
				slide: function(event, ui){
					self.cont.find('input[name=tcost]').val((ui.value));
					self.disableInputs('tcost');
					self.calc('tcost');
				}
			});
		else
			this.cont.find('.js-tcostSlider').parents('tr').remove();
	}
	
	snip.sliderHandler(this.cont.find('.js-tradersSlider'), {
		min: 1,
		max: stream.maxTraders,
		value: stream.traders,
		slide: function(event, ui){
			self.data.mainField = 'traders';
			self.cont.find('input[name=traders]').val(ui.value);
			self.disableInputs('traders');
			self.calc('traders');
		}
	});	
	
	snip.input1Handler(this.cont, {spinbox:{}});
	
	this.calc();
	
	SelectStyled.init(this.cont);
};


wStreamChange.prototype.disableInputs = function(except){
	if(except=='fuel'){
		this.cont.find('input[name=count],input[name=traders],input[name=cost],input[name=tcost]').attr('disabled', 'disabled');
		this.cont.find('.js-tradersSlider,.js-costSlider,.js-tcostSlider').slider({ disabled: true });
	}
	else if(except=='cost'){
		this.cont.find('input[name=count],input[name=traders],select').attr('disabled', 'disabled');
		this.cont.find('.js-tradersSlider').slider({ disabled: true });
	}
	else if(except=='tcost'){
		this.cont.find('input[name=count],input[name=traders],select').attr('disabled', 'disabled');
		this.cont.find('.js-tradersSlider').slider({ disabled: true });
	}
	else if(except=='count'){
		this.cont.find('input[name=traders],input[name=cost],input[name=tcost],select').attr('disabled', 'disabled');
		this.cont.find('.js-tradersSlider,.js-costSlider,.js-tcostSlider').slider({ disabled: true });
	}else{
		this.cont.find('input[name=count],input[name=cost],input[name=tcost],select').attr('disabled', 'disabled');
		this.cont.find('.js-costSlider,.js-tcostSlider').slider({ disabled: true });
	}
};

wStreamChange.prototype.calc = function(changed){
	var stream = this.data.stream;
	var streamNew = this.data.streamNew;
	
	var costInp = this.cont.find('input[name=cost]');
	var cost = costInp.length ? Math.max(0, costInp.val()) : stream.cost;
	var showCost = costInp.length;
	if( stream.maxCost !== undefined ) cost = Math.min(cost, stream.maxCost);

	var tcostInp = this.cont.find('input[name=tcost]');
	var showTcost = tcostInp.length;
	var tcost = showTcost ? Math.max(0, tcostInp.val()) * 1000 : stream.tcost;
	if( stream.maxTcost !== undefined ) tcost = Math.min(tcost, stream.maxTcost);
	
	if( changed == 'cost' ){
		this.calcMaxStreamTcost(stream, this.data.maxPriceUp - Trade.calcStreamPrice(cost, stream.getCount(), tcost, stream.traders), tcost, true);
	}
	if( changed == 'tcost' ){
		this.calcMaxStreamCost(stream, this.data.maxPriceUp - Trade.calcStreamPrice(cost, stream.getCount(), tcost, stream.traders), cost, true);
	}
	
	var countInp = this.cont.find('input[name=count]');
	var tradersInp = this.cont.find('input[name=traders]');

	//пересчёт скорости торговцев от ускорения
	streamNew.disttime = streamNew.calcDistTime();
	
	if( changed != 'traders' ){
		var count = countInp.length ? Math.max(0, countInp.val()) : stream.getCount();
		var showCount = countInp.length && count != '';
		count = Math.max(0, utils.toInt(count));
		if(stream.buy && !stream.changeCount)
			count = Math.min(count, stream.getCount());
		else
			count = Math.min(count, stream.maxCount);
		
		var showTraders = true;

	}
	if( changed != 'count' ){
		var traders = tradersInp.length ? Math.max(0, tradersInp.val()) : stream.traders;
		var showTraders = tradersInp.length && traders != '';
		traders = Math.max(0, utils.toInt(traders));
		traders = Math.min(traders, stream.maxTraders);
		var showCount = true;
	}

	if( changed == 'count' ){
		var traders = Trade.calcStreamTradersByRescount(count, streamNew.disttime);
	}
	if( changed == 'traders' ){
		var count = Trade.calcStreamRescountByTraders(traders, streamNew.disttime);
		if(stream.buy && count && !stream.changeCount > stream.getCount()){
			count = stream.getCount();
			traders = Trade.calcStreamTradersByRescount(count, streamNew.disttime);
		}
	}

	
	//count = Math.min(count, stream.maxCount);

	// Расчёт новой стоимости потока
	var price = Trade.calcStreamPrice(cost, count, tcost, traders);

	// Cохранение данных
	if( showCost ){
		costInp.val(cost);
		
		this.showChanges(cost, stream.cost, '.js-chgPopupCost');
	}
	this.cont.find('.js-costSlider').slider({value: cost});

	if( showTcost ){
		tcostInp.val(utils.formatNum(tcost * 0.001, {uFixed:1}));
		tcostInp.data('prevVal', utils.formatNum(tcost * 0.001, {uFixed:1}));
			
		this.showChanges(tcost * 0.001, stream.tcost * 0.001, '.js-chgPopupTcost', 1);
	}
	this.cont.find('.js-tcostSlider').slider({value: utils.toInt(tcost * 0.001)});

	if( showCount ){
		countInp.val(count);
		this.showChanges(count, stream.getCount(), '.js-chgPopupCount');

		if( stream.dir == Stream.dirs.out ){
			var fuelOld = stream.getFuel();
			var fuelNew = streamNew.getFuel(count);

			this.showFuel(count, fuelOld, fuelNew);
			this.showPledge(count, fuelOld, fuelNew);
		}
		else{
			this.cont.find('.js-popupPledge').html(snip.resCount(Resource.ids.money, Trade.calcPledge(price, false)));
			this.showChanges(Trade.calcPledge(price, false), Trade.calcPledge(stream.price, false), '.js-chgPopupPledge');
			
			var isDecreased = Trade.calcPledge(stream.getCount(), false) > Trade.calcPledge(count, false);
			
			this.cont.find('.js-popupPledgeWrp').html(isDecreased ? tmplMgr.streamChange.pledge.alert({dir: Stream.dirs.in, town: stream.getTown()}) : '');
			
			this.cont.find('.js-popupPledgeTitle').toggleClass('-invis', !isDecreased);
		}
	}
	
	if( showTraders ){
		tradersInp.val(traders);
		this.showChanges(traders, stream.traders, '.js-chgPopupTraders');
	}

	this.cont.find('.js-tradersSlider').slider({value: traders});
	this.cont.find('.js-popupPrice').html(utils.stages(price.toFixed(1)));

	this.showChanges(price, stream.price, '.js-chgPopupPrice', 1);

	this.setCanChange(count <= stream.maxCount && !(count == stream.getCount() && traders == stream.traders && cost == stream.cost && tcost == stream.tcost && (streamNew.fuel? streamNew.fuel.id: 0) == (stream.fuel? stream.fuel.id: 0)) );
};

wStreamChange.prototype.showFuel = function(resCount, fuelOld, fuelNew){
	var stream = this.data.stream;

	var resList = new ResList();
	resList.setSorted(true);

	//старые данные
	if (stream.fuel){
		var res = fuelOld.clone();
		res.countOld = res.count;
		res.count = 0;
		resList.addElem(res);	
	}

	//новые данные
	if (fuelNew) {
		var res = fuelNew.clone();
		res.countOld = resList.getElem(res).countOld||0;
		resList.replaceElem(res);	
	}

	this.cont.find('.js-popupFuelWrp').html(tmplMgr.streamChange.fuel({list: resList}));
};

wStreamChange.prototype.showPledge = function(resCount, fuelOld, fuelNew){
	var stream = this.data.stream;

	var resList = new ResList();
	resList.setSorted(true);

	//ресурс
	var res = new Resource(stream.res, Trade.calcPledge(resCount, false));
	res.countOld = Trade.calcPledge(stream.getCount(), false);
	resList.addElem(res);

	//старые данные
	if (stream.fuel){
		var fuelPledgeOld = new Resource(fuelOld.id, Trade.calcPledge(fuelOld.count, true));
		var res = resList.getElem(fuelPledgeOld.id);
		res.countOld = (res.countOld||0) + fuelPledgeOld.count;
		res.count = res.count||0;
		resList.replaceElem(res);
	}
	
	//новые данные
	if (fuelNew) {
		var fuelPledgeNew = new Resource(fuelNew.id, Trade.calcPledge(fuelNew.count, true));
		var res = resList.getElem(fuelPledgeNew.id);
		res.countOld = res.countOld||0;
		res.count = (res.count||0) + fuelPledgeNew.count;
		resList.replaceElem(res);	
	}

	this.cont.find('.js-popupPledgeWrp').html(tmplMgr.streamChange.pledge({list: resList}));
};

wStreamChange.prototype.showChanges = function(newVal, oldVal, className, fixed){
	var str = '';
	if( newVal != oldVal ){
		var delta = newVal - oldVal;
		str += '(<span class="cl-' + (delta > 0 ? 'green' : 'red') + '">' + snip.sign(delta, utils.stages(delta.toFixed(fixed))) + '</span>)';
	}

	this.cont.find(className).html(str);
};

wStreamChange.prototype.setCanChange = function(state){
	if( this.data.canChange != state ){
		this.data.canChange = state;
		this.cont.find('.js-change').toggleClass('-disabled', !state);
	}
};

wStreamChange.prototype.reCalcMaxPriceUp = function(){
	
};

wStreamChange.prototype.calcMaxStreamCost = function(stream, price, cost, correctSld){
	price = price === undefined ? (stream.price * lib.trade.costup.mult - stream.price) : price;
	cost = cost === undefined ? stream.cost : cost;
	
	stream.maxCost = cost + utils.toInt(utils.servRound(price/stream.getCount()) * 1000);
	stream.maxCost = Math.min(stream.maxCost, lib.trade.maxtradeprice);
	
	if( correctSld )
		this.cont.find('.js-costSlider').slider({max: stream.maxCost});
	
	return stream.maxCost;
};

wStreamChange.prototype.calcMaxStreamTcost = function(stream, price, tcost, correctSld){
	price = price === undefined ? (stream.price * lib.trade.costup.mult - stream.price) : price;
	tcost = tcost === undefined ? stream.tcost : tcost;
	
	stream.maxTcost = tcost + utils.toInt((utils.toInt(price)/stream.traders) * 1000);
	stream.maxTcost = Math.min(stream.maxTcost, lib.trade.maxtraderprice);
	
	if( correctSld )
		this.cont.find('.js-tcostSlider').slider({max: utils.toInt(stream.maxTcost * 0.001)});
	
	return stream.maxTcost;
};