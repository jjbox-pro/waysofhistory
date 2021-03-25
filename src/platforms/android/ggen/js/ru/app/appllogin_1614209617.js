var appl = {};


appl.init = function(){
	overridePlatform(); // Переопределяем необходимые методы в зависимости от платформы
	
    appl.initCrossDomain();
    
	appl.loadDependencies();
};
    
    appl.loadDependencies = function(){
        appl.dependencies = 1;
        
        appl.loadMobileDependencies();

        appl.onDependenciesLoaded();
    };
    
    appl.initCrossDomain = function(){
        if( location.host )
            document.domain = location.host.split('.').splice(1, 2).join('.')||document.domain;
    };
    
appl.loadMobileDependencies = function(){
	if( !appl.isMobile() )
		return;
	
	appl.dependencies++;
	
	utils.loadStylesheet('ggen/css/ru/site/mobile/mobile_glagna_1614209556.css', {callback: function(){
		appl.onDependenciesLoaded();
	}});
	
	appl.dependencies++;
	
	utils.loadScript('ggen/js/ru/site/mobile/app/appllogin_1608520207.js', {async: false, callback: function(){
		appl.onDependenciesLoaded();
	}});
};
	
	appl.isMobile = function(){
		return !(!device.mobile() || utils.urlToObj(location.search).noMobileIf);
	};

appl.onDependenciesLoaded = function(){
	if( --appl.dependencies )
		return;
	
	overridePlatformDependencies();
	
	appl.initDevice();
	
	appl.initTmpl();
	
	appl.getInitData();
};

appl.initDevice = function(){};

appl.initTmpl = function(){
	tmplMgr.parseTemplates($('#main-templates'));
	
	appl.initPlatformTmpl();
};

	appl.initPlatformTmpl = function(){
		tmplMgr.parsePlatformTemplates();
	};

appl.getInitData = function(search){
	$.get(appl.prepareRequestUrl('/data' + this.getInitDataParams(search)), function(resp){
		appl.buildPage(resp);
    }, 'json');
};

	appl.getInitDataParams = function(search){
		return search||location.search;
	};

appl.buildPage = function(data){
	appl.preparePage();
	
	wofh = data;

	appl.prepareInitData();
};

appl.preparePage = function(){
    $.colorbox.remove();
	
	$('body').html('<div class="body-wrp"></div>');
};

appl.prepareInitData = function(){
    var self = this;
	
    var wofhStore = {
        'ru': {
            'w1.wofh.ru': {win: 'CRC, Русь, Казахстания'},
            'w2.wofh.ru': {win: 'RGB'},
            'w3.wofh.ru': {win: 'Меченые Злом'},
            'w4.wofh.ru': {win: 'Асгард'},
            'w5.wofh.ru': {win: 'ЛХ+Чужие+B&W'},
            'w6.wofh.ru': {win: 'Седьмой бастион'},
            'w7.wofh.ru': {win: 'Star Trek'},
            'w8.wofh.ru': {win: 'ООН'},
            'w9.wofh.ru': {win: 'Высокий Фронтир'},
            'w10.wofh.ru': {win: 'AC.GP.RU[†††], ID-436 (BW)'},
            'w11.wofh.ru': {win: 'Oрда'},
            'w12.wofh.ru': {win: 'Hydrargyrum [Hg]'},
            'w13.wofh.ru': {win: 'ШОУ'},
            'w14.wofh.ru': {win: 'DARK_SIDE[DS]'},
            'w15.wofh.ru': {win: 'Меченые Злом [МЗ]'},
            'w16.wofh.ru': {win: 'Рубикон [FM]'},
            'w17.wofh.ru': {win: 'Пиратское Братство'},
            'w18.wofh.ru': {win: 'Путники Истории [18+]'},
            'w19.wofh.ru': {win: 'Subaru (+Ы)'},
            'w20.wofh.ru': {win: 'Destiny [ ҉ ]'},
            'w21.wofh.ru': {win: 'Iron Legion'},
            'w22.wofh.ru': {win: 'Тринадцатая Федерация FХШ'},
            'fs1': {name: 'Первый ФотоМир', nameShort: "1001", win: 'МутноКубинскиеЛимоны'},
            'fs2': {name: 'Второй ФотоМир', nameShort: "1002", win: 'ARRAKIS'},
            'fs3': {name: 'Третий ФотоМир', nameShort: "1003", win: 'КлубМолодыхСадистов'},
        },
        'en': {
            'en1.waysofhistory.com': {win: 'USSR'},
            'en2.waysofhistory.com': {win: 'Heroes of the Second World'},
            'en3.waysofhistory.com': {win: 'Adepts of Snow [AoS]'},
            'en4.waysofhistory.com': {win: 'NUTOPIA'},
        },
        'de': {
            'w1.wofh.de': {win: 'BruderschaftDerFreimaurer'},
            'w2.wofh.de': {win: 'Projekt KREEP'},
        }
    };
    
    for(var i in wofh.main_data){
        wofh[i] = wofh.main_data[i];
    }
    
    appl.auth.updLoginData();
	
    //дозапись данных и сортировка
    var worlds = [];
    for (var worldId in wofh.worlds) {
        world = wofh.worlds[worldId];
        world.id = worldId;
        world.nameShort = world.name.replace(/[^\d]/g, '');
        var worldStore = wofhStore[wofh.language][world.id];
        if (worldStore) {
            world.win = worldStore.win;
            world.old = true;
        }
        worlds.push(world);
    }
    
    for (var worldId in wofhStore[wofh.language]) {
        if (!wofh.worlds[worldId]) {
            var world = wofhStore[wofh.language][worldId];
            world.id = worldId;
            world.name = world.name||world.id;
            world.nameShort = world.nameShort||world.name.replace(/[^\d]/g, '');
            world.old = true;
            worlds.push(world);
        }
    }
    
    worlds.sort(function(a,b){
		if( utils.toInt(a.old) == utils.toInt(b.old) )
			return utils.toInt(a.nameShort) > utils.toInt(b.nameShort) ? 1 : -1;
		
        return utils.toInt(a.old) < utils.toInt(b.old) ? 1 : -1;
    });
    
    wofh.worlds = {};
    for(var i in worlds){
        var world = worlds[i];
        wofh.worlds[world.id] = world;
    }
	
    wofh.serv = {
        ru: {name: 'RU', url: appl.cnst.protocol + '//ru.waysofhistory.com'},
        en: {name: 'EN', url: appl.cnst.protocol + '//en.waysofhistory.com'},
        de: {name: 'DE', url: appl.cnst.protocol + '//de.waysofhistory.com'},
    };

    wofh.form = {};//текущие данные формы
	
	appl.busy = 0; // блокирование ввода при выполнении запросов
	
    appl.initPlatform();
};

appl.prepareRequestUrl = function(url){
   if( appl.environment.domain ){
		if( !(/^(http|https)/.test(url)) )
			url = appl.environment.domain + (url[0] == '/' ? '' : '/') + url;
   }
   
   return url;
};

appl.checkBrowser = function(){
	return !window.WebSocket; //|| !utils.sizeOf(tmplMgr) - возможно понадобится
};

appl.initPlatform = function(){
	appl.onPlatformInited();
};

appl.onPlatformInited = function(){
	var relogin = utils.urlToObj(location.search).relogin;
	
    if ( !wofh.mustplatformlogin && wofh.interface.autologin || relogin ){
        var count = 0;
        
		for (var worldId in wofh.worlds) {
            var world = wofh.worlds[worldId];
            if ( world.working && world.login ) {
				if( relogin && relogin != worldId )
					continue;
				
                wofh.form.world = worldId;
                count++;
            }
        }
		
        if (count == 1) {
            wofh.form.autologin = true;
            appl.enterFastLink();
            return;
        }
    }
	
    this.initAccount();
};

appl.onAccountInited = function(){
    this.genName();
    
    this.initCont();
};

appl.setLocation = function(url){
	location.href = url;
};

appl.initAccount = function(){
    this.accountInited = true;
    
	appl.initAccountPlatform();
};

appl.initAccountPlatform = function(){
    wofh.form.sex = 1;
	wofh.form.realName = '';
	this.onAccountInited();
};

appl.genName = function(){
    wofh.form.login = utils.genLimitName(appl.getNameLimit(), {
		sex: wofh.form.sex, 
		name: wofh.form.realName
	});
};

appl.getNameLimit = function(){
	return glib.account.namelimit[1];
};

appl.initCont = function(){
    var cont = $('.body-wrp');
    
    cont.html(tmplMgr.glagna.main());
    
    this.bind();
    
    if ( !wofh.ie8 )
		this.animateBack.init();
};
        
appl.getWinners = function(callback){
    $.get(appl.prepareRequestUrl('/aj_winners?a&lang='+wofh.language), function(resp){
        for(var worldId in resp){ 
            var world = resp[worldId];
            wofh.worlds[worldId].win = world;
            
            //война форматов - проверить на РУ-глагне и удалить
            world.countries = world.countries || world.countriesinfo;
            world.accounts = world.accounts || world.accountsinfo;
            world.towns = world.towns || world.townsinfo;

            //делаем объекты стран, аккаунтов и городов
            BaseItem.prepArray(world.countries, Country);
            BaseItem.prepArray(world.accounts, Account);
            BaseItem.prepArray(world.towns, Town);
            
            BaseItem.replArray(world.towns, {account: world.accounts});
            BaseItem.replArray(world.accounts, {country: world.countries});
            
            //проставляем имена стране и аккаунтам
            for(var acc in world.country.accounts){
                acc = world.country.accounts[acc];
                acc.name = world.accounts[acc.id].name;
            }
            world.country.name = world.countries[world.country.id].name;
            
			// Победа по рейтингам
			if( world.ratetops ){
				BaseItem.replArray(world.country, {id: world.countries}, 'country');
				
				BaseItem.replArray(world.country.poweraccounts, {id: world.accounts}, 'account');
				
				for(var rate in world.ratetops)
					BaseItem.replArray(world.ratetops[rate], {id: world.accounts}, 'account');
			}
			else{
				//обрезаем тексты
				appl.getWinners_cutText(world);
				appl.getWinners_cutText(world.country);
				
				//аккаунты сортируем по населению
				world.country.accounts.sort(function(a, b){
					return a.pop>b.pop? -1: 1;
				});

				//обрабатываем местороды
				appl.getWinners_parseDep(world.country);
				appl.getWinners_parseDep(world.world);

				//обрабатываем ресурсы
				appl.getWinners_parseRes(world.country);
				appl.getWinners_parseRes(world.world);

				//пишем аккаунты, страны и города в топ
				BaseItem.replArray(world.country.tops, {account: world.accounts, town: world.towns});
			}
        }
        
        callback();
    }, 'json');
};

appl.getWinners_parseDep = function(data){
    data.depTotal = 0;
    data.depGroups = {};
    for(var depId in data.deposites){
        var count = data.deposites[depId];
        var dep = new Deposit(depId);
        if (!dep.isUndefined()) {
            data.depTotal += count;
            data.depGroups[dep.getName()] = (data.depGroups[dep.getName()]||0) + count;
        }
    }
}

appl.getWinners_parseRes = function(data){
    data.res = new ResList(data.production);
    data.resTotal = 0;
    for(var res in data.res.getList()){
        res = data.res.getElem(res);
        if(!res.isMoney() && !res.isScience()){
            data.resTotal += res.getCount()
        }
    }
}

appl.getWinners_cutText = function(data){
	if( !data.text ) return;
	
    data.text = data.text.replace(new RegExp('\n', 'g'), '<br>');
    if(data.text.length > 200){
        var pos = data.text.slice(200).search(' ')
        if(pos != -1){
            pos += 200;
            data.text2 = data.text.slice(pos);
            data.text = data.text.slice(0, pos);
        }
    }
};

appl.enterFromValid = {
    fields: {
        '.js-glagna-enterForm input[name=login]': {
            required: true,
            message: 'Имя должно быть от ' + glib.account.namelimit[0] + ' до ' + glib.account.namelimit[1] + '  символов',
            test: happy.rangeLength,
            arg: glib.account.namelimit
        },
        '.js-glagna-enterForm input[name=password]': {
            required: true,
            message: 'Пароль должен быть от ' + glib.account.passwordlimit[0] + ' до ' + glib.account.passwordlimit[1] + '  символов',
            test: happy.rangeLength,
            arg: glib.account.passwordlimit
        },
    },
    errorTemplate: function(error) {
        return $('<span class="glagna-form-error">' + error.message + '</span>');
    }
};

appl.checkName = function(){
    return 'Имя должно быть от ' + glib.account.namelimit[0] + ' до ' + glib.account.namelimit[1] + '  символов';
};

appl.regFromValid = {
    fields: {
        'input[name=login]': {
            required: true,
            message: appl.checkName(),
            test: happy.rangeLength,
            arg: glib.account.namelimit
        },
        'input[name=password]': {
            required: true,
            message: 'Пароль должен быть от ' + glib.account.passwordlimit[0] + ' до ' + glib.account.passwordlimit[1] + '  символов',
            test: happy.rangeLength,
            arg: glib.account.passwordlimit
        },
        'input[name=email]': {
            required: true,
            message: 'Неправильно указана почта',
            test: happy.email,
        },
        'input[name=rules]': {
            required: true,
            message: 'Пользовательское соглашение и правила не приняты',
			when: 'change',
            test: function() {
                return $('input[name=rules]').prop('checked');
            },
        },
        'input[name=hard]': {
            required: true,
            message: 'Статус Эксперта<br> не подтвержден!',
			when: 'change',
            test: function() {
                var $el = $('input[name=hard]');
                return $el.length == 0 || $el.prop('checked');
            },
        }
    },
    errorTemplate: function(error) {
        return $('<span class="glagna-form-error">' + error.message + '</span>');
    }
};

appl.recoverPassFromValid = {
    fields: {
        '.js-glagna-recoverpassForm input[name=login]': {
            required: true,
            message: 'Имя должно быть от ' + glib.account.namelimit[0] + ' до ' + glib.account.namelimit[1] + '  символов',
            test: happy.rangeLength,
            arg: glib.account.namelimit
        },
        '.js-glagna-recoverpassForm input[name=email]': {
            required: true,
            message: 'Неправильно указана почта',
            test: happy.email,
        },
    },
    errorTemplate: function(error) {
        return $('<span class="glagna-form-error">' + error.message + '</span>');
    }
};

appl.bind = function(){
    var cont = $('.body-wrp');

	appl.initScreen(cont);
	
    //ФОН
    cont.on('click', '.glagna-back-img3', function(){
        $.colorbox({
            rel: 'screens',
            href: $(this).attr('src'),
            maxWidth: '95%',
            maxHeight: '92%'
        });
    });

    //РЕГИСТРАЦИЯ
    cont.on('click', '.glagna-main-del', function(){
		if(appl.busy) 
			return false;
        var world = wofh.worlds[$(this).data('id')];
        appl.auth.delFastLink(world, appl.showMainPage.bind(appl));
    });
    cont.on('click', '.glagna-lang-select', function(){
        $(this).toggleClass('-active');
    });
    cont.on('mouseleave', '.glagna-lang-select', function(){
        $(this).removeClass('-active');
    });
	cont.on('click', '.js-glagna-lang', function(){
		appl.changeLang($(this).data('lang'));
    });
    
    cont.on('click', '.js-glagna-fastLink', function(){
		if(appl.busy) 
			return false;
		
        wofh.form.world = $(this).data('id');
		
		$(this).addClass('-loading');
		
		var cont = $('.body-wrp');
		
		cont.find('button').addClass('-disabled');
        
        appl.enterFastLink();
    });
    
    cont.on('click', '.js-glagna-enterLink', function(){
		if( appl.busy ) 
			return false;
		
        wofh.form.login = '';
		
        appl.hideError();
		
		appl.removeAddForm();
		
        if( $(this).data('id') ) 
            wofh.form.world = $(this).data('id');
        
        appl.showEnterPage();
    });
    
    cont.on('click', '.js-glagna-regLink', function(){
		if( appl.busy ) 
			return false;
		
        wofh.form.world = $(this).data('id');
		
        appl.genName();
		
        appl.showRegPage();
    });
    

    cont.on('click', '.js-form-back', function(){
		if( appl.busy )
			return false;
		
        appl.showMainPage();
        
        appl.removeAddForm(); 
		
        appl.hideError();
    });

    cont.on('click', '.js-glagna-recpassLink', function(){
		if(appl.busy) 
			return false;
		
        appl.toggleAddForm('recoverpassRequest');
        
		appl.setValid('.js-glagna-recoverpassForm', appl.recoverPassFromValid);
    });

    cont.on('click', '.js-glagna-regparamsLink', function(){
        if( appl.busy )
            return false;
        
        if( appl.getAddForm() == 'regparams' )
            appl.removeAddForm(true);
        else {
            $(this).addClass('-loading');
			
            appl.toggleAddForm('regparams', {loading: true}, {noAddFormName: true});
            
            appl.auth.getWorldInfo(function(){
                appl.toggleAddForm('regparams', wofh.worlds[wofh.form.world], {noResetCont: true});
            });
        }
    });
	
    cont.on('click', '.js-glagna-hardLink', function(){
        if(appl.busy) 
            return false;
        
		appl.setHardAddForm();
		
        return false;
    });
	
    cont.on('change', '.glagna-select', function(){
        $(this).addClass('-active');
    });

    cont.on('submit', '.js-glagna-recoverpassForm', function(){
        if( appl.busy )
			return false;
		
        $(this).find('button').addClass('-loading');
		
        var data = utils.urlToObj($(this).serialize());

        wofh.form.login = data.login;
        wofh.form.email = data.email;
        
        appl.hideError();
        appl.auth.pwdRecover();
        return false;
    });
	
	cont.on('click', '.js-recoverpassSucess', function(){
        if( appl.busy )
			return false;
		
		appl.removeAddForm();
    });
	
    cont.on('submit', '.js-glagna-enterForm', function(){
        if( appl.busy )
			return false;
		
        $(this).find('button').addClass('-loading');
		
        appl.removeAddForm();
        
        var data = utils.urlToObj($(this).serialize());

        wofh.form.login = data.login;
        wofh.form.password = wofh.interface.password||data.password;
        wofh.form.savelink = data.savelink;
        
        appl.hideError();
		
        appl.auth.login();
        
        return false;
    });
    
    cont.on('submit', '.js-glagna-regForm', function(){
        if( appl.busy )
			return false;
        
        if( appl.blockRegReason )
            return false;
		
        $(this).find('button').addClass('-loading');
		
        var data = utils.urlToObj($(this).serialize());
        
        wofh.form.login = data.login;
        wofh.form.password = wofh.interface.password||data.password;
        wofh.form.email = data.email;
        
        var paramsForm = cont.find('.js-glagna-regParams');
		
        if(paramsForm.length){
            var data = utils.urlToObj(paramsForm.serialize());
            
            wofh.form.race = data.race;
            wofh.form.continent = data.continent;
            wofh.form.climate = data.climate;
            wofh.form.type = data.type;
            wofh.form.code = data.code1+data.code2;
			wofh.form.settle = +data.settle;
        }
        
        appl.hideError();
		
        appl.auth.reg();
        
        return false;
    });
    
    cont.on('submit', '.js-glagna-luckmoveForm', function(){
        if(appl.busy)
			return false;
		
        $(this).find('button').addClass('-loading');
		
        var data = utils.urlToObj($(this).serialize());
        
        wofh.form.world = data.world;
        wofh.form.login = data.login;
        wofh.form.code = utils.urlToObj(location.search).luckmove;
                
        appl.hideError();
        appl.auth.luckmove();
        
        return false;
    });
	
    if( !wofh.ie8 )
        window.onhashchange = appl.onHashChange.bind(appl);
    
    cont.on('change', '.glagna-radio-label', function(){
		if(appl.busy) 
			return false;
        cont.find('.glagna-radio-label').removeClass('-checked');
        $(this).addClass('-checked');
    });
    
    cont.on('keyup', '.glagna-regForm-login', function(){
		appl.toggleGenNameAnimation(false);
		if(appl.busy) 
			return false;
        wofh.form.loginchanged = true;
		
        if(appl.blockRegReason == 'name')
            appl.blockReg(false);
    });
    
	cont.on('change happy-change', '.glagna-check', function(){
		if(appl.busy) 
			return false;
		
		if( $(this).attr('name') == 'hard' )
			appl.setHardAddForm();
		
        $(this).closest('.glagna-check-label').toggleClass('-checked', $(this).prop('checked'));
    });
    
	cont.on('change', 'input[name=sex]', function(){
		if(appl.busy) 
			return false;
        wofh.form.sex = +$(this).val();
        if (!wofh.form.loginchanged) {
            appl.showDefName();    
        }
    });
    
	cont.on('click', '.js-glagna-genName', function(){
    	appl.toggleGenNameAnimation(false);
		
		if(appl.busy) 
			return false;
		
        appl.showDefName();
		
        appl.hideError();
    });
    
    
    cont.on('change', '.glagna-select', function(){
		if(appl.busy) 
			return false;
        $(this).addClass('-active');
    });
    cont.on('click', '.js-glagna-regparams-bonuscodeLink', function(){
		if(appl.busy) 
			return false;
        cont.find('.glagna-regparams-bonuscodeWrp').toggleClass('-active');
		cont.find('.glagna-regparams-settlecodeWrp').removeClass('-active');
    });
	cont.on('click', '.js-glagna-regparams-settlecodeLink', function(){
		if(appl.busy) 
			return false;
        cont.find('.glagna-regparams-settlecodeWrp').toggleClass('-active');
		cont.find('.glagna-regparams-bonuscodeWrp').removeClass('-active');
    });
    cont.on('change', '.js-glagna-regParams select', function(){
        
        if(appl.blockRegReason == 'params'){
            appl.blockReg(false)
        }
    });
    
    //видео
    /*cont.on('click', 'js-glagna-showMovie', function(){
        
    })*/
    
    //перемещение МУ
    cont.on('change', '.js-glagna-luckmoveForm select', function(){
		if(appl.busy) 
			return false;
		
        if (!wofh.form.loginchanged) {
            var world = wofh.worlds[$(this).val()];
            
			cont.find('.js-glagna-luckmoveForm input[name="login"]').val(world.login? world.login.name: '');
        }
    });
    cont.on('change', '.js-glagna-luckmoveForm input[name="login"]', function(){
		if(appl.busy) 
			return false;
        wofh.form.loginchanged = $(this).val() != '';
    });
    
    //ЗАЛ СЛАВЫ
    cont.on('click', '.glagna-link.-halloffame', function(){
		if(appl.busy) 
			return false;
        
        appl.getWinners(function(){
			wofh.oldHallList = false;
			
            $.colorbox({
                html: tmplMgr.glagna.hall.list({showNew: wofh.language == 'ru'}),
				maxWidth: '100%'
            });
        });
    });
	
	// Обработчики внутри body colorbox
	var $body = $('body');
	//раскрывалки
	$body
		.off()
		.on('click', '.glagna-world-expand', function(){
			var id = $(this).data('id');
			$body.find('.glagna-world-hidden.-'+id).toggleClass('-hidden');
		})
		.on('click', '.glagna-hall-row', function(){
			var id = $(this).data('id');
			if (typeof(id) != 'undefined') {
				var world = wofh.worlds[id];
				if (typeof(world.win) == 'string'){
					$.post(appl.prepareRequestUrl('/fame_data'), {w: world.nameShort, lang: wofh.language}, function(resp){
						$.colorbox({html: tmplMgr.glagna.hall.world.wrp(resp),  maxHeight: '92%', closeButton: false});
					});
				} else {
					$.colorbox({html: tmplMgr.glagna.hall.world.main(world.win),  maxHeight: '92%', closeButton: false});
				}
			}
		})
		//кнопка назад в зале славы
		.on('click', '.js-hall-back', function(){
			var data = {};
			
			if( wofh.oldHallList )
				data.showOld = true;
			else
				data.showNew = wofh.language == 'ru';

			$.colorbox({html: tmplMgr.glagna.hall.list(data)});
		})
		.on('click', '.glagna-hall-oldLink', function(){
			wofh.oldHallList = true;
			$.colorbox({html: tmplMgr.glagna.hall.list({showOld: true})});
		})
		.on('click', '.glagna-hall-newLink', function(){
			wofh.oldHallList = false;
			$.colorbox({html: tmplMgr.glagna.hall.list({showNew: true})});
		});
	
    //показываем подшаблоны
    this.initPage();
};

appl.initScreen = function(cont){
	cont.find('.glagna-screens-wrp').html(tmplMgr.glagna.screens.links());
	
    $('.glagna-screen').colorbox({
        maxWidth: '95%',
        maxHeight: '92%',
    });
    
    $('.glagna-video').colorbox({
        width: '90%', 
        height: '90%', 
        iframe: true
    });
};

appl.showWnd = function(html){
    $.colorbox({
        html: html,
        maxWidth: '95%',
        maxHeight: '92%',
        onClosed: function(){location.hash = '';}
    });
};

appl.onHashChange = function(){
    if (location.hash == '#legal')
		appl.showWnd(tmplMgr.glagna.wnd.legal());
	if (location.hash == '#rules')
		appl.showWnd(tmplMgr.glagna.wnd.rules());
	if (location.hash == '#requisites')
		appl.showWnd(tmplMgr.glagna.wnd.requisites()); 
};

appl.changeLang = function(lang){
	var search = utils.urlToObj(location.search);
	
	search.lang = lang;
	search.strictlang = true;
	
	appl.getInitData('?' + utils.objToUrl(search));
};

appl.initPage = function(){
    if (utils.urlToObj(location.search).luckmove){//перевод МУ
        appl.showLuckmovePage();
    } else {
        appl.onHashChange();
        
        if (wofh.interface.regworld){
            wofh.form.world = wofh.interface.regworld;
            appl.showRegPage();
        } else {
            appl.showMainPage();
        }
        /*if (!wofh.interface.logininput){//лэндинг
            for (var worldId in wofh.worlds) {
                var world = wofh.worlds[worldId];
                if (world.working && world.canreg && world.selected) {
                    wofh.form.world = worldId;
                }
            }
            if (wofh.form.world) {
                appl.showRegPage();
                return;
            }
        }
        appl.showMainPage();
        */
    }
};

appl.enterFastLink = function(){
    var loginData = wofh.worlds[wofh.form.world].login;
    wofh.form.password = loginData.auth;
    wofh.form.key = loginData.key;
    wofh.form.login = loginData.name;
    wofh.form.savelink = false;

    appl.hideError();
    wofh.form.initOnError = true;
    appl.auth.login();
};

appl.showLuckmovePage = function(isMoved){
    var cont = $('.body-wrp');
    cont.find('.glagna-form').html(tmplMgr.glagna.form.luckmove({isMoved:isMoved}));
};

appl.showMainPage = function(){
    var cont = $('.body-wrp');

	cont.find('.glagna-form').html(tmplMgr.glagna.form.main);
};

appl.showRegPage = function(){
    var cont = $('.body-wrp');
	
    cont.find('.glagna-form').html(tmplMgr.glagna.form.reg);
	
    wofh.form.sex = 1;
	
    wofh.form.loginchanged = false;
	
	appl.setValid('.js-glagna-regForm', appl.regFromValid);
	
	appl.removeAddForm();
    
    appl.hideError();
};

appl.showEnterPage = function(){
    var cont = $('.body-wrp');
	
    cont.find('.glagna-form').html(tmplMgr.glagna.form.enter);

	appl.setValid('.js-glagna-enterForm', appl.enterFromValid);
};

appl.setValid = function(cls, fromValid){
	var cont = $('.body-wrp');
	
    cont.find(cls).isHappy(fromValid);
};

appl.showError = function(text){
	this.setBusy(0);
	
    var cont = $('.body-wrp');
    cont.find('.glagna-error').addClass('-active');
    cont.find('.glagna-error-text').html(text);
};

appl.getAddForm = function(){
    return this.addFormName||'';
};

appl.removeAddForm = function(noRemoveCont){
    var cont = $('.body-wrp');
	
    delete this.addFormName;
	
    var $panel = cont.find('.glagna-addpanel').removeClass('-active');
	
	if( !noRemoveCont )
		$panel.html('');
};

appl.toggleAddForm = function(formName, data, opt){
	opt = opt||{};
	
    var cont = $('.body-wrp');
	
    data = data||{};
	
    if( this.addFormName == formName )
        this.removeAddForm(true);
	else{
		if( !opt.noAddFormName )
			this.addFormName = formName;
		
		var $panel = cont.find('.glagna-addpanel').addClass('-active'),
			$panelCont = $panel.find('.glagna-panel-cont.panel-'+formName);
		
		$panel.find('.glagna-panel-cont').addClass('-hidden');
		
		if( !$panelCont.length ){
			$panelCont = $(snip.wrp('glagna-panel-cont panel-'+formName));
			
			$panel.append($panelCont);
		}
		
		if( !$panelCont.data('noResetCont') )
			$panelCont.html(tmplMgr.glagna.addpanel[formName](data));
		
		if( opt.noResetCont )
			$panelCont.data('noResetCont', true);
		
		$panelCont.removeClass('-hidden');
    }
};

appl.setHardAddForm = function(){
	if( appl.addFormName != 'hard' )
		appl.toggleAddForm('hard');
};

appl.hideError = function(){
    var cont = $('.body-wrp');
    cont.find('.glagna-error').removeClass('-active');
};


appl.showDefName = function(){
    appl.genName();
	
    $('input[name=login]').val(wofh.form.login);
	
    wofh.form.loginchanged = false;
	
    if(appl.blockRegReason == 'name'){
        appl.blockReg(false);
    }
};

//блокирует регистрацию до наступления причины
appl.blockReg = function(toggle, reason){
    setTimeout(function(){
        $('.js-glagna-regForm .glagna-mainBtn').toggleClass('-disabled', toggle);
		
        appl.blockRegReason = reason;
    },0);
};


//блокирует регистрацию до наступления причины
appl.toggleGenNameAnimation = function(toggle){
	$('.glagna-form-getDefLogin').toggleClass('-anim-blink2', toggle);
};

appl.auth = {
    timeoutTime: 25000,//таймаут - если ответ от сервера не получен, показываем, что соединиться не удалось
    
	errors: {
        6: 'Такой игрок не зарегистрирован.', //WEbadAccount
		7: 'Не удалось подобрать место для города с данными настройками', //WEcantLoadTown // не удалось подобрать место для города
        8: 'Данная ссылка подселения была использована ранее',//WENodataинбд - при регистрации
        17: 'Имя не введено.', //WEbadName //неправильная длина имени или имя совпадает с варваром. текст ошибки не нужно для этого кода
		18: 'Правилами запрещено иметь в одном мире несколько аккаунтов', //WEalreadyUsed // недавно уже была регистрация
		23: 'Указанный e-mail уже использован на другом аккаунте', //WEbadEmail
		24: function(){
			appl.toggleGenNameAnimation(true);
			return 'Такой аккаунт уже существует. Придумай или <a class="link js-glagna-genName">создай</a> другое имя.';
		},
		25: 'Неправильная ссылка подселения',
        31: function(data) {
            return wofh.interface.password ? 'Доступ запрещен. Данный аккаунт принадлежит другому игроку' : 'Неверный пароль. Возможно, не соблюдены размеры букв.';
        }, //WEbadPassword //неправильная длина пароля. тоже должна быть проверка еще на клиенте
        35: function(data) {
            var text = '';
            if (data) {
                if (data.time && data.reason) 
                    text += 'Аккаунт заблокирован и будет удален через ' + timeMgr.fPeriod(data.time, {format: Timer.format.full, noZero: true}) + ' ' + data.reason + '.';
                else if (data.time) 
                    text += 'Доступ к аккаунту закрыт на ' + timeMgr.fPeriod(data.time, {format: Timer.format.full, noZero: true}) + ' ';
            } else
                text = 'Отказано в регистрации';
            
            return text;
        }, //WEnoAccess //Отказано в регистрации
        36: 'Обновить страницу и зайти еще раз', //WEbadKey //временный ключ устарел (авто редирект)
		37: 'Такой аккаунт уже существует. Придумай или <a class="link js-glagna-genName">создай</a> другое имя.',
		45: 'В тексте присутствует недопустимый символ, а, быть может, даже несколько.',
		 //WEok3 //аккаунт с таким логином и паролем уже есть, предложить пользователю войти на него
		/*39: function() {
			return 'Некорректный код';
		},*/
        100: 'Не удалось войти. Возможно, этот мир сейчас не работает',
    },
    
	errorsRecPass: {
        25: 'Повторный запрос отклонен',
    },
    
	errorsLuckmove: {
		0: "Монеты Удачи успешно переведены",
		6: "В данном мире нет такого аккаунта",
		8: "Некорректная ссылка",
		18: "Ссылка уже была использована ранее",
		35: "Невозможно осуществить перевод между разными игровыми зонами"
	},
    
	request: function(url, data, method, successCallback) {
		url = appl.prepareRequestUrl(url);
        
		appl.setBusy(1);
		
		if (method == 'POST'){
			$.post(url, data, function(resp){
				console.warn('sucess POST',url, data);
				successCallback(resp);
				appl.setBusy(-1);
			}, 'json');
		} else {
			if (location.hostname != 'wofh.de') {
				data = JSON.stringify(data);
			}

			if ('XDomainRequest' in window && window.XDomainRequest !== null) {
				var xdr = new XDomainRequest();
				xdr.open('POST', url);
				xdr.onload = function() {
					var dom = new ActiveXObject('Microsoft.XMLDOM'),
						JSON = $.parseJSON(xdr.responseText);

					dom.async = false;
					if (JSON === null || typeof(JSON) == 'undefined') {
						JSON = $.parseJSON(data.firstChild.textContent);
					}
					successCallback(JSON);

					appl.setBusy(-1);
				};

				xdr.onerror = function() {
					_result = false;
				};
				xdr.send(data);
			} else if (navigator.userAgent.indexOf('MSIE') != -1 && parseInt(navigator.userAgent.match(/MSIE ([\d.]+)/)[1], 10) < 8) {
				return false;
			} else {
				$.ajax({
					url: url,
					cache: false,
					data: data,
					dataType: 'json',
					type: 'POST',
					success: function(data) {
						console.warn('sucess',url, data);
						successCallback(data);
						appl.setBusy(-1);
					}
				});
			}
		}
	},
    
    reg: function(){
        var self = this;
        var req = utils.clone(wofh.form);
        req.name = req.login;
        delete req.login;
        
        req.parent = wofh.parent;
        req.pkey = wofh.pkey;
        req.rules = 'on';
        
		req.externalid = wofh.externalid;
		req.externalkey = wofh.externalkey;
        req.lang = wofh.language;
		
        if(wofh.event){
            req.eventtime = wofh.event.data.time;
            req.eventcode = wofh.event.data.code;
            req.eventluck = wofh.event.data.luck;
        }
        
		//if(wofh.settle){
		//	req.settle = wofh.settle;
		//}
        
		if( this.timeoutId ) clearTimeout(this.timeoutId);
		
        this.timeoutId = setTimeout(function(){
            self.showError({error: 100});
        }, this.timeoutTime);
		
		this.request(appl.cnst.protocol + '//' + wofh.form.world + '/aj_reg', req, 'getJSON', function(resp) {
			if (resp.error > 0) {
                //при некоторых ошибках блокируем регистрацию до исправления данных
                if(resp.error == ErrorX.ids.WEalreadyUsed){
                    appl.blockReg(true, 'reload');
                }else if(resp.error == ErrorX.ids.WEcantLoadTown){
                    appl.blockReg(true, 'params');
                }else if(resp.error == ErrorX.ids.WEforeignAccount){
                    appl.blockReg(true, 'name');
                }else if(resp.error == ErrorX.ids.WEok3){
                    appl.hideError();
                    wofh.form.savelink = true;
                    appl.auth.login();
                    return;
                }
                
				self.showError(resp);
			} else {
                wofh.form.savelink = true;
				appl.auth.login();
			}
		});
    },
    
    login: function(noemail, notUseKey){
        var self = this;

        var req = {};
        req.login = utils.unescapeHtml(wofh.form.login);
		
		if( !noemail && req.login.indexOf("@") > 1 ){
            self.getLoginByEmail();
			
            return;
        }
		
        req.password = wofh.form.password;
        if( wofh.form.key !== undefined && !notUseKey )
            req.key = wofh.form.key;
        
        if(wofh.form.autologin){
            req.autologin = 1;
        }
		
        if( this.timeoutId ) clearTimeout(this.timeoutId);
		
        this.timeoutId = setTimeout(function(){
            //если сбой произошёл при переходе по быстрой ссылке, то аккаунт ещё не инициализирован
            if(!appl.accountInited){
                //инициализируем
                appl.initAccount();
                //выводим ошибку после окончания инициализации
                var func = appl.onAccountInited.bind(appl);
                appl.onAccountInited = function(){
                    func();
                    self.showError({error: 100});
                };
            }else{
                self.showError({error: 100});
            }
        }, this.timeoutTime);
		
		this.request(appl.cnst.protocol + '//' + wofh.form.world + '/aj_login', req, 'POST', function(resp){
            if ( resp.error > 0 ) {
                delete wofh.form.autologin;
                if( resp.error == 36 ){ //WEbadKey
                    self.updKey();
                } else {
                    var world = wofh.worlds[wofh.form.world];
                    if (world.login && resp.error == 31){
                        self.delFastLink(world, appl.showMainPage.bind(appl));
                    }
                    if( wofh.form.initOnError )
                        appl.initCont();
                    else
                        appl.showEnterPage();
                    
                    self.showError(resp);
                }
            } else {
                if (!wofh.worlds[wofh.form.world].login && wofh.form.savelink) {
                    self.addFastLink(resp.data.session);
                } else {
                    self.enter(resp.data.session);
                }
            }
        }, 'json');
    },
    
    pwdRecover: function(){
        var self = this;
        
        var req = {};
        req.world = wofh.form.world;
        req.login = wofh.form.login;
        req.email = wofh.form.email;
        
		this.request(appl.cnst.protocol + '//' + wofh.form.world + '/aj_password', req, 'POST', function(resp){
            if( resp.error )
				self.showError(resp, self.errorsRecPass);
            else
                appl.toggleAddForm('recoverpassSucess', {email: req.email});
        }, 'json');
    },
    
    luckmove: function(){
        var self = this;
        
        var req = {};
        req.world = wofh.form.world;
        req.login = wofh.form.login;
        req.code = wofh.form.code;
        
		this.request('/aj_luckmove', req, 'POST', function(resp){
            if (!resp.error) {
				appl.showLuckmovePage(true);
            }
            self.showError(resp, self.errorsLuckmove);
        }, 'json');
    },

    getWorldInfo: function(callback){
        var world = wofh.worlds[wofh.form.world];
		
        if( world.continents ){
            callback();
			
			appl.setBusy(0);
        } 
		else{
            this.request(appl.cnst.protocol + '//' + wofh.form.world + '/aj_regdata', {}, 'getJSON', function(resp){
                world.continents = resp.continents;
				
                callback();
            });
        }
    },

    updKey: function(){
		var req = {};
		
        req.uid = wofh.uid;
        
		this.request('/auth_data', req, 'POST', function(resp){
            wofh.login = resp.login;
            appl.auth.updLoginData();
            wofh.form.key = wofh.worlds[wofh.form.world].login.key;
            wofh.form.password = wofh.worlds[wofh.form.world].login.auth;
            
            appl.auth.login();
        }, 'json');
    },

    updLoginData: function(){
        for (var login in wofh.login) {
            login = wofh.login[login];
            var world = wofh.worlds[login.world];
            if (world && world.working) {
                world.login = login;
                if(wofh.interface.logininput == 1){
                    wofh.interface.logininput = 0;
                }
            }
        }
    },
	
	getLoginByEmail: function(){
        var self = this;
		this.request(appl.cnst.protocol + '//'+wofh.form.world+'/aj_email?e='+wofh.form.login+'&p='+wofh.form.password, {}, 'getJSON', function(data){
            if( data )
                wofh.form.login = data;
            
            self.login(true);
        });
    },
	
    addFastLink: function(session){
        var self = this;
        
        var req = {};
        req.login = wofh.form.login;
        req.world = wofh.form.world;
        req.password = wofh.form.password;
        req.uid = wofh.uid;
        
		this.request('/aj_addfastlink?help=help', req, 'POST', function(){
            self.enter(session);
        });
    },
    
    delFastLink: function(world, callback){
        var req = {};
        
        req.world = world.id;
        req.name = utils.unescapeHtml(world.login.name);
        req.key = world.login.deletekey;
        req.uid = wofh.uid;
        
		this.request('/aj_delfast', req, 'POST', function(resp){
			if(!resp.error) {
                delete wofh.form.key;
				delete world.login;
				if (callback){
					callback();
				}
			}
        });
    },
    
    enter: function(session){
		appl.entering = true;
        
		appl.setLocation(appl.cnst.protocol + '//' + wofh.form.world + '/start?session=' + session + '&uid=' + wofh.uid+'&lang='+wofh.language);
    },
    
    getError: function(resp, errors){
        var alert;
		
        if (errors)
            alert = errors[resp.error];
        
        if (!alert)
            alert = this.errors[resp.error];
        
        if (typeof alert == 'function') 
			alert = alert(resp.data);
		
        alert = alert || tmplMgr.glagna.alert.def(resp.error);
		
        return alert;
    },
    
    showError: function(resp, errors){
        if (this.timeoutId) clearTimeout(this.timeoutId);
		
        appl.showError(this.getError(resp, errors));
    },
};

appl.animateBack = {
    getZoomTimeout: function(){
        return this.screenZ <= this.fastZ ? this.fastZoomTimeout : this.zoomTimeout;
    },
    
    init: function(){
		//скриншоты
		this.screensCount = 30;//общее количество
		this.screenZ = 0;//счётчик скринов для z-index

		this.cont = $('.glagna-back');

		//список загруженных скринов
		this.imgLoaded = {};

		this.imgWidth = 1920;
		this.imgHeight = 1080;
		this.zoom = 1.1;
		this.zoomTimeout = 12000;//сколько длится зум
		this.fadeTimeout = 2000;//сколько длится затемнение
		
		this.fastZoomTimeout = 5000;//быстрый зум
		this.fastZ = 10;//сколько изображений будет показано с быстрым зумом
		
		//первая и вторая отображённая картинки
		this.firstImgI = false;
		this.secondImgI = false;
		
		this.imgNotShown = [];//список ещё не показанных картинок
		
		this.loading = false;
		
        this.loadImg();
    },

    //запуск анимации
    startAnim: function(){
        this.start = new Date().getTime() - this.fadeTimeout;
        window.requestAnimationFrame(this.step.bind(this));
    },

    //выбор картинки для показа
    selectImg: function(){
        /*//если нет текущей загрузки, то выбираем из всех, которые могут быть    
        if (!this.loading) {
            var imgI = utils.random(this.screensCount);
            var img = this.imgLoaded[imgI];
            if (img) {
                return img;
            } else {
                this.loadImg(imgI);
            }
        }*/

        //если есть непоказанные картинки, показываем их
        if (this.imgNotShown.length){
            this.loadImg();
			
            return this.imgNotShown.pop();
        }

        //если не удалось выбрать из всех, выбираем из уже загруженных
        var loadedCount = utils.sizeOf(this.imgLoaded);
        if (loadedCount) {
            var imgPos = utils.random(loadedCount);
            for (var imgI in this.imgLoaded){
                imgPos--;
                if (imgPos < 0){
                    if (imgI == this.secondImgI){
                        return this.selectImg();
                    } else {
                        return imgI;
                    }
                }
            }
        }
		
        /*
        //ничего не получилось
        return false;
        */
    },

    //индекс ещё незагруженной картинки
    getUnloadedImgI: function(){
        if (utils.sizeOf(this.imgLoaded) == this.screensCount) {
            return false;
        }

        while (true){
            var imgI = utils.random(this.screensCount);    
            if (!this.imgLoaded[imgI]){
                return imgI;
            }
        }
    },
    
    //загрузка изображения выбранного или случайного ещё незагруженного
    loadImg: function(imgI){
        if (this.loading){
            return;
        }
        this.loading = true;

        if (imgI == undefined) {
            imgI = this.getUnloadedImgI();
        }

        if (imgI === false) {
            return false;
        }

        var img = new Image();
        var $img = $(img);

        img.onload = function(){
            this.imgLoaded[imgI] = $img;
            this.loading = false;
            this.onImgLoaded(imgI);
        }.bind(this);

        $img.attr('class', 'glagna-back-img3');
        $img.attr('rel', 'screens');
        img.src = 'img/site/screenshots2/'+utils.twoDigits((imgI) % this.screensCount)+wofh.language+'.jpg';
    },

    onImgLoaded: function(imgI){
        this.imgNotShown.push(imgI);

        var loadedCount = utils.sizeOf(this.imgLoaded)
        //показываем первую картинку
        if (loadedCount == 1) {
            this.displayImg(imgI);
            this.imgNotShown.pop();
            //this.loadImg();
        }
        //показываем и запускаем анимацию на второй
        if (loadedCount == 2) {
            this.displayImg(imgI);
            this.imgNotShown.pop();
            this.startAnim();
        }

        //если осталась мало непоказанных картинок, грузим ещё
        if (this.imgNotShown.length < 2) {
            this.loadImg();
        }
    },

    //отображение картинки
    displayImg: function(imgI){
        if (this.firstImgI === false){
            this.firstImgI = imgI;
        } else if (this.secondImgI === false){
            this.secondImgI = imgI;
        } else{
            this.firstImgI = this.secondImgI;
            this.secondImgI = imgI;
        }

        var img = this.imgLoaded[imgI];
		
		if( !img )
			return;
		
        this.screenZ++;
        img.css({'z-index': 10000 - this.screenZ, opacity: 1});
        this.cont.append(img);
    },
    
    //шаг анимации
    step: function(){
        var now = new Date().getTime();
        var delay = now - this.start;
        if (delay > this.getZoomTimeout()) {
            this.start = now - this.fadeTimeout;
            this.getDisplayedImg(0).remove();

            var imgI = this.selectImg();
            this.displayImg(imgI);
        } else {
            this.updateImg(this.getDisplayedImg(0), delay);
            /*var img1Delay = delay - this.getZoomTimeout() + this.fadeTimeout;
            if (img1Delay > 0) {
                this.updateImg(this.getDisplayedImg(1), img1Delay);
            }*/
        }

        window.requestAnimationFrame(this.step.bind(this));
    },

    //выбор показанного изображения под номером i
    getDisplayedImg: function(i){
        return this.cont.find('img').eq(i)
    },

    updateImg: function(img, delay){
        var fadeDelay = delay - this.getZoomTimeout() + this.fadeTimeout;
        var opacity = fadeDelay > 0 ? 1 - fadeDelay / this.fadeTimeout : 1;

        img.css({opacity: opacity});
    }
};

appl.cacheData = {}; // Данные которые не должны меняться при переинициализации страницы

appl.setBusy = function(val){
	var $el = $('.-loading, .-disabled');
	
	if( !val ){
		appl.busy = 0;
		
		$el.toggleClass('-disabled', !!appl.busy).toggleClass('-loading', !!appl.busy);
	}
	else{
		val = Math.max(0, appl.busy + val);
		
		if( val ){
			appl.busy = val;
			$el.toggleClass('-disabled', !!appl.busy);
		}
		else if( !appl.entering ){
			appl.busy = val;
			$el.toggleClass('-disabled', !!appl.busy).toggleClass('-loading', !!appl.busy);
		}
		/*
		if( !val ){
			setTimeout(function(){
				self.busy = val;
				$el.toggleClass('-disabled', !!self.busy).toggleClass('-loading', !!self.busy);
			}, 2000);
		}
		else{
			appl.busy = val;
			$el.toggleClass('-disabled', !!appl.busy);
		}
		*/
	}
};

appl.isAppleMobile = function(){
	return navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPad') != -1;
};

appl.cnst = {
	protocol: 'https:',
	domain: glib.main.domain
};

appl.environment = {
	domain: '',
	getParams: ''
};