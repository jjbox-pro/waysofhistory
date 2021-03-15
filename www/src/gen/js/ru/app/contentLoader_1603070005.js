/* Крутилки, вертелки*/

ContentLoader = function(){};


ContentLoader.icon = {def: 0, small: 1, short: 2};


ContentLoader.prototype.init = function (){
    this.list = {};
	this.index = 0;
	this.defDelay = 500; // Задержка перед стартом анимации загрузки
	this.animationTime = 9500; // Сколько показываем анимацию загрузки перед показом сообщения, что нет пинга
	this.noPingTime = 4000; // Сколько будет показываться сообщение, что нет пинга
	this.errorTime = 2000; // Время показа анимации ошибки
	this.successTime = 1000; // Время показа анимации удачной загрузки
    
    this.bind();
    
    return this;
};

/*
	reqFunc - функция для подачи запроса
	options:
		onError - функция, которая будет вызываться при ошибке загрузки данных
		icon - какой тип иконки будет использоваться для анимирования загрузки (по умолчанию планета)
		cssPosition - позиционирование блока с анимацией внутри контейнера {bottom:0,...}
		removeContainer - флаг указывающий удолять ли основной контейнер в который вставляется анимация
*/

ContentLoader.prototype.start = function(container, delay, reqFunc, options){
	container = container||$();
	
	var loader = {container: container, reqFunc: reqFunc};
	
	for(var option in options){
		loader[option] = options[option];
	}
	
	loader.icon = loader.icon||ContentLoader.icon.def;
	loader.cssPosition = loader.cssPosition||{};
	loader.animationTime = loader.animationTime||this.animationTime;
	loader.noPingTime = loader.noPingTime||this.noPingTime;
	loader.errorTime = loader.errorTime === undefined ? this.errorTime : loader.errorTime;
	loader.successTime = loader.successTime === undefined ? this.successTime : loader.successTime;
	loader.delay = delay === undefined || delay === false ? this.defDelay : delay;
	loader.hideNoPing = loader.hideNoPing || !reqFunc;
	
	
	var id;
	
	for(var oldLoader in this.list){
		oldLoader = this.list[oldLoader];
		
		if( oldLoader.container.get(0) == loader.container.get(0) ){
			id = oldLoader.id;
			
			if( oldLoader.icon == loader.icon ){
				loader.loaderContainer = oldLoader.loaderContainer;
				loader.oldContainerCss = oldLoader.oldContainerCss;
				loader.loaderContainerIcon = oldLoader.loaderContainerIcon;
				loader.loading = oldLoader.loading;
				
				delete oldLoader.loaderContainer;
				delete oldLoader.oldContainerCss;
				delete oldLoader.loaderContainerIcon;
				delete oldLoader.loading;
			}
			
			this.hideLoading(oldLoader);
		}
	}
	
	return this.initLoader(loader, id);
};

ContentLoader.prototype.stop = function(id, success, error, extData){
	if( !this.list[id] ) return;
	
	var loader = this.list[id];
	
	loader.extData = extData;
	
	if( success || error ){
		if( error ){
			loader.error = error;
			var time = loader.errorTime;
			this.error(loader, error);
		}
		else{
			var time = loader.successTime;
			loader.success = success;
			this.success(loader);
		}
		
		setTimeout(
			function(){
				this.delLoader(loader);
			}.bind(this), 
			time
		);
	}
	else
		this.delLoader(loader);
	
};

ContentLoader.prototype.restart = function(loader){
	this.delLoader(loader);
	
	loader.delay = 0;
	loader.appearanceTime = 1;
	
	return this.initLoader(loader);
};

ContentLoader.prototype.initLoader = function(loader, id) {
	var self = this;
	
	if( id )
		++this.index;
	else
		id = ++this.index;
	
	loader.id = id;
	
	this.list[id] = loader;
	
	this.beforeLoading(loader);
	
	loader.timerDelayId = setTimeout(function(){
		self.showLoading(loader);
		
		loader.timerTimeoutId = setTimeout(function(){
			if( !utils.inDOM(loader.container.get(0)) ){
				self.delLoader(loader);
				
				return;
			}
			
			if( loader.afterAnimation ){
				loader.afterAnimation(loader);
				
				return;
			}
			
			self.afterAnimation(loader);
		}, loader.animationTime );
	}, loader.delay);
	
	if( loader.reqFunc )
		setTimeout(loader.reqFunc, 0);
	
	return id;
};

ContentLoader.prototype.bind = function(){
	var self = this;
	
	wndMgr.$document.on('click', '.contLoader-reload', function(){
		self.restart(self.list[$(this).data('id')]);
	});
};

ContentLoader.prototype.delLoader = function(loader){
	delete this.list[loader.id];
	
	clearTimeout(loader.timerDelayId);
	
	if( loader.timerTimeoutId )
		clearTimeout(loader.timerTimeoutId);
	
	if( loader.loaderContainer )
		loader.loaderContainer.remove();
	
	if( loader.removeContainer )
		loader.container.remove();
	else if( loader.oldContainerCss )
		loader.container.css(loader.oldContainerCss);
	
	if( loader.callback ) 
		loader.callback(loader, true);
	
	delete loader.loaderContainer;
	delete loader.oldContainerCss;
	delete loader.loaderContainerIcon;
	delete loader.loading;
	
	return loader;
};

ContentLoader.prototype.beforeLoading = function(loader){
	if( loader.loaderContainer )
		return;
	
	var loaderContainer = $('<div class="loader-container-bg"></div>');
	
	loader.loaderContainer = loaderContainer;
	
	this.storeOldContainerCss(loader);
	
	loader.container.append(loaderContainer);
};

ContentLoader.prototype.storeOldContainerCss = function(loader){
	if( loader.container.css('position') == 'static' ){
		loader.container.css('position', 'relative');
		
		loader.oldContainerCss = {position: ''};
	}
};

// Показывает анимацию загрузки
ContentLoader.prototype.showLoading = function(loader){
	if( loader.loading )
		return;
	
	loader.loading = true;
	
	var loaderContainerIcon = $('<div></div>');
	
	loader.loaderContainer.append(loaderContainerIcon);
	
	loader.loaderContainer.animate({opacity: 0.9}, 100);
	
	this.initIcon(loaderContainerIcon, loader);
};

// Инициализируем иконку загрузки
ContentLoader.prototype.initIcon = function(loaderContainerIcon, loader){
	switch( loader.icon ){
		case ContentLoader.icon.small:
		{	
			loaderContainerIcon.addClass('loader-container-icon-small')
				.animate({opacity: 1}, loader.appearanceTime||100)
				.css(loader.cssPosition)
				.parent().css('background-color', 'transparent');	
			break;
		}
		case ContentLoader.icon.short:
		{	
			loaderContainerIcon.addClass('loader-container-icon-short')
				.attr('data-status', 'loading')
				.animate({opacity: 1}, loader.appearanceTime||100)
				.css(loader.cssPosition)
				.parent().css('background-color', 'transparent');
			break;
		}
		case ContentLoader.icon.def:
		{	
			loaderContainerIcon.addClass('loader-container-icon')
				.animate({opacity: 1}, loader.appearanceTime||100)
				.css(loader.cssPosition);
		}
	}
	
	loader.loaderContainerIcon = loaderContainerIcon;
};

ContentLoader.prototype.getLoader = function(id) {
	return this.list[id];
};

// Действия после анимации
ContentLoader.prototype.afterAnimation = function(loader){
	var self = this;
	
	this.noPing(loader);
	
	if( loader.hideNoPing ){
		setTimeout(
			function(){
				loader.noPing = true;
				
				self.hideLoading(loader);
			},
			
			loader.noPingTime
		);
	}
};

// Меняем состояние анимации если не получили ответ за нужный период времени
ContentLoader.prototype.noPing = function(loader){
	switch( loader.icon )
	{
		case ContentLoader.icon.small:
		{	
			loader.loaderContainerIcon.css('background-position', '-22px 0');
			break;
		}
		case ContentLoader.icon.short:
		{	
			loader.loaderContainerIcon.attr('data-status', 'error');
			break;
		}
		case ContentLoader.icon.def:
		{	
			var noPing = $(tmplMgr.contentLoader.timeout(loader));
			loader.loaderContainer.append(noPing);
			if( !loader.infinityIconAnim )
				loader.loaderContainerIcon.attr('data-status', 'error');
			
			noPing.animate({opacity: 1}, 600);
		}
	}
	
	if( loader.callback && !loader.hideNoPing ) 
		loader.callback(loader, false);
};

// Меняем состояние анимации если загрузка прошла успешно
ContentLoader.prototype.success = function(loader){
	switch( loader.icon ){
		case ContentLoader.icon.small:
		{	
			loader.loaderContainerIcon.css('background-position', '-11px 0');
			break;
		}
		case ContentLoader.icon.short:
		{	
			loader.loaderContainerIcon.attr('data-status', 'complete');
			break;
		}
	}
};

// Меняем состояние анимации если загрузка прошла успешно
ContentLoader.prototype.error = function(loader, error){
	switch( loader.icon )
	{
		case ContentLoader.icon.small:
		{	
			loader.loaderContainerIcon.css('background-position', '-22px 0');
			break;
		}
		case ContentLoader.icon.short:
		{	
			var $error = $('<span style="color: black;">' + error + '</span>');
			loader.loaderContainerIcon.append($error);
			loader.loaderContainerIcon.attr('data-status', 'error');
			break;
		}
		case ContentLoader.icon.def:
		{	
			var $error = $(tmplMgr.contentLoader.error({error: error}));
			loader.loaderContainer.append($error);
			loader.loaderContainerIcon.attr('data-status', 'error');
			$error.animate({opacity: 1}, 600);
		}
	}
};

// Скрывает анимацию по завершению загрузки
ContentLoader.prototype.hideLoading = function(loader){
	this.stop(loader.id);
};


contentLoader = new ContentLoader();