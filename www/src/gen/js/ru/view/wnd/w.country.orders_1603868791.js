/**
	Окно заказов в стране
*/

wCountryOrders = function(){
	wCountryOrders.superclass.constructor.apply(this, arguments);
};

utils.extend(wCountryOrders, Wnd);

WndMgr.regWnd('countryOrders', wCountryOrders);


wCountryOrders.pageCount = 20;

wCountryOrders.prepareData = function(id, extData) {
	var data = {
		defTab: 'checked'
	};
	
	if( extData ){
		if( extData.defTab )
			data.defTab = extData.defTab;
	}
	
	return data;
};

wCountryOrders.getMaxHeight = function(){
	return Math.max(utils.getWindowHeight(-155, 0), 250) + 'px';
};


wCountryOrders.prototype.calcName = function(){
	return 'countryOrders';
};

wCountryOrders.prototype.initOptions = function(){
	wCountryOrders.superclass.initOptions.apply(this, arguments);
	
	this.options.hasReqData = true;
};

wCountryOrders.prototype.calcChildren = function(){
	this.children.checked = tabCountryOrdersChecked;
	this.children.noChecked = tabCountryOrdersNoChecked;
	this.children.my = tabCountryOrdersMy;
	
	if( debug.isTest('later') )
		this.children.rate = tabCountryOrdersRate;
	
	this.children.control = tabCountryOrdersControl;
};

wCountryOrders.prototype.addNotif = function(){
	this.notif.other[Notif.ids.countryOrders] = function(){
		var activeTab = this.tabs.activeTab;
		
		if( activeTab && activeTab.updList )
			activeTab.updList();
	};
};

wCountryOrders.prototype.beforeShowChildren = function(){
    this.tabs = new Tabs(this.cont, this);
	
	this.tabs.addTabs(this.children);
};

wCountryOrders.prototype.afterDraw = function(){
    this.tabs.openTab(this.data.defTab);
};


wCountryOrders.prototype.getCountryOrders = function(cont, reqData, callback) {
	var self = this;
	
    var loaderId = contentLoader.start( 
		cont, 
		250, 
		function(){
			self.getReqData(function(){
				reqMgr.getCountryOrders(reqData.filter, reqData.page, reqData.status, reqData.sort.getField(), reqData.accId, function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							callback(resp);
						}
					);
				});
			});
		}
	);
};

wCountryOrders.prototype.sendOrder = function(order) {
    hashMgr.showWnd('send', utils.objToUrl({ord: order.getId()}), {order: order});
};



/******
 * Вкладка checked
 */

tabCountryOrdersChecked = function(){
    this.name = 'checked';
	this.tabTitle = 'Проверенные';
	
	tabCountryOrdersChecked.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryOrdersChecked, Tab);

tabCountryOrdersChecked.prototype.getData = function(){
    this.dataReceived();
};

tabCountryOrdersChecked.prototype.addNotif = function(){
	this.notif.other[Notif.ids.countryOrdersAccess] = this.checkOrdersAccess;
};

tabCountryOrdersChecked.prototype.calcChildren = function(){
	this.children.list = tabCountryOrdersChecked_list;
};

tabCountryOrdersChecked.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.js-makeOrder', function(){
			self.tabs.openTab('my');
		});
};

tabCountryOrdersChecked.prototype.modifyCont = function(){
	this.checkOrdersAccess();
};

tabCountryOrdersChecked.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabCountryOrdersChecked.prototype.afterOpenTab = function(){
	this.data.canShowList = true;
	
	this.children.list.updCont();
};


tabCountryOrdersChecked.prototype.updList = function(){
	this.children.list.updCont();
};

tabCountryOrdersChecked.prototype.checkOrdersAccess = function(){
	this.$footer.toggleClass('-hidden', !wofh.country.hasOrdersRes());
};
	
	
	tabCountryOrdersChecked_list = function(parent){
		this.name = 'list';
		
		tabCountryOrdersChecked_list.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
	
	utils.extend(tabCountryOrdersChecked_list, Block);
	
	tabCountryOrdersChecked_list.prototype.getData = function(){
		var self = this;
		
		if( this.parent.data.canShowList ){
			if( this.data.filter === undefined )
				this.data.filter = ResList.getResBinFilter();
			this.data.page = this.data.page||0;
			if( this.data.defSortField === undefined )
				this.data.defSortField = ResOrdersList.sort.no;
			this.data.sort = this.data.sort||new Sort(this.data.defSortField);
			this.data.status = ResOrder.statusIds.confirmed;
			
			this.parent.parent.getCountryOrders(this.wrp, this.data, function(resp){
				self.data.list = resp.list;
				
				self.dataReceived();
			});
		}
		else
			this.dataReceived();
	};
	
	tabCountryOrdersChecked_list.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.countryOrdersChecked];
	};
	
	tabCountryOrdersChecked_list.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.orders-timeSort', function(){
				// При сортировке по времени, будет меняться направление стрелки изначально сортирующей по ключу ResOrdersList.sort.no
				self.data.defSortField = $(this).data('field');
				
				self.sort(self.data.defSortField);
			})
			.on('click', '.orders-list-headerSort .btnTbl-sort', function(){
				var field = $(this).data('field');
				
				// defSortField может седежать ключи ResOrdersList.sort.timecreate или ResOrdersList.sort.timestatus
				if( self.data.defSortField == field )
					field = ResOrdersList.sort.no;
				
				self.data.defSortField = ResOrdersList.sort.no;
				
				self.sort(field);
			})
			.on('click', '.js-resFilter-inline .resb', function(){
				var resId = $(this).data('res');
				
				if( resId == ResList.filter.resType.all ){
					var defFilter = ResList.getResBinFilter();
					
					if( self.data.filter == defFilter )
						self.data.filter = 0;
					else
						self.data.filter = defFilter;
				}
				else
					self.data.filter ^= (1 << resId);
				
				self.updCont();
			})
			.on('click', '.js-orders-send', function(){
				var order = self.data.list.getElem($(this).data('id'));
				
				self.parent.parent.sendOrder(order);
			})
			.on('click', '.-type-delete', function(){
				var $this = $(this);
				
				wndMgr.addConfirm('Ты действительно хочешь удалить этот запрос?').onAccept = function(){
					reqMgr.closeCountryOrder($this.closest('.orders-orderRow').data('id'), function(){
						self.updCont();
					});
				};
				
				return false;
			})
			.on('click', '.page-nav-prev.-active', function(){
				Math.min(0, --self.data.page);
				
				self.updCont();
			})
			.on('click', '.page-nav-next.-active', function(){
				self.data.page++;
				
				self.updCont();
			});
	};
	
	//tabCountryOrdersChecked_list.prototype.canDisplay = function(){
	//	return this.parent.data.canShowList;
	//};
	
	tabCountryOrdersChecked_list.prototype.afterDraw = function(){
		this.initScroll({scrollbarPosition: 'outside'});
	};
	
	
	
	tabCountryOrdersChecked_list.prototype.sort = function(field){
		if( this.data.sort.isEqual(field, true) )
			this.data.sort.changeDir();
		else
			this.data.sort.setField(field);

		this.updCont();
	};
	
	tabCountryOrdersChecked_list.prototype.updCont = function(){
		notifMgr.runEvent(Notif.ids.countryOrdersChecked);
	};
	
	
	
	
/******
 * Вкладка noChecked
 */

tabCountryOrdersNoChecked = function(){
    this.name = 'noChecked';
	this.tabTitle = 'Непроверенные';
	
	tabCountryOrdersNoChecked.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryOrdersNoChecked, Tab);

tabCountryOrdersNoChecked.prototype.getData = function(){
	var self = this;
	
    this.dataReceived();
};

tabCountryOrdersNoChecked.prototype.addNotif = function(){
	this.notif.other[Notif.ids.countryOrdersAccess] = this.checkOrdersAccess;
};

tabCountryOrdersNoChecked.prototype.calcChildren = function(){
	this.children.list = tabCountryOrdersNoChecked_list;
};

tabCountryOrdersNoChecked.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.js-makeOrder', function(){
			self.tabs.openTab('my');
		});
};

tabCountryOrdersNoChecked.prototype.modifyCont = function(){
	this.checkOrdersAccess();
};

tabCountryOrdersNoChecked.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabCountryOrdersNoChecked.prototype.afterOpenTab = function(){
	//if( this.data.canShowList ) return;
	
	this.data.canShowList = true;
	
	this.children.list.updCont();
};


tabCountryOrdersNoChecked.prototype.updList = function(){
	this.children.list.updCont();
};

tabCountryOrdersNoChecked.prototype.checkOrdersAccess = function(){
	this.$footer.toggleClass('-hidden', !wofh.country.hasOrdersRes());
};

	
	tabCountryOrdersNoChecked_list = function(parent){
		this.name = 'list';
		
		tabCountryOrdersNoChecked_list.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
	
	utils.extend(tabCountryOrdersNoChecked_list, Block);
	
	tabCountryOrdersNoChecked_list.prototype.getData = function(){
		var self = this;
		
		if( this.parent.data.canShowList ){
			if( this.data.filter === undefined )
				this.data.filter = ResList.getResBinFilter();
			this.data.page = this.data.page||0;
			if( this.data.defSortField === undefined )
				this.data.defSortField = ResOrdersList.sort.no;
			this.data.sort = this.data.sort||new Sort(this.data.defSortField);
			this.data.status = ResOrder.statusIds.notConfirmed;
			
			this.parent.parent.getCountryOrders(this.wrp, this.data, function(resp){
				self.data.list = resp.list;
				
				self.dataReceived();
			});
		}
		else
			this.dataReceived();
	};
	
	tabCountryOrdersNoChecked_list.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.countryOrdersNoChecked];
	};
	
	tabCountryOrdersNoChecked_list.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.orders-timeSort', function(){
				// При сортировке по времени, будет меняться направление стрелки изначально сортирующей по ключу ResOrdersList.sort.no
				self.data.defSortField = $(this).data('field');
				
				self.sort(self.data.defSortField);
			})
			.on('click', '.orders-list-headerSort .btnTbl-sort', function(){
				var field = $(this).data('field');
				
				// defSortField может седежать ключи ResOrdersList.sort.timecreate или ResOrdersList.sort.timestatus
				if( self.data.defSortField == field )
					self.data.defSortField = field = ResOrdersList.sort.no;
				
				self.sort(field);
			})
			.on('click', '.js-resFilter-inline .resb', function(){
				var resId = $(this).data('res');
			
				if( resId == ResList.filter.resType.all ){
					var defFilter = ResList.getResBinFilter();
					
					if( self.data.filter == defFilter )
						self.data.filter = 0;
					else
						self.data.filter = defFilter;
				}
				else
					self.data.filter ^= (1 << resId);
		
				self.updCont();
			})
			.on('click', '.-type-accept.-type-one', function(){
				reqMgr.confirmCountryOrder($(this).closest('.orders-orderRow').data('id'), function(){
					self.updCont();
				});
			})
			// У непроверянных заказов кнопка удалить для учетчика, отклоняет заказ
			.on('click', '.-type-delete.-type-one', function(){
				var $this = $(this),
                    text = $this.hasClass('js-reject-order') ? 'Ты действительно хочешь отклонить этот запрос?' : 'Ты действительно хочешь удалить этот запрос?',
                    reqFunc = $this.hasClass('js-reject-order') ? reqMgr.rejectCountryOrder : reqMgr.closeCountryOrder,
                    id = $this.closest('.orders-orderRow').data('id');
				
				wndMgr.addConfirm(text).onAccept = function(){
					reqFunc.call(reqMgr, id, function(){
						self.updCont();
					});
				};
			})
            .on('click', '.-type-accept.-type-all', function(){
                var idsArr = [];
                
                $(this).closest('.orders-list-tbl').find('.orders-orderRow').each(function(){
                    idsArr.push($(this).data('id'));
                });
                
                wndMgr.addConfirm().onAccept = function(){
					reqMgr.confirmCountryOrder(idsArr, function(){
                        self.updCont();
                    });
				};
			})
            .on('click', '.-type-delete.-type-all', function(){
				var idsArr = [];
				
                $(this).closest('.orders-list-tbl').find('.orders-orderRow').each(function(){
                    idsArr.push($(this).data('id'));
                });
                
				wndMgr.addConfirm().onAccept = function(){
					reqMgr.rejectCountryOrder(idsArr, function(){
						self.updCont();
					});
				};
			})
			.on('click', '.page-nav-prev.-active', function(){
				Math.min(0, --self.data.page);
				
				self.updCont();
			})
			.on('click', '.page-nav-next.-active', function(){
				self.data.page++;
				
				self.updCont();
			});
	};
	
	//tabCountryOrdersNoChecked_list.prototype.canDisplay = function(){
	//	return this.parent.data.canShowList;
	//};
	
	tabCountryOrdersNoChecked_list.prototype.afterDraw = function(){
		this.initScroll({scrollbarPosition: 'outside'});
	};
	
	
	tabCountryOrdersNoChecked_list.prototype.sort = function(field){
		if( this.data.sort.isEqual(field, true) )
			this.data.sort.changeDir();
		else
			this.data.sort.setField(field);

		this.updCont();
	};
	
	tabCountryOrdersNoChecked_list.prototype.updCont = function(){
		notifMgr.runEvent(Notif.ids.countryOrdersNoChecked);
	}; 
	




/******
 * Вкладка my
 */

tabCountryOrdersMy = function(){
    this.name = 'my';
	this.tabTitle = 'Мои заказы';
	
	tabCountryOrdersMy.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryOrdersMy, Tab);

tabCountryOrdersMy.prototype.getData = function(){
	var self = this;
	
    this.dataReceived();
};

tabCountryOrdersMy.prototype.addNotif = function(){
	this.notif.other[Notif.ids.countryOrdersAccess] = this.checkOrdersAccess;
};

tabCountryOrdersMy.prototype.calcChildren = function(){
	this.children.list = tabCountryOrdersMy_list;
};

tabCountryOrdersMy.prototype.bindEvent = function(){
    //var self = this;
};

tabCountryOrdersMy.prototype.modifyCont = function(){
	this.checkOrdersAccess();
};

tabCountryOrdersMy.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabCountryOrdersMy.prototype.afterOpenTab = function(){
	//if( this.data.canShowList ) return;
		
	this.data.canShowList = true;

	this.children.list.updCont();
};


tabCountryOrdersMy.prototype.updList = function(){
	this.children.list.updCont();
};

tabCountryOrdersMy.prototype.checkOrdersAccess = function(){
	this.$footer.toggleClass('-hidden', !wofh.country.hasOrdersRes());
};

	
	tabCountryOrdersMy_list = function(parent){
		this.name = 'list';
		
		tabCountryOrdersMy_list.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
	
	utils.extend(tabCountryOrdersMy_list, Block);
	
	tabCountryOrdersMy_list.prototype.getData = function(){
		var self = this;
		
		if( this.parent.data.canShowList ){
			if( this.data.filter === undefined )
				this.data.filter = ResList.getResBinFilter();
			this.data.page = this.data.page||0;
			if( this.data.defSortField === undefined )
				this.data.defSortField = ResOrdersList.sort.no;
			this.data.sort = this.data.sort||new Sort(this.data.defSortField);
			this.data.accId = wofh.account.id;
			
			this.parent.parent.getCountryOrders(this.wrp, this.data, function(resp){
				self.data.list = resp.list;
				
				self.dataReceived();
			});
		}
		else
			this.dataReceived();
	};
	
	tabCountryOrdersMy_list.prototype.addNotif = function(){
		this.notif.show = [Notif.ids.countryOrdersMy];
	};
	
	tabCountryOrdersMy_list.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('click', '.orders-timeSort', function(){
				// При сортировке по времени, будет меняться направление стрелки изначально сортирующей по ключу ResOrdersList.sort.no
				self.data.defSortField = $(this).data('field');
				
				self.sort(self.data.defSortField);
			})
			.on('click', '.orders-list-headerSort .btnTbl-sort', function(){
				var field = $(this).data('field');
				
				// defSortField может седежать ключи ResOrdersList.sort.timecreate или ResOrdersList.sort.timestatus
				if( self.data.defSortField == field )
					self.data.defSortField = field = ResOrdersList.sort.no;
				
				self.sort(field);
			})
			.on('click', '.js-resFilter-inline .resb', function(){
				var resId = $(this).data('res');
			
				if( resId == ResList.filter.resType.all ){
					var defFilter = ResList.getResBinFilter();
					
					if( self.data.filter == defFilter )
						self.data.filter = 0;
					else
						self.data.filter = defFilter;
				}
				else
					self.data.filter ^= (1 << resId);
				
				self.updCont();
			})
			.on('smplSelect-changed', '.smplSelect', function(event, elem, init){
				var status = +elem.getVal();
				
				if( status == -1 )
					delete self.data.status;
				else
					self.data.status = status;
				
				if( !init )
					notifMgr.runEvent(Notif.ids.countryOrdersMy);
			})
			.on('click', '.orders-orderLabel', function(){
				if( self.data.status == $(this).data('status') )
					return;
				
				self.wrp.find('.smplSelect').trigger('smplSelect-select', [$(this).data('status')]);
			})
			.on('click', '.-type-delete', function(){
				var $this = $(this);
				
				wndMgr.addConfirm('Ты действительно хочешь удалить этот запрос?').onAccept = function(){
					reqMgr.closeCountryOrder($this.closest('.orders-orderRow').data('id'), function(){
						self.updCont();
					});
				};
			})
			.on('click', '.page-nav-prev.-active', function(){
				Math.min(0, --self.data.page);
				
				self.updCont();
			})
			.on('click', '.page-nav-next.-active', function(){
				self.data.page++;
				
				self.updCont();
			});
			
		var selectList = new smplSelectList();
		
		selectList.addElem({
			text: 'Все заказы',
			val: -1
		});
		
		selectList.addElem({
			text: ResOrder.status[ResOrder.statusIds.confirmed].txt,
			val: ResOrder.statusIds.confirmed
		});
		selectList.addElem({
			text: ResOrder.status[ResOrder.statusIds.notConfirmed].txt,
			val: ResOrder.statusIds.notConfirmed
		});
		selectList.addElem({
			text: ResOrder.status[ResOrder.statusIds.rejected].txt,
			val: ResOrder.statusIds.rejected
		});
		selectList.addElem({
			text: ResOrder.status[ResOrder.statusIds.finished].txt,
			val: ResOrder.statusIds.finished
		});
		selectList.addElem({
			text: ResOrder.status[ResOrder.statusIds.closed].txt,
			val: ResOrder.statusIds.closed
		});
		
		snip.smplSelectHandler(this.wrp, selectList, {noInit:true});
	};
	
	//tabCountryOrdersMy_list.prototype.canDisplay = function(){
	//	return this.parent.data.canShowList;
	//};
	
	tabCountryOrdersMy_list.prototype.afterDraw = function(){
		this.wrp.find('.smplSelect').trigger('smplSelect-init');
		
		this.initScroll({scrollbarPosition: 'outside'});
	};
	
	
	tabCountryOrdersMy_list.prototype.sort = function(field){
		if( this.data.sort.isEqual(field, true) )
			this.data.sort.changeDir();
		else
			this.data.sort.setField(field);

		this.updCont();
	};
	
	tabCountryOrdersMy_list.prototype.updCont = function(){
		notifMgr.runEvent(Notif.ids.countryOrdersMy);
	};
	



	
/******
 * Вкладка control
 */

tabCountryOrdersControl = function(){
    this.name = 'control';
	this.tabTitle = 'Управление';
	
	tabCountryOrdersControl.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryOrdersControl, Tab);

tabCountryOrdersControl.prototype.getData = function(){
	this.data.resList = ResList.getAll().getStockable();
	
	this.data.resList.sortByGroups({exclude:[ResList.groupType.special]});
	
	this.data.resList.unshiftElem(new Resource(Resource.ids.food, 0));
	
    this.dataReceived();
};

tabCountryOrdersControl.prototype.addNotif = function(){
	this.notif.show = [];
};

tabCountryOrdersControl.prototype.bindEvent = function(){
    var self = this;
	
	this.wrp
		.on('click', '.control-reset', function(){
			if( !self.data.allowSave )
				return;
			
			self.reset();
		})
		.on('click', '.control-save', function(){
			if( !self.data.allowSave )
				return;
			
			self.save();
		});
};

tabCountryOrdersControl.prototype.cacheCont = function(){
	this.$footer = this.cont.find('.wnd-footer');
};

tabCountryOrdersControl.prototype.afterDraw = function(){
	var self = this;
	
	self.setAllowSave(false);
	
	snip.checkboxSliderHandler(this.cont.find('.control-res-sld'), {
		slide: function(event, ui) {
			self.checkEmpty(this, ui.value);
		},
		change: function(event, ui) {
			self.checkEmpty(this, ui.value);
			
			if( event.originalEvent ){
				self.setAllowSave(true);
				
				self.checkOrders(ui.value);
			}
		}
	});
	
	if( wofh.account.isChiefAccountant() || wofh.account.isHead() ){
		snip.checkboxSliderHandler(this.cont.find('.control-orders-sld'), {
			change: function(event, ui) {
				if( event.originalEvent ){
					self.setAllowSave(true);
					
					self.resetRes(ui.value);
				}
			}
		});
	}
	else
		this.cont.find('.control-res-sld').trigger('checkboxSld-disable');
	
	this.initScroll({scrollbarPosition: 'outside'});
};


tabCountryOrdersControl.prototype.checkEmpty = function(slider, value){
	$(slider).closest('.control-res').toggleClass('-type-empty', !value);
};

tabCountryOrdersControl.prototype.resetRes = function(checked){
	this.wrp.find('.control-res-sld').trigger('checkboxSld-set', [checked]);
};

tabCountryOrdersControl.prototype.reset = function(){
	this.wrp.find('.control-res-sld, .control-orders-sld').trigger('checkboxSld-set');
	
	this.setAllowSave(false);
};

tabCountryOrdersControl.prototype.save = function(){
	var self = this,
		access = 0,
		accessResList = utils.urlToObj(self.wrp.find('.control-resList').serialize(), true);

	for(var resId in accessResList){
		if( accessResList[resId] )
			access ^= (1 << resId);
	}
	
	var loaderId = contentLoader.start( 
		this.wrp, 
		0, 
		function(){
			reqMgr.setCountryOrdersAccess(access, function(){
				contentLoader.stop(loaderId);
				
				self.setAllowSave(false);
			});
		}
	);
};

tabCountryOrdersControl.prototype.checkOrders = function(){
	var checked = this.wrp.find('.control-res-sld.-checked').length;
	
	this.wrp.find('.control-orders-sld').trigger('checkboxSld-set', [checked]);
};

tabCountryOrdersControl.prototype.setAllowSave = function(state){
	if( this.data.allowSave == state )
		return;
	
	this.data.allowSave = state;
	
	this.wrp.find('.control-save, .control-reset').toggleClass('-disabled', !state);
};





/******
 * Вкладка rate
 */

tabCountryOrdersRate = function(){
    this.name = 'rate';
	this.tabTitle = 'Рейтинги';
	
	tabCountryOrdersRate.superclass.constructor.apply(this, arguments);
};

utils.extend(tabCountryOrdersRate, Tab);

tabCountryOrdersRate.prototype.getData = function(){
	var self = this;
	
    this.dataReceived();
};

tabCountryOrdersRate.prototype.addNotif = function(){
	this.notif.show = [];
};

tabCountryOrdersRate.prototype.bindEvent = function(){
    var self = this;
	
	//this.wrp
	//		.on('click', '', function(){});
};

tabCountryOrdersRate.prototype.afterDraw = function(){
	
};

tabCountryOrdersRate.prototype.calcChildren = function(){
	this.children.acc = tabCountryOrdersRate_acc;
	this.children.res = tabCountryOrdersRate_res;
};
	
	
	tabCountryOrdersRate_acc = function(parent){
		this.name = 'acc';
		
		tabCountryOrdersRate_acc.superclass.constructor.apply(this, arguments);
		
		this.options.clearData = false;
	};
	
	utils.extend(tabCountryOrdersRate_acc, Block);
	
	tabCountryOrdersRate_acc.prototype.getData = function(){
		var self = this;
		
		var accounts = [];
		
		for(var acc in wofh.world.accounts){
			if( wofh.world.accounts[acc].country )
				accounts.push(wofh.world.accounts[acc]);
		}
		
		this.data.accounts = accounts;
		
		/*
		reqMgr.test(, function(acc){

			self.dataReceived();
		})*/
		
		this.dataReceived();
	};
	
	tabCountryOrdersRate_acc.prototype.addNotif = function(){
		//this.notif.show = [];
	};
	
	tabCountryOrdersRate_acc.prototype.bindEvent = function(){
		var self = this;
		
		this.wrp
			.on('input1-beforeSetNumber', '.js-orders-rate-correct', function(){
				var val = $(this).val()||'';
				
				if( val[0] == '+' )
					$(this).val(val.replace('+', ''));
			})
			.on('input1-afterSetText', '.js-orders-rate-correct', function(){
				var val = +$(this).val();
				
				if( val > 0 )
					$(this).val('+' + val);
			})
			.on('input', '.js-orders-rate-correct', function(event, init){
				if( !init )
					$(this).closest('.orders-rate-correct-wrp').find('.orders-rate-correctAccept-wrp').removeClass('-hidden');
				
				$(this).removeClass('cl-red cl-green cl-grey');
				
				var val = +$(this).val();
				
				if( val )
					$(this).addClass(val > 0 ? 'cl-green' : 'cl-red');
				else
					$(this).addClass('cl-grey');
			});
		
		snip.input1Handler(this.wrp, {spinbox: {}});
	};
	
	tabCountryOrdersRate_acc.prototype.afterDraw = function(){
		this.table = new tblTabCountryOrdersRate_acc(this, this.cont);
		
		this.table.toggleSort('acc');
		
		this.cont.find('.js-orders-rate-correct').trigger('input', true);
	};
		
		tblTabCountryOrdersRate_acc = function(parent, cont) {
			this.tmpl = tmplMgr.countryOrders.rate.acc.table;
			this.data = {};
			this.data.list = parent.data.accounts;
			
			tblTabCountryOrdersRate_acc.superclass.constructor.apply(this, arguments);
			
			this.options.useScroll = true;

			this.bind();
		};

		utils.extend(tblTabCountryOrdersRate_acc, Table);

		tblTabCountryOrdersRate_acc.prototype.getSortVal = function(acc, field) {
			if (field == 'acc') return acc.name.toLowerCase();

			return acc.id;
		};

		tblTabCountryOrdersRate_acc.prototype.afterDraw = function() {
			var showTable = !this.data.list.length;

			if( this.showTable != showTable ){
				this.parent.wrp.find('.tbl').toggleClass('-hidden', showTable);

				this.showTable = showTable;
			}
		};
		
		
		tabCountryOrdersRate_res = function(parent){
			this.name = 'res';

			tabCountryOrdersRate_res.superclass.constructor.apply(this, arguments);

			this.options.clearData = false;
		};

		utils.extend(tabCountryOrdersRate_res, Block);

		tabCountryOrdersRate_res.prototype.getData = function(){
			var self = this;

			this.data.resList = ResList.getAll().getStockable();

			this.dataReceived();
		};

		tabCountryOrdersRate_res.prototype.addNotif = function(){
			this.notif.show = [Notif.ids.countryOrdersRate];
		};

		tabCountryOrdersRate_res.prototype.bindEvent = function(){
			var self = this;

			this.wrp
				.on('input', '.rate-res-val', function(){
					var $slider = $(this).closest('.rate-res-res').find('.rate-res-sld');

					utils.checkInputFloat(this, $slider.slider('option', 'max')*0.1, 0);

					$slider.slider('value', utils.toInt($(this).val()*10));
				})
				.on('click', '.rate-res-reset', function(){
					self.reset();
				});

			snip.input1Handler(this.wrp, {spinbox: {}});
		};

		tabCountryOrdersRate_res.prototype.afterDraw = function(){
			var self = this;

			snip.gradSliderHandler(this.cont.find('.slider'), {
				min: 0,
				max: 100,
				create: function(event, ui) {
					self.initValues(this);
				},
				start: function(event, ui) {
					$(this).closest('.rate-res-res').addClass('-active');
				},
				stop: function(event, ui) {
					$(this).closest('.rate-res-res').removeClass('-active');
				},
				slide: function(event, ui) {
					self.setValue(this, ui.value);
				},
				change: function(event, ui) {
					self.checkEmpty(this, ui.value);
				}
			});
		};



		tabCountryOrdersRate_res.prototype.checkEmpty = function(slider, value){
			$(slider).closest('.rate-res-res').toggleClass('-type-empty', !value);
		};
		
		tabCountryOrdersRate_res.prototype.setValue = function(slider, value){
			$(slider).closest('.rate-res-res').find('.rate-res-val').val(utils.formatNum(value*0.1, {fixed:1}));

			this.checkEmpty(slider, value);
		};

		tabCountryOrdersRate_res.prototype.initValues = function(slider){
			var value = $(slider).data('value');
			
			$(slider).slider('option', 'value', value);
			
			this.setValue(slider, value);
		};

		tabCountryOrdersRate_res.prototype.reset = function(){
			var self = this;

			this.wrp.find('.rate-res-sld').each(function(){
				self.initValues(this);
			});
		};