/*************
 * Интерфейс *
 *************/

Interface = function(){
	Interface.superclass.constructor.apply(this);
	
	wndMgr.addInterface(this);
	
	this.initStaticNotif();
};

utils.extend(Interface, Block);


Interface.prototype.setId = function(id){};

Interface.prototype.getId = function(){
	return '';
};

Interface.prototype.show = function(noClearList){
	if( !noClearList )
		wndMgr.clearList();

	Interface.superclass.show.apply(this);
};

Interface.prototype.isFirstDraw = function(){
	return !this.parent;
};

Interface.prototype.setWrp = function(){
	if( this.wrp )
		this.wrp.remove();
	
	this.wrp = $('<div class="interface-wrp ' + this.getTmplWrpClass() + '"></div>');
	
	wndMgr.cont.append(this.wrp);
};

Interface.prototype.beforeShowChildren = function(){
	for(var i in this.children)
		wndMgr.push(this.children[i]);
};

Interface.prototype.close = function(){
	this.clearWrp();
	
	this.onRemove();
	
	// Пока не чистим, т.к. чилд может использоватся при отложенных вызовах, когда интерфейс уже высвободил ресурсы
	//this.clearChildren(); // Чтобы не висели лишние объекты в памяти у закрывшегося интерфейса
};


Interface.prototype.onIdChange = function(newId){
	this.setId(newId);
	
	this.show();
};


Interface.prototype.initStaticNotif = function(){};

Interface.prototype.esc = function(){};

Interface.prototype.update = function(){
	this.show();
};