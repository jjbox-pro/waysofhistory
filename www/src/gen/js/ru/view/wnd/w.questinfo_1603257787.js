wQuestInfo = function(){
	wQuestInfo.superclass.constructor.apply(this, arguments);
};

utils.extend(wQuestInfo, Wnd);

WndMgr.regWnd('quest', wQuestInfo);


wQuestInfo.prepareData = function(id){
	if( id == +id ) {
		var quest = new Quest(+id);
		
		if( quest.isInvalid() )
			return false;
		
		if( !wofh.account.isAdmin() && !quest.isStatusActive() && !quest.isStatusBonus() && !quest.isDelayed() )
			return false;
		
		notifMgr.runEvent(Notif.ids.accQuestViewedMgr, quest.id);
		
		return {quest: quest};
	} 
	else
		return false;
};


wQuestInfo.prototype.calcName = function(){
    this.hashName = 'quest';
    
	return 'questinfo';
};

wQuestInfo.prototype.initWndOptions = function(){
	wQuestInfo.superclass.initWndOptions.apply(this, arguments);
	
	this.options.canClose = this.id != 0;
};

wQuestInfo.prototype.addNotif = function(){
	this.notif.other[Notif.ids.accQuests] = this.notifAccQuests;
};

wQuestInfo.prototype.bindEvent = function(){
	var self = this;
	
	//забор награды
	this.wrp
		.on('click', '.qinf-getPrize', function(){
		
		var data = {};

		//проверка на переполнение склада
		var resList = self.data.quest.getBonusRes().clone();
		resList.addList(wofh.town.stock.getHasList().excludeFood());
		data.res = resList.getMaxCount() > wofh.town.stock.max;

		//проверка на перенас
		data.pop = self.data.quest.getBonusPop() > wofh.town.pop.culture - wofh.town.pop.has;

		if (data.res || data.pop) {
			wndMgr.addConfirm(tmplMgr.questinfo.confirm(data)).onAccept = function(){self.getPrize();};
		} else {
			self.getPrize();
		}
	})
		//откладывание
		.on('click', '.js-toggleDelay', function(){
			wndMgr.addConfirm('Ты действительно хочешь скрыть это задание? Знай, что его можно будет завершить и получить награду, но его не будет в списке всех заданий до полного выполнения.').onAccept = function(){
				var callback = notifMgr.runEvent.bind(notifMgr, Notif.ids.accQuestsMgr, {changes: [self.data.quest.id]});

				if ( self.data.quest.isDelayed() )
					self.data.quest.removeFromDelayed(callback);
				else
					self.data.quest.addToDelayed(callback);
				
				self.close();   
			};
		})
		.on('submit', '.qinf-form', function(){
			var formData = utils.urlToObj($(this).serialize()),
				result = self.checkAnswer(formData);

			self.cont.find('.qinf-form-alert').toggleClass('-hidden', result);
			
			if( result )
				reqMgr.questComplete(self.data.quest);

			return false;
		});
};

wQuestInfo.prototype.afterDraw = function(){
	snip.input1Handler(this.cont, {spinbox: {}});
	
	this.initScroll({scrollbarPosition: 'outside'});
};


wQuestInfo.prototype.checkAnswer = function(formData) {
	switch (+this.id){
		case Quest.ids.buildInfo: 
			return parseInt(formData.questdata) == utils.toFixed(new Slot(4, 20).getEffect() * 24);
		case Quest.ids.referCost: 
			return parseInt(formData.questdata) == lib.luckbonus.referalsbonus;
		case Quest.ids.mathPrice: 
			return parseInt(formData.questdata) == new Science(18).getCost();
		case Quest.ids.day01092009: 
			return parseInt(formData.day) == 1 && parseInt(formData.month) == 9;
		case Quest.ids.unitInfo: 
			return parseInt(formData.questdata) == new Unit(12).getCost().getCount(Resource.ids.wood);
	}
};

wQuestInfo.prototype.getPrize = function() {
	var self = this;
	
	this.close();
	
	reqMgr.questGetPrize(this.data.quest, function(){
		// Скрываем панель после прохождения квеста на постройку алтаря
		if( self.data.quest.id == Quest.ids.bldAltair1 )
			self.hideSystmenu();
	});
};


wQuestInfo.prototype.hideSystmenu = function(){
	wndMgr.doInf('systmenu.toggleExpand', [false]);
};

wQuestInfo.prototype.notifAccQuests = function(){
	if( !this.data.quest.isStatusActive() && !this.data.quest.isStatusBonus() && !this.data.quest.isDelayed() )
		this.close();
	else
		this.show();
};