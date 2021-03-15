wWonders = function(){
	wWonders.superclass.constructor.apply(this, arguments);
};

utils.extend(wWonders, Wnd);

WndMgr.regWnd('wonders', wWonders);


wWonders.prepareData = function(id){
	var data = {},
		params = utils.urlToObj(id, true);;
	
	if( params.town )
		data.town = wofh.towns[params.town];
	
	data.town = data.town||wofh.town;
	
	return data;
};


wWonders.prototype.calcName = function(){
	return 'wonders';
};

wWonders.prototype.getData = function(){
	this.data.allWondersList = SlotList.getSortedWonders();
	
	this.data.allWondersList.each(function(wonder){
		var level = 0;
		
		if( wonder.hasRace(wofh.account.race) )
			level = Build.getResearchLevel(wonder.getId());
			
		wonder.setLevel(level);
	});
	
	var townWonder = this.data.town.getWonder();
	
	this.data.selectedId = townWonder.isEmpty() ? this.data.allWondersList.getFirst().getId() : townWonder.getId();
	
	this.data.rivalMode = ls.getWondersRivalMode(false);
	
	this.setFilterRival(this.data.rivalMode);
	
	this.data.wondersListMaxHeight = Math.max(utils.getWindowHeight(-235, 0), 100);
	
	this.data.filter = {unknown: false,	unavail: false};
	
	this.dataReceived();
};

wWonders.prototype.calcChildren = function(){
	this.children.list = bWonders_list;
};

wWonders.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('change', '.wonders-options-rivalToggle', function(){
			ls.setWondersRivalMode($(this).prop('checked'));

			self.toggleRivalMode(ls.getWondersRivalMode(false));
		})
		.on('change', '.wonders-options-filterUnavail', function(){
			self.data.filter.unavail = !$(this).prop('checked');
			
			self.filter();
		})
		.on('change', '.wonders-options-filterUnknown', function(){
			self.data.filter.unknown = !$(this).prop('checked');
			
			self.filter();
		})
		.on('change', '.wonders-filter-rival', function(){
			self.data.filterRival[$(this).closest('.wonders-filter-wonder').data('id')] = $(this).prop('checked');

			self.children.list.showList();
		})
		.on('mousemove', '.wonders-filter-rival-wrp', function(event){
			$(this)
					.closest('.wonders-filter-wonder')
					.find('.wonders-filter-wonderRival')
					.trigger('mousemove', [event]);
		})
		.on('mouseout', '.wonders-filter-rival-wrp', function(){
			$(this)
					.closest('.wonders-filter-wonder')
					.find('.wonders-filter-wonderRival')
					.trigger('mouseout');
		})
		.on('click', '.wonders-filter-wonderLink', function(event){
			var $wonder = $(this).closest('.wonders-filter-wonder');

			if( self.data.selectedId == $wonder.data('id') )
				return;

			event.preventDefault();
			event.stopPropagation();

			self.data.selectedId = $wonder.removeClass('-type-unselected').data('id');

			self.children.list.show();
		});
};

wWonders.prototype.filter = function(filter, type){
	var $filterListWrp = this.wrp.find('.wonders-filter-list-wrp');// .-type-'+type).toggleClass('-invis', filter);

	for(var filter in this.data.filter)
		$filterListWrp.toggleClass('-filter-'+filter, this.data.filter[filter]);

	this.children.list.showList();
};

wWonders.prototype.toggleRivalMode = function(rivalMode){
	this.wrp.find('.wonders-filter-list-wrp').toggleClass('-mode-rival', rivalMode);

	this.setFilterRival(rivalMode);

	this.data.rivalMode = rivalMode;

	this.children.list.show();
};

wWonders.prototype.setFilterRival = function(rivalMode){
	this.data.filterRival = rivalMode ? {} : false;
};



bWonders_list = function(){
	this.name = 'list';

	bWonders_list.superclass.constructor.apply(this, arguments);

	this.options.hasReqData = true;
};

utils.extend(bWonders_list, Block);


bWonders_list.prototype.getData = function(){
	this.data = this.parent.data;

	this.data.launchSpaceshipsList = [];

	this.loaderId = contentLoader.start( 
		this.parent.wrp.find('.wnd-cont-wrp'), 
		100, 
		this.getWondersList.bind(this)
	);
};

bWonders_list.prototype.dataReceived = function(){
	contentLoader.stop(this.loaderId);

	bWonders_list.superclass.dataReceived.apply(this, arguments);
};
// Чистим враппер только если показываем блок в первый раз
bWonders_list.prototype.clearWrp = function(firstDraw){
	if( !firstDraw )
		return;

	bWonders_list.superclass.clearWrp.apply(this, arguments);
};
// Устанавливаем контент только если показываем блок в первый раз 
bWonders_list.prototype.setCont = function(firstDraw){
	if( !firstDraw && this.cont )
		return;

	bWonders_list.superclass.setCont.apply(this, arguments);
};

bWonders_list.prototype.afterDraw = function(firstDraw){
	if( firstDraw ){
		this.tableLaunchSpaceShips = new tblWondersLaunchSpaceShips(this, this.wrp.find('.space-tbl-wrp'));

		this.table = new tblWonders(this, this.wrp.find('.wonders-tbl-wrp'));
	}

	if( this.data.rivalMode )
		this.prepareRivalMode(this.data.list);

	this.showFilter();

	this.table.data.list = this.data.list;

	this.table.data.filterRival = this.data.filterRival;

	this.showList();

	this.showLaunchSpaceshipsList(this.data.launchSpaceshipsList);
};


bWonders_list.prototype.getWondersList = function(){
	this.getReqData(function(){
		var self = this;

		reqMgr.getWondersList(this.data.selectedId, self.data.rivalMode, self.data.town, function(list, reqId){
			self.tryProcessResp(
				list, reqId, 
				function(){
					this.data.list = list;

					if( this.data.selectedId == Slot.ids.cosmodrome && !this.data.rivalMode ){
						this.getSpaceshipsList();

						return;
					}

					this.dataReceived();
				}
			);
		});
	});
};

bWonders_list.prototype.getSpaceshipsList = function(){
	this.getReqData(function(){
		var self = this;

		reqMgr.getWondersList(Slot.ids.spaceship, this.data.rivalMode, this.data.town, function(spaceshipsList, reqId){
			self.tryProcessResp(
				spaceshipsList, reqId, 
				function(){
					for(var ship in spaceshipsList){
						ship = spaceshipsList[ship];

						ship.name = (new Slot(this.data.selectedId)).getName() + ' с КК';

						ship.getName = function(){return this.name;};
					}

					this.data.list = this.data.list.concat(spaceshipsList);

					this.getSpaceshipsState();
				}
			);
		});
	});
};

bWonders_list.prototype.getSpaceshipsState = function(){
	this.getReqData(function(){
		var self = this;

		// Запрашиваем информацию о запущеных космических короблях, если выбран космодром
		reqMgr.getSpaceshipsState(function(resp, reqId){
			self.tryProcessResp(
				resp, reqId, 
				function(){
					this.data.launchSpaceshipsList = (resp||{}).list||[];

					this.dataReceived();
				}
			);
		});
	});
};

bWonders_list.prototype.prepareRivalMode = function(rivalList){
	for(var rivalWonder in rivalList){
		rivalWonder = rivalList[rivalWonder];

		this.data.filterRival[rivalWonder.getId()] = true;
	}

	if( this.data.filterRival[this.data.selectedId] ){
		for(var rivalWonder in this.data.filterRival){
			this.data.filterRival[rivalWonder] = false;
		}

		this.data.filterRival[this.data.selectedId] = true;
	}
};

bWonders_list.prototype.showFilter = function(){
	this.parent.wrp.find('.wonders-filter-list-wrp').html(tmplMgr.wonders.filter.list(this.data));
};	

bWonders_list.prototype.showLaunchSpaceshipsList = function(list){
	var oldList = this.tableLaunchSpaceShips.data.list;

	list = list||[];

	this.tableLaunchSpaceShips.data.list = list;

	this.tableLaunchSpaceShips.show();

	// Корректируем максимальную высоту таблицы с ЧС, если меняется высота таблицы с запущенными КК
	if( oldList.length != list.length )
		this.setMaxHeightToWondersList();
};

bWonders_list.prototype.setMaxHeightToWondersList = function(){
	var tableLSSHeight = this.tableLaunchSpaceShips.cont.find('.tbl').height();
	
	if( tableLSSHeight > 0 )
		tableLSSHeight += 10; // Учитываем margin-bottom у space-tbl
	
	this.table.cont.find('.tbl-tbody').css('max-height', this.data.wondersListMaxHeight - tableLSSHeight);
	
	this.table.doScroll('update');
};

bWonders_list.prototype.showList = function(){
	this.table.filterList();

	this.table.show();
};



tblWondersLaunchSpaceShips = function(parent, cont) {
    this.tmpl = tmplMgr.wonders.launchSpaceShips.table;
    
    this.data = {};
    this.data.list = [];
        
	tblWondersLaunchSpaceShips.superclass.constructor.apply(this, arguments);
    
    this.bind();
};

utils.extend(tblWondersLaunchSpaceShips, Table);

tblWondersLaunchSpaceShips.prototype.getSortVal = function(ship, field) {
    if (field == 'country') return ship.country.name;
    if (field == 'time') return ship.time;
    if (field == 'status') {
        if (ship.status == 2) return 2;
        else return +!ship.status;
    }
	
	return ship.time;
};

tblWondersLaunchSpaceShips.prototype.afterDraw = function() {
	var hideTable = !this.data.list.length;
	
	if( this.hideTable != hideTable ){
		this.cont.find('.tbl').toggleClass('-hidden', hideTable);
		
		this.hideTable = hideTable;
	}
};



tblWonders = function(parent, cont) {
    this.tmpl = tmplMgr.wonders.table;
    this.data = {};
	this.data.filter = parent.data.filter;
	this.data.wondersListMaxHeight = parent.data.wondersListMaxHeight;
    this.data.list = [];
    
	tblWonders.superclass.constructor.apply(this, arguments);
    
	this.options.useBlocks = true;
	
    this.options.useScroll = true;
    
    this.bind();
};

utils.extend(tblWonders, Table);

tblWonders.prototype.getSortVal = function(wonder, field) {
	if( field == 'town' ) return wonder.town.getName().toLowerCase();
	if( field == 'account' ) return wonder.town.account.getName().toLowerCase();
    if( field == 'country' ) return wonder.town.account.country ? wonder.town.account.country.getName().toLowerCase() : '';
	if( field == 'distance' ) return wonder.distance;
    if( field == 'status' ) return wonder.isActive();
    if( field == 'wonder' ) return wonder.getName().toLowerCase();
	if( field == 'level' ) return wonder.getLevel();
	
    return wonder.id; // Сортировка по умолчанию - если нет вообще сортировки или если значения совпадают
};

tblWonders.prototype.filterList = function() {
	var filter = this.data.filter,
		filterRival = this.data.filterRival;
	
	this.data.allFiltered = true;
	
	for(var wonder in this.data.list){
		wonder = this.data.list[wonder];
		
		wonder.show = true;
		
		if( 
			filter.unknown && !Build.getResearchLevel(wonder.getId()) || 
			filter.unavail && !wonder.canBuildOnTerrain(this.parent.data.town) || 
			filterRival && !filterRival[wonder.getId()]
		){
			wonder.show = false;
			
			continue;
		}
		
		this.data.allFiltered = false;
	}
};

tblWonders.prototype.afterDraw = function() {
	var hideTable = !this.data.list.length;

	// Если всё отфильтровано шапку таблицы не показываем
	if( !hideTable && this.data.allFiltered )
		hideTable = true;

	if( this.hideTable != hideTable ){
		this.cont.find('.tbl').toggleClass('-hidden', hideTable);

		this.hideTable = hideTable;
	}
};