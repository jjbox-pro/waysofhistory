wSlot = function(id, slot){
	wSlot.superclass.constructor.apply(this, arguments);
};

utils.extend(wSlot, Wnd);


wSlot.prepareData = function(id, extData){
    var data = {}, params, town;
    
	if( typeof(id) == 'string' ){
		params = id.split('&');

		id = params.shift();

		if( params.length ){
			params = utils.urlToObj(params.join('&'));

			if( params.town )
				town = wofh.towns[params.town];
		}
	}

	if( id != +id )
		return false;
	
    extData = extData||{};
    
    if( extData.refreshData )
        data.refreshData = extData.refreshData;
    
    data.id = id;
    
    if( town )
        data.town = 
        data.fixedTown = // Используется при обновлении данных городе. Если есть, город не обновляется
        town;
    else
        data.town = wofh.town;
    
    return data;
};

wSlot.selectType = function(slotOrPos, town){
	var slot = slotOrPos instanceof Slot ? slotOrPos : (town||wofh.town).getSlot(slotOrPos),
		retType = false;
        
	if( !slot.isEmpty() || slot.haveActions() )
		retType = wSlotBld;
	else if( slot.isNeedPay() ){
		if( wofh.account.knowsMoney() )
			retType = wSlotBuy; // Непроплаченный слот
	} 
	else
		retType = wSlotNew;

	return retType;
};


wSlot.prototype.onDataReceived = function(firstDraw){
    if( !this.data.refreshData )
        return wSlot.superclass.onDataReceived.apply(this, arguments);
    
    this.setActive(this.data.refreshData.active);
    
    delete this.data.refreshData;
};

wSlot.prototype.refresh = function(){
    var type = wSlot.selectType(this.id);
    
    if( type == this.constructor ){
        this.updateTown(true);
        
        this.show();
        
        return;
    }
    
    var wndIndex = wndMgr.getWndIndex(this),
        wndPos = this.getPos(),
        wndActivity = this.isActive();
    
    this.options.noActivatePrev = true;
    
    this.close();
    
	this.afterRefresh(wndMgr.insertWnd(wndIndex, wSlot.selectType(this.id), this.id, {
        refreshData: {active: wndActivity}
    }), wndActivity, wndIndex, wndPos);
};


wSlot.prototype.updateTown = function(checkFixedTown){
	if( checkFixedTown && this.data.fixedTown )
        return;
    
    this.data.town = wofh.town;
};

wSlot.prototype.afterRefresh = function(wnd, wndActivity, wndIndex, wndPos){
	wnd.moveToPos(wndPos);
};