/**
	Попап с информацией о юните
*/

wUnitInfo = function(id, unit){
	this.name = 'unitinfo';
	
	wUnitInfo.superclass.constructor.apply(this, arguments);
	
	this.options.clipboard = true;
};

utils.extend(wUnitInfo, Wnd);

WndMgr.regWnd('unitinfo', wUnitInfo);


wUnitInfo.prepareData = function(id){
    return {unit: new Unit(id)};
};


wUnitInfo.prototype.bindEvent = function(){
    var self = this;
	
    this.wrp
		.on('click', '.js-unitinfo-abilLink', function(){
			self.close();
		});
};

wUnitInfo.prototype.afterDraw = function(){
	this.setClipboard({tag:'u' + this.data.unit.id});
};

wUnitInfo.prototype.getConflictWnd = wUnitInfo.prototype.getIdentWnd;
