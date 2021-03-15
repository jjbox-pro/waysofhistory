BasePanel = function(){
	BasePanel.superclass.constructor.apply(this, arguments);
};

utils.extend(BasePanel, Block);


BasePanel.prototype.getBaseType = function(){return 'panel';};

BasePanel.prototype.getTypeClass = function(postFix){
	return this.getBaseTypeClass(postFix);
};

BasePanel.prototype.onDataReceived = function(){
	if( this.active ){
		this.setActive(true);
		
		wndMgr.updateZ();
	}
};





Panel = function(){
	Panel.superclass.constructor.apply(this, arguments);
	
	this.tmplWrp = tmplMgr.panel.wrp;
};

utils.extend(Panel, BasePanel);


Panel.prototype.calcTmplFolder = function(){
	return tmplMgr[this.name];
};

Panel.prototype.bindBaseEvent = function(){
	var self = this;
    
    if( !self.options.inactive )
        this.wrp.on('mousedown', function(){
            wndMgr.setActiveWnd(self);
        });
	
	if( this.options.expanded )
		this.wrp.on('click', '.panel-expand-wrp', function(){
			self.toggleExpand();
		});
	else if( this.options.hidden )
		this.wrp.on('click', '.panel-header', function(){
			self.toggleHidden();
		});
};

Panel.prototype.getTmplClass = function(){
	return this.getBaseType() + '-' + Panel.superclass.getTmplClass.apply(this, arguments);
};

Panel.prototype.getTmplWrpData = function(cont){
	var data = {cont: cont, panel: this};
	
	return data;
};

Panel.prototype.createCont = function(){
	// Получаем контент
	var cont = Panel.superclass.createCont.apply(this);

	// Оборачиваем в панельную обёртку
	if( this.tmplWrp )
		return this.tmplWrp(this.getTmplWrpData(cont));   
	else
		return cont;
};


Panel.prototype.getExtClass = function(){
	var cls = '';
	
	if( this.options.mini )
		cls += ' -type-mini';
	
	return cls;
};

Panel.prototype.hasHeader = function(){
	return this.tmpl.header;
};

Panel.prototype.getHeaderCont = function(data){
	return this.tmpl.header(data||this.data);
};

Panel.prototype.setHeaderCont = function(data){
	if( this.hasHeader() )
		this.wrp.find('.panel-header').html(this.getHeaderCont(data));
};

Panel.prototype.hasFooter = function(){return this.tmpl.footer;};

Panel.prototype.getFooterCont = function(data){
	return this.tmpl.footer(data||this.data);
};

Panel.prototype.isFooterLarge = function(){
	return false;
};

Panel.prototype.toggleExpand = function(expand){
	this.expanded = expand === undefined ? !this.expanded : expand;
	
	this.cont.toggleClass('-type-expanded', this.expanded);
};

Panel.prototype.isExpanded = function(){
	return this.expanded||false;
};

Panel.prototype.toggleHidden = function(hidden){
	this.hidden = hidden === undefined ? !this.hidden : hidden;
	
	this.cont.toggleClass('-type-hidden', this.hidden);
};

Panel.prototype.isHidden = function(){
	return this.hidden;
};