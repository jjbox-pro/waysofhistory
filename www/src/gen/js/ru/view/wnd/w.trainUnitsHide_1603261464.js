wTrainUnitsHide = function(){
	wTrainUnitsHide.superclass.constructor.apply(this, arguments);
};

utils.extend(wTrainUnitsHide, Wnd);

WndMgr.regWnd('trainUnitsHide', wTrainUnitsHide);


wTrainUnitsHide.prepareData = function(id, extData) {
	if( !wofh.account.isPremium() ){
		servBuffer.getTemp().hiddenUnits = {};
		
		LS.saveServStorage();
		
		notifMgr.runEvent(Notif.ids.townTrainUnitsHide);
		
		return false;
	}
	
	return {};
};


wTrainUnitsHide.prototype.calcName = function(){
	return 'trainUnitsHide';
};

wTrainUnitsHide.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('change', '.js-hideUnits', function(){
			$(this)	.closest('.trainUnitsHide-era')
					.find('.trainUnitsHide-units .js-hideUnit')
					.prop('checked', $(this).prop('checked'))
					.trigger('change');	
		})
		.on('change', '.js-hideUnit', function(){
			$(this).closest('.trainUnitsHide-unit').toggleClass('-type-hidden', !$(this).prop('checked'));
		})
		.on('submit', '.trainUnitsHide-form', function(){
			var hiddenUnits = {};
			
			$(this).find('.js-hideUnit:not(:checked)').each(function(){
				hiddenUnits[$(this).attr('name')] = 1;
			});
			
			servBuffer.getTemp().hiddenUnits = hiddenUnits;
			
			LS.saveServStorage();
		
			notifMgr.runEvent(Notif.ids.townTrainUnitsHide);
			
			self.close();
			
			return false;
		});
};

wTrainUnitsHide.prototype.afterDraw = function(){
	this.wrp.find('.trainUnitsHide-era').each(function(){
		$(this).find('.js-hideUnits').prop('checked', !!$(this).find('.js-hideUnit:checked').length);
	});
};