pStock.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.capacityIcon());
};

utils.overrideMethod(pStock, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	pStock.superclass.afterDraw.apply(this, arguments);
});


pStock.prototype.getSide = function(){
	return 'right';
};

pStock.prototype.showEconomy = function(){};