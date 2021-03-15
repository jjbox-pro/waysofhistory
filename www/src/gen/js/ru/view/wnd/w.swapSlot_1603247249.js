/**
	Перемещения слотов местами
*/

wSwapSlot = function(){
	this.name = 'swapSlotWnd';
	this.hashName = 'swapSlotWnd';
	
	wSwapSlot.superclass.constructor.apply(this, arguments);
};

utils.extend(wSwapSlot, Wnd);

WndMgr.regWnd('swapSlotWnd', wSwapSlot);


wSwapSlot.defSlotType = -1;


wSwapSlot.prototype.getData = function(){
	this.data.town = wofh.town;
	
	this.dataReceived();
};

wSwapSlot.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townBuildings, Notif.ids.townBuildQueue];
};

wSwapSlot.prototype.afterDraw = function(){
	var self = this;
	
	this.cont.find('.swapSlot-slot').draggable({
		appendTo: this.wrp.find('.swapSlot-slots'),
		helper: 'clone',
		opacity: 0.7,
		zIndex: 10,
		revert: true,
		distance: 3,
		containment: this.wrp.find('.swapSlot-slots')
	});
	
	this.cont.find('.swapSlot-slot').droppable({
		accept: '.swapSlot-slot',
		drop: function( event, ui ) {
			var slot1 = self.data.town.getSlot(ui.draggable.data('pos')),
				slot2 = self.data.town.getSlot($(event.target).data('pos'));
			
			if( slot1.getSlotType() != slot2.getSlotType() )
				return;
			
			if ( wofh.account.getCoinsBoughtMoved() < lib.luckbonus.swapslotcost && !wofh.account.isAdmin() ) {
				wndMgr.addAlert(tmplMgr.snipet.noCoins());
				
				return;
			}
			
			wndMgr.addConfirm(tmplMgr.slotbld.swapAlert({slot1: slot1, slot2: slot2}), {
				rubber: true,
				data: {
					townId: self.data.town.id,
					slot1: slot1.getPos(),
					slot2: slot2.getPos()
				},
				callbacks: {
					bindEvent: function(){
						var wnd = this;

						this.wrp
							.off('click', '.js-popup-ok')
							.on('click', '.js-popup-ok', function(){
								wnd.noClose = true;
								
								wnd.loaderId = contentLoader.start(
									wnd.wrp.find('.wnd-cont-wrp'), 
									0, 
									function (){
										reqMgr.swapSlots(wnd.data.townId, wnd.data.slot1, wnd.data.slot2, function(){
											contentLoader.stop(wnd.loaderId);

											wnd.noClose = false;

											wnd.close();
										});
									}
								);
							});
					},
					beforeClose: function(){
						return this.noClose;
					}
				}
			});
		},
		activate: function(event, ui) {
			self.wrp.find('.swapSlot-slots').attr('data-type', ui.draggable.data('type'));
		},
		deactivate: function() {
			self.wrp.find('.swapSlot-slots').attr('data-type', wSwapSlot.defSlotType);
		}
	});
};