

/******
 * Вкладка
 */

Tab = function(parent){
	Tab.superclass.constructor.apply(this, arguments);
};
	
utils.extend(Tab, Block);


Tab.prototype.bind = function(){};

Tab.prototype.applyStatus = function(){
    this.tab.removeClass('-disabled');
};

Tab.prototype.afterOpenTab = function(){
}; // Заглушка

Tab.prototype.onDisplay = function(){}; // Заглушка

Tab.prototype.resize = function(){        
    Block.prototype.resize.apply(this);
};

Tab.prototype.getOffsetTop = function(){
    return this.wrp.offset().top;
};

// Если был асинхронный запрос получения данных, проверям активность вкладки
Tab.prototype.beforeResize = function(){
    if( this.tabs )
        this.wrp.toggleClass('-hidden', this.tabs.activeTab && this != this.tabs.activeTab);
};

Tab.prototype.isClickable = function(){
    return true;
};

Tab.prototype.getHref = function(){
    return '';
};

Tab.prototype.getIcon = function(){
    return false;
};

Tab.prototype.getCls = function(){
    return '';
};

Tab.prototype.getAttrs = function(){
    return '';
};

Tab.prototype.getLinkClass = function(){
    return this.tabs ? this.tabs.linkClass.slice(1) : 'js-tabLink';
};

Tab.prototype.isActiveTab = function(){
    return this.tabs && this.tabs.activeTab == this;
};

Tab.prototype.onHide = function(){};

Tab.prototype.updScroll = function(){
    Tab.superclass.updScroll.apply(this, arguments);

    if( this.table && this.table.scroll )
        this.table.scroll.update();
};





Tabs = function(cont, parent, options){
	this.options = options||{};
	
    this.linkClass = '.' + (this.options.linkClass||'js-tabLink');
    this.wrpClass = '.js-tabWrp';
    this.linkField = 'tab';
    
    this.parent = parent;//родитель
    this.cont = cont;//контейнер
    this.tabCont = this.cont.find('.tabs-cont');//контейнер для вкладок - там выделяются места для вкладок, для которых нет определенного в верстке врапера
    
    this.activeTab = false;//поле по которому сортируем
    this.tabs = {};
    this.order = [];//упорядоченный список вкладок для карусели
    this.activeTabI = -1; //положение выделенной вкладке в упорядоченном списке
    this.dispView = 0;//расстояние, насколько передвинута карусель
    
    this.bind();
};

Tabs.prototype.addTab = function(tab){
    this[tab.name] = tab;
    
    tab.cont = this.cont.find(this.wrpClass+'[data-'+this.linkField+'="'+tab.name+'"]');
    tab.tab = this.cont.find(this.linkClass+'[data-'+this.linkField+'="'+tab.name+'"]');
    
    tab.bind();
    tab.applyStatus();
};

Tabs.prototype.addTabs = function(tabs){
    for(var tab in tabs){
        if(tabs[tab] instanceof Tab){
            this.addTab2(tabs[tab]);
        }
    }
};

Tabs.prototype.addTab2 = function(tab){
    //пишем в себи и в родителя ссылку на вкладку
    //this[tab.name] = tab;
    this.tabs[tab.name] = tab;
    this.order.push(tab);
	
	tab.tabs = this;
    
    //присоединяем кнопку
    tab.tab = this.cont.find(this.linkClass+'[data-'+this.linkField+'="'+tab.name+'"]');
    if(tab.tab.length == 0){
        tab.tab = $(tmplMgr.tabs.tab(tab));
		
        this.cont.find('.tabs-wrp').append(tab.tab);
    }
    
    //ищем врапер, если не находим, создаём
    var wrp = this.cont.find('.'+tab.getTmplWrpClass());
    if(wrp.length == 0){
        wrp = $('<div class="tab-wrp '+tab.getTmplWrpClass()+'"></div>');
		
        this.tabCont.append(wrp);
    }
    
    tab.applyStatus();
};

Tabs.prototype.bind = function(){
    var self = this;
    
    this.cont.find(this.linkClass).addClass('-disabled');
    
    this.cont.on('click', this.linkClass, function(){
        if ( $(this).hasClass('-disabled') ) return;
		
        var tabName = $(this).data(self.linkField);
		
        self.openTab(tabName||false);
    });
};
//открывает вкладку, если пустота - отключает все вкладки
Tabs.prototype.openTab = function(tab, forceOpen){
    var self = this;
    
    if( typeof(tab) == 'string' )
		tab = this.getTab(tab);
    
	if( !forceOpen && this.notOpenTab(tab) )
        return;
	
    if( self.activeTab == tab )
        return;
    
    if( self.activeTab )
        self.activeTab.onHide();
    
	self.onHideTab(self.activeTab);
	
    self.activeTab = tab;
	
    if( self.activeTab )
        self.activeTab.onDisplay();
    
    //вычисляем положение активной вкладки
    for(this.activeTabI = 0; this.activeTabI < this.order.length; this.activeTabI++){
        if(this.order[this.activeTabI] == this.activeTab){
            break;
        }
    }
    
    //старые выделялки
    this.cont.find(this.linkClass).each(function(){
        var el = $(this);
        el.toggleClass('-active', self.activeTab && el.data(self.linkField) == self.activeTab.name);
    });
    
    this.cont.find(this.wrpClass).each(function(){
        var el = $(this);
        el.toggleClass('-hidden', self.activeTab && el.data(self.linkField) != self.activeTab.name);
    });
    
    //новые выделялки
    for(tab in this.tabs){
        tab = this.tabs[tab];
        
		tab.tab.toggleClass('-active', self.activeTab && tab == self.activeTab);
		
        if( tab.wrp )
            tab.wrp.toggleClass('-hidden', self.activeTab && tab != self.activeTab);
    }
	
    if( self.activeTab )
        self.activeTab.afterOpenTab();
	
	if( self.activeTab )
		self.activeTab.updScroll();
	
    self.onOpenTab(self.activeTab);
	
	return this.activeTab;
};

Tabs.prototype.getTab = function(tabName){
	return this.tabs[tabName];
};

Tabs.prototype.getTab = function(tabName){
	return this.tabs[tabName];
};

Tabs.prototype.notOpenTab = function(){
	return false;
};

Tabs.prototype.onOpenTab = function(tab){};

Tabs.prototype.onHideTab = function(tab){};

Tabs.prototype.reload = function(){
	var $tabs = this.cont.find('.tabs-wrp').html(''),
		activeTab = this.activeTab;
	
	for(var tab in this.tabs){
		tab = this.tabs[tab];
		tab.tab = $(tmplMgr.tabs.tab(tab));
		$tabs.append(tab.tab);
	}
	
	this.activeTab = false;
	
	this.openTab(activeTab);
};