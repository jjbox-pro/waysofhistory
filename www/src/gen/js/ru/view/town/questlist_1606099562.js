bQuestList = function(){
	bQuestList.superclass.constructor.apply(this, arguments);
	
	this.prepareData();
};

utils.extend(bQuestList, Block);


bQuestList.type = {img: 0, text: 1};

bQuestList.option = {};

bQuestList.option[bQuestList.type.img] = {
	itemHeight: 76,
	scrollSpeed: 200,
	list: '.quest-list',
	listWrp: '.quest-listWrp',
	tmpl: 'list'
};

bQuestList.option[bQuestList.type.text] = {
	itemHeight: 20,
	scrollSpeed: 40,
	list: '.quest-list-text',
	listWrp: '.quest-listTextWrp',
	tmpl: 'listText'
};

bQuestList.calcMaxHeight = function(itemHeight){
	return Math.max((utils.toInt(utils.getWindowHeight(-180)/itemHeight)*itemHeight)+10, itemHeight) + 'px';
};


bQuestList.prototype.calcName = function(){
	return 'questlist';
};

bQuestList.prototype.calcTmplFolder = function(){
	return tmplMgr.questlist;
};

bQuestList.prototype.getData = function(){
	var list = wofh.account.getActiveQuests(),
		questsPos = ls.getQuestsPos({}),
		newQuests = questsMgr.getNewQuests();

	//сортируем квесты
	for (var quest in list) {
		quest = list[quest];

		quest.pos = utils.toInt(questsPos[quest.id]);
		
		quest.finished = quest.getStatus() == Quest.status.bonus;
		
        quest.new = newQuests[quest.id] ? true : false;
		
		if( !list.hasFinished && quest.finished )
			list.hasFinished = true;
	}

	list.sort(function(a, b){
		var pos = b.finished - a.finished;
		
		if( !pos )
			pos = b.new - a.new;
		
		if( !pos )
			pos = b.pos - a.pos;
			
		return pos;
	});
	
	this.data.list = list;
	this.data.listType = this.listType;
	this.data.itemHeight = bQuestList.option[bQuestList.type.img].itemHeight;
	
	this.dataReceived();
};

bQuestList.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accQuests] = 
	this.notif.other[Notif.ids.accQuestViewed] = this.refresh;
};

bQuestList.prototype.canDisplay = function(){
	return this.data.list.length > 0;
};

bQuestList.prototype.bindEvent = function(){
	this.wrp.on('click', '.js-quest-link', function(){
		var id = +$(this).data('id');
		
		var wnd = wndMgr.getWndByType(wQuestInfo)[0];
		
		if (wnd && wnd.id == id)
			wnd.close();
		else
			wndMgr.addWnd(wQuestInfo, id);
	});
	
	this.bindActionEvent();
};

bQuestList.prototype.afterDraw = function(){
	this.checkMove();

	this.togglePos();
};

bQuestList.prototype.bindActionEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-quest-roll', function(){
			ls.setQuestListView(utils.toInt(!self.listType));
			
			self.prepareData();

			self.show();

			self.togglePos();
			self.checkMove();
		})
		// Листалка
		.on('mousedown', '.quest-btn.-type-up', function(){
			self.startMoveList(1);
		})
		.on('mousedown', '.quest-btn.-type-down', function(){
			self.startMoveList(-1);
		})
		.on('wheel', function(e){
			var scrollVal;

			if( (e.originalEvent.wheelDelta||-e.originalEvent.deltaY) > 0 ){
				if( self.showUp )
					scrollVal = 1;
			}
			else if( self.showDown ){
				scrollVal = -1;
			}

			if( scrollVal ){
				self.listDisp = scrollVal;
				self.moveList();
			}

			return false;
		})
		.on('touchstart', function(e){
			self.lastTouch = e.originalEvent.touches[0].clientY;
		})
		.on('touchmove', function(e){
			self.curTouch = e.originalEvent.touches[0].clientY;

			self.listDisp = 0;

			var scrollVal = self.curTouch - self.lastTouch;

			if( scrollVal > 0 ){
				if( self.showUp )
					self.listDisp = 0.5/*-scrollVal*/;
			}
			else if( self.showDown ){
				self.listDisp = -0.5/*-scrollVal*/;
			}

			if( self.listDisp ){
				self.moveList();
			}

			self.lastTouch = self.curTouch;

			return false;
		})
		.on('mouseup', '.quest-btn', function(){
			self.startMoveList(0);
		});
};


bQuestList.prototype.prepareData = function(){
	this.listType = this.getListView(); // Вид списка

	this.tmplList = bQuestList.option[this.listType].tmpl;

	this.qListClass = bQuestList.option[this.listType].list;
	this.qListWrpClass = bQuestList.option[this.listType].listWrp;

	this.itemHeight = bQuestList.option[this.listType].itemHeight;
	this.scrollSpeed = bQuestList.option[this.listType].scrollSpeed;
	this.scrollTop = 0;
};

bQuestList.prototype.getListView = function(){
	return ls.getQuestListView(bQuestList.type.img);
};

bQuestList.prototype.togglePos = function(toggle){
	if( !this.cont )
		return;
	
	if( wofh.account.isAdmin() ) 
		toggle = ls.getSMenuShow(true) || ls.getAdminShow(true) || ls.getAdminAdditionShow(true);
	else  
		toggle = toggle === undefined ? this.parent.systmenu.isExpanded() : toggle;

	this.cont.toggleClass('-rightDisp', toggle);
};

bQuestList.prototype.startMoveList = function(val){
	clearInterval(this.butInterv);

	this.listDisp = val;

	if( val ){
		this.moveList();

		this.butInterv = setInterval(this.moveList.bind(this), this.scrollSpeed);
	}
};

bQuestList.prototype.moveList = function(){
	var el = this.cont.find(this.qListClass);
	var elWrp = this.cont.find(this.qListWrpClass);

	this.scrollTop += this.listDisp * this.itemHeight;

	el.offset({top: elWrp.offset().top + this.scrollTop});

	this.checkMove();
};

bQuestList.prototype.checkMove = function(){
	var el = this.cont.find(this.qListClass);
	var elWrp = this.cont.find(this.qListWrpClass);

	this.showUp = this.scrollTop < 0;
	this.showDown = this.scrollTop > elWrp.height() - el.height();

	this.cont.find('.quest-btn.-type-up').toggleClass('-disabled', !this.showUp);
	this.cont.find('.quest-btn.-type-down').toggleClass('-disabled', !this.showDown);

	if (!this.showUp || !this.showDown){
		this.startMoveList(0);
	}
};