wAlly = function(){
	wAlly.superclass.constructor.apply(this, arguments);
};

utils.extend(wAlly, Wnd);

WndMgr.regWnd('ally', wAlly);


wAlly.prepareData = function(){
	var data = Account.hasAbility(Science.ability.money) ? {} : false;
	
	return data;
};


wAlly.prototype.calcName = function(){
	return 'ally';
};

wAlly.prototype.initWndOptions = function(){
	wAlly.superclass.initWndOptions.apply(this, arguments);
    
    this.options.clearData = true;
};

wAlly.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accTradeAlly];
};

wAlly.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-allyInfo', function(){
			self.getAllyInfo($(this).data('id'), self.showAlly.bind(self));
		})
		.on('click', '.js-create-ally', function(){
			if( !self.data.canCreateAlly )
				return false;
			
			self.setAlly();
			
			return false;
		})
		.on('click', '.js-edit-ally', function(){
			self.setAlly(self.data.allyInfo);
			
			return false;
		})
		.on('click', '.js-del-ally', function(){
			wndMgr.addConfirm(tmplMgr.ally.alerts({type: 'removeAlly', allyName: self.data.allyInfo.name})).onAccept = function(){
				reqMgr.deleteTradeAllyMember(self.data.allyInfo.id, self.data.allyInfo.owner.id, function(){});
			};
			
			return false;
		})
		.on('click', '.js-set-owner', function(){
			var id = $(this).parents('li').data('id');
		
			wndMgr.addConfirm(tmplMgr.ally.alerts({type: 'changeOwner', member: self.data.allyInfo.members[id], allyName: self.data.allyInfo.name})).onAccept = function(){
				var allyInfo = self.data.allyInfo;
				
				reqMgr.changeTradeAlly(allyInfo.id, id, allyInfo.name, allyInfo.text, function(){
				});
			};
		})
		.on('click', '.js-del-member', function(){
			var id = $(this).parents('li').data('id');
			
			wndMgr.addConfirm(tmplMgr.ally.alerts({type: 'removeMember', member: self.data.allyInfo.members[id], allyName: self.data.allyInfo.name})).onAccept = function(){
				reqMgr.deleteTradeAllyMember(self.data.allyInfo.id, id, function(){
					if( self.data.allyInfo )
						self.getAllyInfo(self.data.allyInfo.id, self.showAlly.bind(self));
				});
			};
		})
		.on('click', '.js-out-ally', function(){
			var id = $(this).parents('li').data('id'),
				ally = wofh.tradeAllies.getElem(id);
			
			wndMgr.addConfirm(tmplMgr.ally.alerts({type: 'removeMeFromAlly', allyName: ally.getName()})).onAccept = function(){
				reqMgr.deleteTradeAllyMember(id, ally.incCountry?wofh.country.id+BaseAccOrCountry.countryK:wofh.account.id);
			};
			
			return false;
		});
};

wAlly.prototype.afterDraw = function(){
	this.showAlly();
	
	this.initScroll();
};


wAlly.prototype.getAllyInfo = function(id, callback) {
	var self = this;
	
	var loaderId = contentLoader.start(
		this.wrp.find('.wnd-cont-wrp'), 
		100,
		function(){
			reqMgr.getAllyInfo(id, function(resp){
				contentLoader.stop(loaderId);
				
				var allyInfo = new TradeAlly(resp.tradeallyinfo[id]);

				allyInfo.id = id;
				resp.accounts = resp.accounts||{};
				if( !resp.accounts[allyInfo.owner] )
					resp.accounts[allyInfo.owner] = wofh.world.getAccount(allyInfo.owner, true);

				var members = {};
				for(var mem in allyInfo.members){
					var member = self.makeAllyMember(allyInfo.members[mem], resp.countries, resp.accounts);
					members[member.gid] = member;
				}

				allyInfo.owner = self.makeAllyMember(allyInfo.owner, resp.countries, resp.accounts);
				allyInfo.owner.self = !allyInfo.owner.isCountry && allyInfo.owner.id == wofh.account.id;

				members[allyInfo.owner.id] = allyInfo.owner;

				allyInfo.accounts = [];
				allyInfo.countries = [];
				for(var member in members){
					member = members[member];
					allyInfo[member.isCountry? 'countries': 'accounts'].push(member);
				}

				allyInfo.members = members;

				self.data.allyInfo = allyInfo;

				if( callback ) callback();
			});
		}.bind(this)
	);
};

wAlly.prototype.showAlly = function(){
	this.wrp.find('.js-ally-list-wrp').html(tmplMgr.ally.list(this.data));
	this.wrp.find('.js-ally-info-wrp').html(tmplMgr.ally.info(this.data));
	
	this.setCanCreateAlly( !(wofh.tradeAllies.getMyCount() >= lib.tradeally.maxown) );
};

wAlly.prototype.setAlly = function(allyInfo){
	allyInfo = allyInfo||new TradeAlly();
	
	var initData = {};
	initData.id = allyInfo.id;
	initData.name = allyInfo.name||'';
	initData.owner = (allyInfo.owner||{}).id;
	initData.accounts = allyInfo.accounts;
	initData.text = allyInfo.text||'';
	
	wndMgr.addModal(tmplMgr.ally.setAlly({initData:initData}), {
		callbacks: {
			bindEvent: function(){
				var wnd = this;
				
				wnd.wrp.on('click', '.js-save-ally', function(){
					var name = wnd.wrp.find('.js-ally-name').val(),
						text = wnd.wrp.find('.js-ally-text').val();
						
					if( initData.id ){
						var owner = wnd.cont.find('.js-ally-owner').val();
						
						if( owner == initData.owner && name == initData.name && text == initData.text ){
							wnd.close();
							
							return;
						}
						
						reqMgr.changeTradeAlly(initData.id, owner, name, text, function(){
							wnd.close();
						});
					}
					else
						reqMgr.createTradeAlly(name, text, function(resp){
							wnd.close();
						});
				});
				
				snip.input1Handler(this.wrp);
			}
		}
	});
};

wAlly.prototype.makeAllyMember = function(gid, countries, accounts){
	var member = {
		gid: gid,
		id: gid%BaseAccOrCountry.countryK,
		isCountry: gid>BaseAccOrCountry.countryK
	};
	
	if( member.isCountry ){
		member = $.extend(countries[member.id], member);
	}else{
		member = $.extend(accounts[member.id], member);
	}
	
	return member;
};

wAlly.prototype.setCanCreateAlly = function( state ){
	if( this.data.canCreateAlly != state ){
		this.data.canCreateAlly = state;
		
		this.wrp.find('.js-create-ally').toggleClass('-disabled', !state);
		this.wrp.find('.js-maxOwn').toggleClass('-hidden', state);
	}
};

