wQuestInfo.prototype.initWndOptions = function(){
	wQuestInfo.superclass.initWndOptions.apply(this, arguments);
	
	this.options.noBlur = true;
	this.options.canClose = this.id != 0;
};

wQuestInfo.prototype.modifyCont = function(){
	this.cont.find('.qinf-text').prepend(this.cont.find('.qinf-giver-wrp'));
	
	this.$textWrp = this.cont.find('.qinf-text-wrp');
	
	this.$prizeWrp = this.cont.find('.qinf-prize');
};

wQuestInfo.prototype.afterShow = function(firstShow){
	if( firstShow )
		this.setTimeout(function(){
			this.scrollIntoWrp(this.wrp.find('.qinf-getPrize'));
		}, wndMgr.swipeTime + 50);
};

wQuestInfo.prototype.getConflictWnd = wQuestInfo.prototype.getIdentWnd;


wQuestInfo.prototype.setSize = function(){
	wQuestInfo.superclass.setSize.apply(this, arguments);
	
	this.$textWrp.css({'min-height': this.$contWrp.height() - this.$prizeWrp.height()});
};

wQuestInfo.prototype.onTop = function(){
	// Закрываем все окна квестов кроме текущего
	var list = wndMgr.getWndByType(this.constructor);
	
	for(var wnd in list){
		if( list[wnd] == this ){
			list.splice(wnd, 1);
			
			break;
		}
	}
	
	wndMgr.closeWndList(list);
};


wQuestInfo.prototype.hideSystmenu = function(){};