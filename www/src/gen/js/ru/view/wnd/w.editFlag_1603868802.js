wEditFlag = function(id, data){
	wEditFlag.superclass.constructor.apply(this, arguments);
};

utils.extend(wEditFlag, Wnd);

WndMgr.regWnd('editFlag', wEditFlag);


wEditFlag.prepareData = function(){
	var data = wofh.account.isHead() ? {} : false;
	
    return data;
};


wEditFlag.prototype.calcName = function(){
	return 'editFlag';
};

wEditFlag.prototype.calcChildren = function(){
	this.children.view = wEditFlag_view;
};



wEditFlag_view = function(){
	this.name = 'view';
	
	wEditFlag_view.superclass.constructor.apply(this, arguments);
	
	this.options.hasReqData = true;
};

utils.extend(wEditFlag_view, Block);


wEditFlag_view.errors = {};
wEditFlag_view.errors[ErrorX.ids.WEbadData] = 'Использованы несовместимые цвета';
wEditFlag_view.errors[ErrorX.ids.WEalreadyUsed] = 'Такой флаг уже используется другой страной';
wEditFlag_view.errors[ErrorX.ids.WEbadData2] = 'Для сплошного необходимо использовать дополнительный элемент';


wEditFlag_view.prototype.bindEvent = function(){
    var self = this;
	
	// Основа
	this.wrp
		.on('change', '#t', function() {
			var hide = self.fTypes[0];
			var show = self.fTypes[$(this).val()];
			// Cкрываем-отображаем элементы
			for(var i=0; i<hide.length; i++){
				self.toggleElement(self.wrp.find('#'+hide[i]), $.inArray(hide[i], show) != -1)
			}
			// Обновляем отображенные элементы
			for(var i=0; i<show.length; i++){
				self.wrp.find('#'+show[i]).change();
			}
		})
		// Доп. элемент
		.on('change', '#add', function() {
			self.toggleElement(self.wrp.find('#c4'), $(this).val() > 0);
		})
		// Изображение
		.on('change', '#pic', function() {
			self.toggleElement(self.wrp.find('#c5, #xy'), $(this).val() > 0);
		})
		// Количество цветов в зависимости от кол-ва полосок
		.on('change', '#pl', function() {
			self.toggleElement(self.wrp.find("#c3"), $(this).val() != 2);
		})
		.on('click', '.flag_try', function() {
			self.tryFlag();
		})
		.on('click', '.flag_rand', function() {
			self.tryFlag(true);
		})
		.on('click', '.flag_cur', function() {
			self.showFlag(self.data);
		})
		.on('click', '.flag_set', function() {
			self.setFlag();
		})
		.on('submit', 'form', function() {
			return false;
		});
};

wEditFlag_view.prototype.getData = function(){
	var self = this;
	
	this.countReq = 1;
	
	var loaderId = contentLoader.start(
		this.parent.wrp.find('.wnd-cont-wrp'), 
		0,
		function(){
			self.getReqData(function(){
				reqMgr.getMyCountryData(function(resp, reqId){
					self.tryProcessResp(
						resp, reqId,
						function(){
							contentLoader.stop(loaderId);
							
							if( !resp || !resp.country || !resp.country.flagdata ){
								this.parent.close();
								
								return;
							}
							
							this.data = resp.country.flagdata;
							
							this.dataReceived();
						}
					);
				});
			});
		}
	);
};

wEditFlag_view.prototype.dataReceived = function(){
	if( !(--this.countReq) ){
		contentLoader.stop(this.loaderId);
		
		wEditFlag_view.superclass.dataReceived.apply(this, arguments);
	}
};

wEditFlag_view.prototype.afterDraw = function() {
	this.showFlag(this.data);
	
	this.initScroll();
};


wEditFlag_view.prototype.showFlag = function(data){
	this.wrp.find('#t').val(data.type).change();
	this.wrp.find('#add').val(data.addon);
	this.wrp.find('[name=p1]:enabled').val(data.parameter);
	
	this.wrp.find('#pic').val(data.image.n);
	this.wrp.find('[name=px]').val(data.image.x);
	this.wrp.find('[name=py]').val(data.image.y);
	
	this.wrp.find('#pl:enabled').change();
	this.wrp.find('#add').change();
	this.wrp.find('#pic').change();

	this.wrp.find('#c1').val(data.color[0]);
	this.wrp.find('#c2:enabled').val(data.color[1]);
	this.wrp.find('#c3:enabled').val(data.color[2]);
	this.wrp.find('#c4:enabled').val(data.color[3]);
	this.wrp.find('#c5:enabled').val(data.color[4]);

	this.showImgs(data.filename);
};

wEditFlag_view.prototype.showImgs = function(filename){
	this.wrp.find('.flag_imgS').attr('src', reqMgr.prepareRequestUrl('/gen/flag/-'+filename+'.gif'));
	this.wrp.find('.flag_imgB').attr('src', reqMgr.prepareRequestUrl('/gen/flag/'+filename+'.gif'));
};

wEditFlag_view.prototype.toggleElement = function(element, toggle){
		element.toggleClass('dN', !toggle);
		if (toggle) {
			element.removeAttr('disabled');
		} else {
			element.attr('disabled', 'disabled');
		}
	};

wEditFlag_view.prototype.checkFlag = function(){
	var t1 = this.wrp.find('#t').val();
	var add = this.wrp.find('#add').val();
	var pic = this.wrp.find('#pic').val();

	if (t1 == 3 && add == 0 && pic == 0) return ErrorX.ids.WEbadData2;
	
	return ErrorX.ids.WEok;
};

wEditFlag_view.prototype.tryFlag = function(rand){
	var self = this;
	
	var loaderId = contentLoader.start( 
		this.wrp.find('.flag_' + (rand ? 'rand' : 'try') + '_wrp'), 
		0, 
		function(){
			var error = rand ? 0 : self.checkFlag();
			
			if ( error )
				contentLoader.stop(loaderId, false, wEditFlag_view.errors[error]);
			else{
				var data = rand ? {random:1} : utils.urlToObj(self.wrp.find('form').serialize());
				
				self.getReqData(function(){
					reqMgr.getFlag(data, function(resp, reqId){
						self.tryProcessResp(
							resp, reqId,
							function(){
								contentLoader.stop(loaderId, true, wEditFlag_view.errors[resp.error]);
								
								if ( !resp.error ){
									if (rand)
										this.showFlag(resp.data);
									else
										this.showImgs(resp.data.filename);
								}
							}
						);
					});
				});
			}
		},
		{icon: ContentLoader.icon.short, cssPosition: {top: 35}} 
	);
};

wEditFlag_view.prototype.setFlag = function(){
	var self = this;
	
	var loaderId = contentLoader.start(
		this.wrp.find('.flag_set_wrp'), 
		0, 
		function(){
			var error = self.checkFlag();
			
			if( error )
				contentLoader.stop(loaderId, false, wEditFlag_view.errors[error]);
			else{
				self.getReqData(function(){
					reqMgr.setFlag(utils.urlToObj(this.wrp.find('form').serialize()), function(resp, reqId){
						self.tryProcessResp(
							resp, reqId,
							function(){
								contentLoader.stop(loaderId, true, wEditFlag_view.errors[resp.error]);
							}
						);
					});
				});
			}
		},
		{icon: ContentLoader.icon.short} 
	);
};

// Параметры для основ флага
wEditFlag_view.prototype.fTypes = [
	/*все*/['pl', 'cross', 'zebra', 'c1', 'c2', 'c3'],
	/*гориз*/['pl', 'c1', 'c2'],
	/*верт*/['pl', 'c1', 'c2'],
	/*сплш*/['c1'],
	/*крест*/['cross', 'c1', 'c2', 'c3'],
	/*гор-плс*/['zebra', 'c1', 'c2'],
	/*гориз*/['pl', 'c1', 'c2'],
	/*диаг 1*/['pl', 'c1', 'c2'],
	/*диаг 2*/['pl', 'c1', 'c2']
];