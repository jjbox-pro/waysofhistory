pMapR = function(parent){
    pMapR.superclass.constructor.apply(this, arguments);
};

utils.extend(pMapR, Panel);


pMapR.prototype.calcName = function(){
	return 'mapR';
};

pMapR.prototype.calcTmplFolder = Block.prototype.calcTmplFolder;

pMapR.prototype.modifyCont = function(){
	this.cont.find('.panel-expand-wrp').append(snip.filterIcon());
};

pMapR.prototype.calcChildren = function(){
	this.children.right = bMapR;
};


pMapR.prototype.getSide = function(){
	return 'right';
};

pMapR.prototype.onToggleStart = 
pMapR.prototype.onToggleCancel = function(duration){
	this.centerMapOnNewPosTMT(duration);
};
    
    pMapR.prototype.centerMapOnNewPosTMT = function(duration){
        if( !this.newMapPosTMT )
            return;

        this.parent.inf.moveTo(this.newMapPosTMT, {
            offset: {x: this.isExpanded() ? -0.5 * this.cont.width() : 0},
            duration: this.getExpandDuration(duration),
            forceMove: true
        });

        delete this.newMapPosTMT;
    };