/**
	Набор утилит
*/

var utils = {

//главное
	loadScript: function(url, opt){
		opt = opt||{};
		
		var script = document.createElement('script');
		
        script.type = opt.type||'text/javascript';
        
		script.onload = function(){
			if( opt.callback )
				opt.callback();
			
			this.onload = this.onerror = null;
		};
		script.onerror = function(){
			console.warn('Failed load script: ' + this.src);
			
			this.onload = this.onerror = null;
		};
		
		script.src = utils.prepareUrl(url);
		
		if( opt.async !== undefined )
			script.async = opt.async;
		
		(opt.parent||document.head).appendChild(script);
	},
	
	loadStylesheet: function(href, opt){
		opt = opt||{};
		
		var stylesheet = document.createElement('link');
		
		stylesheet.setAttribute('rel', 'stylesheet');
		stylesheet.setAttribute('type', 'text/css');
		
		stylesheet.async = false;
		
		stylesheet.onload = function(){
			if( opt.callback )
				opt.callback();
			
			this.onload = this.onerror = null;
		};
		stylesheet.onerror = function(){
			console.warn('Failed load stylesheet: ' + this.href);
			
			this.onload = this.onerror = null;
		};
		
		stylesheet.href = utils.prepareUrl(href);
		
		(opt.parent||document.head).appendChild(stylesheet);
	},
	
	prepareUrl: function(url){
		return url;
	},
	
	//НАСЛЕДОВАНИЕ
	extend: function(Child, Parent) {
		var F = function(){};
		F.prototype = Parent.prototype;
		Child.prototype = new F();
		Child.prototype.constructor = Child;
		Child.superclass = Parent.prototype;
		
		//наследование статичных методов
		for (var i in Parent){
			if( !Child[i] )
				Child[i] = Parent[i];
		}
	},
	
	reExtend: function(Child, Parent, ChildNew) {
		var childProto = Child.prototype,
			childProtoMethods = {};
		
		for (var key in childProto){
			if( childProto.hasOwnProperty(key) )
				childProtoMethods[key] = childProto[key];
		}
		
		delete childProtoMethods.constructor;
		
		if( ChildNew ){
			for (var i in Child){
				if( !Child[i] )
					ChildNew[i] = Parent[i];
			}
			
			Child = ChildNew;
		}
		
		utils.extend(Child, Parent);
		
		childProto = Child.prototype;
		
		for (var key in childProtoMethods){
			childProto[key] = childProtoMethods[key];
		}
		
		return Child;
	},
	//ПРИМЕСЬ
	mix: function(Child, Parent, opt) {
		opt = opt||{};
		
		var childProto = Child.prototype,
			parentProto = Parent.prototype;
		
		var childMethods = {};
		
		if( !opt.fullMix )
			for (var key in childProto){
				if( !opt.keepOwnProto || childProto.hasOwnProperty(key) )
					childMethods[key] = true;
			}
		
		for (var key in parentProto){
			if( parentProto.hasOwnProperty(key) && !childMethods[key] )
				childProto[key] = parentProto[key];
		}
	},
	
	delegate: function(context, methodName, constructor, args){
		methodName = methodName||'constructor';
		
		if( context.prepareConstructorToDelegate )
			constructor = context.prepareConstructorToDelegate(constructor);
		
		return constructor.superclass[methodName].apply(context, args);
	},
	
    overrideMethod: function(Class, methodName, method, Childs){
        // Оставляем оригинальную функцию родителя, в прототипе потомков
		for(var Child in Childs){
			Child = Childs[Child];
			
			if( !Child.prototype.hasOwnProperty(methodName) )
				Child.prototype[methodName] = Class.prototype[methodName];
		}
        
        method.origin = Class.prototype[methodName];
        
		return Class.prototype[methodName] = method;
	},
    
    reOverrideMethod: function(Class, methodName, method){
        var origin = Class.prototype[methodName].origin;
        
        while(origin.origin)
            origin = origin.origin;
        
        method.origin = origin;
        
		return Class.prototype[methodName] = method;
	},
    
    overrideFunc: function(obj, funcName, func){
        func.origin = obj[funcName];
        
		return obj[funcName] = func;
	},
    
    reOverrideFunc: function(obj, funcName, func){
        var origin = obj[funcName].origin;
        
        while(origin.origin)
            origin = origin.origin;
        
        func.origin = origin;
        
		return obj[funcName] = func;
	},
    
	//РАСЧЁТ ПАРАМЕТРОВ
	oddFunc: function(arr, level){
		if( !arr )
			return 0;
		
		var res = arr[1] + arr[2] * Math.pow(level, arr[3]);
		
		if (level == 1) res += arr[0];
		
		return res;
	},
	
	oddFuncReverse: function(arr, res){
		if( !arr )
			return 0;
		
		return Math.pow((res-arr[1])/arr[2], 1/arr[3]);
	},
	
	//Админский суффикс - УДАЛИТЬ!
	getAdmSuffix: function(){
		var params = location.search.substring(1).split('&');
		for(var i in params){
			if(params[i] == 'na'){
				return true;
			}
		}
		return false;
	},
	//объекты и массивы

	//является ли элемент массивом
	isArray: function (foo) {
		return (foo instanceof Array);
	},
	
	// Проверка объекта на пустоту
	isEmpty: function(obj) {
		for (var i in obj) 
			if ( obj.hasOwnProperty(i) ) return false;
		
		return true;
	},
	
	// Количество полей в объекте
	sizeOf: function(obj){
		var count = 0, key;
		for(key in obj) ++count;
		
		return count;
	},
	
    removeFromArray: function(arr, val) {
        arr = arr||[];
        
        val = arr.indexOf(val);
        
        if( val < 0 )
            return [];
        
		return arr.splice(val, 1);
	},
    
	//находится ли элемент в массиве
	inArray: function (arr, val) {
		return (arr||[]).indexOf(val) != -1
	},
	
	inStr: function (str, val) {
		return (str||[]).indexOf(val) != -1
	},
	
	//клонирует объекты и массивы любого уровня вложенности
	clone: function(obj, own){
		if (obj == null) return null;
		
		var newObj = utils.isArray(obj)? []: {};
		for(var i in obj){
			if( own && !obj.hasOwnProperty(i) )
				continue;
			
			if (obj[i] && typeof(obj[i])=='object'){
				if (obj[i].clone) {
					newObj[i] = obj[i].clone();
				} else {
					newObj[i] = this.clone(obj[i], own);
				}
			} else {
				newObj[i] = obj[i];
			}
		}
		return newObj;
	},
	
	cloneBase: function(obj){
		if( obj.cloneBase instanceof Function )
			return obj.cloneBase();
		
		var clone = utils.isArray(obj)? []: {};
		
		for(var i in obj){
			if( obj[i] && obj[i].cloneBase instanceof Function )
				clone[i] = obj[i].cloneBase();
			else if( obj[i] instanceof Object )
				clone[i] = this.cloneBase(obj[i]);
		}
		
		return clone;
	},
	
	isEqual: function(obj1, obj2, compare_func){
		if (obj1 == obj2) return true;
		
		if (utils.sizeOf(obj1) != utils.sizeOf(obj2)) return false;
		
		for (var i in obj1){
			if (typeof(obj1[i]) == 'object' && typeof(obj2[i]) != 'object') return false;
				
			if (typeof(obj1[i]) == 'object'){
				if (!utils.isEqual(obj1[i], obj2[i], compare_func)) return false;
			} else {
				if (compare_func){
					if( compare_func(obj1[i], obj2[i]) )
						return false;
				}
				else if (obj1[i] != obj2[i]) return false;
			}
		}
		
		return true;
	},
	
	isArrsIntersects: function (arr1, arr2){
		if (arr1.length && arr2.length){
			for (var item1 in arr1) {
				item1 = arr1[item1];
				for (var item2 in arr2) {
					item2 = arr2[item2];
					if (item1 == item2) {
						return true;
					}
				}
			}
		}
		return false;
	},
	
	//место, куда кликнули
	getPosFromEvent: function(e, prop){
		prop = prop||'page';
		
		return {x: e[prop+'X'], y: e[prop+'Y']};
	},
	
	//определяем, какая кнопка мыши нажата (Appl.mouseButton)
	getMouseButton: function(e){
		// Для ie
		if (!e.which && e.button) {
			if (e.button & 1) e.which = 1;
			else if (e.button & 4) e.which = 2;
			else if (e.button & 2) e.which = 3;
		}
		
		return e.which;
	},
	
	// Эмитирует событие click, через события tuch
	mobileClick: function(el, opt){
		opt = opt||{};
		opt.cls = '.mob-click' + (opt.cls ? ','+opt.cls : '');
		opt.threshold = opt.threshold||5;
		
		var touchstartX = 0,
			touchstartY = 0;
		
		$(el)
			.on('touchstart', opt.cls, function(event){
				var tuch = event.originalEvent.targetTouches[0];
				
				touchstartX = tuch.screenX;
				touchstartY = tuch.screenY;
			})
			.on('touchend', opt.cls, function(event) {
				var tuch = event.originalEvent.changedTouches[0];
				
				if( Math.abs(touchstartX - tuch.screenX) < opt.threshold && Math.abs(touchstartY - tuch.screenY) < opt.threshold )
					$(this).trigger('click');
			});
	},
	
	//безопасная версия 
	//- ведется стек пройденных объектов и если попадаем на пройденный объект, возвращаем false
	//УДАЛИТЬ ПО ВОЗМОЖНОСТИ. КЛОНИРОВАНИЕМ ДОЛЖНЫ ЗАНИМАТЬСЯ КЛАССЫ!
	cloneFS: function(obj, stack){
		if (!stack) stack = [];
		
		for (var i in stack){
			if (obj==stack[i][0]) return stack[i][0];
		}
		
		var newObj = utils.isArray(obj)? []: {};
		
		stack.push([obj, newObj]);
		
		for(var i in obj){
			newObj[i] = typeof(obj[i])=='object'?this.cloneFS(obj[i], stack):obj[i];
		}
		return newObj;
	},

	//копирование собственных свойств ($.extend копирует в т.ч. функции класса)
	copy: function(to, from){
		return $.extend(to, from);
	},
	
	copyProperties: function(to, from, opt){
		opt = opt||{};
		to = to||{};
		for (var i in from) {
			if (from.hasOwnProperty(i)) {
				if ( from[i] instanceof Object ) {
					if( opt.noObjects ) continue;
					
					if( !utils.isInstance(from[i]) ){
						if (!to[i]) {
							to[i] = from[i];
						} else {
							utils.copyProperties(to[i], from[i], opt);	
						}
						
						continue;
					}
					else if( opt.cloneProp ){
						to[i] = utils.cloneInstance(from[i], opt);
						
						continue;
					}
				}
				
				to[i] = from[i];
			}
		}
		
		return to;
	},

	cloneInstance: function(instance, opt){
		opt = opt||{};
		instance = instance||{};
		
		if( instance.clone instanceof Function )
			return instance.clone();
		
		var clone = instance.constructor ? new instance.constructor() : {};
		
		return utils.copyProperties(clone, instance, opt);
	},

	isInstance: function(obj){
		if (obj == null) return false;
		return obj.__proto__ != undefined;
	},
	
//форматирование
	
	//декодит символы % в урл (возможно уже не нужно 02.02.2017, использовалось при парсенге тегов [t/..., u/...] в тексте)
	decodeURIComponent: function(str) {
		var out = '', arr, i = 0, l, x;
		arr = str.split(/(%(?:D0|D1|3A)%.{2})/);
		//arr = str.split(/(%(?:[A-Z,0-9]{2})%.{2})/);
		for ( l = arr.length; i < l; i++ ) {
			try {
				x = decodeURIComponent( arr[i] );
			} catch (e) {
				x = arr[i];
			}
			out += x;
		}
		return out;
	},
	
	//код по букве
	charToInt: function(l) {
		if(!l)return -1;
		var code = 0;
		for(var i=0; i< l.length; i++){
			code*=26;
			code+=l.charCodeAt(i)-97;
		}
		return code;
	},
		
	//буква по коду
	intToChar: function(numb, count){
		count = count || 1;
		
		if (count == 1) {
			return String.fromCharCode(+numb+97);
		} else {
			var reg0 = ~~(numb/26);
			var reg1 = numb%26;
			
			return String.fromCharCode(reg0+97)+String.fromCharCode(reg1+97);
		}
	},
	
	//число заполненных бит в маске
	bitmapCount: function(bitmap){
		var count = 0;
		var bit = 1;
		while (bitmap >= bit) {
			if (bitmap&bit) {
				count++;
			}
			bit *= 2;
		}
		return count;
	},
	
	//УДАЛИТЬ!
	bin2dec: function(bin, rev) {
		var dec = 0;
		for(var i=0; i<bin.length; i++){
			dec += +bin[i] * Math.pow(2, rev?i:bin.length-i-1);
		}
		return dec;
	},

	dec2bin: function(dec, isReverse, fillTo) {
		// todo: replace to dec.toString(2)
		if (typeof dec == 'undefined') return '';
		var bin = "";
		while (dec != 0) {
			bin = (dec % 2== 0 ? "0": "1") + bin;
			dec = Math.floor(dec / 2);
		}
		while (bin.length < fillTo) {
			bin = '0' + bin;
		}
		if (isReverse) bin = bin.split('').reverse().join('');
		return bin;
	},
	
	dec2arr: function(dec) {
		var arr = {};
		var i = 0;
		while (dec != 0) {
			if (dec % 2 > 0) arr[i] = true;
			dec = Math.floor(dec / 2);
			i++;
		}
		return arr;
	},
	
	calcColor: function(str) {
		var id = utils.getSeedByStr(str);
		
		invwk.setSeed(id);
		invwk.rand();

		var type = utils.toInt(invwk.rand() * 3);

		var rgb = [];
		for(var i = 0; i < 3; i++) {
			rgb[i] = type == i ? utils.toInt(invwk.rand()*50) + 100 /*100-150*/ : utils.toInt(invwk.rand()*105) + 150; /*150-255*/
		};

		return rgb;
	},
	
//форматирование - вывод 
	
	// Отвязываем строку от ссылки на родительские строки
	clearString: function(str){
		return str.split('').join('');
	},
	
	//дополнить число нулём спереди до 2х знаков
	twoDigits: function(i){
		if (typeof(i) == 'string') {
			while (i.length<2) {
				i = '0' + i;
			}
			return i;
		}
		return i<10 ? '0'+i : i;
	},
	
	//выводить дополнить строку нулями спереди
	prepZero: function(i, n) {
		i = '' + i;
		while(i.length < n){
			i = '0' + i;
		}
		return i;
	},
	
	//сделать первую букву прописной
	upFirstLetter: function(text){
		return text.charAt(0).toUpperCase()+text.slice(1);
	},
	
	//сделать первую букву строчной
	downFirstLetter: function(text){
		return text.charAt(0).toLowerCase()+text.slice(1);
	},
	
	//вывод денег с K и M
	KMFloor: function (num, rank, stages) {
		if( typeof(rank) != 'string' )
			rank = utils.selectKMSign(num);
		
		rank = rank||'';
		
		if (rank == 'M')
            num = utils.toInt(num / 1e6);
		else if (rank == 'K')
            num = utils.toInt(num / 1e3);
		else
            num = utils.toInt(num);
		
		if( stages )
            num = utils.stages(num);
		
		return num + rank;
	},
	
	prepCount: function(count){
		count = count||0;
		var sign = utils.selectKMSign(count);
		return sign? utils.KMFloor(count): utils.stages(count);
	},
	
	selectKMSign: function(num, minK, minM) {
		num = Math.abs(num);
		
		if( num >= (minM||1e7) )
            return 'M';
		if( num >= (minK||1e4) )
            return 'K';
		
		return '';
	},
	
	//вывод числа с округление и отбрасыванием после знака
	toFixed: function(val, dec, simpleFixed){
		if( dec === undefined ) return utils.toInt(val);
		else if( dec == 0 || simpleFixed ) return (+val||0).toFixed(dec);
		
		var mult = Math.pow(10, dec);
		return ( utils.toInt(val*mult) / mult).toFixed(dec);
	},
	
	toInt: function(val){
		if( Math.abs(val) > 2e9 )
			return val < 0 ? Math.ceil(val) : Math.floor(val);
		else
			return val|0; // Работает быстрее чем ceil и floor, но только с числами не больше 32-х разрядов
	},
	
	//добавляем знак и фиксим
	signFixed: function (num, fix, simpleFixed) {
		return (num>0?'+':'')+utils.toFixed(num, fix, simpleFixed);
	},

	//общая функция для форматирования чисел
	formatNum: (function(){
        var result, sign, km, base, stages;
        
        return function(num, opt){
            opt = opt||{};
            
            result = sign = km = base = '';
            stages = opt.stages;

            if( opt.abs )
                num = Math.abs(num);

            if( opt.epsilon )
                num += Appl.C_EPSILON1000;

            if( opt.sign )
                sign = num > 0 ? '+': (opt.int && num && Math.abs(num) < 1 ? '-' : '');

            if( opt.KM ){
                km = utils.selectKMSign(num, opt.KM.minK, opt.KM.minM);

                if( km )
                    num /= km == 'M' ? 1e6 : 1e3;
            }

            if( opt.toPercent )
                num *= 100;

            if( opt.servRound ){
                if( opt.servRound === true )
                    delete opt.servRound;

                num = utils.servRound(num, opt.servRound);
            }
            
            if( opt.base ){
                base = Math.pow(10, opt.base);

                num *= base;
            }

            if( opt.floor )
                num = Math.floor(num);
            if( opt.round )
                num = Math.round(num);
            if( opt.ceil )
                num = Math.ceil(num);
            if( opt.int )
                num = utils.toInt(num);
            if( opt.base )
                num /= base;

            if( opt.mixed ){
                if ( Math.abs(num) >= 1e3 ){
                    stages = true;
                    
                    num = opt.fixStages && opt.fixed ? num.toFixed(opt.fixed) : utils.toInt(num);
                    
                    result += num;
                }
                else{
                    if( opt.fixed === undefined ){
                        if( opt.uFixed === undefined )
                            result += '' + num;
                        else
                            result += utils.toFixed(num, opt.uFixed);
                    }
                    else
                        result += num.toFixed(opt.fixed);
                }
            }
            else if( opt.fixed !== undefined )
                result += num.toFixed(opt.fixed);
            else if( opt.uFixed !== undefined )
                result += utils.toFixed(num, opt.uFixed); // Строгое округление (отброс остатка до нужного знака)
            else
                result += num;
            
            /* Преобразовываем числа вида 1.0 ... 1.000 к 1 */
            if( opt.toNum )
                result = +result;
            
            if( stages )
                result = utils.stages(result);
            
            if( sign )
                result = sign + result;
            
            // Иногда бывает нужно вставить, что-то после знака. К примеру иконку.
            if( opt.signPostFix && (result[0] == '+' || result[0] == '-') )
                result = result.replace(result[0], result[0]+opt.signPostFix);

            /*КМ*/
            if( km )
                result += km;
            
            return result;
        };
    })(),
	
	//дробь в проценты
	toPercent: function(val, dec) {
		val *= 100.001;
		
		return dec ? utils.toFixed(val, dec) : utils.toInt(val);
	},
	
	fixDecimal: function(val){
		return Math.round(val * 100) / 100;
	},
	
	//разбиваем на группы
	stages: function(num) {
		if( typeof(num) == 'string' && utils.inStr(num, ' ') )
			return num;
		
		num = '' + num;
		
		var numDec = utils.getDec(num),
			numReg = '',
			part = '',
			sign = '';
		
		if( num < 0 ){
			sign = '-';
			
			num *= -1;
		}
		
		num = '' + utils.toInt(num);
		
		while(part = num.slice(-3)){
			numReg = part + ' ' + numReg;
			
			num = num.slice(0, -3);
		}
		
		return sign + numReg.slice(0, -1) + numDec;
	},
	
	// Возвращает дробную часть числа. (с точкой)
	getDec: function(num) {
		return ('' + num).replace(/[0-9,-]+\d*/, '');
	},
	
	// Hex строка в rgb_a (a необязательная компонента)
	hexToRGB_A: function(hex, noAlphaNormalize){
		if( typeof(hex) !== 'string' ) 
			return false;
		
		if( hex[0] == '#' )
			hex = hex.replace('#');
		
		var rgb_a = {};
		
		if( hex.length > 6 ){
			var a = hex.slice(-2);
			
			hex = hex.slice(0, -2);
		}
		
		hex = parseInt(hex, 16);
		
		rgb_a.r = hex >> 16;
		rgb_a.g = hex >> 8 & 255;
		rgb_a.b = hex & 255;
		
		if( a !== undefined ){
			rgb_a.a = parseInt(a, 16);
			
			if( !noAlphaNormalize )
				rgb_a.a = rgb_a.a/255;
		}
		
		return rgb_a;
	},
	
	// Расчитать цветовой градиент
	calcGradByPercent: function(percent, palette){
		palette = palette||[
			// Стандартный градиент (красный --> желтый --> зеленый)
			{
				// range - необязательный параметр границы градиента ({start:20, end:50}). Если отсутствует, вычисляеться автоматически и равномерно распределяеться между всеми элементами палитры
				from: [255,0,0], // У первого элемента палитры свойство from обязательно!
				to: [255,255,0]
			},
			{
				// Если не указано from, то береться из свойства to предыдущего элемента палитры (плавная цепочка градиентов)
				to: [0,255,0]
			}
		];
		
		var _calcRGB_A = function(percent, grad){
			percent *= 0.01;
			
			var	rangeStart = grad.range.start * 0.01,
				rangeEnd = grad.range.end * 0.01,
				colorFrom,
				colorTo,
				val,
				rgb_a = [];
			
			// rangeEnd всегда должно быть больше rangeStart
			percent = (percent - rangeStart) / (rangeEnd - rangeStart);
			
			if( typeof(grad.from) === 'string' )
				grad.from = utils.hexToRGB_A(grad.from, true);
			
			if( typeof(grad.to) === 'string' )
				grad.to = utils.hexToRGB_A(grad.to, true);
			
			var colorComps = utils.sizeOf(grad.to) > utils.sizeOf(grad.from) ? grad.to : grad.from,
				hasAlpha = utils.sizeOf(colorComps) > 3;
			
			for(var colorComp in colorComps){
				colorFrom = grad.from[colorComp];
				colorTo = grad.to[colorComp];
				
				// Компонента альфа канала может отсутствовать у одного из цветов градиента
				if( hasAlpha ){
					if( colorFrom === undefined ) colorFrom = 255;
					if( colorTo === undefined ) colorTo = colorFrom;
				}
				
				if( percent < 0 )
					val = colorFrom;
				else if( percent > 1 )
					val = colorTo;
				else{
					val = colorFrom - colorTo;
					
					if( val > 0 )
						val = utils.toInt(colorFrom - val*percent);
					else if( val < 0 )
						val = utils.toInt(colorFrom + (colorTo-colorFrom)*percent);
					else
						val = colorFrom;
				}
				
				rgb_a.push(Math.min(val, 255));
			}
			
			if( hasAlpha )
				rgb_a[colorComp] = utils.servRound(rgb_a[colorComp]/255, 3);
			
			return rgb_a;
		};
		
		var gradRange = Math.round(100/utils.sizeOf(palette)),
			grad;
		
		for(var gradIndex in palette){
			gradIndex = +gradIndex;
			
			grad = palette[gradIndex];
			
			grad.range = grad.range||{
				start: gradIndex * gradRange, 
				end: (1 + gradIndex) * gradRange
			};
			
			// Выбираем градиент из палитры в диапазон которого попало значение процента
			if( grad.range.start >= percent || grad.range.end >= percent )
				break;
		}
		
		if( !grad.from )
			grad.from = palette[gradIndex-1].to;
		
		var rgb_a = _calcRGB_A(percent, grad);
		
		return 'rgb'+(utils.sizeOf(rgb_a)>3?'a':'')+'('+rgb_a.join(',')+')';
	},
	
	//убираем спецсимволы
	unescapeHtml: function(str){
		return (str||'')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&rsquo;/g,"'")
			.replace(/&#39;/g, "'")
			.replace(/&#039;/g, "'")
			.replace(/&#92;/g, '\\');
	},
	
	// Вставляем спецсимволы
	escapeHtml: function(str){
		return str
			.replace(/[&]/g, '&amp;')
			.replace(/[<]/g, '&lt;')
			.replace(/[>]/g, '&gt;')
			.replace(/["]/g, '&quot;')
			.replace(/[']/g, "&#39;")
			.replace(/[\\]/g, "&#92;")
			.replace(/[\/]/g, "&#47;");
	},
	
	escapeHtmlChat: function(str){
		return str
			.replace(/[&]/g, '&amp;')
			.replace(/[<]/g, '&lt;')
			.replace(/[>]/g, '&gt;')
			.replace(/["]/g, '&quot;')
			.replace(/[']/g, "&#39;")
			.replace(/[\\]/g, "&#92;");
	},
	
	escapeHtmlChatMess: function(str){
		return str
			.replace(/[&]/g, '&amp;')
			.replace(/[<]/g, '&lt;')
			.replace(/[>]/g, '&gt;')
			.replace(/["]/g, '&quot;')
			.replace(/[']/g, '&rsquo;')
			.replace(/[\\]/g, '&#92;');
	},
	
	escapeRegExp: function(str){
		return (str||'').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	},
	
	//название константы по её коду
	cnstName: function(cnstBlock, val){
		for (var name in cnstBlock) {
			if (cnstBlock[name] == val) {
				return name;	
			}
		}
		return '';
	},   
    
    createNames: function(from, to){
		for (var name in from) {
			to[from[name]] = name;
		}
	},
    
	createIds: function(from, to, field){
		if (!field) field = 'name';
		for (var id in from) {
			to[from[id][field]] = +id;
		}
	},

	htmlToText: function(html, opt){
		if( !html )
			return '';
		
		opt = opt||{};
		
		// Разделяет текст внутри тегов разделителем
		if( opt.separator )
			html = html.split('</').join(opt.separator + '</');
		
		html = $('<div>'+html+'</div>').text();
		
		if( opt.separator )
			html = html.replace(new RegExp(opt.separator+'{1,}', 'g'), opt.separator);
			
		return html;
	},
	
	makeAttrStr: function(attrs, prefix){
		if( !attrs ) return '';
		
		if( !(attrs instanceof Object) ) 
			return attrs;
		
		if( utils.isArray(attrs) )
			return  ' '+attrs.join(' ')+' ';
		
		var attrsArr = [];
		for(var attr in attrs)
			attrsArr.push((prefix||'')+attr+'="'+attrs[attr]+'"');
			
		return utils.makeAttrStr(attrsArr);
	},
	
	makeDataAttrStr: function(attrs){
		return utils.makeAttrStr(attrs, 'data-');
	},
	
//парсеры - УДАЛЯТЬ ПРИ ПЕРВОЙ ВОЗМОЖНОСТИ!
	
	//парсим строку. ПЕРЕНЕСТИ В ResLIST!
	parseResString: function(str){
		var result = [];
		
		if (str) {
			var arr = str.split('^');
			arr.pop();
			for (var i in arr) {
				var resId = utils.charToInt(arr[i].charAt(0));
				result[resId] = parseFloat(arr[i].substr(1));
			}
		}
		
		return result;
	},
	
	
	parseString: function(str, char){
		var result = [];
		
		if (str) {
			var arr = str.split(char);
			
			for (var item in arr) {
				item = arr[item];
				var i = +item[1] != item[1] ? 2 : 1;
					
				var id = utils.charToInt(item.substr(0,i));
				var val = +item.substr(i);
				
				result[id] = val;
			}
		}
		return result;
	},
	
	
	//переводим строку армии в объект
	armyStrToObj: function(s, pos, getAll) {
		var newArmy = [];
		if (s) {
			var army = s ? s.split('-') : '';
			for (var i =0; i< army.length; i++) {
				if (army[i]) {
					var id = utils.charToInt(army[i][0] + army[i][1]);
					if(!getAll && lib.units.list.length <= id) continue;
					if(army[i].length == 2){
						i++;
						var count = -army[i];
					} else {
						var count = +(army[i].substring(2, army[i].length));
					}
					if(!pos){
						newArmy[id] = count;
					} else {
						newArmy.push({id: id, count: count});
					}
				}
			}
		}
		return newArmy;
	},
	
	splitPosArr: function(arr){
		return {
			o: arr[0],
			x: arr[1],
			y: arr[2]
		};
	},
	
	splitTownArr: function(a, b){
		if ( typeof(a) == 'object' ){
			return {
				id: a[0],
				name: a[1],
				account: a[2]
			};
		} else {
			return {
				id: a,
				name: b[0],
				account: b[1]
			};
		}
	},
	
	splitAccountArr: function(a, b){
		
		if( typeof(a) == 'object' )
		{
			if(a.length==3 || isNaN(a[0])){
				a.splice(0,0,-1);
			}

			return {
				id: a[0],
				name: a[1],
				sex: a[2],
				race: a[3]
			};
		}
		else
		{
			return {
				id: a,
				name: b[0],
				sex: b[1],
				race: b[2]
			};
		}
	},
	
//HTML/CSS

	//очистка формы
	clearForm: function($form, opt){
		opt = opt||{};
		opt.triggers = ['input'].concat(opt.triggers||[]);
		
		$form = $($form);
		
		if( opt.noDefVal )
			$form.find('input').removeAttr('value');
			
		$form.get(0).reset();
		
		$form.find('textarea').val('');
		
		for(var trigger in opt.triggers)
			$form.find('textarea, input').trigger(opt.triggers[trigger]);
	},
	
	//включение-отключение аттрибута
	toggleAttr: function(elem, attr, val){
		if( val === 'undefined' )
			val = elem.attr(attr) === undefined;
		
		if( val ){
			elem.attr(attr, attr);
			elem.prop(attr, attr);
		}
		else{
			elem.removeAttr(attr);
			elem.removeProp(attr);
		}
	},
	
	//счётчик знаков в инпутах 
	assignLengthCounter: function(textElem, max, counter){
		$(textElem).on('input', function(){
			var text = $(this).val(),
				rest = max - text.length;
			
			if( rest < 0 )
				$(this).val( text.slice(0, rest) );
			
			$(counter).text(Math.max(0, rest));
		}).trigger('input');
	},
	
	textSelection: function(el){
		el = $(el).get(0);
		
		if( !el )
			return;
		
		if( window.getSelection ){  
			var s = window.getSelection();
            
			if( s.setBaseAndExtent ){
				s.setBaseAndExtent(el, 0, el, 1);  
			}
			else{  
				var r = document.createRange();  
				r.selectNodeContents(el);  
				s.removeAllRanges();  
				s.addRange(r);
			}
		}
		else if( document.getSelection ){
			var s = document.getSelection(),  
                r = document.createRange(); 
            
			r.selectNodeContents(el);  
			s.removeAllRanges();  
			s.addRange(r);  
		}
		else if( document.selection ){
			var r = document.body.createTextRange();
            
			r.moveToElementText(el);
			r.select();
		}
	},
	
	lenLim: function(text, opt){
		opt = opt||{};
		opt.length = opt.length||50;
		opt.end = opt.end||'...';
		
		text = text||'';
		
		if( text.length > opt.length ){
			var cutText = utils.escapeHtml(text.slice(0, opt.length)) + opt.end;
			
			if( opt.noWrp )
				text = cutText;
			else
				text = snip.wrp((opt.noDecor ? '' : 'fakelink ') + 'js-tooltip', cutText, false, ['data-tooltip-wnd="text"', 'data-tooltip-text="'+utils.escapeHtml(text)+'"']);
		}
		
		return text;
	},
	
	isEclipsed: function(el){
		return el.scrollWidth > el.clientWidth;
	},
	
//УРЛ
	
	urlToObj: function(url, noLocation) {
		var params = {};
		
		if( noLocation ){
			url = url || '';
			
			if( !url ) return params;
		}
		else
			url = url || document.location.search;
		
		if (url[0] == '?' || url[0] == '#') url = url.slice(1); //отрубаем вопросительный знак
		
		var arr = url.split('&');
		for (var i in arr) {
			if (arr[i].indexOf('=') == -1){
				params[arr[i]] = true;//если параметр без значения, пинаем true
			} else {
				var part = arr[i].split('=');
				params[part[0]] = decodeURIComponent(part[1].replace(/[+]/g, ' '));//правим все плюсы
			}
		}
		return params;
	},
	
	urlToObj2: function(url) {
		//обработка полной ссылки (путь+ параметры)
		url = url.split('?');
		if ( url[1] ) {
			var path = url[0];
			
			url = url[1].split('#');
			
			var get = utils.urlToObj(url[0]);
			var hash = url.length > 1? utils.urlToObj(url[1]): {};
		} else {
			url = url[0].split('#');
			
			var path = url[0];
			var get = {};
			var hash = url.length > 1? utils.urlToObj(url[1]): {};
		}
		return {
			path: path,
			get: get,
			hash: hash}
	},
	
	// checkSame проверять наличие уже присутствуещих свойств. Если есть заносить в объект с постфиксом _(index)
	serializeToObject: function(str, checkSame) {
		var params = {};
		
		if( !str ) return params;
		
		var arr = str.split('&');
		var index = 0;
		for (var i in arr) {
			var part = arr[i].split('=');
			if( params[part[0]] !== undefined && checkSame )
				part[0] += '_' + (index++);
			
			params[part[0]] = decodeURIComponent(part[1].replace(/[+]/g, ' ')); // Правим все плюсы	
		}
		return params;
	},
	
	getHashParams: function(param){
		var hashObj = utils.urlToObj(location.search);
		return param ? hashObj[param] : hashObj;
	},
	
	objToUrl: function(obj){
		var url = '';
		for(var param in obj){
			url += param+'='+obj[param]+'&';
		}
		return url.substr(0, url.length-1);
	},
	
	objToUrl2: function(obj){
		var url = obj.path;
		if (utils.sizeOf(obj.get)) url += '?' + utils.objToUrl(obj.get);
		if (utils.sizeOf(obj.hash)) url += '#' + utils.objToUrl(obj.hash);
		return url;
	},
	//маски
	//есть ли маска в маске
	hasMask: function(mask, baseMask){
		return ((mask||0)&(baseMask||0)) > 0;
	},

	//есть ли индекс в маске
	inMask: function(ind, mask){
		return ((1<<ind)&(mask||0)) > 0;
	},
	
	// Переключает индекс в маске
	toggleMask: function(ind, mask){
		return  mask^(1<<ind);
	},
	
	// Выключить индекс в маске
	offMask: function(ind, mask){
		if( utils.inMask(ind, mask) )
			return utils.toggleMask(ind, mask);
			
		return mask;
	},
	
	onMask: function(ind, mask){
		return mask|(1<<ind);
	},
	

	
// Проверки переменных

	isTrue: function(variable){
		return variable === true;
	},
	
	isFalse: function(variable){
		return variable === false;
	},

	isNull: function(variable){
		return variable === null;
	},
	
	isUndf: function(variable){
		return variable === undefined;
	},
	
//разное
	
	random: function(n){
		var rnd = Math.random();
		if (rnd == 1) rnd = 0;
		return ~~(rnd*n);
	},
	
	randomSeed: function(n){
		return ~~(invwk.rand()*n);
	},
	
	//раскраска цвета побуквенно
	colorGoogle: function(str){
		var blue = '#4285F4';
		var red = '#EA4335';
		var yellow = '#FBBC05';
		var green = '#34A853'
		var colors = [blue, red, yellow, blue, green, red, yellow, green];
		
		var strColor = '';
		for(var char=0; char<str.length; char++){
			strColor += '<span style="color:'+colors[char%colors.length]+'">'+str[char]+'</span>'
		}
		
		return strColor;
	},
	
	//из-за дерьмовых телефонов не умеющих считать логарифмы
	log10: function(int){
		if (Math.log10){
			return Math.log10(int);
		} else {
			//пиздец красота!
			return (int).toString().length-1;
		}
	},
	
	nullToArr: function(smth){
		return smth == null? []: smth;
	},
	
	objToArr: function(obj, sortFunc){
		var arr = [];
		for (var i in obj){
			arr.push(obj[i]);
		}
		
		if( sortFunc ){
			arr.sort(function(a, b){
				return sortFunc(a, b);
			});
		}
		
		return arr;
	},
	
	// toKeys - если истина, значения массива становятся ключами объекта. Объекты игнорируются.ы
	arrToObj: function(arr, toKeys, val){
		var obj = {};
		if( toKeys ){
			for (var i in arr){
				if( !(arr[i] instanceof Object) )
					obj[arr[i]] = (val === undefined ? arr[i] : val);
			}
		}
		else{
			for (var i in arr)
				obj[arr[i].id] = arr[i];
		}
			
		return obj;
	},
	
	calcObjSum: function(obj){
		var sum = 0;
		for (var i in obj){
			sum += obj[i];
		}
		return sum;
	},
	
	noPx: function(val){
		if (!val) return 0;
		return +val.slice(0, val.length-2)
	},
	
	nobr: function(text) {
		return text.replace(/<br>/g, ' ');
	},
	
	// Длина строки в байтах
	getStrByteLength: function(str) {
		var length = str.length, count = 0, i = 0, ch = 0;
		for(i; i < length; i++){
			ch = str.charCodeAt(i);
			if(ch <= 127){
			   count++;
			}else if(ch <= 2047){
			   count += 2;
			}else if(ch <= 65535){
			   count += 3;
			}else if(ch <= 2097151){
			   count += 4;
			}else if(ch <= 67108863){
			   count += 5;
			}else{
			   count += 6;
			}
		}
		return count;
	},
	
	getSeedByStr: function(str){
		
		var seed = 1;
		for (var i = 0; i < str.length; i ++) {
			seed += +str.charCodeAt(i);
		}
		return seed;
	},
	
	getElemSize: function($cont, opt){
		opt = opt||{};
		
		var size,
			isHidden = $cont.is(':hidden');
		
		if( isHidden && opt.ignoreHidden ){
			isHidden = false;
			
			size = {width: 0, height: 0};
		}
		
		if( isHidden ){
			var hiddenNodes = [],
                $el,
				style = 'visibility: hidden!important; display: ' + (opt.display||'block') + '!important;';
			
			$cont.parents().addBack().filter(':hidden').each(function(){
				$el = $(this);
				
				if( $el.css('display') != 'none' )
					return;
				
				var node = {
					$node: $el,
					style: $el.attr('style')
				};
                
				hiddenNodes.push(node);

				$el.attr('style', node.style ? node.style + ';' + style : style);
			});
		}
		
		size = size||(opt.getSize||function($cont){
			return {width: $cont.width(), height: $cont.height()};
		})($cont);
		
		if( opt.callback )
			opt.callback($cont, size);
		
		if( isHidden ){
			for(var hiddenNode in hiddenNodes){
				hiddenNode = hiddenNodes[hiddenNode];
				
				if( hiddenNode.style === undefined )
					hiddenNode.$node.removeAttr('style');
				else
					hiddenNode.$node.attr('style', hiddenNode.style);
			}
		}
		
		return size;
	},
	
	inDOM: function(el){
		return el && document.contains ? document.contains(el) : false;
	},
	
	adjustBlocksHeight: function($wrp, cls, callback){
		var groups = [],
			groupI = -1,
			oldOffset = -1;
		
		if( cls )
			$wrp = $wrp.find(cls);
		
		$wrp.each(function(){
			var $this = $(this).css('min-height', ''),
				offsetTop = utils.toInt($this.offset().top);

			if( oldOffset != offsetTop ){
				++groupI;
				
				groups[groupI] = [];
				
				oldOffset = offsetTop;
			}

			if( groupI < 0 )
				return;
			
			if( callback )
				callback($this);
			
			groups[groupI].push($this);
		});
		
		if( !groups.length )
			return;
		
		for(var group in groups){
			group = groups[group];

			var maxHeight = -1;

			for(var elem in group)
				maxHeight = Math.max(group[elem].height(), maxHeight);

			for(var elem in group)
				group[elem].css('min-height', maxHeight);
		}
	},
	
	adjustBlocksWidth: function($wrp, cls, callback){
		var groups = [],
			groupI = -1,
			oldOffset = -1;
		
		if( cls )
			$wrp = $wrp.find(cls);
		
		$wrp.each(function(){
			var $this = $(this).css('min-width', ''),
				offsetTop = utils.toInt($this.offset().top);
				
			if( oldOffset != offsetTop ){
				++groupI;
				
				groups[groupI] = [];
				
				oldOffset = offsetTop;
			}

			if( groupI < 0 )
				return;
			
			if( callback )
				callback($this);
			
			groups[groupI].push($this);
		});
		
		if( !groups.length )
			return;
		
		for(var group in groups){
			group = groups[group];

			var maxHeight = -1;

			for(var elem in group)
				maxHeight = Math.max(group[elem].width(), maxHeight);

			for(var elem in group)
				group[elem].css('min-width', maxHeight);
		}
	},
	
    animateCSS: function(el, restartDelay){
        var $el = $(el), event = '';
        
        $el.removeClass('-run-animation');
        
        void el.offsetWidth; // triggering reflow
        
        if( wndMgr.document.onanimationend !== undefined )
            event = 'animationend';
        else if( wndMgr.document.onwebkitanimationend !== undefined )
            event = 'webkitAnimationEnd';
        
        
        // По завершению анимации сбрасываем класс, чтобы небыло случайных анимаций после использования display: none
        if( event ){
            $el.off(event).one(event, function(){
                $el.removeClass('-run-animation');
            });
        }
        else{
            clearTimeout(el._animTO_);
            
            el._animTO_ = setTimeout(function(){
                $el.removeClass('-run-animation');
            }, restartDelay);
        }
        
        $el.addClass('-run-animation');
    },
    
	animateElem: (function(){
		if( typeof(document) != 'object' )
			return function(){}; // В воркере нет объекта document
		
		var isHardwareAnimationAvailable = !!(document.documentElement.animate && document.documentElement.style); 
		
		return function(el, opt){
			opt = opt||{};

			if( !el || !opt.endCSS )
				return;
			
			var animOpt = utils.copy({duration: 250, easing: 'ease'}, opt.anim);
			
			if( !isHardwareAnimationAvailable ){
				$(el).animate(opt.endCSS, animOpt.duration, opt.callback);

				return;
			}
			
			if( el instanceof jQuery ){
				el.each(function(){
					utils.animateElem(this, opt);
				});

				return;
			}

			var initCSS = opt.initCSS, 
				endCSS = opt.endCSS;

			if( !initCSS ){
				initCSS = {};

				for(var style in endCSS)
					initCSS[style] = el.style[style]||0;
			}

			var isActualCss = true;

			for(var style in endCSS){
				if( endCSS[style] == initCSS[style] )
					continue;
				else
					isActualCss = false;

				el.style[style] = endCSS[style];
			}

			if( isActualCss )
				return;

			var keyframes = [initCSS, endCSS];

			var animation = el.animate(keyframes, animOpt);

			if( opt.callback ){
				if( animation.onfinish !== undefined )
					animation.onfinish = opt.callback.bind(el);
				else
					setTimeout(opt.callback.bind(el), animOpt.duration);
			}
		};
	}()),
	
	getWindowWidth: function(val, minVal){
		minVal = minVal === undefined ? 550 : minVal;
		
		var width = Math.max($(window).width(), minVal) + utils.toInt(val);
		
		return width;
	},
	
	/*
	 * 
	 * @param {number} val - не обязательный параметр, добавляется к возвращаемой высоте
	 * @returns {String} - возвращает высоту клиентской части браузера
	 */
	getWindowHeight: function(val, minVal){
		minVal = minVal === undefined ? 550 : minVal;
		
		var height = Math.max($(window).height(), minVal) + utils.toInt(val);
		
		if ((wndMgr.interfaces.town||{}).friends && wndMgr.interfaces.town.friends.cont)
			height -= wndMgr.interfaces.town.friends.cont.height();
		
		return height;
	},
	
	getDocWidth: function(val, minVal){
		minVal = minVal === undefined ? 550 : minVal;
		
		var width = Math.max($(document).width(), minVal) + utils.toInt(val);
		
		return width;
	},
	
	getDocHeight: function(val, minVal){
		minVal = minVal === undefined ? 550 : minVal;
		
		var height = Math.max($(document).height(), minVal) + utils.toInt(val);
		
		if ((wndMgr.interfaces.town||{}).friends && wndMgr.interfaces.town.friends.cont)
			height -= wndMgr.interfaces.town.friends.cont.height();
		
		return height;
	},
	
	isDocVisible: function(){
		return document.visibilityState != 'hidden';
	},
	
	/*
		арифметические операции над каждым членом массива или объекта
		obj1 - объект, массив
		obj2 - объект или число, если obj1 - объект, массив или число, если obj1 - массив
		action - один из +-/*
		!obj1.length <= obj2.length, поля obj1 должны присутствовать в obj2
	*/
	objMath: function(obj1, action, obj2){
		var obj3 = utils.isArray(obj1) ? []: {};
		for(var i in obj1) {
			var obj1i = obj1[i];
			var obj2i = obj2 instanceof Object ? obj2[i] : obj2;
			
			switch(action){
				case '+':
					obj3[i] = obj1i + obj2i;
					break;
				case '-':
					obj3[i] = obj1i - obj2i;
					break;
				case '/':
					obj3[i] = obj1i / obj2i;
					break;
				case '*':
					obj3[i] = obj1i * obj2i;
					break;
			}
		}
		
		return obj3;
	},
	
	chClass: function(el, prefix, val) {
		var className = el.attr('class');
		var ind0 = className.indexOf(prefix);
		if(ind0 != -1){
			var ind1 = className.indexOf(' ', ind0);
			className = className.substring(ind0, ind1);
		}
		el.attr('class', className+' '+prefix+val);
	},
	
	servRound: function(val, dec) {
		return +utils.toFixed(val, dec||5, true); // Округляем в 5-м знаке (вроде совпадает с серверными значениями)
	},
	
	genLimitName: function(limit, opt){
		opt = opt||{};
		
		limit = limit||9999;
		
		while( true ){
			var name = utils.genName(opt.sex, opt.name, opt);
			
			if( name.length <= limit )
				break;
		}
		
		return name;
	},
	
	genName: function(sex, name, opt){
		opt = opt||{};
		
		if( sex ){
			var list1 = opt.m1||'Great, Bloody, Almighty, Unbeatable, Adamant, Defiant, Strongest, Kind, Evil, Enlightened, Important, Victorious, Godlike, Secretive, Just, Relentless, Strict, Formidable, Courageous, Moon-faced, Mysterious, Plucky, Merciful, Belligerent, Honest, Enigmatic, Wise, Sly, Cunning, Greedy, Sensible, Tireless, Insuperable, Fearless, Ruthless, Charming, Narcissistic, Peace-loving, Free, Energetic, Cheerful, Friendly, Meticulous, August, Mournful, Vigilant, Watchful, Trained, Wild, Sinful, Righteous, Dark, Black, Light, Pious, Incomparable, Noble, Dirty, Cruel, Long-armed, Long-legged, Eloquent, Spoony, Quiet, Noisy, Chip-toothed, Bright-eyed, Golden-haired, Red-haired, Handsome, Horrible, Sinister, Fat, Thin, Aromatic, Nautical, Arctic, Desert, Steppe, Southern, Northern, Eastern, Western, Raucous, Blinding, Impetuous, Decisive, Sensuous, Wondrous, Breathtaking, Bright, Attentive, Fateful, Attractive, Sincere, Honest, Sturdy, Proper, Worthy, Stylish, Fashionable, Bold, Ribald, Jaunty, Glorious, Intense, Desired, Wondrous, Long-awaited, Stormy, Cheerful, Beckoning, Exotic, Carefree, Clever, Manly, Starry, Proud, Neat, Magical, Genteel, Lively, Amiable, Pompous, Inspired, Exuberant, Enthusiastic, Goal-oriented, Fabulous, Captivating, Enchanting, Demanding, Radiant, Stately, Grand, Dear, Serious, Astute, Jealous, Meaningful, Polite, Powerful, Unbeatable, Happy, True, Shining, Forgiving, Benevolent, Tanned, Almighty, Authoritative, Authentic, Pragmatic, Ardent, Stubborn, Courteous, Epic, Elegant, Pleasant, Reckless, Enamored, Swarthy, Smiling, Hospitable, Content, Cocky, Crafty, Feckless, Brave, Warm-hearted, Fresh, Nonchalant, Enigmatic, Rebellious, Diligent, Talented, Romantic, Seductive, Divine, Astonishing, Splendid, Great, Blessed, Captivating, Unforgettable, Wonderful, Daring, Experienced, Able, Sympathetic, Plucky, Impetuous, Tough, Emotional, Adamant, Deft, Wise, Sensitive, Clean, Luxurious, Lucky, Diplomatic, Cordial, Capable, Well-groomed, Gifted, Enthusiastic, Refined, Understanding, Modest, Complex, Reliable, Flippant, Generous, Passionate, Lascivious, Caring, Perfect, Shy, Faithful, Mysterious, Convincing, Impulsive, Cunning, Assertive, False, Freedom-loving, Harsh, Strong, Fighting, Peaceful, Primeval, Existential, Aggressive, Negligent, Civil, Mighty, Impenetrable, Inconceivable, Friendly, Hardcore, Willful, Incomparable, Beloved, Entrancing, Mutinous, Superstitious, Magnetic, Stunning, Resplendent, Evolved, Merciful, Grateful, Rollicking, Excellent, Ingenius, Exceptional, Flawless, Tactful, Unearthly, Likeable, Skillful, Charismatic, Sociable, Musky, Exciting, Resilient, Worldly, Noble, Strong-willed, Careful, Ideal, Impossible, Spontaneous, Raucous, Eminent, Handsome, Ubiquitous, Sincere, Playful, Distinguished, Famous, Businesslike, Energetic, Superb, Mischievous, Lyrical, Curious, Practical, Staggering, Immaculate, Seasoned, Trusting, Calm, Humane, Harmonious, Zealous, Delightful, Incorruptible, Unapproachable, Merry, Boisterous, Open, Intriguing, Intrusive, Impulsive, Natural, Frank, Exceptional, Indescribable, Predictable, Quick-tempered, Good-natured, Susceptible, Hospitable, Gallant, Stingy, Inimitable, Sweet, Tireless, Hardworking, Ambitious, Humble, Blinding, Vulnerable, Affectionate, Overwhelming, Typical, Magnificent, Sure, Tried-and-true, Irresistible, Exuberant, Foolish, Impressive, Thrilling, Sweet-voiced, Dizzying, Extraordinary, Witty, Intelligent, Dear, Inspiring, Laid-back, Shrewd, Unrivaled, Innovative, Forgetful, Ironic, Remarkable, Phenomenal, Impish, Selfish, Nimble, Charitable, Thrifty, Selfless, Eloquent, Conflicted, Self-sufficient, Valiant, Loving, Lucky, Bright, Heady, Sharp, Necessary, Patrician, Incredible, Encouraging, Defiant, Likeable, Professional, Liberal, Spectacular, Naughty, Elusive, Venerable, Essential';
			var list2 = opt.m2||'Artist, Sculptor, Mason, Creator, Landlord, Philosopher, Scholiast, Student, Founder, Professor, Postgraduate, Sage, Treasurer, Leader, Battlemaster, Warlord, Gendarme, Nobleman, Librarian, Bookworm, Archivist, Bookman, Astronomer, Astrologer, Researcher, Stargazer, Academic, Disciple, Lab Technician, Test Subject, Researcher, Experimentalist, Scholar, Doctor, Physician, Patient, Crash Test Dummy, Dilettante, Vanguard, Gatherer, Collector, Elder, Groom, Fellow, Guy, Hayseed, Woodcutter, Lumberjack, Carpenter, Skinner, Woodworker, House Painter, Locksmith, Herbalist, Potter, Janissary, Baker, Bread Maker, Confectioner, Tailor, King, Tsar, Tsarevich, Prince, Shoemaker, Farmer, Peasant, Swineherd, Shepherd, Fishmonger, fisherman, Sportsman, Jumper, Runner, Swimmer, Diver, Submariner, Vagabond, Industrialist, Bourgeois, Equestrian, Supervisor, Horseman, Brewer, Racer, Horticulturist, Puppeteer, Artisan, Tracker, Chaser, Victim, Captain, Sailor, First Mate, Bosun, Admiral, General, Colonel, Major, Mayor, Sergeant, Private, Soldier Boy, Soldier, Combatant, Butcher, Carnivore, Gate Keeper, Ploughman, Chairman, Neighbor, Thief, Robber, Liar, Deceiver, Builder, Foreman, Scarecrow, Monster, Outsider, Raven, Bear, Moose, Stallion, Giraffe, Donkey, Elephant, Mammoth, Fox, Wolf, Lion, Tiger, Beaver, Asian, European, Indian, Cooper, Quarrymaster, Scabbler, Stone-gnawer, Miner, Mine Digger, Dowser, Careerist, Chimney-sweep, Troubadour, Cheat, Blacksmith, Farrier, Apprentice, Alchemist, Weaver, Tailor, Reaper, Dyer, Tiller, Vine-walker, Rope-walker, Wine-maker, Cupbearer, Taster, Moonshiner, Dunce, Sommelier, Commissar, Water Sprite, Cacodaemon, Coachman, Mechanic, Glassblower, Celebrity, Miller, Musician, Conductor, Poet, Bard, Simpleton, Storyteller, Juggler, Acrobat, Gymnast, Singer, Lion Tamer, Janitor, Stable Boy, Printer, Dude, Count, Baron, Operator, Spy, Scout, Geologist, Geographer, Analyst, Mathematician, Skeptic, Ideologist, Pragmatist, Paranoid, Mystic, Saint, Sinner, Warden, Socialite, Pauper, Merchant, Well-digger, Banker, Goldsmith, Stove-setter, Swordsman, Manufacturer, Mover, Kaiser, Grave-digger, Demon, Imp, Stud, Oil Tycoon, Driller, Chemist, Lyricist, Writer, Jester, Countryman, Foreigner, Outlander, Cheapskate, Hoarder, Deaf-mute, Corpse, Bath Attendant, Brownie, Hobgoblin, Guard, Guardsman, Publican, Groom, Horse-thief, Shooter, Archer, Pirate, Pilot, Jumper, Flyer, Actor, Aborigine, Water Carrier, Steward, Gardener, Surgeon, Charlatan, Jinn, Architect, Perfectionist, Prototype, Counselor, Adviser, Templar, Lector, Monk, Leader, Archeologist, Heretic, Adherent, Ambassador, Diplomat, Negotiator, Judge, Defender, Prosecutor, District Attorney, Tormenter, Convoy, Cannoneer, Burgomaster, Pretender, Maceman, Tanner, Slinger, Horseman, Militiaman, Guerilla, Archer, Lance Knight, Settler, Worker, Slave, Crossbowman, Rifleman, Axeman, Legionary, Knight, Man-at-arms, Samurai, Musketeer, Grenadier, Dragoon, Dragon, Guardsman, Oligarch, Halberdier, Cuirassier, Infantry, Submachine Gunner, Machine Gunner, Huntsman, Cavalryman, Field Engineer, Paratrooper, Sniper, Hunter, Maverick, Iceman, Inventor, Cartographer, Mentor, Ruffian, Bandit, Upstart, Pioneer, Prankster, Applicant, Darling, Friend, Comrade, Brother, Overlord, Sovereign, Commander, Archon, Tsar, Emperor, Battlemaster, Sage, Destroyer, Chieftain, Pharaoh, Highlander, Boyar, Senator, Prince, Tyrant, Satrap, Dictator, Reaper, Chancellor, Farmer, Priest, Primogenitor, Patriarch, Laborer, Hermit, Traveler, Seeker, Enchanter, Pilgrim, Truth-seeker, Acolyte, Henchman, Entrepreneur, Creator, Minstrel, Ghost, Soldier, Fighter, Advocate, Warrior, Gladiator, Caretaker, Enslaver, Savage, Barbarian, Tutor, Teacher, Abbot, Tapster, Majordomo, Pantocrator, Chief, Director, Treasurer, Battlemaster, Assistant, Herald, Beast, Wanderer, Protege, Viceroy, Witness, Executioner, Slayer, Don, Lord, Pastor, Devil, Assassin, Vagabond, Clairvoyant, Leader, Senior Citizen, Youth, Handyman, Apprentice, Master, Toiler, Lad, Bogatyr, Daredevil, Keeper, Pathfinder, Tempter, Adventurer, Savior, Troublemaker, Gentleman, Steward, Killer';
		} 
		else{
			var list1 = opt.f1||'Great, Kind, Bloody, Almighty, Unbeatable, Adamant, Defiant, Strongest, Evil, Enlightened, Important, Victorious, Divine, Secretive, Just, Imperturbable, Strict, Terrible, Courageous, Moon-faced, Mysterious, Plucky, Merciful, Belligerent, Honest, Enigmatic, Wise, Sly, Cunning, Avaricious, Sensible, Tireless, Insuperable, Fearless, Ruthless, Charming, Narcissistic, Peace-loving, Free, Energetic, Cheerful, Friendly, Meticulous, August, Mournful, Vigilant, Watchful, Trained, Wild, Sinful, Righteous, Dark, Black, Light, Pious, Incomparable, Noble, Dirty, Cruel, Long-armed, Long-legged, Eloquent, Sweet-lipped, Quiet, Noisy, Chip-toothed, Bright-eyed, Golden-haired, Red-haired, Beautiful, Horrible, Sinister, Fat, Thin, Aromatic, Snub-nosed, Nautical, Arctic, Desert, Steppe, Southern, Northern, Eastern, Western, Blossoming, Alluring, Beautiful, Effulgent, Chic, Patrician, Artistic, Elegant, Pleasant, Inimitable, Sweet, Tireless, Slender, Worthy, Bold, Impish, Jaunty, Glorious, Jovial, Modest, Blinding, Reckless, Enamored, Tantalizing, Sultry, Crafty, Successful, Vulnerable, Affectionate, Miraculous, Nonchalant, Proud, Romantic, Seductive, Superstitious, Alluring, Stunning, Resplendent, Cheerful, Explosive, Passionate, Wonderful, Sought-after, Habitual, Hardworking, Ambitious, Professional, Bohemian, Sincere, Honest, Flawless, Tactful, Cute, Sharp, Lively, Amiable, Pompous, Skillful, Divine, Astonishing, Splendid, Charismatic, Unusual, First-rate, Fashionable, Worldly, Noble, Spontaneous, Giggly, Fine, Great, Blessed, Captivating, Unforgettable, Ubiquitous, Inquisitive, Playful, Bouncy, Foolish, Distinguished, Famous, Sweet, Inspired, Businesslike, Energetic, Superb, Enthusiastic, Fabulous, Captivating, Resilient, Adorable, Entrancing, Impressive, Thrilling, Demanding, Infatuating, Wonderful, Daring, Experienced, Able, Sunny, Impetuous, Trembling, Decisive, Delightful, Incorruptible, Unapproachable, Ardent, Mocking, Stubborn, Courteous, Merry, Vivacious, Open, Kind, Sympathetic, Sensual, Wondrous, Breathtaking, Virginal, Plucky, Impetuous, Dulcet, Intoxicating, Tough, Attentive, Fateful, Attractive, Willful, Ostentatious, Breezy, Wise, Sobering, Sensitive, Pure, Luxurious, Radiant, Capable, Well-groomed, Gifted, Lucky, Diplomatic, Cordial, Magnificent, Confident, Tried-and-true, Extraordinary, Witty, Impressive, Intelligent, Enigmatic, Rebellious, Diligent, Exciting, Enthusiastic, Feminine, Dear, Refined, Understanding, Inspiring, Modest, Complex, Reliable, Amorous, Flippant, Deceitful, Generous, Lovely, Intriguing, Irresistible, Exquisite, Goal-oriented, Laid-back, Shrewd, Unrivaled, Inventive, Mischievous, Curious, Practical, Graceful, Luscious, Spunky, Careful, Ideal, Impossible, Impulsive, Frank, Exceptional, Sociable, Aromatic, Caring, Perfect, Shy, Faithful, Predictable, Solid, Rollicking, Excellent, Extravagant, Dreamy, Ironic, Remarkable, Incredible, Defiant, Quick-tempered, Good-natured, Merciful, Susceptible, Welcoming, Phenomenal, Wild, Young, Piquant, Mysterious, Impulsive, Comely, Impenetrable, Fascinating, Friendly, Feisty, Arcane, Unique, Cunning, Stately, Grand, Serious, Astute, Charitable, Unorthodox, Thrifty, Fickle, Selfish, Selfless, Eloquent, Conflicting, Forgiving, Benevolent, Tanned, Almighty, Intriguing, Trusting, Calm, Humane, Capricious, Authentic, Pragmatic, Beckoning, Exotic, Carefree, Clever, Regal, Neat, Magical, Delicate, Touching, Inconceivable, Nimble, Extraordinary, Smiling, Hospitable, Content, Naughty, Elusive, Fragile';
			var list2 = opt.f1||'Artist, Sculptor, Landlady, Student, Creator, Professor, Postgraduate, Treasurer, Leader, Battlemistress, Warmonger, Warrior, Librarian, Researcher, Disciple, Lab Technician, Test Subject, Researcher, Experimentalist, Doctor, Physician, Cook, Patient, Crash Test Dummy, Vanguard, Gatherer, Collector, Elder, Bride, Wench, Girl, Hussy, House Painter, Herbalist, Baker, Bread Maker, Florist, Confectioner, Dressmaker, Seamstress, Wet-nurse, Queen, Princess, Duchess, Empress, Shoemaker, Milkmaid, Peasant, Shepherdess, Fishwife, Athlete, Jumper, Runner, Swimmer, Diver, Submariner, Industrialist, Supervisor, Equestrian, Teamstress, Racer, Artisan, Victim, Captain, Admiral, General, Soldier, Maid, Carnivore, Gate Keeper, Chairwoman, Neighbor, Thief, Robber, Liar, Deceiver, Builder, Forewoman, Crow, She-bear, Deer, Mule, Elephant, Mammoth, Fox, Vixen, She-wolf, Lioness, Tigress, Beaver, Asian, European, Careerist, Traitor, Weaver, Dyer, Tiller, Secretary, Moonshiner, Commissar, Mermaid, Cabby, Improviser, Musician, Poetess, Storyteller, Acrobat, Gymnast, Singer, Lion Tamer, Cleaning Lady, Chambermaid, Publisher, Countess, Baroness, Operator, Spy, Scout, Saint, Sinner, Warden, Socialite, Pauper, Merchant, Banker, Swordswoman, Manufacturer, Grave-digger, Demoness, She-devil, Cutie, Charwoman, Jester, Countrywoman, Foreigner, Outlander, Bath Attendant, Wanderer, Horse-thief, Skirmisher, Archer, Pirate, Pilot, Jumper, Flyer, Actress, Aborigine, Housekeeper, Gardener, Charlatan, Architect, Perfectionist, Counselor, Adviser, Templar, Nun, Heretic, Messenger, Negotiator, Defender, Prosecutor, District Attorney, Tormenter, Usurer, Pretender, Macewoman, Tanner, Slinger, Horsewoman, Militiawoman, Guerilla, Archer, Lance Knight, Slave Girl, Pikewoman, Axewoman, Submachine Gunner, Machine Gunner, Tracker, Cavalrywoman, Field Engineer, Trooper, Sniper, Huntress, Exterminator, Inventor, Hellion, Bandit, Adventuress, Darling, Friend, Sister, Prankster, Ruler, Sovereign, Domina, Tsarina, Empress, Destroyer, Dowager, Princess, Priestess, Ancestor, Matriarch, Hermit, Traveler, Seeker, Enchantress, Acolyte, Accomplice, Creator, Mercenary, Advocate, Matron, Enslaver, Savage, Valkyrie, Amazon, Kyrie, Schoolmarm, Abbess, Manager, Battlemistress, Assistant, Goddess, Priestess, Destiny, Nymph, Muse, Fate, Nemesis, Vision, Herald, Protege, Vicereine, Maiden, Lady, Demon, She-devil, Seeress, Helper, Artisan, Mistress, Toiler, Madam, Keeper, Pathfinder, Temptress, Cat Burglar, Adventurer, Savior, Troublemaker, Rogue, Gentlewoman, Housekeeper, Sister';
		}
		
		list1 = list1.split(', ');
		
		var descr = list1[utils.random(list1.length)];
		
		if( !name ){
			list2 = list2.split(', ');
			
			name = list2[utils.random(list2.length)];
		}
		
		return descr + ' ' + name;
	},
	  
	isObjectsEqual: function(obj1, obj2){
		//if(!obj1 || !obj2) return false;
		if(typeof(obj1) != typeof(obj2)) return false;

		if(typeof(obj1) == 'object'){
			if(obj1.length != obj2.length) return false;
			for(var i in obj1){
				if(!utils.isObjectsEqual(obj1[i], obj2[i])) return false;
			}
			return true;
		}else{
			return obj1 == obj2
		}
	},
	
	getFullScreenDoc: function(){
		try{
			return window.top.document;
		}
		catch(e){
			return window.document;
		}
	},
	
	isFullScreenAvail: function(){
		var doc = this.getFullScreenDoc();
		
		return	doc.fullscreenEnabled ||
				doc.webkitFullscreenEnabled ||
				doc.mozFullscreenEnabled ||
				doc.msFullScreenEnabled;
	},
	
	isFullScreen: function(){
		var doc = this.getFullScreenDoc();
		
		return !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullScreenElement);
	},
	
	setFullScreen: function(el){
		if( !utils.isFullScreenAvail() )
			return;
		
		el = el ? $(el).get(0) : this.getFullScreenDoc().documentElement;
		
		var requestFullscreen = el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen||el.msRequestFullscreen,
			callback = function(){
                notifMgr.runEvent(Notif.ids.sysFullScreen, true);
			};
		
		if( !requestFullscreen )
			return;
		
		var promise = requestFullscreen.call(el);

		if( promise )
			promise.then(callback);
		else
			callback();
	},
	
	unsetFullScreen: function(){
		var doc = this.getFullScreenDoc();
		
		var exitFullscreen = doc.exitFullscreen|| doc.webkitExitFullscreen || doc.webkitCancelFullScreen || doc.mozCancelFullScreen || doc.msExitFullscreen,
			callback = function(){
                notifMgr.runEvent(Notif.ids.sysFullScreen, false);
			};
		
		if( !exitFullscreen )
			return;
		
		var promise = exitFullscreen.call(doc);
		
		if( promise )
			promise.then(callback);
		else
			callback();
	},
	
	ifUndf: function(val, undfVal){
		return typeof(val) == 'undefined'? undfVal: val;
	},

	//проверка, было ли совершено нажатие по селектору или внутри него (для предотвращения ненужных нажатий)
	checkClick: function(event, selector){
		return $(event.target).is(selector) || $(event.target).parents(selector).length;
	},
	
	isTouchDevice: function() {
		return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
	},
	
	isMobileDevice: function() {  
		return false;
	},
	
	
	//проверяем длину строки
	//предел - [min, max], либо max, либо min, max
	checkLimits: function(name, limits){
		if (typeof (arguments[1]) == 'object')
			limits = arguments[1];
		else if (arguments[2] != undefined)
			limits = [arguments[1], arguments[2]];
		else
			limits = [0, arguments[1]];
		
	    name = name||'';
		
	    return name.length >= limits[0] && name.length <= limits[1];
	}
};

// Проверка input'a на ввод целого числа 
utils.checkInputInt = function(el, opt){
	opt = opt||{};

	var $el = $(el),
		val = $el.val(),
		originLength = val.length,
		sign = val[0] == '-' ? '-' : '',
		valChecked = sign + utils.toInt(val.replace(/[^\d]/gi, "")),
		valid = true; // Валидация изменения значения в инпуте. Если значение валидно (не вставлялись буквеннык символы, левые знаки и т.п.) не производим ручную вставку в инпут ($el.val(val)), дабы не сбрасывать положение каретки

	if( opt.normalizeBase ){
		el = $el.get(0);

		var startCaretPos = el.selectionStart, 
			endCaretPos = el.selectionEnd;

		valid = false;
	}

	// Если были вырезаны неподходящие символы 
	if( val.length != valChecked.length )
		valid = false;

	val = +valChecked;

	if( opt.max !== undefined && val > opt.max ){
		val = utils.toInt(opt.max);

		valid = false;
	}
	else if( opt.min !== undefined && val <= opt.min ){
		val = utils.checkInputInt.checkMin($el, val, opt);
		
		valid = false;
	}

	if( opt.normalizeBase ){
		if( val < opt.normalizeBase )
			val *= opt.normalizeBase;
		else if( val%opt.normalizeBase )
			val = Math.round(val / opt.normalizeBase) * opt.normalizeBase;

		if( opt.max !== undefined && val > opt.max )
			val -= opt.normalizeBase;
	}
	
	val = '' + val;
	
	if( !valid ){
		$el.val(val);

		if( opt.normalizeBase ){
			el.selectionStart = startCaretPos - (originLength - val.length);
			el.selectionEnd = endCaretPos - (originLength - val.length);

			// Величина смещения каретки соответствующая разряду opt.normalizeBase 
			var moveCarriageBase = val.length - (('' + opt.normalizeBase).length - 1);
			el.selectionStart -= Math.max(el.selectionStart - moveCarriageBase, 0);
			el.selectionEnd -= Math.max(el.selectionEnd - moveCarriageBase, 0);				
		}
		else if( opt.minValSelectedRange ){
			var el = $(el).get(0);
			
			if (el.setSelectionRange) { 
				if( opt.manualInput )
					el.focus(); 
				el.setSelectionRange(opt.minValSelectedRange.start, opt.minValSelectedRange.end);
			} /* WebKit */ 
			else if (el.createTextRange) { var range = el.createTextRange(); range.collapse(true); range.moveEnd('character', opt.minValSelectedRange.end); range.moveStart('character', opt.minValSelectedRange.start); range.select(); } /* IE */
			else if (el.selectionStart) { el.selectionStart = opt.minValSelectedRange.start; el.selectionEnd = opt.minValSelectedRange.end; }

			$el.data('lengthwas', opt.minValSelectedRange.start);
			
			$el.off('focusout', '.minval').one('focusout.minval', function(){
				$(this).data('lengthwas', 0);
			});
			
			delete opt.minValSelectedRange; // Присваевается в функции utils.checkInputInt.checkMin
		}
	}
	
	return val;
};

utils.checkInputInt.checkMin = function($el, val, opt){
	var valStr = '' + val,
		minValStr = '' + opt.min,
		minValSelectedRange = false,
		lengthWas = $el.data('lengthwas')||0;
	
	// Если введенное значение меньше минимального, дополняем его до минимально возможного и выделяем дополненную часть для возможности дальнейшего ввода
	// Корректировка происходит только при ручном вводе (opt.manualInput==true)
	if( opt.manualInput && opt.min > 0 && val && valStr.length > lengthWas ){
		if( valStr[0] < minValStr[0] ){
			var zeroCount = minValStr.length - valStr.length + 1;

			for(var i = 0; i < zeroCount; i++)
				valStr += '0';

			minValSelectedRange = {start: valStr.length-zeroCount, end: valStr.length};
		}
		else if( valStr[0] > minValStr[0] ){
			var zeroCount = minValStr.length - valStr.length;

			for(var i = 0; i < zeroCount; i++)
				valStr += '0';

			minValSelectedRange = {start: valStr.length-zeroCount, end: valStr.length};
		}
		else{
			var startSelect = false;

			valStr = valStr.split('');
			minValStr = minValStr.split('');

			for(var i in minValStr){
				if( valStr[i] === undefined ){
					valStr[i] = minValStr[i];

					if( !startSelect )
						startSelect = i;
				}
				else if( +i && minValStr[i-1] == valStr[i-1] && minValStr[i] > valStr[i] )
					valStr[i] = minValStr[i];
			}

			valStr = valStr.join('');

			if( startSelect )
				minValSelectedRange = {start: startSelect, end: valStr.length};
		}
		
		val = +valStr;
		
		if( opt.max !== undefined && val > opt.max ){
			val = utils.toInt(opt.max);
			
			minValSelectedRange = false;
		}
	}
	else if( val < opt.min ){
		val = opt.min;
		
		if( opt.min > 0 && valStr )
			minValSelectedRange = {start: 0, end: (''+val).length};
		
		$el.data('lengthwas', 0);
	}
	
	if( opt.noZero && !val )
		val = '';
	else if( minValSelectedRange )
		opt.minValSelectedRange = minValSelectedRange;
	
	return val;
};

// Проверка input'a на ввод дробного числа
utils.checkInputFloat = function(el, maxVal, minVal, fixed){
	var $el = $(el),
		val = $el.val(),
		sign = val[0] == '-' ? '-' : '',
		valChecked = val.replace(/[^\d.,]/gi, ''),
		dec, // Дробная часть
		valid = true; // Валидация изменения значения в инпуте. Если значение валидно (не вставлялись буквеннык символы, левые знаки и т.п.) не производим ручную вставку в инпут ($el.val(val)), дабы не сбрасывать положение каретки

	if( valChecked === '' )
		return;

	valChecked = sign + valChecked;

	// Если были вырезаны неподходящие символы
	if( val.length != valChecked.length )
		valid = false;

	// Eсли перед запятой нет цифры 
	val = valChecked.split('.');

	if( val.length == 2 && !val[0] ){
		valChecked = '0' + valChecked;

		valid = false;
	}

	// Ограничиваем максимально возможное количество символов после запятой
	// Если дробная часть отсутствует подставляем .0 (для FF)
	if( fixed ){
		dec = valChecked.split('.')[1]||'';

		if( dec.length > fixed ){
			dec = '0.' + dec||'0';

			var prevDec = $(el).data('prevVal');
			prevDec =  prevDec === undefined ? ($(el).attr('value')||'') : prevDec;
			prevDec = '0.' + prevDec.split('.')[1]||'0';

			var decFixed = dec.split('.')[1].split('');

			var diff = dec - prevDec;
			if( diff >= 0 && diff < (1/Math.pow(10, fixed)) )
				decFixed.splice(-2, 1);
			else
				decFixed.splice(-1);

			decFixed = decFixed.join('');

			valChecked = valChecked.split('.')[0] + '.' + decFixed;

			valid = false;
		}

		dec = false; // Т.к. может использоваться дальше в коде

		$el.data('prevVal', valChecked);
	}

	val = +valChecked;

	// Если цифровое значение 0, но в дробной части также есть нули
	if( !val ){
		dec = valChecked.split('.')[1];

		if( dec ){
			dec = '.' + dec;

			valid = false;
		}
	}

	if( maxVal !== undefined && val > maxVal ){
		val = utils.toInt(maxVal);

		valid = false;
	}
	else if( minVal !== undefined && val && val <= minVal ){
		val = minVal;

		valid = false;
	}

	val = val + (dec||'');

	if( !valid )
		$el.val(val);
};

utils.getInputTextRange = function(el){
    if( el instanceof jQuery )
        el = el.get(0);
	
    if( !el )
        return {start: 0, end: 0};
    
    if( typeof(el.selectionStart) == 'number' )
        return {start: el.selectionStart, end: el.selectionEnd};
    else
        return {start: (el.value||'').length, end: (el.value||'').length};
};

utils.setInputTextRange = function(el, textRange){
    var $el = el;
    
    if( el instanceof jQuery )
        el = el.get(0);
	
    if( !el )
       return $el; 
    
    if( typeof(textRange) == 'string' ){
        if( textRange == 'start' )
            textRange = {start: 0, end: 0};
        else if( textRange == 'end' )
            textRange = {start: (el.value||'').length, end: (el.value||'').length};
    }
    
    if( !textRange )
        textRange = {start: 0, end: 0};
    
    if( el.setSelectionRange )
        el.setSelectionRange(textRange.start, textRange.end);
    else if( typeof(el.selectionStart) == 'number' ){
        el.selectionStart = textRange.start;
        el.selectionEnd = textRange.end;
    }
    else if( el.createTextRange ){ 
        var range = el.createTextRange(); 
            range.collapse(true);
            range.moveEnd('character', textRange.end); 
            range.moveStart('character', textRange.start); 
            range.select();
    } /* IE */
    
    return $el;
};


var invwk = (function() {
  var max = Math.pow(2, 32),
	  seed;
  return {
	setSeed : function(val) {
	  seed = val/* || Math.round(Math.random() * max)*/;
	},
	getSeed : function() {
	  return seed;
	},
	rand : function() {
	  // creates randomness...somehow...
	  seed += (seed * seed) | 5;
	  // Shift off bits, discarding the sign. Discarding the sign is
	  // important because OR w/ 5 can give us + or - numbers.
	  return (seed >>> 32) / max;
	}
  };
}());

/*Однократный запуск чего либо в один и тот же момент времени*/
runOnce = {
	runned : {},//ключ - имя функции, значение - сколько запусков было в фоне
	run : function(func){
		var count = this.runned[func];
		if (typeof(count) != 'undefined'){
			this.runned[func] ++;
			return false;
		}else{
			this.runned[func] = 0;
			return true;
		}
	},
	over : function(func){
		var count = this.runned[func];
		delete this.runned[func];
		
		return count;
	}
};

// Проверка, есть ли локальное хранилище 
function isLSAvail() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}
// Проверка, есть ли локальное хранилище 
function isSSAvail() {
	try{
		return 'sessionStorage' in window && window['sessionStorage'] !== null;
	} catch (e) {
		return false;
	}
}
// Подготовка данных для алерта
function prepareAlert(alerts, resp){
	//получаем код или имя ошибки
	if(isNaN(resp.error)){
		var errName = resp.error;
	}else{
		var errCode = resp.error;
		var errName = utils.cnstName(ErrorX.ids, resp.error);
	}
	
	var text = alerts[(alerts instanceof Array) ? errCode: errName];
	text = text || (tmplMgr?tmplMgr.alert.def(resp.error):'');
	if(typeof(resp.data) != 'undefined'){
		var tmpl = doT.template(text);
		return tmpl(resp);
	} else {
		return text;
	}
}