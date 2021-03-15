utils.overrideMethod(TooltipMgr, 'bind', function __method__(){
	__method__.origin.apply(this, arguments);
	
	var self = this;
	
	wndMgr.$document
	   .on('mousemove tooltip-show', '.s-tbl th, .btnTbl-text', function(event, externalEvent){
		   var $target = $(this);
		   
		   if( utils.isEclipsed($target.get(0)) )
			self.textHandler($target, event, externalEvent);
	   })
	   .on('touchstart', function(event){
		   self.hide({event:event});
	   });
	
	wndMgr.cont.on('touchstart touchmove touchend', '.tooltip-cnt', function(e){
		var $this = $(this);
		
		if( $this.hasClass('-type-noTouch') )
			return;
		
		if( tooltipMgr.wnd )
			tooltipMgr.wnd.onContHover(e, $this);
		else if( e.cancelable )
			e.preventDefault(); // Отменяем действие по умолчанию. Иначе проходит клик по элементу, который находится под тултипом
		
		tooltipMgr.hide();
	});
});

utils.overrideMethod(TooltipMgr, 'preparePosSqr', function __method__(){
	var posSqr = __method__.origin.apply(this, arguments);
	
	if( this.$target ){
		var dataPosSqr = this.$target.data('tooltip-possqr');
		
		if( typeof(dataPosSqr) == 'string' ){
			try{
				dataPosSqr = JSON.parse(dataPosSqr);
			}
			catch(e){
				return posSqr;
			}
		}
		
		utils.copy(posSqr, dataPosSqr);
	}
	
	return posSqr;
});

TooltipMgr.prototype.bindVoiceHelper = function(){};

TooltipMgr.prototype.prepareVoiceHelper = function(){};

TooltipMgr.prototype.cleanVoiceHelper = function(){};