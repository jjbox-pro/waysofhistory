wSlotBuy = function(id, slot){
	wSlotBuy.superclass.constructor.apply(this, arguments);
    
    if( servBuffer.temp.seenSlotBuy == 0 ){
        servBuffer.temp.seenSlotBuy = 1;
		
        servBuffer.apply(function(){notifMgr.runEvent(Notif.ids.townBuildings);});
    }
};

utils.extend(wSlotBuy, wSlot);

WndMgr.regWnd('slot', wSlotBuy);


wSlotBuy.prepareData = function(id, extData){
    var data = wSlot.prepareData(id, extData);
    
    if( !data )
        return false;
    
    data.slot = data.town.slots.getElem(data.id);
	
	if( data.slot && wSlot.selectType(data.id, data.town) == wSlotBuy )
        return data;
		
	return false;
};


wSlotBuy.prototype.calcName = function(){
    this.hashName = 'slot';
    
	return 'slotbuy';
};

wSlotBuy.prototype.getData = function(){
	this.data.cost = this.data.slot.getTown(wofh.town).getSlots().calcSlotCost();
	
	this.dataReceived();
};

wSlotBuy.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.townRes];
};

wSlotBuy.prototype.bindEvent = function(){
	var self = this;
    
	self.wrp.on('click', '.js-slotbuy-btn:not(.-disabled)', function(){
		reqMgr.slotBuy(self.data.slot);
		
		self.close();
	});
};