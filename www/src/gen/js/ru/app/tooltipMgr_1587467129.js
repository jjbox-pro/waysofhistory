TooltipMgr = function(){
    this.bind();
}; 


TooltipMgr.wndNames = {
	text: 'text',
	unitinfo: 'unitinfo',
	scienceinfo: 'scienceinfo',
	buildinfo: 'buildinfo',
	townInfo: 'townInfo',
	town: 'town',
	countryInfo: 'countryInfo',
	account: 'account',
	specialist: 'specialist',
	tactics: 'tactics'
};


TooltipMgr.prototype.bind = function(){
    var self = this;
    
    wndMgr.$document
		.on('mousemove', '.js-tooltip', function(event){
			var $target = $(this);

			self.onEnterLink(event, $target, $target.data('tooltip-wnd'), {priority: 30, wndId: $target.data('id')});
		})
		.on('mousemove', 'a', function(event, externalEvent){
			event = externalEvent||event;

			var $target = $(this);

			var href = $target.attr('href')||$target.data('href');

			if( !href ) return;

			href = HashMgr.getRelHref(href);

			href = hashMgr.validateHash(href.split('/'));

			self.onEnterLink(event, $target, href[2], {priority: 20, wndId: href[3]});
		})
		// externalEvent - внешнее событие. Передается в том случае, когда событие для элемента вызывается программно (через trigger)
		.on('mousemove tooltip-show', '[data-title], .-lenLim, .-lenHint', function(event, externalEvent){
			self.textHandler($(this), event, externalEvent);
		})
		.on('mouseout focusout tooltip-hide', 'a, .js-tooltip, [data-title], .-lenLim, .-lenHint', function(event){
			self.hide({event:event});
		})
		.on('keyup', function(event){
			if( event.which == 27 )
				self.hide();
		})
		.on('mouseenter', '.tooltip-cnt', function(){
			self.hide();
		});
		
	this.bindVoiceHelper();
};

TooltipMgr.prototype.textHandler = function($target, event, externalEvent){
	event = externalEvent||event;

	if( $target.hasClass('-noHint') )
		return;

	var text = $target.attr('data-title'),
		priority = +($target.data('priority')||11);

	if ( !text ){
		priority -= 1;

		if( $target.hasClass('js-hint-useHtml') )
			text = $target.html();
		else
			text = $target.text();
	}
	
	if (!text || !text.length)
		return;

	this.onEnterLink(event, $target, 'text', {priority: priority, text: text});
};

TooltipMgr.prototype.bindVoiceHelper = function(){
	// Контейнер, для вставки текста для озвучивания спец. программами
	this.$voiceHelperCont = this.$voiceHelperCont||$('<span id="tooltip-voiceHelperCont"></span>');
	
	wndMgr.$body.find(this.$voiceHelperCont).remove();
	
	wndMgr.$body.append(this.$voiceHelperCont);
};

TooltipMgr.prototype.prepareVoiceHelper = function(opt){
	opt = opt||{};
	
	if( !(TooltipMgr.wndNames[this.wndName] || opt.text) )
		return;
	
	var voiceText = '',
		$target = opt.$target||this.$target;
	
	if( this.wndName == TooltipMgr.wndNames.text || opt.text )
		voiceText = utils.htmlToText(opt.text||($target && $target.data('tooltip-text')), {separator: opt.htmlSeparator});
	else if( this.wndName == TooltipMgr.wndNames.unitinfo )
		voiceText = (new Unit(this.wndId)).getName();
	else if( this.wndName == TooltipMgr.wndNames.specialist )
		voiceText = (new Specialist(this.wndId, 0)).getName();
	else if( this.wndName == TooltipMgr.wndNames.scienceinfo )
		voiceText = Science.get(this.wndId).getName();

	if( voiceText ){
		// Для того, чтобы воспроизводился текст в специальных программах, необходимо чтобы внутри блока находился любой контент
		if( $target ){
			// В случаях когда внутри ссылки распологается текст, программа может не воспроизводить текст, расположенный в $voiceHelperCont.
			// В таком случа еследует расположить html элемент с атрибутом role="button", что повысит приоритет воспроизведения текста из $voiceHelperCont.
			if( opt.important )
				$target.attr('role', 'button');
			
			if( !$target.html() )
				$target.html(snip.wrp('tooltip-voiceHelper', ' '));
			
			$target.attr('aria-labelledby', this.$voiceHelperCont.attr('id'));
		}
		
		this.$voiceHelperCont.text(voiceText);
	}
};

TooltipMgr.prototype.cleanVoiceHelper = function(noClean){
	if( noClean )
		this.$voiceHelperCont.text('');
};

TooltipMgr.prototype.onEnterLink = function(event, $target, wndName, extData){
	extData = extData||{};
	
	if( 
		!TooltipMgr.wndNames[wndName] || 
		!((event.tooltipPriority||0) < extData.priority) // Проверяем приоритет "всплытия"
	)
		return;
	
	event.tooltipPriority = extData.priority;
	
	this.$target = $target;
	
	this.wndName = wndName;
	
	this.wndId = extData.wndId;
	
	this.prepareVoiceHelper(extData);
	
    var pos = utils.getPosFromEvent(event);
	
	clearTimeout(this.TO);
	
    this.TO = setTimeout(function(){
		if( this.dataWas ){
			this.display(pos, this.dataWas.type, this.dataWas.data);
			
			return;
		}
		
		if( this.wndName == 'text')
            this.display(pos, 'text', {text: extData.text||$target.data('tooltip-text'), label: $target.data('tooltip-label')});
        else if( this.wndName == 'unitinfo')
            this.display(pos, 'unit', {unit: new Unit(this.wndId)});
        else if( this.wndName == 'scienceinfo')
            this.display(pos, 'science', {science: Science.get(this.wndId)});
        else if( this.wndName == 'buildinfo'){
			var slot = $target.data('slot'),
				up = false;
			
			if( slot )
				up = !!slot.getPos();
			else{
				var town = (wofh.towns||{})[$target.data('town')];
				
				slot = town ? town.slots.getElemByPos($target.data('pos')) : new Slot(this.wndId, 1);
				
				up = !!$target.data('pos');
			}
			
            this.display(pos, 'build', {slot: slot, head: $target.data('head'), up: up});
        }
        else if( this.wndName == 'townInfo' || this.wndName == 'town')
            wofh.world.getOrUpdElem(Town, this.wndId, 3, function(town){
                this.display(pos, 'town', {town: town});  
            }.bind(this));
		 else if( this.wndName == 'countryInfo')
            wofh.world.getOrUpdElem(Country, this.wndId, 4, function(country){
				country = country||(new Country(false, true));
				
                this.display(pos, 'country', {country: country});  
            }.bind(this));
        else if( this.wndName == 'account')
            wofh.world.getOrUpdElem(Account, this.wndId, 3, function(account){
				if( account ) this.display(pos, 'account', {account: account});  
            }.bind(this));
		else if( this.wndName == 'specialist')
            this.display(pos, 'specialist', {specialist: new Specialist(this.wndId, 0), prob: $target.data('prob'), num: $target.data('num')}); // prob - вероятность получения специалиста определенного типа
		else if( this.wndName == 'tactics') {
			var params = utils.urlToObj(this.wndId);
			
			reqMgr.getTactic(params.id, params.secret, function(tactic){
                this.display(pos, 'tactic', {tactic: tactic});
            }.bind(this));
        }
    }.bind(this), 500);
};

TooltipMgr.prototype.display = function(pos, type, data){
	this.dataWas = {type:type, data:data};
	
	this.show(tmplMgr.wnd.tooltip[type](data), pos, {posSqr: this.preparePosSqr(), isBinded: true});
};

TooltipMgr.prototype.preparePosSqr = function(){
	return {left: 10, right: 30, top: 10, bottom: 10};
};

TooltipMgr.prototype.show = function(cont, pos, opt){
	opt = opt||{};
	
	if( !opt.isBinded ){
		this.hide({voiceHelper: opt.voiceHelper});
		
		this.prepareVoiceHelper(opt.voiceHelper);
	}
	
	return this.wnd = wndMgr.addTooltip(cont, pos, opt.posSqr, opt.dir, opt.area, opt.offset);
};

TooltipMgr.prototype.hide = function(opt){
	opt = opt||{};
	opt.voiceHelper = opt.voiceHelper||{};
	
	if( opt.event && opt.event.relatedTarget && this.$target ){
		if( this.$target.is(opt.event.relatedTarget) )
			return;
		
		var $relTarget = this.$target.find(opt.event.relatedTarget);
		
		if( $relTarget.length && !$relTarget.data('unrelated') )
			return;
	}
	
	clearTimeout(this.TO);
	
    delete this.wndName;
    delete this.wndId;
	delete this.dataWas;
	
	this.cleanVoiceHelper();
	
	if( this.$target ){
		this.$target.find('.tooltip-voiceHelper').remove();
		
		delete this.$target;
	}
	
    if( this.wnd ){
        this.wnd.close();
		
		delete this.wnd;
	}
};