Interface.prototype.show = Interface.superclass.show;

Interface.prototype.dataReceived = function(){
	this.ready = false;
	
	this.afterDataReceived();
};