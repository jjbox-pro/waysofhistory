pBldQueue.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.capacityIcon());
};

utils.overrideMethod(pBldQueue, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	pBldQueue.superclass.afterDraw.apply(this, arguments);
});


pBldQueue.prototype.getSide = function(){
	return 'right';
};

pBldQueue.prototype.afterShow = function(){};