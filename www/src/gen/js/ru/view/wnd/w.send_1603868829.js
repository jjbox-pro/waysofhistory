wSend = function(id, data){
	wSend.superclass.constructor.apply(this, arguments);
};

utils.extend(wSend, Wnd);

WndMgr.regWnd('send', wSend);


wSend.checkStockResUpd = function(resOrId){
	var updateHour = utils.toInt(resOrId.updateHour === undefined ? wofh.town.stock.getElem(resOrId).updateHour : resOrId.updateHour);
	
	if( !updateHour )
		return '';
	else
		return updateHour > 0 ? 'inc' : 'dec';
};

wSend.prepareData = function(id, extData){
	var data = {},
		params = utils.urlToObj(id, true);
	
	if( extData )
		utils.copyProperties(params, extData);
	
	if( params.order ){
		data.order = params.order;
		params.list = params.list||data.order.getResList();
		params.target = params.target||data.order.getTown().id;
	}
	
	if( params.list )
		data.defResList = params.list instanceof ResList ? params.list : new ResList(params.list);
	
	if( params.target ){
		if( params.target == wofh.town.id )
			data = false;
		else{
			data.targetId = params.target;
			
			if( params.noOwnTowns || data.order )
				data.noOwnTowns = true;
		}
	}
	
	if( data )
		data.loadOptions = wofh.account.isPremium() ? ls.getSendLoadOptions({traders: false, party: false}) : {}; // Загрузка в торговцах, загрузка партиями
	
	return data;
};


wSend.prototype.calcName = function(){
	return 'send';
};

wSend.prototype.calcChildren = function(){	
	this.children.view = wSend_view;
};

wSend.prototype.onClose  = function() {
    notifMgr.runEvent(Notif.ids.sysCloseDependentWnd);
};

wSend.prototype.afterShow = function(firstShow){
	if( firstShow )
		wTradersMove.autoStart(this); // Открытие окна передвижения торговцев
};



wSend_view = function(){
	this.name = 'view';
	
	wSend_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(wSend_view, Block);


wSend_view.prototype.addNotif = function(){
	this.notif.other[Notif.ids.townResHas] = this.notifTownResHas;
	this.notif.other[Notif.ids.townRes] = this.notifTownRes;
	this.notif.other[Notif.ids.townTraders] = this.notifTownTraders;
	this.notif.other[Notif.ids.accTownBonus] = this.notifTownTraders;
};

wSend_view.prototype.getData = function() {
	this.data = this.parent.data;
	
	this.countReq = 1;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'),
		0, 
		function(){
			if( this.data.targetId )
				this.getTargetData();
			else
				this.getPathData();
			
			this.dataReceived();	
		}.bind(this) 
	);
};

wSend_view.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('change', '.js-send-towns-townSelect', function(e){
			var town = self.data.towns[$(this).val()];
			
			self.wrp.find('.js-send-townsImg').html( town.id ? snip.townIconLink(town, town.account, wofh.country) : '' );
			self.wrp.find('.js-send-towns-path').html( town.path && town.id ? tmplMgr.send.townPath({path:town.path, dist:town.dist, }) : '' );
			self.wrp.find('.js-send-towns-account').html( town.account && town.id ? (wofh.account.isPremium() ? snip.accCountry(town.account, town.country): snip.acc(town.account)) : '' );
			
			if( town.avail ){
				var airWayProp = {checked: false, disabled: false};
				
				if( town.onlyAirWay )
					airWayProp.checked = airWayProp.disabled = true;

				self.wrp.find('input[name="useairway"]').prop(airWayProp);
			}
			
			self.data.fuell = wofh.town.traders.fuell;
			self.data.fuelw = wofh.town.traders.fuelw;
			
			self.calcSend({checkSpeedUp:true});
			
			self.parent.makeResize();
		})
		.on('change', '.js-send-conditions-speedUpSelect', function(){
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

			self.calcSend({checkSpeedUp: true, speedUpNotUpdate: true});
		})
		.on('input', '.js-send-res-input', function(){
			self.changeResCount(this, {maxVal:self.getResLimit(this), checkCapacity:true});
		})
		.on('focusin', '.js-send-res-input', function(){
			if( $(this).hasClass('-active') )
				return;
			
			var $this = $(this),
				$sliderWrp = $this.closest('.js-send-res').addClass('js-hovered').find('.js-send-res-slider-wrp'),
				val = $this.val(),
				resLimit = self.getResLimit($this),
				sliderMax = Math.min(resLimit, Math.max(val, 250) * 2);
			
			// Если используется загрузка крантная торговцам, вызываем checkInputVal для корректировки положения каретки 
			if( self.data.loadOptions.traders )
				self.setTimeout(function(){this.checkInputVal($this);}, 0); // Задержка из-за того, что checkInputVal изменяет положение коретки до системной установки
			
			self.data.$curSlider = snip.sliderHandler($sliderWrp.find('.slider'), {
				min: 0,
				max: sliderMax,
				step: self.data.loadOptions.traders ? lib.trade.capacity : 1,
				value: val,
				create: function(){
					$sliderWrp.slideDown(200);
					
					$this.addClass('-active');
					
					self.setResTimeOut();
					
					delete self.isResTimeOut;
				},
				slide: function(event, ui){
					self.changeResCount($this.val(ui.value), {noValidate:true, checkCapacity:true});
				},
				change: function(event, ui){
					if( $this.hasClass('js-refreshSliderVal') ){
						$this.removeClass('js-refreshSliderVal');
						
						self.changeResCount($this, {noRecalcFood:true, noRecalc:true});
						
						return;
					}
					
					val = $this.val();
					
					if( val >= sliderMax ){
						resLimit = self.getResLimit($this);
						// ui.value не используется, т.к. оно обрезается до перерасчета нового максимального значения
						if( val > sliderMax ){
							sliderMax = Math.min(resLimit, val * 2);
							self.data.$curSlider.slider('option', {value: val, max: sliderMax});
						}
						else{
							sliderMax = Math.min(resLimit, sliderMax * 2);
							self.data.$curSlider.slider('option', {max: sliderMax});
						}
					}
					
					self.toggleReset(true);
				}
			});
		})
		.on('focusout', '.js-send-res', function(){
			if( $(this).hasClass('js-hovered') && !self.isResTimeOut )
				return false;
			
			var $resInput = $(this).find('.js-send-res-input'),
				$sliderWrp = $(this).find('.js-send-res-slider-wrp');
			
			if( $resInput.hasClass('-active') ){
				$resInput.removeClass('-active').blur();
				
				$sliderWrp.slideUp(200, function(){
					$sliderWrp.html('<div class="slider"></div>');
				});
			}
			
			return false;
		})
		.on('mouseenter', '.js-send-res', function(){
			$(this).toggleClass('js-hovered', !$(this).hasClass('js-hovered'));
			
			return false;
		})
		.on('mouseleave', '.js-send-res', function(){
			$(this).toggleClass('js-hovered', !$(this).hasClass('js-hovered'));
			
			return false;
		})
		.on('click', '.js-maxLoad', function(){       
			self.calcMaxLoad($(this).parents('.send-res').find('.send-res-input'));
			
			self.toggleReset(true);
			
			return false;
		})
		.on('submit', '.js-send-form', function(){
			if( !self.data.canSend )
				return false;
			
			wndMgr.addConfirm(tmplMgr.send.confirm({sendInfo:self.data.sendInfo, curCapacity:self.data.curCapacity})).onAccept = function(){
				var sendInfo = self.data.sendInfo;
				
				reqMgr.sendRes(wofh.town.id, sendInfo.town.id, sendInfo.resList, sendInfo.selectedPath.wayType, (sendInfo.transportCons||{}).id, self.data.order, function(){
					var parent = self.parent;
					
					if( self.data.order ){
						self.close();
						
						parent = false;
						
						notifMgr.runEvent(Notif.ids.countryOrders);
					}
					else
						self.reset();
					
					wTradersMove.autoStart(parent); // Открытие окна передвижения торговцев
				});
			};
			
			return false;
		})
		.on('keydown', '.js-send-res', function(e){
			if( !self.ctrlKey && e.ctrlKey && $(this).find('.js-send-res-input').hasClass('-active') ){
				self.ctrlKey = true;
				
				if( self.data.loadOptions.traders ){
					self.cont.find('.js-send-load-trade').prop('checked', false);
					self.data.loadOptions.traders = false;
				}
			
				self.data.$curSlider.slider('option', 'step', 5);
			}
		})
		.on('keyup', '.js-send-res', function(e){
			if( self.ctrlKey && !e.ctrlKey && $(this).find('.js-send-res-input').hasClass('-active') ){
				delete self.ctrlKey;
				self.data.$curSlider.slider('option', 'step', 1);
			}
		})
		.on('click', '.js-send-reset', function(){
			self.reset();
		})
		.on('change', 'input[name="useairway"]', function(){
			self.calcSend({checkSpeedUp: true, speedUpNotUpdate: true});
		});
	
	if( wofh.account.isPremium() ){
		this.wrp
			.on('change', '.js-send-load-party', function(){
				self.data.loadOptions.party = $(this).prop('checked');
				
				if( self.data.loadOptions.party )
					self.cont.find('.js-send-res-parties-wrp').slideDown(200);
				else
					self.cont.find('.js-send-res-parties-wrp').slideUp(200);
				
				ls.setSendLoadOptions(self.data.loadOptions);
			})
			.on('click', '.js-send-res-party', function(){
				var $res = $(this).parents('.send-res').find('.send-res-input');

				self.changeResCount($res.val(Math.max((utils.toInt($res.val()) + utils.toInt($(this).data('count')*lib.trade.capacity)), 0)), {maxVal:self.getResLimit($res), checkCapacity:true});
				
				self.toggleReset(true);
			})
			.on('change', '.js-send-load-trade', function(){
				self.data.loadOptions.traders = $(this).prop('checked');
				
				if( self.data.loadOptions.traders ){
					self.$getFormStockableResList().each(function(){
						if( $(this).val() )
							self.changeResCount(this, {maxVal:self.getResLimit(this), noRecalc:true});
					});
					
					self.changeResCount(false);
				}
				
				ls.setSendLoadOptions(self.data.loadOptions);
			});
	}
	
	snip.spinboxHandler(this.wrp);
};

wSend_view.prototype.dataReceived = function() {
	if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId); this.loaderId = undefined;
		
		this.prepareTemplateData();
		
		wSend_view.superclass.dataReceived.apply(this, arguments);
	}
};

wSend_view.prototype.afterDraw = function() {
	this.calcFood();
	this.calcCurCapacity();
	this.calcSend({checkSpeedUp: true});
	this.showDefResList();
};

wSend_view.prototype.close = function(){
	this.parent.close();
};


wSend_view.prototype.getTargetData = function() {
	var self = this;
	
	this.countReq++;
	
	this.getReqData(function(){
		reqMgr.getTargetData(this.data.targetId, wofh.town.id, undefined, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					if( !resp.town )
						return this.unknownTown();

					var target = resp.town[this.data.targetId];

					if( !target.pos )
						return this.unknownTown();

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
					
					this.data.target = target;

					this.getPathData();

					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};

wSend_view.prototype.getPathData = function() {
	var self = this;
	
	this.countReq++;
	
	var path =	[wofh.town.pos.o];
	var towns = [];
	
	if( this.data.target ){
		this.addPath(path, this.data.target);
		
		towns.push(this.data.target);
	}
	
	if( !this.data.noOwnTowns ){
		for(var town in wofh.towns){
			town = wofh.towns[town];
			
			// Данные получаются только для максимум 30 городов 
			if( debug.isTest('system') && towns.length == 30 )
				break;
			
			if( town.id != wofh.town.id ){
				var townClone = town.cloneBase();
				
				townClone.pos = town.pos;
				townClone.country = wofh.country;
				townClone.wonder = town.getWonder();
				if( townClone.wonder )
					townClone.wonder = townClone.wonder.clone();

				towns.push(townClone);
				
				this.addPath(path, townClone);
			}
		}
	}
	
	// Вставляем пустышку, если нету цели и городов больше чем 1
	if( !this.data.target && towns.length > 1 ){
		towns.unshift({id:0, name:'', account: wofh.account});
	}
	
	this.data.towns = towns;
	
	this.getReqData(function(){
		reqMgr.getPathData(path, false, false, function(resp, reqId){
			self.tryProcessResp(
				resp, reqId,
				function(){
					for(var town in this.data.towns){
						town = this.data.towns[town];
						
						if( town.id ){
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
						}
					}
					
					this.data.defTown = this.data.towns[0];

					this.dataReceived();
				}
			);
		});
	}, {minReqId: true});
};

wSend_view.prototype.prepareTemplateData = function() {
	var stockResList = this.getStockResList();
	
	if( this.data.defResList ){
		// Дозаполняем отсутствующие на складе ресы
		stockResList.setAllowZero(true);
		stockResList.addList(ResList.getAll().getStockable());
		
		var list = stockResList.getList(),
			defFoodCount = this.data.defResList.getFood().getCount(),
			curFreeTradersCapacity = wofh.town.getFreeTradersCapacity(); 
		
		for(var res in list){
			res = list[res];
			
			var defRes = this.data.defResList.getElem(res);
			
			// Количество реса на складе на момент открытия окна
			res.hasWas = res.getCount();
			
			if( defFoodCount && defRes.isGrown() ){
				// Сперва заполняется фиксированный лимит ресов роста, остальное уходит в пищу в порядке выставленного приоретета
				res.fixlimit = defRes.getCount();
				
				if( res.fixlimit ){
					this.data.hasFixlimit = true; // Флаг указывающий, что есть ресурсы роста, фиксированный лимит которых не должен влиять на заполняемость пищи
					
					res.limit = res.fixlimit + defFoodCount;
					res.setCount(Math.min(res.limit, res.hasWas));
					res.defCount = Math.min(res.fixlimit, res.getCount());
				}
				else{
					res.limit = defFoodCount;
					res.setCount(Math.min(res.limit, res.hasWas));
				}
			}
			else if( defRes.getCount() ){
				res.limit = defRes.getCount();
				res.setCount(Math.min(res.limit, res.hasWas));
				res.defCount = res.getCount();
			}
			else
				res.hidden = true;
			
			if( !res.hidden )
				res.limitWas = res.getCount(); // Запоминаем первоначально расчитанный лимит
			
			if( res.defCount ){
				res.defCount = Math.min(res.defCount, curFreeTradersCapacity);
				curFreeTradersCapacity -= res.defCount;
			}
		}
		
		// Перерасчитываем лимит для пищи, если есть ресы роста с фиксированным лимитом
		if( this.data.hasFixlimit ){
			res = stockResList.getFood();
			
			defFoodCount = Math.min(res.limitWas, Math.max(0, res.hasWas - this.calcResGrownFixLimitSum()));
			
			res.limit = defFoodCount;
			res.setCount(Math.min(res.limit, res.getCount()));
			res.defCount = Math.min(res.defCount, res.getCount());
		}
		
		this.data.noFoodCalc = !defFoodCount;
	}
	
	// Группировка ресурсов
	this.data.resGroups = stockResList.getGroups({exclude:[ResList.groupType.special], joinFoodToGrown: true});
	
	// Топливо для ускорения по умолчанию
	this.data.fuell = wofh.town.traders.fuell;
	this.data.fuelw = wofh.town.traders.fuelw;
};

wSend_view.prototype.unknownTown = function() {
	this.close();
	
    hashMgr.showWnd('townInfo', this.data.targetId);
};


// Итератор количества ресурса
wSend_view.prototype.notifTownResHas = function(stockRes) {
	if( !this.data.sendInfo )
		return;
	
	var $sendRes = this.cont.find('.send-res-wrp .send-res[data-id="' + stockRes.id + '"]'),
		$sendResInput = $sendRes.find('.js-send-res-input');
		
	this.setResLimit($sendResInput, utils.toInt(stockRes.getHas()));
	
	var resLimit = this.getResLimit($sendResInput, {limit: utils.toInt(stockRes.getHas())});
	
	this.checkResView($sendRes, resLimit, stockRes);
	
	var resList = this.data.sendInfo.resList;

	if( !resList.getLength() ) return;

	if( utils.toInt(resList.getRes(stockRes.id).count) > resLimit ){
		this.changeResCount($sendResInput, {maxVal:resLimit});
	}
	else if( this.data.hasFixlimit && stockRes.isGrown() )
		this.calcFood($sendResInput);
	else if( (this.data.sendInfo.transportCons||{}).id == stockRes.id )
		this.calcSend();
};
// Изменение ресов на складе
wSend_view.prototype.notifTownRes = function() {
	if( !this.data.sendInfo )
		return;
	
	var self = this,
		stockResList = this.getStockResList(),
		stockRes,
		resLimit,
		$sendResInput,
		reCalc,
		resList = this.data.sendInfo.resList,
		resListLength = resList.getLength(),
		transportCons = this.data.sendInfo.transportCons||{};

	this.cont.find('.send-res-wrp .send-res').each(function(){
		stockRes = stockResList.getRes($(this).data('id'));
		
		$sendResInput = $(this).find('.js-send-res-input');
		
		self.setResLimit($sendResInput, stockRes.getCount());
		
		resLimit = self.getResLimit($sendResInput, {limit: stockRes.getCount()});
		
		self.checkResView(this, resLimit, stockRes);
		
		if( !resListLength ) return;
		
		if( utils.toInt(resList.getRes(stockRes.id).count) > resLimit ){
			self.changeResCount($sendResInput, {maxVal:resLimit, noRecalc:true});
			
			if( !reCalc )
				reCalc = true;
		}
		else if( !reCalc && transportCons.id == stockRes.id ){
			reCalc = true;
		}
	});
	
	self.changeResCount(false, {noRecalc:!reCalc});
};
// Изменение количества торговцев в городе
wSend_view.prototype.notifTownTraders = function() {
	if( !this.data.sendInfo )
		return;
	
	// Небольшая задержка, чтобы точно успеть обработать ответ команды reqMgr.sendRes
	this.setTimeout(function(){
		this.calcCurCapacity();
		
		this.checkCanSend();
	}, 250);
};



wSend_view.prototype.checkCanSend = function() {
	var town = this.cont.find('.js-send-towns-townSelect').val();
	town = this.data.towns[town];
	
	this.setCanSend(
					town && 
					town.avail && 
					this.data.curCapacity.res && 
					!(this.data.curCapacity.capacity < this.data.curCapacity.res) &&
					(!this.data.sendInfo.transportCons || !this.data.sendInfo.transportCons.transportAbort)
					);
};

wSend_view.prototype.setCanSend = function(state) {
	if( this.data.canSend != state ){
		this.data.canSend = state;
		this.cont.find('.js-send-button').toggleClass('-disabled', !state);
	}
};

wSend_view.prototype.setResTimeOut = function() {
	if( this.resChangeTimeOut ) 
		this.clearTimeout(this.resChangeTimeOut);
	
	this.resChangeTimeOut = this.setTimeout(function(){
		this.isResTimeOut = true;
		
		this.cont.find('.js-send-res-input.-active').closest('.js-send-res').trigger('focusout');
	}, 5000);
};



wSend_view.prototype.addPath = function(path, town){
	path.push([wofh.town.pos.x, wofh.town.pos.y, town.pos.x, town.pos.y]);
};

wSend_view.prototype.checkInputVal = function(_this, maxVal){
	var val = $(_this).val(),
		oldLen = val.length,
		el = $(_this).get(0),
		startCaretPos = el.selectionStart, 
		endCaretPos = el.selectionEnd;
	
	if( val[0] == '-' )
		val = '';
		
	val = utils.toInt(val.replace(/[^\d]/gi, ""));
	
	if( maxVal !== undefined && val > maxVal )
		val = maxVal;
	
	if( this.data.loadOptions.traders ){
		if( val < Math.min(10, lib.trade.capacity) )
			val *= lib.trade.capacity;
		else if( val%lib.trade.capacity ){
			val = Math.round(val / lib.trade.capacity) * lib.trade.capacity;
		}
		
		if( maxVal !== undefined && val > maxVal )
			val -= lib.trade.capacity;
	}
	
	val = '' + (val||'');
	
	$(_this).attr('value', val).val(val);

	if( startCaretPos || this.data.loadOptions.traders ){
		el.selectionStart = startCaretPos - (oldLen - val.length);
		el.selectionEnd = endCaretPos - (oldLen - val.length);
		
		if( this.data.loadOptions.traders ){
			// Величина смещения каретки соответствующая разряду загруженности торговца 
			var moveCarriageTradeCapacity = val.length - (('' + lib.trade.capacity).length - 1);
			el.selectionStart -= Math.max(el.selectionStart - moveCarriageTradeCapacity, 0);
			el.selectionEnd -= Math.max(el.selectionEnd - moveCarriageTradeCapacity, 0);
		}
	}
	else if( oldLen == val.length ){
		el.selectionStart = el.selectionEnd = 0;
	}
};

wSend_view.prototype.reset = function(opt){
	opt = opt||{};
	
	this.cont.find('.js-send-res-input').val('');
	
	this.data.fuell = wofh.town.traders.fuell;
	this.data.fuelw = wofh.town.traders.fuelw;
	
	this.changeResCount(false, {checkSpeedUp:true});
	
	this.toggleReset(false);
};

wSend_view.prototype.toggleReset = function(toggle){
	this.cont.find('.js-send-reset').toggleClass('-hidden', !toggle);
};

wSend_view.prototype.changeResCount = function(el, opt){
	opt = opt||{};
	
	if( !el )
		opt.noValidate = true;
	
	if( !opt.noValidate ){
		this.checkInputVal(el, opt.maxVal);
		
		if( $(el).hasClass('-active') )
			this.data.$curSlider.slider('value', $(el).val());
	}
	
	if( !opt.noRecalcFood )
		this.calcFood(el);
	
	if( !opt.noRecalc ){
		this.calcCurCapacity();
		
		this.calcSend({checkSpeedUp: opt.checkSpeedUp});
		
		// Проверяется вместимость торговцев (только при изменении количества реса пользователем). 
		// Если привышает, показываем предупреждалку около последнего измененного реса 
		if( opt.checkCapacity )
			this.checkCapacityAlert($(el));
		
		this.showDefResList();
	}
	
	if( $(el).hasClass('-active') )
		this.setResTimeOut();
};

wSend_view.prototype.checkCapacityAlert = function($el){
	if( $el ){
		if( this.data.curCapacity.capacity < this.data.curCapacity.res && this.data.capacityOverflowResId != $el.data('id') ){
			this.cont.find('.js-send-res-capacityAlert').remove();
			$el.parent().find('.send-res-icon').append(tmplMgr.send.capacityAlert());
			this.data.capacityOverflowResId = $el.data('id');
		}
	}
	else if( this.data.capacityOverflowResId && !(this.data.curCapacity.capacity < this.data.curCapacity.res) ){
		this.cont.find('.js-send-res-capacityAlert').remove();
		delete this.data.capacityOverflowResId;
	}
};

wSend_view.prototype.showDefResList = function(){
	if( !this.data.defResList )
		return;
	
	this.cont.find('.send-defResList-wrp').html(snip.resBigListCheckFill(this.data.defResList, this.getFormResList()));
};

wSend_view.prototype.calcCurCapacity = function(){
	var curCapacity = {};
	
	curCapacity.res = 0;
	this.$getFormStockableResList().each(function(){
		curCapacity.res += utils.toInt($(this).val());
	});
	
	curCapacity.traders = wofh.town.getFreeTraders();
	curCapacity.busyTraders = Trade.getTradersByRes(curCapacity.res);
	curCapacity.avTraders = Math.max(0, curCapacity.traders - curCapacity.busyTraders);
	
	// Текущие данные по торговцам
	this.cont.find('.js-send-traders').html(tmplMgr.send.tradersInfo({busy:curCapacity.busyTraders, available:curCapacity.traders, all:wofh.town.traders.count}));
	
	curCapacity.capacity = curCapacity.traders * lib.trade.capacity;
	curCapacity.avCapacity = Math.max(0, curCapacity.capacity - curCapacity.res);
	
	// Текущие данные по загруженности торговцам
	this.cont.find('.js-send-traders-capacity').html(tmplMgr.send.tradersInfo({busy:curCapacity.res, available:curCapacity.capacity, all:wofh.town.traders.count*lib.trade.capacity}));
	
	this.data.curCapacity = curCapacity;
	
	this.checkCapacityAlert();
};

wSend_view.prototype.calcMaxLoad  = function($res){
	var maxResCount = this.getResLimit($res), // Максимальная загрузка выбранным ресом
		resId = $res.data('id');
	
	if( maxResCount ){
		var maxResTradeCount,
			sendInfo = this.data.sendInfo,
			transportCons = sendInfo.transportCons;
			
		var resSum = 0,
			list = sendInfo.resList.getList();

		for(var res in list){
			if( res != resId ) resSum += list[res].getCount();
		}

		var	oldCurResCount = utils.toInt($res.val()), // Запоминаем текущее количество ресурса для которого будем расчитывать максимально возможное количество (если его нет, берем 0)
			allResCount = resSum + maxResCount, // Общее количество ресурсов для отправки
			curTradeCapacity = this.data.curCapacity.capacity - resSum; // Текущая максимально возможная загрузка торговцев
		
		if( transportCons ){
			// Формирмируем список ресурсов с учетом максимальной загруки выбранного ресурса
			sendInfo.resList.setCount(resId, maxResCount);
			// Расчитываем потребеление топлива с учетом максимальной загрузки выбранного ресурса 
			var curMaxTransportConsCount = Trade.calcTradeTimeByPaths(
				sendInfo.town.pathArr,
				sendInfo.town.dist,
				sendInfo.resList,
				this.data.fuell,
				this.data.fuelw).cons.getCount();
			
			var factor = curMaxTransportConsCount/allResCount;

			var fuelStockCount = utils.toInt(wofh.town.getRes(transportCons.getId()).getHas()); // Текущее количество ресурса ускорения на складе
			var fuelConsCount = Math.ceil(transportCons.getCount()); // Количество используемого топлива без максимальной загрузки
			
			if( resId == transportCons.getId() ){
				var restFuelCons = utils.toInt(fuelStockCount - (oldCurResCount + fuelConsCount));

				maxResTradeCount = (restFuelCons > 0)
										? oldCurResCount + ~~(restFuelCons/(1+factor))
										: utils.toInt(oldCurResCount + restFuelCons/(1+factor));
			}
			else{
				var fuelResCount = sendInfo.resList.getCount(transportCons.getId()),
					restFuelCons = utils.toInt(fuelStockCount - (fuelResCount + fuelConsCount)),
					additive = restFuelCons/factor;

				additive = (additive > 0) ? utils.toInt(additive) : Math.floor(additive);

				maxResTradeCount = oldCurResCount + additive;

				if( maxResTradeCount > maxResCount )
					maxResTradeCount = maxResCount;
			}
		}
		else
			maxResTradeCount = maxResCount;

		if( maxResTradeCount > curTradeCapacity )
			maxResTradeCount = curTradeCapacity;

		this.changeResCount($res.val(Math.max(0, maxResTradeCount)), {maxVal: maxResCount});
	}
};

wSend_view.prototype.calcSend = function(opt){
	opt = opt||{};
	
	var sendInfo = {};
	
	sendInfo.town = this.data.towns[this.cont.find('.js-send-towns-townSelect').val()];
	sendInfo.resList = this.getFormStockableResList();
	sendInfo.useAirWay = this.cont.find('input[name="useairway"]').prop('checked');
	
	if( sendInfo.town && sendInfo.town.avail ){
		sendInfo.hasAirWay = sendInfo.town.hasAirWay;
		
		if( sendInfo.useAirWay )
			sendInfo.useAirWay = sendInfo.hasAirWay;
		
		if( opt.checkSpeedUp ){
			sendInfo.speedUp = Trade.getTransportInfo(sendInfo.town.pathArr, sendInfo.town.dist, this.data.fuell, this.data.fuelw);
			
			if( sendInfo.speedUp.selectedFuel ){
				if( sendInfo.speedUp.selectedFuel.speedUpInfo.path.wayType == Trade.wayType.l ){
					this.data.fuell = sendInfo.speedUp.selectedFuel.getId();
					this.data.fuelw = 0;
				}
				else{
					this.data.fuelw = sendInfo.speedUp.selectedFuel.getId();
					this.data.fuell = 0;
				}
			}
			else
				this.data.fuell = this.data.fuelw = 0;
		}
		
		var minPath = Trade.calcTradeTimeByPaths(
			sendInfo.town.pathArr,
			sendInfo.town.dist,
			sendInfo.resList,
			this.data.fuell,
			this.data.fuelw,
			sendInfo.useAirWay
		);
		
		// Если присутствует потребление топлива - ускоряем
		if( minPath.cons ){
			var fuelResCount = utils.toInt(this.cont.find('.js-send-res-input[name="' + minPath.cons.getId() + '"]').val());
			minPath.cons.transportAbort = wofh.town.getRes(minPath.cons).getHas() - fuelResCount - minPath.cons.getCount() < 0;
			
			sendInfo.transportCons = minPath.cons;
		}
		
		sendInfo.selectedPath = {type: minPath.pathType, wayType: sendInfo.useAirWay ? Trade.wayType.a : (minPath.pathType != 0) ? Trade.wayType.w : Trade.wayType.l, time: minPath.time, path: minPath.path};
		sendInfo.paths = sendInfo.town.pathArr;
		sendInfo.dist = sendInfo.town.dist;
	}
	
	if( sendInfo.transportCons && sendInfo.transportCons.getCount() > 0 ){
		this.cont
				.find('.js-send-conditions-speedUpCons')
				.toggleClass('clr0', sendInfo.transportCons.transportAbort)
				.html(snip.resBigCount(sendInfo.transportCons.toFixed(1)));
	}
	else
		this.cont.find('.js-send-conditions-speedUpCons').html('');
	
	if( sendInfo.speedUp ){
		this.cont.find('.js-send-conditions-speedUp-wrp').toggleClass('-hidden', !(utils.sizeOf(sendInfo.speedUp.list) || sendInfo.useAirWay));
		
		this.cont.find('.send-conditions-speedUpAir-wrp').toggleClass('-invis', !sendInfo.hasAirWay);
		
		this.cont.find('.js-send-conditions-speedUp').toggleClass('-type-airWay', sendInfo.useAirWay);
		
		if( !opt.speedUpNotUpdate )
			this.cont.find('.js-send-conditions-speedUp').html(tmplMgr.send.speedUp(sendInfo));
		
		this.cont.find('.js-send-conditions-speedUpStockAlert').html( !sendInfo.speedUp.selectedFuel || sendInfo.speedUp.selectedFuel.speedUpInfo.stockCount ? '' : snip.alert('Нельзя использовать выбранный по-умолчанию ресурс для ускорения. Для этого его просто недостаточно в городе.'));
		
		var time = sendInfo.selectedPath ? snip.time(timeMgr.fPeriod(sendInfo.selectedPath.time) + (wofh.account.isPremium() ? ' в ' + snip.timer(sendInfo.selectedPath.time, 'inc', timeMgr.fMoment(timeMgr.getNow() + sendInfo.selectedPath.time)) : '')) : '';
		
		this.cont.find('.send-conditions-time').toggleClass('-hidden', !time).html(time);
	}
	
	this.data.sendInfo = sendInfo;
	
	this.checkCanSend();
};

wSend_view.prototype.calcFood = function($res, $resChanged, $resGrownList){
	if( this.data.noFoodCalc ) return;
	
	$res = $($res||this.cont.find('.js-send-res-input[data-id="'+Resource.ids.food+'"]'));
	
	var res = new Resource($res.data('id'), this.getResFixVal($res));
	
	if( !(res.isGrown() || res.isFood()) ) return;
	
	$resGrownList = ($resGrownList||this.cont.find('.js-send-res-input[data-type="'+Resource.types.grown+'"]'));
	
	var self = this,
		resGrownSum;
	
	if( res.isFood() ){
		resGrownSum = self.calcResGrownSum($resGrownList);
		
		if( $resChanged ){
			var resFoodLimit = self.getResLimit($res),
				foodRest = resFoodLimit - resGrownSum;
			
			this.setResGrownLimits($resGrownList, foodRest, $resChanged);
			
			if( foodRest < 0 )
				$res.val(resFoodLimit);
		}
		else{
			var resFoodLimit = self.getResLimit($res),
				resFoodCount = Math.min(res.getCount(), resFoodLimit),
				resFoodDelta = resFoodCount - resGrownSum,
				isFoodIncreased = resFoodDelta > 0,
				resFoodRest = resFoodLimit - resFoodCount,
				resRest,
				resCount,
				isFoodLoaded = false,
				foodpriority = utils.clone(wofh.town.stock.foodpriority);
			
			if( !resFoodDelta ){
				self.setResGrownLimits($resGrownList, resFoodRest);
				
				return;
			}
			
			if( !isFoodIncreased )
				foodpriority.reverse();
			
			for(var resId in foodpriority){
				resId = foodpriority[resId];
				
				$resGrownList.each(function(){
					if( resId != $(this).data('id') )
						return;
					
					if( isFoodIncreased ){
						resCount = self.getResFixVal($(this), true);
						
						if( resCount < 0 )
							return;
						
						resRest = self.getResFixLimit($(this)) - resCount;
						
						if( !resRest )
							return;
						
						if ( resRest >= resFoodDelta ){
							resCount += resFoodDelta;
							
							self.setResFixVal($(this), resCount);
							
							isFoodLoaded = true;
						}else{
							resCount += resRest;
							
							self.setResFixVal($(this), resCount);
							
							resFoodDelta -= resRest;
						}
					}
					else{
						resCount = self.getResFixVal($(this));
						
						if( !resCount )
							return;
						
						resFoodDelta += resCount;
						
						if ( resFoodDelta < 0 )
							self.setResFixVal($(this), '');
						else{
							self.setResFixVal($(this), resFoodDelta);
							
							isFoodLoaded = true;
						}
					}
					
					return false;
				});
				
				if( isFoodLoaded )
					break;
			}
			
			if( !isFoodLoaded ){
				resGrownSum = self.calcResGrownSum($resGrownList);
				
				$res.addClass('js-refreshSliderVal');
				
				self.changeResCount($res.val(resGrownSum), {maxVal:resFoodLimit, noRecalcFood:true, noRecalc:true});
				
				resFoodRest = resFoodLimit - resGrownSum;
			}
			
			self.setResGrownLimits($resGrownList, resFoodRest);
		}
	}
	else{
		resGrownSum = self.calcResGrownSum($resGrownList, [res.getId()]);
		
		resGrownSum += res.getCount();
		
		var $resFood = this.cont.find('.js-send-res-input[data-id="'+Resource.ids.food+'"]').val(resGrownSum);
		
		this.calcFood($resFood, $res);
	}
};

wSend_view.prototype.checkResView = function($sendRes, resLimit, stockRes, checkStockCount){
	$sendRes = $($sendRes);
	
	$sendRes.find('.js-maxLoad').text(utils.toInt(resLimit)).attr('data-upd', wSend.checkStockResUpd(stockRes));
	
	// Если checkStockCount установлен, stockRes обязан быть объектом StockRes
	if( checkStockCount )
		var hide = !utils.toInt(stockRes.getHas());
	else
		var hide = !utils.toInt(resLimit) || $sendRes.hasClass('js-hidden');
		
	$sendRes.toggleClass('-hidden', hide);
};

wSend_view.prototype.getStockResList = function(){
	var resList = wofh.town.stock.getHasList().getStockable();
	
	resList.addElem(wofh.town.getRes(Resource.ids.food).toResource());
	
	resList.toInt().removePrecision();
	
	return resList;
};

wSend_view.prototype.getFormResList = function(){
	var resData = utils.urlToObj(this.$getFormResList().serialize()),
		resList = new ResList();
	
	for(var resId in resData)
		resList.addCount(resId, resData[resId]);
	
	return resList;
};

wSend_view.prototype.getFormStockableResList = function(){
	var resData = utils.urlToObj(this.$getFormStockableResList().serialize()),
		resList = new ResList();
	
	for(var resId in resData)
		resList.addCount(resId, resData[resId]);
	
	return resList;
};

wSend_view.prototype.$getFormResList = function(cont){
	cont = cont||this.cont;
	
	return cont.find('.js-send-res-input');
};

wSend_view.prototype.$getFormStockableResList = function(cont){
	return this.$getFormResList().filter(function(){
		return $(this).data('id') != Resource.ids.food;
	});
};

wSend_view.prototype.getResLimit = function($res, opt){
	opt = opt||{};
	
	$res = $($res);
		
	opt.limit = opt.limit === undefined ? this.getResStockHas($res) : opt.limit;
	
	if( $res.data('limit') )
		opt.limit = Math.min($res.data('limit'), opt.limit);
		
	return utils.toInt(opt.limit);
};

wSend_view.prototype.setResLimit = function($res, resLimit){
	$res = $($res);
	
	if( $res.data('limitwas') ){
        resLimit = resLimit === undefined ? this.getResStockHas($res) : resLimit;
        
		if( this.data.hasFixlimit && $res.data('id') == Resource.ids.food ){
			resLimit = Math.max(0, resLimit - this.calcResGrownFixLimitSum());
			
			this.data.noFoodCalc = !resLimit;
		}
		
        var minimums = [$res.data('limitwas'), utils.toInt(resLimit)];
        
        if( $res.data('restlimit') )
            minimums.push($res.data('restlimit'));
        
		$res.data('limit', Math.min.apply(null, minimums));
	}
	else
		$res.data('limit', '');
};

wSend_view.prototype.getResStock = function($res, resId){
	return wofh.town.getRes(resId||$($res).data('id'));
};

wSend_view.prototype.getResStockHas = function($res, resId){
	return utils.toInt(this.getResStock($res, resId).getHas());
};


wSend_view.prototype.getResFixVal = function($res, noMaxZero){
	var val = $res.val() - ($res.data('fixlimit')||0);
	
	return noMaxZero ? val : Math.max(0, val);
};

wSend_view.prototype.setResFixVal = function($res, val){
	$res.val(val + ($res.data('fixlimit')||''));
};

wSend_view.prototype.getResFixLimit = function($res, opt){
	return Math.max(0, this.getResLimit($res, opt) - ($res.data('fixlimit')||''));
};

wSend_view.prototype.setResFixLimit = function($res, limit){
    limit = limit + ($res.data('fixlimit')||'');
    
	$res
        .data('limit', limit)
        .data('restlimit', limit);
};


wSend_view.prototype.setResGrownLimits = function($resGrownList, foodRest, $resChanged){
	var self = this;
	
	$resGrownList.each(function(){
		if( $resChanged && $resChanged.data('id') == $(this).data('id') )
			return;
		
		self.setResGrownLimit($(this), foodRest);
	});
};

wSend_view.prototype.setResGrownLimit = function($resGrown, foodRest){
	var resStock = this.getResStock($resGrown),
		resGrownVal = this.getResFixVal($resGrown, true),
		limit = Math.min(Math.max(0, resGrownVal)+Math.max(0, foodRest), utils.toInt(resStock.getHas()));

	this.setResFixLimit($resGrown, limit);

	if( resGrownVal >= 0 )
		this.setResFixVal($resGrown, Math.min(resGrownVal, limit)||'');

	this.checkResView($resGrown.closest('.js-send-res'), this.getResLimit($resGrown), resStock, true);
};

wSend_view.prototype.calcResGrownSum = function($resGrownList, exclude){
	var self = this,
		sum = 0;
	
	$resGrownList.each(function(){
		if( exclude && utils.inArray(exclude, $(this).data('id')) )
			return;
		
		sum += self.getResFixVal($(this));
	});
	
	return sum;
};

// Расчет фиксированной части ресурсов роста, которая не уходит в пищу
wSend_view.prototype.calcResGrownFixLimitSum = function(){
	var sum = 0,
		list = this.data.defResList.getList();
	
	for(var res in list){
		res = list[res];
		
		if( res.isGrown() && res.getCount() )
			sum += Math.min(res.getCount(), this.getResStockHas(false, res.getId()));
	}
	
	return sum;
};



