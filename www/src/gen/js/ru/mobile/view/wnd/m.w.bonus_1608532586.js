bBonus_info.prototype.getSpecialistEventCls = function(){
	return '.bonus-town-specialist';
};

utils.overrideMethod(bBonus_info, 'activateBonus', function __method__($el, event){
	// Если клик (активация бонуса) произашёл сразу после раскрытия доп. информации, 
	// игнорируем его, т.к. в таком случае происходит смещение тега ссылки и "неожиданное" открытие окна подтверждения бонуса
	if( Math.abs((this.toggleTimeStamp||0) - event.timeStamp) < 0.5 )
		return;
	
	__method__.origin.apply(this, arguments);
});

utils.overrideMethod(bBonus_info, 'togglePopup', function __method__($cell, toggle, opt){
	opt = opt||{};
	
	if( opt.event ){
		if( $cell.hasClass('-active') )
			delete this.toggleTimeStamp;
		else
			this.toggleTimeStamp = opt.event.timeStamp;
	}
	
	__method__.origin.apply(this, arguments);
});





utils.reExtend(wBonusTakeNow, ModalWnd);