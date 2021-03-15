pMapMini = function(parent){
    pMapMini.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapMini, hPanel);


pMapMini.prototype.calcName = function(){
	return 'mini';
};

pMapMini.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

pMapMini.prototype.addNotif = function(){
    if( !this.canDisplay() )
        this.notif.show = [{id: Notif.ids.accQuests, params: [Quest.ids.deposit]}];
};

pMapMini.prototype.canDisplay = bMapMini.prototype.canDisplay;

pMapMini.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.pathIcon());
};

pMapMini.prototype.calcChildren = function(){
	this.children.minimap = bMapMini;
};


pMapMini.prototype.abortSwipe = function(){
	this.$contBlk.trigger('swipeabort');
};

pMapMini.prototype.getSide = function(){
	return 'bottom';
};