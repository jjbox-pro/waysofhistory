pClock = function(){
	pClock.superclass.constructor.apply(this, arguments);
};


utils.extend(pClock, Block);

pClock.prototype.calcName = function(){
	return 'clock';
};

pClock.prototype.calcTmplFolder = function(){
	return tmplMgr.clock;
};

pClock.prototype.bindEvent = function(){
	var self = this;

	this.wrp
		.on('click', '.clock-timerWrp', function(){
			if( self.cont.hasClass('-extended') )
				self.cont.removeClass('-extended');
			else{
				self.cont.addClass('-extended');
				
				self.cont.find('.clock-select').focus();
			}
		})
		.on('change', '.clock-select', function(){
			reqMgr.setTimeZone(+$(this).val(), function(){
				appl.reload();
			});
		})
		.on('focusout', '.clock-select', function(){
			self.setTimeout(function(){
				this.cont.removeClass('-extended');
			}, 100);
		});
};