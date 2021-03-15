wMapFilter = function(){
	wMapFilter.superclass.constructor.apply(this, arguments);
};

utils.extend(wMapFilter, Wnd);


wMapFilter.filter = {
	town: {
		barb: 5,
		build: 6
	},
	hill: {
		show: 0,
		spec: 1
	},
	mount: {
		show: 0,
		spec: 1
	},
	wonder: {
		inactive: 0,
		active: 1,
		concurent: 2
	},
	deposit: {
		show: 0,
		spec: 1,
		build: 2
	},
	mapImp: {
		show: 0,
		spec: 1,
		build: 2
	},
	road: {
		build: 6,
		spec: 7
	}
};

wMapFilter.filterRival = {};

// Конкурирующие фильтры (если включен один, другой выключается)
wMapFilter.filterRival[LS.mapFilter2.hill] = {};
wMapFilter.filterRival[LS.mapFilter2.hill][wMapFilter.filter.hill.show] = wMapFilter.filter.hill.spec;
wMapFilter.filterRival[LS.mapFilter2.hill][wMapFilter.filter.hill.spec] = wMapFilter.filter.hill.show;
wMapFilter.filterRival[LS.mapFilter2.mount] = {};
wMapFilter.filterRival[LS.mapFilter2.mount][wMapFilter.filter.mount.show] = wMapFilter.filter.mount.spec;
wMapFilter.filterRival[LS.mapFilter2.mount][wMapFilter.filter.mount.spec] = wMapFilter.filter.mount.show;
wMapFilter.filterRival[LS.mapFilter2.mapimp] = {};
wMapFilter.filterRival[LS.mapFilter2.mapimp][wMapFilter.filter.mapImp.show] = wMapFilter.filter.mapImp.spec;
wMapFilter.filterRival[LS.mapFilter2.mapimp][wMapFilter.filter.mapImp.spec] = wMapFilter.filter.mapImp.show;
wMapFilter.filterRival[LS.mapFilter2.deposit] = {};
wMapFilter.filterRival[LS.mapFilter2.deposit][wMapFilter.filter.deposit.show] = wMapFilter.filter.deposit.spec;
wMapFilter.filterRival[LS.mapFilter2.deposit][wMapFilter.filter.deposit.spec] = wMapFilter.filter.deposit.show;


wMapFilter.prototype.calcName = function(){
	return 'mapFilterWnd';
};

wMapFilter.prototype.initWndOptions = function(){
	wMapFilter.superclass.initWndOptions.apply(this, arguments);
	
	this.options.setHash = false;
};

wMapFilter.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.mapFilter-button', function(){
			var $el = $(this),
				id = $el.data('id'),
				val = $el.data('val'),
				setVal = self.data.settings[id];

			if( utils.inMask(val, +setVal) ){
				var rival = (wMapFilter.filterRival[id]||{})[val];

				if( rival !== undefined )
					setVal = utils.onMask(rival, +setVal);

				self.cont.find('.mapFilter-button[data-id="'+id+'"][data-val="'+rival+'"]').removeClass('-active');
			}

			$el.toggleClass('-active');

			self.data.settings[id] = utils.toggleMask(val, +setVal);

			wndMgr.getMapInf().setSettings();

			notifMgr.runEvent(Notif.ids.mapSettings);
		})
		.on('click', '.mapFilter-reset', function(){
			wndMgr.getMapInf().setDefFilter2();
			wndMgr.getMapInf().setSettings();

			notifMgr.runEvent(Notif.ids.mapSettings);

			tooltipMgr.hide();

			self.show();
		})
		.on('change', '.mapFilter-select', function(){
			var $el = $(this);

			self.data.settings[$el.data('id')] = +$el.val();

			wndMgr.getMapInf().setSettings();

			notifMgr.runEvent(Notif.ids.mapSettings);
		});
};

wMapFilter.prototype.getData = function(){
	this.data.settings = wndMgr.getMapInf().settings.p_filter2;

	wMapFilter.superclass.getData.apply(this, arguments);
};

wMapFilter.prototype.afterDraw = function(){
	var self = this;

	this.wrp.find('.mapFilter-button').each(function(){
		var $el = $(this),
			setVal = self.data.settings[$el.data('id')];

		$el.toggleClass('-active', !utils.inMask($el.data('val'), +setVal));
	});
	this.wrp.find('.mapFilter-select').each(function(){
		var $el = $(this),
			setVal = self.data.settings[$el.data('id')];

		$el.val(setVal);
	});
};
