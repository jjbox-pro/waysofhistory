tabTownsProm.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	utils.getElemSize(this.wrp, {callback: function($cont){
		utils.adjustBlocksHeight($cont, '.stock-block > ul > li', function($block){
			$block.removeClass('-hidden').toggleClass('-hidden', !$block.height());
		});
	}});
};

tabTownsTrade.prototype.makeResize = function(){
	if( !this.wrp )
		return;
	
	utils.adjustBlocksHeight(this.wrp, '.market-block');
};