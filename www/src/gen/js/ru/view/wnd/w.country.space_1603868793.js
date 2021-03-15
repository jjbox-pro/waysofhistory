wCountrySpace = function(){
	wCountrySpace.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountrySpace, Wnd);

WndMgr.regWnd('countrySpace', wCountrySpace);


wCountrySpace.prototype.calcName = function(){
	return 'countrySpace';
};

wCountrySpace.prototype.calcChildren = function(){
	this.children.view = bCountrySpace_view;
};



bCountrySpace_view = function(){
	bCountrySpace_view.superclass.constructor.apply(this, arguments);
};

utils.extend(bCountrySpace_view, Block);


bCountrySpace_view.prototype.calcName = function(){
	return 'view';
};

bCountrySpace_view.prototype.getData = function(){
    var self = this;
    
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'),
		0,
		function(){
			reqMgr.getSpaceshipsState(function(resp){
				contentLoader.stop(loaderId);
				
				self.data.win = false;
				self.data.otherShips = [];
				self.data.goesShips = [];
				
				for(var spaceship in resp.list){
					spaceship = resp.list[spaceship];
					
					if( spaceship.country.id == wofh.country.id ){
						if( spaceship.status == Build.spaceship.goes ){
							var isCourseStable = spaceship.time+lib.spaceship.launchtime <= timeMgr.getNow();
							
							if( wofh.global.win ){
								if( isCourseStable ){
									spaceship.status = Build.spaceship.win;
									
									self.data.otherShips.push(spaceship);
									
									continue;
								}
							}
							else if( !self.data.win )
								self.data.win = isCourseStable;
							
							self.data.goesShips.push(spaceship);
						}
						else
							self.data.otherShips.push(spaceship);
					}
				}

				self.dataReceived(); 
			});
		} 
	);
};

bCountrySpace_view.prototype.bindEvent = function(){
    var self = this;
	
    this.wrp
		.on('submit', '.countrySpace-win', function(){
			var form = utils.urlToObj($(this).serialize());
			
			if( self.loaderId )
				return false;
			
			self.loaderId = contentLoader.start( 
				self.cont.find('.js-button-win'), 
				0, 
				function(){
					reqMgr.win(form.message, function(){
						contentLoader.stop(self.loaderId, true);
						
						self.close();
						
						var wnd = wndMgr.getFirstWndByType(wCountry);
						
						if( wnd )
							wnd.show();
					});
				},
				{icon: ContentLoader.icon.short, animationTime: 60000, cssPosition: {right: -35, top: 15}, callback:function(){delete self.loaderId;}} 
			);
			
			return false;
		});
};