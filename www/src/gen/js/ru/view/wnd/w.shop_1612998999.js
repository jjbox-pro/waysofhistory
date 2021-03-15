wShop = function(id){
	this.name = 'shop';
	
	wShop.superclass.constructor.apply(this, arguments);
    
    this.options.clearData = true;
};

utils.extend(wShop, Wnd);

WndMgr.regWnd('shop', wShop);


wShop.defCoins = 250;

wShop.minCoins = 20;
wShop.maxCoins = 1000000000;

wShop.prepareData = function(){
	return wofh.account.canuseshop;
};


wShop.prototype.getData = function(){
	this.data.packs = [
        {id: 0, title: 'Джекпот', pic: 6},
        {id: 1, title: 'Баррель', pic: 5},
        {id: 2, title: 'Сундук', pic: 4},
        {id: 3, title: 'Лукошко', pic: 3},
        {id: 4, title: 'Мешок', pic: 2},
        {id: 5, title: 'Горсть', pic: 1}
	];
	
	//запоминаем количество строк
    this.data.rowLen = this.getRowLen();
	
    //добавляем информацию по пакам
    for(var offerId in this.data.packs){
        var offer = this.data.packs[offerId];
		
        $.extend(offer, lib.luckbonus.shop_[wofh.platform.id].packs[offerId]);
    }
    
    this.data.action = wofh.account.getCoinsLuckBonus(true, true);
	
	this.data.actionSpecialist = wofh.account.getCoinsSpecialistBonus(true);
    
    this.data.cost = Math.round(lib.luckbonus.shop_[wofh.platform.id].cost * 1000)/1000;
    
    if (wofh.platform.ownCur)
        this.data.lang = wofh.platform.name;
    else
        this.data.lang = debug.getLang();
    
    this.dataReceived();
};

wShop.prototype.addNotif = function(){
	this.notif.show = [Notif.ids.accLuck];
};

wShop.prototype.bindEvent = function(){
    var self = this;
	
    //покупка МУ
    this.wrp
		.on('click', '.js-shop-item-buy' , function(){
			self.processBuy($(this));
		})
		//раскрытие деталей
		.on('click', '.js-shop-item' , function(){
			self.data.select = $(this).data('pos');
			
			self.data.detailsShown = !self.data.detailsShown;
			
			if(self.data.detailsShown)
				self.showDetails($(this));
			else
				self.hideDetails();
		})
		//закрытие деталей
		.on('click', '.shopModal-close' , function(){
			self.data.detailsShown = false;
			
			self.hideDetails(true);
		})
		//подсветка панели бонусов
		.on('mouseover', '.js-shop-action-highlight' , function(){
			self.toggleBonusHighlight($(this), true);
		})
		.on('mouseout', '.js-shop-action-highlight' , function(){
			self.toggleBonusHighlight($(this), false);
		})
		//перерасчёт стоимости при свободной покупке
		.on('change keyup', '.shop-details-input' , function(){
			self.calcPrice($(this).val());
		})
		.on('input', '.js-shop-input' , function(){
			utils.checkInputInt(this, {min: wShop.minCoins, max: wShop.maxCoins, manualInput: !event.isTrigger});
		})
		.on('focusin', '.js-shop-input' , function(){
			$(this).select();
		});
	
};

wShop.prototype.afterDraw = function(){
	this.initScroll({cls: '.view-shop'});
};


wShop.prototype.getRowLen = function(){
	return 3;
};

wShop.prototype.processBuy = function(el){
    var self = this;
    
   this.setPayData(el);
	
	// Проверяем есть ли акция для получения халявного ВГ
	if( this.data.actionSpecialist ){
		if( !this.data.isSpecialistSelected && this.getPayCoins() >= this.data.actionSpecialist.luck ){
			wndMgr.addWnd(wShopSpecialists, '', {parentWnd: this, el: el});
			
			return;
		}
	}
	
    if( !this.data.operator ){
		this.data.pay = utils.clone(wofh.platform.pay);
		
		if( !wofh.account.getCoins().yandexpayments )
			delete this.data.pay.yoomoney;
		
        if( utils.sizeOf(this.data.pay) > 1 ){
            //показываем окно
            this.data.pack = this.getPack();
			
			var wnd = wndMgr.addWnd(wShopPayment, '', this.data);
			
            wnd.cont.on('click', '.js-shop-item-buy', function(){
                self.processBuy($(this));
				
                wnd.close();
            });
			
			if( this.data.actionSpecialist ){
				wnd.beforeClose = function(){
					delete self.data.isSpecialistSelected;
				};
			}
				
            return;
        }
		else{
            // Выбираем по умолчанию
            for(var i in this.data.pay){
                this.data.operator = i;
            }
        }
    }
	
	if( this.data.actionSpecialist )
		delete this.data.isSpecialistSelected;
	
    this.showOperator(el);
};

wShop.prototype.setPayData = function(el){
	// Получаем данные из элемента
    this.data.select = el.data('pos');
    this.data.operator = el.data('type');
};

wShop.prototype.showOperator = function(el){
	if( this.data.operator == 'vk' )
        this.showVK();
    else if( this.data.operator == 'facebook' )
        this.showFacebook();
    else if(this.data.operator == 'xsolla'){
        this.showXSOLLA();
        //неактивная кнопка на 2 сек
        el.addClass('-disabled');
		
        this.setTimeout(function(){
            el.removeClass('-disabled');
        }, 2000);
    }
	else if(this.data.operator == 'idc')
        this.showIDC();
	else if(this.data.operator == 'rbk')
        this.showRBK();
    else
        this.showYandex();
};

wShop.prototype.toggleBonusHighlight = function(el, toggle){
    el.parents('.shop-item, .shop-details').find('.shop-item-coins-bonus, .shop-details-bonus').toggleClass('-active',toggle);
};
    
wShop.prototype.showXSOLLA = function(){
    
    var self = this;
    
    if (!this.XSOLLAloaded){
        utils.loadScript('https://xsolla.cachefly.net/embed/paystation/1.0.2/widget.min.js', {callback: function(){
            self.XSOLLAloaded = true;
            self.showXSOLLA();
        }});
    } else {

        if (this.data.sysWndOpening) return;
        this.data.sysWndOpening = true;

		reqMgr.getXsollaToken(this.data.select, this.data.select == -1 ? this.data.freeCoins : false, function(resp){
			XPayStationWidget.init({access_token: resp.data.token, childWindow: {target: '_self'}});
			XPayStationWidget.open();
			self.data.sysWndOpening = false;
		});

    }
};

wShop.prototype.getPayCoins = function(){
    if (this.data.select == -1){
        return this.data.freeCoins;
    } 
	else {
        var pack = this.data.packs[this.data.select];
		
        return pack.coins;
    }
};

wShop.prototype.showFacebook = function(){
    var self = this,
        coins = this.getPayCoins();
	
    var obj = {
        method: 'pay',
        action: 'purchaseitem',
        quantity: coins,
        product: 'https://'+lib.main.maindomain+'/payment?p=fb&info&gid='+wofh.account.globalid
    };
	
    FB.ui(obj, function(data) {
        self.close();
    });
};

wShop.prototype.showVK = function(){
    var coins = this.getPayCoins();
    VK.callMethod('showOrderBox', {
        type: 'item', 
        item: wofh.account.globalid + '_' + utils.servRound(coins * this.data.cost, 2)
    }); 
	
	VK.addCallback('onOrderSuccess', function(order_id) {
	  console.log('onOrderSuccess');
	});
	VK.addCallback('onOrderFail', function() {
	  console.log('onOrderFail');
	});
	VK.addCallback('onOrderCancel', function() {
	  console.log('onOrderCancel');
	});
};
    
wShop.prototype.showYandex = function(){
    var coins = this.getPayCoins(),
		sum = utils.servRound(coins * this.data.cost, 2);
	
    var platform = wofh.platform.pay.yoomoney,
		method = platform.method,
		email = wofh.account.email,
		req = {};
	
	req.shopId = platform.shopId;
	req.scid = platform.scid;
	req.sum = sum;
	req.customerNumber = wofh.account.globalid;
	req.paymentType = '';
	req.orderNumber = timeMgr.getNow();
	req.cps_email = email;
	req.shopSuccessURL = location.hostname;
    
    var form = $('<form action="' + method + '" target="_blank" style="position: absolute; z-index: 100500;"></form>');
	
    for(var i in req){
        form.append('<input type="hidden" name="'+i+'" value="'+req[i]+'"/>');
    }
    // Информация для чека
	form.append('<input type="hidden" name="ym_merchant_receipt" value=\''+this.getYandexReceipt(email, coins, this.data.cost)+'\'/>');
	
	wndMgr.$body.append(form);
	
	form.submit();
	
	form.remove();
};

wShop.prototype.getYandexReceipt = function(email, coins, price){
	var receipt = {
		customer: {email: email},
		items: [{
			quantity: coins,
			price: {
				amount: utils.servRound(price, 2)
			},
			tax: 1,
			text: "Монеты удачи",
			paymentMethodType: "full_prepayment",
			paymentSubjectType: "service"
		}]
	};
	
	return JSON.stringify(receipt);
};

wShop.prototype.showRBK = function(){
    var self = this,
		coins = this.getPayCoins();
	
    reqMgr.buyRBK(coins, function(resp){
        if(resp.error){
        	GSAPI.UI.showPayment();
        } else {
            var wnd = wndMgr.addAlert('Покупка успешно совершена. Твой счет пополнен на '+snip.luck(coins)+'.');
            wnd.onClose = function(){
                self.close();
            };
            
        }
    });
};

wShop.prototype.showIDC = function(){
    var self = this;
    
    var coins = this.getPayCoins();
	
	woPlugin.open('https://www.idcgames.com/createWoloTrans2015.php?idUsuarioIDC=Denizz_1&email=denizz_89@mail.ru&idioma=en&game_id=46');
};

wShop.prototype.calcPrice = function(valNew){
    var el = this.cont.find('.js-shop-input');
    var val = el.val();

    if(typeof(valNew) == 'undefined') {
        valNew = val;
    } else {
        var valNew = Math.max(0, utils.toInt(valNew));
        if (valNew != val){
            el.val(valNew || '');
        }
    }
    
    this.data.freeCoins = valNew;
    
    var bonus = this.calcFreeBonus();
    
    this.calcFreeProfit(bonus);
	
	this.showFreeSpecialist();
	
    //стоимость в валюте
    var cost = utils.servRound(utils.toInt(valNew) * this.data.cost, 2);
    
    if(wofh.platform.name == 'gxp'){
        var costdiv = lib.luckbonus.shop_[wofh.platform.id].costdiv||1;
        cost = (cost/costdiv).toFixed(utils.log10(costdiv));
    }
    
    this.cont.find('.js-shop-cost').html(cost);
	
	this.cont.find('.shop-details-button').toggleClass('-disabled', valNew == 0);
};
    
wShop.prototype.showDetails = function(elem){
    this.data.pack = this.getPack(true);
    
    //закрываем старый блок
    this.hideDetails(false);
    
    elem.after(tmplMgr.shop.details(this.data));

    this.setTimeout(function(){
        this.cont.find('.shop-details').addClass('-active');
    }, 0);
	
    this.setTimeout(function(){
        this.scrollToDetails();
    }, 320);
	
    //вычисляем
    this.calcPrice(wShop.defCoins);
    
	//фокус на инпуте
    this.cont.find('.js-shop-input').focus();
};

wShop.prototype.scrollToDetails = function(){
	this.doScroll('scrollTo', 'bottom', {scrollInertia: 200});
};

wShop.prototype.getPack = function(revers){
	if( revers )
		return this.data.select != -1 ? {id: -1, coins: wShop.defCoins} : this.data.packs[this.data.select];
	else
		return this.data.select == -1 ? {id: -1, coins: wShop.defCoins} : this.data.packs[this.data.select];
};

wShop.prototype.hideDetails = function(anim){
    this.cont.find('.shop-details').remove();
};

wShop.prototype.calcFreeBonus = function(){
	var packs = this.data.packs,
		luck = this.data.freeCoins,
		luckOld,
		bonus = 0,
		pack;
    
    for (var i in packs) {
		pack = packs[i];
		
		if( luck < pack.coins )
			continue;
		
		luckOld = luck;
		
        luck = utils.toInt(luck / pack.coins);
		
		bonus += pack.bonus * luck;
		
		luck = luckOld - (luck * pack.coins);
    }
    
    return bonus;
};

wShop.prototype.calcFreeProfit = function(bonusGift){
    var bonus = bonusGift;
    
    if(this.data.action) {
        var bonusAction = Math.min(this.data.freeCoins, this.data.action.sum);
        bonus += bonusAction;
        this.cont.find('.js-shop-details-action-coins').html(bonusAction);
    }
    
    this.cont.find('.shop-details-bonus-wrp').toggleClass('-hidden', bonus == 0);

    this.cont.find('.shop-details-bonus-value').html(bonus);
	
    //выгода
    var profit = ~~(bonus / this.data.freeCoins * 100);
    this.cont.find('.js-shop-details-profit').html(profit)
    this.cont.find('.shop-details-profit').toggleClass('-hidden', profit == 0);
};

wShop.prototype.showFreeSpecialist = function(){
	if(this.data.actionSpecialist)
        this.cont.find('.shop-details-specialist').toggleClass('-hidden', !(this.data.freeCoins >= this.data.actionSpecialist.luck));
};





wShopPayment = function(){
	wShopPayment.superclass.constructor.apply(this, arguments);
};

utils.extend(wShopPayment, Wnd);


wShopPayment.prototype.calcName = function(){
	return 'shopPayment';
};

wShopPayment.prototype.calcTmplFolder = function(){
	return tmplMgr.shop.payment;
};


wShopPayment.prototype.initWndOptions = function(){
	wShopPayment.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showBack = true;
    this.options.setHash = false;
    this.options.moving = false;
	this.options.showBorders = false;
	this.options.showButtons = false;
};





wShopSpecialists = function(){
	wShopSpecialists.superclass.constructor.apply(this, arguments);
	
    this.options.showBack = true;
    this.options.setHash = false;
    this.options.moving = false;
	this.options.showBorders = false;
	this.options.showButtons = false;
};

utils.extend(wShopSpecialists, Wnd);


wShopSpecialists.prototype.calcName = function(){
	return 'shopSpecialists';
};

wShopSpecialists.prototype.calcTmplFolder = function(){
	return tmplMgr.shop.specialists;
};

wShopSpecialists.prototype.bindEvent = function(){
	var self = this;
	
	this.selectedSpecialist = false;
	
	this.cont
		.on('click', '.js-shop-buy', function(){
			if( self.selectedSpecialist === false )
				return false;
			
			self.loaderId = contentLoader.start( 
				self.cont,
				0,
				function(){
					reqMgr.selectAccSpecialist(self.selectedSpecialist, function(){
						contentLoader.stop(self.loaderId);
						
						self.data.parentWnd.data.isSpecialistSelected = true;
						
						self.data.parentWnd.processBuy(self.data.el);
						
						self.close();
					});
				},
				{callback:function(){delete self.loaderId;}}
			);
			
			return false;
		});
		
	this.initSelect();
};

wShopSpecialists.prototype.beforeClose = function(){
	return this.loaderId;
};


wShopSpecialists.prototype.initWndOptions = function(){
	wShopSpecialists.superclass.initWndOptions.apply(this, arguments);
	
	this.options.showBack = true;
    this.options.setHash = false;
    this.options.moving = false;
	this.options.showBorders = false;
	this.options.showButtons = false;
};


wShopSpecialists.prototype.initSelect = function(){
	var self = this;
	
	snip.specialistsSelectHandler(this.cont, {
		onSelect:function(id){
			self.selectedSpecialist = id;
			self.cont.find('.js-shop-buy').removeClass('-disabled');
		}
	});
};