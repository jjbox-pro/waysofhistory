wHelp = function(id, data){
	wHelp.superclass.constructor.apply(this, [data.id, data]);

	this.id = '';
};

utils.extend(wHelp, Wnd);

WndMgr.regWnd('help', wHelp);


wHelp.pages = {
	faq: {name: 'Частые вопросы'},
	divider0: {},
	science: {name: 'Науки и изобретения', filter:'SciFilter'},
	learn: {name: 'Научные исследования'},
	divider1: {},
	build: {name: 'Строения', filter:'BuildFilter'},
	wonder: {name: 'Чудеса Света'},
	divider2: {},
	town: {name: 'Застройка и основание городов'},
	specialists: {name: 'Великие Граждане'},
	divider3: {},
	unit: {name: 'Войска', filter:'UnitFilter'},
	battle: {name: 'Бой'},
	spy: {name: 'Разведывательные операции'},
	move: {name: 'Дороги и тоннели. Пути и маршруты'},
	divider4: {},
	deposit: {name: 'Месторождения', filter:'DepFilter'},
	getDeposit: {name: 'Колонизация месторождений'},
	res: {name: 'Ресурсы'},
	trade: {name: 'Торговля'},
	divider5: {},
	race: {name: 'Расы'},
	map: {name: 'Карта'},
	env: {name: 'Улучшения местности', data: {}},
	country: {name: 'Страны'},
	barbarian: {name: 'Варвары'},
	divider6: {},
	win: {name: 'Победа и Космический корабль'},
	divider7: {},
	changelog: {name: 'Список изменений'},
	rules: {name: 'Правила игры'},
	legal: {
		name: 'Соглашение', 
		preparePage: function(){
			this.agreement = lib.main.agreement[wofh.platform.id];

			if( !this.agreement )
				return false;

			return true;
		}
	}
};

wHelp.searchPages = {
	faq: {cls: '.help-faq-qa'},
	learn: {},
	wonder: {},
	town: {},
	specialists: {},
	battle: {},
	spy: {},
	move: {},
	getDeposit: {},
	res: {},
	trade: {},
	race: {},
	map: {},
	env: {},
	country: {},
	barbarian: {},
	win: {},
	changelog: {cls: 'li', prepareHtml: function($el, html){
		return '<div>' + $el.closest('ul').prev().html() + '</div>' + html;
	}}
};

wHelp.buildKnown = {
	unknown: 0,
	all: 1,
	known: 2,
	familar: 3
};

wHelp.search = {};

wHelp.prepareData = function(id){
	var data = {};

	if( typeof(id) === 'string' ){
		var params = id.split('&');

		id = params.shift(); // Имя страницы

		if( params )
			$.extend(data, utils.urlToObj(params.join('&')));
	}

	var page = wHelp.pages[id];

	if( !(page && wHelp.preparePage(page)) )
		id = 'faq';
	else
		ls.setHelpSection(id);

	id = ls.getHelpSection(id);

	var wndHelp = wndMgr.getFirstWndByType(wHelp);

	if( wndHelp ){
		if( !wndHelp.isActive() )
			wndHelp.activate();

		wndHelp.showPage(id);

		return false;
	}

	data.id = id;

	return data;
};

wHelp.preparePage = function(page){
	if( page.preparePage )
		return page.preparePage();

	return !!page.name;
};


wHelp.prototype.calcName = function(){
	return 'help';
};

wHelp.prototype.bindEvent = function() {
	var self = this;

	this.wrp.on('input', 'input[name="search"]', function(){
		var searchText = $(this).val();

		if( searchText  > 20 ){
			$(this).val(searchText.slice(0, 20));

			return;
		}

		self.children.body.searchText(searchText);
	});

	if( wofh.account.isAdmin() )
		this.bindAdmin();
};

wHelp.prototype.calcChildren = function() {
	this.children.body = bHelp_body;
};

wHelp.prototype.afterDraw = function() {
	this.showMenu();
};


wHelp.prototype.setPageId = function(id) {
	this.wrp.find('.help-menuWrp').html(tmplMgr.help.menu({current: this.data.id}));
};

wHelp.prototype.showMenu = function() {
	this.wrp.find('.help-menuWrp').html(tmplMgr.help.menu({current: this.data.id}));
};

wHelp.prototype.showPage = function(id){
	if( this.data.id == id )
		return;

	this.data.id = id;

	this.showMenu();

	this.children.body.show();
};



bHelp_body = function(parent){
	bHelp_body.superclass.constructor.apply(this, arguments);
};

utils.extend(bHelp_body, Block);


bHelp_body.prototype.calcName = function(){
	return 'body';
};

bHelp_body.prototype.getData = function(){
	this.data.id = this.parent.data.id;

	this.data.page = utils.clone(wHelp.pages[this.data.id]);

	if( this.data.page.filter )
		this['gen'+this.data.page.filter](this.data.page);

	this.dataReceived();
};

bHelp_body.prototype.bindEvent = function(){
	var self = this;

	this.wrp
			.on('mouseenter', '.js-pedia-imp-level', function(){
				var mapImp = new MapImp($(this).data('imp'), $(this).data('level'));

				self.updateMapImpImg(mapImp);
			})
			.on('mouseleave', '.js-pedia-imp-level', function(){
				var mapImp = new MapImp($(this).data('imp'), 1);

				mapImp = mapImp.getMaxKnown() || mapImp;

				self.updateMapImpImg(mapImp, true);
			})
			.on('mousemove', '.help-filter.-off', function(event){
				$(this).find('.help-filterIcon').trigger('tooltip-show', [event]);
			})
			.on('mouseout', '.help-filter.-off', function(event){
				$(this).find('.help-filterIcon').trigger('tooltip-hide');
			})
			.on('click', '.js-searchPage', function(){
				wHelp.search.text = self.parent.wrp.find('input[name="search"]').val();
				wHelp.search.pos = $(this).data('pos');

				if( $(this).data('page') == self.data.id ){
					self.wrp.find('input[name="search"]').val('').trigger('input');

					self.showPage();

					self.setTimeout(self.scrollToSearchText, 10);

					return false;
				}
			});
};

bHelp_body.prototype.afterDraw = function(){
	this.bindPage();

	this.showPage();

	if( this.data.page.filter )
		this['do'+this.data.page.filter]();

	this.initScroll();
};

bHelp_body.prototype.initScroll = function(){
	var scrollOptions = {scrollbarPosition: 'outside'};
    
	scrollOptions.cls = (this.data.page.data||{}).scroll||'.help_body';
	
	bHelp_body.superclass.initScroll.apply(this, [scrollOptions]);
    
	if( wHelp.search.text )
		this.scrollToSearchText();
	else if( this.data.anchor )
		this.doScroll('scrollTo', '.help-' + this.data.id + '-anchor-' + this.data.anchor);
};


bHelp_body.prototype.bindPage = function(){
	if( this.data.page.filter )
		this['bind'+this.data.page.filter]();

	snip.input1Handler(this.cont);
};

bHelp_body.prototype.showPage = function(){
	var content = tmplMgr.help[this.data.id](this.data.page.data);

	if( wHelp.search.text )
		content = this.highlightSearchTextOnPage(content);

	this.wrp.find('.help-contentWrp').html(tmplMgr.help.wrapper({name: this.data.id, title: this.data.page.name, content: content}));
};

bHelp_body.prototype.updateMapImpImg = function(mapImp, isReset) {
	this.wrp.find('.map-improvement.-id-'+mapImp.getId()).replaceWith(tmplMgr.pedia.imp.img(mapImp));

	var $impEffectLevels = this.wrp.find('.js-pedia-imp-img[data-id="'+mapImp.getId()+'"] .imp-effect-level');

	if( isReset )
		$impEffectLevels.removeClass('-type-highlight');
	else
		$impEffectLevels.filter('.-impId-'+mapImp.getLevel()).addClass('-type-highlight');
};


bHelp_body.prototype.searchText = function(searchText) {
	if( searchText.length > 2 ){
		this.cont
				.find('.help-searchWrp')
				.html(tmplMgr.help.search({searchResults: this.getSearchResults(searchText), searchText: searchText}))
				.removeClass('-hidden');

		this.cont
				.find('.help-contentWrp')
				.addClass('-hidden');
	}
	else{
		this.cont
				.find('.help-searchWrp')
				.html('')
				.addClass('-hidden');

		this.cont
				.find('.help-contentWrp')
				.removeClass('-hidden');
	}
};

bHelp_body.prototype.getSearchResults = function(searchText) {
	var self = this,
		result = {},
		pageCont,
		searchPage,
		html,
		regExp = new RegExp(searchText, 'ig');

	for(var pageName in wHelp.searchPages){
		searchPage = wHelp.searchPages[pageName];

		pageCont = tmplMgr.help[pageName]({});

		$('<span>'+pageCont+'</span>').find(searchPage.cls||'.paragraph, .js-searchMark').each(function(index){
			$(this).find('table').remove();

			if( regExp.test($(this).text()) ){
				if( !result[pageName] )
					result[pageName] = [];

				self.highlightSearchText($(this), regExp);

				html = $(this).html();

				if( searchPage.prepareHtml )
					html = searchPage.prepareHtml($(this), html);

				result[pageName].push({html: html, pos: index});
			}
		});
	}

	return result;
};

bHelp_body.prototype.highlightSearchTextOnPage = function(content) {
	var searchPage = wHelp.searchPages[this.data.id],
		regExp = new RegExp(wHelp.search.text, 'ig'),
		$wrp = $('<span>'+content+'</span>'),
		$el = $wrp.find(searchPage.cls||'.paragraph, .js-searchMark').eq(wHelp.search.pos);

	this.highlightSearchText($el, regExp);

	return $wrp.html();
};

bHelp_body.prototype.highlightSearchText = function($cont, regExp) {
	var $tags = $cont.find('*');

	for(var i = $tags.length-1; i >= 0; i--){
		$tags.eq(i).replaceWith(function(){
			return '<i>'+$(this).html()+'</i>';
		});
	}

	var html = $cont.html().replace(regExp, function(match){
		return snip.wrp('help-search-highlight', match);
	});

	var $tagsI = $cont.html(html).find('i');

	for(var i = $tagsI.length-1; i >= 0; i--){
		$tagsI.eq(i).replaceWith($tags.eq(i).html($tagsI.eq(i).html()));
	}
};

bHelp_body.prototype.scrollToSearchText = function() {
	this.updScroll().doScroll('scrollTo', this.wrp.find('.help-search-highlight').first());

	wHelp.search = {};
};

/* Фильтрация для зданий */
bHelp_body.prototype.genBuildFilter = function(page) {
	var defBonusFilter = {
		slotLocationM: {on:true},
		slotLocationF: {on:true},
		slotLocationW: {on:true},
		prodProd: {on:true},
		foodProd: {on:true},
		moneyProd: {on:true},
		sciProd: {on:true},
		culture: {on:true, br: true},
		grow: {on:true},
		ungrown: {on:true},
		trade: {on:true},
		economy: {on:true},
		rent: {on:true},
	};

	this.buildFilter = {
		tab: Slot.tabIds.all,
		known: wHelp.buildKnown.all,
		filter: ls.getPediaBuildFilter(6),
		bonusFilter: ls.getPediaBuildBonusFilter(defBonusFilter),
		search: ''
	};

	this.prepareBuildBonusFilter(this.buildFilter.bonusFilter);

	page.data = {
		bonusFilter: this.buildFilter.bonusFilter,
		scroll: '.help-build-list'
	};
};

bHelp_body.prototype.prepareBuildBonusFilter = function(filter) {
	var iconCls = 'help-build-bonusFilterIcon help-filterIcon';

	filter.slotLocationM.icon = snip.icon(snip.c.anyIcon, 'slotLocationM', undefined, undefined, iconCls);

	filter.slotLocationF.icon = snip.icon(snip.c.anyIcon, 'slotLocationF', undefined, undefined, iconCls);

	filter.slotLocationW.icon = snip.icon(snip.c.anyIcon, 'slotLocationW', undefined, undefined, iconCls);

	filter.prodProd.icon = snip.icon(snip.c.resProdtype, 'production', undefined, undefined, iconCls);

	filter.foodProd.icon = snip.icon(snip.c.resProdtype, 'food', undefined, undefined, iconCls);

	filter.moneyProd.icon = snip.icon(snip.c.resProdtype, 'money', undefined, undefined, iconCls);

	filter.sciProd.icon = snip.icon(snip.c.resProdtype, 'science', undefined, undefined, iconCls);

	filter.rent.icon = snip.icon(snip.c.anyIcon, 'rent', undefined, undefined, iconCls);

	filter.culture.icon = snip.icon(snip.c.anyIcon, 'cult', undefined, undefined, iconCls);

	filter.grow.icon = snip.icon(snip.c.anyIcon, 'grow', undefined, undefined, iconCls);

	filter.trade.icon = snip.icon(snip.c.anyIcon, 'traders', undefined, undefined, iconCls);

	filter.economy.icon = snip.icon(snip.c.anyIcon, 'economy', undefined, undefined, iconCls);

	filter.ungrown.icon = snip.icon(snip.c.anyIcon, 'ungrown', undefined, undefined, iconCls);
};

bHelp_body.prototype.bindBuildFilter = function() {
	var self = this;

	// Фильтрация для зданий
	this.cont
		// Фильтрация табов
		.on('click', '.buildTabs-tab', function() {
			self.buildFilter.tab = $(this).data('group');
			self.doBuildFilter();
		})
		// Фильтрация построек
		.on('click', '.help-build-known', function() {
			self.buildFilter.known = (self.buildFilter.known + 1) % utils.sizeOf(wHelp.buildKnown);
			self.doBuildFilter();
		})
		.on('change', '.help-build-filter', function() {
			var filterId = +$(this).data('filter');
			if ($(this).is(':checked')){
				self.buildFilter.filter = self.buildFilter.filter | filterId;
			} else {
				self.buildFilter.filter = self.buildFilter.filter ^ filterId;
			}
			self.doBuildFilter();
		})
		.on('input', '.help-page-search', function() {
			self.buildFilter.search = $(this).val();
			self.doBuildFilter();
		})
		.on('click', '.help-build-bonusFilter', function() {
				var filter = self.buildFilter.bonusFilter[$(this).data('field')];

				filter.on = !filter.on;

				$(this).toggleClass('-on', filter.on).toggleClass('-off', !filter.on);

				ls.setPediaBuildBonusFilter(self.buildFilter.bonusFilter);

				self.doBuildFilter();
			});
};

bHelp_body.prototype.buildBonusFiltering = function(slot) {
	var filter = this.buildFilter.bonusFilter,
		slotType = slot.getType(),
		hasBonus; // Фильтр по бонусам. Если бонуса нет - проверяем дальше.

	switch(slotType){
		case Build.type.administration: hasBonus = filter.economy.on; break;
		case Build.type.culture: hasBonus = filter.culture.on; break;
		case Build.type.grown: hasBonus = filter.grow.on; break;
		case Build.type.trade: hasBonus = filter.trade.on; break;
	}

	if ( !hasBonus && slot.getPay() ){
		hasBonus = hasBonus||filter.rent.on;
	}

	if ( !hasBonus && slot.getUngrown() ){
		hasBonus = hasBonus||filter.ungrown.on;
	}

	if ( !hasBonus ){
		var prodtypeList = slot.getProductresByType();

		if( prodtypeList[Resource.prodtypes.production] ) hasBonus = hasBonus||filter.prodProd.on;
		if( !hasBonus && prodtypeList[Resource.prodtypes.food] ) hasBonus = hasBonus||filter.foodProd.on;
		if( !hasBonus && prodtypeList[Resource.prodtypes.money] ) hasBonus = hasBonus||filter.moneyProd.on;
		if( !hasBonus && prodtypeList[Resource.prodtypes.science] ) hasBonus = hasBonus||filter.sciProd.on;
	}

	if( hasBonus === false ) return false;



	if ( slot.isMountain() ){
		if( filter.slotLocationM.on ) return true;
	}

	if ( slot.isWater() ){
		if( filter.slotLocationW.on ) return true;
	}

	if ( slot.isFlat() ){
		if( filter.slotLocationF.on ) return true;
	}

	return false;
};

bHelp_body.prototype.doBuildFilter = function() {
	var self = this;

	// Сохраняем фильтр
	ls.setPediaBuildFilter(this.buildFilter.filter);

	// Отображаем чекбоксы
	this.wrp.find('.help-build-filter').each(function(){
		utils.toggleAttr($(this), 'checked', self.buildFilter.filter & (+$(this).data('filter')));
	});

	// Создаём вкладки
	var tabs = {};
	for (var tabId in Slot.tabs){
		if ( tabId != Slot.tabIds.wonder) {
			var tab = utils.clone(Slot.tabs[tabId]);
			tab.id = tabId;
			tab.builds = [];
			tabs[tabId] = tab;
		}
	}

	if( this.buildFilter.search ){
		var searchRE = new RegExp('^'+this.buildFilter.search, 'i');

		self.buildFilter.tab = Slot.tabIds.all;
	}

	// Наполняем строениями
	for (var buildId in Build.tableSort){
		var slot = new Slot(buildId);
		if ( slot.getSlotTypeByBld() != Build.slotType.no && tabs[slot.getTab()] && !slot.isHidden() ) {
			slot.lvl = wofh.account ? Build.getResearchLevel(slot.id) : lib.build.maxlevel; 

			if (slot.lvl == 0) {
				slot.known = wHelp.buildKnown.unknown;
			} else if (slot.lvl == lib.build.maxlevel) {
				slot.known = wHelp.buildKnown.known;
			} else {
				slot.known = wHelp.buildKnown.familar;
			}

			var show;

			if( searchRE ){
				show = searchRE.test(slot.getName());
			}
			else{
				var ind;

				if ( slot.known == wHelp.buildKnown.unknown ) {
					ind = 0;
				} else if ( slot.known = wHelp.buildKnown.known ) {
					ind = 2;
				} else {
					ind = 1;
				}

				show = utils.inMask(ind, self.buildFilter.filter);
			}

			if( show )
				show = self.buildBonusFiltering(slot);

			if( show )
				tabs[slot.getTab()].builds.push(slot);
		}
	}

	// Убираем пустые вкладки
	for (var tabId in tabs){
		if( !(tabs[tabId].builds.length || tabId == Slot.tabIds.all) ){
			delete tabs[tabId];
		}
	}

	// Если осталась только вкладка "Все", возвращаем пустой список
	if( utils.sizeOf(tabs) < 2 )
		tabs = {};

	// Показываем отфильрованное
	this.wrp.find('.help-build-wrp').html(tmplMgr.help.build.info({filter: this.buildFilter, tabs: tabs}));	
};

/* Фильтрация для наук */
bHelp_body.prototype.genSciFilter = function(page) {
	var defBonusFilter = {
		none: {on:true},
		deposits: {on:true},
		envs: {on:true},
		abilityRoad: {on:true},
		abilityCap: {on:true},
		fuel: {on:true},
	};

	for (var bonusName in Science.bonusHas){
		defBonusFilter['bonus_' + bonusName] = {on:true};
	}

	defBonusFilter.abilityFish = {on:true};
	defBonusFilter.abilityCloth = {on:true};
	defBonusFilter.specialist = {on:true};

	defBonusFilter.battleUnits = {on:true};
	defBonusFilter.peacefulUnits = {on:true};
	defBonusFilter.builds = {on:true};


	// Инициализируем фильтр наук 
	this.scienceFilter = {
		filter: ls.getPediaScienceFilter(6),
		bonusFilter: ls.getPediaSciBonusFilter(defBonusFilter),
		search: ''
	};

	this.prepareSciBonusFilter(this.scienceFilter.bonusFilter);

	page.data = {
		bonusFilter: this.scienceFilter.bonusFilter,
		scroll: '.help-sci-list'
	};
};

bHelp_body.prototype.prepareSciBonusFilter = function(filter) {
	var iconCls = 'help-sci-bonusFilterIcon help-filterIcon';

	filter.deposits.icon = snip.icon(snip.c.anyIcon, 'deposit', 'Месторождение', undefined, iconCls);

	filter.envs.icon = snip.icon(snip.c.anyIcon, 'mapImp', undefined, undefined, iconCls);

	for (var bonusName in Science.bonusHas){
		filter['bonus_' + bonusName].icon = snip.icon(snip.c.bonusScience, bonusName, undefined, undefined, iconCls);
	}

	for (var abilityId in Science.ability) {
		abilityId = Science.ability[abilityId];
		switch (+abilityId) {
			case Science.ability.fish:
				filter.abilityFish.icon = snip.resEffect(Resource.ids.fish, iconCls);
				break;
			case Science.ability.cloth:
				filter.abilityCloth.icon = snip.resEffect(Resource.ids.cloth, iconCls);
				break;
			case Science.ability.roadDirt:
			case Science.ability.roadHighway:
			case Science.ability.roadRailway:
			case Science.ability.roadMaglev:
			case Science.ability.roadTunnel:
				filter.abilityRoad.icon = snip.icon(snip.c.anyIcon, 'mapImp', 'Строительство дороги', undefined, iconCls);
				break;
			default:
				filter.abilityCap.icon = snip.icon(snip.c.anyIcon, 'cap', undefined, undefined, iconCls);
		}
	}

	filter.fuel.icon = snip.icon(snip.c.anyIcon, 'fuel', undefined, undefined, iconCls);;

	filter.specialist.icon = snip.icon(snip.c.anyIcon, 'specialist', 'Великий гражданин', undefined, iconCls);

	filter.battleUnits.icon = snip.icon(snip.c.bonusScience, 'unit', 'Боевые войска', undefined, iconCls);

	filter.peacefulUnits.icon = snip.icon(snip.c.bonusScience, 'unitPeace', 'Миротворцы и робкие войска', undefined, iconCls);

	filter.builds.icon = snip.icon(snip.c.bonusScience, 'build', 'Строения', undefined, iconCls);


	filter.none.icon = snip.icon(snip.c.anyIcon, 'empty', undefined, undefined, iconCls);
	// Скрываем фильтр "без всего", но возможно он еще понадобится
	filter.none.hide = true;
	filter.none.on = true;

};

bHelp_body.prototype.bindSciFilter = function() {
	var self = this;

	// Фильтрация для наук
	this.cont
			.on('change', '.help-sci-filter', function() {
				var filterId = +$(this).data('filter');

				if ($(this).is(':checked')){
					self.scienceFilter.filter = self.scienceFilter.filter | filterId;
				} else {
					self.scienceFilter.filter = self.scienceFilter.filter ^ filterId;
				}

				self.doSciFilter();
			})
			.on('click', '.help-sci-bonusFilter', function() {
				var filter = self.scienceFilter.bonusFilter[$(this).data('field')];

				filter.on = !filter.on;

				$(this).toggleClass('-on', filter.on).toggleClass('-off', !filter.on);

				ls.setPediaSciBonusFilter(self.scienceFilter.bonusFilter);

				self.doSciFilter();
			})
			.on('input', '.help-page-search', function() {
				self.scienceFilter.search = $(this).val();
				self.doSciFilter();
			});
};

bHelp_body.prototype.sciBonusFiltering = function(science) {
	var filter = this.scienceFilter.bonusFilter,
		noBonus = true;

	if ( science.deposits.length ){
		if( filter.deposits.on ) return true;

		noBonus = false;
	}

	if ( science.envs.length ){
		if( filter.envs.on ) return true;

		noBonus = false;
	}

	for (var bonusId in science.bonuses){
		if( filter['bonus_' + utils.cnstName(Science.bonusHas, bonusId)].on ) return true;

		noBonus = false;
	}

	for (var abilityId in science.abilities) {
		switch (+abilityId) {
			case Science.ability.fish:
				if( filter.abilityFish.on ) return true;
				break;
			case Science.ability.cloth:
				if( filter.abilityCloth.on ) return true;
				break;
			case Science.ability.roadDirt:
			case Science.ability.roadHighway:
			case Science.ability.roadRailway:
			case Science.ability.roadMaglev:
			case Science.ability.roadTunnel:
				if( filter.abilityRoad.on ) return true;
				break;
			default:
				if( filter.abilityCap.on ) return true;	
		}

		noBonus = false;
	}

	if ( science.fuel ){
		if( filter.fuel.on ) return true;

		noBonus = false;
	}

	if ( science.specialistList.getLength() ){
		if( filter.specialist.on ) return true;

		noBonus = false;
	}

	if ( !science.units.isEmpty() ){
		if( !science.units.clone().getBattleUnits().isEmpty() )
			if( filter.battleUnits.on ) return true;

		if ( !science.units.clone().getPeacefulUnits().isEmpty() )
			if( filter.peacefulUnits.on ) return true;

		noBonus = false;
	}

	if ( !science.builds.isEmpty() ){
		if( filter.builds.on ) return true;

		noBonus = false;
	}

	if( noBonus && filter.none.on )
		return true;

	return false;
};

bHelp_body.prototype.doSciFilter = function() {
	var self = this;
	//сохраняем фильтр
	ls.setPediaScienceFilter(this.scienceFilter.filter);

	//отображаем чекбоксы
	this.wrp.find('.help-sci-filter').each(function() {
		utils.toggleAttr($(this), 'checked', self.scienceFilter.filter & (+$(this).data('filter')));
	});

	//фильтруем таблицу
	if (this.scienceFilter.search) {
		this.wrp.find('.help-sci-item').addClass('-hidden');
		var selectedScience = this.wrp.find('.help-sci-item[data-name*="' + this.scienceFilter.search.toLowerCase() + '"]');
		selectedScience.removeClass('-hidden');
	} else {
		this.wrp.find('.help-sci-item').each(function(){
			var sci = Science.get($(this).data('id'));
			var show;

			var ind;
			if (sci.getKnown() == Science.known.unavail){
				ind = 0;
			} else if (sci.getKnown() == Science.known.avail){
				ind = 1;
			} else {
				ind = 2;
			}

			show = utils.inMask(ind, self.scienceFilter.filter);

			if( show )
				show = self.sciBonusFiltering(sci);

			$(this).toggleClass('-hidden', !show);
		});

		var selectedScience = this.wrp.find('.help-sci-item:not(.-hidden)');
	}

	//если ничего не осталось - показываем сообщение
	this.wrp.find('.help-sci-error').toggleClass('-hidden', selectedScience.length > 0);
};

/* Фильтрация для юнитов */
bHelp_body.prototype.genUnitFilter = function(page) {
	var defBonusFilter = {
		none: {on:true},
		popKill: {on:true},
		airDamage: {on:true},
		waterDamage: {on:true},
		townDamage: {on:true},
		transport: {on:true},
	};

	this.unitFilter = {
		filter: ls.getPediaUnitFilter(3),
		bonusFilter: ls.getPediaUnitBonusFilter(defBonusFilter),
		search: '',
	};

	this.prepareUnitBonusFilter(this.unitFilter.bonusFilter);

	page.data = {
		bonusFilter: this.unitFilter.bonusFilter,
		scroll: '.help-unit-list'
	};
};

bHelp_body.prototype.prepareUnitBonusFilter = function(filter) {
	var iconCls = 'help-unit-bonusFilterIcon help-filterIcon';

	filter.popKill.icon = snip.icon(snip.c.anyIcon, 'popKill', 'Убивает население', undefined, iconCls);

	filter.airDamage.icon = snip.icon(snip.c.anyIcon, 'airDamage', 'Урон авиации', undefined, iconCls);

	filter.waterDamage.icon = snip.icon(snip.c.anyIcon, 'waterDamage', 'Урон кораблям', undefined, iconCls);

	filter.townDamage.icon = snip.icon(snip.c.anyIcon, 'townDmg', 'Урон городу', undefined, iconCls);

	filter.transport.icon = snip.icon(snip.c.anyIcon, 'abilities', 'Транспорт', undefined, iconCls);

	filter.none.icon = snip.icon(snip.c.anyIcon, 'empty', 'Без особенностей', undefined, iconCls);
};

bHelp_body.prototype.bindUnitFilter = function() {
	var self = this;

	// Фильтрация для юнитов
	this.cont
			.on('change', '.help-unit-filter', function() {
				var filterId = +$(this).data('filter');
				if ($(this).is(':checked')){
					self.unitFilter.filter = self.unitFilter.filter | filterId;
				} else {
					self.unitFilter.filter = self.unitFilter.filter ^ filterId;
				}
				self.doUnitFilter();
			})
			.on('click', '.help-unit-bonusFilter', function() {
				var filter = self.unitFilter.bonusFilter[$(this).data('field')];

				filter.on = !filter.on;

				$(this).toggleClass('-on', filter.on).toggleClass('-off', !filter.on);

				ls.setPediaUnitBonusFilter(self.unitFilter.bonusFilter);

				self.doUnitFilter();
			})
			.on('input', '.help-page-search', function() {
				self.unitFilter.search = $(this).val();
				self.doUnitFilter();
			});
};

bHelp_body.prototype.unitBonusFiltering = function(unit) {
	var filter = this.unitFilter.bonusFilter,
		noBonus = true;

	if ( unit.data.popkill > 0 ){
		if( filter.popKill.on ) return true;

		noBonus = false;
	}

	if ( unit.getAirDamage() ){
		if( filter.airDamage.on ) return true;

		noBonus = false;
	}

	if ( unit.getWaterDamage() ){
		if( filter.waterDamage.on ) return true;

		noBonus = false;
	}

	if ( unit.hasAbility(Unit.ability.destroy) ){
		if( filter.townDamage.on ) return true;

		noBonus = false;
	}

	if ( unit.hasAbility(Unit.ability.transport) ){
		if( filter.transport.on ) return true;

		noBonus = false;
	}

	if( noBonus && filter.none.on )
		return true;

	return false;
};

bHelp_body.prototype.doUnitFilter = function() {
	var self = this;
	//сохраняем фильтр
	ls.setPediaUnitFilter(this.unitFilter.filter);

	//отображаем чекбоксы
	this.wrp.find('.help-unit-filter').each(function() {
		utils.toggleAttr($(this), 'checked', self.unitFilter.filter & (+$(this).data('filter')));
	});

	//фильтруем таблицу
	if (this.unitFilter.search) {
		this.wrp.find('.help-unit-item').addClass('-hidden');
		var selectedUnit = this.wrp.find('.help-unit-item[data-name*="' + this.unitFilter.search.toLowerCase() + '"]');
		selectedUnit.removeClass('-hidden');
	} else {
		this.wrp.find('.help-unit-item').each(function(){
			var unit = new Unit($(this).data('id'));
			var show;

			var ind;
			if ( unit.isAvailAcc() ){
				ind = 0;
			} else {
				ind = 1;
			}

			show = utils.inMask(ind, self.unitFilter.filter);

			if( show )
				show = self.unitBonusFiltering(unit);

			$(this).toggleClass('-hidden', !show);
		});

		var selectedUnit = this.wrp.find('.help-unit-item:not(.-hidden)');
	}
};

/* Фильтрация для местородов */
bHelp_body.prototype.genDepFilter = function(page) {
	var defResFilter = {
		grown: {on:true},
		cult: {on:true},
		production: {on:true},
		science: {on:true},
		foodProd: {on:true},
	};

	this.depFilter = {
		filter: ls.getPediaDepFilter(255),
		resFilter: ls.getPediaDepResFilter(defResFilter),
	};	

	// Убить через месяц 18.10.2018
	if( utils.sizeOf(defResFilter) != utils.sizeOf(this.depFilter.resFilter) ){
		this.depFilter.resFilter.foodProd = defResFilter.foodProd;

		ls.setPediaDepResFilter(this.depFilter.resFilter);
	}

	this.prepareDepResFilter(this.depFilter.resFilter);

	page.data = {
		resFilter: this.depFilter.resFilter,
		scroll: '.help-dep-list'
	};
};

bHelp_body.prototype.prepareDepResFilter = function(filter) {
	var iconCls = 'help-dep-resFilterIcon help-filterIcon';

	filter.grown.icon = snip.icon(snip.c.anyIcon, 'grow', undefined, undefined, iconCls);

	filter.cult.icon = snip.icon(snip.c.anyIcon, 'cult', undefined, undefined, iconCls);

	filter.production.icon = snip.icon(snip.c.anyIcon, 'production', undefined, undefined, iconCls);

	filter.science.icon = snip.icon(snip.c.anyIcon, 'science', 'Знания', undefined, iconCls);

	filter.foodProd.icon = snip.icon(snip.c.resProdtype, 'food', undefined, undefined, iconCls);
};

bHelp_body.prototype.bindDepFilter = function() {
	var self = this;

	this.cont
			.on('change', '.help-dep-filter', function() {
				var filterId = +$(this).data('filter');
				if ($(this).is(':checked')){
					self.depFilter.filter = self.depFilter.filter | filterId;
				} else {
					self.depFilter.filter = self.depFilter.filter ^ filterId;
				}
				self.doDepFilter();
			})
			.on('click', '.help-dep-resFilter', function() {
				var filter = self.depFilter.resFilter[$(this).data('field')];

				filter.on = !filter.on;

				$(this).toggleClass('-on', filter.on).toggleClass('-off', !filter.on);

				ls.setPediaDepResFilter(self.depFilter.resFilter);

				self.doDepFilter();
			});
};

bHelp_body.prototype.depResFiltering = function(dep) {
	var filter = this.depFilter.resFilter;

	var resList = dep.getRes().getList();

	for(var res in resList){
		res = resList[res];

		if ( res.isGrown() ){
			if( filter.grown.on ) return true;
		}

		if ( res.isCult() ){
			if( filter.cult.on ) return true;
		}

		if ( res.isProd() ){
			if( filter.production.on ) return true;
		}

		if ( res.isScience() ){
			if( filter.science.on ) return true;
		}

		if ( res.isAgro() ){
			if( filter.foodProd.on ) return true;
		}
	}

	return false;
};

bHelp_body.prototype.doDepFilter = function() {
	var self = this;

	//сохраняем фильтр 
	ls.setPediaDepFilter(this.depFilter.filter);

	//отображаем чекбоксы
	this.wrp.find('.help-dep-filter').each(function() {
		utils.toggleAttr($(this), 'checked', self.depFilter.filter & (+$(this).data('filter')));
	});

	this.wrp.find('.help-dep-item').each(function(){
		var dep = new Deposit($(this).data('id'));
		var show = true;

		var ind,
			avail = dep.isAvailAcc();

		if ( avail )
			ind = 6;
		else
			ind = 7;

		show = utils.inMask(ind, self.depFilter.filter);

		if( show )
			show = utils.inMask(dep.climate, self.depFilter.filter);

		if( show )
			show = self.depResFiltering(dep);

		$(this).toggleClass('-hidden', !show);
	});
};