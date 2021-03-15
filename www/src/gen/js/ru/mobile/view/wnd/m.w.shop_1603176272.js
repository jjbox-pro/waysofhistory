wShop.prototype.initScroll = function(){};


wShop.prototype.scrollToDetails = function(){
	this.scrollIntoWrp(this.$cont.find('.shop-details'));
};


wShop.prototype.getRowLen = function(){
	return 6;
};





utils.reExtend(wShopPayment, OriginWnd);





utils.reExtend(wShopSpecialists, OriginWnd);