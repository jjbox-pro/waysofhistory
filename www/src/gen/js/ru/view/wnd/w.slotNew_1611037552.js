wSlotNew = function(id, data){
	wSlotNew.superclass.constructor.apply(this, arguments);
};

utils.extend(wSlotNew, wSlot);

WndMgr.regWnd('slot', wSlotNew);


wSlotNew.prepareData = function(id, extData){
    var data = wSlot.prepareData(id, extData);
	
    if( !data )
        return false;
    
    extData = extData||{};
	
	data.slot = data.town.slots.getElem(data.id);
	
	if( data.slot ){
		if( extData.forceOpen ){
            data.forceOpen = extData.forceOpen;
            
			return data;
        }
        else if( wSlot.selectType(data.id, data.town) == wSlotNew )
			return data;
	}
	
	return false;
};


wSlotNew.prototype.calcName = function(){
    this.hashName = 'slot';
    
	return 'slotnew';
};

wSlotNew.prototype.initWndOptions = function(){
    wSlotNew.superclass.initWndOptions.apply(this, arguments);
    
    this.options.hasReqData = workerMgr.isActive();
    
    if( this.data.forceOpen )
		this.options.setHash = false;
};

wSlotNew.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accTownBonus, Notif.ids.accFutureBuilds, Notif.ids.townRes];
};

wSlotNew.prototype.getData = function(){
	// Допустимые постройки
	this.data.builds = this.data.slot.getAvailBuilds();
	
	this.data.builds.joinList(this.data.slot.calcFutureBuilds()); // Постройки, доступные при изучении пары наук	
	// Считаем вкладки
	this.data.tabs = this.calcTabs(this.data.builds);
	
	this.dataReceived();
};

wSlotNew.prototype.afterDataReceived = function(){
	wSlotNew.superclass.afterDataReceived.apply(this, arguments);
	
	notifMgr.runEvent(Notif.ids.townResUpd);
};

wSlotNew.prototype.bindEvent = function(){
	var self = this;
    
	//выбор вкладки
	this.wrp
		.on('click', '.js-slotNew-tab', function(){
			self.activeTab = $(this).data('group');
			
			ls.setSlotNewTab(self.activeTab);
			
			self.showBuild();
			self.filter();
		})
		//отключение несовместимых
		.on('click', '.js-slotNew-conflictBtn', function(){
			self.hideConflict = !self.hideConflict;
			
			ls.setSlotNewConflict(self.hideConflict);
			
			self.filter();
		})
		.on('click', '.js-slotNew-canBuildBtn', function(){
			self.wrp.find('.js-slotNew-canBuildBtn').toggleClass('-hidden');
			
			self.hideCantBuild = !self.hideCantBuild;
			
			self.filter();
		})
		//выбор строения
		.on('click', '.js-slotNew-item', function(){
			self.buildId = $(this).data('id');
			self.showBuild(self.buildId);
		})
		//строим постройку
		.on('click', '.js-slotbld-build', function(){
			var slot = self.data.newSlot.clone().setLevel(0);
			
			if (slot.canBuildErr() == Slot.buildErr.ok) {
				var conflicts = slot.getConflictsInTown();
				
				if (!conflicts.isEmpty())
					wndMgr.addConfirm(conflicts.hasTrainings() ? 'Внимание. По окончании строительства строения конкурирующие с новым зданием в этом городе будут выключены и перестанут выполнять свои функции.<br>Все обучающиеся в них войска, в том числе поселенцы и рабочие, исчезнут навсегда и безвозвратно' : 'Внимание. По окончании строительства строения конкурирующие с новым зданием в этом городе будут выключены и перестанут выполнять свои функции.').onAccept = function(){
						reqMgr.slotBuild(self.data.slot, self.buildId);
						
						self.close();
					};
				else{
					reqMgr.slotBuild(self.data.slot, self.buildId);
					
					self.close();
				}
			}
		})
		// Заявка на ресы для домика
		.on('click', '.slotnew-cost-makeOrder', function(){
			var slot = self.data.newSlot.clone().setLevel(0);
			
			hashMgr.showWnd('countryMakeOrder', slot.getPos(), {slot: slot});
		})
		//бонус
		.on('click', '.slotnew-addBonus', function(){
			self.close();
			
			var type = LuckBonus.ids.production,
				town = self.data.slot.getTown(wofh.town),
				bonus = town.getLuckBonus(type);

			wBonusTakeNow.show(bonus);
		});
};

wSlotNew.prototype.afterContSet = function(){
    this.contIn = this.wrp.find('.view-'+this.name);
};
//фильтрация построек
wSlotNew.prototype.afterDraw = function(){
    // если доступное строение одно, то показываем его
    this.checkSingleBuild();
	
	this.filter();
	
	this.initScroll({cls:'.slotnew-list-wrp', dir: 'left'});
};

	
wSlotNew.prototype.calcTabs = function(builds){
	var tabs = [];
	
	this.hideConflict = ls.getSlotNewConflict(true);
	this.hideCantBuild = false;
	this.activeTab = ls.getSlotNewTab(Slot.tabIds.all);
	this.expanded = false;
	
	var findTab = false;
	
	for (var build in builds.getList()) {
		build = builds.getElem(build);
	
		var typeGroups = build.getTabs();
        build.tabs = typeGroups
		
        for (var typeGroup in typeGroups) {
            typeGroup = typeGroups[typeGroup];
            
            tabs[typeGroup] = true;
            if (typeGroup == this.activeTab) {
                findTab = true;
            }
        }
	}
	if (!findTab) {
		if (utils.sizeOf(tabs) == 1) {
			for (var i in tabs) {
				this.activeTab = +i;
				break;
			}
		}
		if (utils.sizeOf(tabs) > 1) {
			this.activeTab = +Slot.tabIds.all;
		}
	}    
	
	return tabs;
};

//если доступное строение одно, то показываем его
wSlotNew.prototype.checkSingleBuild = function(){
	//единственная постройка
	var singleBuild;
	
	for (var build in this.data.builds.getList()) {
		build = this.data.builds.getElem(build);
		
		if( !build.needScience ){
			if( !singleBuild )
				singleBuild = build;
			else
				return;
		}
	}
	
	if( singleBuild )
		this.showSingleBuild(singleBuild);
};

wSlotNew.prototype.checkConflictCount = function(){
	var count = this.wrp.find('.js-slotNew-item').filter(function(){
		return !!$(this).data('conflict');
	}).length;
	
	this.wrp.find('.js-slotNew-conflictBtn').toggleClass('-hidden', !count);
	
	return count;
};
//фильтрация построек
wSlotNew.prototype.filter = function(){
	var self = this;
	
	this.wrp.find('.js-slotNew-tab').each(function(){
		var el = $(this);
		
		el.toggleClass('-active', el.data('group') == self.activeTab || self.activeTab == 0);
	});
	
	var hideConflict = this.checkConflictCount() ? this.hideConflict : false;
	
	this.wrp.find('.js-slotNew-conflictBtn').toggleClass('-active', hideConflict);
	
	this.wrp.find('.js-slotNew-item').each(function(){
		var el = $(this);
        var elGroups = el.data('group').split(',');
        for (var i in elGroups) {elGroups[i] = +elGroups[i];}
        
		el.toggleClass('-hidden', 
				(hideConflict && el.data('conflict')) || 
				(self.hideCantBuild && el.data('cantbuild')) || 
				(self.activeTab != 0 && !utils.inArray(elGroups, self.activeTab) ));
	});
	
	this.clearBuildSelection();
};

wSlotNew.prototype.showSingleBuild = function(singleBuild){
	this.buildId = singleBuild.id;
	
	delete this.build;
	
	this.showBuild(this.buildId);
};

wSlotNew.prototype.showBuild = function(buildId){
    if( typeof(buildId) == 'undefined' ){
        this.contIn.removeClass('-expanded');
		
        delete this.build;
    } 
	else{
        var build = new Slot(buildId, 1, undefined, undefined, undefined, undefined, this.data.slot.getTown(wofh.town));
		
        //открытие вкладки
        if( !utils.inArray(build.getTabs(), this.activeTab) ){
        	this.activeTab = build.getTabs()[0];
			
        	this.filter();
        }

        //перезагрузка подробных данных
        if( !this.build || this.build.getId() != build.getId() ){
            this.data.newSlot = build;
			
            this.cont.find('.js-slotNew-info').html(this.tmpl.build({slot: this.data.newSlot, tab: build.getTabs()[0]}));
        }

        //раскрытие правой панели
        if( !this.build )
            this.expanded = true;
        else
            this.expanded = this.build.getId() == build.getId() ? !this.expanded : true;
        
        this.contIn.toggleClass('-expanded', this.expanded);

        //выделение элемента списка
        this.clearBuildSelection();
		
        if( this.expanded )
            this.cont.find('.js-slotNew-item[data-id="'+buildId+'"]').addClass('-active');

        this.build = build;
    }
};
	
wSlotNew.prototype.clearBuildSelection = function() {
	this.cont.find('.js-slotNew-item').removeClass('-active');
}
		
wSlotNew.prototype.getConflictWnd = wSlotNew.prototype.getIdentWnd;