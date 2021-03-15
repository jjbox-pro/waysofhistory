bScreenPage_luck = function(){
	bScreenPage_luck.superclass.constructor.apply(this, arguments);
};

utils.extend(bScreenPage_luck, ScreenPage);


bScreenPage_luck.prototype.calcName = function(){
	return 'luck';
};

bScreenPage_luck.prototype.addNotif = function(){
    if( !this.canDisplay() )
        this.notif.show.push({id: Notif.ids.accQuests, params: [Quest.ids.luckBonus, Quest.ids.bldImm]});
	
	bScreenPage_luck.superclass.addNotif.apply(this, arguments);
};

bScreenPage_luck.prototype.calcChildren = function(){
	this.children.other = bScreenPage_luck_other;
};

bScreenPage_luck.prototype.setSelect = function(){
	bScreenPage_luck.superclass.setSelect.apply(this, arguments);
	
	this.checkChest();
};


bScreenPage_luck.prototype.checkChest = function(){
    if( !this.wrp )
        return;
    
	var selected = this.isSelected();
	
	if( selected )
		this.setTimeout(function(){
			this.cont.find('.screenPage-luck-chest').attr('href', hashMgr.getWndHref('chest'));
		}, wndMgr.swipeTime);
	else
		this.cont.find('.screenPage-luck-chest').removeAttr('href');
};



	bScreenPage_luck_other = function(){
		bScreenPage_luck_other.superclass.constructor.apply(this, arguments);
	};
	
	utils.extend(bScreenPage_luck_other, Block);
	
	
	bScreenPage_luck_other.prototype.calcName = function(){
		return 'other';
	};
	
	bScreenPage_luck_other.prototype.calcTmplFolder = function(){
		return tmplMgr.screenPage.luck.galaxy;
	};
	
	bScreenPage_luck_other.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.accChest];
	};
	
	bScreenPage_luck_other.prototype.canDisplay = bMMenu_luck.prototype.canDisplayDayprize;
	
	bScreenPage_luck_other.prototype.afterDraw = function(){
		this.parent.checkChest();
	};