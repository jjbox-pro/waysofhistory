Wnd = function(id, data, parent){
	this.delegate('constructor', Wnd, [parent]);
	
	this.setId(id);
	
	this.setData(data);
	
	this.tmplWrp = this.calcTmplWrp();
    
    this.initWndOptions();
};
	
utils.extend(Wnd, Block);


Wnd.prepareData = function(id, data){
	return data||{};
};


Wnd.prototype.getTypeName = function(postFix){
	var typeName = Wnd.superclass.getTypeName.apply(this, arguments);
	
	if( typeName )
		typeName = this.getBaseType() + '-' + typeName;
	
	return typeName;
};


Wnd.prototype.getBaseType = function(){return 'wnd';};

Wnd.prototype.getTypeClass = function(postFix){
	var typeClass = Wnd.superclass.getTypeClass.apply(this, arguments);
	
	return this.getBaseTypeClass(postFix) + (typeClass ? ' ' + typeClass : '');
};

Wnd.prototype.getTmplClass = function(){
	var tmplClass = Wnd.superclass.getTmplClass.apply(this, arguments)||'';
	
	if( tmplClass )
		tmplClass = this.getBaseType() + '-' + tmplClass;
	
	return tmplClass;
};

Wnd.prototype.getExtWrpClass = function(){return '';};

Wnd.prototype.getExtClass = function(){
	var cls = '';

	if( this.options.moving )
		cls += ' -type-moving';

	return cls;
};


Wnd.prototype.bindBaseEvent = function(){
	var self = this;

	if( this.options.moving ){
		this.wrp.draggable({
			handle: '.wnd-header-wrp, .wnd-borders-wrp, .-draggable', 
			cancel: '.js-account-header, .js-country-editName',
			containment:[-10000, 0,  10000, 10000], 
			drag: function( event, ui ) {
				if( !self.options.moving )
					return false;
				else
					self.saveWndPos(ui.position);
			}
		});
	}

	this.wrp
		.on('mousedown', function(){
			wndMgr.setActiveWnd(self);
		})
		.on('click', '.js-wnd-close', function(){
			self.close();
		});

	if( this.options.showBack ){
		this.wrp.on('click', '.wnd-back-wrp', function(e){
			if( self.options.canClose )
				self.close();
		});
	}

	if( this.options.showMinimize ){
		this.wrp.on('click', '.js-wnd-minimize', function(){
			if( !$(this).data('-state-minimizing') )
				self.minimize($(this));
		});
	}
};

Wnd.prototype.isFirstDraw = function(){
	return !this.wrp;
};

Wnd.prototype.getTmplWrpData = function(cont){
	var data = {cont: cont, wnd: this};

	return data;
};

Wnd.prototype.createCont = function(){
	// Получаем контент
	var cont = Wnd.superclass.createCont.apply(this);

	// Оборачиваем в оконную обёртку
	if( this.tmplWrp )
		return this.tmplWrp(this.getTmplWrpData(cont));   
	else
		return cont;
};

Wnd.prototype.setWrp = function(){
	if( this.wrp )
		this.wrp.remove();
	
	this.wrp = $('<div class="' + this.getTypeWrpClass() + ' ' + this.getTmplWrpClass() + ' ' + this.getExtWrpClass() + '"></div>');
	
	this.appendWrp();
};

Wnd.prototype.appendWrp = function(){
	wndMgr.cont.append(this.wrp);
};

Wnd.prototype.removeWrp = function(){
	if( !this.wrp )
		return;
	
	this.wrp.remove();

	delete this.wrp;

	this.playSound(EventSnd.events.sysWndClose);
};

Wnd.prototype.afterResize = function(firstShow){
	if( firstShow )
		this.setAutoPos();
};

Wnd.prototype.onIdentShow = function(){};

Wnd.prototype.onFirstShow = function(){};

Wnd.prototype.onDataReceived = function(firstDraw){
	if( firstDraw && !this.ignoreFirstDraw )
		wndMgr.onWndFirstShow(this);
	else if( this.active ){
		this.setActive(true);

		wndMgr.updateZ();
	}
};


Wnd.prototype.setId = function(id){
	this.id = '';
	
	if( typeof(id) == 'string' || typeof(id) == 'number' )
		this.id = id;
};

Wnd.prototype.setData = function(data){
	this.data = data||{};
};

Wnd.prototype.calcTmplWrp = function(){
	return tmplMgr.wnd.wrp;
};

Wnd.prototype.initWndOptions = function(){
	this.options.setHash = true;
	this.options.canClose = true;
	this.options.canCloseAll = true;
	this.options.showBack = false;
	this.options.moving = true;
	this.options.showBorders = true;
	this.options.showButtons = true;
	this.options.clearData = false;
};
//получаем идентичные окна
Wnd.prototype.getIdentWnd = function(){
	var wndList = wndMgr.getWndByType(this.constructor);

	for (var wnd in wndList) {
		wnd = wndList[wnd];

		if( wnd.id == this.id )
			return wnd;
	}

	return false;
};

//получаем конфликтующие окна - их нужно будет удалить перед добавлением нового окна
Wnd.prototype.getConflictWnd = function(){
	return wndMgr.getWndByType(this.constructor);
};

Wnd.prototype.saveWndPos = function(pos){
	var wndPos = ls.getWndPos({});

	if (wndPos && this.name){
		if(!pos)
			pos = this.cont.offset();

		wndPos[this.name] = pos;

		ls.setWndPos(wndPos);
	}
};

//установить позицию по умолчанию
Wnd.prototype.setAutoPos = function(){
	var wndPos = ls.getWndPos({});

	if( this.defaultPos )
		this.setStoredPos();
	else if( wndPos ){
		if(wndPos[this.name] && typeof(this.name) != 'undefined'){
			this.defaultPos = {
				left: wndPos[this.name].left,
				top: wndPos[this.name].top
			};

			this.setStoredPos(true);
		} 
		else
			this.moveToCenter();
	}
	else
		this.moveToCenter();
};

Wnd.prototype.widenToScr = function(){
	this.wrp.css({width: '100%', height: '100%'});
};

//установить позицию из сохранённых данных
Wnd.prototype.setStoredPos = function(forceDelPos){
	this.moveToPos(this.defaultPos);

	if( forceDelPos || this.wasShown() )
		delete this.defaultPos;
};

//установить позицию в центр экрана
Wnd.prototype.moveToCenter = function(){
	var posX = -this.cont.outerWidth()/2,
		posY = -this.cont.outerHeight()/2,
		left = $(window).width()/2 + window.pageXOffset,
		top = $(window).height()/2 + window.pageYOffset;

	top = Math.max(0, top + posY);
	left = Math.max(0, left + posX);

	this.moveToPos(left, top);
};

Wnd.prototype.moveToPos = function(posOrX, y){
	// При определённых обстоятельствах враппер уже удалён при вызове функции
	if( !this.wrp )
		return;
	
	var pos;
	
	if( posOrX instanceof Object )
		pos = posOrX;
	else
		pos = {x: posOrX, y: y};
	
	this.wrp.css({
		left: pos.left === undefined ? pos.x : pos.left, 
		top: pos.top === undefined ? pos.y : pos.top
	});
};

Wnd.prototype.getPos = function(){
	if( this.wrp )
		return this.wrp.offset();

	return {top: 0, left: 0};
};

Wnd.prototype.beforeClose = function(result){};

Wnd.prototype.close = function(result){
	var dontClose = this.beforeClose(result);

	if( !dontClose )
		this.delete(result);
};

Wnd.prototype.onRemove = function(){
	if( this.wrp && this.options.moving )
		this.wrp.draggable('destroy');
	
	Wnd.superclass.onRemove.apply(this, arguments);
};

Wnd.prototype.delete = function(result){
	wndMgr.removeWnd(this);

	this.onRemove();
	
	this.onClose(result);

	this.deleteWrp();
};


Wnd.prototype.activate = function(){
	wndMgr.setActiveWnd(this);
};

Wnd.prototype.deleteWrp = function(){
	this.clearWrp();

	this.removeWrp();
};

Wnd.prototype.onClose = function(result){};

Wnd.prototype.escClose = function(){
	if( this.options.canClose )
		this.close();
};

Wnd.prototype.minimize = function($el){
	var self = this,
		$wrp = this.wrp,
		$contWrp = $wrp.find('.wnd-cont-wrp'),
		minimized = $wrp.hasClass('-state-minimized'),
		height = $wrp.find('.wnd-header-wrp').height(),
		pos = $wrp.offset();

	if( minimized ) {
		pos = $wrp.data('oldPos');

		$wrp.toggleClass('-state-minimized', !minimized);
	} else {
		$wrp.data('oldPos', utils.clone(pos));

		pos.top = utils.getWindowHeight(-height);
		pos.left = utils.getWindowWidth() * 0.5;
	}

	$el	.data('-state-minimizing', true)
		.attr('data-title', minimized ? 'Свернуть' : 'Развернуть');


	$wrp.animate({
		top: pos.top,
		left: pos.left
	}, 200, function(){
		$wrp.toggleClass('-state-minimized', !minimized);

		self.onEndMinimize();

		$el.removeData('-state-minimizing');
	});

	$contWrp.animate({
		width: 'toggle',
		height: 'toggle'
	}, 200, 'linear');
};

Wnd.prototype.onEndMinimize = function(){};

Wnd.prototype.playSound = function(event){
	sndMgr.playEventSnd(event);
};

Wnd.prototype.hasHeader = function(){
	return this.tmpl.header;
};

Wnd.prototype.getHeaderCont = function(data){
	return this.tmpl.header(data||this.data);
};

Wnd.prototype.setHeaderCont = function(data){
	if( this.hasHeader() )
		this.wrp.find('.wnd-header-wrp').html(this.getHeaderCont(data));
};

Wnd.prototype.setClipboard = function(data){
	this.wrp.find('.js-clipboard-wrp').html(tmplMgr.snipet.clipboard(data));
};

Wnd.prototype.getName = function(noHash){
	return this.name+(noHash ? '' : this.getId());
};

Wnd.prototype.setZ = function(z){
	if( this.wrp )
		this.wrp.css('z-index', z);
};

Wnd.prototype.appendToList = function(){
	wndMgr.push(this);
};

Wnd.prototype.insertToList = function(pos){
	wndMgr.insert(pos, this);
};





TooltipWnd = function(cont){
	Block.apply(this);
	
	this.data = {cont: cont};
};

utils.extend(TooltipWnd, Wnd);


TooltipWnd.prototype.calcTypeName = function(){
	return 'tooltip';
};

TooltipWnd.prototype.calcTmplFolder = function(){
	return tmplMgr.wnd.tooltip;
};

TooltipWnd.prototype.initOptions = function(){
	TooltipWnd.superclass.initOptions.apply(this, arguments);
	
	this.options.resizeParent = false;
    this.options.clearData = false;
	this.options.moving = false;
	this.options.showBack = false;
	this.options.canClose = true;
	this.options.noScroll = true;
	this.options.setHash = false;
	this.options.inactive = true;
	this.options.noBlur = true;
	this.options.noActivatePrev = true;
};

// Убираем привязку к нотификациям
TooltipWnd.prototype.getNotifHandler = function(){};
// Убираем установку позиции (передается из вне в функцию moveOn)
TooltipWnd.prototype.setAutoPos = function(){};

TooltipWnd.prototype.beforeResize = function(){};

TooltipWnd.prototype.resize = function(){};

TooltipWnd.prototype.saveWndPos = function(){};

TooltipWnd.prototype.playSound = function(){};

TooltipWnd.prototype.onContHover = function(e){};

//передвинуть к нужным координатам - специальное перемещение для тултипов
//pos{x,y} - координаты мыши относительно экрана
//posSqr{top, bottom, left, right} - расстояние, на которое окно не приближается к контрольной точке
//dir{x,y} - желаемое направление окна относительно pos
//area{top, bottom, left, right} - область за которую тултип не заходит
TooltipWnd.prototype.moveOn = function(pos, posSqr, dir, area, offset){
	if( !pos )
		return this;

	// Отступы по умолчанию
	posSqr = posSqr||{top: 5, bottom: 5, left: 5, right: 5};

	//по умолчанию окно открывается вниз-вправо
	dir = dir||{x: '+', y: '+'};

	//зона по умолчанию - всё окно
	area = area||{x: $(document).width(), y: $(document).height()};
	
	offset = offset||{x: 0, y: 0};
	
	//блок, который позиционируем
	var contWidth = this.wrp.innerWidth(), // Ширина с учтом padding
		contHeight = this.wrp.innerHeight(); // Высота с учтом padding

	//проверяем желаемое направление, иначе меняем на обратное
	if( dir.x == '+' ){
		if( pos.x + posSqr.right + contWidth > area.x )
			dir.x = '-';
	} 
	else{
		if( pos.x - posSqr.left - contWidth < 0 )
			dir.x = '+';
	}

	if( dir.y == '+' ){
		if( pos.y + posSqr.bottom + contHeight > area.y )
			dir.y = '-';
	}
	else{
		if( pos.y - posSqr.top - contHeight < 0 )
			dir.y = '+';
	}
	
	var contPos = {};
	contPos.left = Math.max(0, pos.x + offset.x + (dir.x == '+' ? posSqr.right : -posSqr.left - contWidth));
	contPos.top = Math.max(0, pos.y + offset.y + (dir.y == '+' ? posSqr.bottom : -posSqr.top - contHeight));
	
	this.wrp.css(contPos);
	
	return this;
};





/***********************************************
 * Контентное окно (контент передается из вне) *
 ***********************************************/

function ContentWnd(contOrTmpl, options){
	this.unpackOptionsCallbacks(options);
	
	this.delegate('constructor', ContentWnd);
	
	this.unpackOptionsData(options);
	
	this.extendOptions(options);
	
	this.setDataCont(contOrTmpl);
}

utils.extend(ContentWnd, Wnd);


ContentWnd.prototype.addTmplClass = function(cls){
	this.wrp.find('.'+this.getTmplClass()).addClass(cls||'');
};

ContentWnd.prototype.initWndOptions = function(){
	this.delegate('initWndOptions', ContentWnd, arguments);
	
	this.options.setHash = false;
};

ContentWnd.prototype.calcTmplFolder = function(){
	return tmplMgr.wnd.tmpl;
};

ContentWnd.prototype.getIdentWnd = function(){
	return false;
};


ContentWnd.prototype.getHeaderCont = function(){
	return this.options.header;
};

ContentWnd.prototype.hasHeader = ContentWnd.prototype.getHeaderCont;


ContentWnd.prototype.unpackOptionsCallbacks = function(options){
	if( !options )
		return;
	
	if( options.callbacks )
		$.extend(this, options.callbacks);
};

ContentWnd.prototype.unpackOptionsData = function(options){
	if( !options )
		return;
	
	if( options.data )
		$.extend(this.data, options.data);
};

ContentWnd.prototype.extendOptions = function(options){
	$.extend(this.options, options);
	
	delete this.options.callbacks;
	
	delete this.options.data;
};

ContentWnd.prototype.setDataCont = function(contOrTmpl){
	if( contOrTmpl instanceof Object )
		this.tmpl = contOrTmpl;
	else
		this.data.cont = contOrTmpl;
};





/****************
 * Простое окно *
 ****************/
 
function SimpleWnd(contOrTmpl, options){
	this.delegate('constructor', SimpleWnd, arguments);
}

utils.extend(SimpleWnd, ContentWnd);


SimpleWnd.prototype.calcTypeName = function(){
	return 'simple';
};





/******************
 * Модальное окно *
 ******************/

function ModalWnd(contOrTmpl, options){
	this.delegate('constructor', ModalWnd, arguments);
}

utils.extend(ModalWnd, ContentWnd);


ModalWnd.prototype.calcTypeName = function(){
	return 'modal';
};


ModalWnd.prototype.initWndOptions = function(){
	this.delegate('initWndOptions', ModalWnd, arguments);
	
	this.options.showBack = true;
};





/***************************************
 * Модальное окно с плавным появлением *
 ***************************************/

function SmoothModalWnd(contOrTmpl, options){
	this.delegate('constructor', SmoothModalWnd, arguments);
}

utils.extend(SmoothModalWnd, ModalWnd);


SmoothModalWnd.prototype.calcTypeName = function(){
	return 'smooth';
};

SmoothModalWnd.prototype.initWndOptions = function(){
	this.delegate('initWndOptions', SmoothModalWnd, arguments);
	
	this.options.transitionTime = 1500;
};

SmoothModalWnd.prototype.beforeClose = function(result){
	if( result )
		return;
	
	this.cont.removeClass('-type-visible');
	
	this.setTimeout(function(){
		this.close(true);
	}, this.options.transitionTime);
	
	return true;
};

SmoothModalWnd.prototype.afterContSet = function(){
	this.setTimeout(function(){
		this.cont.addClass('-type-visible');
	}, 0);
};

SmoothModalWnd.prototype.saveWndPos = function(){};

SmoothModalWnd.prototype.setAutoPos = function(){
	this.moveToCenter();
};





/******************************
 * Окно редактирования текста *
 ******************************/

function TextEditWnd(contOrTmpl, options){
	this.delegate('constructor', TextEditWnd, arguments);
}

utils.extend(TextEditWnd, ModalWnd);


TextEditWnd.prototype.calcTypeName = function(){
	return 'textEdit';
};

TextEditWnd.prototype.calcTmplFolder = function(){
	return tmplMgr.wnd.tmpl.textEdit;
};

TextEditWnd.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.wnd-textEdit-saveBtn', function(){
			self.saveText();
		});
};

TextEditWnd.prototype.afterContSet = function(firstDraw){
	if( firstDraw )
		this.enableEdit();
};


TextEditWnd.prototype.saveText = function(){
	if( this.isEditDisabled() )
		return;

	this.onEdit(this.getEditedText());

	this.close();
}; 

TextEditWnd.prototype.getEditedText = function(){
	return this.cont.find('.wnd-textEdit-textarea').val();
}; 

TextEditWnd.prototype.disableEdit = function(){
	this.toggleEdit(false);
};

TextEditWnd.prototype.enableEdit = function(){
	this.toggleEdit(true);
};

TextEditWnd.prototype.toggleEdit = function(state, noAlertToggle){
	if( this.isEditEnabledFlag != state ){
		this.wrp.find('.wnd-textEdit-textarea').prop('disabled', !state);
	
		this.wrp.find('.wnd-textEdit-saveBtn').toggleClass('-disabled', !state);

		if( this.data.alert && !noAlertToggle )
			this.wrp.find('.wnd-textEdit-alert').toggleClass('-hidden', state);
		
		this.isEditEnabledFlag = state;
	}
};

TextEditWnd.prototype.isEditDisabled = function(){
	return !this.isEditEnabledFlag;
};

TextEditWnd.prototype.onEdit = function(editedText){};





/************************
 * Окно выбора элемента *
 ***********************/

function SelectWnd(list, options){
	this.delegate('constructor', SelectWnd, ['', options]);
	
	this.data.list = list;
	
	this.data.isEqual = this.data.isEqual||SelectWnd.isEqual;
	this.data.elemTmpl = this.data.elemTmpl||snip.acc;
}

utils.extend(SelectWnd, ModalWnd);


SelectWnd.isEqual = function(elem, defElem){
	if( defElem === undefined )
		return false;

	elem = elem instanceof Object ? elem.id : elem;
	defElem = defElem instanceof Object ? defElem.id : defElem;
	
	return elem == defElem;
};


SelectWnd.prototype.calcTmplFolder = function(){
	return tmplMgr.wnd.tmpl.select;
};

SelectWnd.prototype.bindEvent = function(){
	var self = this;
	
	this.wrp
		.on('click', '.js-select-elem', function(){
			self.close(self.data.list[$(this).data('key')]);
		});

};

SelectWnd.prototype.beforeClose = function(elem){
	if ( elem !== undefined )
		return this.onSelect(elem, this.data.defElem);
};

SelectWnd.prototype.afterDraw = function(){
	this.initScroll({scrollbarPosition: 'outside'});
};

SelectWnd.prototype.onSelect = function(elem){};





/*********************
 * Всплывающее окно  *
 *********************/

function PopupWnd(contOrTmpl, options){
	this.delegate('constructor', SelectWnd, arguments);
}

utils.extend(PopupWnd, ContentWnd);


PopupWnd.prototype.initWndOptions = function(){
	PopupWnd.superclass.initWndOptions.apply(this, arguments);
	
	this.options.setHash = false;
	this.options.moving = false;
	this.options.showButtons = false;
	this.options.showBack = true;
};

PopupWnd.prototype.calcTypeName = function(){
	return 'popup';
};

PopupWnd.prototype.calcTmplFolder = function(){
	return tmplMgr.wnd.tmpl.popup;
};

PopupWnd.prototype.getExtClass = function(){
	var cls = '';
	
	if( this.options.rubber )
		cls += ' -type-rubber';
	
	return cls;
};

PopupWnd.prototype.addBaseNotif = function(){
	this.notif.other[Notif.ids.resize] = this.makeResize;
};

PopupWnd.prototype.makeResize = function(byWindow){
	if( byWindow )
		this.setAutoPos();
};





/*********
 * Алерт *
 *********/

function AlertWnd(contOrTmpl, options){
	this.delegate('constructor', AlertWnd, arguments);
	
	if( !this.data.cont ) 
		this.data.cont = tmplMgr.alert.def();
}

utils.extend(AlertWnd, PopupWnd);


AlertWnd.prototype.setDataCont = function(contOrTmpl){
	AlertWnd.superclass.setDataCont.apply(this, arguments);
	
	if( !contOrTmpl ) 
		this.data.cont = tmplMgr.alert.def();
};

AlertWnd.prototype.bindBaseEvent = function(){
	AlertWnd.superclass.bindBaseEvent.apply(this, arguments);
	
	var self = this;
	
	this.wrp.on('click', '.js-popup-close', function(){
		self.close();
	});
};

AlertWnd.prototype.getData = function(){
	this.data.isAlert = true;
	
	return AlertWnd.superclass.getData.apply(this, arguments);
};





/***********
 * Конфирм *
 ***********/

function ConfirmWnd(contOrTmpl, options){
	this.delegate('constructor', ConfirmWnd, arguments);
}

utils.extend(ConfirmWnd, PopupWnd);


ConfirmWnd.prototype.setDataCont = function(contOrTmpl){
	ConfirmWnd.superclass.setDataCont.apply(this, arguments);
	
	if( !contOrTmpl ) 
		this.data.cont = tmplMgr.confirm.def();
};

ConfirmWnd.prototype.bindBaseEvent = function(){
	ConfirmWnd.superclass.bindBaseEvent.apply(this, arguments);
	
	var self = this;
	
	this.wrp
		.on('click', '.js-popup-ok', function(){
			if( !$(this).hasClass('-disabled') )
				self.close(true);
		})
		.on('click', '.js-popup-cancel', function(){
			self.close(false);
		});
};

ConfirmWnd.prototype.getData = function(){
	this.data.isConfirm = true;
	
	this.setButtonsText();
	
	ConfirmWnd.superclass.getData.apply(this, arguments);
};
	
	ConfirmWnd.prototype.setButtonsText = function(){
		this.data.okText = this.options.okText;
		this.data.cancelText = this.options.cancelText;
	};
	
ConfirmWnd.prototype.onClose = function(result){
	if( result )
		this.onAccept();
	else
		this.onCancel();
};

ConfirmWnd.prototype.onAccept = function(){};

ConfirmWnd.prototype.onCancel = function(){};


ConfirmWnd.prototype.forbidAccept = function(){
	this.toggleAccept(true);
};

ConfirmWnd.prototype.allowAccept = function(){
	this.toggleAccept(false);
};

ConfirmWnd.prototype.toggleAccept = function(state){
	this.wrp.find('.js-popup-ok').toggleClass('-disabled', state);
};