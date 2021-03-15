pGarrison.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.icon(snip.c.townIcon, 'battle'));
};

utils.overrideMethod(pGarrison, 'afterDraw', function __method__(){
	__method__.origin.apply(this, arguments);
	
	pGarrison.superclass.afterDraw.apply(this, arguments);
});

pGarrison.prototype.afterShow = function(){};


pGarrison.prototype.getContHeight = function(){
	if( this.cont )
		return utils.getElemSize(this.cont.find('.garrison-list-scroll')).height;
	else
		return 0;
};

pGarrison.prototype.toggleExpand = function(){
	pGarrison.superclass.toggleExpand.apply(this, arguments);
	
	if( this.isExpanded() )
		this.children.garrison.setItemWidth();
};

pGarrison.prototype.getSide = function(){
	return 'left';
};