bTrain = function(parent){
	bTrain.superclass.constructor.apply(this, arguments);
};

utils.extend(bTrain, Block);


bTrain.prototype.calcName = function(){
	return 'train';
};

bTrain.prototype.calcTmplFolder = function(){
	return tmplMgr.train;
};

bTrain.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townTrain, Notif.ids.accTownBonus, Notif.ids.townWonderActivity];
};

bTrain.prototype.calcChildren = function(){
    this.children.work = bTrain_work;
    this.children.select = bTrain_select;
};

bTrain.prototype.getData = function(){
	this.data.slot = this.parent.data.slot;
	this.data.town = this.data.slot.town;
	
	this.data.queue = wofh.events.getTrainQueue(this.data.slot);
	
	this.data.slotBusy = this.parent.data.event||this.data.slot.haveActions();
	this.data.maxLen = this.data.queue.length == lib.build.maxtrainqueue;
	this.data.slotDisabled = !this.data.slot.isActive();
	this.data.enabled = !this.data.slotBusy && !this.data.maxLen && !this.data.slotDisabled;
	
	if( this.data.queue.length ) {
		var event = this.data.queue[0];
		
		event.data.ready = event.getTrainedUnitCount();
	}
    
	this.dataReceived();
};


// Текущие тренировки
bTrain_work = function(parent){
	bTrain_work.superclass.constructor.apply(this, arguments);
};

utils.extend(bTrain_work, Block);


bTrain_work.prototype.calcName = function(){
	return 'work';
};

bTrain_work.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.event];
};

bTrain_work.prototype.getData = function(){
	this.data = this.parent.data;

	this.dataReceived();
};

bTrain_work.prototype.bindEvent = function(){
	var self = this;

	//удаление тренировки
	this.wrp
		.on('click', '.js-train-queue-delBtn', function(){
		var pos = $(this).parents('.js-train-queue-item').data('pos'),
			event = self.data.queue[pos];

		wndMgr.addConfirm(self.tmpl.removeAlert({unit: event.getUnit()}), {
			callbacks: {
				bindEvent: function(){
					var wnd = this;

					wnd.wrp
						.on('click', '.js-allow-ok', function(){
							$(this).remove();

							wnd.allowAccept();
						});
				},
				afterDraw: function(){
					this.forbidAccept();
				},
				onAccept: function(){
					reqMgr.trainDel(event, pos);
				}
			}
		});
	})
		//забрать готовые
		.on('click', '.train-takeaway', function(){
		wndMgr.addConfirm(self.tmpl.takeawayAlert({})).onAccept = function(){reqMgr.trainTakeAway(self.data.town);};
	});
};

bTrain_work.prototype.runReadyTimer = function(){
	var event = this.data.queue[0];
	
	if( !event ) return;
	
	this.wrp.find('.train-queue-ready').html(tmplMgr.train.work.ready({train: event}));
	
	var moment = event.getNextUnitReady();
	
	this.clearTimeout(this.readyTO);
	
	this.readyTO = this.setTimeout(this.runReadyTimer, (moment - timeMgr.getNow() + 0.2) * 1000);
};

bTrain_work.prototype.afterDraw = function(){
	this.runReadyTimer();
};


// Выбор юнитов для тренировки
bTrain_select = function(parent){
	bTrain_select.superclass.constructor.apply(this, arguments);
};

utils.extend(bTrain_select, Block);


bTrain_select.prototype.calcName = function(){
	return 'select';
};

bTrain_select.prototype.calcChildren = function(){
	if( this.data.build.getLength() )
		this.children.build = tabTrain_select_build;
	if( this.data.rebuild.getLength() )
		this.children.rebuild = tabTrain_select_rebuild;
};
    
    bTrain_select.prototype.restoreStaticData = function(childWas){
        this.staticData.tabName = childWas.staticData.tabName;
        
        this.staticData.unit = childWas.data.unit;
        
        this.staticData.unitCount = childWas.data.unitCount;
    };

bTrain_select.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townTrainUnitsHide];

	this.notif.other[Notif.ids.townPopHas] = 
	this.notif.other[Notif.ids.townResHas] = this.notifRefreshMaxs;
};

bTrain_select.prototype.getData = function(){
	this.data = this.parent.data;
    
	//юниты для тренировки
	this.data.build = this.getTrainUnits();
    
	//юниты для перестройки
	this.data.rebuild = new Army();
    
    if( this.staticData.unit )
        this.data.unit = this.staticData.unit;
    
    this.data.unitCount = this.staticData.unitCount||0;
    
	this.calcMaxs();

	this.dataReceived();
};

bTrain_select.prototype.bindEvent = function(){
	var self = this;

	if( this.data.queue.length == lib.build.maxtrainqueue ){
		this.wrp.on('submit', '.train-select', function(){
			return false;
		});

		return;
	}

	//выбор юнита
	this.wrp
		.on('click', '.train-select-row', function(){
			if( !$(this).hasClass('-disabled') && self.data.enabled )
				self.selectUnit($(this));
		})
		//ввод количества
		.on('input', '.js-train-select-count', function(){
			utils.checkInputInt(this, {min: 0});

			self.calc($(this).val());
		})
		//выбор максимума
		.on('click', '.train-select-allBtn', function(){
			if (!self.data.enabled) {
				return;
			}

			//запоминаем текущего юнита
			var row = $(this).parents('.train-select-row');

			self.data.unit = self.getUnits().getElem(row.data('pos'));

			self.setCount(self.data.unit.getCount());
		})
		//новая тренировка
		.on('submit', '.train-select', function(e){
            e.preventDefault();
            
			self.trySubmit();
		})
		.on('click', '.train-select-hide', function(e){
			e.stopPropagation();
			
			servBuffer.getTemp().hiddenUnits[$(this).closest('.train-select-row').data('pos')] = 1;

			LS.saveServStorage({delay: 10000});

			notifMgr.runEvent(Notif.ids.townTrainUnitsHide);
		});
};

bTrain_select.prototype.beforeShowChildren = function() {
	this.tabs = new Tabs(this.cont, undefined, {linkClass: 'js-tabLink_2'});
    
	this.tabs.onOpenTab = function(tab){
		if( tab )
			this.setMode(this.staticData.tabName = tab.name);
	}.bind(this);
    
	this.tabs.addTabs(this.children);
};

bTrain_select.prototype.afterDraw = function(){
	var self = this;

	// Инициализируем слайдер
	if( this.data.queue.length != lib.build.maxtrainqueue ){
		snip.sliderHandler(this.wrp.find('.train-select-slider'), {
			min: 0,
			max: 0,
            value: this.data.unitCount,
			slide: function(event, ui){
				self.calc(ui.value);
			}
		});	
	}

	this.tabs.openTab(this.tabs.getTab(this.staticData.tabName)||'build');

	snip.spinboxHandler(this.wrp);
};

// Список юнитов для тренировки
bTrain_select.prototype.getTrainUnits = function(){
	//доступные юниты
	var avail = this.data.slot.getTrainUnits(true, true, true);
	var all = this.data.slot.getTrainUnits(false, true, true);
	var next = new Army();

	all.each(function(unit){
		if( !avail.hasElem(unit) ){
			unit.unknown = true;
            
			next.addElem(unit);
		}
	});

	avail.setSorted(true);
	next.setSorted(true);
	avail.list = avail.list.concat(next.list);
    
	avail.filter(function(unit, list){
		var isHidden = servBuffer.getTemp().hiddenUnits[unit.getId()];

		if( !list.hasHiddenUnits && isHidden )
			list.hasHiddenUnits = true;

		return !isHidden;
	});

	return avail;
};

bTrain_select.prototype.calcMaxs = function(){
	this.data.build.each(function(unit){
		unit.setCount(this.data.town.calcMaxUnitCanTrain(unit));
	}, this);

	this.data.rebuild = new Army();
    
	this.data.town.army.own.each(function(unit){
		if (this.data.build.hasElem(unit.getNextId()) && !this.data.build.getElem(unit.getNextId()).unknown) {
			var count = this.data.town.calcMaxUnitCanRetrain(unit);
            
			this.data.rebuild.setCount(unit, count);
		}
	}, this);
};

bTrain_select.prototype.notifRefreshMaxs = function(){
	this.clearTimeout(this.notifTimeout);

	this.notifTimeout = this.setTimeout(this.refreshMaxs, Notif.sDelay);
};

bTrain_select.prototype.refreshMaxs = function(){
	var self = this;

	this.data.town = wofh.towns[self.data.town.id];

	this.calcMaxs();

	//обучение
	this.wrp.find('.train-select-list.-type-build .train-select-row').each(function(){
		$(this).find('.train-select-max-val').html(self.data.build.getElem($(this).data('pos')).getCount());
	});

	//переобучение
	this.wrp.find('.train-select-list.-type-rebuild .train-select-row').each(function(){
		$(this).find('.train-select-max-val').html(self.data.rebuild.getElem($(this).data('pos')).getCount());
	});

	//сокрытие вкладки переобучения
	if( self.data.rebuild.isEmpty() )
		this.wrp.find('.tabs-wrp').addClass('-hidden');

	//поле ввода
	if( this.data.unit && this.data.unitCount > this.data.unit.count )
        this.setCount(this.data.unit.count);
};

bTrain_select.prototype.setMode = function(mode){
	this.data.mode = mode;
	
	var $el = false;
	
	if( this.data.enabled ){
		// Выделение первого юнита для тренировки по умолчанию
		if( this.getUnits().getLength() == 1 && !this.getUnits().getFirst().unknown )
			$el = this.children[mode].wrp.find('.train-select-list:not(.-hidden) .train-select-row').first();
		else if( this.data.unit ){
			var unit = this.getUnits().getElem(this.data.unit.getId(), false);
			
			if( unit )
				$el = this.children[mode].wrp.find('.train-select-list:not(.-hidden) .train-select-row[data-pos="'+unit.getId()+'"]');
			
			if( !$el.length )
				$el = false;
		}
	}
	
	this.selectUnit($el);
};

bTrain_select.prototype.getUnits = function(){
	return this.data[this.data.mode];
};

bTrain_select.prototype.selectUnit = function(el) {
	this.wrp.find('.train-select-row').removeClass('-active');

	if( el ){
		if( !this.trainAdd )
			this.wrp.find('.train_select_submit').removeClass('-disabled');

		utils.toggleAttr(el.find('input[type="radio"]'), 'checked', 'checked');
		//запоминаем текущего юнита
		this.data.unit = this.getUnits().getElem(el.data('pos'));
		//выделение строки
		el.addClass('-active');
		//вычисления
		this.calc();
	} 
	else{
		utils.toggleAttr(this.wrp.find('input[type="radio"]'), 'checked', false);

		delete this.data.unit;
		//вычисления
		this.calc(0);
	}
};
//Расчет ресурсов и времени тренировки
bTrain_select.prototype.calc = function(count){
	if( count === undefined )
		count = this.getCount();

	count = utils.toInt(count);
    
    var max_count = 0;
    
	if( this.data.unit ){
		max_count = this.data.unit.getCount();

		if( max_count < count )
			count = max_count;
		
		this.wrp.find('.train-select-slider').slider({
			max: max_count, 
			value: count
		});
	}
    else
        count = 0;
	
    this.wrp.find('.train-select-slider').slider({
        max: max_count, 
        value: count
    });

	this.setCount(count);

	//вывод шаблона
	this.wrp.find('.train-select-info').html(
		this.data.unit ?
		this.tmpl.info({ 
			mode: this.data.mode,
			time: this.getTrainTime(count),
			start: this.data.queue.length ? this.data.queue[this.data.queue.length-1].time : timeMgr.getNow(),
			unit: this.data.unit, 
			count: count,
			first: this.data.queue.length ? false : true
		}) : ''
	);
};

bTrain_select.prototype.getCountEl = function() {
	return this.wrp.find('.js-train-select-count');
};

bTrain_select.prototype.setCount = function(count) {
    this.data.unitCount = count;
    
	this.getCountEl().val(count);
};

bTrain_select.prototype.getCount = function() {
	return this.getCountEl().val();
};

bTrain_select.prototype.getTrainTime = function(count){	
	if (this.data.mode == 'build') {
		return this.data.slot.calcTrainTime(this.data.unit, count);
	} else {
		return this.data.slot.calcRetrainTime(this.data.unit, count);
	}
};

bTrain_select.prototype.trySubmit = function(){
	var self = this;

	if( !this.data.unit )
        return;

	if( this.data.queue.length == lib.build.maxtrainqueue )
        return;

	if( this.trainAdd )
        return;

	var unit = this.data.unit.clone(),
		count = this.getCount();

	unit.setCount(count);

	var trainTime = this.getTrainTime(count);

	if( trainTime > 259200 ){
		wndMgr.addConfirm(this.tmpl.sbmAlert({
			unit: unit,
			text: self.tmpl.info({
				mode: self.data.mode,
				unit: unit,
				count: count,
				start: self.data.queue.length ? self.data.queue[self.data.queue.length-1].time: timeMgr.getNow(),
				time: trainTime})
		})).onAccept = this.submit.bind(this);
	} 
	else if( trainTime > 0 )
		this.submit();
};

bTrain_select.prototype.submit = function() {
	var self = this; 

	this.trainAdd = true;

	var loaderId = contentLoader.start( 
		this.wrp.find('.train_select_submit').addClass('-disabled'), 
		0, 
		function(){
			if (this.data.mode == 'build')
				reqMgr.trainAdd(this.data.slot.town.id, this.data.slot.pos, this.data.unit, this.getCount(), undefined, function(){
					contentLoader.stop(loaderId, true);
				});
			else
				reqMgr.trainAdd(this.data.slot.town.id, this.data.slot.pos, this.data.unit.getNext(), this.getCount(), this.data.unit, function(){
					contentLoader.stop(loaderId, true);
				});

			this.setCount(0);
		}.bind(this),
		{icon: ContentLoader.icon.short, cssPosition: {left: -120, top: 1}, callback: function(){
			delete self.trainAdd;
            
			self.wrp.find('.train_select_submit').removeClass('-disabled');
		}} 
	);
};



tabTrain_select_build = function(parent){
	this.name = 'build';
	this.tabTitle = 'Обучение';

	tabTrain_select_build.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTrain_select_build, Tab);


tabTrain_select_build.prototype.getData = function(){
	this.data = this.parent.data;
    
	this.dataReceived();
};



tabTrain_select_rebuild = function(parent){
	this.name = 'rebuild';
	this.tabTitle = 'Переобучение';

	tabTrain_select_rebuild.superclass.constructor.apply(this, arguments);
};

utils.extend(tabTrain_select_rebuild, Tab);


tabTrain_select_rebuild.prototype.getData = function(){
	this.data = this.parent.data;

	this.dataReceived();
};