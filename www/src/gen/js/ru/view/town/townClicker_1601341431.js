var TownClicker = function(cont, data, pos, town){
    this.cont = cont;
    this.data = data;
    this.pos = pos;
    this.town = town;
    
    this.move();
	
    this.explode();
};

//анимация перемещения кликера
TownClicker.prototype.move = function() {
    //создаём объект - движущийся кликер;
    var $clickerEl = $(tmplMgr.town.clickerM(this.data.res.getId()));
	
	this.delegateClick($clickerEl);
	
	this.cont.append($clickerEl);
	
//    this.cont.append(clickerEl);
	
    $clickerEl.css({top: this.pos.y, left: this.pos.x});

    //находим цель
	var stock = wndMgr.interfaces.town.getStock(),
		destEl = stock.getResEl(this.data.res.getId()),
		destPos = this.calcDestPos(stock, destEl);
	
    //запускаем анимацию
    setTimeout(function(){$clickerEl.css({left: destPos.left-1});}, 50);
    setTimeout(function(){$clickerEl.css({top: destPos.top});}, 100);
    setTimeout(function(){$clickerEl.remove();}, 2000);
};

TownClicker.prototype.calcDestPos = function(stock, destEl){
	var destPos;
	
	if( destEl.length )
        destPos = destEl.offset();
	
    if( !destPos || !(destPos.top + destPos.left) ){
		var destSize = this.getDestSize(stock);
		
        destPos = this.getDestOffset(stock, destSize);
		
        destPos.top += destSize.height * 0.5 - 9; // 9 - половина ширины картинки ресурса
        destPos.left += destSize.width * 0.5 - 9; // 9 - половина ширины картинки ресурса
    }
	
	return destPos;
};

TownClicker.prototype.getDestSize = function(stock){
	return stock.getSizePx();
};

TownClicker.prototype.getDestOffset = function(stock, destSize){
	return stock.cont.offset();
};

//анимация взрыва кликера
TownClicker.prototype.explode = function() {
    var $clickerEl = $(tmplMgr.town.clickerE('+' + (utils.toInt(this.data.res.getCount()))));
   
	this.delegateClick($clickerEl);
	
	this.cont.append($clickerEl);
    
	$clickerEl.css({top: this.pos.y, left: this.pos.x});

    setTimeout(function(){$clickerEl.addClass('-run');}, 50);

    setTimeout(function(){$clickerEl.remove();}, 2000);
};

TownClicker.prototype.delegateClick = function($el){
	$el.on('click', function(e){
		var pos = {x: e.pageX, y: e.pageY};
		
		$('#town-canvas')
			.trigger('mousedown', [pos])
			.trigger('mouseup', [pos]);
	 });
};