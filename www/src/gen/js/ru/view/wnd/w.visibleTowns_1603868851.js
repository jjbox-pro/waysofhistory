wVisibleTowns = function(){
	wVisibleTowns.superclass.constructor.apply(this, arguments);
};

utils.extend(wVisibleTowns, Wnd);

WndMgr.regWnd('visibleTowns', wVisibleTowns);


wVisibleTowns.prototype.calcName = function(){
	return 'visibleTowns';
};

wVisibleTowns.prototype.calcChildren = function(){
	this.children.view = bVisibleTowns_view;
};



bVisibleTowns_view = function(id, data){
	this.name = 'view';
	
	bVisibleTowns_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bVisibleTowns_view, Block);


bVisibleTowns_view.prototype.calcName = function(){
	return 'view';
};

bVisibleTowns_view.prototype.initOptions = function(){
	bVisibleTowns_view.superclass.initOptions.apply(this, arguments);
	
	this.options.hasReqData = true;
};

bVisibleTowns_view.prototype.getData = function(){
	var self = this;
	
	this.loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0, 
		function(){
			self.setTimeout(function(){
				this.data.json = JSON.stringify(wofh.town.cloneBase(), undefined, 2);
				
				this.dataReceived();
			}, 1000);
		}
	);
};


bVisibleTowns_view.prototype.bindEvent = function(){
	this.wrp.on('focus', '.visibleTowns-textarea', function(){
		$(this).select();
	});
};

bVisibleTowns_view.prototype.afterShow = function(){
	contentLoader.stop(this.loaderId);
};