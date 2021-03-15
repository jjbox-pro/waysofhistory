bWonders_list.prototype.makeResize = function(){
	if( !this.$wondersBody )
		return;
	
	this.$wondersBody.css({
		'max-height':  this.parent.$contWrp.height() - this.$wondersHead.height()
	});
};



tblWondersLaunchSpaceShips.prototype.onWrpInit = function(){
	this.cont.find('.space-tbl .tbl-tbody').css({
		'max-height': 'none'
	});
};



tblWonders.prototype.onWrpInit = function(){
	var $wonders = this.cont.find('.wonders-tbl');
	
	this.parent.$wondersHead = $wonders.find('.tbl-thead');
	this.parent.$wondersBody = $wonders.find('.tbl-tbody');
	
	this.parent.makeResize();
};