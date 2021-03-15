wScienceNext = function(){
	wScienceNext.superclass.constructor.apply(this, arguments);
};

utils.extend(wScienceNext, Wnd);

WndMgr.regWnd('science', wScienceNext);


wScienceNext.prepareData = function(){
	if( !Quest.isAvail(lib.quest.ability.science) )
		return false;
	// Только при первом открытии окна
	if( !wndMgr.getFirstWndByType(this) )
		notifMgr.runEvent(Notif.ids.accScience); // Обновляем итератор для актуализации данных о прогрессе изученных наук в окне и меню

	return {};
};


wScienceNext.prototype.calcName = function(){
	return 'science';
};

wScienceNext.prototype.calcChildren = function(){
	this.children.view = bScienceNext_view;
};	
	


bScienceNext_view = function(id, data){
	bScienceNext_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bScienceNext_view, Block);


bScienceNext_view.prototype.calcName = function(){
	return 'view';
};

bScienceNext_view.prototype.initOptions = function(){
	this.delegate('initOptions', bScienceNext_view, arguments);
	
	this.options.clearData = false;
	this.options.hasReqData = true;
};
	
bScienceNext_view.prototype.calcChildren = function(){
	this.children.incom = bScienceIncom;
	
	this.children.columns = bScienceNext_columns;
};

bScienceNext_view.prototype.getData = function(){
	if( !this.data.specialists ){
		this.getReqData(function(){
			var self = this;
			
			reqMgr.getSpecialists(function(resp, reqId){
				self.tryProcessResp(
					resp, reqId,
					function(){
						this.data.specialists = resp.specialists;
						
						this.dataReceived();
					}
				);
			});
		});
	}
	else
		this.dataReceived();
};



bScienceIncom = function(parent){
	bScienceIncom.superclass.constructor.apply(this, arguments);
};

utils.extend(bScienceIncom, Block);


bScienceIncom.prototype.calcName = function(){
	return 'incom';
};

bScienceIncom.prototype.getData = function(){
	this.data.specialists = this.parent.data.specialists;

	this.dataReceived();
};

bScienceIncom.prototype.bindEvent = function(){
	this.wrp.on('click', '.science-addBonus', function(){
			var type = LuckBonus.ids.science;
			var town = wofh.town;
			var bonus = town.getLuckBonus(type);

			wBonusTakeNow.show(bonus);

			return false;
		});
};



bScienceNext_columns = function(parent){
	bScienceNext_columns.superclass.constructor.apply(this, arguments);

	this.mode = 1;
};

utils.extend(bScienceNext_columns, Block);


bScienceNext_columns.prototype.calcName = function(){
	return 'columns';
};

bScienceNext_columns.prototype.initOptions = function(){
	bScienceNext_columns.superclass.initOptions.apply(this, arguments);

	this.options.clearData = false;
};

bScienceNext_columns.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accScienceHas];
};

bScienceNext_columns.prototype.getData = function(){
	//собираем список изучаемых наук
	this.data.studying = this.initStudyingList();

	this.data.canChange = wofh.account.isScientist() && !(this.data.canCancel = Science.getScienceData(wofh.country).debt);

	this.dataReceived();
};

bScienceNext_columns.prototype.getTmplData = function(){
	this.calcColumns();

	if( this.mode ){
		this.data.mode = this.mode;

		this.data.canToggle = this.data.studying.getLength() < lib.science.queuesize;

		this.data.selected = this.calcSelectedSciences();
	}

	return this.data;
};

bScienceNext_columns.prototype.bindEvent = function(){
	var self = this;

	//выбор науки
	this.wrp
		.on('click', '.science-sci', function(event){
			if( $(event.target).is('.link') || $(event.target).closest('.link').length ) 
				return;

			var id = +$(this).data('id');

			if (self.mode)
				self.toggleElem(id);
			else
				self.toggleElemQueue(id);

			self.scienceSelected = true;

			self.show();
		})
		//наведение на науку
		.on('mouseover', '.science-sci', function(){
			var id = +$(this).data('id');
			self.clearSelection();
			self.hoverScience(true, id);
			self.hoverScience(false, id);

			self.showLinks();
		})
		.on('mouseout', '.science-sci', function(){
			self.clearSelection();

			self.showLinks();
		});

	if( this.mode ){
		//добавление науки в очередь
		this.wrp.on('click', '.science-sci-select', function(){
			if( $(this).hasClass('-disabled') )
				return;
			
			var id = +$(this).closest('.science-sci').data('id');
			
			return self.toggleElemQueue(id);
		});
	}
};

bScienceNext_columns.prototype.modifyCont = function(){
	if( this.scienceSelected )
		this.cont.find('.science-sci-select').addClass('effect-slide');
};

bScienceNext_columns.prototype.afterDraw = function(){
	this.resizeSciencePannels();
	
	this.initLinks();
	/*
	this.initScroll({
		scrollbarPosition: 'outside'
	});
	*/
	if( this.scienceSelected ){
		this.setTimeout(function(){
			this.wrp.find('.science-sci-select').removeClass('effect-slide');
		}, 100);
		
		delete this.scienceSelected;
	}
};
/*
bScienceNext_columns.prototype.getScrollTag = function(cls){
	return this.wrp;
}; 
*/

//расчёт колонок с науками
bScienceNext_columns.prototype.calcColumns = function(){
	var data = {};

	//вычисляем колонки 
	//первая - доступные к изучению сейчас, 
	//вторая - все доступные после изучения всех из первой колонки, 
	//третья - после изучения всех из первой и второй колонок
	var scienceData = Science.getScienceData(wofh.country);
	var	state = scienceData.state;
	var all = ScienceList.getAll().setState(state);
	this.data.col1 = all.clone().filterKnown(Science.known.avail, true);

	// Если есть научная задолженность добавляем её в список
	if( scienceData.debt ){
		this.data.col1.addElem(new Science(Science.debt));
	}

	all.setSciencesKnown(this.data.col1);
	this.data.col2 = all.clone().filterKnown(Science.known.avail, true);

	all.setSciencesKnown(this.data.col2);
	this.data.col3 = all.clone().filterKnown(Science.known.avail, true);

	this.data.all = new ScienceList();
	this.data.all.joinList(this.data.col1);
	this.data.all.joinList(this.data.col2);
	this.data.all.joinList(this.data.col3);

	return data;
};
//инициализация списка изучаемых наук
bScienceNext_columns.prototype.initStudyingList = function(){
	var studying = new ScienceList().setSorted(true);

	var sciences = (wofh.country? wofh.country: wofh.account).science;

	for( var science in sciences.queue ){
		science = sciences.queue[science];
		if( science != Science.no ){
			studying.addElem(science);	
		}
	}

	return studying;
};
//включение и выключение элемента из списка
bScienceNext_columns.prototype.toggleElemQueue = function(id){
	var scienceTog = Science.get(id),
		studying = this.data.studying;

	if( studying.hasElem(scienceTog) ) {
		//отправляем запрос
		reqMgr.chooseScience(Science.no, studying.getElemPos(scienceTog));
		//отключаем науку и проверяем оставшиеся науки на изучаемость
		studying.delElem(scienceTog);

		this.removeMissedSciences();
	} 
	else{
		var pos = studying.getLength();
		//собираем цепочку наук, которые потребуются для изучения.
		var studyingNew = this.getSciencesToResearch(scienceTog);

		if( this.mode ){
			//в режиме нельзя выбирать науку, если все требуемые ею науки не изучены и не в очереди на изучение
			if( studyingNew.clone().unjoinList(this.data.studying).getLength() > 1 ){
				this.showBlink(id);

				return false;
			}
		}
		//отправляем запрос
		reqMgr.chooseScience(id, pos);
		//дополняем цепочку теми науками, которые есть сейчас
		this.updateStudying(studyingNew);
	}

	return true;
};
//принудительное разворачивание элемента
bScienceNext_columns.prototype.toggleElem = function(id){
	if (this.data.curScience == id) {
		delete this.data.curScience;
	} else {
		this.data.curScience = id;	
	}
};
//список наук, которые требуется изучить, чтобы открыть требуемую науку. отсортированы в порядке изучения
bScienceNext_columns.prototype.getSciencesToResearch = function(science, list){
	list = list||(new ScienceList());// заводим список наук

	//получаем список наук требуемых для изучения текущей
	var needSciences = science.getNeedSciences();

	for (var sci in needSciences.getList()){
		sci = needSciences.getElem(sci);

		this.getSciencesToResearch(sci, list);
	}

	list.addElem(science);

	return list;
};
//Проверяем список наук - убираем те, которые нельзя изучить (науки ведущие к ним потеряны)
bScienceNext_columns.prototype.removeMissedSciences = function(){
	for (var sciRemovePos = 0; sciRemovePos < this.data.studying.getLength(); sciRemovePos++){
		var sciRemove = this.data.studying.getElemByPos(sciRemovePos),
			sciCheckList = this.getSciencesToResearch(sciRemove).getList();

		for (var sciCheck in sciCheckList){
			sciCheck = sciCheckList[sciCheck];

			if( !this.data.studying.hasElem(sciCheck) ){
				this.data.studying.delElem(sciRemove);

				sciRemovePos--;

				break;
			}
		}
	}
};
//обновляем старую цепочку новыми данными
bScienceNext_columns.prototype.updateStudying = function(newList){
	//старая цепочка
	var oldList = this.data.studying;

	//1. считаем общую длину цепочки
	var length = oldList.getLength();//старая цепочка
	length += newList.clone().unjoinList(oldList).getLength();//элементы новой, которых нет в старой

	//2. исключаем из старого списка науки вылезающие из лимита
	if (length > lib.science.queuesize) {
		for (var sciPos = oldList.getLength()-1; sciPos >= 0; sciPos--){
			var sci = oldList.getElemByPos(sciPos);
			if (!newList.hasElem(sci)) {
				oldList.delElem(sci);
				length--;
				if (length == lib.science.queuesize) {
					break;
				}
			}
		}
	}

	//3.дополняем старый список элементами из нового списка до лимита
	oldList.joinUniqList(newList);
};

bScienceNext_columns.prototype.initLinks = function(){
	var self = this;

	this.wrp.find('.science-links').svg({onLoad: function(obj){
		self.svg = obj;
		//расчитываем связи
		self.calcLinks();
		//добавляем связи очереди
		self.calcStudyingLinks();
		//помечаем связи от раскрытой науки
		if (self.mode && self.data.curScience){
			self.selectScienceLinks(true, self.data.curScience);
			self.selectScienceLinks(false, self.data.curScience);
		}

		self.showLinks();
	}});
};
//расчёт связей по блокам
bScienceNext_columns.prototype.calcLinks = function(){
	var self = this;

	this.data.links = [];

	this.wrp.find('.science-sci').each(function(){
		var $sci = $(this);
		var sci = Science.get($sci.data('id'));
		var haveOutside = false;

		for (var nextSci in sci.next.getList()) {
			nextSci = sci.next.getElem(nextSci);
			var $nextSci = self.wrp.find('.science-sci[data-id='+nextSci.id+']');
			if ($nextSci.length){
				//рисуем линию
				var link = self.calcLink2(sci, $sci, nextSci, $nextSci, false);
				self.data.links.push(link);
			}
			else if( !haveOutside ){
				var link = self.calcLinkOutside(sci, $sci);

				self.data.links.push(link);

				haveOutside = true;
			}
		}
	});
};
//расчёт линий изучаемых наук
bScienceNext_columns.prototype.calcStudyingLinks = function(){
	var prevSci = false;
	for (var sci in this.data.studying.getList()) {
		sci = this.data.studying.getElemByPos(sci);
		if (prevSci){
			var $prevSci = this.wrp.find('.science-sci[data-id='+prevSci.id+']');
			var $sci = this.wrp.find('.science-sci[data-id='+sci.id+']');
			var link = this.calcLink2(prevSci, $prevSci, sci, $sci, true);

			this.deleteSameLinks(link);

			this.data.links.push(link);
		}
		prevSci = sci;
	}
};

bScienceNext_columns.prototype.deleteSameLinks = function(link){
	for (var i=0; i < this.data.links.length; i++) {
		if( this.data.links[i].from == link.from && this.data.links[i].to == link.to ){
			this.data.links.splice(i, 1);
			return;
		}
	}
};
//в какой колонке находится наука
bScienceNext_columns.prototype.getScienceCol = function(science){
	if (this.data.col1.hasElem(science)) return 1;
	if (this.data.col2.hasElem(science)) return 2;
	if (this.data.col3.hasElem(science)) return 3;
	return 0;
}
//расчитываем связь в координатах
bScienceNext_columns.prototype.calcLink2 = function(from, $from, to, $to, active){
	var lever = 40;
	var arrowLever = {x: 4, y: 4};
	var arrowLeverActive = {x: 6, y: 5};
	var activeDisp = 14;


	var fromOff = $from.position();
	var toOff = $to.position();

	//расчёт положения точек: слева или справа
	var fromCol = this.getScienceCol(from);
	var toCol = this.getScienceCol(to);
	var fromLeft;
	var toLeft;

	if (fromCol < toCol){
		fromLeft = false;
		toLeft = true;
	} else if (fromCol > toCol){
		fromLeft = true;
		toLeft = false;
	} else {
		fromLeft = toLeft = fromCol == 3;
	}

	//расчёт координат крайних точек
	var A = {
		x: fromOff.left + (fromLeft? ($from.hasClass('-inQueue')? -activeDisp: 0) : $from.outerWidth()), 
		y: fromOff.top + $from.outerHeight()/2};
	var D = {
		x: toOff.left + (toLeft? ($to.hasClass('-inQueue')? -activeDisp: 0) : $to.outerWidth()), 
		y: toOff.top + $to.outerHeight()/2};

	//учёт положения линий связи (не крайние связи входят выше, а выходят ниже)
	if (active) {
		if (this.data.studying.getFirst().id != from.id) {
			A.y += 5;
		}
		if (this.data.studying.getLast().id != to.id) {
			D.y -= 5;
		}
	}


	//расчёт координат вспомогательных точек
	var B = {
		x: A.x + lever * (fromLeft? -1: 1), 
		y: A.y};
	var C = {
		x: D.x + lever * (toLeft? -1: 1), 
		y: D.y};

	//запоминаем линию
	var link = {};
	link.path = 'M '+A.x+', '+A.y+' C '+B.x+', '+B.y+', '+C.x+', '+C.y+', '+D.x+', '+D.y;
	link.from = from.id;
	link.to = to.id;


	link.active = active||false;
	link.hover = false;

	if (link.active){
		arrowLever = arrowLeverActive;
	}
	var E = {
		x: D.x + arrowLever.x * (toLeft? -1: 1),
		y: D.y + arrowLever.y
	};
	var F = {
		x: D.x + arrowLever.x * (toLeft? -1: 1),
		y: D.y - arrowLever.y
	};

	link.arrow = [[E.x,E.y],[D.x,D.y],[F.x,F.y]];

	return link;
};

bScienceNext_columns.prototype.calcLinkOutside = function(from, $from){
	var arrowLever = {x: 4, y: 4};

	var fromOff = $from.position();

	//расчёт координат крайних точек
	var A = {
		x: fromOff.left + $from.outerWidth(), 
		y: fromOff.top + $from.outerHeight()/2
	};

	//запоминаем линию
	var link = {};
	link.line = [A.x,A.y,A.x+($(this.svg._svg).width()-A.x-3),A.y];
	link.from = from.id;

	var E = {
		x: link.line[2] + arrowLever.x * -1,
		y: link.line[3] + arrowLever.y
	};
	var F = {
		x: link.line[2] + arrowLever.x * -1,
		y: link.line[3] - arrowLever.y
	};

	link.arrow = [[E.x,E.y],[link.line[2],link.line[3]],[F.x,F.y]];

	return link;
};
//показываем связи
bScienceNext_columns.prototype.showLinks = function(){
	this.svg.clear();
	if (this.mode) {
		this.showLinksByType2();
		this.showLinksByType2('hover');
		this.showLinksByType2('selected');
		this.showLinksByType2('active');
	} else {
		this.showLinksByType(false, false);
		this.showLinksByType(true, false);
		this.showLinksByType(false, true);
		this.showLinksByType(true, true);	
		this.showArrows();
	}
};
//показываем связи нужного типа
bScienceNext_columns.prototype.showLinksByType = function(active, hover){
	var addClass = '';
	if (active) addClass += ' -active';
	if (hover) addClass += ' -hover';

	for (var link in this.data.links) {
		link = this.data.links[link];

		if (link.active != active) continue;
		if (link.hover != hover) continue;

		if (this.mode) {
			if ((link.selected||false) != hover) continue;	
		}

		this.svg.path(this._svg, link.path, {class: 'science-link '+addClass+(link.selected?' -selected': ''), 'data-from': link.from, 'data-to': link.to});
		if (link.arrow){
			if (link.active){
				this.svg.polygon(this._svg, link.arrow, {class: 'science-arrow -active'});
			} else {
				this.svg.polyline(this._svg, link.arrow, {class: 'science-arrow '+addClass+(link.selected?' -selected': '')});
			}
		}
	}
};

bScienceNext_columns.prototype.showLinksByType2 = function(cls){
	var addClass = cls? ' -'+cls: '';

	for (var link in this.data.links) {
		link = this.data.links[link];

		if (cls && !link[cls]) continue;
		if (!cls && (link.hover || link.selected || link.active)) continue;

		if( link.line )
			this.svg.line(link.line[0], link.line[1], link.line[2], link.line[3], {class: 'science-link -type-outside '+addClass});
		else
			this.svg.path(this._svg, link.path, {class: 'science-link '+addClass, 'data-from': link.from, 'data-to': link.to});

		if (link.arrow){
			if (link.active){
				this.svg.polygon(this._svg, link.arrow, {class: 'science-arrow -active'});
			} else {
				this.svg.polyline(this._svg, link.arrow, {class: 'science-arrow '+addClass+(link.selected?' -selected': '')});
			}
		}
	}
};

bScienceNext_columns.prototype.showArrows = function(){
	for (var link in this.data.links) {
		link = this.data.links[link];

		if (link.arrow){
			this.svg.polygon(this._svg, link.arrow, {class: 'science-arrow'});
		}
	}
};

//снимаем выделения с наук
bScienceNext_columns.prototype.clearSelection = function(){
	this.wrp.find('.science-sci').removeClass('-hover');
	//this.wrp.find('.science-link').removeClass('-hover');
	for (var link in this.data.links){
		link = this.data.links[link];
		link.hover = false;
	}
}
//выделяем науку при наведении
bScienceNext_columns.prototype.hoverScience = function(dir, id){
	var self = this;

	var $sci = this.wrp.find('.science-sci[data-id='+id+']');
	if (!$sci.hasClass('-active')){
		$sci.addClass('-hover');	
	}
	var links = this.getLinksByDir(dir, id);
	for (var link in links){
		link = links[link];
		if (!link.active && !link.selected) {
			link.hover = true;
			this.hoverScience(dir, dir? link.from: link.to);	
		}
	}
};

bScienceNext_columns.prototype.calcSelectedScience = function(dir, sci){
	var list = new ScienceList();
	list.addElem(sci);

	var sciences = dir? sci.next: sci.require;
	for (var sciNext in sciences.getList()){
		sciNext = sciences.getElem(sciNext);
		if (this.data.all.hasElem(sciNext)){
			list = list.joinList(this.calcSelectedScience(dir, sciNext));
		}
	}

	return list;
};

bScienceNext_columns.prototype.calcSelectedSciences = function(){
	var list = new ScienceList();

	if (this.data.curScience != undefined) {
		var sci = Science.get(this.data.curScience);
		list = list.joinList(this.calcSelectedScience(true, sci));
		list = list.joinList(this.calcSelectedScience(false, sci));	
	}

	return list;
};

bScienceNext_columns.prototype.selectScienceLinks = function(dir, id){
	var self = this;

	var links = this.getLinksByDir(dir, id);
	for (var link in links){
		link = links[link];
		if (!link.active) {
			link.selected = true;
			this.selectScienceLinks(dir, dir? link.from: link.to);	
		}
	}
};
//показываем красное мигание 
bScienceNext_columns.prototype.showBlink = function(id, notFirst){
	if( !notFirst )
		this.setTimeout(this.hideBlink, 8000);
	else{
		var $sci = this.wrp.find('.science-sci[data-id='+id+']');

		if (!$sci.hasClass('-inQueue') && !$sci.hasClass('-active'))
			$sci.addClass('-blink');
	}

	var links = this.getLinksByDir(true, id);

	for (var link in links){
		link = links[link];

		if( !link.active ){
			this.wrp.find('.science-link[data-from='+link.from+'][data-to='+link.to+']').addClass('-blink');

			this.showBlink(link.from, true);	
		}
	}
};
//прячем мигание
bScienceNext_columns.prototype.hideBlink = function(){
	this.wrp.find('.science-sci, .science-link').removeClass('-blink');
};
//получаем список связей отфильтрованных по параметру .to
bScienceNext_columns.prototype.getLinksByDir = function(dirTo, id){
	var list = [];
	for (var link in this.data.links){
		link = this.data.links[link];
		if (link[dirTo? 'to': 'from'] == id){
			list.push(link)
		}
	}
	return list;
}
//пересчет размеров плашек
bScienceNext_columns.prototype.resizeSciencePannels = function(){
	utils.getElemSize(this.wrp, {callback: this.resizeScienceColumns.bind(this)});
};

bScienceNext_columns.prototype.resizeScienceColumns = function(){
	var self = this;

	//ресетим высоту колонок
	var $columns = this.wrp.find('.science-col');
	$columns.css({height: 'auto'});
	var heightTotal = Math.max($columns.height(), this.wrp.find('.science-columns').height());
	$columns.css({height: heightTotal});

	$columns.each(function(){
		var $col = $(this),
			//вычисляем доступную высоту
			sciences = $col.find('.science-sci'),
			heightAvail = heightTotal,
			sciencesNotActive;

		sciences.each(function(){
			heightAvail -= $(this).outerHeight();
		});

		//корректируем высоту плашек (не активных!)
		if( self.mode )
			sciencesNotActive = $col.find('.science-sci:not(.-active):not(.-inQueue):not(.-selected)');	
		else
			sciencesNotActive = $col.find('.science-sci:not(.-active):not(.-inQueue)');	

		var heightAvailNew = self.checkSciencePannelsSize(sciencesNotActive, heightAvail, 25, '-size-3');

		if( heightAvailNew == heightAvail )
			heightAvail = self.checkSciencePannelsSize(sciencesNotActive, heightAvail, 8, '-size-2');	
		else
			heightAvail = heightAvailNew;

		//выставляем отступы
		var margin = utils.toInt(heightAvail / (sciences.length + 1));
		$col.css({'padding-top': margin});
		sciences.css({'margin-bottom': margin});
	});
};

bScienceNext_columns.prototype.checkSciencePannelsSize = function(panels, availHeight, addHeight, cls){
		if (availHeight / panels.length >= addHeight){
			panels.addClass(cls);
			availHeight -= panels.length * addHeight;
		}
		return availHeight;
	};