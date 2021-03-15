wNoPremium = function(){
	wNoPremium.superclass.constructor.apply(this, [tmplMgr.nopremium()]);
};

utils.extend(wNoPremium, ConfirmWnd);


wNoPremium.prototype.setButtonsText = function(){
	wNoPremium.superclass.setButtonsText.apply(this, arguments);
	
	this.options.okText = 'Включить';
};

wNoPremium.prototype.onAccept = function(){
	reqMgr.addBonus(LuckBonus.ids.accountPremium, 'add', wofh.town.id);
};
            