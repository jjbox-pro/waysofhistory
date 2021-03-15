wChest = function(){
	this.name = 'chest';
	
	wChest.superclass.constructor.apply(this, arguments);

	this.options.moving = false;
	this.options.setHash = false;

	this.tmplWrp = false;
};
	
	utils.extend(wChest, Wnd);
	
	WndMgr.regWnd('chest', wChest);
	
	
	wChest.prototype.bindEvent = function(){
		var self = this;
		
		if ( !utils.isTouchDevice() ){
			//эмуляция наведения - нужна т.к. область наведения меньше размера объекта
			this.wrp.on('mouseenter', '.chest-hover', function(){
				self.wrp.find('.chest-view').addClass('-hover');
				
				return true;
			});

			this.wrp.on('mouseleave', '.chest-hover', function(){
				self.wrp.find('.chest-view').removeClass('-hover');
				
				return true;
			});
		}
		
		// Закрываем по нажатию в фон
		this.wrp
			.on('click', '.chest-backClick', function(){
				self.close();
			})
			.on('click', '.chest-hover', function(){
				var $el = self.wrp.find('.chest-view');
				
				if ( $el.hasClass('-chest') ) {
					if( !self.closeTimeout || (timeMgr.getNow() - self.closeTimeout > wChest.closeDelay) ){
						$el.addClass('-fontain');
						
						self.setTimeout(self.close, 2500);
					}
				} else {
					if( $el.hasClass('-disabled') )
						return false;
					else
						$el.addClass('-disabled');
					
					reqMgr.openChest(function(resp){
						//resp = {data: {sum: 0, type:0}};

						var wnd = wndMgr.getFirstWndByType(wChest);

						if( !wnd ){
							wnd = wndMgr.addWnd(wChest);
							
							if( wnd )
								wnd.showPrize(false, resp);
							
							return;
						}

						self.showPrize($el, resp);
					});
				}
			});
	};
	
	wChest.prototype.afterShow = function(){
		notifMgr.runEvent(Notif.ids.accChest);
	};
	
	wChest.prototype.close = function(){
		setTimeout(function(){
			notifMgr.runEvent(Notif.ids.accChest);
		}, 0);
		
		if( this.type == wChest.types.spec )
			wofh.account.ability.checkAccount();
		
		wChest.superclass.close.apply(this);
	};
	
	//выбираем, какой сундук показать
	wChest.prototype.selectChest = function(coins){
		if( !coins ) return 'null';
		
		var packs = lib.luckbonus.shop_[wofh.platform.id].packs;
		for (var packId = packs.length-1; packId >= 0; packId--){
			var pack = packs[packId];
			if (pack.coins >= coins) {
				return packId;
			}
		}
		
		return 0;
	};
	
	wChest.prototype.showPrize = function($el, resp){
		$el = $el||this.wrp.find('.chest-view');
		
		$el.addClass('-chest');
		
		this.type = resp.data.type;
		
		if( resp.data.type == wChest.types.coins ){
			if( resp.data.sum > 10 ){
				this.closeTimeout = timeMgr.getNow();
			}
			
			var chest = this.selectChest(resp.data.sum);
			
			this.wrp.find('.chest-bonusWrp').html(tmplMgr.chest.bonus({chest: chest, sum: resp.data.sum, type: resp.data.type}));
		}
		else{
			this.closeTimeout = timeMgr.getNow();
			
			this.wrp.find('.chest-bonusWrp').html(tmplMgr.chest.bonus({specialist: new Specialist(resp.data.spec, 1), science: new Science(resp.data.science), type: resp.data.type}));
		}
		
		if( this.closeTimeout ){
			contentLoader.start($el.find('.chest-bonus'), 0, false, 
				{
					icon: ContentLoader.icon.small,
					cssPosition: {bottom: -20, left: 65},
					animationTime: wChest.closeDelay * 1000,
					afterAnimation: function(loader){
						contentLoader.stop(loader.id);
					}
				}
			);
		}
		
		this.wrp.find('.chest-lineWrp').html(tmplMgr.chest.fontainItem({specialist: new Specialist(resp.data.spec, 1), type: resp.data.type, sum:resp.data.sum}));
	};
	
	wChest.closeDelay = 5; // Время в течении которого нельзя закрыть окно с сундоком, после того, как он был открыт
	
	wChest.types = {
		coins: 0,
		spec: 1
	};
	
