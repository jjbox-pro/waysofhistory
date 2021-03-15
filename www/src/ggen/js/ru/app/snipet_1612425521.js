snip = {

	/*************
	 ** аккаунт **
	 *************/
	 
	accIcon: function(acc, opt){
		opt = opt||{};
		
		var classAdd = '',
			defAcc = !acc;
		
		if (!acc) 
			acc = new Account();
		if (acc.id == Account.admin.id || acc.id == Account.bot.id){
			classAdd += ' -admin';
		} else {
			if( acc.race !== undefined )
				classAdd += ' -race-'+acc.race.id;
			if( acc.sex !== undefined )
				classAdd += ' -sex-'+acc.sex;
			if ( (acc.isBarbarian && acc.isBarbarian()) || opt.isBarbarian)
				classAdd += ' -barb';
		}
		
		return '<span class="iconAcc '+classAdd+'" '+(defAcc?'data-title="Игрок"':'')+'></span>';
	},
	
	accLink: function(acc, opt){
		opt = opt||{};
		opt.noIcon = opt.noIcon||false;
		opt.link = opt.link !== false;

        if (!acc) return '';
        var text = snip.wrp('-snip-textAcc', acc.name);
        if (!opt.noIcon) text = snip.accIcon(acc, opt) + text;
        if (acc.getSpecial && acc.getSpecial()) return text;

        if( opt.link ) {
			var href = wofh.account.noAcc ? '' : HashMgr.getWndHref('account', acc.id);
			
			text = snip.link(href, text, '-nobr -sel -snip-acc ' + (opt.accCls||''));	
        }

        if( opt.lenLim ){
			opt.noHint = true;
            
        	return snip.lenlim(text, opt);
        }
        else
        	return text;
	},
    
	acc: function(acc){
        if (!acc) return '';
		return snip.wrp('-nobr -sel -snip-acc', snip.accIcon(acc) + snip.wrp('-snip-textAcc', acc.name));
    },
	
	tactic: function(tacticOrText, opt){
		opt = opt||{};
		
		var text = tacticOrText instanceof Tactic ? tacticOrText.getName() : tacticOrText,
			icon = opt.noIcon ? '' : snip.tacticsIcon();
		
		if ( opt.postText )
			text += opt.postText;
		
		if ( opt.lenLim )
        	text = snip.lenlim(text, opt);
		
		return snip.nobr(icon + text, 'span', '-snip-tactic ' + (opt.cls||''));
	},
	
	tacticLink: function(tactic, opt){
		opt = opt||{};
		
		return snip.link(HashMgr.getHref('#/tactics/id='+tactic.getId()+'&secret='+tactic.getSecret()), snip.tactic(tactic), 'link');
	},
	
	/***********
	 ** город **
	 ***********/
	
	//иконки слотов города
	townSlots: function(townOrTerrain, opt){
        opt = opt||{};
        
		var terrain = townOrTerrain instanceof Town ? townOrTerrain.terrain : townOrTerrain,
			slots = Town.type[terrain],
			text = '';
		
		if( !slots ){
            if( opt.showEmpty )
                slots = {hill: 0, ground: 0, water: 0};
            else
                return text;
        }
		
		text += '<span class="iconTownSlot -type-hill"></span><span>&nbsp;' + slots.hill + '&nbsp;</span>';
		text += '<span class="iconTownSlot -type-ground"></span><span>&nbsp;' + slots.ground + '&nbsp;</span>';
		text += '<span class="iconTownSlot -type-water"></span><span>&nbsp;' + slots.water + '</span>';
		
		return text;
	},

	townIcon: function(barb, rel, undf){
        if (undf) var cls = ' -type-undf';
        else if (barb) var cls = ' -type-barb';
        else if (typeof(rel) != 'undefined') var cls = ' -rel-' + utils.cnstName(Tile.relation, rel);
        else var cls = '';
        
		return '<img class="icon_town'+cls+'" src="https://test.waysofhistory.com/img/_.gif">';
	},
	
	town: function(town, acc, country, diplomacy){
        if (!(town instanceof Town)) town = new Town().parse(town);
        
		acc = acc||town.account;
        
        if (acc && !country)
        	country = acc.country;
		
        var rel = Account.calcRelation(acc, country, diplomacy);
		
		return snip.wrp('-nobr -sel -snip-town', snip.townIcon(acc instanceof Account && acc.isBarbarian(), rel, town.id == 0) + snip.wrp('-snip-textTown', town.name));
	},
    
	townLink: function(town, opt){
		opt = opt||{};
		
		var text = opt.text;
		
        if( !town || !(town.id || town.name) )
			town = new Town({id: 0, name: 'Неизвестный город'});
		
		if( !town.isUndf ){
			console.warn('townLink: Town is not instance of Town.', new Error().stack);
			
			town.isUndf = Town.prototype.isUndf; // Костыль. town может быть не классом Town
		}
		
        if( !text ){
			var barb = town.account && town.account.isBarbarian(),
				rel = town.account ? Account.calcRelation(town.account, town.account.country, opt.rel) : Tile.relation.none;
			
			text = (!opt.noIcon ? snip.townIcon(barb, rel, town.isUndf()) : '') + snip.wrp('-snip-textTown', town.name);
		}

		if( town.isUndf() ){
			opt._clsOld_ = opt.cls;
			
			opt.cls = (opt._clsOld_||'') + ' -snip-town';
		}
		
        if( opt.lenLim ) {
			opt.noHint = true;
			
        	text = snip.lenlim(text, opt);
        }
        
        if( town.isUndf() ){
			if( !opt.lenLim ){
				opt.cls += ' -nobr';
				
				text = snip.wrp(opt.cls, text);
			}
		}
		else{
			var href = wofh.account.noAcc ? '' : 'href="' + hashMgr.getWndHref('townInfo', town.id) + '"';
			
			text = '<a class="link -nobr -sel -snip-town '+(opt.townCls||'')+'" '+ href +'>'+text+'</a>';
		}
		
		if( opt._clsOld_ ){
			opt.cls = opt._clsOld_;
			
			delete opt._clsOld_;
		}
		
		return text;
    },
	
	townIconLink: function(town, acc, country, diplomacy){
		if (!town) 
			return snip.townIcon(false, false, true);
		else{
			var barb = acc instanceof Account && acc.isBarbarian();
			var rel = Account.calcRelation(acc, country, diplomacy);
			
			return snip.townLink(town, {text: snip.townIcon(barb, rel, town.id == 0)});
		}
	},
	
	townHid: function(){
		return snip.townIcon()+" Скрыто";
	},
	
	townAccLink: function(town, opt){
		if (!opt) opt = {};

        if (!town || town.id == 0) 
			return snip.townLink(town);
		
		var account = town.account;
		
		if( town.townowner ){
			account = town.townowner;
			
			if( account.isBarbarian() )
				opt.accCls = (opt.accCls||'') + ' -decorationThrough';
			
			opt.townCls = (opt.townCls||'') + ' -decorationThrough';
		}

		return snip.townLink(town, opt) + ' <span style="vertical-align: bottom">('+snip.accLink(account, opt)+')</span>';
	},
	
	townAcc: function(town, account, country){
        if (town.id == 0) return snip.town(town);
		if (!account){
			account = town.account;
		}
		if (!country){
			country = account.country;
		}
		return snip.town(town, account, country) + ' '+snip.nobr('('+snip.acc(account)+')');
	},
	
	accCountry: function(account, country, opt){
		opt = opt||{};
		country = country||account.country;
		
		var accTmpl = opt.noAccLink ? snip.acc : snip.accLink;
		
		opt.link = utils.ifUndf(opt.link, true);
		opt.text = utils.ifUndf(opt.text, false);

		if( !country || country.id == 0 )
			return accTmpl(account, opt);
		
		var flagText = snip.country(country, opt);
		
		if( !opt.noBrackets )
			flagText = '('+flagText+')';
		
		return accTmpl(account, opt)+' '+snip.nobr(flagText);
	},
    
	townAccCountry: function(town, account, country, opt){
		opt = opt||{};
		
		account = account||town.account;
		country = country||account.country;
		
		if (!country || country.id == 0)
			return snip.townAcc(town, account);
		
		opt.flag = opt.flag||'normal';
		
		return snip.town(town, account, country)+ ' '+snip.nobr('('+snip.acc(account)+' '+snip.countryFlag(country, {flag: opt.flag})+')');
	},
	
	townAccCountryLink: function(town, topt, aopt, copt){
		var account = town.account;
		
		if( town.townowner ){
			aopt = aopt||{};
			topt = topt||{};
			
			account = town.townowner;
			
			if( account.isBarbarian() )
				aopt.accCls = (aopt.accCls||'') + ' -decorationThrough';
			
			topt.townCls = (topt.townCls||'') + ' -decorationThrough';
		}
		
		var country = account.country;
		if (!country || country.id == 0) {
			return snip.townAccLink(town);
        }
		return snip.townLink(town, topt)+ ' '+snip.nobr('('+snip.accLink(account, aopt)+' '+snip.countryLink(country, copt)+')');
	},
	    
    //страна - появляется флаг-ссылка страны
    //ширина - lenlim на каждый элемент
	townAccUnder: function(town, account, country, opt){
		opt = opt||{};
		
		if (!account)
			account = town.account;
		if (!country && account)
			country = account.country;
		
		if (opt.lenLim) {
			opt.noHint = true;
        	text = snip.lenlim(text, opt);
        }
		
		var text = '<span class="link-brownBold -snip-townUnder'+(opt.lenLim?' -lenLim -noHint':'')+'" '+(opt.lenLim?'style="max-width:'+opt.lenLim+'px"':'')+'>' + snip.townLink(town)+ '</span>';
		text += '<br><span class="link-gray -nobr -snip-accCountryUnder'+(opt.lenLim?' -lenLim -noHint':'')+'" '+(opt.lenLim?'style="max-width:'+opt.lenLim+'px"':'')+'>'+snip.accLink(account)+' '+(country ? snip.countryLink(country, {text: false}): '')+'</span>';
        
		return text;
	},
	
	/************
	 ** страна **
	 ************/
	
	countryFlagPath: function(country, big){
		var path = '/gen/flag/';
		
		var flag;
		if( !country.flag ){
			flag = '_';
			path = '/img' + path;
		} else {
			flag = country.flag;
		}
		
		if( window.reqMgr )
			path = reqMgr.prepareRequestUrl(path);
		
		return path + (big? '' : '-') + flag + '.gif';
	},

	countryFlag: function(country, opt){
		if( !country ) return '';
		
		opt = opt||{};
		if (!opt.flag) opt.flag = 'micro';//micro/normal/big/bigger

		var big = opt.flag == 'big' || opt.flag == 'bigger' || opt.flag == 'biggest';

		return '<img src="' + snip.countryFlagPath(country, big) + '" class="flag-'+opt.flag+'">';
	},
		
    
	countryLink: function(country, opt){
		opt = opt||{};
		opt.link = true;

		return snip.country(country, opt);
	},
	
	country: function(country, opt){
		if( !country ) return '';
		
		opt = opt||{};
		
		if (opt.flag !== false) opt.flag = opt.flag||'micro';
		
		if (opt.text !== false)
			var text = typeof(opt.text) === 'string' ? opt.text : snip.wrp('-snip-textCountry', country.name);
		else
			var text = '';
		
		opt.link = opt.link||false;

		var flag = opt.flag ? snip.countryFlag(country, opt) : '';
		
		if( opt.lenLim ){
			opt.noHint = true;
			
        	text = snip.lenlim(text, opt);
        }
		
		if (opt.link) {
			var href = wofh.account.noAcc ? '' : 'href="' + hashMgr.getWndHref('countryInfo', country.id) + '"';
			
			return '<a class="link -nobr -sel -snip-country" '+href+'>' + flag + text + '</a>';
		} else {
			return '<span class="-nobr -sel -snip-country">' + flag + text + '</span>';	
		}
	},
	
	/*************
	 ** ресурсы **
	 *************/
	
	res: function(res, opt){
		opt = opt||{};
		opt.big = opt.big||false;
		opt.text = opt.text||'';
        
		if (opt.text) {
			var opt2 = utils.clone(opt);
			delete opt2.text;
			return snip.nobr(snip.res(res, opt2)+opt.text);
		}
		
		res = Resource.getObj(res);
		
		var title = opt.noTitle ? '' : res.getHint();
		
		if (res.isEmpty())
            return '';
        
        if( opt.backgrounded )
            return snip.resBackgrounded(res, title);
            
		return '<span class="'+(opt.cls||'')+(opt.big?' resBig':' res')+' -r'+res.getId()+'" data-id="'+res.getId()+'" data-title="'+title+'"></span>';
	},
	
        resBackgrounded: function(res, title, opt){
            return snip.icon(snip.c.resIcon, res.getId(), title);
        },
    
	resBig: function(res, title){
		res = Resource.getObj(res);
		if (res.isEmpty()) return '';
        
        if(typeof(title) == 'undefined') title = res.getHint();
        if(title) title = 'data-title="'+title+'"';
		return '<span class="resBig" data-id="'+res.getId()+'" '+title+'></span>';
	},
    
	resName: function(res, opt){
        opt = opt||{};
        
        res = Resource.getObj(res);
        
        opt.text = opt.text||snip.wrp('res-name', res.getName());
        
		return snip.res(res, opt);
	},
    
	resBigName: function(res){
		res = Resource.getObj(res);
		return snip.nobr(snip.resBig(res)+res.getName());
	},
	
	resCount: function(res, count, opt){
		opt = opt||{};
		
		if ( opt.filter === undefined ) opt.filter = 'stages';

		res = Resource.getObj(res, count);
		
		count = count || res.getCount();
		
		count = snip.prepNumber(count, opt.filter, opt);
		
		if( opt.resCountPostFix ){
			if( opt.resCountPostFix instanceof Function )
				count += opt.resCountPostFix(res);
			else
				count += opt.resCountPostFix;
		}
		
		return snip.nobr(snip.res(res) + count, false, (opt.cls||'') + (opt.cls?' -id-' + res.getId():''));
	},
	
	resBigCount: function(res, count, opt){
		opt = opt||{};
		
		res = Resource.getObj(res, count);
		
		if( count === undefined )
			return snip.resBigCount(res, res.getCount());
		
		if( !opt.noPrepare )
			count = utils.stages(count||0);
		
		return snip.nobr(snip.resBig(res) + count);
	},
	
	resList: function(resList, opt){
		opt = opt||{};
		opt.tmpl = opt.tmpl||snip.resCount;
		
		if( !opt.noDefSort )
			resList = resList.sortByDefault();
		
		resList = resList.getList();
		
		var result = '';
		for (var res in resList){
			res = resList[res];
			
			if (result)
				result += ' ';
			
			result += opt.tmpl(res, false, opt);
		}
		
		return result;
	},
	
	//будет заменена на resList
	resBigList: function(resList, noCount, notAllowZero){
		resList = resList.sortByDefault().getList();
		
		var result = '';
		for (var res in resList){
			res = resList[res];
			
			if( notAllowZero && !res.getCount() )
				continue;
			
			result += (noCount ? snip.resBig(res) : snip.resBigCount(res)) + ' ';
		}
		
		return result;
	},
	
	resWarn: function(res, warn, title, opt){
		if (!opt) opt = {};
		if (typeof opt.filter == 'undefined') opt.filter = 'stages'

		return snip.nobr( snip.res(res) + snip.title(snip.warnBg(snip.prepNumber(res.getCount(), opt.filter), warn), title));
	},
	
	prepNumber: function(num, filter, opt){
		if (filter) {
			num = utils[filter](num, opt);	
		}
		return num;
	},
    
	resListCheck: function(resList, town){
		town = town||wofh.town;
		var result = '';
        var stock = town.stock;
		for (var res in resList.getList()){
			res = resList.getElem(res);
            var stockRes = stock.getElem(res);
            
			
			var has = res.isFood() ? stock.getFoodHasAfterSpend(resList) : stockRes.has;
            if (res.getCount() <= has){
                var title = 'Достаточно ресурса';
                var warn = snip.c.warn.no;
            } else if(res.getCount() > stock.getMax(res)){
                var title = 'Не хватает вместимости. Развивай складские помещения!';
                var warn = snip.c.warn.black;
            } else if(stockRes.updateHour <= 0 || res.isFood()){
                var title = 'Не хватает ресурса. Накопи, купи или награбь!';
                var warn = snip.c.warn.red;
            } else {
                var time = stockRes.calcTimeTo(res.getCount());
                var title = 'Накопится через ' + timeMgr.fPeriod(time) + '';
                var warn = snip.c.warn.brown;
            }
            
            
            result += snip.resWarn(res, warn, title) + ' ';
		}
		return result;
	},
	
	resBigListCheck: function(resList, town){
		town = town||wofh.town;
		var result = '';
        var stock = town.stock;
		for (var res in resList.getList()){
			res = resList.getElem(res);
            var stockRes = stock.getElem(res);
            
            var has = res.isFood() ? stock.getFoodHasAfterSpend(resList) : stockRes.has;
            if (res.getCount() <= has){
                var title = 'Достаточно ресурса';
                var warn = snip.c.warn.green;
            } else if(res.getCount() > stock.getMax(res)){
                var title = 'Не хватает вместимости. Развивай складские помещения!';
                var warn = snip.c.warn.black;
            } else if(stockRes.updateHour <= 0 || res.isFood()){
                var title = 'Не хватает ресурса. Накопи, купи или награбь!';
                var warn = snip.c.warn.red;
            } else {
                var time = stockRes.calcTimeTo(res.getCount());
                var title = 'Накопится через ' + timeMgr.fPeriod(time) + '';
                var warn = snip.c.warn.brown;
            }
            
            result += snip.nobr( snip.resBig(res) + snip.title(snip.warnBg(utils.stages(res.getCount()), warn), title)) + ' ';
		}
		return result;
	},
    
	resBigListCheckFill: function(defResList, resList){
		var result = '',
			defList = defResList.getList();
		
		for (var defRes in defList){
			defRes = defList[defRes];
			
            var res = resList.getElem(defRes.getId());
            
            if ( defRes.getCount() - res.getCount() > 0 )
				var warn = snip.c.warn.red;
            else
				var warn = snip.c.warn.green;
            
            result += snip.nobr(snip.resBig(defRes) + snip.warnBg(utils.stages(defRes.getCount()), warn)) + ' ';
		}
		
		return result;
	},
	
	resBigListBuy: function(resList){
		var result = '';
		for (var res in resList.getList()){
			res = resList.getElem(res);
            
            var type = res.getUpdateType();
            
			result += snip.resBigCount(res);
		}
		return result;
	},
	
	resProdtypeName: function(prodType){
		switch (+prodType) {
			case 0: return "Научные исследования";
			case 1: return "Финансы";
			case 2: return "Сельское хозяйство";
			case 3: return "Промышленность";
		}
	},
	
	resProdtypeIcon: function(prodType, wide){
		var icon = prodType;
		var title = snip.resProdtypeName(prodType);
		
		var iconEl = '<img class="resProdtype -type-' + icon + '" src="https://test.waysofhistory.com/img/_.gif" title="' + title + '">';
		
		if (wide) return snip.nobr(iconEl += title);
		else return iconEl;
	},
    
    
    resEffect: function(res, cls){
		res = Resource.getObj(res);
        return '<span class="resEffect -r'+res.getId()+ ' ' + (cls||'') +'" data-title="'+Resource.effectTitle[res.getId()] +'"></span>';
    },
    
    resStockWarn: function(res){
        return snip.warn(~~res.has, snip.resStockWarnColor(res));
    },
    
    resStockWarnColor: function(res){
        if (!res.isStockable()) return snip.c.warn.black;
        else {
            if(res.town.getStock().max <= res.updateHour*12+res.has) return snip.c.warn.blue;
            if(res.updateHour == 0) return snip.c.warn.black;
            
            var inc = res.updateHour>0;
            var fill = res.calcStockFillTime()<=12*60*60*1000;
            
            if (inc && fill) return snip.c.warn.lgreen;
            if (inc && !fill) return snip.c.warn.green;
            if (!inc && fill) return snip.c.warn.red;
            if (!inc && !fill) return snip.c.warn.brown;
        }
    },
    
    
    resStockWarnHas: function(res, formatOpt){
        return snip.warn(utils.formatNum(res.has, formatOpt||{int: true, stages: true}), snip.resStockWarnHasColor(res));
    },
    
    resStockWarnHasColor: function(res){
        if( !res.isStockable() )
            return snip.c.warn.black;
            
        if( utils.toInt(res.has) == utils.toInt(res.town.getStock().getMax()) )
            return snip.c.warn.blue;
        
        if(res.updateHour == 0)
            return snip.c.warn.black;
        
        var inc = res.updateHour > 0,
            fill = res.calcStockFillTime();

        if (inc && fill <= 6 * 3600)
            return snip.c.warn.purple;
        if (!inc && fill <= 6 * 3600)
            return snip.c.warn.red;
        if (!inc && fill <= 12 * 3600)
            return snip.c.warn.brown;
        
        return snip.c.warn.black;
    },
    
    resStockWarnUpd: function(res){
        var val = utils.formatNum(res.updateHour, {sign: true, stages: true, int: true});
		
        if( res.isStockable() && res.updateHour > 0 && utils.toInt(res.has) == utils.toInt(res.town.getStock().getMax()) )
            val = '(' + val + ')';
		
        return snip.warn(val, snip.resStockWarnUpdColor(res));
    },
	
    resStockWarnUpdColor: function(res){
        //if (!res.isStockable()) return snip.c.warn.grey;
		
        if(res.isStockable()) {
            if( res.updateHour > 0 && utils.toInt(res.has) == utils.toInt(res.town.getStock().getMax()) ) 
                return snip.c.warn.grey;

            var inc = res.updateHour > 0,
                fill = res.calcStockFillTime();

            if( inc && fill <= 6 * 3600 )
                return snip.c.warn.purple;
            if( inc && fill <= 12 * 3600 )
                return snip.c.warn.green;
            if( !inc && fill <= 6 * 3600 )
                return snip.c.warn.red;
            if( !inc )
                return snip.c.warn.brown;

            return snip.c.warn.grey;
        } 
        else{
            if( res.updateHour == 0 )
                return snip.c.warn.grey;
            
            return res.updateHour > 0 ? snip.c.warn.green : snip.c.warn.red;
        }
    },
    
	
    resStockWarnScaleColor: function(res){
        if (~~res.has == ~~res.town.getStock().getMax()) return snip.c.warn.blue;
        if(res.updateHour == 0) return snip.c.warn.black;

        var inc = res.updateHour>0;
        var fill = res.calcStockFillTime();

        if (inc && fill <= 6 * 3600) return snip.c.warn.purple;
        if (!inc && fill <= 6 * 3600) return snip.c.warn.red;
        if (inc) return snip.c.warn.green;
        if (!inc) return snip.c.warn.brown;
    },
	
	/***********
	 ** армия **
	 ***********/
	
	//иконка юнита
	unitIcon: function(unit, opt){
		opt = opt||{};
		opt.half = opt.half||false;//полуюнит
		opt.small = opt.small||false;//уменьшенная картинка
		opt.checkAvail = opt.checkAvail||false;//проверяем на доступность
		opt.grey = opt.grey||false;//иконка в серых цветах

		unit = Unit.getObj(unit);
		
		var id = unit.getId(),
			cls = opt.cls||'',
			data = '';
		
		if( unit.isTemplate() ){
			var code = unit.getCode(),
				priority = '';

			id = code[0];

			cls += ' -uTmpl';

			if( unit.getTmplSecondTag() ){
				priority += ' -uTmplPriority ';
				
				priority += unit.getTmplPriority() ? ('u' + code[1] + '-nEq ') : ('u' + code[1] + '-eq ');
				priority += (unit.isTmplSecondTagNeg() ? '-pNeg ' : '');
			}

			cls += unit.isTmplFirstTagNeg() ? ' -neg' : '';
			cls += priority;
		}
		else{
			if (opt.half) cls += ' -unit-half';
			if (opt.small) cls += ' -unit-small';
			if (opt.checkAvail && !unit.isAvailAcc()) cls += ' -unit-disabled';
			if (opt.grey) cls += ' -type-grey';
		}
		
		if (opt.tooltip){
			cls += ' js-tooltip';
			data += ' data-tooltip-wnd="unitinfo" data-id="' + unit.getId() + '"';
		} 
		
		if( wofh.country && opt.countryPayments ){
			var countryPayments = [];
			
			for(var countryPayment in opt.countryPayments){
				countryPayment = opt.countryPayments[countryPayment];
				
				if( unit.getCountryPayment(countryPayment) )
					countryPayments.push(countryPayment);
			}
			
			if( countryPayments.length )
				data += ' data-countrypayments="'+countryPayments.join(',')+'"';
		}
		
        return '<span class="unit u' + id + ' ' + cls+'"'+data+'></span>';
	},
    
    //юнит - ссылка с иконкой и именем
	unitLink2: function(unit, opt){ 
		unit = Unit.getObj(unit);

		opt = opt||{};
		opt.link = opt.link !== false;
		opt.icon = opt.icon !== false;
		opt.name = opt.name == undefined? unit.getName(): opt.name;

		var text = '';
		if (opt.icon) text += snip.unitIcon(unit, opt);
		if (opt.name) text += name;
		if (opt.link) {
        	return '<a class="link" href="'+HashMgr.getHref('#/unitinfo/' + unit.getId()) + '">' + text + '</a>';
		} else {
        	return snip.nobr(text);
		}
	},

	unitName: function(unit){
		unit = Unit.getObj(unit);    
        return snip.nobr(snip.unitIcon(unit) + unit.getName());
	},
    
	unitLink: function(unit, text, opt){
		opt = opt||{};
		
		unit = Unit.getObj(unit);
        if(!text)text = unit.getName();
		
		var color = '';
		if( opt.highlight && wofh.account ){
			color = 'cl-' + (unit.isAvailAcc() ? 'greeni' : 'redi');
        }
		
        return '<a class="link ' + color + ' ' + (opt.ulCls||'') + '" href="'+HashMgr.getHref('#/unitinfo/' + unit.getId()) + '">' + text + '</a>';
	},
    
	unitNameLink: function(unit, text, opt){
		opt = opt||{};
		unit = Unit.getObj(unit);
		
        return snip.unitLink(unit, (opt.noIcon?'':snip.unitIcon(unit)) + (text||unit.getName()), opt);
    },
    
	unitIconLink: function(unit, opt){   
		unit = Unit.getObj(unit);    
        return snip.unitLink(unit, snip.unitIcon(unit, opt));
	},
	
	unitCount: function(unit, count, small){
		unit = Unit.getObj(unit);  
        count = typeof(count) == 'undefined' ? unit.getCount() : count;
		return snip.nobr(snip.unitIcon(unit, {small: small})+'<span class="unitCount">'+count+'</span>');
	},
    
	unitCountLink: function(unit, count){ 
		unit = Unit.getObj(unit);
        if (unit.isEnabled()) return snip.nobr(snip.unitIconLink(unit)+'<span class="unitCount">'+(count||unit.getCount())+'</span>');
        else return snip.unitCount(unit, count);
	},
	
	unitTags: function(unit){
		unit = Unit.getObj(unit);
		
		var tags = unit.getTags();
		
		var tagsNamesArr = [];
		
		for(var tagKey in Unit.tags){
			var tag = Unit.tags[tagKey] & tags,
				tagName = Unit.getTagName(tag||false);
			if( tagName ){
				if( Unit.isTacticsTag(tag) )
					tagName = snip.tooltip(tagName, tagName, {attrs:{'tooltip-label':snip.icon(snip.c.unitTagIcon, tagKey)}});
				
				tagsNamesArr.push(tagName);
			}
		}
		
        return tagsNamesArr.join(', ');
	},
	
	unitUnknown: function(){
		return '<span class="unit"></span>';
	},
	
	army: function(army, opt){
		opt = opt||{};
		opt.tmpl = opt.tmpl||snip.unitCountLink;
		
		var result = '';
		army = army.getList();
		for (var unit in army){
			unit = army[unit];
			if( opt.notAllowZero && !unit.getCount() )
				continue;
			result += opt.tmpl(unit) + ' ';
		}
		return result;
	},
	
	defMoment: function(defMoment){
		return snip.defIcon() + timeMgr.fMoment(defMoment);
	},
    
    defIcon: function(){
		return '<span class="pigeon"></span>';
	},
    
	/**************
	 ** строение **
	 **************/
    
    slotMini: function(slot, opt){
    	opt = opt||{};
    	opt.hint = opt.hint||slot.getName();

		return '<a href="'+HashMgr.getHref('#/buildinfo/'+slot.getId())+'" class="build_icon_s '+(slot.isWonder()?'build_icon_sw':'')+' build_icon_s_mini" style="background-image:url(https://test.waysofhistory.com/img/buildings2/'+slot.getId()+'_'+slot.getPic()+'.png)" data-title="'+opt.hint+'"></a>';
    },
	
	slotEventTitle: function(slot, event, prevSlot){
		var title = '';
		
		if( event ){
			var eventI = +event.getBldQueuePos();
			
			if( eventI ){
				title = 'В очереди на ' + (eventI+1) + ' месте.<br>';
				
				title += event.isDestroy() || event.isRebuild() ? prevSlot.getName() : slot.getName();
				
				if( event.isRebuild() )
					title += ' ' + prevSlot.getLevel() + ' уровня';
				
				title += ' — ' + Slot.actions[event.getAction()].title.toLowerCase();
				
				if( event.isBuild() ){
					if ( !prevSlot.isEmpty() )
						title += ' ' + slot.getLevel() + ' уровня';
				}
				else if( event.isRebuild() )
					title += ' в ' + slot.getName();
				else if( event.isDestroylevel() )
					title += ' до ' + slot.getLevel() + ' уровня';
				
				title += '.<br>';
			}
			else{
				if( event.isRebuild() )
					title += '' + prevSlot.getName() + ' ' + prevSlot.getLevel() + ' уровня перестраивается в ' + slot.getName() + '';
				else if ( event.isDestroy() )
					title += 'Полностью разрушается ' + prevSlot.getName() + ' ' + prevSlot.getLevel() + ' уровня';
				else if ( event.isDestroylevel() )
					title += 'Разрушается ' + prevSlot.getName() + ' до ' + slot.getLevel() + ' уровня';
				else{
					if ( prevSlot.isEmpty() )
						title += '' + slot.getName() + ' строится';
					else
						title += '' + slot.getName() + ' улучшается до ' + slot.getLevel() + ' уровня';
				}
				
				title += '.<br>';
			}
			
			title += 'Окончание в ' + timeMgr.fMoment(event.getTime()) + '';
		}
		else
			title = slot.isEmpty() ? snip.slotTerrName(slot) : snip.slotNameLevel(slot);
		
		return title;
	},
	
	slotTitle: function(slot){
		if( slot.getTown() )
			slot = slot.dispPrepare();
		if( slot.isEmpty() )
			return snip.slotTerrName(slot);
		
		var title = '';
		
		if( slot.haveActions() && slot.getBldEvent().isCurBuild() ){
			var event = slot.getBldEvent(),
				eventI = +event.getBldQueuePos();
			
			if(eventI)
				title = 'В очереди на ' + (eventI+1)+ ' месте.<br>';
			
			if( event.isRebuild() )
				title += '' + slot.getName() + ' ' + slot.getLevel() + ' уровня перестраивается в ' + slot.applyEvent().getName() + '';
			else if ( event.isDestroy() )
				title += 'Полностью разрушается ' + slot.getName() + ' ' + slot.getLevel() + ' уровня';
			else if ( event.isDestroylevel() )
				title += 'Разрушается ' + slot.getName() + ' до ' + (slot.getLevel()-1) + ' уровня';
			else{
				if ( slot.getLevel() )
					title += '' + slot.getName() + ' улучшается до ' + slot.getUp().getLevel() + ' уровня';
				else
					title += '' + slot.getName() + ' строится';
			}
			
			title += '.<br>Окончание в ' + timeMgr.fMoment(event.getTime()) + '';
		} 
		else
			title = snip.slotNameLevel(slot);
		
		return title;
	},
    
	slotNameLevel: function(slot){
		var text = slot.getName();
		
		text += snip.slotLevelInfo(slot);
		
		return text;
    },
    
	slotLevelInfo: function(slot){
		var text = '';
		
		if (slot.isWonder()) {
			if (slot.level && slot.isActive()){
				text += ' — Чудо активировано';
			} else {
				text += ' — '+slot.getLevel()+' уровень. Не активировано';
			}
		} else {
			text += ' — '+slot.getLevel()+' уровень. ';
			
			if( slot.getPos() != Build.no )
				text += slot.getPos() + ' квартал';
		}
		return text;
    },
	
	slotName: function(slot, opt){
		slot = Slot.getObj(slot);
		
		opt = opt||{};
		opt.lenLim = utils.ifUndf(opt.lenLim, false);
		opt.level = utils.ifUndf(opt.level, false);  
		/*
		 * lenLim - 
		 * level - показывать ли уровень
		 */

        var icon = slot.isWonder()? snip.wonderIcon(slot): '';
        
        var name = slot.getName();
        if( opt.lenLim ){
			opt.noHint = true;
			
        	name = snip.lenlim(name, opt);
        }
        
        var level = '';
        if( opt.level ) {
            level = slot.isWonder() && slot.isActive() ? '+': slot.getLevel();
            level = ' (' + level + ')';
        }
        
        return icon + name + level;
    },
	
	buildImgBigPath: function(slot, opt){
		opt = opt||{}
		opt.blink = opt.blink||false;

		var blinkSuffix = opt.blink? '_0': '';

        return 'https://test.waysofhistory.com/img/buildings2/'+slot.getId()+'_'+slot.getLevelPic(true)+'_'+slot.getImgSubtype()+blinkSuffix+'.png';
    },
	
	buildImgBig: function(a, b, opt)/*(slot), (buildId, buildLevel)*/ {
		opt = opt||{};
		opt.blink = opt.blink||false;

		var slot = a instanceof Slot ? a : new Slot(a, b),
			text = '<img src="'+snip.buildImgBigPath(slot, opt)+'">';
		
		if( !opt.noTitle )
			text = snip.hintWrp(snip.slotTitle(slot), text);
		
		return text;
	},
	
	buildLinkOpen: function(build, opt) {
		opt = opt||{};
		
		build = build instanceof Object ? build : new Build(build);
		
		var research = '';
		
		if( appl.isPedia ){
			var lvl;
			
			if( wofh.account )
				lvl = Build.getResearchLevel(build.id);
			else
				lvl = lib.build.maxlevel;
			
			research = 'cl-';
			
			if( lvl == 0 )
				research += 'redi';
			else if( lvl == lib.build.maxlevel ){
				research += 'greeni';
			}
		}
		
		return '<a class="link ' + research + ' ' + (opt.cls||'') + '" '+' href="'+HashMgr.getWndHref('buildinfo', build.getId())+'" '+utils.makeDataAttrStr(opt.attrs)+'>';
	},
	
    /**********
	 ** раса **
	 **********/
	
	raceName: function(race, opt) {
		opt = opt||{};
		
		return opt.colored ? snip.raceColoredName(race) : race.getName();
	},
	
	raceColoredName: function(race) {
		return '<span class="clr'+(wofh.account.race.getId() == race.getId()?2:1)+'">'+ race.getName() +'</span>';
	},
	
    /*
     * level = false - не показывать уровень, undf - брать уровень из слота
     */
	build: function(slot, text, opt){
        opt = opt || {};
        
        slot = Slot.getObj(slot);
		
        if (slot.isEmpty()) return '';
        
        if (!text){
            text = snip.wrp('-snip-textBuild', slot.getName());
            
            //добавляем информацию об уровне
            if(opt.level !== false && typeof(slot.getLevel()) != 'undefined'){
                var level = slot.isWonder() && slot.isActive() ? '+' : slot.getLevel();
				
                text += ' <span>(' + level + ')</span>';
            }
            
            //чуду добавляем иконку
            if( slot.isWonder() )
                text = snip.wonderIcon(slot) + text;
        }
		
		text = text||slot.getName();
		
		return '<span class="-snip-build">'+text+'</span>';
    },
    
    
	buildLink: function(slot, text, opt){
		var slot = Slot.getObj(slot);
		
        if( slot.isEmpty() )
			return '';
        
		var text = snip.build(slot, text, opt);
		
		return snip.buildLinkOpen(slot, {cls: '-snip-buildLink -nobr'}) + text + snip.linkClose();
	},
    
	buildTab: function(tabId, opt){
		opt = opt||{};
		
		return '<a class="buildTabs-tab -type-'+Slot.tabs[tabId].name+' '+(opt.cls||'')+'" data-group="'+tabId+'" data-title="'+Slot.tabs[tabId].hint+'">'+snip.buildTabIcon(tabId)+'</a>';
	},
	
	buildTabIcon: function(tabId){
		return '<div class="build-tabIcon-wrp build-tabIcon -type-'+Slot.tabs[tabId].name+'"></div>';
	},
	
	buildTabButton: function(tabId){
		return '<div class="button4 build-tabIcon -type-'+Slot.tabs[tabId].name+'"></div>';
	},
	
	buildImgBigLink: function(a, b)/*(slot), (buildId, buildLevel)*/ {
		var slot = arguments.length > 1? new Slot(a, b): a;
		return snip.buildLink(slot, snip.buildImgBig(slot));
	},
	
	slotArrow: function(){
		return '<img src="https://test.waysofhistory.com/img/gui/quests/arrow.png">';
	},
	
	slotEventArrow: function(type){
		var title = '';
		switch(type){
			case 'destroy': title = 'Разрушается'; break;
			case 'build': title = 'Строится'; break;
			case 'rebuild': title = 'Перестраивается'; break;
		}
		return '<img src="https://test.waysofhistory.com/img/_.gif" class="build-arrow -arrow-' + type + '" data-title="' + title + '">';
	},
	
	emptySlot: function(opt)/*(slot), (terrain=0)*/{
		opt = opt||{}
		opt.terrain = opt.terrain||0
		opt.money = opt.money||false;
		opt.blink = opt.blink||false;
			
        return '<span class="emptySlot -terr-'+opt.terrain+(opt.money?' -type-money':' ')+(opt.blink?' -type-blink':' ')+'" data-title="'+snip.slotTerrName(opt.terrain)+'"></span>';
	},
    
	emptySlot2: function(a)/*(slot), (terrain=0)*/{ 
        var addClass = '';
        
		if (typeof(a) == 'object'){
            var slot = a;
			var terrain = slot.getSlotType();
            if (slot.needPay){
                if (Account.hasAbility(Science.ability.money)){
                    addClass = '-money';
                } else {
                    addClass = '-disabled';
                }
            }
		} else {
			var terrain = a;    
		}
			
        return '<span class="emptySlot2 -terr-'+terrain+' '+addClass+'" data-title="'+snip.slotTerrName(terrain)+'"></span>';
	},
	
	buildParamsEffect: function(val) {
		if (+val == 0) {
			return '';
		} else {
			return ' (+' + val + ' ' + snip.hint(" После улучшения") + ')';
		}
	},
	
	effectUp: function(val) {
		if (+val == 0) return '';
		return ' (<span class="colorNumber -type-'+(val>0?'up':'down')+'">' + snip.sign(val) + '</span>)';
	},
	
	slotTerrName: function(a) /*(slot), (terrain)*/{
		var terrain = a instanceof Object ? a.getSlotType() : a;
		
		var arr = ["Равнина", "Центр города", "Холм", "Берег", "Периметр", "Чудо Света", ""];
		return arr[terrain];
	},
	
	slotFrame: function(slot, text, opt) {
		opt = opt||{};
		
		var title = !opt.noTitle ? 'data-title="' + snip.slotTitle(slot) + '"' : '',
			imgPath = snip.buildImgPath(slot, {checkActions: false, grey: opt.grey});
		
		if( opt.showEmpty && slot.isEmpty() ){
			imgPath = '';
			text = snip.emptySlot2(slot);
		}
		
		return '<div class="slotFrame'+(slot.isWonder()? ' -type-wonder':'')+(opt.disabled? ' -disabled':'')+'" ' + imgPath + ' ' + title +'>' + (text||'') + '</div>';
	},
    
	slotFrame2: function(slot, opt) {
		opt = opt||{};
		opt.grey = opt.grey||false;//серая картинка
		opt.checkActions = false;
		
        slot = Slot.getObj(slot);
        
		if( opt.allowEmpty && slot.isEmpty() )
			return snip.emptySlot2(slot);
		
        var text = '';
		
		if( !opt.showLabel )
			slot.getMaxLevel() == lib.build.maxlevel ? '<div class="slotFrame2-bldStar"></div>' : '';
		
        text += '<div class="slotFrame2-bldImg ' + (opt.disabled ? '-disabled' : '') + '" '+snip.buildImgPath(slot, opt)+'>';
        
		if( opt.showLabel )
			text += snip.slotLevel(slot);
		
		text += '</div>';
		
		if( !opt.noLink )
			text = snip.buildLink(slot, text);
                                                        
		return '<div class="slotFrame2">'+text+'</div>';
	},
	
	slotIcon: function(slot, opt) {
		var imgPath = '',
			cls = '';
		
		if( slot.isEmpty() )
			cls += 'emptySlot2 -terr-'+slot.getSlotType();
		else
			imgPath = snip.buildImgPath(slot, {checkActions: false, grey: opt.grey});
		
		cls += ' ' + opt.cls;
		
		return '<div class="slotIcon '+cls+'" '+imgPath+'></div>';
	},
	
	slotLevelStyle: function(slot){
		if (slot.id != 0 && slot.slot != 0 && (!slot.active && !slot.isWonder())) return 3;
		if (slot.level == lib.build.maxlevel) return 2
		if (slot.level >= (wofh.account.research.build[slot.id]||0)) return 1;
		return 0;
	},
	
	slotLevel: function(slot, opt){
		opt = opt||{};
		return '<span class="slotLevel -type-'+snip.slotLevelBigType(slot, opt)+' '+(slot.isWonder()?'-type-wonder':'')+'">'+snip.slotLevelStar(slot)+'</span>';
	},
    
	slotLevelBigType: function(slot, opt){
		opt = opt||{};
		
        if (slot.isWonder()){
            if (slot.isActive()) return 5;
        } else {
            if (slot.getId()!=0 && !slot.isActive()) return 4;
        }
        if (slot.getLevel() == lib.build.maxlevel) return 3;
        if (slot.getLevel() >= slot.getMaxLevel()) return 1;
		
		if( !opt.ignoreBuildErr ){
			var err = slot.canBuildErr();
			if (err != Slot.buildErr.ok && err != Slot.buildErr.queue) return 2;
		}
        
		return 0;
    },
    
	slotLevelStar: function(slot){
        return slot.getLevel() == lib.build.maxlevel? '<span class="slotLevelStar"></span>' : slot.getLevel();
    },
	
	slotLevelBig: function(slot, opt){
        var labelType = opt && typeof(opt.labelType) != 'undefined' ? opt.labelType : snip.slotLevelBigType(slot);
		return '<div class="slotLevelBig -type-'+labelType+'">'+snip.slotLevelStar(slot)+'</div>';
	},
    
    slotLevelBigDisp: function(slot){
        var slotDisp = cnst.buildPic2[slot.getId()];
    },
	
	slotImgLevelBig: function(a, b, opt)/*(slot), (buildId, buildLevel)*/ {
		opt = opt || {};
        opt.blink = opt.blink||false;

		var slot = a instanceof Slot ? a : new Slot(a, b);
        var disp = slot.getLevelRelDisp(opt.useDNewWnd);
		
        return '<div class="slotBig-wrp">' + snip.buildImgBig(slot, false, opt) + '<div class="slotLevelBig-wrp" style="left: '+disp.x+'px; top: '+disp.y+'px;">'+snip.slotLevelBig(slot, opt)+'</div></div>';
	},
	
	slotImgLevelBigLink: function(a, b, opt)/*(slot), (buildId, buildLevel)*/ {
        opt = opt || {};
        opt.labelType = 0;
        opt.blink = opt.blink||false
        
		var slot = typeof(a) == 'number'? new Slot(a): a;
        if (typeof(b) != 'undefined') slot.setLevel(b);
		return snip.buildLink(slot, snip.slotImgLevelBig(slot, false, opt));
	},
	
	slotMaxLevel: function(slot){
		if (slot.getMaxLevel() == lib.build.maxlevel) var type = 2;
		else var type = 0;
		
		return '<span class="slotLevel -type-'+type+'" data-title="Максимальный уровень">'+slot.getMaxLevel()+'</span>';
	},
	
	slotBuildButton: function(slot, error, admin){		
        return '<span class="buttonBuildSlot">'+snip.slotBuildIcon(slot, error)+(admin?'<span class="buttonBuildSlot-star slotLevelStar"></span>':'')+'</span>';
	},
    
	slotBuildClass: function(slot, error){
		if (typeof(error) == 'undefined') {
			error = slot.canBuildErr();
		}
		
        if (error == Slot.buildErr.ok) {
            return '-act-ok';
        } else if(error == Slot.buildErr.queue) {
            return '-act-wait';
        } else if(error == Slot.buildErr.needBonus) {
            return '-act-bonus';
        } else {
            return '-act-no';
        }
    },
    
	slotBuildIcon: function(slot, error){
		var title = snip.slotBuildTitle(slot, error);
        
        var cls = snip.slotBuildClass(slot, error);
        
        return '<span class="buttonBuildSlot-icon -type-up ' + cls + '" data-title="' + title + '"></span>';
    },
    
	slotBuildOrderIcon: function(opt){
		opt = opt||{};
		opt.cls = opt.cls||'';
		
		if( opt.rebuild )
			opt.cls += ' -subtype-rebuild';
		
        return '<span class="buttonBuildSlot-icon -type-order '+opt.cls+'"></span>';
    },
    
	slotStartBuildIcon: function(slot){
        var title = snip.slotBuildTitle(slot);
        
        var cls = snip.slotBuildClass(slot);
		
        return '<span class="iconBuildSlot ' + cls + '" data-title="' + title + '"></span>';
    },
    
	slotBuildTitle: function(slot, error){
		if ( error === undefined)
			error = slot.canBuildErr();
		
		switch (error) { 
			case Slot.buildErr.ok: 
			case Slot.buildErr.needBonus: 
				if( !slot || slot.isEmpty() )
					return 'Строить';
				else
					return (wofh.events.isBldQueueEmpty() ? 'Улучшить до уровня' : 'В очередь улучшение до уровня') + ' ' + slot.getUp().getLevel();
			case Slot.buildErr.off: return 'Нельзя улучшить, строение выключено';
			case Slot.buildErr.max: return 'Нельзя улучшить, это максимально доступный уровень здания';
			case Slot.buildErr.res: return slot.getLevel() == 1? 'Недостаточно ресурсов': 'Недостаточно ресурсов для строительства';
			case Slot.buildErr.work: return 'Нельзя улучшить, здание работает';
			case Slot.buildErr.money: return 'Нельзя улучшить, деньги не изобретены';
			case Slot.buildErr.queue: return 'Очередь строительства заполнена';
		}
	},
	
	slotDestroyButton: function(slot){
        var btn = snip.slotDestroyIcon(slot);
        if (!btn) return '';
        return '<a class="buttonBuildSlot js-slotbld-destroy">'+btn+'</a>';
	},
    
	slotDestroyIcon: function(slot){
		switch (slot.canDestroyErr()) {
			case Slot.buildErr.ok: return '<span class="buttonBuildSlot-icon -type-down -act-ok" data-title="Снести"></span>';
			case Slot.buildErr.work: return '<span class="buttonBuildSlot-icon -type-down -act-no" data-title="Нельзя снести, здание работает"></span>';
			case Slot.buildErr.queue: return '<span class="buttonBuildSlot-icon -type-down -act-wait" data-title="Очередь строительства заполнена"></span>';
			case Slot.buildErr.wonder: return '';
			case Slot.buildErr.questBuildDestroy: return '';
		}
    },
    
	slotSwapButton: function(slot){
        var btn = snip.slotSwapIcon(slot);
        
		if (!btn) return '';
		
        return '<a class="buttonBuildSlot js-slotbld-swap" data-title="Переместить">'+btn+'</a>';
	},
    
	slotSwapIcon: function(slot){
		switch ( slot.canSwapErr() ) {
			case Slot.buildErr.ok: return '<span class="buttonBuildSlot-icon -type-swap -act-ok" data-title=""></span>';
		}
    },
	
	slotRebuildButton: function(slot){
        var btn = snip.slotRebuildIcon(slot);
        if (!btn) return '';
        return '<a class="buttonBuildSlot js-slotbld-rebuild">'+btn+'</a>';
	},
    
	slotRebuildIcon: function(slot){
		switch (slot.canRebuildErr()) {
            case Slot.buildErr.empty: return '';
            case Slot.buildErr.max: return '';
            case Slot.buildErr.maxCount: return '';
			
			case Slot.buildErr.work: return '<span class="buttonBuildSlot-icon -type-rebuild -act-no" data-title="Нельзя перестроить, здание работает"></span>';
			case Slot.buildErr.queue: return '<span class="buttonBuildSlot-icon -type-rebuild -act-no" data-title="Очередь строительства заполнена"></span>';
			case Slot.buildErr.building: return '<span class="buttonBuildSlot-icon -type-rebuild -act-no" data-title="Нельзя перестроить, здание строится"></span>';
			case Slot.buildErr.ok: return '<span class="buttonBuildSlot-icon -type-rebuild -act-ok" data-title="Перестроить"></span>';
			case Slot.buildErr.money: return '<span class="buttonBuildSlot-icon -type-rebuild -act-no" data-title="Нельзя перестроить, деньги не изобретены"></span>';
			case Slot.buildErr.res: return '<span class="buttonBuildSlot-icon -type-rebuild -act-no" data-title="Недостаточно ресурсов для перестройки"></span>';
		}
	},
	
	buildImgPath: function(slot, opt) {
		opt = opt||{};
		opt.grey = opt.grey||false;
		
		if( opt.checkActions === undefined ) opt.checkActions = true;

		return ' style="background-image: url(https://test.waysofhistory.com/img/buildings2/'+slot.getId()+'_'+slot.getLevelPic(opt.checkActions)+(opt.grey? '-gray':'')+'.png)" ';
	},
    
    slotEffect: function(slot) {
        var effect = slot.getEffect({pureEffect: true});
		
        switch (slot.getType()) {
            case Build.type.wonder:
                return '';
            case Build.type.production:
                return snip.pop(utils.toInt(effect));
            case Build.type.train:
            case Build.type.productionbase:
            case Build.type.watertradespeed:
            case Build.type.waterarmyspeed:
            case Build.type.airarmyspeed:
                return utils.toPercent(effect) + '%';
            case Build.type.prodBoost: 
                return utils.toPercent(effect, 1) + '%';
            case Build.type.corruption:
                return snip.fixedHint(effect);
            case Build.type.ecology:
                return utils.toInt(effect);
            case Build.type.hide:
            case Build.type.store:
            case Build.type.culture:
            case Build.type.trade:
            case Build.type.embassy:
            case Build.type.airdef:
                return utils.toInt(effect);
            case Build.type.defence:
                return snip.pop(slot.getTrapDamage(effect));
            case Build.type.grown:
                return snip.fixedHint(effect * 24);
            case Build.type.administration:
                return utils.toInt(slot.getAdminCultEffect(effect)) + ' ' + utils.formatNum(1 - 1 / (1 + effect), {toPercent: true, uFixed: 1}) + '%';
            case Build.type.fake:
				return utils.formatNum(effect, {int: true, stages: true});
			default:
                return '';
        }
    },
    
	slotWonder: function(slot, opt){
		opt = opt||{};
		
		var html = '',
			href = opt.noHref ? '' : 'href="'+hashMgr.getWndHref('buildinfo', slot.getId())+'"';
		
		html += '<a class="-snip-wonder '+(opt.cls||'')+'" '+href+' '+utils.makeDataAttrStr(opt.attrs)+'>';
		
		if( !opt.noIcon )
			html += '<div class="build_icon_s ' + (opt.sw ? 'build_icon_sw' : 'build_icon_sm') + '" '+snip.buildImgPath(slot, {checkActions: false, grey: opt.grey})+'></div>';
			
		if( !opt.noText ){
			if( !opt.noIcon )
				html += '<br>';
			
			html += '<span>'+(opt.text||slot.getName())+'</span>';
		}
			
		html += '</a>';
		
		return html;
	},
	
    wonderIcon: function(active){//можно передавать слот
        if (active instanceof Slot) {
            active = active.isActive();
        }
        return '<span class="iconWonder '+(active? '-active': '')+'"></span>';
    },
	
	/************
	 ** науки **
	 ************/
	 
	scienceImgData: function(a)/*(science), (scienceId)*/{
		var science = Science.getObj(a);
		
		if(science.getId() >= 1000) {
			var imgId = -2;
			var imgName = 'Объединение';
		} else if (science.isEmpty()) {
			var imgId = 999;
			var imgName = 'Наука не выбрана';
		} else if (science.isDebt()) {
			var imgId = Science.no;
			var imgName = science.getName();
		}
		else {
			var imgId = science.getId();
			var imgName = /*'Изучается наука '+*/science.getName();
		}
        
        return {id: imgId, name: imgName};
    },
    
	scienceImg: function(science)/*(science), (scienceId)*/{
		science = snip.scienceImgData(science);
		
		return '<div class="scienceImg" style="background-image: url(https://test.waysofhistory.com/img/help/sciences/'+science.id+'-.png)" data-title="'+science.name+'"></div>';
	},
    
    //для наведения в новом городе
	scienceImgHover: function(science)/*(science), (scienceId)*/{
		science = snip.scienceImgData(science);
		
		return '<div class="scienceImg" style="background-image: url(https://test.waysofhistory.com/img/help/sciences/'+science.id+'-.png), url(https://test.waysofhistory.com/img/help/sciences/'+science.id+'-.png)" data-title="'+science.name+'"></div>';
	},
    
	//для наведения в новом городе на большие кнопки
	scienceImgHoverBig: function(science)/*(science), (scienceId)*/{
		science = snip.scienceImgData(science);
		
		return '<span class="mmenu-btnBig-type-science-img" style="background: url(https://test.waysofhistory.com/img/help/sciences/'+science.id+'.png)" data-title="'+science.name+'"></span>';
	},
	
	scienceImgBig: function(science)/*(science), (scienceId)*/{
		science = snip.scienceImgData(science);
        
        return '<div class="scienceImgBig" style="background-image: url(https://test.waysofhistory.com/img/help/sciences/'+science.id+'.png)" data-title="'+science.name+'"></div>';
    },
        
    scienceIcon: function(text){
        if (text) return snip.nobr(snip.scienceIcon() + text);
        return '<img class="event es" src="https://test.waysofhistory.com/img/_.gif">';
    },
    
	science: function(sci){
        var science = Science.getObj(sci);
		
        if( !science.isEmpty() )
            return snip.nobr(snip.scienceIcon()+science.getName(), '', '-snip-sci');
	},
    
	scienceLink: function(sci, opt){
		var science = Science.getObj(sci);
        if (science.isEmpty()) return '';//snip.science(science);

		opt = opt||{};

        opt.text = opt.text||science.getName();
        if (opt.lenLim){
			opt.noHint = true;
        	opt.text = snip.lenlim(opt.text, opt);
        }
        var color = '';
        if( opt.highlight ){
            color = 'clr';
            
            var known = science.getKnown(opt.byCountry, opt.ignoreParent);
            
            if( known == Science.known.unavail )
                color += '0';
            else if( known == Science.known.avail )
                color += '1';
            else
                color += '2';
        }
            
        return '<a class="' + color + ' link -nobr -snip-sci" href="'+HashMgr.getHref('#/scienceinfo/'+science.getId())+'">'+snip.scienceIcon()+opt.text+'</a>';
    },
    
	scienceImgNameLink: function(sci){
		//var science = Science.getObj(sci);
        return snip.nobr(snip.scienceImg(sci) + ' ' + snip.science(sci));
	},
	
	scienceBonus: function(type, value){
        var level = value * lib.science.bonus[type];

        switch (+type) {
            case Science.bonus.grown:
                return 'Рост населения +' + utils.toInt(level * 24);
            case Science.bonus.culture:
                return 'Культура +' + level;
            case Science.bonus.income:
                return 'Доход +' + utils.toPercent(level) + '%';
            case Science.bonus.knowledge:
                return 'Улучшение научного распределения';
            case Science.bonus.war:
                return 'Война +' + utils.toInt(level + Appl.C_EPSILON) + '% эффективности';
            case Science.bonus.production:
                return 'Производство +' + utils.toPercent(level) + '%';
            case Science.bonus.view:
                return 'Радиус обзора +' + utils.toInt(level + Appl.C_EPSILON);
            case Science.bonus.store:
                return 'Вместимость хранилища +' + utils.toInt(level + Appl.C_EPSILON) + ' ед.';
            case Science.bonus.trader:
                return 'Торговцы +' + utils.toInt(level + Appl.C_EPSILON);
            case Science.bonus.fish:
                return 'Добыча рыбы в каждом морском городе +' + utils.toPercent(level) + '%';
            case Science.bonus.stone:
                return 'Добыча гранита в каждом городе на холмах +' + utils.toPercent(level) + '%';
            case Science.bonus.iron:
                return 'Добыча металла в каждом городе +' + utils.toPercent(level) + '%';
        }
    },

	scienceAbility: function(abilityId){
        switch (+abilityId) {
            case Science.ability.openMap: return 'Полная видимость карты';
            case Science.ability.money: return 'Новая экономическая система';
            case Science.ability.noBarter: return 'Устаревание бартерной торговли';
            case Science.ability.roadDirt: return 'Строительство грунтовых дорог';
            case Science.ability.roadHighway: return 'Строительство шоссе';
            case Science.ability.roadRailway: return 'Строительство железной дороги';
            case Science.ability.roadMaglev: return 'Строительство маглев дороги';
			case Science.ability.roadTunnel: return 'Строительство тоннеля';
			
            case Science.ability.fish: return 'Возможна добыча рыбы';
            case Science.ability.cloth: return 'Возможно производство одежды';
            case Science.ability.longTrade: return 'Нет ограничения дальности торговли';

            case Science.ability.tactics: return 'Координация боя';
        }
	},

	scienceIcons: function(science, opt){
		opt = opt||{};

		var text = '';

		//строения
		if ( opt.builds && !science.builds.isEmpty() ){
			text += snip.icon(snip.c.bonusScience, 'build');
		}
		
		//юниты
		if ( opt.units && !science.units.isEmpty() ) {
			if( !science.units.clone().getBattleUnits().isEmpty() )
				text += snip.icon(snip.c.bonusScience, 'unit');
			else if ( !science.units.clone().getPeacefulUnits().isEmpty() )
				text += snip.icon(snip.c.bonusScience, 'unitPeace');
		}

		//местород
		if (science.deposits.length) {
			var hint = 'Открывает месторождения: ' + snip.list(science.deposits, function(deposit){return deposit.getName();});
			text += snip.icon(snip.c.anyIcon, 'deposit', hint);
		}

		//бонусы
		for (var bonusId in science.bonuses){
			var bonusVal = science.bonuses[bonusId];
			text += snip.icon(snip.c.bonusScience, utils.cnstName(Science.bonus, bonusId), snip.scienceBonus(bonusId, bonusVal));
		}

		//улучшения на карте
		if (science.envs.length){
			text += snip.icon(snip.c.anyIcon, 'mapImp');
		}

		//абилки
		for (var abilityId in science.abilities) {
			var abilityVal = science.abilities[abilityId];
			switch (+abilityId) {
				case Science.ability.fish:
					text += snip.resEffect(Resource.ids.fish);
					break;
				case Science.ability.cloth:
					text += snip.resEffect(Resource.ids.cloth);
					break;
				case Science.ability.roadDirt:
				case Science.ability.roadHighway:
				case Science.ability.roadRailway:
				case Science.ability.roadMaglev:
				case Science.ability.roadTunnel:
					text += snip.icon(snip.c.anyIcon, 'mapImp', 'Строительство дороги');
					break;
				default:
					text += snip.icon(snip.c.anyIcon, 'cap');
			}
		}
		
		//топливо
		if (science.fuel) {
			text += snip.icon(snip.c.anyIcon, 'fuel');
		}
		
		// Специалист (ВГ)
		if ( science.specialistList.getLength() ) {
			text += snip.icon(snip.c.anyIcon, 'specialist', 'Великий гражданин');
		}
		
		return text;
	},
	
	specialistEffectIcon: function(specialist, text){
		var icon = '';
		switch(specialist.getId()){
			case Specialist.ids.science: icon = snip.resProdtypeIcon(Resource.prodtypes.science); break;
			case Specialist.ids.production: icon = snip.resProdtypeIcon(Resource.prodtypes.production); break;
			case Specialist.ids.food: icon = snip.resProdtypeIcon(Resource.prodtypes.food); break;
			case Specialist.ids.money: icon = snip.resProdtypeIcon(Resource.prodtypes.money); break;
			case Specialist.ids.war: icon = snip.icon(snip.c.bonusScience, 'war'); break;
			case Specialist.ids.culture: icon = snip.icon(snip.c.anyIcon, 'cult'); break;
			case Specialist.ids.grown: icon = snip.icon(snip.c.anyIcon, 'grow'); break;
		}
		
		return icon + (text||'');
	},
	
	specialistTooltip: function(specialist, text){
		return '<span class="js-tooltip" data-tooltip-wnd="specialist" data-id="' + specialist.getId() + '">' + text + '</span>';
	},
	
	/*************
	 ** рейтинг **
	 ************/
	
	ratePoint: function(point, type, title){
		var text = snip.ratePointIcon(type) + utils.formatNum(point||0, {int:true, stages:true});
		
		switch(type){
			case 'atk': title = 'Очки рейтинга атаки'; break;
			case 'def': title = 'Очки рейтинга защиты'; break;
			case 'science': title = 'Очки рейтинга получения знаний'; break;
			case 'prod': title = 'Очки рейтинга производства'; break;
		};
		
		if( title )
			text = snip.title(text, title + ' ' + utils.formatNum(point||0, {fixed: 3}));
		
		return snip.nobr(text);
	}, 
	
	ratePointIcon: function(type, title){
		if( type == 2 ) type = 'science';
		if( type == 3 ) type = 'prod';
		if( type == 4 ) type = 'atk';
		if( type == 5 ) type = 'def';
		
		title = title||'Очки рейтинга';
		
		var titles = {
            science: ' науки',
			prod: ' производства',
			atk: ' атаки',
			def: ' защиты',
        };
		
		title += titles[type];
		
		return '<span class="rate-pointIcon -type-'+type+'" data-title="'+title+'"></span>';
	},
	
	/************
	 ** иконки **
	 ************/
	
	luck: function(count, round){
		if (typeof(count) == 'undefined') return '<span class="iconLuck" data-title="Удача"></span>';
		else{
			count = (round) ? ~~count : count;
			return snip.nobr(snip.luck() + '' + count);
		}
	},
    
	luckBig: function(opt){
		opt = opt||{};
		
		var title = opt.noTitle ? '' : 'data-title="Удача"';
		
		return '<span class="iconLuckBig" ' + title + '></span>';
	},
	
	pop: function(count){
		if (typeof(count) == 'undefined') return '<span class="iconPop" data-title="Население"></span>';
		else return snip.nobr(snip.pop() + '' + (typeof(count) == 'number' ? utils.stages(count) : count));
	},
    
	death: function(count){
		if (typeof(count) == 'undefined') return '<span class="iconDeath" data-title="Население"></span>';
		else return snip.nobr(snip.death() + '' + (typeof(count) == 'number' ? utils.stages(count) : count));
	},
	
	trader: function(count){
		if (typeof(count) == 'undefined') return '<span class="iconTrader" data-title="Торговец"></span>';
		else return snip.nobr(snip.trader() + count);
	},
	
	tradeAlly: function(ally, opt){
		opt = opt||{};
		opt.cls = opt.cls||'';
		
		var accCount = ally.getAccountsCount(),
			text = snip.tradeUnion(ally.getName() + (!opt.noAccCount?' ('+accCount+')':''));
		
		if( opt.showOverflow ){
			var accOverflow = accCount - lib.tradeally.maxmembers;
			
			if( accOverflow > 0 ){
				text += ' ' + snip.alert('Количество участников в этом Торговом Союзе превышает допустимое на ' + snip.acc() + accOverflow + '.<br>Численность состава обновляется периодически');
				
				opt.cls += ' -snip-ally-ext -warn -type-red';
				
				text = snip.nobr(text, 'span', opt.cls);
			}
		}
		
		return text;
	},
	
	tradeAllyLink: function(ally, opt){
		opt = opt||{};
		opt.cls = opt.cls||'link';
		
		return '<a class="'+opt.cls+'">' + snip.tradeAlly(ally, opt.aOpt) + '</a>';
	},
	
	tradeUnion: function(name, title){
		if( name === undefined || name === false ){ 
			title = title ? 'data-title="'+title+'"' : '';
			
			return '<span class="icon_tradeUnion" ' + title + '></span>'; 
		}
		else 
			return snip.nobr(snip.tradeUnion(undefined, name) + name, 'span', '-snip-ally');
	},
	
	tradeUnionCountry: function(country){
		country = country||wofh.country;
		if( country )
			return '<span class="iconTradeUnionCountry" data-title="Находишься в этом торговом союзе в составе ' + utils.escapeHtml(snip.country(country)) + '"></span>';
		else
			return;
	},
	
	allyIcon: function(ally, text){
		return '<span class="icon_tradeUnion" data-title="' + (text||(ally||{}).name||'') + '"></span>';
		
	},
	
	ally: function(ally, text){
		return snip.wrp('-nobr -sel', snip.allyIcon(ally, text) + (text||ally.name));
	},
	
	cult: function(count){
		if (typeof(count) != 'undefined'){
			return snip.nobr(snip.cult() + ' ' + count);
		} else {
			return '<span class="iconCult" data-title="Культурные ресурсы"></span>';
		}
	},
    
    cultEffect: function(){
		return snip.icon(snip.c.anyIcon, 'cult');
	},
	
	grow: function(){
		return '<span class="iconGrow" data-title="Демографические ресурсы"></span>';
	},
	
    growEffect: function(){
		return snip.icon(snip.c.anyIcon, 'grow');
	},
	
    deposit: function(deposit, effectIcon){
        if (typeof(deposit) == 'undefined') 
			return effectIcon ? snip.icon(snip.c.anyIcon, 'deposit') : '<span class="iconDeposit"></span>';
			
        deposit = Deposit.getObj(deposit);
		
        return snip.nobr(snip.deposit(undefined, effectIcon) + snip.wrp('-snip-textDep', deposit.getName()), 'span', '-snip-dep');
    },
    
    depositLink: function(deposit, text, effectIcon, climateIcon){
        deposit = Deposit.getObj(deposit);
        
        var icon = '';
        
        if( climateIcon )
            icon += snip.depositClimateIcon(deposit);
        
        icon += snip.deposit(undefined, effectIcon);
        
        text = icon + snip.wrp('-snip-textDep', text||deposit.getName());
        
        return snip.link(HashMgr.getHref('#/help/'+(deposit.isUndefined()?'getDeposit':'deposit')), text, '-nobr -snip-dep');
    },
    
    depositRes: function(deposit){
        deposit = Deposit.getObj(deposit);
        var text = '';
        var resList = deposit.getRes();
        for (var res in resList.getList()){
            res = resList.getElemByPos(res);
            text += snip.nobr(snip.resBig(res) + ' ' + res.getName() + ' — ' + Math.round(100 * res.count)+'%')+' ';
        }
        return text;
    },
	
	depositClimateIcon: function(deposit){
        deposit = Deposit.getObj(deposit);
        
		var title = 'Климат колонии — ' + Tile.climate[deposit.getClimate()].title;
		
        return '<span class="map-climateIcon -type-clim' + deposit.climate + '" data-title="' + title + '"></span>';
    },
	
	time: function(count, title){
		count = count === undefined ? false : count;
		if ( count === false ){ 
			title = title ? 'data-title="' + title + '"' : '';
			return '<span class="iconTime" ' + title + '></span>';
		}
		else return snip.nobr(snip.time(false, title) + ' ' + count);
	},
    
	time2: function(count){
		if (typeof(count) == 'undefined') return '<span class="iconTime2"></span>';
		else return snip.nobr(snip.time2() + ' ' + count);
	},
	
    hint: function(text, opt){
		opt = opt||{};
		
        return '<span class="helpIcon ' + (opt.cls||'') + '" data-title="' + utils.escapeHtml(text) + '"></span>';
	},
    
	hintGlag: function(text){
        return "<span class='helpIcon' title='"+ text +"'></span>";
	},
	
	sort: function(field, dir, cls){
		var active = dir === undefined ? '' : '-active';
        return "<span class='icsort js-sort " + active + " " + cls + "' data-dir='" + (~~dir) + "' data-field='" + field + "' data-title='Сортировать'></span>";
	},
	
    hintWrp: function(hint, cont){
        return '<span class="-snip-hint" data-title="' + utils.escapeHtml(hint) +'">'+cont+'</span>';
    },
    
	luckBonusIcon: function(luckBonus, text){
		var icon = '';
		
		switch(luckBonus.id){
			case LuckBonus.ids.science: icon = snip.resProdtypeIcon(Resource.prodtypes.science); break;
			case LuckBonus.ids.production: icon = snip.resProdtypeIcon(Resource.prodtypes.production); break;
			case LuckBonus.ids.war: icon = snip.icon(snip.c.bonusScience, 'war'); break;
			case LuckBonus.ids.culture: icon = snip.icon(snip.c.anyIcon, 'cult'); break;
			case LuckBonus.ids.grown: icon = snip.icon(snip.c.anyIcon, 'grow'); break;
			case LuckBonus.ids.traders: icon = snip.icon(snip.c.anyIcon, 'traders'); break;
		}
		
		return icon + (text||'');
	},
	
	tacticsIcon: function(){
		return '<span class="iconTactics"></span>';
	},
	
	capacityIcon: function(){
		return '<span class="iconCapacity"></span>';
	},
	
	optIcon: function(white){
		return '<span class="iconOpt ' + (white?'-type-white':'') + '"></span>';
	},
	
	filterIcon: function(){
		return '<span class="iconFilter"></span>';
	},
	
	sendIcon: function(){
		return '<span class="iconSend"></span>';
	},
	
    impIcon: function(){
		return '<span class="iconMapImp"></span>';
	},
    
    roadIcon: function(type){
		return '<span class="iconRoad -type-'+ (type||'def') +'"></span>';
	},
    
    bridgeIcon: function(){
		return '<span class="iconBidge"></span>';
	},
    
    commentsIcon: function(){
		return '<span class="iconComments"></span>';
	},
    
    icon: function(type, id, hint, text, cls){
		if (!text) {
            var icon = type[id];
			
			if( !icon )
				return '';
			
            hint = hint||icon.title;
            var title = hint ? 'data-title="' + hint + '"' : '';
			var clsPrefix = type.clsPrefix||'-type-';
			
            return '<span class="'+type.cls+' '+clsPrefix+icon.id+' '+(cls||'')+'" '+title+'></span>';
        } else {
            return snip.nobr(snip.icon(type, id, false, false, cls) + '' + text);
        }
    },
    
	tooltip: function(text, tooltipText, opt){
		opt = opt||{};
		opt.attrs = utils.copyProperties({'tooltip-wnd': 'text', 'tooltip-text': tooltipText}, opt.attrs);
		
		opt.attrs['tooltip-text'] = utils.escapeHtml(opt.attrs['tooltip-text']);
		opt.attrs['tooltip-label'] = utils.escapeHtml(opt.attrs['tooltip-label']||'');
		
		return snip.wrp('fakelink crH js-tooltip', text, false, opt.attrs);
	},
    
	fixedHint: function(num, optNumText, optNumHint, opt){
		optNumText = optNumText||{};
		optNumText.mixed = true;
		optNumText.uFixed = 1;
		
		optNumHint = optNumHint||{};
		optNumHint.mixed = true;
		optNumHint.fixStages = true;
		optNumHint.uFixed = 3;
		
		opt = opt||{};
		opt.formatFunc = opt.formatFunc||utils.formatNum;
		
		return snip.tooltip(opt.formatFunc(num, optNumText), opt.formatFunc(num, optNumHint), opt);
	},
	
	ruler: function(){
        return '<span class="iconRuler" data-title="Расстояние"></span>';
    },
	
	pathIcon: function(title){
		title = title === undefined ? 'Путь' : '';
		
		if( title )
			title = 'data-title="'+title+'"';
		
        return '<span class="pathIcon" '+title+'></span>';
    },
	
    //dir=true -входящая
    //type=1 - защита
    //branch из 
    eventIconArmy: function(type, dir, branch, subtype){        
        if (type == 0 || type == 'a') type = 'attack';
        if (type == 1 || type == 'd') type = 'defence';
        if (dir == 0 || dir == 'i') dir = 'incom';
        if (dir == 1 || dir == 'o') dir = 'outgo';
        
        var titles = {
            attack: {outgo:'Атака на врага', incom:'Нападение врага', operation: ['Военная операция нападения', 'Военная операция нападения страны']},
            defence: {outgo:'Исходящее подкрепление', incom:'Входящее подкрепление', operation: ['Военная операция по защите', 'Военная операция страны по защите']},
            reinf: 'Подкрепления',
        };
        
        var cls = '';
        
        var title = titles[type];
        if (typeof(title)=='object') title = title[dir];
        if (typeof(title)=='object') title = title[branch];
		if ( title ){
			if( dir == 'outgo' && subtype == 'noWork' )
				title += '. За исключением строительных работ';
		}
        title = title?'data-title="'+title+'"':'';
        
        if( dir ) cls += ' -type-'+dir;
        if( type ) cls += ' -type-'+type;
		if( subtype ) cls += ' -type-'+subtype;
		
        if (type == 'attack' || type == 'defence') {
            cls += ' -type-'+utils.cnstName(Army.types, branch||Army.types.land);
        }
        if (dir == 'operation' && branch) {
            cls += ' -type-country';
        }
        return '<span class="eventIcon '+cls+'" '+title+'></span>';
    },
	
	/***************
	 ** улучшение **
	 ***************/
        
    
    mapImpLevel: function(imp, opt){
        opt = opt||{};
        /*
         * icon = effect - иконка эффекта вместо стандартной
         * link = false - не делать ссылку на энциклопедию
         * lenlim = NUM - ширина, в которую нужно впихнуть имя (без иконки и уровня)
         */
        
        var icon;
        
        if( opt.icon == 'effect' )
            icon = snip.icon(snip.c.anyIcon, 'mapImp');
        else
            icon = snip.impIcon();
        
        var name = imp.getName();
        
        if( opt.lenlim )
            name = snip.lenlim(name, opt);
        
        var level = imp.getLevel() + ' ур.';
        
        if (opt.lenlim)
            level = snip.lenlim(level, opt);        
        
        var text = icon + ''+snip.wrp('-snip-textImp', name)+' '+snip.wrp('', level);
        
        if( opt.link === false )
            text = snip.nobr(text, false, '-snip-imp');
        else
            text = snip.link(HashMgr.getWndHref('help', 'env'), text, '-snip-imp');
            
        return text;
    },
	
	mapImpEffectIcon: function(imp, opt){
		opt = opt||{};
		
		switch(imp.getEffectType()){
			case MapImp.effectType.science:
				return snip.resProdtypeIcon(Resource.prodtypes.science);
			case MapImp.effectType.food:
				return snip.resProdtypeIcon(Resource.prodtypes.food);
			case MapImp.effectType.waterProd:
				return snip.resEffect(Resource.ids.fish)+snip.resEffect(Resource.ids.jewels);
			case MapImp.effectType.production:
				return snip.resProdtypeIcon(Resource.prodtypes.production);
			case MapImp.effectType.money:
				if( opt.useResIcon )
					return snip.res(Resource.ids.money);
				else
					return snip.resProdtypeIcon(Resource.prodtypes.money);
			case MapImp.effectType.grow: 
				return snip.growEffect();
			case MapImp.effectType.culture: 
				return snip.cultEffect();
			default:
				return '';
				
		}
	},
	
	mapImpEffect: function(imp, users, opt){
		opt = opt||{};
		
		if (imp.getEffectType() == MapImp.effectType.watercross) return '';
		
		var effect = imp.calcRealEffect(users),
			text = '';
		
		if( !opt.noEffectIcon ){
			text += snip.mapImpEffectIcon(imp, {useResIcon:!imp.isEffectGetTypePercent()});
		}
		
		text += snip.mapImpEffectValue(imp, {effect:effect, fnOpt:{fixed:1}});
		
        return snip.nobr(text, 'span', '-snip-impEffectVal');
    },
    
	mapImpEffectValue: function(imp, opt){
		opt = opt||{};
		opt.fnOpt = opt.fnOpt||{};
		opt.fnOpt.servRound = true;
		opt.preFix = opt.preFix||'';
		opt.postFix = opt.postFix||'';
		opt.effect = opt.effect !== undefined ? opt.effect : imp.getEffect();
		
        var text = '';
		
		if( imp.isEffectGetTypePercent() ){
			opt.fnOpt.toPercent = true;
			
			if( !opt.noPostFix )
				opt.postFix += '%';
		}
		else
			opt.fnOpt.int = true;
		
		text += utils.formatNum(opt.effect, opt.fnOpt);
		
		return snip.wrp('-snip-impEffectVal', opt.preFix + text + opt.postFix);
    },
	
	mapImpEffectUngrown: function(imp, opt){
		opt = opt||{};
		opt.effect = opt.effect !== undefined ? opt.effect : imp.getEffect();
		
		return snip.icon(snip.c.anyIcon, 'ungrown', false, false, 'vaB') + snip.wrp('-warnBg -type-red', utils.formatNum(imp.calcEffectUngrown(opt.effect), {fixed:1}));
	},
	
	mapImpEffectProd: function(imp, opt){
		opt = opt||{};
		opt.effect = opt.effect !== undefined ? opt.effect : imp.getEffect();
		opt.postFix = opt.postFix||'';
		
		var formatOpt = {
			toPercent: true
		};
		
		if( opt.fixed )
			formatOpt.fixed = opt.fixed;
		else
			formatOpt.int = true;
		
		return snip.icon(snip.c.anyIcon, 'maxWorkers', 'Максимум работников в научных зданиях', false, 'vaB') + snip.wrp('-snip-impEffectProd', utils.formatNum(imp.calcEffectProd(opt.effect), formatOpt) + opt.postFix);
	},
	
	/*********************
	 ** оформление окна **
	 *********************/
	
	/************
	 ** таймер **
	 ************/
    
	timer: function(time, type, defTime, title, opt){
		opt = opt||{};
        
		title = title ? 'data-title="'+title+'"' : '';
		
		if( !defTime ){
            switch( type ){
                case 'dec':
                    defTime = timeMgr.fPeriod(time - timeMgr.getNow()); break;
                case 'inc':
                    defTime = timeMgr.fMoment(time + timeMgr.getNow()); break;
                case 'now':
                    defTime = timeMgr.fMoment(timeMgr.getNow());
            }
        }
		
        return '<span class="js-timer '+(opt.cls||'')+'" data-time="'+time+'" data-timertype="'+type+'" '+title+' '+(opt.notifs ? 'data-notifs="'+opt.notifs.join(',')+'"' : '')+ ' ' + utils.makeDataAttrStr(opt.attrs) + '>' + (defTime||'') + '</span>';
    },
	
	/************
	 ** разное **
	 ************/
    
    //табличная кнопка
	smplBtnTable: function(field, text, opt){
		opt = opt||{};
		
        return '<div class="js-colSort smplBtnTbl" data-field="'+field+'"><div class="smplBtnTbl-text">'+(text||'')+'</div><span class="smplBtnTbl-sort"></span></div>';
    },
	
    btnTable: function(field, text, hint){
        if (!text) text = '';
				
        return '<button class="js-colSort btnTbl '+(hint?'js-tooltip':'')+'" data-field="'+field+'" '+(hint?'data-tooltip-wnd="text" data-tooltip-text="'+hint+'"':'')+'><span class="btnTbl-back"></span><span class="btnTbl-left"></span><span class="btnTbl-right"></span><span class="btnTbl-text">'+text+'</span><br><span class="btnTbl-sort"></span></button>';
    },
	 
	button: function(type, opt){
		opt = opt||{};
		
		var tag = opt.tag||'div',
            tabindex = opt.tabindex === undefined ? '' : 'tabindex="' + opt.tabindex + '" ';
		
		return '<'+tag+' class="button'+(type||'1')+' -type-'+(opt.type||'')+' '+(opt.cls||'')+'" ' + tabindex + utils.makeDataAttrStr(opt.attrs)+'>' + (opt.text||'') + '</'+tag+'>'; 
	},
	
	buttonSmall: function(opt){
		return snip.button('2-small', opt);
	},
	
	list: function(arr, exportFunc, delimiter){
        if (!delimiter) delimiter = ', '
        if (!exportFunc) exportFunc = function(elem){return elem;}

        var text = '';
        var lastVal = '';
        for (var i in arr) {
            var val = exportFunc(arr[i], i);
            if (val != lastVal && (typeof(val) !='undefined')) {
                text += val + delimiter;
                lastVal = val;
            }
        }
        text = text.slice(0, -delimiter.length);
		return text;
	},

    distance: function(path, opt){
		opt = opt||{};
		
		var text = '';
		
		if( !path )
			return text;
		
		if( !opt.noRuler )
			text += snip.ruler();
		
		text += '<span class="distAir" data-title="' + utils.formatNum(path.air, {fixed: 3}) + '">'+Trade.roundDistance(path.air) + '</span>';
        
        if( opt.distOnly||opt.airOnly )
            return text;
        
        text += '&nbsp;';
		text += '<snip class="paths-wrp">';
        text += '(';
		text += '<span class="distLand" data-title="Путь по суше'+(path.land?' '+utils.formatNum(path.land, {fixed:3}):'')+'">' + (path.land? Trade.roundDistance(path.land): '-') + '</span>';
		text += '&nbsp;/&nbsp;';
		text += '<span class="distWater" data-title="Глубоководный путь'+(path.deepwater?' '+utils.formatNum(path.deepwater, {fixed:3}):'')+'">' + (path.deepwater? Trade.roundDistance(path.deepwater): '-') + '</span>';
		if (path.water) {
			text += '&nbsp/&nbsp;';
			text += '<span class="distWater" data-title="Путь по мелководью'+(path.water?' '+utils.formatNum(path.water, {fixed:3}):'')+'">' + Trade.roundDistance(path.water) + '</span>';
		}
        text += ')';
		text += '</snip>';

		return text;
    },
	
	distPath: function(dist, path, opt){
		opt = opt||{};
		
		if( dist === undefined )
			return '?';
		
		var text = '';
		
		text += '<span class="distAir" data-title="' + utils.formatNum(dist, {fixed:3}) + '">'+Trade.roundDistance(dist) + '</span>&nbsp;';
		
		if( path !== undefined ){
			text += opt.sep||'';
			
			text += '(';
			text += '<snip class="paths-wrp">';
			text += '<span class="distLand" data-title="Оптимальный путь  '+utils.formatNum(path, {fixed:3})+'">'+Trade.roundDistance(path)+'</span>';
			text += '</snip>';
			text += ')';
		}
		
		return text;
    },
	
	roads: function(tile, cls){
    	var text = '';
		
		if( Tile.hasRoad(tile) ){
			var sortedRoads = utils.clone(Tile.getRealRoads(tile)).sort(function(a, b){return b-a;}),
				roads = {};
			
			text += '<div class="'+(cls||'')+'">';
			
			for( var road in sortedRoads ){
				road = sortedRoads[road];
				if( road > 1 && !roads[road] ){
					road = roads[road] = new Road(road-1);
					text += '<div>' + snip.impIcon() + road.getName() + '</div>';
				}
			}
			
			text += '</div>';
		}
		
		return text;
    },
	
	nobr: function(text, tag, cls){
		return snip.wrp('-nobr ' + (cls||''), text, tag||'div');
	},
    
	br: function(){
		return '<div class="br"></div>';
	},
	
	lenlim: function(text, opt){
		opt = opt||{};
		
		var lenLim = opt.lenLim,
			cls = opt.cls||'',
			postFix,
			style = '';
		
		if( typeof(lenLim) == 'string' ){
			if( lenLim[0] == '-' )
				cls += ' ' + lenLim;
			else if( lenLim[lenLim.length-1] == '%' )
				postFix = '%';
		}
		else
			postFix = 'px';
		
		if( postFix )
			style = 'style="max-width:' + lenLim + postFix + '"';
		
		return '<span class="-lenLim ' + (opt.noHint ? '-noHint ' : '') + cls + '" ' + style + '>' + text+ '</span>';
    },
    
    defVal: function(text, val, def, cls, defCls){
		if ( defCls === undefined ) defCls = '-defVal';
        if ( val === undefined ) val = text;
        if ( def === undefined ) def = 0;
        return  snip.wrp( val == def ? defCls : cls||'', text);
    },
    
	wrp: function(cls, text, tag, attrs){
        tag = tag||'span';
		
		cls = cls ? 'class="'+cls+'"' : '';
		
		return '<'+tag+' '+cls+' '+utils.makeDataAttrStr(attrs)+'>'+(text||'')+'</'+tag+'>';
	},
	
	link: function(href, text, cls, opt){
		opt = opt||{};
		
		href = href?'href="'+href+'"':'';
		
		cls = cls||'';
		if( !opt.noLink )
			cls += ' link';
		cls = cls?'class="'+cls+'"':'';
		
		opt.data = opt.data||'';
		
		return '<a '+href+' '+cls+' '+opt.data+'>'+text+'</a>';
	},
	
	getFakelinkCls: function(){
		return 'fakelink';
	},
	
    getSliderTypeCls: function(type){
		return '-type-' + type;
	},
    
	wndLink: function(name, params, text, cls, opt){
		return snip.link(hashMgr.getWndHref(name, params), text, cls, opt);
	},
	
	sign: function(num, KMNum) {
		return (num > 0? '+': '') + (KMNum ? KMNum : num);
	},
	
	smile: function(smile, code, cls){
        //data-title="'+(smile.title||smile.names[0])+'"
		return '<img class="smile -type-'+cls+' -id-'+code+'"  data-type="'+cls+'" data-id="'+code+'" src="https://test.waysofhistory.com/img/_.gif" >';
	},
	
	referalLink: function(){
		return location.protocol + '//' + lib.main.maindomain + '/ref?id=' + wofh.account.globalid + '&key=' + wofh.account.globalidkey;
	},
	
	linkClose: function(){
		return '</a>';
	},
	
	crown: function(title){
		title = title ? "data-title=" + title + '"' : '';
		return '<span class="iconCrown" ' + title + ' ></span>';
	},
    /*
    shopLink: function(){
        return 'href="shop?account='+wofh.account.id+'&name='+wofh.account.name+'&email='+wofh.account.email+'&key=[ключ]"';
    },*/

    chatUser: function(status, cont){
    	if (status == ChatMgr.userStatus.user) {
    		var title = '';
    	} else {
    		var title = status == ChatMgr.userStatus.admin? 'Повелитель этого чата': 'Надсмотрщик в этом чате';	
    		title = ' data-title="' + title + '"';
    	}
		var cls = utils.cnstName(ChatMgr.userStatus, status);
		var icon = '<span class="chat-userIcon -type-' + cls + '" ' + title + '></span>';
		var text = cont? snip.nobr(icon+cont): icon;
		return text;
    },
    
	pediaLink: function(page, text, opt) {
		opt = opt||{};
		
		page = page||'faq';
		text = text||'Энциклопедия';
		
		if( opt.showIcon )
			text = snip.nobr(snip.pediaIcon({cls:'mr05'}) + text);
		
		return snip.link(HashMgr.getHref('#/help/' + page), text);
	},
	
	pediaIcon: function(opt) {
		opt = opt||{};
		
		return snip.wrp('iconPedia -type-compact ' + (opt.cls||''));
	},
	
	pediaLinkBtn: function(page, cls) {
		page = page||'faq';
		return '<a class="button4 '+(cls||'')+'" href="'+HashMgr.getHref('#/help/' + page) + '">' + snip.icon(snip.c.smenu, 'hlp') + '</a>';
	},
	
    warn: function(text, warn){
        return '<span class="-warn -type-'+utils.cnstName(snip.c.warn, warn)+'">'+text+'</span>';
    },
    
    warnBg: function(text, warn){
        return '<span class="-warnBg -type-' + utils.cnstName(snip.c.warn, warn) + '">'+text+'</span>';
    },
    
    title: function(text, title, cls, opt){
		opt = opt||{};
		opt.tag = opt.tag||'span';
		
		if( opt.escape )
			title = utils.escapeHtml(title);
		
        return '<'+opt.tag+' class="'+ (cls||'') +'" data-title="'+title+'">'+text+'</'+opt.tag+'>';
    },
	
	//одиночная иконка по ид
	postIcon: function(postId){
		var post = Country.posts[postId];
        return '<img class="iconPost -type-' + postId + '" src="https://test.waysofhistory.com/img/_.gif" data-title="' + post.title + '">';
	},

	//список иконок в битовой маске
	postsIcon: function(power){
		var icons = '';
		
        for (var postId in Country.posts) {
            if (power & (1<<postId)) {
                icons += snip.postIcon(postId);
            }
        }
		
		return icons;
	},
	
	postsName: function(power){
		var names = [];
		
        for (var post in Country.posts) {
        	post = Country.posts[post];
            if (power & (1<<post.id)) {
                names.push(post.name);
            }
        }
		
		return snip.list(names);
	},
    
    alert: function(hint, opt){
		opt = opt||{};
		opt.cls = opt.cls||'';
		
        hint = hint? 'data-title="'+utils.escapeHtml(hint)+'"': '';
        
		if( opt.blink )
			opt.cls += ' -anim-blink2';
		
		return '<span class="iconAlert '+(opt.cls||'')+'" '+hint+'></span>';
    },
    
	
	
    colorRGB: function(color){
        return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    },
	
	clipboardWrp: function(text, short){
		return '<div class="clipboard-wrp js-clipboard-wrp ' + (short?'-short':'') + '">' + (text||'') + '</div>';
	},
	
	clipboardComplite: function(err){
		return '<span class="loader-container-icon-small -clipboard ' + (err ? '-err' : '') + '"></span>';
	},
	
	// Формирует ссылку на бой
	getBattleLink: function(opt) {
		var link = appl.cnst.protocol + '//' + (opt.domain||lib.war.battledomain) + '/',
			params = {lang: wofh.account.language||debug.getLang()};
		
		if( opt.simulation ){
			link += 'simulator.html?';
			
			params.simulation = opt.simulation;
			params.replay = (new Date()).getTime();
			params.project = 'wofh1_4';
			params.domain = lib.main.domain;
		}
		else if( opt.session ){
			link += 'game.html?';
			
			params.project = 'wofh1_4';
			params.session = opt.session;
			params.secret = opt.secret;
			params.dump = 1;
		}
		else if( opt.replay ){
			link += 'game.html?';
			
			params.project = 'wofh1_4';
			params.replay = opt.replay;
		}
		else
			return;
		
		if( opt.town ) params.town = opt.town;
		
		return link += utils.objToUrl(params);
	},
	
	// Фильтр ресов
	filterResChange: function($tag, notChange){
		if( $tag.is('.disabled') ) return;
		
		var res = new Resource($tag.data('res')),
			$filter = $tag.closest('.js-resFilter'),
			$wraper = $tag.closest('.js-resFilter-block');
		
		$filter.find('.js-resb').removeClass('-active');
		
		$tag.addClass('-active');
		
		if (res.getId() == ResList.filter.resType.all)
			$filter.removeClass('-active');
		else {
			$filter.addClass('-active');
			
			if( res.getId() == ResList.filter.resType.grown || res.getId() == ResList.filter.resType.cult){
				var resType;
				
				if( res.getId() == ResList.filter.resType.grown )
					resType = Resource.types.grown;
				else
					resType = Resource.types.culture;
				
				$filter.find('.js-resb[data-type='+resType+']').addClass('-active');
			}
		}
		
		$wraper.find('.js-resFilterVal').val(res.getId()).trigger('change', [notChange]);
		
		return res.getId();
	},
	
	filterResInlineChange: function($tag){
		if( $tag.is('.disabled') ) return;
		
		$tag.toggleClass('-active');
	},
	
	buildParams: function(slot, up, short){
		var arr = [],
			effect,
			slotUp = up && slot.canUp(),
            slotTown = slot.getTown(wofh.town);
		
		if( !up && !slot.getRaces().hasAll() ){
			effect = '';
			
			effect += snip.list(slot.getRaces().getList(), function(race){return ' ' + snip.raceName(race, {colored:(wofh.account||{}).race});});
			
			arr.push({
				icon: 'race',
				effect: effect
			});	
		}
		
		switch (slot.getType()) {
			case Build.type.wonder: 
				var radius = slot.getWonderRadius();
				
				arr.push({
					title: 'Конкурирующее расстояние '+snip.hint('Расстояние, в пределах которого не должно быть активированного такого же Чуда Света'),
					icon: 'distance',
					effect: radius == 0? 'Весь мир': radius,
				});
				
				arr.push({
					title: 'Эффект',
					icon: 'effect',
					effect: snip.wonderParams({slot: slot, up: up}),
				});
				
				break; 

			case Build.type.train: 
				effect = Math.round(utils.toPercent(slot.getEffect()))+' %';
				if (slotUp) {
					effect += ' '+snip.buildParamsEffect(Math.round(utils.toPercent(slot.getEffectUp())) + '%');
				}

				arr.push({
					icon: 'trainSpeed',
					effect: effect,
				});

				break; 

			case Build.type.embassy: 
				effect = utils.toInt(slot.getEffect())+ ' <span> очков</span>';
				
				if (slotUp) {
					effect += ' ' + snip.buildParamsEffect(slot.getEffectUpInt());
				}

				arr.push({
					icon: 'diplomacyPoints',
					effect: effect,
				});

				break; 

			case Build.type.store: 
				effect = utils.toInt(slot.getEffect());
				
				if( slotUp )
					effect += ' '+snip.buildParamsEffect(slot.getEffectUpInt());
                
				arr.push({
					icon: 'slotCapacity',
					effect: effect,
				});
                
				break;
			case Build.type.hide: 
				effect = utils.toInt(slot.getEffect()) + '<span> ед. каждого ресурса</span>';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toInt(slot.getEffectUp()));

				arr.push({
					title: 'Вместимость ',
					icon: 'slotCapacity',
					effect: effect,
				});

				break;

			case Build.type.grown:
				effect = snip.pop(snip.fixedHint(slot.getEffect() * timeMgr.DtH)) + '<span> в день</span>';
				
				if( slotUp )
					effect += ' '+snip.buildParamsEffect(snip.fixedHint(slot.getEffectUp() * timeMgr.DtH));

				arr.push({
					title: 'Прирост населения',
					iconText: snip.growEffect(),
					effect: effect
				});

				var mult = slotTown ? slotTown.calcGrownMult() : 1;
				
				if( mult != 1 ){
					effect = snip.pop(snip.fixedHint(slot.getEffect() * mult * timeMgr.DtH)) + '<span> в день</span>';
					
					if( slotUp )
						effect += ' ' + snip.buildParamsEffect(snip.fixedHint(slot.getEffectUp() * mult * timeMgr.DtH));
                    
					arr.push({
						title: 'С модификациями',
						iconText: snip.growEffect(),
						effect: effect
					});
				}
				
				break; 

			case Build.type.culture: 
				effect = snip.fixedHint(slot.getEffect());
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(snip.fixedHint(slot.getEffectUp()));
				
				arr.push({
					title: 'Культура',
					iconText: snip.cultEffect(),
					effect: effect
				});

				var mult = slotTown ? slotTown.calcCultMult() : 1;
				
				if( mult != 1 ){
					effect = snip.fixedHint(slot.getEffect() * mult);
					
					if( slotUp )
						effect += ' ' + snip.buildParamsEffect(snip.fixedHint(slot.getEffectUp() * mult));
					
					arr.push({
						title: 'С модификациями',
						iconText: snip.cultEffect(),
						effect: effect
					});
				}

				break; 
				
			case Build.type.administration: 
				/*культура*/
				effect = utils.toInt(slot.getAdminCultEffect());
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(snip.fixedHint(slot.getAdminCultEffectUp()));

				arr.push({
					title: 'Культура',
					iconText: snip.cultEffect(),
					effect: effect
				});

				/*культура с модификаторами*/
				var mult = slotTown ? slotTown.calcCultMult() : 1;
				
				if( mult != 1 ){
					effect = utils.toInt(slot.getAdminCultEffect() * mult);
					
					if( slotUp )
						effect += ' '+snip.buildParamsEffect(snip.fixedHint(slot.getAdminCultEffectUp() * mult));

					arr.push({
						title: 'С модификациями',
						iconText: snip.cultEffect(),
						effect: effect
					});
				}
				
				/*экономия*/
				
				effect = utils.toPercent(slot.getAdminEconEffect(), 1) + '%';
                
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toPercent(slot.getAdminEconEffectUp(), 1) + '%');
                
				arr.push({
					icon: 'economy',
					effect: effect,
				});
                
				if( up ) {
					/*сумма экономии*/
                    
					effect = snip.resCount(Resource.ids.money, utils.toInt(slot.getAdminMoneyEffect())) + '<span> в час</span>';
                    
					if( slotUp )
						effect += ' ' + snip.buildParamsEffect(utils.toInt(slot.getAdminMoneyEffectUp()));
                    
					arr.push({
						title: '',
						icon: 'economy',
						effect: effect,
					});
				}
				
				break; 
				
			case Build.type.trade:
				effect = utils.toInt(slot.getEffect()) + '<span> шт.</span>';
                
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toInt(slot.getEffectUpInt()));

				arr.push({
					icon: 'traders',
					effect: effect
				});

				break;

			case Build.type.watertradespeed: 
				effect = utils.toPercent(slot.getEffect()) + '%';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toPercent(slot.getEffectUp()) + '%');

				arr.push({
					icon: 'waterTradeSpeed',
					effect: effect
				});

				break; 

			case Build.type.waterarmyspeed: 
				effect = utils.toPercent(slot.getEffect()) + '%';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toPercent(slot.getEffectUp()) + '%');
                
				arr.push({
					icon: 'waterArmySpeed',
					effect: effect
				});

				break;

			case Build.type.airarmyspeed: 
				effect = utils.toPercent(slot.getEffect()) + '%';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toPercent(slot.getEffectUp()) + '%');

				arr.push({
					icon: 'airArmySpeed',
					effect: effect
				});

				break; 

			case Build.type.corruption: 
				effect = '<span>в </span>' + snip.fixedHint(slot.getEffect()) + '<span> раз</span>';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(snip.fixedHint(slot.getEffectUp()));

				arr.push({
					icon: 'corruption',
					effect: effect
				});

				break;

			case Build.type.ecology: 
				effect = '<span>на </span>' + utils.toPercent(slot.getEffect()) + '<span> в день</span>';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(utils.toPercent(slot.getEffectUp()));

				arr.push({
					icon: 'ecology',
					effect: effect
				});

				break; 

			case Build.type.production: 
				if( up ) {
					effect = utils.toInt(slot.getEffect({noMapImp: true}));
                    
                    var effectWithMapImp = utils.toInt(slot.getEffect()) - effect;
					
					if( effectWithMapImp )
						effect += '+' + snip.title(utils.formatNum(effectWithMapImp), 'Эффект от улучшений местности', 'tooltip-text');
					
					effect = snip.pop(effect);
					
					if( slotUp )
						effect += ' ' + snip.buildParamsEffect(utils.toInt(slot.getEffectUpInt())) ;
					
					arr.push({
						icon: 'maxWorkers',
						effect: effect,
					});
					
					if ( utils.toInt(slot.getMaxPop()) != utils.toInt(slot.getMaxPopForTown()) ) {
						effect = snip.pop(utils.toInt(slot.getMaxPopForTown()));
						
						if (slotUp) {
							effect += ' '+snip.buildParamsEffect(utils.toInt(slot.getMaxPopForTownEffectUp()));
						}
						
						arr.push({
							title: 'С модификациями',
							icon: 'maxWorkers',
							effect: effect
						});
					}

					var resList = slot.getProductionList(false);
					for (var res in resList.getList()){
						res = resList.getElem(res);
						
						arr.push({
							title: 'Производство',
							iconText: snip.resProdtypeIcon(res.getProdtype()),
							effect: snip.resCount(res, utils.formatNum(res.getCount(), {uFixed:1})) + ' в час ' + snip.pop(slot.getPop().getCount(res.getId()))
						});
					}

				} else {
					arr.push({
						icon: 'workEffectivity',
						effect: utils.toPercent(slot.getEfficiency()) + '%',
					});

					var prodtypeList = slot.getProductresByType();
					for (var resProdtype in prodtypeList){
						var list = prodtypeList[resProdtype];

						effect = '';
						for (var res in list){
							res = list[res];

							if( !(res.getId() == Slot.ids.tipi && slotTown && slotTown.getDeposit().getId() == Slot.ids.mcc) )
								effect += snip.res(res);
						}
						
						arr.push({
							title: 'Производство',
							iconText: snip.resProdtypeIcon(resProdtype),
							effect: effect,
						});						
					}
				}
				
				break; 
					
			case Build.type.prodBoost: 
				effect = '+' + utils.toPercent(slot.getEffect(), 1) + '%';
				
				if( slotTown ){
					var prodBoostEffect = utils.formatNum(slot.getProdBoostEffect(), {int: true, stages: true});
					
					if( !up )
						prodBoostEffect = snip.tooltip(prodBoostEffect, 'Для текущего города');
					
					effect += ' ' + snip.pop(prodBoostEffect);
				}
				if( slotUp ){
					effect += snip.buildParamsEffect(utils.toPercent(slot.getEffectUp(), 1)) + '%';
					
					if( slotTown )
						effect += ' ' + snip.pop(slot.getProdBoostEffectUp());
				}
				
				arr.push({
					title: 'Рабочие места',
					icon: 'maxWorkers',
					effect: effect
				});
				
				break;

		 	case Build.type.defence: 
				effect = snip.pop(slot.getTrapDamage());
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(slot.getTrapDamageUp()) ;

				arr.push({
					icon: 'trapDamage',
					effect: effect
				});

				break; 

			case Build.type.airdef: 
				effect = Math.round(slot.getEffect());
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(Math.round(slot.getEffectUp()));

				arr.push({
					icon: 'airDef',
					effect: effect
				});
				
				break; 
		} 
		
		if (up && slotTown.getAura().hasColossus()){
			var wonderEffect = slotTown.getAura().getColossusEffect();
			
			if (slot.getId() == wonderEffect.getBuild()) {
				effect = wonderEffect.getEffect() * slot.getLevel() + '<span> в час</span>';
				
				if( slotUp )
					effect += ' ' + snip.buildParamsEffect(wonderEffect.getEffect());
				
				arr.push({
					title: 'Производство',
					iconText: snip.resEffect(wonderEffect.getRes()),
					effect: effect
				});
			}
		}
		
		//спад населения
		if( slot.getUngrown() || (slot.canUp() && slot.getUp().getUngrown()) ){ 
			var ungrown = slot.getUngrown() * timeMgr.DtH,
				effect = snip.pop(snip.title(utils.formatNum(ungrown, {fixed:1}), utils.formatNum(ungrown, {fixed:3}), '-type-underline')) + '<span> в день</span>';
			if (slotUp) {
				var ungrownUp = slot.getUngrownUp() * timeMgr.DtH;
				effect += ' ' + snip.buildParamsEffect(snip.pop(snip.title(utils.formatNum(ungrownUp, {fixed:1}), utils.formatNum(ungrownUp, {fixed:3}), '-type-underline')));
			}

			arr.push({
				icon: 'ungrown',
				effect: effect,
			});
		}
		
		//содержание
		if( slot.getPay({useEconomy: up, withoutRace: !up}) || (slot.canUp() && slot.getUp().getPay({useEconomy: up, withoutRace: !up})) ){
			var pay = slot.getPay({useEconomy: up, withoutRace: !up});
			
			pay = utils.formatNum(pay, {mixed: true, uFixed: 1});
			
			effect = snip.resCount(Resource.ids.money, pay) + '<span> в час</span>';
			
			if (slotUp) {
				pay = slot.getPayUp({useEconomy: up, withoutRace: !up});
				
				pay = utils.formatNum(pay, {mixed: true, uFixed: 1});
				
				effect += ' ' + snip.buildParamsEffect(pay);
			}
			
			arr.push({
				title: snip.title(snip.c.anyIcon.rent.title, up?'C учетом экономии':'', 'fakelink crH'),
				icon: 'rent',
				effect: effect
			});
		} 
			
		//максимальное количество
		if( !up && !(slot.isWonder() && slot.getId() != Slot.ids.machuPicchu) ) {
			arr.push({
				icon: 'maxCount',
				effect: slot.getMaxCount()
			});
		}

		if( slot.isWonder() ){
			// Где можно строить чудо
			switch (slot.build.terrain) { 
				case Build.terrain.any: 
					effect = 'Любое';
					break; 
				case Build.terrain.hill: 
					effect = 'Холм';
					break; 
				case Build.terrain.flatWater: 
					effect = 'Равнина у водоема';
					break; 
				case Build.terrain.flatNoWater: 
					effect = 'Равнина без водоема и реки';
					break; 
				case Build.terrain.flatAny: 
					effect = 'Равнина';
					break; 
				case Build.terrain.river: 
					effect = 'Река';
					break; 
				case Build.terrain.anyWater: 
					effect = 'У водоема';
					break; 
			}
			
			arr.push({
				icon: 'cityLocation',
				effect: effect
			});
		}
		else if( !up ){
			var icon;
			
			if( slot.isMountain() ){
				icon = 'slotLocationM';
				effect = 'Холмовое';
			}
			else if( slot.isWater() ){
				icon = 'slotLocationW';
				effect = 'Водное';
			}
			else{
				icon = 'slotLocationF';
				effect = 'Равнинное';
			}
			
			arr.push({
				title: 'Место для строительства',
				icon: icon,
				effect: effect
			});
		}
		
		//максимальный уровень
		if( slotTown ){
			if( slot.getLevel() == slot.getMaxLevel() && slot.canUp() && slot.level != 1 )
				effect = '<span class="-warnBg -type-red">'+slot.getMaxLevel()+'</span>';
			else
				effect = slot.getMaxLevel();
			
			arr.push({
				icon: 'maxLevel',
				effect: effect
			});
		}
		
		if( slot.getType() == Build.type.prodBoost ){
			arr.push({
				icon: 'abilities',
				effect: 'Бесполезно для научных зданий'
			});
		}
		
		return tmplMgr.snipet.buildParams_item({arr: arr, slot: slot, up: up, short: short});
	},
	
	coloredNum: function(num, opt){
		var result = utils.formatNum(num, opt),
			cls = '';
		
		if( num > 0 ){
			if( !opt.noSignColor && !opt.noPosSignColor )
				cls = 'cl-green';
		}
		else if( num < 0 ){
			if( !opt.noSignColor && !opt.noNegSignColor)
				cls = 'cl-red';
		}
		else{
			if( opt.positive ){
				cls = opt.noZeroColor ? 'cl-grey' : 'cl-green';
				if( !opt.noZeroSign )
					result = '+' + (opt.signPostFix||'') + result;
			}
			else if( opt.negative ){
				cls = opt.noZeroColor ? 'cl-grey' : 'cl-red';
				if( !opt.noZeroSign )
					result = '-' + (opt.signPostFix||'') + result;
			}
			else{
				cls = 'cl-grey';
			}
		}
		
		return '<span class="' + cls + '">' + result + '</span>';
	},
	
	blinkButton1: function(opt){
		return tmplMgr.snipet.blinkButton1(opt);
	},
	
	input1: function(opt){
		opt = opt||{};
		
		var attrs = [
			'type="'+(opt.type||'text') + '"',
			'class="input1 ' + (opt.cls||'') + '"',
			opt.id ? 'id="'+opt.id+'"' : '',
			opt.name ? 'name="'+opt.name+'"' : '',
			opt.value !== undefined ? 'value="'+opt.value+'"' : '',
			opt.readonly ? 'readonly="readonly"' : '',
			opt.disabled ? 'disabled="disabled"' : '',
			opt.placeholder !== undefined ? 'placeholder="'+opt.placeholder+'"' : '',
			opt.maxlength ? 'maxlength="'+opt.maxlength+'"' : '',
			opt.autocomplete ? 'autocomplete="'+opt.autocomplete+'"' : ''
		];
		
		attrs = attrs.join(' ');
		
		if( opt.attrs )
			attrs += utils.makeAttrStr(opt.attrs);
        if( opt.dataAttrs )
			attrs += utils.makeDataAttrStr(opt.dataAttrs);
		
		return '<input '+attrs+'>';
	},
	
	switcher: function(opt){
		opt = opt||{};
		
		if( !opt.type )
			return '';
		
		opt.typeCls = opt.typeCls||(opt.type == 'checkbox' ? 'checkbox1' : 'radio1');
		
		opt.typeCls = 'switcher ' + opt.typeCls;
		
		if( opt.textOnly )
			opt.typeCls += ' -type-textOnly';
		
		var attrs = [
			opt.id ? 'id="'+opt.id+'"' : '',
			opt.name ? 'name="'+opt.name+'"' : '',
			opt.value !== undefined ? 'value="'+opt.value+'"' : '',
			opt.checked ? 'checked="checked"' : '',
			opt.disabled ? 'disabled="disabled"' : ''
		];
		
		if( opt.title ){
			attrs.push('data-title="'+opt.title+'"');
			if( tooltipMgr.$voiceHelperCont )
				attrs.push('aria-labelledby="'+tooltipMgr.$voiceHelperCont.attr('id')+'"');
		}
		
		attrs = attrs.join(' ');
		
		if( opt.attrs )
			attrs += utils.makeAttrStr(opt.attrs);
		
		var html = '<label class="'+opt.typeCls+' '+(opt.wrpCls||'')+'">';
		
		html += '<input class="switcher-input '+(opt.cls||'')+'" type="'+opt.type+'" '+attrs+'>';
		
		html += '<div class="switcher-helper"></div>';
		
		if( opt.helperText ){
			html += '<span class="switcher-helperText '+(opt.helperTextCls||'')+'">'+opt.helperText[0]+'</span>';
			html += '<span class="switcher-helperText -type-checked '+(opt.helperTextCls||'')+'">'+opt.helperText[1]+'</span>';
		}
		
		html += '</label>';
		
		return html;
	},
	
	checkbox1: function(opt){
		opt = opt||{};
		opt.type = 'checkbox';
		
		return snip.switcher(opt);
	},
	
	radio1: function(opt){
		opt = opt||{};
		opt.type = 'radio';
		
		return snip.switcher(opt);
	},
	
	checkboxBarter: function(opt){
		opt = opt||{};
		opt.type = 'checkbox';
		opt.typeCls = 'checkboxBarter';
		
		var text = 'Бартерный<br>обмен ';
		
		opt.helperText = opt.helperText||[text+'выключен', text+'включен'];
		
		return snip.switcher(opt);
	}
};

/******************************
** Обработчики для элементов **
******************************/

snip.specialistsSelectSldHandler = function(cont, opt){
		opt = opt||{};
		
		var $sld = $(cont).find('.sld-carousel'),
			$sldList = $sld.find('.sld-carousel-list'),
			$selected = $sldList.find('.-type-selected'),
			$arrowLeft = $sld.find('.sld-carousel-arrow.-type-left'),
			$arrowRight = $sld.find('.sld-carousel-arrow.-type-right');
		
		$sldList.data('item-width', $selected.width());
		
		$arrowLeft.toggleClass('-last-item', !$selected.prev().length);
		$arrowRight.toggleClass('-last-item', !$selected.next().length);
		
		$selected.prev().addClass('-sld-slide-left');
		$selected.next().addClass('-sld-slide-right');
		
		$sldList.css('left', $sldList.data('item-width') - ($sldList.data('item-width') * $selected.data('index')));
		
		opt._onSelect = function(id){
			$sld.find('input[name="spec"]').val(id);
			
			if( opt.onSelect ) opt.onSelect(id); 
		};
		
		$sld
			.on('click', '.sld-carousel-arrow', function(){
				var left = $(this).hasClass('-type-left');

				$selected = $sldList.find('.-type-selected');

				var $nextSelected = left ? $selected.prev() : $selected.next();

				$selected.removeClass('-type-selected');	
				$nextSelected.addClass('-type-selected');

				$arrowLeft.toggleClass('-last-item', !$nextSelected.prev().length);
				$arrowRight.toggleClass('-last-item', !$nextSelected.next().length);

				$selected.prev().removeClass('-sld-slide-left');
				$selected.next().removeClass('-sld-slide-right');

				$nextSelected.prev().addClass('-sld-slide-left');
				$nextSelected.next().addClass('-sld-slide-right');

				opt._onSelect($nextSelected.data('id')); 

				$sldList.animate({left: (left ? '+' : '-') + '=' + $sldList.data('item-width')}, 500);
			})
			.on('click', '.-sld-slide-left, .-sld-slide-right', function(){
				if( $(this).hasClass('-sld-slide-left') )
					$sld.find('.sld-carousel-arrow.-type-left').trigger('click');
				else
					$sld.find('.sld-carousel-arrow.-type-right').trigger('click');
			});
	};

snip.specialistsSelectHandler = function(cont, opt){
	opt = opt||{};

	var $select = $(cont).find('.select-specialists');

	$select
		.on('click', '.select-specialists-item', function(){
			$select.find('.select-specialists-item.-active').removeClass('-active');
			$(this).addClass('-active');

			if( opt.onSelect ) opt.onSelect($(this).data('id')); 
		});
};

snip.input1Handler = function($cont, opt){
	opt = opt||{};

	$cont = $($cont);
	
	$cont
		.on('focusin', '.input1', function(){
			var $this = $(this),
                data = $this.data(),
                selectdelay = data.selectdelay;
            
            clearTimeout(data.selectDelayTO);
            
            if( selectdelay === false || (selectdelay === undefined && $this.attr('type') == 'password') ){
                //
            }
			else if( selectdelay < 0 || $this.prop('readonly') )
				$this.select();
			else
				$this.data('selectDelayTO', setTimeout(function(){$this.select();}, selectdelay||40)); // setTimeout - необходим, чтобы при первом выделении текста не показывался системный gui со вставкой, копированием и прочими действиями (данный интерфейс показывается при повторном клике на сфокусированном элементе)
            
            delete data.selectdelay;
		});

	if( opt.spinbox ){
		$cont.find('.input1').addClass('spinbox');
		
		snip.spinboxHandler($cont, opt.spinbox);
	}
};

snip.smplSelectHandler = function(cont, selectList, opt){
	opt = opt||{};
	opt.cls = '.smplSelect' + (opt.cls||'');

	var _showSelected = function($el, elem, init){
			$el.data('index', elem.getIndex());
			$el.find('.smplSelect-text').html(elem.getText());
			$el.find('.smplSelect-input').val(elem.getVal());

			selectList.setSelected(elem);

			$el.trigger('smplSelect-changed', [elem, init]);
		};

	$(cont)
		.on('smplSelect-init', opt.cls, function(){
			_showSelected($(this), selectList.getSelected(), true);
		})
		.on('smplSelect-select', opt.cls, function(event, val){
			var elem = selectList.getByVal(val);

			if( elem )
				_showSelected($(this), elem);
		})
		.on('click', opt.cls, function(){
			var index = $(this).data('index'),
				elem = selectList.getElem(++index%selectList.getLength());

			_showSelected($(this), elem);
		});

	if( !opt.noInit )
		$(cont).find(opt.cls).trigger('smplSelect-init');
};
	
snip.gradSliderHandler = function($el, opt){
	opt = opt||{};

	var _applyGrad = function(slider, percent){
		percent = utils.toInt(percent);

		var color = utils.calcGradByPercent(percent, opt.palette||[
			{from: 'f18e6b', to: 'ecea76'},
			{to: '8ed989'},
			{to: 'af9fc6'}
		]);
		
		$(slider).css('background', 'linear-gradient(to right, '+color+' '+percent+'%, #f7deb2 0)');
		$(slider).find('.-type-before').css('background', color);
	};

	snip.sliderHandler($el, {
		min: opt.min,
		max: opt.max,
		value: opt.value||opt.min,
		create: function(event, ui) {
			$(this).prepend('<div class="-type-before"></div>');

			_applyGrad(this, opt.value);

			if( opt.create ) opt.create.apply(this, arguments);
		},
		start: function(event, ui) {
			_applyGrad(this, ui.handle.style.left.replace('%', ''));

			if( opt.start ) opt.start.apply(this, arguments);
		},
		slide: function(event, ui) {
			_applyGrad(this, ui.handle.style.left.replace('%', ''));

			if( opt.slide ) opt.slide.apply(this, arguments);
		},
		change: function(event, ui) {
			_applyGrad(this, ui.handle.style.left.replace('%', ''));

			if( opt.change ) opt.change.apply(this, arguments);
		},
		stop: function(event, ui) {
			_applyGrad(this, ui.handle.style.left.replace('%', ''));

			if( opt.stop ) opt.stop.apply(this, arguments);
		}
	});
};

snip.resGroupSelectHandler = function(cont, opt){
	opt = opt||{};
	opt.min = opt.min||0,
	opt.max = opt.max||2500000, // 2500000 - сумма всех уровней самого дорогого здания (+=)  
	opt.step = opt.step||1;

	var $groupSelect = $(cont).find(opt.cls||'.resGroupSelect');

	opt.setValue = opt.setValue||function($resElem, value){
		$resElem = $($resElem);

		if( !$resElem.hasClass('resSelect-res-input') )
			$resElem = $resElem.closest('.resSelect-res').find('.resSelect-res-input');

		$resElem.val(utils.formatNum(value, {int:true}));

		opt.checkSliderTimeOut($resElem);

		return $resElem;
	},
	opt.getLimit = opt.getLimit||function($elem, limit){
		$elem = $($elem);
		limit = limit||opt.max;

		if( $elem.data('limit') )
			limit = Math.min($elem.data('limit'), limit);

		return utils.toInt(limit);
	},
	opt.setSliderTimeOut = opt.setSliderTimeOut||function() {
		if( opt.sliderTimeOut )
			clearTimeout(opt.sliderTimeOut);

		opt.sliderTimeOut = setTimeout(function(){
			opt.inputTimeOut = true;

			$groupSelect.find('.resSelect-res-input.-active').closest('.resSelect-res').trigger('focusout');
		}, 5000);
	};
	opt.checkSliderTimeOut = opt.checkSliderTimeOut||function(el) {
		if( $(el).hasClass('-active') )
			opt.setSliderTimeOut();
	};

	snip.input1Handler($groupSelect, {spinbox: {}});

	$groupSelect.off('focusout', '.input1');

	$groupSelect
		.on('input', '.resSelect-res-input', function(event){
			utils.checkInputInt(this, {max: opt.getLimit(this), min: opt.min, manualInput: !event.isTrigger});

			var $slider = $(this).closest('.resSelect-res').find('.slider.ui-slider');

			if( $slider.length )
				$slider.slider('value', $(this).val());
			else
				opt.change.apply(this, arguments);

			opt.checkSliderTimeOut(this);
		})
		.on('focusin', '.resSelect-res-input', function(){
			if( $(this).hasClass('-active') )
				return;

			var $this = $(this),
				$sliderWrp = $this.closest('.resSelect-res').addClass('js-hovered').find('.resSelect-res-slider-wrp'),
				val = $this.val(),
				limit = opt.getLimit($this),
				sliderMax = Math.min(limit, Math.max(val, 250) * 2);;
				
			snip.sliderHandler($sliderWrp.find('.slider'), {
				min: opt.min||0,
				max: sliderMax,
				step: opt.step||1,
				value: val||0,
				create: function(){
					$sliderWrp.slideDown(200);

					$this.addClass('-active');

					opt.setSliderTimeOut();

					delete opt.inputTimeOut;

					if( opt.create ) opt.create.apply(this, arguments);
				},
				slide: function( event, ui ){
					opt.setValue(this, ui.value);

					if( opt.slide ) opt.slide.apply(this, arguments);
				},
				change: function( event, ui ){
					val = $this.val();
					if( val >= sliderMax ){
						limit = opt.getLimit($this);
						if( val > sliderMax ){
							sliderMax = Math.min(limit, val * 2);
							$(this).slider('option', {value: val, max: sliderMax});
						}
						else{
							sliderMax = Math.min(limit, sliderMax * 2);
							$(this).slider('option', {max: sliderMax});
						}
					}

					if( opt.change ) opt.change.apply(this, arguments);
				}
			});
		})
		.on('focusout', '.resSelect-res', function(){
			if( $(this).hasClass('js-hovered') && !opt.inputTimeOut )
				return false;

			var $input = $(this).find('.resSelect-res-input'),
				$sliderWrp = $(this).find('.resSelect-res-slider-wrp');

			if( $input.hasClass('-active') ){
				$input.removeClass('-active').blur();

				$sliderWrp.slideUp(200, function(){
					$sliderWrp.html('<div class="slider"></div>');
				});
			}

			return false;
		})
		.on('mouseenter', '.resSelect-res', function(){
			$(this).addClass('js-hovered');
		})
		.on('mouseleave', '.resSelect-res', function(){
			$(this).removeClass('js-hovered');
		})
		.on('click', '.resSelect-res-limit', function(){
			var $resInput = $(this).closest('.resSelect-res').find('.resSelect-res-input');

			opt.setValue($resInput, opt.getLimit($resInput)).trigger('input');
		});

	$groupSelect
		.find('.resSelect-res.-disabled .resSelect-res-input')
		.off('focusin click input')
		.on('focusin click input', function(){return false;});
};

snip.checkboxSliderHandler = function($el, opt){
	opt = opt||{};

	var _change = function(slider, checked){
		checked = !!checked;

		$(slider).toggleClass('-checked', checked);
		$(slider).find('input[type="checkbox"]').prop('checked', checked);
	};

	$el
		.on('checkboxSld-set', function(event, checked){
			checked = +(!!(checked === undefined ? $(this).data('checked') : checked));

			$(this).slider('option', 'value', checked);
		})
		.on('checkboxSld-disable', function(){
			$(this).slider('option', 'disabled', true);
		});

	snip.sliderHandler($el, {
		min: 0,
		max: 1,
		create: function(event, ui) {
			$(this).append('<input type="checkbox" name="'+($(this).data('name')||'')+'">');

			$(this).trigger('checkboxSld-set');

			if( opt.create ) opt.create.apply(this, arguments);
		},
		start: function(event, ui) {
			$(this).addClass('-active');

			if( opt.start ) opt.start.apply(this, arguments);
		},
		stop: function(event, ui) {
			$(this).removeClass('-active');

			if( opt.stop ) opt.stop.apply(this, arguments);
		},
		slide: function(event, ui) {
			_change(this, ui.value);

			if( opt.slide ) opt.slide.apply(this, arguments);
		},
		change: function(event, ui) {
			_change(this, ui.value);

			if( opt.change ) opt.change.apply(this, arguments);
		},
	});
};

snip.iSliderHandler = function(opt){
	opt = opt||{};
	
	if( !opt.$slider )
		return false;
	
	var iSlider = $.extend({}, opt);
	
	iSlider.min = iSlider.min||0;
	iSlider.maxLimit = iSlider.maxLimit === undefined ? 100 : iSlider.maxLimit;
	iSlider.max = iSlider.max === undefined ? iSlider.maxLimit : Math.min(iSlider.max, iSlider.maxLimit);
	iSlider.value = iSlider.value||0;
	iSlider.step = iSlider.step||5;
	iSlider.shortStep = iSlider.shortStep||0;
	iSlider.name = iSlider.name||'';
	
	if( iSlider.float ){
		iSlider.float.fixed = iSlider.float.fixed||1;
		iSlider.float.digit = iSlider.float.digit||Math.pow(10, iSlider.float.fixed);
		iSlider.float.invDigit = 1/iSlider.float.digit;
	}
	else
		iSlider.int = iSlider.int||{}; 
	
	iSlider.labelIcon = iSlider.labelIcon||'';
	
	if( iSlider.labelHtmlPostfix )
		iSlider.labelHtml += iSlider.labelHtmlPostfix
	
	for(var funcName in snip.iSliderHandler){
		if( snip.iSliderHandler.hasOwnProperty(funcName) )
			iSlider[funcName] = iSlider[funcName]||snip.iSliderHandler[funcName];
	}
	
	snip.sliderHandler(iSlider.$slider, {
		min: iSlider.min,
		max: iSlider.max,
		value: iSlider.value,
		step: iSlider.step,
		create: function(event, ui) {
			iSlider.$slider.find('a').html(snip.slider.label({
				icon: iSlider.labelIcon, 
				value: iSlider.getInputHtml(iSlider)
			}));
			
			iSlider.$input = iSlider.$slider.find('input[name="'+iSlider.name+'"]');
			iSlider.$input.on('input', function(event){
				iSlider.$slider.slider('value', iSlider.getCheckedInputValue(iSlider, event));
				
				iSlider.$input.trigger('iSlider-input-checked');
			});
			snip.input1Handler(iSlider.$slider, {spinbox:{}});
			
			if( iSlider.create )
				iSlider.create(iSlider, event, ui);
			
			iSlider.setValue(iSlider, iSlider.value);
		},
		slide: function(event, ui) {
			iSlider.setValue(iSlider, ui.value);
			
			if( iSlider.shortStep )
				iSlider.$slider.slider('option', 'step', event.shiftKey ? iSlider.shortStep : iSlider.step);
			
			if( iSlider.slide )
				iSlider.slide(iSlider, event, ui);
		},
		change: function(event, ui) {
			iSlider.checkMax(iSlider, event);
			
			if( iSlider.change )
				iSlider.change(iSlider, event, ui);
		}
	});
	
	return iSlider;
};
	snip.iSliderHandler.setValue = function(iSlider, value){
		if( iSlider.float )
			value = utils.formatNum(value * iSlider.float.invDigit, {servRound: true, fixed: iSlider.float.fixed});
		else
			value = utils.toInt(value);
		
		iSlider.$input.val(value);
		
		return value;
	};
	snip.iSliderHandler.checkMax = function(iSlider, event){
		var value = iSlider.$input.val(); // ui.value не используется, т.к. оно обрезается до перерасчета нового максимального значения
		
		if( iSlider.float )
			value *= iSlider.float.digit;
		
		if( value >= iSlider.max ){
			var options = {};
            
			if( value > iSlider.max ){
				iSlider.max = Math.min(iSlider.maxLimit, value * 2);
                
				options.value = value;
			}
			else{
                if( event.originalEvent )
                    iSlider.$slider.trigger('slider_smoothslidestart');
                
				snip.iSliderHandler.prepareMax(iSlider);	
			}
            
            options.max = iSlider.max;
            
			iSlider.$slider.slider('option', options);
            
            if( event.originalEvent )
                iSlider.$slider.trigger('slider_smoothslideend');
		}
	};
    snip.iSliderHandler.prepareMax = function(iSlider){
		iSlider.max = Math.min(iSlider.maxLimit, iSlider.max * 2);
	};
	snip.iSliderHandler.getInputHtml = function(iSlider){
		var html = '<input class="input1 spinbox" ';
				
		if( iSlider.float ){
			html += 'type="number" ';
			html += 'data-spinbox-float="true" ';
			html += 'data-spinbox-step="'+(iSlider.float.invDigit||'')+'" ';
			html += 'data-spinbox-fixed="'+(iSlider.float.fixed||'')+'" ';
		}
		else{
			html += 'type="tel" ';
			
			if( iSlider.int.normalizeBase )
				html += 'data-spinbox-step="'+(iSlider.int.normalizeBase||'')+'" ';
		}

		html += 'name="'+iSlider.name+'" autocomplete="off">';
		
		return html;
	};
	snip.iSliderHandler.getCheckedInputValue = function(iSlider){
		if( iSlider.float ){
			utils.checkInputFloat(iSlider.$input, iSlider.maxLimit * iSlider.float.invDigit, iSlider.min, iSlider.float.fixed);
			
			return iSlider.$input.val() * iSlider.float.digit;
		}
		else{
			utils.checkInputInt(iSlider.$input, {
				max: iSlider.maxLimit,
				min: iSlider.min,
				noZero: iSlider.int.noZero,
				normalizeBase: iSlider.int.normalizeBase
			});

			return iSlider.$input.val();
		}
	};
	snip.iSliderHandler.disable = function(iSlider){
		iSlider = iSlider||this;
		
		iSlider.$slider.slider('disable');
		
		iSlider.$input.prop('disabled', true);
	};
	snip.iSliderHandler.enable = function(iSlider){
		iSlider = iSlider||this;
		
		iSlider.$slider.slider('enable');
		
		iSlider.$input.prop('disabled', false);
	};
	
snip.spinboxHandler = function($el, opt){
	if( $el.hasClass('spinbox') )
		snip.spinboxHandler.init($el);
	else
		$el.find('.spinbox').each(function(){snip.spinboxHandler.init($(this));});
};
	snip.spinboxHandler.setVal = function($el, less){
		$el = $($el);
		
		var val = (+($el.val()||0))+((less?-1:1)*(+($el.data('spinbox-step')||1)));
		
		if( $el.data('spinbox-float') )
			val = utils.formatNum(val, {servRound: true, fixed: $el.data('spinbox-fixed')});
		
		$el.val(val).trigger('input');
	};
	snip.spinboxHandler.startLoop = function($input, less){
		var timeoutId = setTimeout(function(){
			snip.spinboxHandler.setVal($input, less);
			
			var intervalId = setInterval(function(){
				snip.spinboxHandler.setVal($input, less);
			}, 50);
			
			$input.data('spinbox-intervalid', intervalId);
		}, 500);
		
		$input.data('spinbox-timeoutid', timeoutId);
	};
	snip.spinboxHandler.stopLoop = function($input){
		clearTimeout($input.data('spinbox-timeoutid'));
		clearInterval($input.data('spinbox-intervalid'));

		$input.data('spinbox-timeoutid', '');
		$input.data('spinbox-intervalid', '');
				
		$input.data('selectdelay', -1).trigger('focus');
	};
	snip.spinboxHandler.init = function($spinbox){
		if( $spinbox.data('spinbox-inited') ) return;
		
		if( $spinbox.data('spinbox-float') ){
			$spinbox.addClass('-type-float');
			
			// Если для number не установлен атрибут step, форма ругается на некорректное введенное значение в инпут если оно между 0 и 1.
			$spinbox.attr('step', $spinbox.data('spinbox-numberstep')||$spinbox.data('spinbox-step')||1);
		}
		
		$spinbox
			.attr('type', $spinbox.data('spinbox-float') ? 'number' : 'tel')
			.wrap('<div class="spinbox-wrp"></div>')
			.parent()
			.append('<div class="spinbox-spin -type-more"></div><div class="spinbox-spin -type-less"></div>')
			.on(utils.isMobileDevice() ? 'touchstart' : 'mousedown', '.spinbox-spin', function(e){
				var $this = $(this),
					$input = $this.closest('.spinbox-wrp').find('.spinbox');
				
				e.preventDefault(); // Останавливам действие по умолчанию (т.к. может теряться фокус у импута)
				e.stopPropagation(); // Прекращаем всплытие (чтобы следующий обработчик (слайдер и т.п.) не производил никаких действий)
				
				snip.spinboxHandler.setVal($input, $this.hasClass('-type-less'));
				
				snip.spinboxHandler.startLoop($input, $this.hasClass('-type-less'));
				
				$input.addClass('js-spinbox-looping'); // Дополнительная проверка зацикленности для мобилок (необходима) и для десктопа (необязательна)
				
				$input.data('selectdelay', -1).trigger('focus');
				
				
				if( !utils.isMobileDevice() ){
					$this.data('outermouseup', true);

					$(window).one('mouseup', function(){
						if( $this.data('outermouseup') )
							$this.trigger('mouseup');
					}); // На десктопе обрабатывается отпускание мыши вне зоны "стрелки"
				}
			})
			.on(utils.isMobileDevice() ? 'touchend' : 'mouseup', '.spinbox-spin', function(e){
				var $this = $(this),
					$input = $this.closest('.spinbox-wrp').find('.spinbox');
				
				if( !utils.isMobileDevice() )
					$this.data('outermouseup', '');
				
				e.preventDefault(); // Останавливам действие по умолчанию
				e.stopPropagation(); // Прекращаем всплытие
				
				snip.spinboxHandler.stopLoop($input);
				
				$input.removeClass('js-spinbox-looping');
			})
			.on('keydown', '.spinbox', function(event){
				if( event.keyCode == 38 || event.keyCode == 40 ){
					var $this = $(this);
					
					if( $this.data('spinbox-timeoutid') || $this.data('spinbox-intervalid') )
						return false;
					
					event.preventDefault();
					
					snip.spinboxHandler.setVal($this, event.keyCode == 40);
					
					snip.spinboxHandler.startLoop($this, event.keyCode == 40);
				}
				
				// Прекращаем всплытие для событий нажатия по стрелкам
				if( event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40 )
					event.stopPropagation();
			})
			.on('keyup', '.spinbox', function(event){
				if( event.keyCode == 38 || event.keyCode == 40 )
					snip.spinboxHandler.stopLoop($(this));
			})
			// На мобилках удержание на элементе вызывает потерю фокуса.
			// Также для float производим доп. обработку числовой строки в инпуте
			.on('focusout', '.spinbox', function(){
				var $this = $(this);
				
				// Если происходит потеря фокуса (бывает на мобилках, что ведет к нежелательному скрытию клавиатуры), но цикл еще работает, устанавливаем фокус обратно на элемент
				if( $this.hasClass('js-spinbox-looping') ){
					$this.data('selectdelay', -1).trigger('focus');
					
					return;
				}
				
				// Доп. обработка для чисел с плавающей запятой
				// Дабы исключить конструкции вида: "0001", ".0", "0."...
				if( $this.data('spinbox-float') ){
					var val = $this.val(),
						fixed = $this.data('spinbox-fixed');
					
					if( val ){
						val = val.split('.');
						
						if( val.length == 2 ){
							val[0] = val[0] ? +val[0] : '0';
							
							if( fixed ){
								val[1] = '0.'+val[1];
								
								val[1] = utils.formatNum(val[1], {uFixed:fixed}).split('.')[1];
							}
							else if( !(+val[1]) )
								val[1] = '0';
							
							val = val.join('.');
						}
						else if( val[0] ){
							val = +val[0];
							
							if( fixed )
								val = utils.formatNum(val, {uFixed:fixed});
						}
					}
					
					$this.val(val);
				}
			});
			
		$spinbox.data('spinbox-inited', true);
	};
	
	
snip.scrollHandler = function($scroll, opt){
	if( !$scroll || !$scroll.length )
		return;
	
	var scroll = $scroll.get(0);
	
	if( scroll._scroll_ )
		return;
	
	opt = opt||{};
	
	var scrollData = {
		$scroll: $scroll,
		upd: {},
		callbacks: {
			onScroll: function(){},
			onTotalScroll: function(){},
			onTotalScrollBack: function(){},
			onUpdate: function(){}
		}
	};
	
	scroll._scroll_ = scrollData;
	
	utils.copy(scrollData.callbacks, opt.callbacks);
	utils.copy(scrollData.upd, opt.upd);
	
	$scroll.addClass('scroll-wrp');
	
	$scroll.on('scroll', function(e){
		var callbacks = this._scroll_.callbacks;
		
		callbacks.onScroll.call(this, e);
		
		if( this.scrollHeight > this.clientHeight ){
			if( this.scrollTop == 0 )
				callbacks.onTotalScrollBack.call(this, e);
			else if( this.scrollTop >= (this.scrollHeight - this.clientHeight) )
				callbacks.onTotalScroll.call(this, e);
		}
	});
	
	if( !opt.noUpd )
		snip.scrollHandler.startUpd(scroll);
	
	return $scroll;
};
	snip.scrollHandler.startUpd = function(scroll){
		var upd = scroll._scroll_.upd;
		
		upd.scrollHeight = scroll.scrollHeight;
		upd.clientHeight = scroll.clientHeight;
		upd.delay = upd.delay||500;
		upd.doUpd = snip.scrollHandler.doUpd.bind(scroll);
		
		upd.doUpd();
	};
	snip.scrollHandler.doUpd = function(){
		if( !this._scroll_ )
			return;
		
		var upd = this._scroll_.upd;
		
		if( !utils.inDOM(this) ){
			snip.scrollHandler.destroy(this);
			
			return;
		}
		
		if( this.scrollHeight != upd.scrollHeight || this.clientHeight != upd.clientHeight ){
			this._scroll_.callbacks.onUpdate.call(this);

			upd.scrollHeight = this.scrollHeight;
			upd.clientHeight = this.clientHeight;
		}
		
		upd.TO = setTimeout(upd.doUpd, upd.delay);
	};
	snip.scrollHandler.destroy = function(scroll){
		if( !scroll || !scroll._scroll_ )
			return;
		
		delete scroll._scroll_.upd.doUpd;
		
		clearTimeout(scroll._scroll_.upd.TO);
		
		scroll._scroll_.$scroll.off('scroll');
		
		delete scroll._scroll_;
	};
	snip.scrollHandler.isBlockInView = function($scroll, $block){
		if( !$scroll || !$block )
			return false;

		var scroll = $scroll.get(0),
			block = $block.get(0);

		if( block.offsetTop > scroll.scrollTop + scroll.clientHeight )
			return false;
		else if( block.offsetTop + block.clientHeight < scroll.scrollTop )
			return false;
		
		return true;
	};
	snip.scrollHandler.isBlockOverTop = function($scroll, $block){
		if( !$scroll || !$block )
			return false;

		var scroll = $scroll.get(0),
			block = $block.get(0);

		return block.offsetTop < scroll.scrollTop;
	};
	snip.scrollHandler.scrollTo = function($scroll, val, opt){
		if( !$scroll )
			return;
		
		opt = opt||{};

		var scroll = $scroll.get(0),
			scrollTop;

		if( typeof(val) == 'string' ){
			if( val == 'top' )
				scrollTop = 0;
			else if( val == 'bottom' )
				scrollTop = (scroll.scrollHeight - scroll.clientHeight) + 1;
			
			val = +val;
			
			if( !isNaN(val) )
				scrollTop = val;
		}
		else if( typeof(val) == 'number' )
			scrollTop = val;
		else if( typeof(val) == 'object' ){
			if( val instanceof jQuery )
				scrollTop = val.get(0).offsetTop;
			else
				scrollTop = val.offsetTop;
		}

		if( opt.scrollInertia )
			$scroll.animate({scrollTop: scrollTop}, opt.scrollInertia);
		else
			scroll.scrollTop = scrollTop;
	};
	snip.scrollHandler.scrollToX = function($scroll, val, opt){
		if( !$scroll )
			return;
		
		opt = opt||{};

		var scroll = $scroll.get(0),
			scrollLeft;

		if( typeof(val) == 'string' ){
			if( val == 'left' )
				scrollLeft = 0;
			else if( val == 'right' )
				scrollLeft = (scroll.scrollLeft - scroll.clientWidth) + 1;
			
			val = +val;
			
			if( !isNaN(val) )
				scrollLeft = val;
		}
		else if( typeof(val) == 'number' )
			scrollLeft = val;
		else if( typeof(val) == 'object' )
			scrollLeft = val.get(0).offsetLeft;

		if( opt.scrollInertia )
			$scroll.animate({scrollLeft: scrollLeft}, opt.scrollInertia);
		else
			scroll.scrollLeft = scrollLeft;
	};
	
	snip.scrollHandler.hasScroll = function($scroll){
		if( !$scroll )
			return false;
		
		var scroll = $scroll.get(0);
			
		return scroll.scrollHeight > scroll.clientHeight;
	};


snip.sliderHandler = function($el, opt){
	opt = opt||{};
	
	return $el.slider(opt);
};

//    snip.sliderHandler.option = function($slider, param1, param2){
//        return $slider.slider.apply($slider, ['option', param1, param2]);
//    };

snip.c = {
    anyIcon: {
        cls: 'anyIcon',

		rent: {id: 0, title: 'Содержание'},
        cult: {id: 3, title: 'Предел культуры города'},
        grow: {id: 6, title: 'Прирост населения в городе'},
		popKill: {id: 9},
		diplomacyPoints: {id: 10, title: 'Очки дипломатии'},
		countryInvite: {id: 10},
        distance: {id: 16, title: 'Расстояние'},
        maxWorkers: {id: 20, title: 'Максимум работников'},
		retrain: {id: 20, title: 'Возможно переобучить в'},//icnb ic21
		clock: {id: 100},
		
		place: {id: 101, title: 'Место обучения'},//icnu ic2
		science: {id: 103, title: 'Требуется наука'},//icnu ic4
		cost: {id: 104, title: 'Необходимо для обучения'},//icnu ic5
		unitCapacity: {id: 105, title: 'Грузоподъемность при грабеже'},	//icnu ic7
		speed: {id: 106, title: 'Скорость'},//icnu ic8
		features: {id: 108, title: 'Характеристики'},	//icnu ic10
		abilities: {id: 110, title: 'Особенность'},//icnu ic12
		race: {id: 113, title: 'Раса'},//icnu ic15
        antiAirDamage: {id: 114, title: 'Урон авиации'},
		deposit: {id: 117, title: 'Месторождение'},
        mapImp: {id: 118, title: 'Улучшение местности'},
		cap: {id: 119, title: 'Новая возможность'},
		fuel: {id: 120, title: 'Ресурсы для ускорения доставки грузов'},
        townDmg: {id: 121, title: 'Урон городу'},
		specialist:  {id: 219, title: 'Великий гражданин'},
		
		//строения
		maxLevel: {id: 1, title: 'Максимальный уровень'},//icnb ic2
		trainSpeed: {id: 2, title: 'Скорость обучения'},//icnb ic3
		waterTradeSpeed: {id: 2, title: 'Дополнительная скорость торговцев по воде'},//icnb ic3
		waterArmySpeed: {id: 2, title: 'Скорость военных судов'},//icnb ic3
		airArmySpeed: {id: 2, title: 'Скорость авиации города'},//icnb ic3
		maxCount: {id: 4, title: 'Максимальное количество'},//icnb ic5
		slotCapacity: {id: 5, title: 'Вместимость'},	//icnb  ic6
		airDef: {id: 8, title: 'Урон вражеской авиации'},//icnb ic9
		trapDamage: {id: 9, title: 'Урон от ловушек'},//icnb ic10
		corruption: {id: 11, title: 'Уменьшает коррупцию'},//icnb ic12
		ecology: {id: 11, title: 'Улучшает экологию'},//icnb ic12
		economy: {id: 12, title: 'Экономия'},	//icnb ic13
		traders: {id: 13, title: 'Торговцы'},//icnb ic14
        ungrown: {id: 14, title: 'Спад населения'},//icnb ic15
		cityLocation: {id: 15, title: 'Расположение города'},//icnb ic15
		slotLocationM: {id: 223, title: 'Холмовое'},// Mountain
		slotLocationW: {id: 23, title: 'Водное'},// Water
		slotLocationF: {id: 123, title: 'Равнинное'},// Flat
		
		effect: {id: 17, title: 'Эффект'},//icnb ic18
		workEffectivity: {id: 21, title: 'Эффективность труда'},//icnb ic22
		money: {id: 115},
		production: {id: 7, title: 'Промышленный ресурс'},
		airDamage: {id: 114, title:'Урон авиации'}, //icnb ic16
		waterDamage: {id: 220, title:'Урон кораблям'},
		empty: {id: 221},
		off: {id: 222},
    },
	
    bonusScience: {
        cls: 'anyIcon',
		
		grown: {id: 6, title: 'Рост населения'},
		culture: {id: 3, title: 'Культура'},
		income: {id: 115, title: 'Доход'},
		knowledge: {id: 103, title: 'Улучшение научного распределения'},
		war: {id: 9},
		production: {id: 7, title: 'Производство'},
		view: {id: 116, title: 'Радиус обзора'},
		store: {id: 5, title: 'Базовая складская вместимость города'},
		trader: {id: 13, title: 'Торговцы'},
		build: {id: 22},
		unit: {id: 122},
		unitPeace: {id: 124},
	},
	
	tabIcon: {
        cls: 'iconTab',
		clsPrefix: '-id-',
		
		town: {id: 6},
		player: {id: 7},
		economics: {id: 9},
		prod: {id: 10},
		pop: {id: 11},
		management: {id: 15},
		money: {id: 12},
		description: {id: 16},
		country: {id: 17},
		science: {id: 18},
		adviser: {id: 19},
		army: {id: 20},
		space: {id: 21},
		info: {id: 22},
		orders: {id: 23},
	},
	
	eventIcon: {
		cls: 'event',
		clsPrefix: 'e',
		
		subsidy: {id: 81},
		hunger: {id: 94},
	},
	
	townIcon: {
        cls: 'iconTown',
		
        report: {id: 0},
		battle: {id: 1},
		message: {id: 2},
		town: {id: 3}
    },
	
	townSpec: {
        cls: 'iconTownSpec',
        townSpec0: {id: 0, title: ''},
        townSpec1: {id: 1, title: 'Наука'},
        townSpec2: {id: 2, title: 'Производство'},
        townSpec3: {id: 3, title: 'Армия'},
        townSpec4: {id: 4, title: 'Деньги'},
        townSpec5: {id: 5, title: 'Повышенная важность'},
        townSpec6: {id: 6, title: 'Незаменимая необходимость'},
        townSpec7: {id: 7, title: ''},
    },
	
    smenu: {
        cls: 'smenuIcon',
        ann: {id: 'ann', title: 'Объявления'},
        sim: {id: 'sim', title: 'Симулятор боя'},
        hlp: {id: 'hlp', title: 'Энциклопедия'},
        opt: {id: 'opt', title: 'Настройки'},
        frm: {id: 'frm', title: 'Сообщество'},
        sup: {id: 'sup', title: 'Поддержка'},
        ext: {id: 'ext', title: 'Выход'},
		fsc: {id: 'fsc', title: 'Полный экран'},
    },
	
    warn: {
    	no: 0,
        red: 1,
        brown: 2,
        green: 3,
        blue: 4,
        black: 5,
        lgreen: 6,
        purple: 7,
        grey: 8,
        white: 9,
        pink: 10,
        lblue: 11
    },
	
	moneyIcon: {
		cls: 'money_icon',
		clsPrefix: 'i',
		
		inc: {id: '0', title: 'Доход'},
		cons: {id: '1', title: 'Расход'},
		stream: {id: '2', title: 'Снабжение'},
		tax: {id: '4', title: 'Налоги'},
		budget: {id: '6', title: 'Бюджетные выплаты'},
		sum: {id: '3', title: 'Прибыль'},
	},
	
	specialistIcon: {
        cls: 'specialistIcon',

		science: {id: 0},
		production: {id: 1},
		food: {id: 2},
		money: {id: 3},
		war: {id: 4},
		culture: {id: 5},
		grown: {id: 6}
	},
	
	resProdtype: {
		cls: 'resProdtype',

		science: {id: 0, title: 'Научные'},
		money: {id: 1, title: 'Финансовые'},
		production: {id: 3, title: 'Промышленные'},
		food: {id: 2, title: 'Сельскохозяйственные'},
	},
	
	unitTagIcon: {
		cls: 'unitTagIcon',

		organic: {id: 'organic'},
		shooter: {id: 'shooter'},
		technics: {id: 'technics'},
		big: {id: 'big'},
		mounted: {id: 'mounted'},
		shielded: {id: 'shielded'},
		siege: {id: 'siege'},
		armored: {id: 'armored'},
		fueled: {id: 'fueled'},
		heavyarmored: {id: 'heavyarmored'},
		
		build: {id: 'build'}, // Нестандартный (нет в списке тегов)
	},
	
	battlePanelIcon: {
		cls: 'battlePanelIcon',
		
		period: {id: 'period'},
		dist: {id: 'dist'},
		scatter: {id: 'scatter'},
		damageCircle: {id: 'damageCircle'},
		damageSector: {id: 'damageSector'},
		damagePoint: {id: 'damagePoint'},
		weaponDamageCrushing: {id: 'weaponDamageCrushing'},
		weaponDamagePenetrating: {id: 'weaponDamagePenetrating'},
		weaponDamageSecant: {id: 'weaponDamageSecant'},
		weaponDamageExplosive: {id: 'weaponDamageExplosive'},
	},
	
	bldActions: {
		cls: 'buttonBuildSlot-icon',
		clsPrefix: '-type-',
		
		build: {id: 'up'},
		rebuild: {id: 'rebuild'},
		destroy: {id: 'down'},
		destroylevel: {id: 'down'}
	},
	
	other: {
		cls: '',
		clsPrefix: ' ',
		
		oper: {id: 'iconOper'},
		reinforce: {id: 'iconReinforce'}
	},
    
    resIcon: {
        cls: 'anyIcon',
        
        0: {id: 103},
        1: {id: 115},
        2: {id: 200},
        3: {id: 201},
        4: {id: 202},
        5: {id: 203},
        6: {id: 204},
        7: {id: 205},
        8: {id: 206},
        
        10: {id: 207},
        11: {id: 208},
        12: {id: 209},
        13: {id: 210},
        14: {id: 211},
        15: {id: 212},
        16: {id: 213},
        17: {id: 214},
        18: {id: 215},
        19: {id: 216},
        
        21: {id: 217},
        22: {id: 218}
    }
};

if( typeof(cnst) == 'undefined' )
    cnst = {};