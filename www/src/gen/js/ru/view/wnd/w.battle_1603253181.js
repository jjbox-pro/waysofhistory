wBattle = function(){
	wBattle.superclass.constructor.apply(this, arguments);
	
	delete this.id;
};

utils.extend(wBattle, Wnd);

WndMgr.regWnd('battle', wBattle);


wBattle.prepareData = function(id, extData){
	var data = id ? {link:decodeURIComponent(id)} : false;
	
	if( data ){
		var urlObj = utils.urlToObj2(data.link),
			params = urlObj.get;
		
		data.session = params.session;
		data.replay = params.replay && !params.simulation;
		data.town = params.town;
		
		if( wBattle.preparePlatformData(urlObj, params, extData) ) return false;
	}
	
	return data;
};

wBattle.preparePlatformData = function(urlObj, params, extData){
	return false;
};


wBattle.prototype.calcName = function(){
	return 'battle';
};

wBattle.prototype.initWndOptions = function(){
	wBattle.superclass.initWndOptions.apply(this, arguments);
    
    this.options.moving = false;
	this.options.noCloseAll = true;
	this.options.showMinimize = true;
};

wBattle.prototype.show = function(){
	if( this.wasDrawn() )
		return;
	
	wBattle.superclass.show.apply(this, arguments);
};

wBattle.prototype.getData = function(){
	// Проверка на симуляцию боя 
	if( this.data.session ){
		if( this.data.town ){
			this.data.town = wofh.world.getTown(this.data.town);
		}
		else{
			var battleList = wofh.events.getTownBattles().getList();
			
			// Определяем город у которого идет бой
			for( var battle in battleList ){
				battle = battleList[battle];
				
				if( battle.key == this.data.session ){
					this.data.town = wofh.world.getTown(battle.town2);
					
					break;
				}
			}
		}
	}
	
	this.dataReceived();
};

wBattle.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp.on('click', '.js-battle-fullScreen', function(){
		if( $(this).hasClass('-active') ){
			utils.unsetFullScreen(self.cont.find('.js-fullScreen'));
			
			$(this).removeClass('-active');
		}
		else{
			utils.setFullScreen(self.cont.find('.js-fullScreen'));
			
			$(this).addClass('-active');
		}
	});
};

wBattle.prototype.afterDraw = function(){
	this.stopTown();
};

wBattle.prototype.resize = function(){
	this.wrp.find('.view-battle').width( utils.getDocWidth(-5, 0) ).height( utils.getDocHeight(-40, 0) );
};

wBattle.prototype.escClose = function() {
	if( !this.wrp.hasClass('-state-minimized') )
		this.minimize(this.wrp.find('.wnd-button-minimize'));
};

wBattle.prototype.onClose = function(){
	this.startTown();
	
	this.wrp.find('.battle-frame').remove();
};

wBattle.prototype.beforeClose = function(result) {
	var self = this;

	if( this.data.session && !result ){
		wndMgr.addConfirm('Закрывая окно ты не прекращаешь бой. Ты в любой момент можешь посмотреть на протекающий бой в своих Военных делах.<br>Продолжить?').onAccept = function(){
			self.close(true);
		};

		return true;
	}
};

wBattle.prototype.getIdentWnd = function() {
	wndMgr.getFirstWndByType(wBattle).beforeClose = function(){};
	
	return false;
};

wBattle.prototype.setAutoPos  = function() {
	// Смещаем окно в левый верхний угол
	this.defaultPos = {top:0, left:0};
	
	wBattle.superclass.setAutoPos.apply(this, arguments);
};


wBattle.prototype.minimize = function($el) {
	if( !this.wrp.hasClass('-state-minimized') )
		this.startTown();
	
	wBattle.superclass.minimize.apply(this, arguments);
};

wBattle.prototype.onEndMinimize = function() {
	if( !this.wrp.hasClass('-state-minimized') )
		this.stopTown();
};


wBattle.prototype.setFrameFocus = function(){
	this.wrp.find('.battle-frame').get(0).contentWindow.focus();
};

wBattle.prototype.stopTown = function(){
	if( wndMgr.interfaces.town )
		wndMgr.interfaces.town.stopTown();
	else
		tooltipMgr.hide();
	
	this.setFrameFocus();
};

wBattle.prototype.startTown = function(){
	if( wndMgr.interfaces.town )
		wndMgr.interfaces.town.startTown();
	else
		tooltipMgr.hide();
};