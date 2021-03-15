/**
	Системное меню
*/

pSystMenu = function(){
    this.name = 'systmenu';
	
	pSystMenu.superclass.constructor.apply(this, arguments);

	this.options.expanded = true;
};

utils.extend(pSystMenu, Panel);

pSystMenu.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accTicketNew, Notif.ids.accQuests];
};

pSystMenu.prototype.bindEvent = function(){
	// Выделение кнопки при наведении на иконку
	this.wrp
		.on('mouseover', '.smenuIcon', function(){
			$(this).siblings().addClass('-hover');
		})
		.on('mouseout', '.smenuIcon', function(){
			$(this).siblings().removeClass('-hover');
		})
		.on('click', '.js-smenu-logout', function(){
			appl.logOut();
		});

	if( wofh.platform.fullscreenbutton ){
		this.wrp.on('click', '.js-toggleFrame-btn', function(){
			appl.toggleFrame();
		});
	}
};

pSystMenu.prototype.afterDraw = function(firstDraw){
	this.toggleExpand(firstDraw ? ls.getSMenuShow(true) : this.isExpanded());
};


pSystMenu.prototype.toggleExpand = function(expand){
	pSystMenu.superclass.toggleExpand.apply(this, arguments);
	
	if( Quest.isAvail(Quest.ids.bldAltair1) )
		ls.setSMenuShow(this.isExpanded());

	this.parent.questlist.togglePos(this.isExpanded());
};
	
	
		