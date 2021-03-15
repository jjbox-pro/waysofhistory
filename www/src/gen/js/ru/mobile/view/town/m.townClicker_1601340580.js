TownClicker.prototype.getDestSize = function(stock){
	var size = {width: 0, height: 0};

	if( !this.cont )
		return size;

	if( stock.$cont ){
		size.width = stock.$cont.width();

		size.height = stock.$cont.height();
	}

	return size;
};

TownClicker.prototype.getDestOffset = function(stock, destSize){
	if( !(destSize.x + destSize.y) ){
		var $expand = this.getDestElem(stock);
        
		destSize.width = $expand.width(),
		destSize.height = $expand.height();
        
		return $expand.offset()||{left: 0, right: 0};
	}

	return stock.cont.offset();
};

    TownClicker.prototype.getDestElem = function(stock){
        return stock.cont.find('.panel-expand-wrp');
    };