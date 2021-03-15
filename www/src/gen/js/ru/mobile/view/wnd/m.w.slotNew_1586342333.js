wSlotNew.prototype.afterShow = function(firstShow){
	if( firstShow && this.build )
		this.setTimeout(function(){
			this.scrollIntoWrp(this.wrp.find('.buttonBuildSlot'), {
				$scroll: this.wrp.find('.slotnew-info')
			});
		}, wndMgr.swipeTime + 50);
};