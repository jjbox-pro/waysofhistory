utils.overrideMethod(tabOptGeneral, 'addNotif', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.notif.other[Notif.ids.mobToggleBars] = function(data){
		if( this.wrp && !data.byOpt )
			this.wrp.find('.switcher-input[name="hideBar"]').prop('checked', data.hide);
	};
});

utils.overrideMethod(tabOptGeneral, 'bindEvent', function __method__(){
	__method__.origin.apply(this, arguments);
	
	this.wrp
			.on('change', '.switcher-input[name="hideBar"]', function(){
				wndMgr.toggleBars($(this).prop('checked'), true);
			})
			.on('change', '.switcher-input[name="smoothMapScroll"]', function(){
				ls.setSmoothMapScroll($(this).prop('checked'));
			})
            .on('change', '.options-wndSwipeTime', function(){
                wndMgr.setWndSwipeTime($(this).val());
            })
            .on('change', '.options-barAnimTime', function(){
                wndMgr.setBarAnimTime($(this).val());
            });
            
    this.bindEventExt();
});

tabOptGeneral.prototype.bindEventExt = function(){
    this.wrp
			.on('change', '.switcher-input[name="menuSide"]', function(){
				wndMgr.toggleMenuSide($(this).val());
			})
			.on('change', '.switcher-input[name="noNavBar"]', function(){
				ls.setNoNavBar($(this).prop('checked'));
				
				if( ls.getNoNavBar(debug.isMobileApp()) )
					wndMgr.closeNavBar();
				else
					wndMgr.addNavBar(wndMgr.getTopWnd());
			})
			.on('change', '.switcher-input[name="oldTown"]', function(){
				ls.setOldTown($(this).prop('checked'));
				
				notifMgr.runEvent(Notif.ids.mobTownChildren);
			});
};