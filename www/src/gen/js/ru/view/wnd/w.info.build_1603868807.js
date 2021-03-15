/**
	Окно с информацией о строении
*/

wBuildInfo = function(id, data){
	this.name = 'buildinfo';
	
	wBuildInfo.superclass.constructor.apply(this, arguments);
    
	this.options.clipboard = true;
};

utils.extend(wBuildInfo, Wnd);

WndMgr.regWnd('buildinfo', wBuildInfo);


wBuildInfo.prepareData = function(id){
	var slot = new Slot(id, 1);
	
	if( slot.isEmpty() )
		return false;
	
    return {slot: slot};
};


wBuildInfo.prototype.calcChildren = function(){
	this.children.desc = tabBuildInfo_desc;
	this.children.levels = tabBuildInfo_levels;
};

wBuildInfo.prototype.beforeShowChildren = function(){
    this.tabs = new Tabs(this.cont);
	
	this.tabs.addTabs(this.children);
};

wBuildInfo.prototype.afterDraw = function(){
	this.setClipboard({tag:'b' + this.data.slot.id});
	
	this.tabs.openTab('desc');
	
	this.initScroll({scrollbarPosition: 'outside', advanced: {updateOnContentResize: false}});
};

wBuildInfo.prototype.getConflictWnd = wBuildInfo.prototype.getIdentWnd;



tabBuildInfo_desc = function(parent){
	this.name = 'desc';
	this.tabTitle = 'Описание';
	
	tabBuildInfo_desc.superclass.constructor.apply(this, arguments);
};

utils.extend(tabBuildInfo_desc, Tab);

tabBuildInfo_desc.prototype.getTmplData = function(){
	this.data.slot = this.parent.data.slot;
	
	return this.data;
};



tabBuildInfo_levels = function(parent){
	this.name = 'levels';
	this.tabTitle = 'По уровням';
	
	tabBuildInfo_levels.superclass.constructor.apply(this, arguments);
};

utils.extend(tabBuildInfo_levels, Tab);

tabBuildInfo_levels.prototype.getTmplData = function(){
	this.data.slot = this.parent.data.slot;
	
	return this.data;
};